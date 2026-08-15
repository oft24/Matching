import { FormEvent, useEffect, useState } from 'react';
import { ArrowLeft, CircleNotch, Eye, EyeSlash, SignIn, UserPlus } from '@phosphor-icons/react';
import Logo from './Logo';
import MatchingStage from './MatchingStage';
import CodeInput, { CODE_LENGTH } from './CodeInput';
import { useAuth } from '../context/AuthContext';
import { parseAuthError } from '../lib/authErrors';
import type { VerificationChallenge } from '../types';

type Mode = 'login' | 'register' | 'verify';
type Field = 'user' | 'email' | 'pass';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const RESEND_COOLDOWN_S = 60;

/**
 * Pantalla previa al login: propuesta de valor y formulario a la izquierda,
 * animación del emparejamiento a la derecha. El formulario habla con la API
 * real de la app — no es una demostración.
 */
export default function PreLogin() {
  const { login, register, verifyEmail, resendCode } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [user, setUser] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [code, setCode] = useState('');
  const [challenge, setChallenge] = useState<VerificationChallenge | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [showPass, setShowPass] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const isRegister = mode === 'register';
  const isVerify = mode === 'verify';
  const emailOk = EMAIL_RE.test(email.trim());
  const passOk = pass.length >= 6;
  const userOk = !isRegister || user.trim().length >= 3;
  const canSubmit = isVerify ? code.length === CODE_LENGTH : emailOk && passOk && userOk;

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const touch = (field: Field) => () => setTouched((t) => ({ ...t, [field]: true }));
  const switchMode = (next: Mode) => {
    setMode(next);
    setTouched({});
    setStatus('');
    setError('');
  };

  const openChallenge = (next: VerificationChallenge) => {
    setChallenge(next);
    setCode('');
    setError('');
    setCooldown(RESEND_COOLDOWN_S);
    setStatus(
      next.emailDelivered
        ? `Enviamos un código de ${CODE_LENGTH} dígitos a ${next.email}. Caduca en ${next.expiresInMinutes} minutos.`
        : `El envío de correo no está configurado. El código está en la consola del backend${next.devCode ? `: ${next.devCode}` : ''}.`,
    );
    setMode('verify');
  };

  const handleResend = async () => {
    if (cooldown > 0 || loading) return;
    setLoading(true);
    setError('');
    try {
      openChallenge(await resendCode(challenge?.email ?? email.trim()));
    } catch (err) {
      const { message, retryAfter } = parseAuthError(err);
      if (retryAfter) setCooldown(retryAfter);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const userError = touched.user && !userOk ? 'Usa al menos 3 caracteres.' : '';
  const emailError = touched.email && !emailOk
    ? (email.trim() ? 'Revisa el formato: nombre@dominio.com' : 'Escribe tu email.')
    : '';
  const passError = touched.pass && !passOk ? 'Mínimo 6 caracteres.' : '';

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!isVerify) setTouched({ user: true, email: true, pass: true });
    if (!canSubmit || loading) return;

    setLoading(true);
    setError('');
    setStatus(
      isVerify ? 'Verificando el código…' : isRegister ? 'Creando tu cuenta…' : 'Comprobando credenciales…',
    );
    try {
      if (isVerify) {
        await verifyEmail(challenge?.email ?? email.trim(), code);
        // En éxito AuthContext cambia de usuario y App monta la vista autenticada
      } else if (isRegister) {
        // El registro ya no entra directo: primero hay que confirmar el correo.
        openChallenge(await register(user.trim(), email.trim(), pass));
      } else {
        await login(email.trim(), pass);
      }
    } catch (err) {
      const { message, challenge: pending } = parseAuthError(err);
      // Login con cuenta sin confirmar: el backend ya reenvió el código.
      if (pending) openChallenge(pending);
      else setStatus('');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const backToLogin = () => {
    setChallenge(null);
    setCode('');
    setPass('');
    switchMode('login');
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center gap-4 px-6 py-4 sm:px-10">
        <div className="mr-auto flex items-center gap-3">
          <Logo size="sm" />
          <span className="text-lg font-medium text-[var(--color-text)]">Matching</span>
          <span className="rounded-md border border-[var(--color-accent)] px-2 py-0.5 text-[11px] text-[var(--color-accent)]">
            BETA
          </span>
        </div>
        <span className="hidden text-[13px] text-[color-mix(in_srgb,var(--color-text)_55%,transparent)] sm:block">
          Juega. Conecta.
        </span>
      </header>

      <main className="grid flex-1 items-center gap-10 px-6 pb-10 sm:px-10 lg:grid-cols-2">
        <section className="anim-fade-up max-w-[520px]">
          <p className="section-kicker">Matchmaking para gamers</p>
          <h1 className="mt-3 text-[clamp(32px,3.3vw,46px)] leading-[1.08] text-balance text-[var(--color-text)]">
            Encuentra jugadores. Forma tu equipo. Empieza a ganar.
          </h1>
          <p className="mt-4 max-w-[46ch] text-base text-[color-mix(in_srgb,var(--color-text)_68%,transparent)]">
            Conecta con jugadores que comparten tu juego, rango, rol, plataforma y estilo de juego.
          </p>

          <div className="surface mt-8 rounded-[var(--radius-lg)] p-6">
            {isVerify ? (
              <div className="mb-6">
                <h2 className="text-lg text-[var(--color-text)]">Confirma tu correo</h2>
                <p className="mt-1 text-[13px] text-[color-mix(in_srgb,var(--color-text)_65%,transparent)]">
                  Escribe el código que enviamos a {challenge?.email ?? email.trim()}
                </p>
              </div>
            ) : (
              <div className="mb-6 grid grid-cols-2 overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-divider)]">
                {([['login', 'Entrar', SignIn], ['register', 'Crear cuenta', UserPlus]] as const).map(
                  ([value, label, Icon], i) => {
                    const active = mode === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => switchMode(value)}
                        aria-pressed={active}
                        className={`flex items-center justify-center gap-1.5 whitespace-nowrap px-3 py-2 text-[13px] transition-colors
                          ${i === 1 ? 'border-l border-[var(--color-divider)]' : ''}
                          ${active
                            ? 'text-[var(--color-accent)] shadow-[inset_0_0_0_1px_var(--color-accent)]'
                            : 'text-[var(--color-text)] hover:bg-[color-mix(in_srgb,var(--color-text)_7%,transparent)]'}`}
                      >
                        <Icon className="h-4 w-4" /> {label}
                      </button>
                    );
                  },
                )}
              </div>
            )}

            <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
              {isVerify && (
                <div>
                  {/* Sin htmlFor: el código son seis casillas, no un único input. */}
                  <span className="mb-1.5 block text-xs text-[color-mix(in_srgb,var(--color-text)_70%,transparent)]">
                    Código de verificación
                  </span>
                  <CodeInput value={code} onChange={setCode} disabled={loading} variant="nocturne" />
                </div>
              )}

              {isRegister && (
                <Field label="Usuario" htmlFor="pl-user" error={userError}>
                  <input
                    id="pl-user"
                    type="text"
                    autoComplete="username"
                    placeholder="Tu nombre de jugador"
                    value={user}
                    onChange={(e) => { setUser(e.target.value); setError(''); }}
                    onBlur={touch('user')}
                    className="nocturne-input"
                  />
                </Field>
              )}

              {!isVerify && (
                <>
                  <Field label="Email" htmlFor="pl-email" error={emailError}>
                    <input
                      id="pl-email"
                      type="email"
                      autoComplete="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(''); }}
                      onBlur={touch('email')}
                      className="nocturne-input"
                    />
                  </Field>

                  <Field label="Contraseña" htmlFor="pl-pass" error={passError}>
                    <div className="relative flex items-center">
                      <input
                        id="pl-pass"
                        type={showPass ? 'text' : 'password'}
                        autoComplete={isRegister ? 'new-password' : 'current-password'}
                        placeholder="Mínimo 6 caracteres"
                        value={pass}
                        onChange={(e) => { setPass(e.target.value); setError(''); }}
                        onBlur={touch('pass')}
                        className="nocturne-input pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass((v) => !v)}
                        aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        className="absolute right-1 grid h-8 w-8 place-items-center rounded-[var(--radius-md)] text-[var(--color-accent)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)]"
                      >
                        {showPass ? <EyeSlash className="h-[17px] w-[17px]" /> : <Eye className="h-[17px] w-[17px]" />}
                      </button>
                    </div>
                  </Field>
                </>
              )}

              <button
                type="submit"
                disabled={loading || !canSubmit}
                className="primary-button mt-1 min-h-[38px] w-full text-sm"
              >
                {loading && <CircleNotch className="h-4 w-4 animate-spin" />}
                {loading ? 'Comprobando…' : isVerify ? 'Verificar' : isRegister ? 'Crear cuenta' : 'Entrar'}
              </button>

              {isVerify && (
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={backToLogin}
                    className="flex items-center gap-1.5 text-xs text-[color-mix(in_srgb,var(--color-text)_65%,transparent)] transition-colors hover:text-[var(--color-text)]"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Volver
                  </button>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={cooldown > 0 || loading}
                    className="text-xs text-[var(--color-accent)] transition-colors hover:opacity-80 disabled:cursor-not-allowed disabled:text-[color-mix(in_srgb,var(--color-text)_40%,transparent)]"
                  >
                    {cooldown > 0 ? `Reenviar código en ${cooldown}s` : 'Reenviar código'}
                  </button>
                </div>
              )}

              {error && <p className="text-[13px] text-red-400">{error}</p>}
              {!error && status && (
                <p className="text-[13px] text-[color-mix(in_srgb,var(--color-text)_70%,transparent)]">{status}</p>
              )}
            </form>
          </div>
        </section>

        <section className="flex flex-col items-center gap-3">
          <MatchingStage />
          <p className="text-[11px] uppercase tracking-[0.06em] text-[color-mix(in_srgb,var(--color-text)_42%,transparent)]">
            Vista de demostración del emparejamiento
          </p>
        </section>
      </main>
    </div>
  );
}

function Field({ label, htmlFor, error, children }: {
  label: string; htmlFor: string; error: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs text-[color-mix(in_srgb,var(--color-text)_70%,transparent)]">
        {label}
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs text-[var(--color-accent-300)]">{error}</p>}
    </div>
  );
}
