import { useEffect, useRef, useState, type FormEvent, type PointerEvent, type ReactNode } from 'react';
import {
  ArrowRight,
  CircleNotch,
  Eye,
  EyeSlash,
  GameController,
  Headphones,
  Lightning,
  ShieldCheck,
  SignIn,
  Sparkle,
  UserPlus,
  UsersThree,
} from '@phosphor-icons/react';
import Logo from './Logo';
import MatchingStage from './MatchingStage';
import GoogleSignInButton from './GoogleSignInButton';
import LegalModal from './LegalModal';
import { useAuth } from '../context/AuthContext';
import { parseAuthError } from '../lib/authErrors';
import { LEGAL_VERSION, type LegalSection } from '../data/legal';

type Mode = 'login' | 'register';
type FieldName = 'user' | 'email' | 'pass' | 'terms';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

const VALUE_POINTS = [
  { icon: GameController, label: 'Tu juego y rango' },
  { icon: Headphones, label: 'Tu forma de comunicar' },
  { icon: UsersThree, label: 'Tu química de equipo' },
];

/** Portada y acceso: comunica la propuesta antes de pedir credenciales. */
export default function PreLogin() {
  const { login, register } = useAuth();
  const shellRef = useRef<HTMLDivElement>(null);
  const pointerFrameRef = useRef(0);
  const nextPointerRef = useRef({ x: '70%', y: '28%' });
  const [mode, setMode] = useState<Mode>('login');
  const [user, setUser] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);
  const [legalSection, setLegalSection] = useState<LegalSection>('terms');

  const isRegister = mode === 'register';
  const emailOk = EMAIL_RE.test(email.trim());
  const passOk = pass.length >= 6;
  const userOk = !isRegister || user.trim().length >= 3;
  const termsOk = !isRegister || termsAccepted;

  const showLegal = (section: LegalSection) => {
    setLegalSection(section);
    setLegalOpen(true);
  };

  const touch = (field: FieldName) => () => setTouched((current) => ({ ...current, [field]: true }));
  const switchMode = (next: Mode) => {
    setMode(next);
    setTouched({});
    setStatus('');
    setError('');
  };

  useEffect(() => () => cancelAnimationFrame(pointerFrameRef.current), []);

  const trackPointer = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    nextPointerRef.current = {
      x: `${event.clientX - rect.left}px`,
      y: `${event.clientY - rect.top}px`,
    };
    if (pointerFrameRef.current) return;

    pointerFrameRef.current = requestAnimationFrame(() => {
      const shell = shellRef.current;
      if (shell) {
        shell.style.setProperty('--pointer-x', nextPointerRef.current.x);
        shell.style.setProperty('--pointer-y', nextPointerRef.current.y);
      }
      pointerFrameRef.current = 0;
    });
  };

  const userError = touched.user && !userOk ? 'Usa al menos 3 caracteres.' : '';
  const emailError = touched.email && !emailOk
    ? (email.trim() ? 'Revisa el formato: nombre@dominio.com' : 'Escribe tu email.')
    : '';
  const passError = touched.pass && !passOk ? 'Mínimo 6 caracteres.' : '';

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setTouched({ user: true, email: true, pass: true, terms: true });
    if (!emailOk || !passOk || !userOk || !termsOk || loading) return;

    setLoading(true);
    setError('');
    setStatus(isRegister ? 'Creando tu perfil…' : 'Abriendo tu lobby…');
    try {
      if (isRegister) await register(user.trim(), email.trim(), pass, termsAccepted, LEGAL_VERSION);
      else await login(email.trim(), pass);
    } catch (requestError) {
      setError(parseAuthError(requestError));
      setStatus('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={shellRef} className="prelogin-shell" onPointerMove={trackPointer}>
      <div className="prelogin-grid-bg" aria-hidden="true" />
      <div className="prelogin-pointer-glow" aria-hidden="true" />
      <div className="prelogin-orb prelogin-orb-a" aria-hidden="true" />
      <div className="prelogin-orb prelogin-orb-b" aria-hidden="true" />

      <header className="prelogin-header">
        <a className="brand-lockup" href="#top" aria-label="q2play, inicio">
          <Logo size="sm" />
          <span className="brand-wordmark">q2play</span>
          <span className="brand-beta"><i /> ALPHA</span>
        </a>

        <div className="prelogin-header-note">
          <span className="status-live-dot" />
          <span>2,847 jugadores buscando ahora</span>
        </div>

        <a className="header-access-link" href="#access">
          Entrar <ArrowRight weight="bold" />
        </a>
      </header>

      <main id="top" className="prelogin-main">
        <section className="prelogin-copy">
          <div className="prelogin-kicker anim-fade-up">
            <Sparkle weight="fill" />
            MATCHMAKING CON QUÍMICA REAL
          </div>

          <h1 className="prelogin-title anim-fade-up">
            Tu próxima victoria empieza con el <span>match correcto.</span>
          </h1>

          <p className="prelogin-lede anim-fade-up">
            Encuentra personas que juegan como tú: mismo nivel, misma intención y la energía correcta para tu próxima partida.
          </p>

          <div className="prelogin-actions anim-fade-up">
            <a className="signal-cta" href="#access">
              Encontrar mi squad <ArrowRight weight="bold" />
            </a>
            <span className="cta-note"><ShieldCheck weight="fill" /> Perfiles reales · Match mutuo</span>
          </div>

          <div className="value-strip stagger">
            {VALUE_POINTS.map(({ icon: Icon, label }) => (
              <div key={label} className="value-item">
                <Icon weight="duotone" />
                <span>{label}</span>
              </div>
            ))}
          </div>

          <section id="access" className="access-card anim-fade-up" aria-labelledby="access-title">
            <div className="access-card-head">
              <div>
                <p className="access-eyebrow">TU LOBBY TE ESPERA</p>
                <h2 id="access-title">{isRegister ? 'Crea tu perfil de jugador' : 'Continúa donde lo dejaste'}</h2>
              </div>
              <div className="access-mode" aria-label="Modo de acceso">
                {([['login', 'Entrar', SignIn], ['register', 'Crear cuenta', UserPlus]] as const).map(([value, label, Icon]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => switchMode(value)}
                    aria-pressed={mode === value}
                    className={mode === value ? 'access-mode-active' : ''}
                  >
                    <Icon /> {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="access-google">
              <GoogleSignInButton
                theme="dark"
                acceptTerms={isRegister && termsAccepted}
                termsVersion={LEGAL_VERSION}
                disabled={isRegister && !termsAccepted}
              />
              {isRegister && !termsAccepted ? <p className="access-google-note">Acepta los acuerdos para crear una cuenta con Google.</p> : null}
              <span className="access-divider">o usa tu correo</span>
            </div>

            <form onSubmit={submit} className="access-form" noValidate>
              {isRegister ? (
                <Field label="Nombre de jugador" htmlFor="pl-user" error={userError}>
                  <input
                    id="pl-user"
                    type="text"
                    autoComplete="username"
                    placeholder="Tu gamertag"
                    value={user}
                    onChange={(event) => { setUser(event.target.value); setError(''); }}
                    onBlur={touch('user')}
                    className="nocturne-input"
                  />
                </Field>
              ) : null}

              <Field label="Email" htmlFor="pl-email" error={emailError}>
                <input
                  id="pl-email"
                  type="email"
                  autoComplete="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(event) => { setEmail(event.target.value); setError(''); }}
                  onBlur={touch('email')}
                  className="nocturne-input"
                />
              </Field>

              <Field label="Contraseña" htmlFor="pl-pass" error={passError}>
                <div className="password-field">
                  <input
                    id="pl-pass"
                    type={showPass ? 'text' : 'password'}
                    autoComplete={isRegister ? 'new-password' : 'current-password'}
                    placeholder="Mínimo 6 caracteres"
                    value={pass}
                    onChange={(event) => { setPass(event.target.value); setError(''); }}
                    onBlur={touch('pass')}
                    className="nocturne-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((visible) => !visible)}
                    aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPass ? <EyeSlash /> : <Eye />}
                  </button>
                </div>
              </Field>

              {isRegister ? (
                <div className={`legal-consent ${touched.terms && !termsAccepted ? 'legal-consent-error' : ''}`}>
                  <input
                    id="pl-terms"
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(event) => { setTermsAccepted(event.target.checked); setError(''); }}
                  />
                  <span>
                    <label htmlFor="pl-terms">Tengo 18 años o más y acepto los </label>
                    <button type="button" onClick={() => showLegal('terms')}>Términos</button>, el{' '}
                    <button type="button" onClick={() => showLegal('privacy')}>Aviso de Privacidad</button> y las{' '}
                    <button type="button" onClick={() => showLegal('rules')}>Reglas de comunidad</button>.
                  </span>
                </div>
              ) : null}

              <button type="submit" disabled={loading || !emailOk || !passOk || !userOk || !termsOk} className="access-submit">
                {loading ? <CircleNotch className="animate-spin" /> : <Lightning weight="fill" />}
                {loading ? 'Conectando…' : isRegister ? 'Crear mi perfil' : 'Entrar a q2play'}
                {!loading ? <ArrowRight weight="bold" /> : null}
              </button>

              <div className="access-feedback" aria-live="polite">
                {error ? <p className="access-error">{error}</p> : null}
                {!error && status ? <p>{status}</p> : null}
              </div>
            </form>
          </section>
        </section>

        <section className="signal-column" aria-label="Demostración de compatibilidad">
          <div className="signal-panel">
            <div className="signal-panel-head">
              <div>
                <span className="signal-label">SEÑAL EN VIVO</span>
                <p>Buscando tu mejor conexión</p>
              </div>
              <span className="signal-scanning"><i /> Escaneando</span>
            </div>

            <div className="signal-stage">
              <div className="signal-stage-glow" aria-hidden="true" />
              <MatchingStage seconds={5.2} profiles={10} />
              <div className="signal-card signal-card-a" aria-hidden="true">
                <span className="signal-avatar">SO</span>
                <span><b>Sofía</b><small>Support · Gold</small></span>
                <strong>94%</strong>
              </div>
              <div className="signal-card signal-card-b" aria-hidden="true">
                <span className="signal-avatar signal-avatar-mint">MR</span>
                <span><b>Marco</b><small>Mid · Platinum</small></span>
                <strong>91%</strong>
              </div>
            </div>

            <div className="signal-metrics">
              <div><strong>12s</strong><span>match medio</span></div>
              <div><strong>93%</strong><span>afinidad media</span></div>
              <div><strong>24/7</strong><span>cola activa</span></div>
            </div>
          </div>

          <p className="signal-caption"><i /> La compatibilidad se recalcula con cada preferencia</p>
        </section>
      </main>
      <footer className="prelogin-legal-footer">
        <span>© 2026 q2play</span>
        <button type="button" onClick={() => showLegal('terms')}>Términos</button>
        <button type="button" onClick={() => showLegal('privacy')}>Privacidad</button>
        <button type="button" onClick={() => showLegal('rules')}>Reglas</button>
      </footer>
      <LegalModal open={legalOpen} section={legalSection} onSectionChange={setLegalSection} onClose={() => setLegalOpen(false)} />
    </div>
  );
}

function Field({ label, htmlFor, error, children }: {
  label: string;
  htmlFor: string;
  error: string;
  children: ReactNode;
}) {
  return (
    <div className="access-field">
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {error ? <p>{error}</p> : null}
    </div>
  );
}
