import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { getLeagueProfile, RiotApiError } from '../services/riotService.js';

const router = Router();
router.use(requireAuth);

const connectionSelect = {
  provider: true, connected: true, riotGameName: true, riotTagLine: true,
  riotRegion: true, riotPuuid: true, discordUsername: true, metadata: true,
};

function profile(user, relationship = null) {
  const riot = user.connections?.find((item) => item.provider === 'riot' && item.connected);
  const discord = user.connections?.find((item) => item.provider === 'discord' && item.connected);
  const isFriend = relationship?.status === 'accepted';
  return {
    id: user.id,
    username: user.username,
    avatar: user.avatar ?? `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(user.username)}`,
    level: user.level,
    gender: user.gender,
    isFriend,
    requestStatus: relationship?.status === 'pending'
      ? (relationship.requestedById === user.id ? 'received' : 'sent')
      : isFriend ? 'accepted' : 'none',
    riot: riot ? { gameName: riot.riotGameName, tagLine: riot.riotTagLine, region: riot.riotRegion, topChampion: riot.metadata?.topChampion ?? null } : null,
    discord: isFriend && discord ? { username: discord.discordUsername } : null,
  };
}

function pair(a, b) {
  return a < b ? { userId: a, friendId: b } : { userId: b, friendId: a };
}

async function acceptedFriendship(currentUserId, friendId) {
  const friendship = await prisma.friendship.findUnique({
    where: { userId_friendId: pair(currentUserId, friendId) },
  });
  return friendship?.status === 'accepted' ? friendship : null;
}

async function ratingSummary(ratedId, raterId) {
  const [aggregate, mine] = await Promise.all([
    prisma.userRating.aggregate({
      where: { ratedId },
      _avg: { score: true },
      _count: { score: true },
    }),
    prisma.userRating.findUnique({
      where: { raterId_ratedId: { raterId, ratedId } },
      select: { score: true },
    }),
  ]);
  return {
    average: Number((aggregate._avg.score ?? 0).toFixed(1)),
    count: aggregate._count.score,
    myRating: mine?.score ?? null,
  };
}

function otherUser(row, currentUserId) {
  return row.userId === currentUserId ? row.friend : row.user;
}

const includeUsers = {
  user: { include: { connections: { select: connectionSelect } } },
  friend: { include: { connections: { select: connectionSelect } } },
};

router.get('/', async (req, res) => {
  const rows = await prisma.friendship.findMany({
    where: { OR: [{ userId: req.user.id }, { friendId: req.user.id }] },
    include: includeUsers,
    orderBy: { createdAt: 'desc' },
  });
  const friends = [];
  const incoming = [];
  const outgoing = [];
  for (const row of rows) {
    const item = profile(otherUser(row, req.user.id), row);
    if (row.status === 'accepted') friends.push(item);
    else if (row.requestedById === req.user.id) outgoing.push(item);
    else incoming.push(item);
  }
  res.json({ friends, incoming, outgoing });
});

router.get('/search', async (req, res) => {
  const q = String(req.query.q ?? '').trim();
  if (q.length < 2) return res.json({ results: [] });
  const [users, friendships] = await Promise.all([
    prisma.user.findMany({
      where: { id: { not: req.user.id }, username: { contains: q, mode: 'insensitive' } },
      include: { connections: { select: connectionSelect } }, take: 12, orderBy: { username: 'asc' },
    }),
    prisma.friendship.findMany({ where: { OR: [{ userId: req.user.id }, { friendId: req.user.id }] } }),
  ]);
  const relationships = new Map(friendships.map((row) => [row.userId === req.user.id ? row.friendId : row.userId, row]));
  res.json({ results: users.map((user) => profile(user, relationships.get(user.id))) });
});

router.post('/:userId', async (req, res) => {
  if (req.params.userId === req.user.id) return res.status(400).json({ error: 'No puedes enviarte una solicitud' });
  const target = await prisma.user.findUnique({ where: { id: req.params.userId }, include: { connections: { select: connectionSelect } } });
  if (!target) return res.status(404).json({ error: 'Jugador no encontrado' });
  const ids = pair(req.user.id, target.id);
  const existing = await prisma.friendship.findUnique({ where: { userId_friendId: ids } });
  if (existing?.status === 'accepted') return res.status(409).json({ error: 'Ya son amigos' });
  if (existing?.status === 'pending') return res.status(409).json({ error: 'Ya existe una solicitud pendiente' });
  const request = await prisma.friendship.create({ data: { ...ids, requestedById: req.user.id, status: 'pending' } });
  res.status(201).json({ request: profile(target, request) });
});

router.post('/:userId/accept', async (req, res) => {
  const ids = pair(req.user.id, req.params.userId);
  const request = await prisma.friendship.findUnique({ where: { userId_friendId: ids } });
  if (!request || request.status !== 'pending') return res.status(404).json({ error: 'Solicitud no encontrada' });
  if (request.requestedById === req.user.id) return res.status(403).json({ error: 'No puedes aceptar tu propia solicitud' });
  const updated = await prisma.friendship.update({ where: { userId_friendId: ids }, data: { status: 'accepted', acceptedAt: new Date() } });
  const friend = await prisma.user.findUnique({ where: { id: req.params.userId }, include: { connections: { select: connectionSelect } } });
  res.json({ friend: profile(friend, updated) });
});

router.delete('/:userId', async (req, res) => {
  await prisma.friendship.deleteMany({ where: pair(req.user.id, req.params.userId) });
  res.status(204).end();
});

router.get('/:userId/dashboard', async (req, res) => {
  const friendship = await acceptedFriendship(req.user.id, req.params.userId);
  if (!friendship) return res.status(403).json({ error: 'Este jugador no está en tus amigos' });

  const queue = req.query.queue === 'flex' ? 'flex' : 'solo';
  const connection = await prisma.userConnection.findUnique({
    where: { userId_provider: { userId: req.params.userId, provider: 'riot' } },
  });
  if (!connection?.connected || !connection.riotPuuid || !connection.riotRegion) {
    return res.status(400).json({ error: 'Este amigo todavía no conectó su cuenta de Riot' });
  }

  try {
    const league = await getLeagueProfile(connection.riotPuuid, connection.riotRegion, queue);
    return res.json({
      dashboard: {
        stats: { ranked: league.ranked, recent: league.recent },
        matchHistory: league.matches,
        message: league.matches.length ? 'Datos actualizados desde Riot Games' : 'No hay partidas recientes en esta cola',
      },
    });
  } catch (error) {
    if (error instanceof RiotApiError) return res.status(error.status).json({ error: error.message });
    throw error;
  }
});

router.put('/:userId/rating', async (req, res) => {
  const score = Number(req.body?.score);
  if (!Number.isInteger(score) || score < 1 || score > 5) {
    return res.status(400).json({ error: 'La calificación debe ser de 1 a 5 estrellas' });
  }
  const friendship = await acceptedFriendship(req.user.id, req.params.userId);
  if (!friendship) return res.status(403).json({ error: 'Solo puedes calificar a tus amigos' });

  await prisma.userRating.upsert({
    where: { raterId_ratedId: { raterId: req.user.id, ratedId: req.params.userId } },
    update: { score },
    create: { raterId: req.user.id, ratedId: req.params.userId, score },
  });
  res.json({ rating: await ratingSummary(req.params.userId, req.user.id) });
});

router.get('/:userId', async (req, res) => {
  const friendship = await acceptedFriendship(req.user.id, req.params.userId);
  if (!friendship) return res.status(403).json({ error: 'Este jugador no está en tus amigos' });
  const [user, rating] = await Promise.all([
    prisma.user.findUnique({ where: { id: req.params.userId }, include: { connections: { select: connectionSelect } } }),
    ratingSummary(req.params.userId, req.user.id),
  ]);
  if (!user) return res.status(404).json({ error: 'Jugador no encontrado' });
  res.json({ profile: profile(user, friendship), rating });
});

export default router;
