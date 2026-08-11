import { ChatText, Gear, House, MagnifyingGlass, SquaresFour, User, UserPlus, Users } from '@phosphor-icons/react';

/** Etiquetas e ids de navegación. Los ids son los que enruta App.tsx: no cambiarlos. */
export const NAV_ITEMS = [
  { id: 'inicio', label: 'Inicio', icon: House },
  { id: 'buscar', label: 'Buscar jugadores', icon: MagnifyingGlass },
  { id: 'dashboard', label: 'Dashboard', icon: SquaresFour },
  { id: 'grupos', label: 'Grupos', icon: Users },
  { id: 'amigos', label: 'Amigos', icon: UserPlus },
  { id: 'mensajes', label: 'Mensajes', icon: ChatText },
  { id: 'perfil', label: 'Mi Perfil', icon: User },
  { id: 'ajustes', label: 'Ajustes', icon: Gear },
] as const;
