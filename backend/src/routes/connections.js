import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { resolveRiotAccount, getLeagueIdentity, RiotApiError } from '../services/riotService.js';
import jwt from 'jsonwebtoken';
import { createHash, randomBytes } from 'node:crypto';
import { addDiscordGuildMember, isDiscordVoiceConfigured } from '../services/discordService.js';

const router = Router();
const DISCORD_PKCE_COOKIE = 'q2play_discord_pkce';

function discordRedirectUri(req) {
  return process.env.DISCORD_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/connections/discord/callback`;
}

function cookieValue(req, name) {
  const source = String(req.headers.cookie ?? '');
  const item = source.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : null;
}

function secureRequest(req) {
  return req.secure || req.headers['x-forwarded-proto'] === 'https';
}

function pkceChallenge(verifier) {
  return createHash('sha256').update(verifier).digest('base64url');
}

function clearPkceCookie(req, res) {
  res.clearCookie(DISCORD_PKCE_COOKIE, {
    httpOnly: true,
    sameSite: 'lax',
    secure: secureRequest(req),
    path: '/api/connections/discord/callback',
  });
}

router.get('/discord/callback', async (req, res) => {
  try {
    const payload = jwt.verify(String(req.query.state), process.env.JWT_SECRET || 'dev-secret-change-me');
    if (payload.purpose !== 'discord-oauth') throw new Error('Invalid Discord OAuth state');
    const codeVerifier = cookieValue(req, DISCORD_PKCE_COOKIE);
    if (!codeVerifier) throw new Error('Discord PKCE verifier is missing or expired');
    const body = new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID,
      grant_type: 'authorization_code',
      code: String(req.query.code),
      redirect_uri: discordRedirectUri(req),
      code_verifier: codeVerifier,
    });
    const tokenResponse = await fetch('https://discord.com/api/v10/oauth2/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
    if (!tokenResponse.ok) throw new Error('Discord token exchange failed');
    const token = await tokenResponse.json();
    const discordUser = await fetch('https://discord.com/api/v10/users/@me', { headers: { Authorization: `Bearer ${token.access_token}` } }).then((response) => response.json());
    if (!discordUser?.id) throw new Error('Discord user lookup failed');
    const joinedGuild = isDiscordVoiceConfigured()
      ? await addDiscordGuildMember(discordUser.id, token.access_token)
      : false;
    await prisma.userConnection.upsert({
      where: { userId_provider: { userId: payload.userId, provider: 'discord' } },
      create: { userId: payload.userId, provider: 'discord', discordUsername: discordUser.global_name || discordUser.username, discordUserId: discordUser.id, connected: true, metadata: { oauth: true, guildMember: joinedGuild, configuredAt: new Date().toISOString() } },
      update: { discordUsername: discordUser.global_name || discordUser.username, discordUserId: discordUser.id, connected: true, metadata: { oauth: true, guildMember: joinedGuild, configuredAt: new Date().toISOString() } },
    });
    clearPkceCookie(req, res);
    res.redirect(`${process.env.APP_URL || 'https://q2play.vercel.app'}?discord=connected`);
  } catch (error) {
    console.error('Discord OAuth callback error:', error);
    clearPkceCookie(req, res);
    res.redirect(`${process.env.APP_URL || 'https://q2play.vercel.app'}?discord=error`);
  }
});

router.use(requireAuth);

router.get('/', async (req, res) => {
  const connections = await prisma.userConnection.findMany({
    where: { userId: req.user.id },
    select: { provider: true, connected: true, riotGameName: true, riotTagLine: true, riotRegion: true, discordUsername: true, metadata: true, updatedAt: true },
  });
  res.json({ connections, capabilities: { discordOauth: Boolean(process.env.DISCORD_CLIENT_ID), discordVoice: Boolean(process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_GUILD_ID) } });
});

router.get('/discord/oauth-url', (req, res) => {
  if (!process.env.DISCORD_CLIENT_ID) return res.status(503).json({ error: 'OAuth de Discord aún no está configurado' });
  const state = jwt.sign({ userId: req.user.id, purpose: 'discord-oauth' }, process.env.JWT_SECRET || 'dev-secret-change-me', { expiresIn: '10m' });
  const codeVerifier = randomBytes(48).toString('base64url');
  res.cookie(DISCORD_PKCE_COOKIE, codeVerifier, {
    httpOnly: true,
    sameSite: 'lax',
    secure: secureRequest(req),
    maxAge: 10 * 60 * 1000,
    path: '/api/connections/discord/callback',
  });
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    response_type: 'code',
    redirect_uri: discordRedirectUri(req),
    scope: 'identify guilds.join',
    state,
    prompt: 'consent',
    code_challenge: pkceChallenge(codeVerifier),
    code_challenge_method: 'S256',
  });
  res.json({ url: `https://discord.com/oauth2/authorize?${params}` });
});

router.put('/riot', async (req, res) => {
  const { gameName, tagLine, region, game = 'lol' } = req.body;
  if (!gameName?.trim() || !tagLine?.trim() || !region?.trim()) {
    return res.status(400).json({ error: 'Riot ID (nombre#tag) y región son obligatorios' });
  }
  try {
    const account = await resolveRiotAccount(gameName.trim(), tagLine.trim(), region.trim());
    const identity = game === 'lol' ? await getLeagueIdentity(account.puuid, region.trim()) : null;
    const metadata = { verifiedAt: new Date().toISOString(), activeGame: game, ...(identity ?? {}) };
    const connection = await prisma.userConnection.upsert({
      where: { userId_provider: { userId: req.user.id, provider: 'riot' } },
      create: { userId: req.user.id, provider: 'riot', riotGameName: account.gameName, riotTagLine: account.tagLine, riotRegion: region.trim(), riotPuuid: account.puuid, connected: true, metadata },
      update: { riotGameName: account.gameName, riotTagLine: account.tagLine, riotRegion: region.trim(), riotPuuid: account.puuid, accessToken: null, connected: true, metadata },
      select: { provider: true, connected: true, riotGameName: true, riotTagLine: true, riotRegion: true, metadata: true },
    });
    const user = identity
      ? await prisma.user.update({
        where: { id: req.user.id }, data: { avatar: identity.profileIconUrl },
        select: { id: true, username: true, email: true, avatar: true, gender: true, level: true, xp: true },
      })
      : await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { id: true, username: true, email: true, avatar: true, gender: true, level: true, xp: true },
      });
    const message = game === 'valorant'
      ? 'Cuenta Riot verificada para Valorant. Podrás consultar colas, agentes y estadísticas desde el dashboard.'
      : `Cuenta Riot verificada. Icono y campeón principal (${identity?.topChampion?.name ?? 'sin datos'}) actualizados.`;
    res.json({ connection, user, message });
  } catch (error) {
    if (error instanceof RiotApiError) return res.status(error.status).json({ error: error.message });
    console.error('Riot connection error:', error);
    res.status(500).json({ error: 'No se pudo verificar la cuenta Riot' });
  }
});

router.put('/discord', async (req, res) => {
  const { username, userId } = req.body;
  if (!username?.trim()) return res.status(400).json({ error: 'Usuario de Discord es obligatorio' });
  const connection = await prisma.userConnection.upsert({
    where: { userId_provider: { userId: req.user.id, provider: 'discord' } },
    create: { userId: req.user.id, provider: 'discord', discordUsername: username.trim(), discordUserId: userId?.trim() || null, connected: true, metadata: { configuredAt: new Date().toISOString() } },
    update: { discordUsername: username.trim(), discordUserId: userId?.trim() || null, connected: true, metadata: { configuredAt: new Date().toISOString() } },
    select: { provider: true, connected: true, discordUsername: true },
  });
  res.json({ connection, message: 'Discord configurado para compartirlo después de hacer match.' });
});

router.delete('/:provider', async (req, res) => {
  if (!['riot', 'discord'].includes(req.params.provider)) return res.status(400).json({ error: 'Proveedor inválido' });
  await prisma.userConnection.deleteMany({ where: { userId: req.user.id, provider: req.params.provider } });
  res.json({ message: 'Conexión eliminada' });
});

export default router;
