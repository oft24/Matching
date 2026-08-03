import { useState } from 'react';
import { BarChart3, Clock3, Crosshair, Gamepad2, ShieldCheck, Swords, Target, Trophy } from 'lucide-react';
import type { Dashboard } from '../types';
import MatchDetailModal from './MatchDetailModal';

interface DashboardPanelProps {
  data: Dashboard | null;
  game: 'lol' | 'valorant';
  onGameChange: (game: 'lol' | 'valorant') => void;
  queue: 'solo' | 'flex';
  onQueueChange: (queue: 'solo' | 'flex') => void;
}

function duration(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function playedDate(value: string) {
  return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

export default function DashboardPanel({ data, game, onGameChange, queue, onQueueChange }: DashboardPanelProps) {
  const valorant = game === 'valorant';
  const recent = data?.stats?.recent;
  const primaryRank = data?.stats?.ranked[0];
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  return (
    <section className="mx-auto mb-8 max-w-6xl">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="section-kicker">RIOT GAMES</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Rendimiento de {valorant ? 'Valorant' : 'League of Legends'}</h2>
          {data?.riotAccount && <p className="mt-1 text-sm text-slate-400">{data.riotAccount.gameName}#{data.riotAccount.tagLine} · {data.riotAccount.region.toUpperCase()}</p>}
        </div>
        <div className="flex items-center gap-3">
          {data?.stats && <span className="hidden items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs font-medium text-emerald-300 md:inline-flex"><ShieldCheck className="h-4 w-4" /> Cuenta verificada</span>}
          <div className="grid grid-cols-2 rounded-lg border border-white/10 bg-[#101827] p-1">
            <button onClick={() => onGameChange('lol')} className={`rounded-md px-3 py-2 text-xs font-semibold ${!valorant ? 'bg-indigo-500 text-white' : 'text-slate-400'}`}>League</button>
            <button onClick={() => onGameChange('valorant')} className={`rounded-md px-3 py-2 text-xs font-semibold ${valorant ? 'bg-red-500 text-white' : 'text-slate-400'}`}>Valorant</button>
          </div>
        </div>
      </div>

      {!valorant && <div className="mb-5 flex items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div><p className="text-sm font-semibold text-white">Cola clasificatoria</p><p className="mt-1 text-xs text-slate-500">Rango, estadísticas e historial por cola.</p></div>
        <div className="grid grid-cols-2 rounded-lg border border-white/10 bg-[#101827] p-1">
          <button onClick={() => onQueueChange('solo')} className={`rounded-md px-4 py-2 text-xs font-semibold ${queue === 'solo' ? 'bg-indigo-500 text-white' : 'text-slate-400'}`}>Solo/Duo</button>
          <button onClick={() => onQueueChange('flex')} className={`rounded-md px-4 py-2 text-xs font-semibold ${queue === 'flex' ? 'bg-indigo-500 text-white' : 'text-slate-400'}`}>Flex</button>
        </div>
      </div>}

      {!data ? <div className="glass rounded-xl p-12 text-center"><div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-brand-violet border-t-transparent" /><p className="text-slate-400">Consultando Riot Games...</p></div> : <>
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard icon={Trophy} label="Rango" value={primaryRank ? `${primaryRank.tier} ${primaryRank.rank}`.trim() : 'Sin rango'} detail={primaryRank && !valorant ? `${primaryRank.leaguePoints} LP · ${primaryRank.queue}` : primaryRank?.queue} />
          <StatCard icon={Target} label="Win rate reciente" value={recent ? `${recent.winRate}%` : '—'} detail={recent ? `${recent.wins}V · ${recent.losses}D` : undefined} />
          <StatCard icon={Swords} label="KDA promedio" value={recent ? String(recent.kda) : '—'} detail="Últimas 5 partidas" />
          <StatCard icon={valorant ? Crosshair : BarChart3} label={valorant ? 'Puntuación promedio' : 'CS promedio'} value={recent ? String(valorant ? recent.avgScore ?? 0 : recent.cs) : '—'} detail={valorant && recent ? `${recent.avgDamage ?? 0} daño · ${recent.headshots ?? 0} HS` : 'Por partida'} />
        </div>

        {data.stats?.ranked.length ? <div className="mb-6 grid gap-3 sm:grid-cols-2">{data.stats.ranked.map((rank) => <article key={rank.queue} className="rounded-xl border border-white/10 bg-[#101827] p-5"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-medium text-slate-500">{rank.queue}</p><p className="mt-1 text-lg font-semibold text-white">{rank.tier} {rank.rank}{!valorant && ` · ${rank.leaguePoints} LP`}</p></div><p className="text-sm font-semibold text-indigo-300">{rank.winRate}% WR</p></div><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500" style={{ width: `${rank.winRate}%` }} /></div><p className="mt-2 text-xs text-slate-500">{rank.wins} victorias · {rank.losses} derrotas</p></article>)}</div> : null}

        <div className="overflow-hidden rounded-xl border border-white/10 bg-[#101827]">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4"><div><h3 className="font-semibold text-white">Partidas recientes</h3><p className="mt-1 text-xs text-slate-500">Cola, rendimiento y resultado directamente desde Riot Games</p></div><Gamepad2 className="h-5 w-5 text-indigo-300" /></div>
          {data.matchHistory.length ? <div className="divide-y divide-white/8">{data.matchHistory.map((match) => <div key={match.id}><article className="grid items-center gap-4 px-5 py-4 sm:grid-cols-[auto_92px_1fr_auto]">
            <img src={match.championImageUrl ?? ''} alt={match.champion} className="h-12 w-12 rounded-lg object-cover ring-1 ring-white/10" />
            <div className={`inline-flex w-fit items-center rounded-md px-2.5 py-1 text-xs font-semibold ${match.win ? 'bg-emerald-400/10 text-emerald-300' : 'bg-red-400/10 text-red-300'}`}>{match.win ? 'Victoria' : 'Derrota'}</div>
            <div className="min-w-0"><div className="flex flex-wrap items-center gap-x-3 gap-y-1"><h4 className="font-semibold text-white">{match.champion}</h4><span className="text-sm text-slate-300">{match.kills} / {match.deaths} / {match.assists}</span><span className="text-xs text-indigo-300">{match.kda} KDA</span>{valorant && match.rank && <span className="text-xs text-amber-300">{match.rank}</span>}</div><p className="mt-1 text-xs text-slate-500">{match.queue} · {match.role} · {valorant ? `${match.score ?? 0} pts · ${match.damage ?? 0} daño · ${match.headshots ?? 0} HS` : `${match.cs} CS · ${match.visionScore} visión`}</p></div>
            <div className="flex items-center gap-3 text-xs text-slate-500 sm:flex-col sm:items-end sm:gap-1"><span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> {duration(match.durationSeconds)}</span><span>{playedDate(match.playedAt)}</span>{!valorant && <button onClick={() => setSelectedMatchId((current) => current === match.id ? null : match.id)} className="mt-1 rounded-md border border-indigo-400/20 px-2.5 py-1.5 font-semibold text-indigo-300 hover:bg-indigo-400/10">{selectedMatchId === match.id ? 'Contraer' : 'Ver detalle'}</button>}</div>
          </article>{selectedMatchId === match.id && <MatchDetailModal matchId={match.id} queue={queue} onClose={() => setSelectedMatchId(null)} />}</div>)}</div> : <div className="p-10 text-center"><Gamepad2 className="mx-auto mb-3 h-9 w-9 text-slate-600" /><p className="text-sm text-slate-400">{data.message}</p>{valorant && <p className="mx-auto mt-3 max-w-xl text-xs leading-5 text-slate-500">Valorant requiere Riot Sign On y una clave de producción aprobada para compartir estadísticas personales.</p>}</div>}
        </div>
      </>}
    </section>
  );
}

function StatCard({ icon: Icon, label, value, detail }: { icon: typeof Trophy; label: string; value: string; detail?: string }) {
  return <article className="rounded-xl border border-white/10 bg-[#101827] p-4"><div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.035]"><Icon className="h-4 w-4 text-indigo-300" /></div><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-lg font-semibold text-white sm:text-xl">{value}</p>{detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}</article>;
}
