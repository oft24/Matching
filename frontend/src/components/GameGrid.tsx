import { Check } from 'lucide-react';
import type { Game } from '../types';

interface GameGridProps {
  games: Game[];
  selected: string;
  onSelect: (id: string) => void;
}

export default function GameGrid({ games, selected, onSelect }: GameGridProps) {
  return (
    <section className="mb-8">
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
        1. Elige tu juego
      </h3>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-9 gap-3">
        {games.map((game) => {
          const isSelected = selected === game.id;
          return (
            <button
              key={game.id}
              onClick={() => onSelect(game.id)}
              className={`relative group rounded-2xl aspect-square overflow-hidden transition-all duration-300
                ${isSelected
                  ? 'ring-2 ring-brand-violet glow-violet scale-105'
                  : 'ring-1 ring-white/10 hover:ring-brand-violet/50 hover:scale-105'
                }`}
            >
              <div
                className="absolute inset-0 opacity-80 group-hover:opacity-100 transition-opacity"
                style={{ background: `linear-gradient(135deg, ${game.color}40, ${game.color}20)` }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                <span
                  className="text-2xl font-black mb-1"
                  style={{ color: game.color }}
                >
                  {game.short}
                </span>
                <span className="text-[10px] text-slate-300 text-center leading-tight font-medium">
                  {game.name}
                </span>
              </div>
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-brand-violet flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
