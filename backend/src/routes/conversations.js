import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

function pair(a, b) {
  return a < b ? { userId: a, friendId: b } : { userId: b, friendId: a };
}

async function acceptedFriend(userId, friendId) {
  return prisma.friendship.findFirst({ where: { ...pair(userId, friendId), status: 'accepted' } });
}

const userSelect = { id: true, username: true, avatar: true, level: true };
function publicUser(user) {
  return { ...user, avatar: user.avatar ?? `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(user.username)}` };
}

router.get('/', async (req, res) => {
  const [matches, directMessages] = await Promise.all([
    prisma.liveMatch.findMany({
      where: {
        status: { in: ['accepted', 'closed'] },
        OR: [{ player1Id: req.user.id }, { player2Id: req.user.id }],
        messages: { some: {} },
      },
      include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
      orderBy: { updatedAt: 'desc' }, take: 30,
    }),
    prisma.directMessage.findMany({
      where: { OR: [{ senderId: req.user.id }, { recipientId: req.user.id }] },
      include: { sender: { select: userSelect }, recipient: { select: userSelect } },
      orderBy: { createdAt: 'desc' }, take: 200,
    }),
  ]);

  const matchOpponentIds = [...new Set(matches.map((match) => match.player1Id === req.user.id ? match.player2Id : match.player1Id))];
  const matchOpponents = await prisma.user.findMany({ where: { id: { in: matchOpponentIds } }, select: userSelect });
  const opponentMap = new Map(matchOpponents.map((user) => [user.id, publicUser(user)]));
  const conversations = matches.map((match) => {
    const opponentId = match.player1Id === req.user.id ? match.player2Id : match.player1Id;
    const last = match.messages[0];
    return { id: `match:${match.id}`, kind: 'match', matchId: match.id, status: match.status, participant: opponentMap.get(opponentId), lastMessage: last?.content ?? '', updatedAt: last?.createdAt ?? match.updatedAt, unread: 0 };
  });

  const seen = new Set();
  for (const message of directMessages) {
    const other = message.senderId === req.user.id ? message.recipient : message.sender;
    if (seen.has(other.id)) continue;
    seen.add(other.id);
    const unread = directMessages.filter((item) => item.senderId === other.id && item.recipientId === req.user.id && !item.readAt).length;
    conversations.push({ id: `direct:${other.id}`, kind: 'direct', participant: publicUser(other), lastMessage: message.content, updatedAt: message.createdAt, unread });
  }
  conversations.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  res.json({ conversations });
});

router.get('/direct/:friendId/messages', async (req, res) => {
  if (!(await acceptedFriend(req.user.id, req.params.friendId))) return res.status(403).json({ error: 'Sólo puedes escribir a amigos aceptados' });
  const messages = await prisma.directMessage.findMany({
    where: { OR: [
      { senderId: req.user.id, recipientId: req.params.friendId },
      { senderId: req.params.friendId, recipientId: req.user.id },
    ] },
    include: { sender: { select: { id: true, username: true } } },
    orderBy: { createdAt: 'asc' }, take: 200,
  });
  await prisma.directMessage.updateMany({ where: { senderId: req.params.friendId, recipientId: req.user.id, readAt: null }, data: { readAt: new Date() } });
  res.json({ messages });
});

router.post('/direct/:friendId/messages', async (req, res) => {
  const content = String(req.body.content ?? '').trim();
  if (!content || content.length > 500) return res.status(400).json({ error: 'El mensaje debe tener entre 1 y 500 caracteres' });
  if (!(await acceptedFriend(req.user.id, req.params.friendId))) return res.status(403).json({ error: 'Sólo puedes escribir a amigos aceptados' });
  const message = await prisma.directMessage.create({
    data: { senderId: req.user.id, recipientId: req.params.friendId, content },
    include: { sender: { select: { id: true, username: true } } },
  });
  res.status(201).json({ message });
});

export default router;
