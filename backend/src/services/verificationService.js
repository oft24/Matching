import { randomInt } from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma.js';

export const EMAIL_VERIFICATION = 'email_verification';

const CODE_LENGTH = 6;
const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutos
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000; // 1 minuto entre reenvíos

export class VerificationError extends Error {
  constructor(message, status = 400, extra = {}) {
    super(message);
    this.name = 'VerificationError';
    this.status = status;
    Object.assign(this, extra);
  }
}

function generateCode() {
  return String(randomInt(0, 10 ** CODE_LENGTH)).padStart(CODE_LENGTH, '0');
}

/**
 * Crea un código nuevo e invalida los anteriores del mismo propósito.
 * Devuelve el código en claro — solo para enviarlo por correo, nunca al cliente.
 */
export async function issueCode(userId, purpose = EMAIL_VERIFICATION) {
  const last = await prisma.verificationCode.findFirst({
    where: { userId, purpose, consumedAt: null },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });

  if (last) {
    const elapsed = Date.now() - last.createdAt.getTime();
    if (elapsed < RESEND_COOLDOWN_MS) {
      const retryAfter = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
      throw new VerificationError(
        `Espera ${retryAfter} segundos antes de pedir otro código`,
        429,
        { retryAfter },
      );
    }
  }

  const code = generateCode();
  const codeHash = await bcrypt.hash(code, 10);

  // Un solo código vivo por propósito: los pendientes quedan consumidos.
  await prisma.$transaction([
    prisma.verificationCode.updateMany({
      where: { userId, purpose, consumedAt: null },
      data: { consumedAt: new Date() },
    }),
    prisma.verificationCode.create({
      data: { userId, purpose, codeHash, expiresAt: new Date(Date.now() + CODE_TTL_MS) },
    }),
  ]);

  return { code, expiresInMinutes: CODE_TTL_MS / 60000 };
}

/**
 * Valida el código. Lanza VerificationError si no coincide, caducó o se
 * agotaron los intentos. En éxito lo marca como consumido.
 */
export async function consumeCode(userId, code, purpose = EMAIL_VERIFICATION) {
  const normalized = String(code ?? '').replace(/\D/g, '');
  if (normalized.length !== CODE_LENGTH) {
    throw new VerificationError(`El código debe tener ${CODE_LENGTH} dígitos`);
  }

  const record = await prisma.verificationCode.findFirst({
    where: { userId, purpose, consumedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  if (!record) {
    throw new VerificationError('No hay ningún código pendiente. Pide uno nuevo.', 410);
  }

  if (record.expiresAt.getTime() < Date.now()) {
    await prisma.verificationCode.update({
      where: { id: record.id },
      data: { consumedAt: new Date() },
    });
    throw new VerificationError('El código caducó. Pide uno nuevo.', 410);
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    await prisma.verificationCode.update({
      where: { id: record.id },
      data: { consumedAt: new Date() },
    });
    throw new VerificationError('Demasiados intentos fallidos. Pide un código nuevo.', 429);
  }

  if (!(await bcrypt.compare(normalized, record.codeHash))) {
    const updated = await prisma.verificationCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
      select: { attempts: true },
    });
    const left = MAX_ATTEMPTS - updated.attempts;
    throw new VerificationError(
      left > 0 ? `Código incorrecto. Te quedan ${left} intentos.` : 'Código incorrecto. Pide un código nuevo.',
      400,
      { attemptsLeft: Math.max(left, 0) },
    );
  }

  await prisma.verificationCode.update({
    where: { id: record.id },
    data: { consumedAt: new Date() },
  });
}
