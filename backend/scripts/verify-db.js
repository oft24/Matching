import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('Verificando conexión a Neon PostgreSQL...');

  await prisma.$connect();
  await prisma.$queryRaw`SELECT 1`;

  const tables = await prisma.$queryRaw`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'User'
  `;

  if (!Array.isArray(tables) || tables.length === 0) {
    console.error('✗ Tabla User no encontrada. Ejecuta: npx prisma db push');
    process.exit(1);
  }

  const userCount = await prisma.user.count();
  console.log('✓ Conexión OK');
  console.log(`✓ Tabla User existe (${userCount} usuarios registrados)`);
}

main()
  .catch((err) => {
    console.error('✗ Error:', err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
