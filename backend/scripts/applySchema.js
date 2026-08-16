import { spawnSync } from 'child_process';
import { readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

/**
 * Aplica las migraciones pendientes durante el build del despliegue.
 *
 * Vercel solo corría `prisma generate`, así que cada cambio de esquema llegaba
 * a producción con la base sin actualizar y tumbaba la API. Las migraciones de
 * esta carpeta son idempotentes, así que ejecutarlas en cada build es seguro.
 *
 * Sin URL de base de datos (por ejemplo en un preview sin configurar) no falla:
 * avisa y sigue, para no romper builds que de todos modos no tocan datos.
 */

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendDir = join(__dirname, '..');
const migrationsDir = join(backendDir, 'prisma', 'migrations');

// Solo las migraciones escritas para poder repetirse. Las anteriores ya están
// aplicadas en producción y no son idempotentes: volver a lanzarlas fallaría.
const REPEATABLE = [
  '20260815000000_email_verification',
  '20260815120000_google_signin',
];

// directUrl evita el pooler: el DDL a través de pgbouncer no es fiable.
const url = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!url) {
  console.warn('⚠ Sin DIRECT_URL ni DATABASE_URL — se omite la aplicación del esquema');
  process.exit(0);
}

const available = new Set(readdirSync(migrationsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name));

for (const name of REPEATABLE) {
  if (!available.has(name)) {
    console.error(`✗ Migración declarada pero ausente: ${name}`);
    process.exit(1);
  }

  console.log(`Aplicando ${name}…`);
  const result = spawnSync(
    'npx',
    [
      'prisma',
      'db',
      'execute',
      '--schema',
      join(backendDir, 'prisma', 'schema.prisma'),
      '--file',
      join(migrationsDir, name, 'migration.sql'),
    ],
    {
      cwd: backendDir,
      stdio: 'inherit',
      shell: process.platform === 'win32',
      // La URL viaja por el entorno del hijo, no por argv: así no queda
      // expuesta en la lista de procesos ni en los logs del build. Se fijan
      // las dos porque el schema declara url y directUrl, y Prisma falla al
      // cargarlo si alguna de las dos variables no existe.
      env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url },
    },
  );

  if (result.status !== 0) {
    console.error(`✗ Falló la migración ${name}`);
    process.exit(result.status ?? 1);
  }
}

console.log('✓ Esquema al día');
