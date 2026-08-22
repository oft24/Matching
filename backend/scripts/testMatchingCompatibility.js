import assert from 'node:assert/strict';
import {
  filtersCompatible,
  normalizeGenderPreference,
  normalizeQueueFilters,
  preferenceAllows,
} from '../src/utils/matchingCompatibility.js';

const base = { game: 'lol', region: 'lan' };

// Caso solicitado: ella acepta cualquiera y él busca mujeres.
assert.equal(filtersCompatible(
  { ...base, userGender: 'woman', preferredGender: 'any' },
  { ...base, userGender: 'man', preferredGender: 'woman' },
), true);

// El equivalente con un hombre buscado por la otra persona también conecta.
assert.equal(filtersCompatible(
  { ...base, userGender: 'man', preferredGender: 'any' },
  { ...base, userGender: 'woman', preferredGender: 'man' },
), true);

assert.equal(filtersCompatible(
  { ...base, userGender: 'woman', preferredGender: 'woman' },
  { ...base, userGender: 'man', preferredGender: 'woman' },
), false);
assert.equal(filtersCompatible(
  { ...base, userGender: null, preferredGender: 'any' },
  { ...base, userGender: 'woman', preferredGender: 'man' },
), false);
assert.equal(filtersCompatible(
  { ...base, userGender: 'other', preferredGender: 'any' },
  { ...base, userGender: 'woman', preferredGender: 'any' },
), true);
assert.equal(filtersCompatible(
  { ...base, userGender: 'woman', preferredGender: 'any' },
  { ...base, userGender: 'man', preferredGender: 'any', region: 'las' },
), false);
assert.equal(filtersCompatible(
  { ...base, userGender: 'woman', preferredGender: 'any' },
  { ...base, userGender: 'man', preferredGender: 'any', game: 'valorant' },
), false);

assert.equal(preferenceAllows('mujeres', 'woman'), true);
assert.equal(normalizeGenderPreference('cualquiera'), 'any');
assert.deepEqual(
  normalizeQueueFilters('LoL', { region: 'LAN', preferredGender: 'HOMBRES' }, 'Hombre'),
  { game: 'lol', region: 'lan', preferredGender: 'man', userGender: 'man' },
);

console.log('MATCHING_COMPATIBILITY_TEST_OK');
