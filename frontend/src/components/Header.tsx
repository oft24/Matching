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
    <header className="sticky top-0 z-30 glass border-b border-white/8 px-4 lg:px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <div className="hidden sm:block">
            <span className="font-bold text-white">Matching</span>
            <span className="hidden md:inline text-slate-500 text-sm ml-2">Juega. Conecta. Comparte.</span>
          </div>
        </div>

        {isAuthenticated && (
          <div className="hidden md:flex items-center gap-3 flex-1 max-w-xs mx-8">
            <span className="text-xs text-slate-400 whitespace-nowrap">Nivel {level}</span>
            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-violet to-brand-blue transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-slate-500">{xp}/{xpToNext} XP</span>
          </div>
        )}

        <div className="flex items-center gap-3">
          {isAuthenticated && (
            <button className="relative p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-violet rounded-full" />
            </button>
          )}

          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 glass rounded-2xl px-3 py-1.5">
                <img
                  src={user.avatar ?? `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.username}`}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full ring-2 ring-brand-violet/50"
                />
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-white leading-tight">{user.username}</p>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-xs text-emerald-400">En línea</span>
                  </div>
                </div>
              </div>
              <button
                onClick={logout}
                title="Cerrar sesión"
                className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
              {onMenuClick && (
                <button
                  onClick={onMenuClick}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                  title="Menú"
                >
                  <Menu className="w-6 h-6" />
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="gradient-btn flex items-center gap-2 px-4 py-2 rounded-2xl text-white text-sm font-semibold"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">Iniciar sesión</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
