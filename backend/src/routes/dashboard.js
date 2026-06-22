import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const riotConn = await prisma.userConnection.findUnique({
    where: { userId_provider: { userId: req.user.id, provider: 'riot' } },
  });

  res.json({
    level: req.user.level,
    xp: req.user.xp,
    xpToNext: 100,
    riotConnected: riotConn?.connected ?? false,
    riotAccount: riotConn?.connected
      ? { gameName: riotConn.riotGameName, tagLine: riotConn.riotTagLine, region: riotConn.riotRegion }
      : null,
    stats: null,
    matchHistory: [],
    message: riotConn?.connected
      ? 'Dashboard listo para integrar Riot API.'
      : 'Conecta tu cuenta Riot en Mi Perfil para ver estadísticas.',
  });
});

export default router;
