import {
  Home,
  Search,
  Users,
  UserPlus,
  MessageSquare,
  Calendar,
  User,
  Settings,
  LayoutDashboard,
  X,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { id: 'inicio', label: 'Inicio', icon: Home },
  { id: 'buscar', label: 'Buscar jugadores', icon: Search },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'grupos', label: 'Grupos', icon: Users },
  { id: 'amigos', label: 'Amigos', icon: UserPlus },
  { id: 'mensajes', label: 'Mensajes', icon: MessageSquare },
  { id: 'eventos', label: 'Eventos', icon: Calendar },
  { id: 'perfil', label: 'Mi Perfil', icon: User },
  { id: 'ajustes', label: 'Ajustes', icon: Settings },
];

interface SidebarProps {
  active: string;
  onNavigate: (id: string) => void;
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ active, onNavigate, open, onClose }: SidebarProps) {
  const { user, logout } = useAuth();

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed lg:sticky top-0 right-0 z-50 h-screen w-64 glass flex flex-col
          border-l border-white/8 transition-transform duration-300
          lg:translate-x-0 ${open ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-violet to-brand-blue flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white text-lg leading-tight">Matching</h1>
              <p className="text-xs text-slate-400">Menú</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { onNavigate(id); onClose(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium
                transition-all duration-200
                ${active === id
                  ? 'bg-brand-violet/20 text-white border-r-2 border-brand-violet glow-violet'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
        </nav>

        {user && (
          <div className="p-4 border-t border-white/8">
            <div className="glass rounded-2xl p-3">
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={user.avatar ?? `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.username}`}
                  alt=""
                  className="w-9 h-9 rounded-full ring-2 ring-brand-violet/50"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user.username}</p>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-xs text-emerald-400">En línea</span>
                  </div>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl
                  text-red-400 hover:bg-red-500/10 text-sm font-medium transition-colors"
              >
                <LogOut className="w-4 h-4" /> Cerrar sesión
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
