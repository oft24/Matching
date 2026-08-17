import { prisma } from '../config/prisma.js';

const DISCORD_API = 'https://discord.com/api/v10';
const DEFAULT_TTL_HOURS = 12;
const MAX_TTL_HOURS = 24 * 7;
const REQUEST_TIMEOUT_MS = 4000;
const CLEANUP_INTERVAL_MS = 60 * 1000;

let lastCleanupAt = 0;

function record(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function ttlHours() {
  const configured = Number(process.env.DISCORD_CHANNEL_TTL_HOURS || DEFAULT_TTL_HOURS);
  if (!Number.isFinite(configured)) return DEFAULT_TTL_HOURS;
  return Math.min(MAX_TTL_HOURS, Math.max(1, Math.round(configured)));
}

function discordErrorMessage(payload, status) {
  if (payload && typeof payload === 'object' && 'message' in payload) return String(payload.message);
  return `Discord respondio con ${status}`;
}

async function discordRequest(path, init = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${DISCORD_API}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      },
    });
    const payload = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok && response.status !== 404) {
      throw new Error(discordErrorMessage(payload, response.status));
    }
    return { ok: response.ok, status: response.status, payload };
  } finally {
    clearTimeout(timer);
  }
}

export function isDiscordVoiceConfigured() {
  return Boolean(process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_GUILD_ID);
}

export function getDiscordChannelMetadata(match) {
  const metadata = record(record(match?.filters).discord);
  if (!metadata.channelId) return null;
  return {
    channelId: String(metadata.channelId),
    expiresAt: metadata.expiresAt ? String(metadata.expiresAt) : null,
  };
}

export function setDiscordChannelMetadata(filters, metadata) {
  return { ...record(filters), discord: metadata };
}

export async function deleteDiscordChannel(channelId) {
  if (!isDiscordVoiceConfigured() || !channelId) return false;
  const response = await discordRequest(`/channels/${channelId}`, {
    method: 'DELETE',
    headers: { 'X-Audit-Log-Reason': 'Matching temporary voice channel expired' },
  });
  return response.ok || response.status === 404;
}

export async function provisionDiscordChannel(match) {
  if (!isDiscordVoiceConfigured()) return null;

  const hours = ttlHours();
  const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
  let channelId = null;

  try {
    const channelResponse = await discordRequest(`/guilds/${process.env.DISCORD_GUILD_ID}/channels`, {
      method: 'POST',
      headers: { 'X-Audit-Log-Reason': `Matching voice channel for ${match.id}` },
      body: JSON.stringify({
        name: `matching-${match.id.slice(-8).toLowerCase()}`,
        type: 2,
        user_limit: 2,
        ...(process.env.DISCORD_CATEGORY_ID ? { parent_id: process.env.DISCORD_CATEGORY_ID } : {}),
      }),
    });
    channelId = channelResponse.payload?.id;
    if (!channelId) throw new Error('Discord no devolvio el canal creado');

    const inviteResponse = await discordRequest(`/channels/${channelId}/invites`, {
      method: 'POST',
      headers: { 'X-Audit-Log-Reason': `Matching invite for ${match.id}` },
      body: JSON.stringify({
        max_age: hours * 60 * 60,
        max_uses: 2,
        temporary: true,
        unique: true,
      }),
    });
    const inviteCode = inviteResponse.payload?.code;
    if (!inviteCode) throw new Error('Discord no devolvio la invitacion creada');

    return {
      channelId: String(channelId),
      inviteUrl: `https://discord.gg/${inviteCode}`,
      expiresAt: expiresAt.toISOString(),
    };
  } catch (error) {
    console.error('Discord channel provisioning error:', error.message);
    if (channelId) {
      await deleteDiscordChannel(channelId).catch((cleanupError) => {
        console.error('Discord orphan channel cleanup error:', cleanupError.message);
      });
    }
    return null;
  }
}

export async function cleanupExpiredDiscordChannels({ force = false } = {}) {
  if (!isDiscordVoiceConfigured()) return { checked: 0, deleted: 0 };
  const now = Date.now();
  if (!force && now - lastCleanupAt < CLEANUP_INTERVAL_MS) return { checked: 0, deleted: 0 };
  lastCleanupAt = now;

  const matches = await prisma.liveMatch.findMany({
    where: {
      discordInviteUrl: { not: null },
      status: { in: ['accepted', 'closed', 'expired', 'rejected'] },
    },
    select: { id: true, filters: true },
    orderBy: { updatedAt: 'asc' },
    take: 100,
  });

  let deleted = 0;
  for (const match of matches) {
    const metadata = getDiscordChannelMetadata(match);
    if (!metadata?.expiresAt || new Date(metadata.expiresAt).getTime() > now) continue;
    try {
      const removed = await deleteDiscordChannel(metadata.channelId);
      if (!removed) continue;
      await prisma.liveMatch.update({
        where: { id: match.id },
        data: {
          discordInviteUrl: null,
          filters: setDiscordChannelMetadata(match.filters, null),
        },
      });
      deleted += 1;
    } catch (error) {
      console.error(`Discord cleanup error for match ${match.id}:`, error.message);
    }
  }

  return { checked: matches.length, deleted };
}
