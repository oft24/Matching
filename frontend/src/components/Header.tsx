import { Bell, LogIn, LogOut, Menu } from 'lucide-react';
import Logo from './Logo';
import Avatar from './Avatar';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  level: number;
  xp: number;
  xpToNext: number;
  onMenuClick?: () => void;
  onOpenLogin: () => void;
  /** Con el rail y el panel visibles, la marca del header sobra en escritorio. */
  compact?: boolean;
}

export default function Header({ level, xp, xpToNext, onMenuClick, onOpenLogin, compact }: HeaderProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const pct = Math.round((xp / xpToNext) * 100);

  return (
    <header className="sticky top-0 z-30 h-[72px] border-b border-white/10 bg-[#070b14]/86 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between gap-4">
        <div className={`flex items-center gap-3 ${compact ? 'lg:hidden' : ''}`}>
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              title="Menú"
              aria-label="Abrir menú"
              className="rounded-lg p-2 text-slate-400 transition-[background-color,color] duration-150 hover:bg-white/5 hover:text-white lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
          )}
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
            <div className="meter flex-1">
              <div className="meter-fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="whitespace-nowrap text-xs text-slate-500">{xp}/{xpToNext} XP</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          {isAuthenticated && (
            <button aria-label="Notificaciones" className="relative rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400">
              <Bell className="h-5 w-5" />
              <span className="animate-breathe absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-indigo-400" />
            </button>
          )}

          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] py-1.5 pl-1.5 pr-3.5 transition-colors hover:border-white/20">
                <Avatar name={user.username} src={user.avatar} size={34} brand />
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold leading-tight text-white">{user.username}</p>
                  <div className="flex items-center gap-1.5">
                    <span className="status-dot h-1.5 w-1.5 rounded-full bg-emerald-400 text-emerald-400" />
                    <span className="text-xs text-emerald-400">En línea</span>
                  </div>
                </div>
              </div>
              <button onClick={logout} title="Cerrar sesión" className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400">
                <LogOut className="h-5 w-5" />
              </button>
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
