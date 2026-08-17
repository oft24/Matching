import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma, isDatabaseConfigured } from '../config/prisma.js';
import { signToken } from '../utils/tokens.js';
import { requireAuth } from '../middleware/auth.js';
import {
  GoogleAuthError,
  googleClientId,
  isGoogleConfigured,
  verifyGoogleToken,
} from '../services/googleAuth.js';

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

function session(user) {
  return { user, token: signToken({ userId: user.id }) };
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
    const byEmail = await prisma.user.findUnique({
      where: { email: cleanEmail },
      select: { id: true, password: true },
    });

    if (byEmail) {
      // Cuenta creada con Google: no está "ocupada" de forma útil para quien
      // la reclama, así que se le dice por dónde entrar en vez de un 409 seco.
      return res.status(409).json({
        error: byEmail.password
          ? 'El email ya está registrado'
          : 'Esa cuenta se creó con Google. Entra con el botón de Google.',
      });
    }

    const byUsername = await prisma.user.findUnique({
      where: { username: cleanUsername },
      select: { id: true },
    });
    if (byUsername) {
      return res.status(409).json({ error: 'Ese nombre de usuario ya está en uso' });
    }

    const user = await prisma.user.create({
      data: {
        username: cleanUsername,
        email: cleanEmail,
        password: await bcrypt.hash(password, 10),
        // Sin icono: la interfaz muestra iniciales hasta que se conecte Riot o se elija uno.
        avatar: null,
      },
      select: USER_FIELDS,
    });

    return res.status(201).json(session(user));
  } catch (err) {
    // P2002: dos registros simultáneos con el mismo email o usuario.
    if (err?.code === 'P2002') {
      return res.status(409).json({ error: 'El usuario o email ya está registrado' });
    }
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Error al registrar usuario' });
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

    // Cuenta de Google: no hay hash contra el que comparar. Se distingue del
    // fallo de credenciales porque el usuario no tiene forma de adivinarlo.
    if (user && !user.password) {
      return res.status(409).json({
        error: 'Esta cuenta entra con Google. Usa el botón «Continuar con Google».',
      });
    }

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    return res.json(session({
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      gender: user.gender,
      level: user.level,
      xp: user.xp,
    }));
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

/** Nombre de usuario a partir del perfil de Google, sin acentos ni símbolos. */
function baseUsername(name, email) {
  const source = name || email.split('@')[0] || '';
  // NFD separa la tilde de su letra y el filtro siguiente se lleva la marca
  // suelta, así que "Iván" acaba en "Ivan" sin listar rangos Unicode.
  const clean = source
    .normalize('NFD')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .slice(0, 20);
  return clean || 'jugador';
}

/** El nombre de usuario es único, así que hay que resolver las colisiones. */
async function availableUsername(base) {
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}${attempt + 1}`;
    const taken = await prisma.user.findUnique({
      where: { username: candidate },
      select: { id: true },
    });
    if (!taken) return candidate;
  }
  // Con 25 homónimos, desempatar por azar sale más barato que seguir contando.
  return `${base}${Date.now().toString(36).slice(-5)}`;
}

/**
 * Entrar con Google. Es a la vez registro e inicio de sesión: si el correo ya
 * existe se enlaza la cuenta en lugar de crear una nueva, para que quien se
 * registró con contraseña pueda cambiar de método sin perder nada.
 */
router.post('/google', async (req, res) => {
  if (!isDatabaseConfigured()) return dbNotReady(req, res);

  try {
    const profile = await verifyGoogleToken(req.body?.credential);

    const existing = await prisma.user.findFirst({
      where: { OR: [{ googleId: profile.googleId }, { email: profile.email }] },
      select: { id: true, avatar: true },
    });

    const user = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: {
            googleId: profile.googleId,
            emailVerified: new Date(),
            // El avatar de Google solo rellena el hueco: si el usuario ya
            // eligió uno o conectó Riot, se respeta su elección.
            ...(existing.avatar ? {} : { avatar: profile.picture }),
          },
          select: USER_FIELDS,
        })
      : await prisma.user.create({
          data: {
            username: await availableUsername(baseUsername(profile.name, profile.email)),
            email: profile.email,
            googleId: profile.googleId,
            avatar: profile.picture,
            emailVerified: new Date(),
          },
          select: USER_FIELDS,
        });

    return res.json({ ...session(user), isNew: !existing });
  } catch (err) {
    if (err instanceof GoogleAuthError) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error('Google sign-in error:', err);
    return res.status(500).json({ error: 'Error al iniciar sesión con Google' });
  }
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

/** El frontend lee de aquí el client id, así no hace falta compilarlo dentro. */
router.get('/config', (_req, res) => {
  res.json({
    database: isDatabaseConfigured(),
    google: isGoogleConfigured(),
    googleClientId: googleClientId(),
  });
});

router.post('/logout', (_req, res) => {
  res.json({ message: 'Sesión cerrada' });
});

export default router;
