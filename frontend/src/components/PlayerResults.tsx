import { UserPlus, Send, Eye, Mic, MicOff } from 'lucide-react';
import type { Player } from '../types';
import ReputationBadges from './ReputationBadges';

interface PlayerResultsProps {
  players: Player[];
  loading: boolean;
  searched: boolean;
}

function CompatibilityRing({ value }: { value: number }) {
  const color = value >= 90 ? '#10B981' : value >= 80 ? '#7C3AED' : '#3B82F6';
  return (
    <div className="relative w-14 h-14 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
        <circle
          cx="28" cy="28" r="24" fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${(value / 100) * 150.8} 150.8`}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
        {value}%
      </span>
    </div>
  );
}

export default function PlayerResults({ players, loading, searched }: PlayerResultsProps) {
  if (!searched && !loading) return null;

  return (
    <section className="mb-8">
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
        Resultados
      </h3>

      {loading && (
        <div className="glass rounded-2xl p-12 text-center">
          <div className="w-10 h-10 border-2 border-brand-violet border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Buscando jugadores compatibles...</p>
        </div>
      )}

      {!loading && searched && players.length === 0 && (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-slate-400">No se encontraron jugadores con esos filtros.</p>
        </div>
      )}

      {!loading && players.length > 0 && (
        <div className="grid gap-4">
          {players.map((player) => (
            <div
              key={player.id}
              className="glass rounded-2xl p-5 hover:bg-white/[0.03] transition-all duration-300
                hover:ring-1 hover:ring-brand-violet/30 group"
            >
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="relative flex-shrink-0">
                    <img
                      src={player.avatar}
                      alt={player.username}
                      className="w-14 h-14 rounded-2xl ring-2 ring-white/10 group-hover:ring-brand-violet/50 transition-all"
                    />
                    <span
                      className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-brand-dark
                        ${player.online ? 'bg-emerald-400' : 'bg-slate-500'}`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-white text-lg">{player.username}</h4>
                      {player.hasMic ? (
                        <Mic className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <MicOff className="w-4 h-4 text-slate-500" />
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 mb-2 text-xs">
                      <span className="px-2 py-0.5 rounded-lg bg-brand-violet/20 text-brand-violet font-medium">
                        {player.rank}
                      </span>
                      {player.roles.map((r) => (
                        <span key={r} className="px-2 py-0.5 rounded-lg bg-white/5 text-slate-300">{r}</span>
                      ))}
                      {player.languages.map((l) => (
                        <span key={l} className="px-2 py-0.5 rounded-lg bg-brand-blue/10 text-brand-blue">{l}</span>
                      ))}
                    </div>

                    <ReputationBadges reputation={player.reputation} badges={player.badges} />

                    <p className="text-xs text-slate-500 mt-2">
                      {player.online ? (
                        <span className="text-emerald-400">En línea</span>
                      ) : (
                        player.lastSeen
                      )}
                      {' · '}{player.playstyle} · {player.availability}
                    </p>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end gap-3">
                  {player.compatibility !== undefined && (
                    <CompatibilityRing value={player.compatibility} />
                  )}

                  <div className="flex gap-2">
                    <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-all">
                      <Eye className="w-3.5 h-3.5" /> Ver Perfil
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-violet/20 text-xs font-medium text-brand-violet hover:bg-brand-violet/30 transition-all">
                      <Send className="w-3.5 h-3.5" /> Invitar
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-blue/20 text-xs font-medium text-brand-blue hover:bg-brand-blue/30 transition-all">
                      <UserPlus className="w-3.5 h-3.5" /> Agregar Amigo
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
