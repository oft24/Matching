import { useState } from 'react';
import { CaretDown, Check } from '@phosphor-icons/react';
import type { Game } from '../types';

interface GameGridProps {
  games: Game[];
  selected: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
}

const GAME_IMAGES: Record<string, string> = {
  lol: 'games/lol.jpg',
  valorant: 'games/valorant.webp',
  apex: 'games/apex.jpg',
  fortnite: 'games/fortnite.png',
  'marvel-rivals': 'games/marvel-rivals.webp',
  'rainbow-six': 'games/rainbow-six.webp',
  warzone: 'games/warzone.webp',
  minecraft: 'games/minecraft.webp',
  roblox: 'games/roblox.png',
  'rocket-league': 'games/rocket-league.jpg',
  overwatch: 'games/overwatch.jpg',
  cs2: 'games/cs2.jpg',
  dota2: 'games/dota2.jpg',
  pubg: 'games/pubg.webp',
  gta5: 'games/gta5.webp',
  'dead-by-daylight': 'games/dead-by-daylight.webp',
};

const publicAsset = (asset: string) => `${import.meta.env.BASE_URL}${asset}`;
const INITIAL_GAME_COUNT = 8;

export default function GameGrid({ games, selected, onSelect, disabled }: GameGridProps) {
  const [expanded, setExpanded] = useState(false);
  const visibleGames = expanded ? games : games.slice(0, INITIAL_GAME_COUNT);
  const hiddenCount = Math.max(0, games.length - visibleGames.length);

  return (
    <section aria-labelledby="game-selector-title" aria-disabled={disabled} className={`mb-8 transition-opacity ${disabled ? 'opacity-55' : ''}`}>
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="section-kicker">PASO 01</p>
          <h2 id="game-selector-title" className="mt-2 text-xl font-semibold text-white sm:text-2xl">
            Selecciona tu juego
          </h2>
        </div>
        <p className="hidden text-sm text-slate-500 sm:block">{games.length} juegos disponibles</p>
      </div>

      <div id="game-grid" className="stagger grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {visibleGames.map((game) => {
          const isSelected = selected === game.id;
          return (
            <button
              type="button"
              disabled={disabled}
              key={game.id}
              onClick={() => onSelect(game.id)}
              aria-pressed={isSelected}
              aria-label={`Seleccionar ${game.name}`}
              className={`game-card group disabled:cursor-not-allowed ${isSelected ? 'game-card-selected' : ''}`}
              style={{ '--game-color': game.color } as React.CSSProperties}
            >
              <img
                src={publicAsset(GAME_IMAGES[game.id] ?? 'favicon.svg')}
                alt=""
                loading="lazy"
                className="game-card-image"
              />
              <span className="game-card-overlay" aria-hidden="true" />
              <span className="game-card-accent" aria-hidden="true" />
              <span className="relative z-10 min-w-0 text-left">
                <span className="block truncate text-sm font-semibold text-white">
                  {game.name}
                </span>
              </span>
              {isSelected && (
                <span className="anim-pop absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-400 text-white shadow-lg shadow-indigo-500/40">
                  <Check weight="bold" className="h-3 w-3" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {hiddenCount > 0 && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => setExpanded(true)}
            disabled={disabled}
            aria-expanded={expanded}
            aria-controls="game-grid"
            className="ghost-button inline-flex min-h-10 items-center justify-center gap-2 px-4 text-sm disabled:cursor-not-allowed"
          >
            Ver {hiddenCount} juegos más <CaretDown className="h-4 w-4" />
          </button>
        </div>
      )}
    </section>
  );
}
