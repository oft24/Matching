import { SignOut } from '@phosphor-icons/react';
import { NAV_ITEMS } from '../data/navItems';
import Avatar from './Avatar';
import { useAuth } from '../context/AuthContext';

interface IconRailProps {
  active: string;
  onNavigate: (id: string) => void;
}

/**
 * Rail de iconos de 72 px. Cada botón muestra su etiqueta al pasar el cursor
 * y una píldora en el borde izquierdo que crece con el hover y con el estado activo.
 */
export default function IconRail({ active, onNavigate }: IconRailProps) {
  const { user, logout } = useAuth();

  return (
    <nav
      aria-label="Navegación principal"
      className="sticky top-0 flex h-screen w-[var(--rail-width)] flex-shrink-0 flex-col items-center gap-1.5 border-r border-[var(--color-neutral-800)] py-3"
    >
      <button
        onClick={() => onNavigate('inicio')}
        aria-label="Inicio"
        className="group relative mb-1.5 grid h-[38px] w-[38px] place-items-center rounded-[var(--radius-md)] border border-[var(--color-accent)] text-[var(--color-accent)] transition-transform duration-200 active:scale-[0.94]"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="8" cy="8" r="3" />
          <circle cx="16" cy="16" r="3" />
          <path d="M10.2 9.8L13.8 14.2" />
        </svg>
        <span className="rail-tip">Matching</span>
      </button>

      <span className="mb-1 h-px w-8 bg-[var(--color-neutral-800)]" aria-hidden="true" />

      <div className="flex flex-1 flex-col items-center gap-1.5 overflow-y-auto">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            aria-label={label}
            aria-current={active === id ? 'page' : undefined}
            className={`rail-item ${active === id ? 'rail-item-active' : ''}`}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span className="rail-tip">{label}</span>
          </button>
        ))}
      </div>

      {user && (
        <div className="flex flex-col items-center gap-2 pt-1">
          <span className="h-px w-8 bg-[var(--color-neutral-800)]" aria-hidden="true" />
          <button
            onClick={() => onNavigate('perfil')}
            aria-label="Mi perfil"
            className="group relative rounded-full ring-2 ring-transparent transition-[box-shadow,transform] duration-200 hover:ring-brand-violet/70 active:scale-[0.97]"
          >
            <Avatar name={user.username} src={user.avatar} size={40} brand radius={999} />
            <span className="rail-tip">{user.username}</span>
          </button>
          <button
            onClick={logout}
            aria-label="Cerrar sesión"
            className="group relative grid h-10 w-10 place-items-center rounded-full text-slate-400 transition-[background-color,color,transform] duration-150 hover:bg-red-500/12 hover:text-red-400 active:scale-[0.97]"
          >
            <SignOut className="h-[18px] w-[18px]" aria-hidden="true" />
            <span className="rail-tip">Cerrar sesión</span>
          </button>
        </div>
      )}
    </nav>
  );
}
