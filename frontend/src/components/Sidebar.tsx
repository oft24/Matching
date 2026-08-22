import { SignOut, X } from '@phosphor-icons/react';
import { NAV_ITEMS } from '../data/navItems';
import Avatar from './Avatar';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  active: string;
  onNavigate: (id: string) => void;
  open: boolean;
  onClose: () => void;
}

/**
 * Panel de navegación de 240 px: etiquetas, agrupación y tarjeta de usuario abajo.
 * En pantallas pequeñas se comporta como cajón deslizante.
 */
export default function Sidebar({ active, onNavigate, open, onClose }: SidebarProps) {
  const { user, logout } = useAuth();

  const go = (id: string) => {
    onNavigate(id);
    onClose();
  };

  return (
    <>
      {open && (
        <div
          className="anim-fade-in fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* El desplazamiento fuera de pantalla es exclusivo de móvil (`max-lg`),
          así en escritorio no compite con la posición sticky. */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[var(--panel-width)] flex-col border-r
          border-white/[0.06] bg-[#0d1320] transition-transform duration-200 ease-out
          lg:sticky lg:z-auto
          ${open ? 'translate-x-0' : 'max-lg:-translate-x-full'}`}
      >
        <div className="flex h-[72px] flex-shrink-0 items-center justify-between border-b border-white/[0.06] px-4">
          <div className="min-w-0">
            <h2 className="truncate text-[15px] font-bold text-[#f2f3f5]">q2play</h2>
            <p className="text-[11px] text-slate-500">Juega. Conecta. Compite.</p>
          </div>
          <button onClick={onClose} aria-label="Cerrar menú" className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/5 hover:text-white lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="stagger flex-1 space-y-0.5 overflow-y-auto p-2.5" aria-label="Secciones">
          <p className="px-2.5 pb-1.5 pt-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Navegación
          </p>
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => go(id)}
              aria-current={active === id ? 'page' : undefined}
              className={`panel-item ${active === id ? 'panel-item-active' : ''}`}
            >
              <Icon className="h-[18px] w-[18px] flex-shrink-0" aria-hidden="true" />
              {label}
            </button>
          ))}
        </nav>

        {user && (
          <div className="flex-shrink-0 border-t border-white/[0.06] p-2.5">
            <div className="flex items-center gap-2.5 rounded-xl bg-white/[0.03] p-2">
              <Avatar name={user.username} src={user.avatar} size={34} brand radius={999} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-[#f2f3f5]">{user.username}</p>
                <div className="flex items-center gap-1.5">
                  <span className="status-dot h-1.5 w-1.5 rounded-full bg-emerald-400 text-emerald-400" />
                  <span className="text-[11px] text-emerald-400">En línea</span>
                </div>
              </div>
              <button
                onClick={logout}
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
                className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg text-slate-400 transition-[background-color,color] duration-150 hover:bg-red-500/10 hover:text-red-400"
              >
                <SignOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
