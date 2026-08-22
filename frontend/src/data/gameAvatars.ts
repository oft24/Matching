import { DEFAULT_GAMES } from './games';

const GAME_AVATAR_FILES: Record<string, string> = {
  lol: 'lol.jpg',
  valorant: 'valorant.webp',
  apex: 'apex.jpg',
  fortnite: 'fortnite.png',
  'marvel-rivals': 'marvel-rivals.webp',
  'rainbow-six': 'rainbow-six.webp',
  warzone: 'warzone.webp',
  minecraft: 'minecraft.webp',
  'rocket-league': 'rocket-league.jpg',
  overwatch: 'overwatch.jpg',
  cs2: 'cs2.jpg',
  dota2: 'dota2.jpg',
  pubg: 'pubg.webp',
  roblox: 'roblox.png',
  gta5: 'gta5.webp',
  'dead-by-daylight': 'dead-by-daylight.webp',
};

export const GAME_AVATAR_PREFIX = 'game:';

export const GAME_AVATARS = DEFAULT_GAMES.map((game) => ({
  ...game,
  value: `${GAME_AVATAR_PREFIX}${game.id}`,
  image: gameAvatarUrl(game.id),
}));

export function gameAvatarUrl(gameId: string) {
  const file = GAME_AVATAR_FILES[gameId];
  if (!file) return null;
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  return `${base}games/${file}`;
}

/** Convierte el identificador persistente en un recurso local del frontend. */
export function resolveAvatarSrc(src?: string | null) {
  if (!src?.startsWith(GAME_AVATAR_PREFIX)) return src ?? null;
  return gameAvatarUrl(src.slice(GAME_AVATAR_PREFIX.length));
}
