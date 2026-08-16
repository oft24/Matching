import { Router } from 'express';
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
 * existe se enlaza la cuenta en lugar de crear una nueva, para que nadie
 * pierda su perfil, sus amigos ni su historial al cambiar de método.
 */
router.post('/google', async (req, res) => {
  if (!isDatabaseConfigured()) return dbNotReady(req, res);

  try {
    const profile = await verifyGoogleToken(req.body?.credential);

    const existing = await prisma.user.findFirst({
      where: { OR: [{ googleId: profile.googleId }, { email: profile.email }] },
      select: { id: true, avatar: true, googleId: true },
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

    return res.json({ user, token: signToken({ userId: user.id }), isNew: !existing });
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
