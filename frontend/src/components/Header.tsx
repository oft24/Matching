import { Bell, LogIn, LogOut, Menu } from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  level: number;
  xp: number;
  xpToNext: number;
  onMenuClick?: () => void;
  onOpenLogin: () => void;
}

export default function Header({ level, xp, xpToNext, onMenuClick, onOpenLogin }: HeaderProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const pct = Math.round((xp / xpToNext) * 100);

  return (
    <header className="sticky top-0 z-30 h-[68px] border-b border-white/10 bg-[#080d18]/85 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">Matching</span>
              <span className="rounded border border-indigo-400/20 bg-indigo-400/10 px-1.5 py-0.5 text-[9px] font-bold text-indigo-300">BETA</span>
            </div>
            <span className="block text-[11px] text-slate-500">Juega. Conecta. Compite.</span>
          </div>
        </div>

        {isAuthenticated && (
          <div className="mx-8 hidden max-w-xs flex-1 items-center gap-3 md:flex">
            <span className="whitespace-nowrap text-xs text-slate-400">Nivel {level}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-violet to-brand-blue transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-slate-500">{xp}/{xpToNext} XP</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          {isAuthenticated && (
            <button aria-label="Notificaciones" className="relative rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-indigo-400" />
            </button>
          )}

          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.035] px-3 py-1.5">
                <img
                  src={user.avatar ?? `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.username}`}
                  alt={`Avatar de ${user.username}`}
                  className="h-8 w-8 rounded-full ring-1 ring-indigo-400/50"
                />
                <div className="hidden sm:block">
                  <p className="text-sm font-medium leading-tight text-white">{user.username}</p>
                  <div className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span className="text-xs text-emerald-400">En línea</span>
                  </div>
                </div>
              </div>
              <button onClick={logout} title="Cerrar sesión" className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400">
                <LogOut className="h-5 w-5" />
              </button>
              {onMenuClick && (
                <button onClick={onMenuClick} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400" title="Menú">
                  <Menu className="h-6 w-6" />
                </button>
              )}
            </div>
          ) : (
            <button onClick={onOpenLogin} className="primary-button flex items-center gap-2 px-4 py-2.5 text-sm font-semibold">
              <LogIn className="h-4 w-4" />
              <span>Iniciar sesión</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
