import { Crosshair, GameController, Lightning, UsersThree } from '@phosphor-icons/react';
import { DEFAULT_GAMES } from '../data/games';
import { gameAvatarUrl } from '../data/gameAvatars';

interface SearchExperienceProps {
  gameId: string;
  elapsed: number;
}

const SIGNAL_STEPS = [
  { label: 'Buscando jugadores', icon: UsersThree },
  { label: 'Midiendo compatibilidad', icon: Crosshair },
  { label: 'Preparando conexión', icon: Lightning },
];

function formatElapsed(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

/** Escena viva de búsqueda. Todo el movimiento es decorativo y respeta reduced-motion. */
export default function SearchExperience({ gameId, elapsed }: SearchExperienceProps) {
  const game = DEFAULT_GAMES.find((item) => item.id === gameId) ?? DEFAULT_GAMES[0];
  const image = gameAvatarUrl(game.id);
  const activeStep = Math.floor(elapsed / 3) % SIGNAL_STEPS.length;

  return (
    <div className="search-experience anim-fade-up mt-6 overflow-hidden rounded-3xl">
      <p className="sr-only" role="status">Búsqueda activa en {game.name}. Comparando jugadores compatibles.</p>
      <div className="search-field" aria-hidden="true">
        <span className="search-orbit search-orbit-a"><i /></span>
        <span className="search-orbit search-orbit-b"><i /></span>
        <span className="search-orbit search-orbit-c"><i /></span>
        <span className="search-sweep" />
        <span className="search-ping search-ping-a" />
        <span className="search-ping search-ping-b" />
        <span className="search-ping search-ping-c" />

        <div className="search-core">
          <span className="search-core-glow" />
          {image ? (
            <img src={image} alt="" className="h-full w-full object-cover" />
          ) : (
            <GameController weight="fill" className="h-8 w-8" />
          )}
        </div>
      </div>

      <div className="search-copy">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="section-kicker">SEÑAL ACTIVA</p>
            <h4 className="mt-2 text-lg font-black text-white">Buscando tu dupla en {game.name}</h4>
          </div>
          <span className="search-timer" aria-label={`${elapsed} segundos en cola`}>
            {formatElapsed(elapsed)}
          </span>
        </div>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
          Comparamos región, idioma y estilo de juego. Puedes cancelar en cualquier momento.
        </p>

        <div className="search-steps" aria-hidden="true">
          {SIGNAL_STEPS.map(({ label, icon: Icon }, index) => (
            <span key={label} className={index === activeStep ? 'is-active' : index < activeStep ? 'is-done' : ''}>
              <i><Icon weight="bold" /></i>{label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
