import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { signToken } from '../src/utils/tokens.js';

const stamp = Date.now();
const userIds = [];
let matchId;
let server;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

try {
  const [a, b] = await Promise.all([
    prisma.user.create({ data: { username: `_msg_a_${stamp}`, email: `_msg_a_${stamp}@test.invalid`, password: 'test' } }),
    prisma.user.create({ data: { username: `_msg_b_${stamp}`, email: `_msg_b_${stamp}@test.invalid`, password: 'test' } }),
  ]);
  userIds.push(a.id, b.id);
  const ids = a.id < b.id ? { userId: a.id, friendId: b.id } : { userId: b.id, friendId: a.id };
  await prisma.friendship.create({ data: { ...ids, requestedById: a.id, status: 'accepted', acceptedAt: new Date() } });
  const match = await prisma.liveMatch.create({ data: { player1Id: a.id, player2Id: b.id, player1Accepted: true, player2Accepted: true, status: 'accepted', game: 'lol', expiresAt: new Date(Date.now() + 60_000) } });
  matchId = match.id;
  await prisma.matchMessage.create({ data: { matchId, senderId: a.id, content: 'mensaje del match' } });

  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const headersA = { Authorization: `Bearer ${signToken({ userId: a.id })}`, 'Content-Type': 'application/json' };
  const headersB = { Authorization: `Bearer ${signToken({ userId: b.id })}`, 'Content-Type': 'application/json' };

  const inboxA = await fetch(`${base}/conversations`, { headers: headersA }).then((response) => response.json());
  assert(inboxA.conversations.some((item) => item.kind === 'match' && item.matchId === matchId), 'El chat de match debe aparecer en Mensajes');

  const sent = await fetch(`${base}/conversations/direct/${b.id}/messages`, { method: 'POST', headers: headersA, body: JSON.stringify({ content: 'hola amigo' }) });
  assert(sent.status === 201, 'Debe permitir enviar mensajes a un amigo aceptado');
  const inboxB = await fetch(`${base}/conversations`, { headers: headersB }).then((response) => response.json());
  const directB = inboxB.conversations.find((item) => item.kind === 'direct' && item.participant.id === a.id);
  assert(directB?.unread === 1, 'El destinatario debe ver un mensaje no leído');

  const opened = await fetch(`${base}/conversations/direct/${a.id}/messages`, { headers: headersB }).then((response) => response.json());
  assert(opened.messages.length === 1 && opened.messages[0].content === 'hola amigo', 'Abrir el chat debe devolver el hilo directo');
  const replied = await fetch(`${base}/conversations/direct/${a.id}/messages`, { method: 'POST', headers: headersB, body: JSON.stringify({ content: 'qué tal' }) });
  assert(replied.status === 201, 'El amigo debe poder responder');
  const threadA = await fetch(`${base}/conversations/direct/${b.id}/messages`, { headers: headersA }).then((response) => response.json());
  assert(threadA.messages.length === 2, 'Ambos mensajes deben permanecer en el mismo hilo');

  console.log(JSON.stringify({ ok: true, checks: 6, matchId }));
} finally {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (matchId) await prisma.liveMatch.deleteMany({ where: { id: matchId } });
  if (userIds.length) await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  await prisma.$disconnect();
}
