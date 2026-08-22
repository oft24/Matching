const GENDER_ALIASES = new Map([
  ['man', 'man'],
  ['male', 'man'],
  ['hombre', 'man'],
  ['hombres', 'man'],
  ['men', 'man'],
  ['woman', 'woman'],
  ['female', 'woman'],
  ['mujer', 'woman'],
  ['mujeres', 'woman'],
  ['women', 'woman'],
  ['other', 'other'],
  ['otro', 'other'],
  ['otra', 'other'],
  ['nonbinary', 'other'],
  ['non-binary', 'other'],
]);

function clean(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export function normalizeGender(value) {
  return GENDER_ALIASES.get(clean(value)) ?? null;
}

export function normalizeGenderPreference(value) {
  const candidate = clean(value);
  if (!candidate || ['any', 'all', 'cualquiera', 'todos', 'todas'].includes(candidate)) return 'any';
  return normalizeGender(candidate);
}

export function preferenceAllows(preference, profileGender) {
  const wanted = normalizeGenderPreference(preference);
  if (wanted === 'any') return true;
  if (!wanted) return false;
  return wanted === normalizeGender(profileGender);
}

/**
 * La compatibilidad es recíproca: A debe aceptar el género de B y B el de A.
 * Una preferencia "cualquiera" sólo relaja ese lado, no ignora la preferencia
 * elegida por la otra persona.
 */
export function filtersCompatible(a = {}, b = {}) {
  const gameA = clean(a.game);
  const gameB = clean(b.game);
  if (!gameA || gameA !== gameB) return false;

  const regionA = clean(a.region);
  const regionB = clean(b.region);
  if (regionA && regionB && regionA !== regionB) return false;

  return preferenceAllows(a.preferredGender, b.userGender)
    && preferenceAllows(b.preferredGender, a.userGender);
}

export function normalizeQueueFilters(game, filters = {}, userGender = null) {
  return {
    ...filters,
    game: clean(game),
    region: clean(filters.region),
    preferredGender: normalizeGenderPreference(filters.preferredGender),
    userGender: normalizeGender(userGender),
  };
}
