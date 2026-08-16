import { X } from '@phosphor-icons/react';
import GoogleSignInButton from './GoogleSignInButton';

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  /** Con Google entrar y registrarse son la misma acción; solo cambia el texto. */
  initialMode?: 'login' | 'register';
}

export default function LoginModal({ open, onClose, initialMode = 'login' }: LoginModalProps) {
  if (!open) return null;

  const registering = initialMode === 'register';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl border border-white/10 bg-[#101827] p-6 shadow-2xl shadow-black/40">
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-1">
            {registering ? 'Crear cuenta' : 'Iniciar sesión'}
          </h2>
          <p className="text-sm text-slate-400">
            {registering
              ? 'Únete a la comunidad Matching con tu cuenta de Google'
              : 'Entra con tu cuenta de Google y accede a tu perfil'}
          </p>
        </div>

        <div className="mb-6 flex justify-center">
          <GoogleSignInButton theme="dark" onSignedIn={onClose} />
        </div>

        <p className="text-center text-xs leading-relaxed text-slate-500">
          Usamos tu cuenta de Google solo para identificarte. No accedemos a tu correo
          ni publicamos nada en tu nombre.
        </p>
      </div>
    </div>
  );
}
