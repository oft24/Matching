import { Bell, SignOut } from '@phosphor-icons/react';
import Avatar from './Avatar';
import { NAV_ITEMS } from '../data/navItems';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  level: number;
  xp: number;
  xpToNext: number;
  activeNav: string;
}

/**
 * Cabecera compacta: a la izquierda el kicker y el título de la pantalla activa,
 * a la derecha el progreso y la cuenta. La navegación vive entera en el rail.
 */
export default function Header({ level, xp, xpToNext, activeNav }: HeaderProps) {
  const { user, logout } = useAuth();
  const pct = Math.round((xp / Math.max(1, xpToNext)) * 100);
  const current = NAV_ITEMS.find((item) => item.id === activeNav) ?? NAV_ITEMS[0];

  return (
    <header className="flex items-center gap-4 border-b border-[var(--color-neutral-800)] px-4 py-2.5 sm:px-6">
      <div className="mr-auto min-w-0">
        <p className="section-kicker">{current.label}</p>
        <p className="mt-0.5 truncate text-[15px] font-medium text-[var(--color-text)]">
          {user ? `Hola, ${user.username}` : 'Matching'}
        </p>
      </div>

      <div className="hidden text-right sm:block">
        <p className="text-xs text-[color-mix(in_srgb,var(--color-text)_60%,transparent)]">
          Nivel {level} · {xp} / {xpToNext} XP
        </p>
        <div className="meter mt-1 w-[150px]">
          <div className="meter-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <button
        aria-label="Notificaciones"
        className="relative grid h-9 w-9 place-items-center rounded-[var(--radius-md)] text-[color-mix(in_srgb,var(--color-text)_55%,transparent)] transition-colors hover:bg-[var(--color-neutral-800)] hover:text-[var(--color-text)]"
      >
        <Bell className="h-[18px] w-[18px]" />
        <span className="animate-breathe absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
      </button>

      {user && (
        <>
          <div className="flex items-center gap-2.5">
            <Avatar name={user.username} src={user.avatar} size={34} brand />
            <div className="hidden leading-tight sm:block">
              <p className="text-[13px] font-medium text-[var(--color-text)]">{user.username}</p>
              <span className="text-[11px] text-emerald-400">En línea</span>
            </div>
          </div>
          <button
            onClick={logout}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            className="grid h-9 w-9 place-items-center rounded-[var(--radius-md)] text-[color-mix(in_srgb,var(--color-text)_45%,transparent)] transition-colors hover:bg-[var(--color-neutral-800)] hover:text-[var(--color-text)]"
          >
            <SignOut className="h-[18px] w-[18px]" />
          </button>
        </>
      )}
    </header>
  );
}
