import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../config/prisma.js';
import { closeMatch, getAcceptedChats } from '../services/queueService.js';

const router = Router();
router.use(requireAuth);

async function availableMatch(matchId, userId, statuses = ['accepted']) {
  return prisma.liveMatch.findFirst({
    where: {
      id: matchId,
      status: { in: statuses },
      OR: [{ player1Id: userId }, { player2Id: userId }],
    },
  });
}

router.get('/:matchId/messages', async (req, res) => {
  const match = await availableMatch(req.params.matchId, req.user.id, ['accepted', 'closed']);
  if (!match) return res.status(403).json({ error: 'Match no disponible' });

  const messages = await prisma.matchMessage.findMany({
    where: { matchId: match.id },
    include: { sender: { select: { id: true, username: true } } },
    orderBy: { createdAt: 'asc' },
    take: 100,
  });
  res.json({ messages });
});

router.get('/active/chats', async (req, res) => {
  res.json({ chats: await getAcceptedChats(req.user.id) });
});

router.post('/:matchId/messages', async (req, res) => {
  const content = String(req.body.content ?? '').trim();
  if (!content || content.length > 500) {
    return res.status(400).json({ error: 'El mensaje debe tener entre 1 y 500 caracteres' });
  }

  const match = await availableMatch(req.params.matchId, req.user.id);
  if (!match) return res.status(403).json({ error: 'Match no disponible' });

  const message = await prisma.matchMessage.create({
    data: { matchId: match.id, senderId: req.user.id, content },
    include: { sender: { select: { id: true, username: true } } },
  });
  res.status(201).json({ message });
});

router.post('/:matchId/close', async (req, res) => {
  const result = await closeMatch(req.user.id, req.params.matchId);
  if (result.error) return res.status(404).json(result);
  res.json(result);
});

export default router;
