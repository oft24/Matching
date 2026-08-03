import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.put('/me/profile', requireAuth, async (req, res) => {
  const gender = req.body.gender || null;
  if (gender && !['man', 'woman', 'other'].includes(gender)) return res.status(400).json({ error: 'Género no válido' });
  const user = await prisma.user.update({
    where: { id: req.user.id }, data: { gender },
    select: { id: true, username: true, email: true, avatar: true, gender: true, level: true, xp: true },
  });
  res.json({ user });
});

export default router;
