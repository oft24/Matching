import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

const prisma = new PrismaClient();

// Debe coincidir con los modelos de prisma/schema.prisma.
const EXPECTED_TABLES = [
  'User',
  'VerificationCode',
  'UserConnection',
  'QueueEntry',
  'LiveMatch',
  'MatchMessage',
  'DirectMessage',
  'Friendship',
  'UserRating',
];

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('✗ DATABASE_URL no configurada. Pega tu connection string en backend/.env');
    process.exit(1);
  }

  console.log('Verificando conexión a PostgreSQL...');

  await prisma.$connect();
  await prisma.$queryRaw`SELECT 1`;
  console.log('✓ Conexión OK');

  const rows = await prisma.$queryRaw`
    SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
  `;
  const present = new Set(rows.map((r) => r.table_name));
  const missing = EXPECTED_TABLES.filter((t) => !present.has(t));

  for (const table of EXPECTED_TABLES) {
    console.log(`  ${present.has(table) ? '✓' : '✗'} ${table}`);
  }

  if (missing.length) {
    console.error(`\n✗ Faltan ${missing.length} tablas: ${missing.join(', ')}`);
    console.error('  Ejecuta: npm run db:setup');
    process.exit(1);
  }

  const [userCount, pendingCount, unverifiedCount] = await Promise.all([
    prisma.user.count(),
    prisma.verificationCode.count({ where: { consumedAt: null } }),
    prisma.user.count({ where: { emailVerified: null } }),
  ]);

  console.log(`\n✓ Las ${EXPECTED_TABLES.length} tablas existen`);
  console.log(`  Usuarios: ${userCount} (${unverifiedCount} sin verificar)`);
  console.log(`  Códigos de verificación pendientes: ${pendingCount}`);
}

main()
  .catch((err) => {
    console.error('✗ Error:', err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
