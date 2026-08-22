/** Identificadores locales que el frontend sabe convertir en imágenes empaquetadas. */
export const ALLOWED_GAME_AVATARS = new Set([
  'lol', 'valorant', 'apex', 'fortnite', 'marvel-rivals', 'rainbow-six',
  'warzone', 'minecraft', 'rocket-league', 'overwatch', 'cs2', 'dota2',
  'pubg', 'roblox', 'gta5', 'dead-by-daylight',
]);

const ALLOWED_AVATAR_HOST = 'ddragon.leagueoflegends.com';

/** Impide almacenar URLs arbitrarias y esquemas locales desconocidos. */
export function isAllowedAvatar(value) {
  if (typeof value !== 'string') return false;
  if (value.startsWith('game:')) return ALLOWED_GAME_AVATARS.has(value.slice(5));
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === ALLOWED_AVATAR_HOST;
  } catch {
    return false;
  }
}
