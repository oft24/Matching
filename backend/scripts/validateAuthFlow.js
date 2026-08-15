import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

// El script necesita leer el código para poder verificarlo. Sin RESEND_API_KEY
// el backend lo devuelve en `devCode` en vez de mandarlo por correo, así que la
// validación no depende de tener el envío configurado ni gasta correos reales.
delete process.env.RESEND_API_KEY;

const { default: app } = await import('../src/app.js');
const { prisma } = await import('../src/config/prisma.js');

const stamp = Date.now();
const email = `_auth_${stamp}@test.invalid`;
const username = `_auth_${stamp}`;
const password = 'secreto123';

let server;
let passed = 0;

function assert(condition, message) {
  if (!condition) throw new Error(message);
  passed += 1;
  console.log(`  ✓ ${message}`);
}

try {
  if (!process.env.DATABASE_URL) {
    console.error('✗ DATABASE_URL no configurada en backend/.env');
    process.exit(1);
  }

  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/auth`;

  const post = async (path, body) => {
    const res = await fetch(`${base}/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return { status: res.status, body: await res.json() };
  };

  console.log('\n1. Registro');
  const registered = await post('register', { username, email, password });
  assert(registered.status === 201, 'El registro responde 201');
  assert(registered.body.requiresVerification === true, 'El registro pide verificación');
  assert(!registered.body.token, 'El registro NO entrega token todavía');
  assert(/^\d{6}$/.test(registered.body.devCode ?? ''), 'Se generó un código de 6 dígitos');
  const code = registered.body.devCode;

  const stored = await prisma.user.findUnique({ where: { email }, select: { emailVerified: true } });
  assert(stored?.emailVerified === null, 'El usuario queda sin verificar en la base de datos');

  console.log('\n2. Login antes de verificar');
  const early = await post('login', { email, password });
  assert(early.status === 403, 'El login de una cuenta sin verificar responde 403');
  assert(early.body.requiresVerification === true, 'El login sin verificar devuelve el reto de verificación');

  console.log('\n3. Protección del código');
  const cooldown = await post('resend-code', { email });
  assert(cooldown.status === 429, 'Reenviar antes de tiempo responde 429');
  assert(cooldown.body.retryAfter > 0, 'La respuesta 429 indica cuántos segundos faltan');

  const wrong = await post('verify-email', { email, code: code === '000000' ? '111111' : '000000' });
  assert(wrong.status === 400, 'Un código incorrecto responde 400');
  assert(/quedan/i.test(wrong.body.error), 'El error avisa cuántos intentos quedan');

  const badPassword = await post('login', { email, password: 'otra-clave' });
  assert(badPassword.status === 401, 'Una contraseña incorrecta responde 401 sin filtrar el estado de la cuenta');

  console.log('\n4. Verificación');
  const verified = await post('verify-email', { email, code });
  assert(verified.status === 200, 'El código correcto responde 200');
  assert(Boolean(verified.body.token), 'La verificación entrega el token de sesión');
  assert(verified.body.user?.email === email, 'La verificación devuelve el usuario');

  const afterVerify = await prisma.user.findUnique({ where: { email }, select: { emailVerified: true } });
  assert(afterVerify?.emailVerified instanceof Date, 'emailVerified queda registrado en la base de datos');

  const reused = await post('verify-email', { email, code });
  assert(reused.status === 409, 'El código no se puede reutilizar tras verificar');

  console.log('\n5. Login verificado');
  const loggedIn = await post('login', { email, password });
  assert(loggedIn.status === 200, 'El login de una cuenta verificada responde 200');
  assert(Boolean(loggedIn.body.token), 'El login entrega token');

  const duplicate = await post('register', { username: `${username}_dup`, email, password });
  assert(duplicate.status === 409, 'No se puede registrar dos veces un email ya verificado');

  console.log(`\n✓ Flujo de autenticación validado — ${passed} comprobaciones OK\n`);
} catch (err) {
  console.error(`\n✗ ${err.message}\n`);
  process.exitCode = 1;
} finally {
  await prisma.user.deleteMany({ where: { email: { startsWith: '_auth_' } } });
  await prisma.$disconnect();
  server?.close();
}
