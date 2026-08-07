import { useState } from 'react';
import { ChevronDown, Mic, MicOff, RotateCcw, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import type { SearchFilters } from '../types';
import { GAME_RANKS } from '../data/gameRanks';

const REGIONS = ['LAN', 'LAS', 'NA', 'EUW', 'BR'];
const LANGUAGES = ['Español', 'Inglés', 'Portugués', 'Francés'];
const MATCH_TYPES = ['Ranked', 'Casual', 'Torneo', 'Flex', 'ARAM'];
const ROLES = ['Any', 'Top', 'Jungle', 'Mid', 'ADC', 'Support', 'Duelist', 'Initiator', 'Controller', 'Sentinel'];
const AGES = ['16-18', '18-25', '25-30', '30+'];
const PLAYSTYLES = ['Competitivo', 'Casual competitivo', 'Cooperativo', 'Estratégico', 'Agresivo'];
const OBJECTIVES = ['Subir de rango', 'Diversión en equipo', 'Mejorar habilidades', 'Torneos amateur', 'Ranked grind'];
const ACTIVITY = ['Bajo', 'Medio', 'Alto'];

const GENDER_LABELS: Record<string, string> = { any: 'Cualquiera', man: 'Hombres', woman: 'Mujeres' };

interface MatchmakingPanelProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  onSearch: () => void;
  loading: boolean;
  hideSearchButton?: boolean;
  disabled?: boolean;
  /** Filtros por defecto, para el botón de restablecer. */
  defaults?: SearchFilters;
}

export default function MatchmakingPanel({ filters, onChange, onSearch, loading, hideSearchButton, disabled, defaults }: MatchmakingPanelProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const ranks = GAME_RANKS[filters.game] ?? ['Sin rango'];
  const update = (key: keyof SearchFilters, value: string | boolean) => onChange({ ...filters, [key]: value });

  // Resumen visible de lo que se está buscando, para no tener que releer todos los selectores
  const summary = [
    filters.region,
    filters.rank,
    filters.role === 'Any' ? 'Cualquier rol' : filters.role,
    filters.matchType,
    filters.language,
    filters.hasMic ? 'Con micro' : 'Sin micro',
    ...(filters.verifiedOnly ? ['Solo verificados'] : []),
  ];

  return (
    <section
      aria-disabled={disabled}
      className={`surface rounded-2xl transition-opacity ${disabled ? 'pointer-events-none select-none opacity-55' : ''}`}
    >
      {/* Cabecera con el resumen de la búsqueda */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] px-5 py-4">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {summary.map((item) => (
            <span key={item} className="rounded-lg bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-slate-300 ring-1 ring-white/[0.06]">
              {item}
            </span>
          ))}
        </div>
        {defaults && (
          <button
            type="button"
            onClick={() => onChange({ ...defaults, game: filters.game })}
            className="flex flex-shrink-0 items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Restablecer
          </button>
        )}
      </div>

      <div className="space-y-5 p-5">
        <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3 lg:grid-cols-4">
          <Field label="Región" value={filters.region} options={REGIONS} onChange={(v) => update('region', v)} />
          <Field label="Rango" value={filters.rank} options={ranks} onChange={(v) => update('rank', v)} />
          <Field label="Rol principal" value={filters.role} options={ROLES} onChange={(v) => update('role', v)} />
          <Field label="Tipo de partida" value={filters.matchType} options={MATCH_TYPES} onChange={(v) => update('matchType', v)} />
          <Field label="Idioma" value={filters.language} options={LANGUAGES} onChange={(v) => update('language', v)} />
          <Field label="Edad" value={filters.age} options={AGES} onChange={(v) => update('age', v)} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-medium text-slate-400">Micrófono</p>
            <Segmented
              options={[
                { value: 'yes', label: 'Sí', icon: <Mic className="h-3.5 w-3.5" /> },
                { value: 'no', label: 'No', icon: <MicOff className="h-3.5 w-3.5" /> },
              ]}
              value={filters.hasMic ? 'yes' : 'no'}
              onChange={(v) => update('hasMic', v === 'yes')}
            />
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-slate-400">Prefiero jugar con</p>
            <Segmented
              options={['any', 'man', 'woman'].map((value) => ({ value, label: GENDER_LABELS[value] }))}
              value={filters.preferredGender}
              onChange={(v) => update('preferredGender', v)}
            />
          </div>
        </div>

        {/* Preferencias avanzadas, plegadas para no saturar la vista */}
        <div className="rounded-xl border border-white/[0.08]">
          <button
            type="button"
            onClick={() => setAdvancedOpen((open) => !open)}
            aria-expanded={advancedOpen}
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-300">
              <SlidersHorizontal className="h-4 w-4 text-indigo-300" />
              Preferencias de equipo
            </span>
            <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${advancedOpen ? 'rotate-180' : ''}`} />
          </button>

          {advancedOpen && (
            <div className="anim-fade-up grid gap-3.5 border-t border-white/[0.08] p-4 sm:grid-cols-3">
              <Field label="Estilo de juego" value={filters.playstyle} options={PLAYSTYLES} onChange={(v) => update('playstyle', v)} />
              <Field label="Objetivos" value={filters.objectives} options={OBJECTIVES} onChange={(v) => update('objectives', v)} />
              <Field label="Nivel de actividad" value={filters.activityLevel} options={ACTIVITY} onChange={(v) => update('activityLevel', v)} />
            </div>
          )}
        </div>

        <div className="flex flex-col items-start justify-between gap-4 border-t border-white/[0.08] pt-4 sm:flex-row sm:items-center">
          <button
            type="button"
            role="switch"
            aria-checked={filters.verifiedOnly}
            onClick={() => update('verifiedOnly', !filters.verifiedOnly)}
            className="group flex items-center gap-3"
          >
            <span className={`toggle ${filters.verifiedOnly ? 'toggle-on' : ''}`} />
            <span className="flex items-center gap-1.5 text-sm text-slate-300 transition-colors group-hover:text-white">
              <ShieldCheck className={`h-4 w-4 ${filters.verifiedOnly ? 'text-emerald-400' : 'text-slate-500'}`} />
              Solo perfiles verificados
            </span>
          </button>

          {!hideSearchButton && (
            <button
              type="button"
              onClick={onSearch}
              disabled={loading}
              className="primary-button w-full px-8 py-3 text-sm font-bold tracking-wide disabled:opacity-50 sm:w-auto"
            >
              {loading ? 'Buscando...' : 'BUSCAR JUGADORES'}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function Field({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-400">{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-[#0b1220] py-2.5 pl-3 pr-9 text-sm
            text-white transition-colors hover:border-white/20 focus:border-brand-violet/60 focus:outline-none"
        >
          {options.map((option) => (
            <option key={option} value={option} className="bg-[#0b1220]">
              {GENDER_LABELS[option] ?? option}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      </div>
    </label>
  );
}

function Segmented({ options, value, onChange }: {
  options: Array<{ value: string; label: string; icon?: React.ReactNode }>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="inline-flex w-full rounded-xl border border-white/10 bg-[#0b1220] p-1">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-200
              ${active ? 'bg-brand-violet text-white shadow-[0_4px_14px_rgba(124,58,237,0.35)]' : 'text-slate-400 hover:text-white'}`}
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
