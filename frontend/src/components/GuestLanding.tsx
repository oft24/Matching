import { LogIn } from 'lucide-react';
import GameGrid from './GameGrid';
import type { Game } from '../types';

interface GuestLandingProps {
  games: Game[];
  selected: string;
  onSelect: (id: string) => void;
  onOpenLogin: () => void;
}

export default function GuestLanding({ games, selected, onSelect, onOpenLogin }: GuestLandingProps) {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-3">
          Encuentra tu <span className="gradient-text">equipo ideal</span>
        </h2>
        <p className="text-slate-400 max-w-xl mx-auto">
          Elige tu juego y crea una cuenta para empezar a buscar compañeros.
        </p>
      </div>

      <GameGrid games={games} selected={selected} onSelect={onSelect} />

      <div className="glass rounded-2xl p-8 text-center mt-4">
        <p className="text-slate-400 mb-6">
          Inicia sesión para configurar tu búsqueda, ver resultados y acceder a tu dashboard.
        </p>
        <button
          onClick={onOpenLogin}
          className="gradient-btn inline-flex items-center gap-2 px-8 py-3 rounded-2xl text-white font-bold text-sm"
        >
          <LogIn className="w-4 h-4" />
          Iniciar sesión
        </button>
      </div>
    </div>
  );
}
