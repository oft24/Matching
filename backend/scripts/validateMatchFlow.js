import { prisma } from '../src/config/prisma.js';
import { closeMatch, getAcceptedChats, getQueueStatus, joinQueue, respondToMatch } from '../src/services/queueService.js';

const stamp = Date.now();
const ids = [];
const matchIds = [];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

try {
  const [a, b, c] = await Promise.all([
    prisma.user.create({ data: { username: `_match_a_${stamp}`, email: `_match_a_${stamp}@test.invalid`, password: 'test' } }),
    prisma.user.create({ data: { username: `_match_b_${stamp}`, email: `_match_b_${stamp}@test.invalid`, password: 'test' } }),
    prisma.user.create({ data: { username: `_match_c_${stamp}`, email: `_match_c_${stamp}@test.invalid`, password: 'test' } }),
  ]);
  ids.push(a.id, b.id, c.id);
  await prisma.userConnection.create({ data: { userId: b.id, provider: 'discord', discordUsername: 'test-discord', connected: true } });
  const filters = { game: 'lol', region: 'LAN', language: 'Español', rank: 'Gold', playstyle: 'Competitivo', preferredGender: 'any' };

  const firstJoin = await joinQueue(a.id, 'lol', filters);
  assert(firstJoin.searching, 'El primer usuario debe quedar buscando');
  const secondJoin = await joinQueue(b.id, 'lol', filters);
  const matchId = secondJoin.matchId;
  matchIds.push(matchId);
  assert(matchId, 'El segundo usuario debe crear un match');

  const beforeAccept = await getQueueStatus(a.id);
  assert(beforeAccept.status === 'pending', 'El match debe iniciar pendiente');
  assert(beforeAccept.opponent.discord === null, 'Discord no debe compartirse antes de aceptar');

  const firstAccept = await respondToMatch(a.id, matchId, 'accept');
  assert(firstAccept.status === 'pending', 'Un solo accept no debe abrir el chat');
  const waiting = await getQueueStatus(a.id);
  assert(waiting.myAccepted && !waiting.opponentAccepted, 'Debe mostrar espera por el segundo usuario');

  const duplicate = await joinQueue(a.id, 'lol', filters);
  assert(duplicate.matchId === matchId && duplicate.alreadyMatched, 'No debe permitir un segundo match activo');

  const secondAccept = await respondToMatch(b.id, matchId, 'accept');
  assert(secondAccept.status === 'accepted', 'El segundo accept debe confirmar el match');
  const [acceptedA, acceptedB] = await Promise.all([getQueueStatus(a.id), getQueueStatus(b.id)]);
  assert(acceptedA.status === 'accepted' && acceptedB.status === 'accepted', 'Ambos deben ver el mismo chat aceptado');
  assert(acceptedA.opponent.discord?.username === 'test-discord', 'Discord debe compartirse después del match');

  await prisma.matchMessage.createMany({ data: [
    { matchId, senderId: a.id, content: 'hola' },
    { matchId, senderId: b.id, content: 'listo' },
  ] });
  const messages = await prisma.matchMessage.count({ where: { matchId } });
  assert(messages === 2, 'Los mensajes de ambos usuarios deben persistir');

  await joinQueue(a.id, 'lol', filters);
  const thirdJoin = await joinQueue(c.id, 'lol', filters);
  const secondMatchId = thirdJoin.matchId;
  matchIds.push(secondMatchId);
  assert(secondMatchId && secondMatchId !== matchId, 'Debe permitir otro match con una persona distinta');
  await respondToMatch(a.id, secondMatchId, 'accept');
  await respondToMatch(c.id, secondMatchId, 'accept');
  const twoChats = await getAcceptedChats(a.id);
  assert(twoChats.length === 2, 'Deben coexistir dos ventanas de chat');

  const closed = await closeMatch(a.id, matchId);
  assert(closed.status === 'closed', 'Cerrar chat debe finalizar el match');
  const remainingChats = await getAcceptedChats(a.id);
  assert(remainingChats.length === 1 && remainingChats[0].matchId === secondMatchId, 'Cerrar un chat no debe cerrar el otro');
  await closeMatch(a.id, secondMatchId);

  console.log(JSON.stringify({ ok: true, checks: 14, matchIds }));
} finally {
  if (matchIds.length) await prisma.liveMatch.deleteMany({ where: { id: { in: matchIds } } });
  if (ids.length) {
    await prisma.queueEntry.deleteMany({ where: { userId: { in: ids } } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
  }
  await prisma.$disconnect();
}
