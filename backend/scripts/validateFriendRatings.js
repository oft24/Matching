import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { signToken } from '../src/utils/tokens.js';

const stamp = Date.now();
const userIds = [];
let server;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function pair(a, b) {
  return a < b ? { userId: a, friendId: b } : { userId: b, friendId: a };
}

try {
  const [a, b, c] = await Promise.all([
    prisma.user.create({ data: { username: `_rating_a_${stamp}`, email: `_rating_a_${stamp}@test.invalid`, password: 'test' } }),
    prisma.user.create({ data: { username: `_rating_b_${stamp}`, email: `_rating_b_${stamp}@test.invalid`, password: 'test' } }),
    prisma.user.create({ data: { username: `_rating_c_${stamp}`, email: `_rating_c_${stamp}@test.invalid`, password: 'test' } }),
  ]);
  userIds.push(a.id, b.id, c.id);
  await Promise.all([
    prisma.friendship.create({ data: { ...pair(a.id, b.id), requestedById: a.id, status: 'accepted', acceptedAt: new Date() } }),
    prisma.friendship.create({ data: { ...pair(c.id, b.id), requestedById: c.id, status: 'accepted', acceptedAt: new Date() } }),
  ]);

  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const headers = (userId) => ({ Authorization: `Bearer ${signToken({ userId })}`, 'Content-Type': 'application/json' });
  const rate = (raterId, ratedId, score) => fetch(`${base}/friends/${ratedId}/rating`, {
    method: 'PUT', headers: headers(raterId), body: JSON.stringify({ score }),
  });

  const first = await rate(a.id, b.id, 5);
  const firstBody = await first.json();
  assert(first.status === 200 && firstBody.rating.average === 5 && firstBody.rating.count === 1, 'La primera valoración debe crear un promedio de 5');

  const updated = await rate(a.id, b.id, 3);
  const updatedBody = await updated.json();
  assert(updated.status === 200 && updatedBody.rating.average === 3 && updatedBody.rating.count === 1, 'La segunda valoración del mismo amigo debe actualizar, no duplicar');

  const secondRater = await rate(c.id, b.id, 4);
  const secondBody = await secondRater.json();
  assert(secondRater.status === 200 && secondBody.rating.average === 3.5 && secondBody.rating.count === 2, 'El promedio debe incluir valoraciones de amigos distintos');

  const invalid = await rate(a.id, b.id, 6);
  assert(invalid.status === 400, 'No debe aceptar más de 5 estrellas');

  const stranger = await rate(a.id, c.id, 5);
  assert(stranger.status === 403, 'No debe permitir valorar a alguien que no es amigo');

  const profileResponse = await fetch(`${base}/friends/${b.id}`, { headers: headers(a.id) });
  const profileBody = await profileResponse.json();
  assert(profileResponse.status === 200 && profileBody.profile.id === b.id, 'El perfil de un amigo debe abrirse');
  assert(profileBody.rating.average === 3.5 && profileBody.rating.count === 2 && profileBody.rating.myRating === 3, 'El perfil debe incluir promedio y valoración propia');

  const dashboard = await fetch(`${base}/friends/${b.id}/dashboard?queue=solo`, { headers: headers(a.id) });
  assert(dashboard.status === 400, 'El dashboard debe informar cuando el amigo no conectó Riot');

  console.log(JSON.stringify({ ok: true, checks: 8, average: profileBody.rating.average }));
} finally {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (userIds.length) await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  await prisma.$disconnect();
}
