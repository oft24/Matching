import { useState } from 'react';
import { Crosshair, Eye, GameController, ShieldCheck, Sword } from '@phosphor-icons/react';
import type { ChampionStat, Dashboard, MatchSummary, RecentStats, RoleStat } from '../types';
import PageHeader from './PageHeader';
import MatchDetailModal from './MatchDetailModal';

interface DashboardPanelProps {
  data: Dashboard | null;
  game: 'lol' | 'valorant';
  onGameChange: (game: 'lol' | 'valorant') => void;
  queue: 'solo' | 'flex';
  onQueueChange: (queue: 'solo' | 'flex') => void;
}

const ROLE_LABELS: Record<string, string> = {
  TOP: 'Top', JUNGLE: 'Jungla', MIDDLE: 'Medio', BOTTOM: 'ADC', UTILITY: 'Soporte', FILL: 'Flexible',
};

/** Color del emblema por tier, como en los badges de rango de op.gg. */
const TIER_COLORS: Record<string, string> = {
  IRON: '#6b6a6a', BRONZE: '#a4643b', SILVER: '#8b9aa5', GOLD: '#d4af37',
  PLATINUM: '#40c8b4', EMERALD: '#2ec27e', DIAMOND: '#5b8dd9',
  MASTER: '#9d4edd', GRANDMASTER: '#e04f5f', CHALLENGER: '#f0c674',
};

function tierColor(tier?: string) {
  return TIER_COLORS[String(tier ?? '').toUpperCase()] ?? '#818cf8';
}

function duration(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

/** "hace 3 h", "hace 2 d" — el formato de tiempo relativo del historial de op.gg. */
function relativeTime(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 60) return `hace ${Math.max(1, minutes)} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 30) return `hace ${days} d`;
  return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' }).format(new Date(value));
}

/** Verde si el KDA es bueno, ámbar si es normal, rojo si es malo — el semáforo de u.gg. */
function kdaColor(kda: number) {
  if (kda >= 4) return 'text-amber-300';
  if (kda >= 3) return 'text-sky-300';
  if (kda >= 2) return 'text-emerald-300';
  return 'text-slate-300';
}

export default function DashboardPanel({ data, game, onGameChange, queue, onQueueChange }: DashboardPanelProps) {
  const valorant = game === 'valorant';
  const recent = data?.stats?.recent;
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  return (
    <section className="mb-8">
      <PageHeader
        kicker="RIOT GAMES"
        title={`Rendimiento de ${valorant ? 'Valorant' : 'League of Legends'}`}
        description={data?.riotAccount ? `${data.riotAccount.gameName}#${data.riotAccount.tagLine} · ${data.riotAccount.region.toUpperCase()}` : undefined}
        action={
          <>
            {data?.stats && (
              <span className="hidden items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-300 md:inline-flex">
                <ShieldCheck className="h-4 w-4" /> Verificada
              </span>
            )}
            <div className="grid grid-cols-2 rounded-xl border border-white/10 bg-[#101827] p-1">
              <button onClick={() => onGameChange('lol')} className={`rounded-lg px-4 py-2 text-xs font-bold transition-colors ${!valorant ? 'bg-brand-violet text-white' : 'text-slate-400 hover:text-white'}`}>League</button>
              <button onClick={() => onGameChange('valorant')} className={`rounded-lg px-4 py-2 text-xs font-bold transition-colors ${valorant ? 'bg-red-500 text-white' : 'text-slate-400 hover:text-white'}`}>Valorant</button>
            </div>
          </>
        }
      />

      {!valorant && (
        <div className="anim-fade-up mb-5 flex items-center justify-between gap-4">
          <p className="text-xs text-slate-500">Rango, estadísticas e historial por cola clasificatoria.</p>
          <div className="grid grid-cols-2 rounded-xl border border-white/10 bg-[#101827] p-1">
            <button onClick={() => onQueueChange('solo')} className={`rounded-lg px-4 py-2 text-xs font-bold transition-colors ${queue === 'solo' ? 'bg-brand-violet text-white' : 'text-slate-400 hover:text-white'}`}>Solo/Duo</button>
            <button onClick={() => onQueueChange('flex')} className={`rounded-lg px-4 py-2 text-xs font-bold transition-colors ${queue === 'flex' ? 'bg-brand-violet text-white' : 'text-slate-400 hover:text-white'}`}>Flex</button>
          </div>
        </div>
      )}

      {!data ? (
        <DashboardSkeleton />
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[340px_1fr]">
          {/* Columna izquierda: rango y resumen agregado */}
          <div className="stagger space-y-4">
            {data.stats?.ranked.length
              ? data.stats.ranked.map((rank) => <RankCard key={rank.queue} rank={rank} valorant={valorant} />)
              : <div className="surface rounded-2xl p-6 text-center"><p className="text-sm text-slate-400">Sin rango en esta cola</p><p className="mt-1 text-xs text-slate-600">Juega partidas clasificatorias para obtenerlo.</p></div>}

            {recent && <RecentSummary recent={recent} valorant={valorant} />}
            {!!recent?.champions?.length && <ChampionList champions={recent.champions} />}
            {!!recent?.roles?.length && <RoleList roles={recent.roles} />}
          </div>

          {/* Columna derecha: historial de partidas */}
          <div className="surface anim-fade-up overflow-hidden rounded-2xl" style={{ animationDelay: '80ms' }}>
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <h3 className="text-sm font-bold text-white">Partidas recientes</h3>
                <p className="mt-1 text-xs text-slate-500">
                  {data.matchHistory.length ? `Últimas ${data.matchHistory.length} partidas de ${valorant ? 'Valorant' : 'la cola seleccionada'}` : 'Directamente desde Riot Games'}
                </p>
              </div>
              <GameController className="h-5 w-5 text-indigo-300" />
            </div>

            {data.matchHistory.length ? (
              <div>
                {data.matchHistory.map((match) => (
                  <div key={match.id}>
                    <MatchRow
                      match={match}
                      valorant={valorant}
                      expanded={selectedMatchId === match.id}
                      onToggle={() => setSelectedMatchId((current) => (current === match.id ? null : match.id))}
                    />
                    {selectedMatchId === match.id && <MatchDetailModal matchId={match.id} queue={queue} onClose={() => setSelectedMatchId(null)} />}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <GameController className="mx-auto mb-3 h-9 w-9 text-slate-600" />
                <p className="text-sm text-slate-400">{data.message}</p>
                {valorant && (
                  <p className="mx-auto mt-3 max-w-xl text-xs leading-5 text-slate-500">
                    Valorant requiere Riot Sign On y una clave de producción aprobada para compartir estadísticas personales.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function RankCard({ rank, valorant }: { rank: NonNullable<Dashboard['stats']>['ranked'][number]; valorant: boolean }) {
  const color = tierColor(rank.tier);
  const total = rank.wins + rank.losses;

  return (
    <article className="surface overflow-hidden rounded-2xl">
      <div className="border-b border-white/10 px-5 py-3">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{rank.queue}</p>
      </div>
      <div className="flex items-center gap-4 p-5">
        <div
          className="grid h-16 w-16 flex-shrink-0 place-items-center rounded-2xl text-xl font-black"
          style={{ background: `${color}1f`, color, boxShadow: `inset 0 0 0 1px ${color}44` }}
        >
          {String(rank.tier ?? '?').slice(0, 2)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-bold text-white">
            {rank.tier} {rank.rank}
          </p>
          {!valorant && <p className="mt-0.5 text-sm font-semibold" style={{ color }}>{rank.leaguePoints} LP</p>}
          <p className="mt-1 text-xs text-slate-500">{rank.wins}V · {rank.losses}D {total > 0 && `· ${rank.winRate}% WR`}</p>
        </div>
      </div>
      <div className="px-5 pb-5">
        <div className="meter" style={{ height: 6 }}>
          <div className="meter-fill" style={{ width: `${rank.winRate}%`, background: color }} />
        </div>
      </div>
    </article>
  );
}

function RecentSummary({ recent, valorant }: { recent: RecentStats; valorant: boolean }) {
  const games = recent.games ?? recent.wins + recent.losses;
  if (!games) return null;

  return (
    <article className="surface rounded-2xl p-5">
      <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">
        Últimas {games} partidas
      </h3>

      <div className="flex items-center gap-5">
        <WinRateDonut winRate={recent.winRate} />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-slate-300">
            <span className="font-bold text-sky-300">{recent.wins}V</span>
            {' · '}
            <span className="font-bold text-red-400">{recent.losses}D</span>
          </p>
          <p className={`mt-1.5 text-2xl font-black ${kdaColor(recent.kda)}`}>{recent.kda.toFixed(2)}</p>
          <p className="text-xs text-slate-500">KDA agregado</p>
          {recent.avgKills !== undefined && (
            <p className="mt-1 text-xs text-slate-400">
              {recent.avgKills} / <span className="text-red-400">{recent.avgDeaths}</span> / {recent.avgAssists}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-4 text-center">
        {valorant ? (
          <>
            <MiniStat label="Puntuación" value={String(recent.avgScore ?? 0)} />
            <MiniStat label="Daño" value={String(recent.avgDamage ?? 0)} />
            <MiniStat label="HS" value={String(recent.headshots ?? 0)} />
          </>
        ) : (
          <>
            <MiniStat label="KP" value={`${recent.killParticipation ?? 0}%`} />
            <MiniStat label="CS" value={String(recent.cs)} />
            <MiniStat label="CS/min" value={String(recent.csPerMin ?? 0)} />
          </>
        )}
      </div>
    </article>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-bold text-white">{value}</p>
      <p className="mt-0.5 text-[11px] text-slate-500">{label}</p>
    </div>
  );
}

/** Anillo de winrate: el gráfico circular característico de op.gg. */
function WinRateDonut({ winRate }: { winRate: number }) {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const dash = (winRate / 100) * circumference;

  return (
    <div className="relative h-[76px] w-[76px] flex-shrink-0">
      <svg viewBox="0 0 76 76" className="h-full w-full -rotate-90">
        <circle cx="38" cy="38" r={radius} fill="none" stroke="rgba(248,113,113,0.55)" strokeWidth="8" />
        <circle
          cx="38" cy="38" r={radius} fill="none" stroke="#38bdf8" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          style={{ transition: 'stroke-dasharray 700ms cubic-bezier(0.22,0.8,0.28,1)' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="text-base font-black text-white">{winRate}%</span>
      </div>
    </div>
  );
}

function ChampionList({ champions }: { champions: ChampionStat[] }) {
  return (
    <article className="surface rounded-2xl p-5">
      <h3 className="mb-3.5 text-xs font-bold uppercase tracking-wider text-slate-400">Campeones más jugados</h3>
      <div className="space-y-3">
        {champions.map((champion) => (
          <div key={champion.champion} className="flex items-center gap-3">
            {champion.imageUrl
              ? <img src={champion.imageUrl} alt="" loading="lazy" className="h-9 w-9 flex-shrink-0 rounded-lg ring-1 ring-white/10" />
              : <div className="h-9 w-9 flex-shrink-0 rounded-lg bg-white/5" />}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{champion.champion}</p>
              <p className="text-xs text-slate-500">{champion.games} {champion.games === 1 ? 'partida' : 'partidas'} · {champion.kda} KDA</p>
            </div>
            <div className="text-right">
              <p className={`text-sm font-bold ${champion.winRate >= 60 ? 'text-amber-300' : champion.winRate >= 50 ? 'text-sky-300' : 'text-slate-400'}`}>
                {champion.winRate}%
              </p>
              <p className="text-[11px] text-slate-600">{champion.wins}V {champion.games - champion.wins}D</p>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function RoleList({ roles }: { roles: RoleStat[] }) {
  return (
    <article className="surface rounded-2xl p-5">
      <h3 className="mb-3.5 text-xs font-bold uppercase tracking-wider text-slate-400">Posiciones preferidas</h3>
      <div className="space-y-2.5">
        {roles.map((role) => (
          <div key={role.role} className="flex items-center gap-3">
            <span className="w-16 flex-shrink-0 text-xs text-slate-400">{ROLE_LABELS[role.role] ?? role.role}</span>
            <div className="meter flex-1" style={{ height: 5 }}>
              <div className="meter-fill" style={{ width: `${role.share}%` }} />
            </div>
            <span className="w-9 flex-shrink-0 text-right text-xs font-semibold text-slate-300">{role.share}%</span>
          </div>
        ))}
      </div>
    </article>
  );
}

function MatchRow({ match, valorant, expanded, onToggle }: { match: MatchSummary; valorant: boolean; expanded: boolean; onToggle: () => void }) {
  const remake = match.remake && !match.win;
  const accent = remake ? '#64748b' : match.win ? '#38bdf8' : '#f87171';
  const background = remake ? 'rgba(100,116,139,0.06)' : match.win ? 'rgba(56,189,248,0.06)' : 'rgba(248,113,113,0.06)';
  const multiKill = (match.pentaKills ?? 0) > 0 ? 'PENTA KILL'
    : (match.quadraKills ?? 0) > 0 ? 'QUADRA KILL'
      : (match.tripleKills ?? 0) > 0 ? 'TRIPLE KILL'
        : (match.doubleKills ?? 0) > 0 ? 'DOBLE KILL' : null;

  return (
    <article
      className="relative border-b border-white/[0.06] transition-colors hover:bg-white/[0.02]"
      style={{ background }}
    >
      {/* Banda de resultado a la izquierda */}
      <span className="absolute inset-y-0 left-0 w-1" style={{ background: accent }} aria-hidden="true" />

      <div className="flex flex-col gap-4 py-4 pl-5 pr-4 sm:flex-row sm:items-center">
        {/* Cola, resultado y duración */}
        <div className="w-[92px] flex-shrink-0">
          <p className="truncate text-xs font-semibold text-slate-300">{match.queue}</p>
          <p className="mt-0.5 text-[11px] text-slate-500">{relativeTime(match.playedAt)}</p>
          <p className="mt-2 text-xs font-bold" style={{ color: accent }}>
            {remake ? 'Remake' : match.win ? 'Victoria' : 'Derrota'}
          </p>
          <p className="text-[11px] text-slate-500">{duration(match.durationSeconds)}</p>
        </div>

        {/* Campeón, hechizos y runas */}
        <div className="flex flex-shrink-0 items-center gap-2">
          <div className="relative">
            {match.championImageUrl
              ? <img src={match.championImageUrl} alt={match.champion} loading="lazy" className="h-12 w-12 rounded-xl ring-1 ring-white/10" />
              : <div className="grid h-12 w-12 place-items-center rounded-xl bg-white/5 text-xs text-slate-400">{match.champion.slice(0, 2)}</div>}
            {match.championLevel !== undefined && (
              <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-[#0b111d] text-[10px] font-bold text-slate-300 ring-1 ring-white/15">
                {match.championLevel}
              </span>
            )}
          </div>
          {!valorant && (
            <>
              <div className="flex flex-col gap-1">
                {(match.spells ?? []).map((spell, i) => (
                  spell.imageUrl
                    ? <img key={i} src={spell.imageUrl} alt={spell.name ?? ''} title={spell.name} loading="lazy" className="h-[22px] w-[22px] rounded-md ring-1 ring-white/10" />
                    : <span key={i} className="h-[22px] w-[22px] rounded-md bg-white/5" />
                ))}
              </div>
              <div className="flex flex-col gap-1">
                {(match.runes ?? []).map((rune, i) => (
                  rune.imageUrl
                    ? <img key={i} src={rune.imageUrl} alt={rune.name ?? ''} title={rune.name} loading="lazy" className="h-[22px] w-[22px] rounded-full bg-black/40 ring-1 ring-white/10" />
                    : <span key={i} className="h-[22px] w-[22px] rounded-full bg-white/5" />
                ))}
              </div>
            </>
          )}
        </div>

        {/* KDA */}
        <div className="w-[118px] flex-shrink-0">
          <p className="text-sm font-bold text-white">
            {match.kills} <span className="text-slate-600">/</span> <span className="text-red-400">{match.deaths}</span> <span className="text-slate-600">/</span> {match.assists}
          </p>
          <p className={`mt-0.5 text-xs font-bold ${kdaColor(match.kda)}`}>{match.kda.toFixed(2)} KDA</p>
          {match.killParticipation !== undefined && !valorant && (
            <p className="mt-0.5 text-[11px] text-slate-500">P/Kill {match.killParticipation}%</p>
          )}
          {multiKill && (
            <span className="mt-1.5 inline-block rounded-md bg-amber-400/15 px-2 py-0.5 text-[10px] font-bold text-amber-300">{multiKill}</span>
          )}
        </div>

        {/* Métricas secundarias */}
        <div className="w-[110px] flex-shrink-0 text-[11px] text-slate-400">
          {valorant ? (
            <>
              <p><Crosshair className="mr-1 inline h-3 w-3" />{match.score ?? 0} pts</p>
              <p className="mt-1">{match.damage ?? 0} daño</p>
              <p className="mt-1">{match.headshots ?? 0} HS</p>
            </>
          ) : (
            <>
              <p><Sword className="mr-1 inline h-3 w-3" />{match.cs} CS <span className="text-slate-600">({match.csPerMin ?? 0}/min)</span></p>
              <p className="mt-1"><Eye className="mr-1 inline h-3 w-3" />{match.visionScore} visión</p>
              <p className="mt-1 text-slate-500">{ROLE_LABELS[match.role] ?? match.role}</p>
            </>
          )}
        </div>

        {/* Objetos */}
        {!valorant && (
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1">
              {(match.items ?? Array.from({ length: 6 }, () => null)).map((item, i) => (
                item?.imageUrl
                  ? <img key={i} src={item.imageUrl} alt="" loading="lazy" className="h-[26px] w-[26px] rounded-md ring-1 ring-white/10" />
                  : <span key={i} className="h-[26px] w-[26px] rounded-md bg-white/[0.04] ring-1 ring-white/5" />
              ))}
              {match.trinket?.imageUrl && (
                <img src={match.trinket.imageUrl} alt="" loading="lazy" className="ml-1 h-[26px] w-[26px] rounded-full ring-1 ring-white/10" />
              )}
            </div>
          </div>
        )}

        {!valorant && (
          <button
            onClick={onToggle}
            className="ghost-button flex-shrink-0 self-start px-3 py-2 text-xs font-semibold sm:self-center"
          >
            {expanded ? 'Contraer' : 'Detalle'}
          </button>
        )}
      </div>
    </article>
  );
}

/** Esqueleto con brillo mientras se consulta Riot Games — evita el salto de layout del spinner. */
function DashboardSkeleton() {
  return (
    <div className="anim-fade-in grid items-start gap-4 lg:grid-cols-[340px_1fr]" aria-busy="true" aria-label="Cargando estadísticas">
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="surface rounded-2xl p-5">
            <div className="skeleton h-3 w-24" />
            <div className="mt-4 flex items-center gap-4">
              <div className="skeleton h-16 w-16 rounded-2xl" />
              <div className="flex-1">
                <div className="skeleton h-4 w-28" />
                <div className="skeleton mt-2 h-3 w-20" />
                <div className="skeleton mt-2 h-3 w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="surface overflow-hidden rounded-2xl">
        <div className="border-b border-white/10 px-5 py-4">
          <div className="skeleton h-4 w-40" />
          <div className="skeleton mt-2 h-3 w-64" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-white/[0.06] px-5 py-4">
            <div className="w-[92px]"><div className="skeleton h-3 w-20" /><div className="skeleton mt-2 h-3 w-14" /></div>
            <div className="skeleton h-12 w-12 rounded-xl" />
            <div className="w-[118px]"><div className="skeleton h-4 w-24" /><div className="skeleton mt-2 h-3 w-16" /></div>
            <div className="hidden flex-1 gap-1 sm:flex">
              {Array.from({ length: 6 }).map((__, j) => <div key={j} className="skeleton h-[26px] w-[26px] rounded-md" />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
