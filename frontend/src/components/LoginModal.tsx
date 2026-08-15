import { useEffect, useState } from 'react';
import { ArrowLeft, CircleNotch, EnvelopeSimple, ShieldCheck, SignIn, UserPlus, X } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import CodeInput, { CODE_LENGTH } from './CodeInput';
import { parseAuthError } from '../lib/authErrors';
import type { VerificationChallenge } from '../types';

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

type Mode = 'login' | 'register' | 'verify';

const RESEND_COOLDOWN_S = 60;

export default function LoginModal({ open, onClose, initialMode = 'login' }: LoginModalProps) {
  const { login, register, verifyEmail, resendCode } = useAuth();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [challenge, setChallenge] = useState<VerificationChallenge | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) setMode(initialMode);
  }, [open, initialMode]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  if (!open) return null;

  const reset = () => {
    setError('');
    setNotice('');
    setUsername('');
    setEmail('');
    setPassword('');
    setCode('');
    setChallenge(null);
    setCooldown(0);
  };

  const openChallenge = (next: VerificationChallenge) => {
    setChallenge(next);
    setCode('');
    setError('');
    setCooldown(RESEND_COOLDOWN_S);
    setNotice(
      next.emailDelivered
        ? `Enviamos un código de ${CODE_LENGTH} dígitos a ${next.email}. Caduca en ${next.expiresInMinutes} minutos.`
        : `El envío de correo no está configurado. El código está en la consola del backend${next.devCode ? `: ${next.devCode}` : ''}.`,
    );
    setMode('verify');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
        reset();
        onClose();
      } else if (mode === 'register') {
        openChallenge(await register(username, email, password));
      } else {
        await verifyEmail(challenge?.email ?? email, code);
        reset();
        onClose();
      }
    } catch (err: unknown) {
      const { message, challenge: pending } = parseAuthError(err);
      // Login con cuenta sin confirmar: el backend ya reenvió el código.
      if (pending) {
        openChallenge(pending);
        setError(message);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || loading) return;
    setError('');
    setLoading(true);
    try {
      openChallenge(await resendCode(challenge?.email ?? email));
    } catch (err: unknown) {
      const { message, retryAfter } = parseAuthError(err);
      if (retryAfter) setCooldown(retryAfter);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setError('');
    setNotice('');
  };

  const backToLogin = () => {
    setChallenge(null);
    setCode('');
    setPassword('');
    switchMode('login');
  };

  const titles: Record<Mode, { heading: string; sub: string }> = {
    login: { heading: 'Iniciar sesión', sub: 'Accede a tu perfil y dashboard de matchmaking' },
    register: { heading: 'Crear cuenta', sub: 'Únete a la comunidad Matching' },
    verify: { heading: 'Confirma tu correo', sub: `Escribe el código que enviamos a ${challenge?.email ?? email}` },
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
          <h2 className="text-2xl font-bold text-white mb-1">{titles[mode].heading}</h2>
          <p className="text-sm text-slate-400">{titles[mode].sub}</p>
        </div>

        {mode !== 'verify' && (
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
        )}

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

          {mode !== 'verify' && (
            <>
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

              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full rounded-lg border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-white transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
            </>
          )}

          {mode === 'verify' && (
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">
                Código de verificación
              </label>
              <CodeInput value={code} onChange={setCode} disabled={loading} />
            </div>
          )}

          {notice && (
            <p className="flex items-start gap-2 rounded-lg border border-indigo-400/20 bg-indigo-500/10 px-3 py-2 text-sm text-indigo-200">
              <EnvelopeSimple className="mt-0.5 w-4 h-4 shrink-0" />
              <span>{notice}</span>
            </p>
          )}

          {error && (
            <p className="rounded-lg border border-red-400/15 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || (mode === 'verify' && code.length < CODE_LENGTH)}
            className="gradient-btn flex w-full items-center justify-center gap-2 py-3 text-sm font-semibold
              disabled:opacity-50"
          >
            {loading && <CircleNotch className="w-4 h-4 animate-spin" />}
            {mode === 'verify' && !loading && <ShieldCheck className="w-4 h-4" />}
            {mode === 'login' ? 'ENTRAR' : mode === 'register' ? 'REGISTRARSE' : 'VERIFICAR'}
          </button>

          {mode === 'verify' && (
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={backToLogin}
                className="flex items-center gap-1.5 text-xs text-slate-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Volver
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={cooldown > 0 || loading}
                className="text-xs font-medium text-indigo-300 transition-colors hover:text-indigo-200 disabled:cursor-not-allowed disabled:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded"
              >
                {cooldown > 0 ? `Reenviar código en ${cooldown}s` : 'Reenviar código'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
