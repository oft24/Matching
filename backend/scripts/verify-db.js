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

  const [userCount, googleCount] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { googleId: { not: null } } }),
  ]);

  console.log(`\n✓ Las ${EXPECTED_TABLES.length} tablas existen`);
  console.log(`  Usuarios: ${userCount} (${googleCount} enlazados con Google)`);
}

main()
  .catch((err) => {
    console.error('✗ Error:', err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
