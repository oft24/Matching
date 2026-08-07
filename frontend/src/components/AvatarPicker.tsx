import { useEffect, useState } from 'react';
import { Check, Loader2, Sparkles } from 'lucide-react';
import Avatar from './Avatar';
import { fetchAvatarOptions, saveProfile, type AvatarOptions } from '../lib/api';
import { useAuth } from '../context/AuthContext';

/**
 * Selector de foto de perfil: iniciales, el icono de LoL de la cuenta Riot conectada,
 * o cualquiera del catálogo de iconos de invocador de Data Dragon.
 */
export default function AvatarPicker() {
  const { user, updateUser } = useAuth();
  const [options, setOptions] = useState<AvatarOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAvatarOptions()
      .then(setOptions)
      .catch(() => setError('No se pudo cargar el catálogo de iconos.'))
      .finally(() => setLoading(false));
  }, []);

  const choose = async (url: string | null) => {
    if (saving) return;
    setSaving(url ?? 'initials');
    setError('');
    try {
      updateUser(await saveProfile(user?.gender ?? null, url));
    } catch {
      setError('No se pudo guardar el icono. Intenta de nuevo.');
    } finally {
      setSaving(null);
    }
  };

  const current = user?.avatar ?? null;

  return (
    <section className="mt-6 border-t border-white/[0.08] pt-6">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Foto de perfil</h3>
          <p className="mt-1 text-xs text-slate-500">
            Conecta tu Riot ID para usar tu icono de League, o elige uno del catálogo.
          </p>
        </div>
        <Avatar name={user?.username ?? ''} src={current} size={48} brand radius={14} />
      </div>

      {error && <p className="mb-3 text-xs text-red-400">{error}</p>}

      {loading ? (
        <div className="flex gap-2.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-14 w-14 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="stagger flex flex-wrap gap-2.5">
          <OptionButton
            label="Usar mis iniciales"
            selected={!current}
            busy={saving === 'initials'}
            onClick={() => choose(null)}
          >
            <Avatar name={user?.username ?? ''} size={56} brand radius={12} />
          </OptionButton>

          {options?.riot && (
            <OptionButton
              label={`Icono de LoL · ${options.riot.label}`}
              selected={current === options.riot.url}
              busy={saving === options.riot.url}
              onClick={() => choose(options.riot!.url)}
              highlight
            >
              <img src={options.riot.url} alt="" className="h-14 w-14 rounded-xl object-cover" />
              <span className="absolute -left-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-brand-violet text-white">
                <Sparkles className="h-3 w-3" />
              </span>
            </OptionButton>
          )}

          {options?.icons.map((icon) => (
            <OptionButton
              key={icon.id}
              label={`Icono ${icon.id}`}
              selected={current === icon.url}
              busy={saving === icon.url}
              onClick={() => choose(icon.url)}
            >
              <img src={icon.url} alt="" loading="lazy" className="h-14 w-14 rounded-xl object-cover" />
            </OptionButton>
          ))}
        </div>
      )}
    </section>
  );
}

function OptionButton({
  label, selected, busy, highlight, onClick, children,
}: {
  label: string;
  selected: boolean;
  busy: boolean;
  highlight?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={selected}
      disabled={busy}
      onClick={onClick}
      className={`relative rounded-xl border p-0.5 transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60
        ${selected
          ? 'border-brand-violet shadow-[0_0_0_2px_rgba(124,58,237,0.35)]'
          : highlight
            ? 'border-brand-violet/40 hover:border-brand-violet/70'
            : 'border-white/10 hover:border-white/30'}`}
    >
      {children}
      {selected && (
        <span className="anim-pop absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-brand-violet text-white">
          <Check className="h-3 w-3" strokeWidth={3} />
        </span>
      )}
      {busy && (
        <span className="absolute inset-0 grid place-items-center rounded-xl bg-black/50">
          <Loader2 className="h-4 w-4 animate-spin text-white" />
        </span>
      )}
    </button>
  );
}
