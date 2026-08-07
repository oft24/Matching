import {
  Home,
  Search,
  Users,
  UserPlus,
  MessageSquare,
  User,
  Settings,
  LayoutDashboard,
} from 'lucide-react';

/** Etiquetas e ids de navegación. Los ids son los que enruta App.tsx: no cambiarlos. */
export const NAV_ITEMS = [
  { id: 'inicio', label: 'Inicio', icon: Home },
  { id: 'buscar', label: 'Buscar jugadores', icon: Search },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'grupos', label: 'Grupos', icon: Users },
  { id: 'amigos', label: 'Amigos', icon: UserPlus },
  { id: 'mensajes', label: 'Mensajes', icon: MessageSquare },
  { id: 'perfil', label: 'Mi Perfil', icon: User },
  { id: 'ajustes', label: 'Ajustes', icon: Settings },
] as const;
