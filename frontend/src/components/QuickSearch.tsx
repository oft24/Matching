import { Settings, Shield, Star, Users } from 'lucide-react';
import type { SearchFilters } from '../types';

interface QuickSearchProps {
  filters: SearchFilters;
}

export default function QuickSearch({ filters }: QuickSearchProps) {
  return (
    <aside className="hidden xl:block w-72 flex-shrink-0 space-y-4">
      <div className="glass rounded-2xl p-5 sticky top-20">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Búsqueda rápida
        </h4>
        <div className="space-y-3 text-sm">
          <Row label="Juego" value={filters.game.toUpperCase()} />
          <Row label="Región" value={filters.region} />
          <Row label="Rango" value={filters.rank} />
          <Row label="Rol" value={filters.role} />
          <Row label="Idioma" value={filters.language} />
          <Row label="Estilo" value={filters.playstyle} />
          <Row label="Micrófono" value={filters.hasMic ? 'Sí' : 'No'} />
          {filters.verifiedOnly && (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
              <Shield className="w-3 h-3" /> Solo verificados
            </span>
          )}
        </div>
        <button className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-xl glass text-xs text-slate-400 hover:text-white transition-colors">
          <Settings className="w-3.5 h-3.5" /> Ver más filtros
        </button>
      </div>

      <div className="glass rounded-2xl p-5">
        <h4 className="font-semibold text-white text-sm mb-2">¿Nuevo por aquí?</h4>
        <p className="text-xs text-slate-500 mb-3">Aprende a encontrar tu equipo ideal en minutos.</p>
        <button className="w-full py-2 rounded-xl bg-brand-violet/20 text-brand-violet text-xs font-medium hover:bg-brand-violet/30 transition-colors">
          Ver guía
        </button>
      </div>
    </aside>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}

export function TrustFooter() {
  const items = [
    { icon: Shield, title: 'Perfiles verificados', desc: 'Identidad confirmada', color: 'text-emerald-400' },
    { icon: Star, title: 'Sistema de reputación', desc: 'Valoraciones de la comunidad', color: 'text-amber-400' },
    { icon: Users, title: 'Grupos y comunidades', desc: 'Conecta con tu squad', color: 'text-brand-blue' },
  ];

  return (
    <div className="grid sm:grid-cols-3 gap-4 mt-8">
      {items.map(({ icon: Icon, title, desc, color }) => (
        <div key={title} className="glass rounded-2xl p-5 flex items-center gap-4 hover:bg-white/5 transition-colors">
          <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-white text-sm">{title}</h4>
            <p className="text-xs text-slate-500">{desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
