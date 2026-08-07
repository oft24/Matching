import {
  ArrowRight,
  CheckCircle2,
  Gamepad2,
  Headphones,
  LogIn,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UsersRound,
} from 'lucide-react';
import GameGrid from './GameGrid';
import Avatar from './Avatar';
import type { Game } from '../types';

interface GuestLandingProps {
  games: Game[];
  selected: string;
  onSelect: (id: string) => void;
  onOpenLogin: () => void;
}

const PROOF_POINTS = [
  { icon: SlidersHorizontal, label: 'Matchmaking por rango' },
  { icon: UsersRound, label: 'Roles compatibles' },
  { icon: ShieldCheck, label: 'Perfiles reales' },
];

const STEPS = [
  {
    number: '01',
    icon: Gamepad2,
    title: 'Elige tu juego',
    description: 'Selecciona el título donde quieres encontrar compañeros.',
  },
  {
    number: '02',
    icon: SlidersHorizontal,
    title: 'Define tu estilo',
    description: 'Configura rango, rol, preferencias y forma de jugar.',
  },
  {
    number: '03',
    icon: UsersRound,
    title: 'Encuentra tu squad',
    description: 'Conecta con jugadores compatibles y empieza a jugar.',
  },
];

export default function GuestLanding({ games, selected, onSelect, onOpenLogin }: GuestLandingProps) {
  const selectedGame = games.find((game) => game.id === selected) ?? games[0];

  return (
    <div className="landing-shell mx-auto w-full max-w-7xl">
      <section className="relative overflow-hidden border-b border-white/10 pb-10 pt-10 sm:pb-12 sm:pt-14 lg:pb-16 lg:pt-20">
        <div className="hero-light hero-light-violet" aria-hidden="true" />
        <div className="hero-light hero-light-blue" aria-hidden="true" />

        <div className="relative max-w-4xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/8 px-3 py-1.5 text-xs font-semibold text-violet-200">
            <Sparkles className="h-3.5 w-3.5" />
            MATCHMAKING PARA GAMERS
          </div>

          <h1 className="max-w-4xl text-[2.15rem] font-bold leading-[1.08] text-white sm:text-[2.75rem] lg:text-[3.65rem]">
            Encuentra jugadores. Forma tu equipo.{' '}
            <span className="gradient-text">Empieza a ganar.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
            Conecta con jugadores que comparten tu juego, rango, rol, plataforma y estilo de juego.
          </p>

          <div className="stagger mt-7 flex flex-wrap gap-x-6 gap-y-3">
            {PROOF_POINTS.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm text-slate-300">
                <Icon className="h-4 w-4 text-indigo-400" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="py-10 sm:py-12">
        <GameGrid games={games} selected={selected} onSelect={onSelect} />

        <section className="onboarding-panel mt-8 grid items-center gap-6 p-5 sm:p-7 lg:grid-cols-[auto_1fr_auto] lg:gap-8">
          <div className="relative hidden h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-indigo-400/20 bg-indigo-500/10 sm:flex">
            <Headphones className="h-8 w-8 text-indigo-300" />
            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-[#111827] bg-emerald-400" />
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-indigo-300">
              <span>PASO 02</span>
              <span className="h-px w-6 bg-indigo-400/40" />
              <span className="text-slate-500">SIGUIENTE PASO</span>
            </div>
            <h2 className="text-xl font-semibold text-white sm:text-2xl">Configura tu perfil de jugador</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Selecciona rango, rol, plataforma y preferencias para encontrar compañeros compatibles en {selectedGame?.name ?? 'tu juego'}.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenLogin}
            className="primary-button flex w-full items-center justify-center gap-2 px-5 py-3 text-sm font-semibold lg:w-auto"
          >
            <LogIn className="h-4 w-4" />
            Crear mi perfil
            <ArrowRight className="h-4 w-4" />
          </button>
        </section>
      </div>

      <section className="border-t border-white/10 py-10 sm:py-12">
        <div className="mb-6">
          <p className="section-kicker">CÓMO FUNCIONA</p>
          <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">De la búsqueda a la partida</h2>
        </div>

        <div className="grid gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 md:grid-cols-3">
          {STEPS.map(({ number, icon: Icon, title, description }) => (
            <article key={number} className="group relative bg-[#101827] p-6 transition-colors duration-200 hover:bg-[#141e30]">
              <div className="mb-8 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.035] transition-transform duration-300 group-hover:scale-110">
                  <Icon className="h-5 w-5 text-indigo-300" />
                </div>
                <span className="font-mono text-xs text-slate-600">{number}</span>
              </div>
              <h3 className="text-base font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid items-center gap-8 border-t border-white/10 py-10 sm:py-14 lg:grid-cols-[1fr_420px]">
        <div className="max-w-xl">
          <p className="section-kicker">COMPATIBILIDAD QUE IMPORTA</p>
          <h2 className="mt-3 text-2xl font-semibold leading-tight text-white sm:text-3xl">
            Menos tiempo buscando. Más tiempo jugando.
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-400 sm:text-base">
            Matching compara las preferencias que sí cambian una partida: nivel, rol, comunicación, objetivos y compatibilidad.
          </p>
          <div className="stagger mt-6 space-y-3">
            {['Preferencias claras antes de conectar', 'Aceptación mutua y contacto directo', 'Tu búsqueda permanece activa hasta hacer match'].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-slate-300">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="match-preview" aria-label="Ejemplo visual de un match potencial">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <p className="text-[11px] font-semibold text-indigo-300">MATCH POTENCIAL</p>
              <p className="mt-1 text-xs text-slate-500">Vista de demostración</p>
            </div>
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
              92% compatible
            </span>
          </div>
          <div className="flex items-center gap-4 p-5">
            <Avatar name="AlexR" size={56} radius={14} />
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-white">AlexR</h3>
              <p className="mt-1 text-sm text-slate-400">Diamond II · Mid / Support</p>
            </div>
            <div className="hidden h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-indigo-300 sm:flex">
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
