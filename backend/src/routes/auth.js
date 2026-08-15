import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma, isDatabaseConfigured } from '../config/prisma.js';
import { signToken } from '../utils/tokens.js';
import { requireAuth } from '../middleware/auth.js';
import { isMailConfigured, sendVerificationCode } from '../services/mailService.js';
import { consumeCode, issueCode, VerificationError } from '../services/verificationService.js';

const router = Router();

const USER_FIELDS = {
  id: true,
  username: true,
  email: true,
  avatar: true,
  gender: true,
  level: true,
  xp: true,
};

function dbNotReady(_req, res) {
  return res.status(503).json({
    error: 'Base de datos no configurada',
    hint: 'Configura DATABASE_URL en backend/.env (ver README — Neon gratis)',
  });
}

function normalizeEmail(email) {
  return String(email ?? '').trim().toLowerCase();
}

/**
 * Genera y envía un código. Devuelve qué contarle al cliente.
 * Sin RESEND_API_KEY el código va a la consola; fuera de producción también se
 * devuelve al frontend para poder probar el flujo sin correo real.
 */
async function deliverCode(user) {
  const { code, expiresInMinutes } = await issueCode(user.id);

  let delivered = false;
  try {
    ({ delivered } = await sendVerificationCode(user.email, code, { username: user.username }));
  } catch (err) {
    // El código ya está guardado: si falla el proveedor de correo se avisa y se
    // deja reintentar, en vez de tumbar un registro que sí se creó.
    console.error('Envío de código fallido:', err.message);
  }

  return {
    requiresVerification: true,
    email: user.email,
    emailDelivered: delivered,
    expiresInMinutes,
    ...(delivered || process.env.NODE_ENV === 'production' ? {} : { devCode: code }),
  };
}

function handleAuthError(err, res, context) {
  if (err instanceof VerificationError) {
    return res.status(err.status).json({ error: err.message, retryAfter: err.retryAfter });
  }
  // P2002: dos registros simultáneos con el mismo email o usuario.
  if (err?.code === 'P2002') {
    return res.status(409).json({ error: 'El usuario o email ya está registrado' });
  }
  console.error(`${context} error:`, err);
  return res.status(500).json({ error: `Error al ${context}` });
}

router.post('/register', async (req, res) => {
  if (!isDatabaseConfigured()) return dbNotReady(req, res);

  const { username, email, password } = req.body;
  const cleanEmail = normalizeEmail(email);
  const cleanUsername = String(username ?? '').trim();

  if (!cleanUsername || !cleanEmail || !password) {
    return res.status(400).json({ error: 'Usuario, email y contraseña son obligatorios' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }

  try {
    const byEmail = await prisma.user.findUnique({ where: { email: cleanEmail } });

    if (byEmail?.emailVerified) {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    const byUsername = await prisma.user.findUnique({ where: { username: cleanUsername } });
    if (byUsername && byUsername.id !== byEmail?.id) {
      return res.status(409).json({ error: 'Ese nombre de usuario ya está en uso' });
    }

    const hash = await bcrypt.hash(password, 10);

    // Registro sin confirmar: se puede reintentar con datos nuevos en vez de
    // quedar bloqueado por un email que nunca llegó a activarse.
    const user = byEmail
      ? await prisma.user.update({
          where: { id: byEmail.id },
          data: { username: cleanUsername, password: hash },
          select: USER_FIELDS,
        })
      : await prisma.user.create({
          data: {
            username: cleanUsername,
            email: cleanEmail,
            password: hash,
            // Sin icono: la interfaz muestra iniciales hasta que se conecte Riot o se elija uno.
            avatar: null,
          },
          select: USER_FIELDS,
        });

    return res.status(201).json(await deliverCode(user));
  } catch (err) {
    return handleAuthError(err, res, 'registrar usuario');
  }
});

router.post('/verify-email', async (req, res) => {
  if (!isDatabaseConfigured()) return dbNotReady(req, res);

  const { email, code } = req.body;
  const cleanEmail = normalizeEmail(email);

  if (!cleanEmail || !code) {
    return res.status(400).json({ error: 'Email y código son obligatorios' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (!user) {
      return res.status(404).json({ error: 'No existe ninguna cuenta con ese correo' });
    }
    if (user.emailVerified) {
      return res.status(409).json({ error: 'Esta cuenta ya está verificada. Inicia sesión.' });
    }

    await consumeCode(user.id, code);

    const verified = await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
      select: USER_FIELDS,
    });

    return res.json({ user: verified, token: signToken({ userId: verified.id }) });
  } catch (err) {
    return handleAuthError(err, res, 'verificar el código');
  }
});

router.post('/resend-code', async (req, res) => {
  if (!isDatabaseConfigured()) return dbNotReady(req, res);

  const cleanEmail = normalizeEmail(req.body?.email);
  if (!cleanEmail) {
    return res.status(400).json({ error: 'El email es obligatorio' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      select: { ...USER_FIELDS, emailVerified: true },
    });
    if (!user) {
      return res.status(404).json({ error: 'No existe ninguna cuenta con ese correo' });
    }
    if (user.emailVerified) {
      return res.status(409).json({ error: 'Esta cuenta ya está verificada. Inicia sesión.' });
    }

    return res.json(await deliverCode(user));
  } catch (err) {
    return handleAuthError(err, res, 'reenviar el código');
  }
});

router.post('/login', async (req, res) => {
  if (!isDatabaseConfigured()) return dbNotReady(req, res);

  const { email, password } = req.body;
  const cleanEmail = normalizeEmail(email);

  if (!cleanEmail || !password) {
    return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    if (!user.emailVerified) {
      // La contraseña es correcta, solo falta confirmar el correo: se manda un
      // código nuevo salvo que el anterior siga en periodo de espera.
      let payload = { requiresVerification: true, email: user.email, emailDelivered: false };
      try {
        payload = await deliverCode(user);
      } catch (err) {
        if (!(err instanceof VerificationError)) throw err;
      }
      return res.status(403).json({
        error: 'Tu cuenta aún no está verificada. Revisa el código que enviamos a tu correo.',
        ...payload,
      });
    }

    const safeUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      gender: user.gender,
      level: user.level,
      xp: user.xp,
    };

    return res.json({ user: safeUser, token: signToken({ userId: user.id }) });
  } catch (err) {
    return handleAuthError(err, res, 'iniciar sesión');
  }
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

router.get('/config', (_req, res) => {
  res.json({ database: isDatabaseConfigured(), mail: isMailConfigured() });
});

router.post('/logout', (_req, res) => {
  res.json({ message: 'Sesión cerrada' });
});

export default router;
