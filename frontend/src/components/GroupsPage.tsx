import { useMemo, useState } from 'react';
import { Plus, Search, Users } from 'lucide-react';
import PageHeader from './PageHeader';
import { DEFAULT_GAMES } from '../data/games';

interface Group {
  id: string;
  name: string;
  game: string;
  members: number;
  maxMembers: number;
  description: string;
  joined: boolean;
}

const GROUPS: Group[] = [
  { id: 'g1', name: 'Rift Legends', game: 'lol', members: 42, maxMembers: 50, description: 'Escuadra competitiva enfocada en subir de rango en solo/duo.', joined: true },
  { id: 'g2', name: 'Radiant Squad', game: 'valorant', members: 18, maxMembers: 30, description: 'Grupo casual para jugar ranked los fines de semana.', joined: false },
  { id: 'g3', name: 'Apex Predators LATAM', game: 'apex', members: 27, maxMembers: 40, description: 'Buscamos jugadores con buen aim y comunicación por voz.', joined: false },
  { id: 'g4', name: 'Casual Fortnite Crew', game: 'fortnite', members: 60, maxMembers: 60, description: 'Comunidad para construir, ver duos y partidas semanales.', joined: true },
  { id: 'g5', name: 'CS2 Tácticos', game: 'cs2', members: 12, maxMembers: 20, description: 'Entrenamos estrategias de retake y economía.', joined: false },
  { id: 'g6', name: 'Rocket League Aces', game: 'rocket-league', members: 9, maxMembers: 16, description: '3v3 competitivo con scrims los martes.', joined: false },
];

const FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'mine', label: 'Mis grupos' },
  { id: 'lol', label: 'LoL' },
  { id: 'valorant', label: 'Valorant' },
  { id: 'apex', label: 'Apex' },
];

const gameOf = (id: string) => DEFAULT_GAMES.find((g) => g.id === id);

export default function GroupsPage() {
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [joined, setJoined] = useState<Record<string, boolean>>(
    () => Object.fromEntries(GROUPS.map((g) => [g.id, g.joined])),
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return GROUPS.filter((g) => {
      if (filter === 'mine' && !joined[g.id]) return false;
      if (filter !== 'all' && filter !== 'mine' && g.game !== filter) return false;
      if (needle && !g.name.toLowerCase().includes(needle) && !g.description.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [filter, joined, query]);

  return (
    <section className="mb-8">
      <PageHeader
        kicker="TU COMUNIDAD"
        title="Grupos"
        description="Únete a escuadras activas o crea la tuya."
        action={
          <button className="primary-button flex items-center gap-2 px-5 py-3 text-sm font-bold">
            <Plus className="h-4 w-4" /> Crear grupo
          </button>
        }
      />

      <div className="anim-fade-up mb-5 flex flex-col gap-3 sm:flex-row sm:items-center" style={{ animationDelay: '60ms' }}>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar grupos..."
            className="w-full rounded-xl border border-white/10 bg-[#0b1220] py-3 pl-11 pr-4 text-sm text-white transition-colors placeholder:text-slate-600 focus:border-brand-violet/60 focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`chip ${filter === f.id ? 'chip-active' : ''}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="surface anim-fade-up rounded-2xl p-14 text-center">
          <Users className="mx-auto mb-3 h-9 w-9 text-slate-600" />
          <p className="text-sm text-slate-400">No hay grupos que coincidan con tu búsqueda.</p>
        </div>
      ) : (
        <div key={`${filter}-${query}`} className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((group) => {
            const game = gameOf(group.game);
            const color = game?.color ?? '#818cf8';
            const isJoined = joined[group.id];
            const pct = Math.round((group.members / group.maxMembers) * 100);
            const full = group.members >= group.maxMembers && !isJoined;

            return (
              <article key={group.id} className="surface card-lift flex flex-col gap-3 rounded-2xl p-5">
                <div>
                  <span
                    className="inline-block rounded-md px-2 py-1 text-[10px] font-bold tracking-wide"
                    style={{ color, background: `${color}1f` }}
                  >
                    {(game?.short ?? group.game).toUpperCase()}
                  </span>
                  <h3 className="mt-2.5 text-base font-bold text-white">{group.name}</h3>
                </div>

                <p className="flex-1 text-sm leading-relaxed text-slate-400">{group.description}</p>

                <div>
                  <div className="mb-1.5 flex items-center justify-between text-xs text-slate-500">
                    <span>{group.members}/{group.maxMembers} miembros</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="meter" style={{ height: 5 }}>
                    <div className="meter-fill" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>

                {isJoined ? (
                  <button className="ghost-button w-full py-2.5 text-sm font-semibold">Abrir grupo</button>
                ) : (
                  <button
                    disabled={full}
                    onClick={() => setJoined((prev) => ({ ...prev, [group.id]: true }))}
                    className="primary-button w-full py-2.5 text-sm font-bold disabled:opacity-45 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                  >
                    {full ? 'Grupo lleno' : 'Unirse'}
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
