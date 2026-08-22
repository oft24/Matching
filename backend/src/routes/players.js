import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { getProfileIconOptions } from '../services/riotService.js';
import { isAllowedAvatar } from '../utils/avatarValidation.js';

const router = Router();

const USER_FIELDS = { id: true, username: true, email: true, avatar: true, gender: true, level: true, xp: true };

/** Catálogo de iconos disponibles para el selector de foto de perfil. */
router.get('/avatar-options', requireAuth, async (req, res) => {
  try {
    const options = await getProfileIconOptions();
    const riot = await prisma.userConnection.findFirst({
      where: { userId: req.user.id, provider: 'riot', connected: true },
      select: { metadata: true, riotGameName: true, riotTagLine: true },
    });
    const riotIconUrl = riot?.metadata?.profileIconUrl ?? null;
    res.json({
      ...options,
      riot: riotIconUrl ? { url: riotIconUrl, label: `${riot.riotGameName}#${riot.riotTagLine}` } : null,
    });
  } catch (error) {
    console.error('Avatar options error:', error);
    res.status(502).json({ error: 'No se pudo cargar el catálogo de iconos' });
  }
});

router.put('/me/profile', requireAuth, async (req, res) => {
  const gender = req.body.gender || null;
  if (gender && !['man', 'woman', 'other'].includes(gender)) return res.status(400).json({ error: 'Género no válido' });

  const data = { gender };

  // `avatar` sólo se toca si viene en el cuerpo: null limpia el icono y vuelve a las iniciales.
  if ('avatar' in req.body) {
    const avatar = req.body.avatar;
    if (avatar === null || avatar === '') {
      data.avatar = null;
    } else if (typeof avatar === 'string' && isAllowedAvatar(avatar)) {
      data.avatar = avatar;
    } else {
      return res.status(400).json({ error: 'Icono de perfil no válido' });
    }
  }

  const user = await prisma.user.update({ where: { id: req.user.id }, data, select: USER_FIELDS });
  res.json({ user });
});

export default router;
