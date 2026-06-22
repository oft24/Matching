import { prisma } from '../config/prisma.js';

const MATCH_TTL_MS = 5 * 60 * 1000;

function publicUser(user, connections = []) {
  const riot = connections.find((c) => c.provider === 'riot');
  const discord = connections.find((c) => c.provider === 'discord');
  return {
    id: user.id,
    username: user.username,
    avatar: user.avatar ?? `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.username}`,
    level: user.level,
    riot: riot?.connected
      ? { gameName: riot.riotGameName, tagLine: riot.riotTagLine, region: riot.riotRegion }
      : null,
    discord: discord?.connected ? { username: discord.discordUsername } : null,
  };
}

function filtersCompatible(a, b) {
  if (a.game !== b.game) return false;
  if (a.region && b.region && a.region !== b.region) return false;
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
          status: 'pending',
          OR: [{ player1Id: userId }, { player2Id: userId }, { player1Id: entry.userId }, { player2Id: entry.userId }],
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

export async function getQueueStatus(userId) {
  const activeMatch = await prisma.liveMatch.findFirst({
    where: {
      status: { in: ['pending', 'accepted'] },
      OR: [{ player1Id: userId }, { player2Id: userId }],
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (activeMatch) {
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
      opponent: opponent ? publicUser(opponent, opponent.connections) : null,
      compatibility: calcCompatibility(myFilters, theirFilters),
      discordInviteUrl: activeMatch.discordInviteUrl,
      expiresAt: activeMatch.expiresAt,
    };
  }

  const inQueue = await prisma.queueEntry.findUnique({ where: { userId } });
  if (inQueue?.status === 'searching') {
    return { status: 'searching' };
  }

  return { status: 'idle' };
}

async function createDiscordInvite(match) {
  const guildId = process.env.DISCORD_GUILD_ID;
  const botToken = process.env.DISCORD_BOT_TOKEN;

  if (guildId && botToken) {
    try {
      const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
        method: 'POST',
        headers: {
          Authorization: `Bot ${botToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `squad-${match.id.slice(-6)}`,
          type: 2,
        }),
      });
      if (res.ok) {
        const channel = await res.json();
        const inviteRes = await fetch(`https://discord.com/api/v10/channels/${channel.id}/invites`, {
          method: 'POST',
          headers: {
            Authorization: `Bot ${botToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ max_age: 86400, max_uses: 2 }),
        });
        if (inviteRes.ok) {
          const invite = await inviteRes.json();
          return `https://discord.gg/${invite.code}`;
        }
      }
    } catch (err) {
      console.error('Discord API error:', err.message);
    }
  }

  return `https://discord.com/channels/@me?matching=${match.id}`;
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
    return { status: updated.status };
  }

  if (action === 'accept') {
    const data = isPlayer1 ? { player1Accepted: true } : { player2Accepted: true };
    const updated = await prisma.liveMatch.update({
      where: { id: matchId },
      data,
    });

    if (updated.player1Accepted && updated.player2Accepted) {
      const inviteUrl = await createDiscordInvite(updated);
      const final = await prisma.liveMatch.update({
        where: { id: matchId },
        data: { status: 'accepted', discordInviteUrl: inviteUrl },
      });
      return { status: 'accepted', discordInviteUrl: final.discordInviteUrl };
    }

    return { status: 'pending', waitingForOpponent: true };
  }

  return { error: 'Acción inválida' };
}

export async function expireStaleMatches() {
  await prisma.liveMatch.updateMany({
    where: { status: 'pending', expiresAt: { lt: new Date() } },
    data: { status: 'expired' },
  });
}
