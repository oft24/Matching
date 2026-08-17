import { FormEvent, useState } from 'react';
import { CircleNotch, Eye, EyeSlash, SignIn, UserPlus } from '@phosphor-icons/react';
import Logo from './Logo';
import MatchingStage from './MatchingStage';
import GoogleSignInButton from './GoogleSignInButton';
import { useAuth } from '../context/AuthContext';
import { parseAuthError } from '../lib/authErrors';

type Mode = 'login' | 'register';
type Field = 'user' | 'email' | 'pass';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

/**
 * Pantalla previa al login: propuesta de valor y acceso a la izquierda,
 * animación del emparejamiento a la derecha. Se puede entrar con Google o con
 * correo y contraseña — ninguna de las dos vías excluye a la otra.
 */
export default function PreLogin() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [user, setUser] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const isRegister = mode === 'register';
  const emailOk = EMAIL_RE.test(email.trim());
  const passOk = pass.length >= 6;
  const userOk = !isRegister || user.trim().length >= 3;

  const touch = (field: Field) => () => setTouched((t) => ({ ...t, [field]: true }));
  const switchMode = (next: Mode) => {
    setMode(next);
    setTouched({});
    setStatus('');
    setError('');
  };

  const userError = touched.user && !userOk ? 'Usa al menos 3 caracteres.' : '';
  const emailError = touched.email && !emailOk
    ? (email.trim() ? 'Revisa el formato: nombre@dominio.com' : 'Escribe tu email.')
    : '';
  const passError = touched.pass && !passOk ? 'Mínimo 6 caracteres.' : '';

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setTouched({ user: true, email: true, pass: true });
    if (!emailOk || !passOk || !userOk || loading) return;

    setLoading(true);
    setError('');
    setStatus(isRegister ? 'Creando tu cuenta…' : 'Comprobando credenciales…');
    try {
      if (isRegister) await register(user.trim(), email.trim(), pass);
      else await login(email.trim(), pass);
      // En éxito AuthContext cambia de usuario y App monta la vista autenticada
    } catch (err) {
      setError(parseAuthError(err));
      setStatus('');
    } finally {
      setLoading(false);
    }
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

            <div className="flex justify-center">
              <GoogleSignInButton theme="light" />
            </div>

            <div className="my-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-[var(--color-divider)]" />
              <span className="text-[11px] uppercase tracking-[0.06em] text-[color-mix(in_srgb,var(--color-text)_45%,transparent)]">
                o con tu correo
              </span>
              <span className="h-px flex-1 bg-[var(--color-divider)]" />
            </div>

            <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
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

              <button
                type="submit"
                disabled={loading || !emailOk || !passOk || !userOk}
                className="primary-button mt-1 min-h-[38px] w-full text-sm"
              >
                {loading && <CircleNotch className="h-4 w-4 animate-spin" />}
                {loading ? 'Comprobando…' : isRegister ? 'Crear cuenta' : 'Entrar'}
              </button>

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
