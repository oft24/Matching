import { useEffect, useRef, useState } from 'react';
import { CircleNotch } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { fetchAuthConfig } from '../lib/api';
import { parseAuthError } from '../lib/authErrors';

const GIS_SRC = 'https://accounts.google.com/gsi/client';

interface GoogleCredentialResponse {
  credential?: string;
}

interface GoogleAccountsId {
  initialize(config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
  }): void;
  renderButton(parent: HTMLElement, options: Record<string, unknown>): void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

/** El script se pide una sola vez aunque haya varios botones en la página. */
let gisLoader: Promise<void> | null = null;

function loadGoogleScript(): Promise<void> {
  if (gisLoader) return gisLoader;

  gisLoader = new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`);
    const script = existing ?? document.createElement('script');
    script.addEventListener('load', () => resolve());
    script.addEventListener('error', () => {
      // Sin esto un fallo de red dejaría el promise cacheado y roto para siempre.
      gisLoader = null;
      reject(new Error('No se pudo cargar el inicio de sesión de Google'));
    });

    if (!existing) {
      script.src = GIS_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  });

  return gisLoader;
}

interface GoogleSignInButtonProps {
  /** `dark` para superficies oscuras (modal), `light` para la pantalla previa. */
  theme?: 'dark' | 'light';
  onSignedIn?: () => void;
  acceptTerms?: boolean;
  termsVersion?: string;
  disabled?: boolean;
}

type Status = 'loading' | 'ready' | 'signing' | 'unavailable' | 'error';

/**
 * Botón «Continuar con Google». Entrar con correo sigue siendo posible, así que
 * si Google no está disponible el componente se retira en silencio en vez de
 * plantar un error delante de un formulario que sí funciona.
 */
export default function GoogleSignInButton({ theme = 'dark', onSignedIn, acceptTerms = false, termsVersion, disabled = false }: GoogleSignInButtonProps) {
  const { loginWithGoogle } = useAuth();
  const holder = useRef<HTMLDivElement>(null);
  const consentRef = useRef({ acceptTerms, termsVersion });
  const signedInRef = useRef(onSignedIn);
  const loginRef = useRef(loginWithGoogle);
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    consentRef.current = { acceptTerms, termsVersion };
    signedInRef.current = onSignedIn;
    loginRef.current = loginWithGoogle;
  }, [acceptTerms, loginWithGoogle, onSignedIn, termsVersion]);

  useEffect(() => {
    let cancelled = false;

    const giveUp = () => { if (!cancelled) setStatus('unavailable'); };

    (async () => {
      try {
        const config = await fetchAuthConfig();
        if (cancelled) return;

        if (!config.database || !config.googleClientId) return giveUp();

        await loadGoogleScript();
        if (cancelled || !holder.current) return;

        const accounts = window.google?.accounts?.id;
        if (!accounts) return giveUp();

        accounts.initialize({
          client_id: config.googleClientId,
          callback: async ({ credential }) => {
            if (!credential) return;
            setError('');
            setStatus('signing');
            try {
              await loginRef.current(credential, consentRef.current.acceptTerms, consentRef.current.termsVersion);
              signedInRef.current?.();
            } catch (err) {
              if (cancelled) return;
              // Un fallo al canjear el token sí merece decirse: el usuario
              // acaba de elegir su cuenta y espera haber entrado.
              setError(parseAuthError(err));
              setStatus('error');
            }
          },
        });

        accounts.renderButton(holder.current, {
          type: 'standard',
          theme: theme === 'dark' ? 'filled_black' : 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          logo_alignment: 'left',
          width: 300,
        });

        setStatus('ready');
      } catch {
        giveUp();
      }
    })();

    return () => { cancelled = true; };
    // Se monta una vez por botón: reinicializar Google en cada render duplicaría el widget.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === 'unavailable') return null;

  return (
    <div className={`flex w-full flex-col items-center gap-3 ${disabled ? 'pointer-events-none opacity-45' : ''}`} aria-disabled={disabled}>
      {/* Google inyecta su iframe aquí; se oculta mientras no esté listo. */}
      <div ref={holder} className={status === 'loading' ? 'hidden' : ''} />

      {status === 'loading' && (
        <p className="flex items-center gap-2 text-sm text-slate-400">
          <CircleNotch className="w-4 h-4 animate-spin" /> Preparando el acceso…
        </p>
      )}

      {status === 'signing' && (
        <p className="flex items-center gap-2 text-sm text-slate-400">
          <CircleNotch className="w-4 h-4 animate-spin" /> Entrando…
        </p>
      )}

      {error && (
        <p className="w-full rounded-lg border border-red-400/15 bg-red-500/10 px-3 py-2 text-center text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
