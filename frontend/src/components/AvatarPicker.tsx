import { useEffect, useState, type ReactNode } from 'react';
import { Check, CircleNotch, GameController, Sparkle } from '@phosphor-icons/react';
import Avatar from './Avatar';
import { fetchAvatarOptions, saveProfile, type AvatarOptions } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { GAME_AVATARS } from '../data/gameAvatars';

/**
 * Selector de identidad visual. Los iconos de juego son recursos locales y no
 * dependen de que el usuario conecte una cuenta externa.
 */
export default function AvatarPicker() {
  const { user, updateUser } = useAuth();
  const [options, setOptions] = useState<AvatarOptions | null>(null);
  const [loadingRemote, setLoadingRemote] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAvatarOptions()
      .then(setOptions)
      .catch(() => setError('Los iconos conectados no están disponibles; los iconos de juego sí.'))
      .finally(() => setLoadingRemote(false));
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
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <span className="mb-2 inline-flex items-center gap-2 rounded-full border border-brand-violet/25 bg-brand-violet/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-violet-300">
            <GameController weight="fill" className="h-3.5 w-3.5" /> Sin conectar cuentas
          </span>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Tu icono gamer</h3>
          <p className="mt-1 text-xs text-slate-500">
            Elige cualquier juego. Se guarda en tu perfil y aparece en matches, amigos y chat.
          </p>
        </div>
        <Avatar name={user?.username ?? ''} src={current} size={48} brand radius={14} />
      </div>

      {error && <p className="mb-3 text-xs text-red-400">{error}</p>}

      <div className="avatar-game-grid stagger">
          <OptionButton
            label="Usar mis iniciales"
            selected={!current}
            busy={saving === 'initials'}
            onClick={() => choose(null)}
          >
            <Avatar name={user?.username ?? ''} size={56} brand radius={12} />
          </OptionButton>

          {GAME_AVATARS.map((game) => (
            <OptionButton
              key={game.id}
              label={`Usar icono de ${game.name}`}
              selected={current === game.value}
              busy={saving === game.value}
              onClick={() => choose(game.value)}
            >
              <img src={game.image ?? undefined} alt="" loading="lazy" className="h-14 w-14 rounded-xl object-cover" />
              <span className="avatar-game-label" aria-hidden="true">{game.short}</span>
            </OptionButton>
          ))}
      </div>

      {(options?.riot || options?.icons.length) && (
        <div className="mt-6 border-t border-white/[0.07] pt-5">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
            Opcionales de League of Legends
          </p>
          <div className="stagger flex flex-wrap gap-2.5">
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
                <Sparkle className="h-3 w-3" />
              </span>
            </OptionButton>
            )}

            {options?.icons.slice(0, 16).map((icon) => (
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
        </div>
      )}

      {loadingRemote && (
        <p className="mt-4 inline-flex items-center gap-2 text-[11px] text-slate-600">
          <CircleNotch className="h-3.5 w-3.5 animate-spin" /> Cargando opciones conectadas…
        </p>
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
  children: ReactNode;
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
          ? 'border-brand-violet ring-1 ring-[var(--color-accent)]'
          : highlight
            ? 'border-brand-violet/40 hover:border-brand-violet/70'
            : 'border-white/10 hover:border-white/30'}`}
    >
      {children}
      {selected && (
        <span className="anim-pop absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-brand-violet text-white">
          <Check weight="bold" className="h-3 w-3" />
        </span>
      )}
      {busy && (
        <span className="absolute inset-0 grid place-items-center rounded-xl bg-black/50">
          <CircleNotch className="h-4 w-4 animate-spin text-white" />
        </span>
      )}
    </button>
  );
}
