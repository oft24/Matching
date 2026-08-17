import { prisma } from '../config/prisma.js';
import {
  cleanupExpiredDiscordChannels,
  deleteDiscordChannel,
  getDiscordChannelMetadata,
  provisionDiscordChannel,
  setDiscordChannelMetadata,
} from './discordService.js';

const MATCH_TTL_MS = 5 * 60 * 1000;

function publicUser(user, connections = [], includeDiscord = false) {
  const riot = connections.find((c) => c.provider === 'riot');
  const discord = connections.find((c) => c.provider === 'discord');
  return {
    id: user.id,
    username: user.username,
    avatar: user.avatar ?? `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.username}`,
    level: user.level,
    gender: user.gender,
    riot: riot?.connected
      ? { gameName: riot.riotGameName, tagLine: riot.riotTagLine, region: riot.riotRegion }
      : null,
    discord: includeDiscord && discord?.connected ? { username: discord.discordUsername, userId: discord.discordUserId } : null,
  };
}

function filtersCompatible(a, b) {
  if (a.game !== b.game) return false;
  if (a.region && b.region && a.region !== b.region) return false;
  if (a.preferredGender && a.preferredGender !== 'any' && a.preferredGender !== b.userGender) return false;
  if (b.preferredGender && b.preferredGender !== 'any' && b.preferredGender !== a.userGender) return false;
  return true;
}

function calcCompatibility(f1, f2) {
  let score = 70;
  if (f1.region === f2.region) score += 10;
  if (f1.language === f2.language) score += 8;
  if (f1.rank === f2.rank) score += 7;
  if (f1.playstyle === f2.playstyle) score += 5;
  return Math.min(99, score);
}

async function getUserWithConnections(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: { connections: true },
  });
}

async function tryMatch(userId, game, filters) {
  const candidates = await prisma.queueEntry.findMany({
    where: {
      status: 'searching',
      game,
      userId: { not: userId },
    },
    include: { user: { include: { connections: true } } },
    orderBy: { createdAt: 'asc' },
    take: 20,
  });

  for (const entry of candidates) {
    const theirFilters = entry.filters;
    if (!filtersCompatible(filters, theirFilters)) continue;

    const expiresAt = new Date(Date.now() + MATCH_TTL_MS);

    const match = await prisma.$transaction(async (tx) => {
      const existing = await tx.liveMatch.findFirst({
        where: {
          OR: [
            { status: 'pending', OR: [{ player1Id: userId }, { player2Id: userId }, { player1Id: entry.userId }, { player2Id: entry.userId }] },
            { status: 'accepted', OR: [
              { player1Id: userId, player2Id: entry.userId },
              { player1Id: entry.userId, player2Id: userId },
            ] },
          ],
        },
      });
      if (existing) return null;

      const m = await tx.liveMatch.create({
        data: {
          player1Id: userId,
          player2Id: entry.userId,
          game,
          filters: { player1: filters, player2: theirFilters },
          expiresAt,
        },
      });

      await tx.queueEntry.updateMany({
        where: { userId: { in: [userId, entry.userId] } },
        data: { status: 'matched' },
      });

      await tx.queueEntry.deleteMany({
        where: { userId: { in: [userId, entry.userId] } },
      });

      return m;
    });

    if (match) return match;
  }

  return null;
}

export async function joinQueue(userId, game, filters) {
  const activeMatch = await prisma.liveMatch.findFirst({
    where: { status: 'pending', OR: [{ player1Id: userId }, { player2Id: userId }] },
    orderBy: { createdAt: 'desc' },
  });
  if (activeMatch) return { searching: false, matchId: activeMatch.id, alreadyMatched: true };
  await leaveQueue(userId);

  await prisma.queueEntry.create({
    data: { userId, game, filters, status: 'searching' },
  });

  const match = await tryMatch(userId, game, filters);
  return { searching: !match, matchId: match?.id ?? null };
}

export async function leaveQueue(userId) {
  await prisma.queueEntry.deleteMany({ where: { userId } });
}

async function matchStatusPayload(userId, activeMatch) {
  const isPlayer1 = activeMatch.player1Id === userId;
  const opponentId = isPlayer1 ? activeMatch.player2Id : activeMatch.player1Id;
  const opponent = await getUserWithConnections(opponentId);
  const myFilters = activeMatch.filters?.[isPlayer1 ? 'player1' : 'player2'] ?? {};
  const theirFilters = activeMatch.filters?.[isPlayer1 ? 'player2' : 'player1'] ?? {};

  return {
    status: activeMatch.status,
    matchId: activeMatch.id,
    myAccepted: isPlayer1 ? activeMatch.player1Accepted : activeMatch.player2Accepted,
    opponentAccepted: isPlayer1 ? activeMatch.player2Accepted : activeMatch.player1Accepted,
    opponent: opponent ? publicUser(opponent, opponent.connections, activeMatch.status === 'accepted') : null,
    compatibility: calcCompatibility(myFilters, theirFilters),
    discordInviteUrl: activeMatch.discordInviteUrl,
    expiresAt: activeMatch.expiresAt,
  };
}

export async function getQueueStatus(userId) {
  const pendingMatch = await prisma.liveMatch.findFirst({
    where: {
      status: 'pending',
      expiresAt: { gt: new Date() },
      OR: [{ player1Id: userId }, { player2Id: userId }],
    },
    orderBy: { createdAt: 'desc' },
  });

  if (pendingMatch) return matchStatusPayload(userId, pendingMatch);

  const inQueue = await prisma.queueEntry.findUnique({ where: { userId } });
  if (inQueue?.status === 'searching') {
    return { status: 'searching' };
  }

  const acceptedMatch = await prisma.liveMatch.findFirst({
    where: {
      status: 'accepted',
      OR: [{ player1Id: userId }, { player2Id: userId }],
    },
    orderBy: { updatedAt: 'desc' },
  });
  if (acceptedMatch) return matchStatusPayload(userId, acceptedMatch);

  return { status: 'idle' };
}

async function returnPlayerToQueue(match, userId) {
  const isPlayer1 = match.player1Id === userId;
  const filters = match.filters?.[isPlayer1 ? 'player1' : 'player2'];
  if (!filters) return;

  await prisma.queueEntry.upsert({
    where: { userId },
    update: { game: match.game, filters, status: 'searching', createdAt: new Date() },
    create: { userId, game: match.game, filters, status: 'searching' },
  });
}

export async function respondToMatch(userId, matchId, action) {
  const match = await prisma.liveMatch.findUnique({ where: { id: matchId } });
  if (!match || match.status !== 'pending') {
    return { error: 'Partida no encontrada o expirada' };
  }
  if (match.expiresAt < new Date()) {
    await prisma.liveMatch.update({ where: { id: matchId }, data: { status: 'expired' } });
    return { error: 'La partida expiró' };
  }

  const isPlayer1 = match.player1Id === userId;
  const isPlayer2 = match.player2Id === userId;
  if (!isPlayer1 && !isPlayer2) return { error: 'No autorizado' };

  if (action === 'reject') {
    const updated = await prisma.liveMatch.update({
      where: { id: matchId },
      data: {
        status: 'rejected',
        ...(isPlayer1 ? { player1Rejected: true } : { player2Rejected: true }),
      },
    });
    const opponentId = isPlayer1 ? match.player2Id : match.player1Id;
    await returnPlayerToQueue(match, opponentId);
    return { status: updated.status };
  }

  if (action === 'accept') {
    const data = isPlayer1 ? { player1Accepted: true } : { player2Accepted: true };
    const updated = await prisma.liveMatch.update({
      where: { id: matchId },
      data,
    });

    if (!updated.player1Accepted || !updated.player2Accepted) {
      return { status: 'pending', waitingForOpponent: true };
    }

    // Solo una de las dos solicitudes reclama la provision de Discord. La otra
    // puede responder de inmediato y recibira la invitacion en el siguiente sondeo.
    const claim = await prisma.liveMatch.updateMany({
      where: { id: matchId, status: 'pending' },
      data: { status: 'accepted' },
    });
    if (!claim.count) {
      const final = await prisma.liveMatch.findUnique({ where: { id: matchId } });
      return { status: final?.status ?? 'accepted', discordInviteUrl: final?.discordInviteUrl ?? null };
    }

    const discord = await provisionDiscordChannel(updated);
    if (!discord) return { status: 'accepted', discordInviteUrl: null };

    const final = await prisma.liveMatch.update({
      where: { id: matchId },
      data: {
        discordInviteUrl: discord.inviteUrl,
        filters: setDiscordChannelMetadata(updated.filters, {
          channelId: discord.channelId,
          expiresAt: discord.expiresAt,
        }),
      },
    });
    return { status: 'accepted', discordInviteUrl: final.discordInviteUrl };
  }

  return { error: 'Acción inválida' };
}

export async function closeMatch(userId, matchId) {
  const match = await prisma.liveMatch.findFirst({
    where: { id: matchId, status: 'accepted', OR: [{ player1Id: userId }, { player2Id: userId }] },
  });
  if (!match) return { error: 'Match no disponible' };
  const metadata = getDiscordChannelMetadata(match);
  await prisma.$transaction([
    prisma.liveMatch.update({ where: { id: matchId }, data: { status: 'closed' } }),
    prisma.queueEntry.deleteMany({ where: { userId: { in: [match.player1Id, match.player2Id] } } }),
  ]);
  if (metadata?.channelId) {
    try {
      if (await deleteDiscordChannel(metadata.channelId)) {
        await prisma.liveMatch.update({
          where: { id: matchId },
          data: {
            discordInviteUrl: null,
            filters: setDiscordChannelMetadata(match.filters, null),
          },
        });
      }
    } catch (error) {
      // Conservamos los metadatos para que la limpieza posterior pueda reintentarlo.
      console.error(`Discord close cleanup error for match ${matchId}:`, error.message);
    }
  }
  return { status: 'closed' };
}

export async function getAcceptedChats(userId) {
  const matches = await prisma.liveMatch.findMany({
    where: { status: 'accepted', OR: [{ player1Id: userId }, { player2Id: userId }] },
    orderBy: { updatedAt: 'desc' },
    take: 5,
  });
  return Promise.all(matches.map((match) => matchStatusPayload(userId, match)));
}

export async function expireStaleMatches() {
  await prisma.liveMatch.updateMany({
    where: { status: 'pending', expiresAt: { lt: new Date() } },
    data: { status: 'expired' },
  });
  try {
    await cleanupExpiredDiscordChannels();
  } catch (error) {
    // Discord es complementario: su limpieza no puede tumbar el matchmaking.
    console.error('Discord scheduled cleanup error:', error.message);
  }
}
