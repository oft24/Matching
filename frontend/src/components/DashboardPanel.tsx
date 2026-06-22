import { Users, Mail, Trophy, BarChart3, Clock } from 'lucide-react';
import type { Dashboard } from '../types';

interface DashboardPanelProps {
  data: Dashboard | null;
  onOpenLogin?: () => void;
}

export default function DashboardPanel({ data }: DashboardPanelProps) {
  if (!data) {
    return (
      <section className="mb-8">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Tu dashboard
        </h3>
        <div className="glass rounded-2xl p-12 text-center">
          <div className="w-10 h-10 border-2 border-brand-violet border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Cargando dashboard...</p>
        </div>
      </section>
    );
  }

  const pct = Math.round((data.xp / data.xpToNext) * 100);

  return (
    <section className="mb-8">
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
        Tu dashboard
      </h3>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="glass rounded-2xl p-4 hover:bg-white/5 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-brand-violet" />
            <span className="text-xs text-slate-400">Nivel</span>
          </div>
          <p className="text-2xl font-bold text-white">{data.level}</p>
          <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-brand-violet to-brand-blue rounded-full" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="glass rounded-2xl p-4 hover:bg-white/5 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-slate-400">Amigos en línea</span>
          </div>
          <p className="text-2xl font-bold text-white">{data.friendsOnline}</p>
        </div>

        <div className="glass rounded-2xl p-4 hover:bg-white/5 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="w-4 h-4 text-brand-blue" />
            <span className="text-xs text-slate-400">Invitaciones</span>
          </div>
          <p className="text-2xl font-bold text-white">{data.pendingInvites}</p>
        </div>

        <div className="glass rounded-2xl p-4 hover:bg-white/5 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-slate-400">Compatibilidad media</span>
          </div>
          <p className="text-2xl font-bold text-white">{data.stats.avgCompatibility}%</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-5">
          <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" /> Historial de partidas
          </h4>
          <div className="space-y-2">
            {data.matchHistory.map((m) => (
              <div key={m.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div>
                  <p className="text-sm text-white font-medium">{m.game}</p>
                  <p className="text-xs text-slate-500">{m.date} · {m.teammates} compañeros</p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-lg
                  ${m.result === 'Victoria' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                  {m.result}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-slate-400" /> Estadísticas de matchmaking
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold text-white">{data.stats.totalMatches}</p>
              <p className="text-xs text-slate-500">Partidas totales</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-400">{data.stats.successfulMatches}</p>
              <p className="text-xs text-slate-500">Exitosas</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-violet">{data.stats.teammatesFound}</p>
              <p className="text-xs text-slate-500">Compañeros encontrados</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-blue">{data.stats.avgCompatibility}%</p>
              <p className="text-xs text-slate-500">Compatibilidad media</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
