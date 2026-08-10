import { Check } from 'lucide-react';
import type { Game } from '../types';

interface GameGridProps {
  games: Game[];
  selected: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
}

const GAME_IMAGES: Record<string, string> = {
  lol: 'games/lol.jpg',
  valorant: 'games/valorant.png',
  apex: 'games/apex.jpg',
  fortnite: 'games/fortnite.png',
  roblox: 'games/roblox.png',
  'rocket-league': 'games/rocket-league.jpg',
  overwatch: 'games/overwatch.jpg',
  cs2: 'games/cs2.jpg',
  dota2: 'games/dota2.jpg',
};

const publicAsset = (asset: string) => `${import.meta.env.BASE_URL}${asset}`;

export default function GameGrid({ games, selected, onSelect, disabled }: GameGridProps) {
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

      <div className="stagger grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {games.map((game) => {
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
                src={publicAsset(GAME_IMAGES[game.id])}
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
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
