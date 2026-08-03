import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { getLeagueMatchDetail, getLeagueProfile, getLeaguePublicPlayer, getValorantProfile, RiotApiError } from '../services/riotService.js';

const router = Router();

async function riotConnection(userId) {
  return prisma.userConnection.findUnique({ where: { userId_provider: { userId, provider: 'riot' } } });
}

router.get('/matches/:matchId', requireAuth, async (req, res) => {
  const connection = await riotConnection(req.user.id);
  if (!connection?.riotPuuid) return res.status(400).json({ error: 'Conecta tu Riot ID primero' });
  try {
    const match = await getLeagueMatchDetail(req.params.matchId, connection.riotPuuid, connection.riotRegion);
    res.json({ match });
  } catch (error) {
    if (error instanceof RiotApiError) return res.status(error.status).json({ error: error.message });
    res.status(500).json({ error: 'No se pudo cargar el detalle de la partida' });
  }
});

router.get('/players/:puuid', requireAuth, async (req, res) => {
  const connection = await riotConnection(req.user.id);
  if (!connection?.connected) return res.status(400).json({ error: 'Conecta tu Riot ID primero' });
  const queue = req.query.queue === 'flex' ? 'flex' : 'solo';
  try {
    const player = await getLeaguePublicPlayer(req.params.puuid, connection.riotRegion, queue);
    res.json({ player });
  } catch (error) {
    if (error instanceof RiotApiError) return res.status(error.status).json({ error: error.message });
    res.status(500).json({ error: 'No se pudo cargar el perfil del jugador' });
  }
});

router.get('/', requireAuth, async (req, res) => {
  const game = req.query.game === 'valorant' ? 'valorant' : 'lol';
  const queue = req.query.queue === 'flex' ? 'flex' : 'solo';
  const riotConn = await riotConnection(req.user.id);

  let riotData = null;
  let message = riotConn?.connected
    ? 'Vuelve a verificar tu Riot ID para habilitar el historial.'
    : 'Conecta tu cuenta Riot en Mi Perfil para ver estadísticas.';

  if (riotConn?.connected && riotConn.riotPuuid) {
    try {
      riotData = game === 'valorant'
        ? await getValorantProfile(riotConn.riotPuuid, riotConn.riotRegion)
        : await getLeagueProfile(riotConn.riotPuuid, riotConn.riotRegion, queue);
      message = 'Datos actualizados directamente desde Riot Games.';
    } catch (error) {
      message = error instanceof RiotApiError ? error.message : 'No fue posible actualizar Riot Games.';
    }
  }

  res.json({
    level: req.user.level,
    game,
    queue,
    xp: req.user.xp,
    xpToNext: 100,
    riotConnected: riotConn?.connected ?? false,
    riotAccount: riotConn?.connected ? { gameName: riotConn.riotGameName, tagLine: riotConn.riotTagLine, region: riotConn.riotRegion } : null,
    stats: riotData ? { ranked: riotData.ranked, recent: riotData.recent } : null,
    matchHistory: riotData?.matches ?? [],
    message,
  });
});

export default router;
