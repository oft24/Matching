import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma, isDatabaseConfigured } from '../config/prisma.js';
import { signToken } from '../utils/tokens.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

function avatarUrl(username) {
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(username)}`;
}

function dbNotReady(_req, res) {
  return res.status(503).json({
    error: 'Base de datos no configurada',
    hint: 'Configura DATABASE_URL en backend/.env (ver README — Neon gratis)',
  });
}

router.post('/register', async (req, res) => {
  if (!isDatabaseConfigured()) return dbNotReady(req, res);

  const { username, email, password } = req.body;

  if (!username?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ error: 'Usuario, email y contraseña son obligatorios' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }

  try {
    const exists = await prisma.user.findFirst({
      where: { OR: [{ email: email.trim().toLowerCase() }, { username: username.trim() }] },
    });
    if (exists) {
      return res.status(409).json({ error: 'El usuario o email ya está registrado' });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password: hash,
        avatar: avatarUrl(username.trim()),
      },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        level: true,
        xp: true,
      },
    });

    const token = signToken({ userId: user.id });
    res.status(201).json({ user, token });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

router.post('/login', async (req, res) => {
  if (!isDatabaseConfigured()) return dbNotReady(req, res);

  const { email, password } = req.body;

  if (!email?.trim() || !password) {
    return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const safeUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar ?? avatarUrl(user.username),
      level: user.level,
      xp: user.xp,
    };

    const token = signToken({ userId: user.id });
    res.json({ user: safeUser, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

router.post('/logout', (_req, res) => {
  res.json({ message: 'Sesión cerrada' });
});

export default router;
