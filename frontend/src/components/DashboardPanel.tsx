import { Gamepad2, BarChart3, Trophy } from 'lucide-react';
import type { Dashboard } from '../types';

interface DashboardPanelProps {
  data: Dashboard | null;
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
          <p className="text-slate-400">Cargando...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
        Tu dashboard
      </h3>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-brand-violet" />
            <span className="text-xs text-slate-400">Nivel</span>
          </div>
          <p className="text-2xl font-bold text-white">{data.level}</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-brand-blue" />
            <span className="text-xs text-slate-400">XP</span>
          </div>
          <p className="text-2xl font-bold text-white">{data.xp}</p>
        </div>
        <div className="glass rounded-2xl p-4 col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 mb-2">
            <Gamepad2 className="w-4 h-4 text-red-400" />
            <span className="text-xs text-slate-400">Riot Games</span>
          </div>
          <p className="text-sm font-medium text-white">
            {data.riotConnected && data.riotAccount
              ? `${data.riotAccount.gameName}#${data.riotAccount.tagLine}`
              : 'No conectado'}
          </p>
        </div>
      </div>

      <div className="glass rounded-2xl p-10 text-center">
        <Gamepad2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <h4 className="text-lg font-bold text-white mb-2">Estadísticas Riot Games</h4>
        <p className="text-slate-400 text-sm max-w-md mx-auto">{data.message}</p>
        {!data.riotConnected && (
          <p className="text-brand-violet text-sm mt-4">
            Ve a <strong>Mi Perfil → Conexiones</strong> para configurar tu cuenta Riot.
          </p>
        )}
      </div>
    </section>
  );
}
