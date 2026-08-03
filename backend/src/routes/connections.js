import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { resolveRiotAccount, getLeagueIdentity, RiotApiError } from '../services/riotService.js';
import jwt from 'jsonwebtoken';

const router = Router();

function discordRedirectUri(req) {
  return process.env.DISCORD_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/connections/discord/callback`;
}

router.get('/discord/callback', async (req, res) => {
  try {
    const payload = jwt.verify(String(req.query.state), process.env.JWT_SECRET || 'dev-secret-change-me');
    const body = new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID,
      client_secret: process.env.DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: String(req.query.code),
      redirect_uri: discordRedirectUri(req),
    });
    const tokenResponse = await fetch('https://discord.com/api/v10/oauth2/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
    if (!tokenResponse.ok) throw new Error('Discord token exchange failed');
    const token = await tokenResponse.json();
    const discordUser = await fetch('https://discord.com/api/v10/users/@me', { headers: { Authorization: `Bearer ${token.access_token}` } }).then((response) => response.json());
    await prisma.userConnection.upsert({
      where: { userId_provider: { userId: payload.userId, provider: 'discord' } },
      create: { userId: payload.userId, provider: 'discord', discordUsername: discordUser.global_name || discordUser.username, discordUserId: discordUser.id, connected: true, metadata: { oauth: true, configuredAt: new Date().toISOString() } },
      update: { discordUsername: discordUser.global_name || discordUser.username, discordUserId: discordUser.id, connected: true, metadata: { oauth: true, configuredAt: new Date().toISOString() } },
    });
    res.redirect(`${process.env.APP_URL || 'https://matching-2.vercel.app'}?discord=connected`);
  } catch (error) {
    console.error('Discord OAuth callback error:', error);
    res.redirect(`${process.env.APP_URL || 'https://matching-2.vercel.app'}?discord=error`);
  }
});

router.use(requireAuth);

router.get('/', async (req, res) => {
  const connections = await prisma.userConnection.findMany({
    where: { userId: req.user.id },
    select: { provider: true, connected: true, riotGameName: true, riotTagLine: true, riotRegion: true, discordUsername: true, metadata: true, updatedAt: true },
  });
  res.json({ connections, capabilities: { discordOauth: Boolean(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET), discordVoice: Boolean(process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_GUILD_ID) } });
});

router.get('/discord/oauth-url', (req, res) => {
  if (!process.env.DISCORD_CLIENT_ID || !process.env.DISCORD_CLIENT_SECRET) return res.status(503).json({ error: 'OAuth de Discord aún no está configurado' });
  const state = jwt.sign({ userId: req.user.id, purpose: 'discord-oauth' }, process.env.JWT_SECRET || 'dev-secret-change-me', { expiresIn: '10m' });
  const params = new URLSearchParams({ client_id: process.env.DISCORD_CLIENT_ID, response_type: 'code', redirect_uri: discordRedirectUri(req), scope: 'identify', state, prompt: 'consent' });
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
