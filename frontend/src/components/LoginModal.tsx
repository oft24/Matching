import { useEffect, useState } from 'react';
import { CircleNotch, SignIn, UserPlus, X } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import GoogleSignInButton from './GoogleSignInButton';
import LegalModal from './LegalModal';
import { parseAuthError } from '../lib/authErrors';
import { LEGAL_VERSION, type LegalSection } from '../data/legal';

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export default function LoginModal({ open, onClose, initialMode = 'login' }: LoginModalProps) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);
  const [legalSection, setLegalSection] = useState<LegalSection>('terms');

  useEffect(() => {
    if (open) setMode(initialMode);
  }, [open, initialMode]);

  if (!open) return null;

  const reset = () => {
    setError('');
    setUsername('');
    setEmail('');
    setPassword('');
    setTermsAccepted(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') await login(email, password);
      else await register(username, email, password, termsAccepted, LEGAL_VERSION);
      reset();
      onClose();
    } catch (err: unknown) {
      setError(parseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (m: 'login' | 'register') => {
    setMode(m);
    setError('');
  };

  const showLegal = (section: LegalSection) => {
    setLegalSection(section);
    setLegalOpen(true);
  };

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

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-1">
            {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </h2>
          <p className="text-sm text-slate-400">
            {mode === 'login'
              ? 'Accede a tu perfil y dashboard de matchmaking'
              : 'Únete a la comunidad q2play'}
          </p>
        </div>

        <div className="mb-6 flex gap-1 rounded-lg border border-white/10 bg-[#0b1220] p-1">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400
              ${mode === 'login' ? 'bg-brand-violet/30 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <SignIn className="w-4 h-4" /> Login
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400
              ${mode === 'register' ? 'bg-brand-violet/30 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <UserPlus className="w-4 h-4" /> Registro
          </button>
        </div>

        <div className="mb-5 flex justify-center">
          <GoogleSignInButton
            theme="dark"
            onSignedIn={() => { reset(); onClose(); }}
            acceptTerms={mode === 'register' && termsAccepted}
            termsVersion={LEGAL_VERSION}
            disabled={mode === 'register' && !termsAccepted}
          />
        </div>

        <div className="mb-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-white/10" />
          <span className="text-xs uppercase tracking-wide text-slate-500">o con tu correo</span>
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Usuario</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full rounded-lg border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-white transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                placeholder="Tu nombre de jugador"
              />
            </div>
          )}

          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-white transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
              placeholder="tu@email.com"
            />
          </div>

          {mode === 'register' && (
            <div className="legal-consent">
              <input id="modal-terms" type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} />
              <span>
                <label htmlFor="modal-terms">Tengo 18 años o más y acepto los </label>
                <button type="button" onClick={() => showLegal('terms')}>Términos</button>, el{' '}
                <button type="button" onClick={() => showLegal('privacy')}>Aviso de Privacidad</button> y las{' '}
                <button type="button" onClick={() => showLegal('rules')}>Reglas</button>.
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              className="w-full rounded-lg border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-white transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-red-400/15 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || (mode === 'register' && !termsAccepted)}
            className="gradient-btn flex w-full items-center justify-center gap-2 py-3 text-sm font-semibold
              disabled:opacity-50"
          >
            {loading && <CircleNotch className="w-4 h-4 animate-spin" />}
            {mode === 'login' ? 'ENTRAR' : 'REGISTRARSE'}
          </button>
        </form>
      </div>
      <LegalModal open={legalOpen} section={legalSection} onSectionChange={setLegalSection} onClose={() => setLegalOpen(false)} />
    </div>
  );
}
