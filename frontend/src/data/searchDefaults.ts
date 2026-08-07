import type { SearchFilters } from '../types';

/** Filtros iniciales de matchmaking, compartidos por la vista y el botón de restablecer. */
export const DEFAULT_SEARCH_FILTERS: SearchFilters = {
  game: 'lol',
  region: 'LAN',
  language: 'Español',
  matchType: 'Ranked',
  rank: 'Gold',
  role: 'Any',
  age: '18-25',
  preferredGender: 'any',
  verifiedOnly: false,
  playstyle: 'Competitivo',
  objectives: 'Subir de rango',
  activityLevel: 'Alto',
  hasMic: true,
};
