import { Mic, MicOff } from 'lucide-react';
import type { SearchFilters } from '../types';

interface FilterSelectProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}

function FilterSelect({ label, value, options, onChange }: FilterSelectProps) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1.5 font-medium">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full glass rounded-2xl px-3 py-2.5 text-sm text-white bg-transparent
          border border-white/10 focus:border-brand-violet/50 focus:outline-none
          transition-colors cursor-pointer appearance-none"
      >
        {options.map((opt) => (
          <option key={opt} value={opt} className="bg-brand-dark">{opt}</option>
        ))}
      </select>
    </div>
  );
}

interface MatchmakingPanelProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  onSearch: () => void;
  loading: boolean;
  hideSearchButton?: boolean;
}

const REGIONS = ['LAN', 'LAS', 'NA', 'EUW', 'BR'];
const LANGUAGES = ['Español', 'Inglés', 'Portugués', 'Francés'];
const MATCH_TYPES = ['Ranked', 'Casual', 'Torneo', 'Flex', 'ARAM'];
const RANKS = ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master+'];
const ROLES = ['Any', 'Top', 'Jungle', 'Mid', 'ADC', 'Support', 'Duelist', 'Initiator', 'Controller', 'Sentinel'];
const AGES = ['16-18', '18-25', '25-30', '30+'];
const AVAILABILITY = ['Mañanas', 'Tardes', 'Noches', 'Fines de semana', 'Diario'];
const PLAYSTYLES = ['Competitivo', 'Casual competitivo', 'Cooperativo', 'Estratégico', 'Agresivo'];
const OBJECTIVES = ['Subir de rango', 'Diversión en equipo', 'Mejorar habilidades', 'Torneos amateur', 'Ranked grind'];
const ACTIVITY = ['Bajo', 'Medio', 'Alto'];

export default function MatchmakingPanel({ filters, onChange, onSearch, loading, hideSearchButton }: MatchmakingPanelProps) {
  const update = (key: keyof SearchFilters, value: string | boolean) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <section className="mb-8">
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
        2. Configura tu búsqueda y matchmaking
      </h3>
      <div className="glass rounded-2xl p-5 lg:p-6 space-y-6">
        <div>
          <p className="text-xs text-slate-500 mb-3 font-medium uppercase tracking-wide">Filtros básicos</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <FilterSelect label="Región" value={filters.region} options={REGIONS} onChange={(v) => update('region', v)} />
            <FilterSelect label="Idioma" value={filters.language} options={LANGUAGES} onChange={(v) => update('language', v)} />
            <FilterSelect label="Tipo de partida" value={filters.matchType} options={MATCH_TYPES} onChange={(v) => update('matchType', v)} />
            <FilterSelect label="Rango" value={filters.rank} options={RANKS} onChange={(v) => update('rank', v)} />
            <FilterSelect label="Rol principal" value={filters.role} options={ROLES} onChange={(v) => update('role', v)} />
            <FilterSelect label="Edad" value={filters.age} options={AGES} onChange={(v) => update('age', v)} />
            <FilterSelect label="Disponibilidad" value={filters.availability} options={AVAILABILITY} onChange={(v) => update('availability', v)} />
          </div>
        </div>

        <div className="pt-4 border-t border-white/8">
          <p className="text-xs text-slate-500 mb-3 font-medium uppercase tracking-wide">Matchmaking avanzado</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <FilterSelect label="Estilo de juego" value={filters.playstyle} options={PLAYSTYLES} onChange={(v) => update('playstyle', v)} />
            <FilterSelect label="Objetivos" value={filters.objectives} options={OBJECTIVES} onChange={(v) => update('objectives', v)} />
            <FilterSelect label="Nivel de actividad" value={filters.activityLevel} options={ACTIVITY} onChange={(v) => update('activityLevel', v)} />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">Micrófono:</span>
            <button
              type="button"
              onClick={() => update('hasMic', true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium transition-all
                ${filters.hasMic
                  ? 'bg-brand-violet/20 text-brand-violet ring-1 ring-brand-violet/50'
                  : 'glass text-slate-400 hover:text-white'
                }`}
            >
              <Mic className="w-4 h-4" /> Sí
            </button>
            <button
              type="button"
              onClick={() => update('hasMic', false)}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium transition-all
                ${!filters.hasMic
                  ? 'bg-brand-violet/20 text-brand-violet ring-1 ring-brand-violet/50'
                  : 'glass text-slate-400 hover:text-white'
                }`}
            >
              <MicOff className="w-4 h-4" /> No
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-white/8">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={filters.verifiedOnly}
                onChange={(e) => update('verifiedOnly', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 rounded-full bg-white/10 peer-checked:bg-emerald-500/80 transition-colors" />
              <div className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
            </div>
            <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
              Solo perfiles verificados
            </span>
          </label>

          {!hideSearchButton && (
            <button
              type="button"
              onClick={onSearch}
              disabled={loading}
              className="gradient-btn w-full sm:w-auto px-8 py-3 rounded-2xl text-white font-bold text-sm
                tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Buscando...' : 'BUSCAR JUGADORES'}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
