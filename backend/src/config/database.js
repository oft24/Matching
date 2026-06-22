import { prisma, isDatabaseConfigured } from './prisma.js';

export async function connectDatabase() {
  if (!isDatabaseConfigured()) {
    console.warn('⚠ DATABASE_URL no configurada — auth no funcionará');
    return false;
  }

  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    const count = await prisma.user.count();
    console.log(`✓ Base de datos conectada (tabla User: ${count} usuarios)`);
    return true;
  } catch (err) {
    console.error('✗ Error conectando a la base de datos:', err.message);
    return false;
  }
}

export async function checkDatabaseHealth() {
  if (!isDatabaseConfigured()) {
    return { ok: false, error: 'DATABASE_URL no configurada' };
  }
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
