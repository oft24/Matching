import { useEffect, useState } from 'react';
import { ArrowLeft, BarChart3, Eye, Loader2, Swords, Trophy, X } from 'lucide-react';
import { fetchLeagueMatch, fetchLeaguePlayer } from '../lib/api';
import type { LeagueMatchDetail, LeagueMatchParticipant, LeaguePublicPlayer } from '../types';

interface Props {
  matchId: string;
  queue: 'solo' | 'flex';
  onClose: () => void;
}

export default function MatchDetailModal({ matchId, queue, onClose }: Props) {
  const [match, setMatch] = useState<LeagueMatchDetail | null>(null);
  const [selected, setSelected] = useState<LeagueMatchParticipant | null>(null);
  const [profile, setProfile] = useState<LeaguePublicPlayer | null>(null);
  const [error, setError] = useState('');

  useEffect(() => { fetchLeagueMatch(matchId).then(setMatch).catch(() => setError('No se pudo cargar esta partida.')); }, [matchId]);
  const openPlayer = (player: LeagueMatchParticipant) => {
    setSelected(player);
    setProfile(null);
    fetchLeaguePlayer(player.puuid, queue).then(setProfile).catch(() => setError('No se pudo cargar ese jugador.'));
  };

  return <div className="match-detail-expand border-t border-indigo-400/20 bg-[#090f1a]">
      <div>
        <header className="flex items-center justify-between border-b border-white/10 bg-indigo-500/[0.035] px-4 py-4 sm:px-6">
          <div>{selected ? <button onClick={() => { setSelected(null); setProfile(null); }} className="flex items-center gap-2 text-sm text-slate-300 hover:text-white"><ArrowLeft className="h-4 w-4" /> Volver a la partida</button> : <><h2 className="font-semibold text-white">Detalle de partida</h2>{match && <p className="mt-1 text-xs text-slate-500">{match.queue} · {Math.floor(match.durationSeconds / 60)} min</p>}</>}</div>
          <button title="Contraer detalle" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-slate-400 hover:text-white"><X className="h-4 w-4" /></button>
        </header>
        <div className="p-4 sm:p-6">
          {error && <p className="mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}
          {selected ? <PlayerDashboard player={selected} profile={profile} queue={queue} /> : !match ? <div className="grid min-h-80 place-items-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-400" /></div> : <MatchTeams match={match} onPlayer={openPlayer} />}
        </div>
      </div>
  </div>;
}

function MatchTeams({ match, onPlayer }: { match: LeagueMatchDetail; onPlayer: (player: LeagueMatchParticipant) => void }) {
  return <div className="space-y-6">{[100, 200].map((teamId) => {
    const players = match.participants.filter((player) => player.teamId === teamId);
    const team = match.teams.find((item) => item.teamId === teamId);
    return <section key={teamId}>
      <div className="mb-3 flex items-center justify-between"><h3 className={`font-semibold ${team?.win ? 'text-emerald-300' : 'text-red-300'}`}>{team?.win ? 'Victoria' : 'Derrota'} · Equipo {teamId === 100 ? 'azul' : 'rojo'}</h3><p className="text-xs text-slate-500">{team?.objectives?.champion?.kills ?? 0} torres · {team?.objectives?.dragon?.kills ?? 0} dragones</p></div>
      <div className="overflow-x-auto rounded-lg border border-white/10"><div className="min-w-[820px] divide-y divide-white/8">{players.map((player) => <PlayerRow key={player.puuid} player={player} version={match.dataDragonVersion} onOpen={() => onPlayer(player)} />)}</div></div>
    </section>;
  })}</div>;
}

function PlayerRow({ player, version, onOpen }: { player: LeagueMatchParticipant; version: string; onOpen: () => void }) {
  return <button onClick={onOpen} className="grid w-full grid-cols-[260px_110px_70px_90px_100px_1fr] items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.035]">
    <span className="flex min-w-0 items-center gap-3"><img src={player.championImageUrl ?? ''} alt={player.champion} className="h-11 w-11 rounded-lg object-cover" /><span className="min-w-0"><strong className="block truncate text-sm text-white">{player.riotIdGameName}{player.riotIdTagLine && `#${player.riotIdTagLine}`}</strong><small className="text-slate-500">{player.champion} · {player.position}</small></span></span>
    <span className="text-sm font-semibold text-slate-200">{player.kills} / {player.deaths} / {player.assists}</span>
    <span className="text-xs text-indigo-300">{player.kda} KDA</span>
    <span className="text-xs text-slate-400">{player.cs} CS</span>
    <span className="text-xs text-slate-400">{player.damage.toLocaleString()} daño</span>
    <span className="flex gap-1">{player.items.map((item) => <img key={item} src={`https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${item}.png`} alt={`Objeto ${item}`} className="h-7 w-7 rounded border border-white/10" />)}</span>
  </button>;
}

function PlayerDashboard({ player, profile, queue }: { player: LeagueMatchParticipant; profile: LeaguePublicPlayer | null; queue: 'solo' | 'flex' }) {
  if (!profile) return <div className="grid min-h-80 place-items-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-400" /></div>;
  const rank = profile.ranked[0];
  return <div>
    <div className="mb-6 flex items-center gap-4"><img src={player.championImageUrl ?? ''} alt={player.champion} className="h-20 w-20 rounded-xl object-cover" /><div><p className="text-xs font-semibold uppercase text-indigo-300">Dashboard {queue === 'solo' ? 'Solo/Duo' : 'Flex'}</p><h2 className="mt-1 text-2xl font-bold text-white">{profile.account.gameName}#{profile.account.tagLine}</h2><p className="text-sm text-slate-400">Jugó {player.champion} en esta partida</p></div></div>
    <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4"><MiniStat icon={Trophy} label="Rango" value={rank ? `${rank.tier} ${rank.rank}` : 'Sin rango'} /><MiniStat icon={BarChart3} label="Win rate" value={`${profile.recent.winRate}%`} /><MiniStat icon={Swords} label="KDA" value={String(profile.recent.kda)} /><MiniStat icon={Eye} label="CS promedio" value={String(profile.recent.cs)} /></div>
    <h3 className="mb-3 text-sm font-semibold text-slate-300">Partidas recientes</h3><div className="divide-y divide-white/8 overflow-hidden rounded-lg border border-white/10">{profile.matches.map((match) => <div key={match.id} className="flex items-center gap-3 px-4 py-3"><img src={match.championImageUrl ?? ''} alt={match.champion} className="h-10 w-10 rounded-lg" /><span className="flex-1"><strong className="block text-sm text-white">{match.champion}</strong><small className="text-slate-500">{match.queue}</small></span><span className="text-sm text-slate-300">{match.kills} / {match.deaths} / {match.assists}</span><span className={match.win ? 'text-emerald-300' : 'text-red-300'}>{match.win ? 'Victoria' : 'Derrota'}</span></div>)}</div>
  </div>;
}

function MiniStat({ icon: Icon, label, value }: { icon: typeof Trophy; label: string; value: string }) {
  return <div className="rounded-lg border border-white/10 bg-white/[0.025] p-4"><Icon className="mb-3 h-4 w-4 text-indigo-300" /><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-lg font-semibold text-white">{value}</p></div>;
}
