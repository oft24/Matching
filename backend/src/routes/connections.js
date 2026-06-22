import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', async (req, res) => {
  const connections = await prisma.userConnection.findMany({
    where: { userId: req.user.id },
    select: {
      provider: true,
      connected: true,
      riotGameName: true,
      riotTagLine: true,
      riotRegion: true,
      discordUsername: true,
      updatedAt: true,
    },
  });
  res.json({ connections });
});

router.put('/riot', async (req, res) => {
  const { gameName, tagLine, region, apiKey } = req.body;
  if (!gameName?.trim() || !tagLine?.trim() || !region?.trim()) {
    return res.status(400).json({ error: 'Riot ID (nombre#tag) y región son obligatorios' });
  }

  const connection = await prisma.userConnection.upsert({
    where: { userId_provider: { userId: req.user.id, provider: 'riot' } },
    create: {
      userId: req.user.id,
      provider: 'riot',
      riotGameName: gameName.trim(),
      riotTagLine: tagLine.trim(),
      riotRegion: region.trim(),
      accessToken: apiKey?.trim() || null,
      connected: true,
      metadata: { configuredAt: new Date().toISOString() },
    },
    update: {
      riotGameName: gameName.trim(),
      riotTagLine: tagLine.trim(),
      riotRegion: region.trim(),
      accessToken: apiKey?.trim() || null,
      connected: true,
      metadata: { configuredAt: new Date().toISOString() },
    },
    select: {
      provider: true,
      connected: true,
      riotGameName: true,
      riotTagLine: true,
      riotRegion: true,
    },
  });

  res.json({ connection, message: 'Cuenta Riot configurada. Las estadísticas del dashboard se cargarán próximamente.' });
});

router.put('/discord', async (req, res) => {
  const { username, userId } = req.body;
  if (!username?.trim()) {
    return res.status(400).json({ error: 'Usuario de Discord es obligatorio' });
  }

  const connection = await prisma.userConnection.upsert({
    where: { userId_provider: { userId: req.user.id, provider: 'discord' } },
    create: {
      userId: req.user.id,
      provider: 'discord',
      discordUsername: username.trim(),
      discordUserId: userId?.trim() || null,
      connected: true,
      metadata: { configuredAt: new Date().toISOString() },
    },
    update: {
      discordUsername: username.trim(),
      discordUserId: userId?.trim() || null,
      connected: true,
      metadata: { configuredAt: new Date().toISOString() },
    },
    select: {
      provider: true,
      connected: true,
      discordUsername: true,
    },
  });

  res.json({ connection, message: 'Discord configurado. Al aceptar un match se generará invitación al grupo.' });
});

router.delete('/:provider', async (req, res) => {
  const provider = req.params.provider;
  if (!['riot', 'discord'].includes(provider)) {
    return res.status(400).json({ error: 'Proveedor inválido' });
  }
  await prisma.userConnection.deleteMany({
    where: { userId: req.user.id, provider },
  });
  res.json({ message: 'Conexión eliminada' });
});

export default router;
