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
}

export default function GoogleSignInButton({ theme = 'dark', onSignedIn }: GoogleSignInButtonProps) {
  const { loginWithGoogle } = useAuth();
  const holder = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'signing' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const fail = (message: string) => {
      if (cancelled) return;
      setError(message);
      setStatus('error');
    };

    (async () => {
      try {
        const config = await fetchAuthConfig();
        if (cancelled) return;

        if (!config.database) {
          return fail('La base de datos no está configurada en el servidor.');
        }
        if (!config.googleClientId) {
          return fail('Falta configurar GOOGLE_CLIENT_ID en el servidor.');
        }

        await loadGoogleScript();
        if (cancelled || !holder.current) return;

        const accounts = window.google?.accounts?.id;
        if (!accounts) return fail('Google no se inicializó correctamente.');

        accounts.initialize({
          client_id: config.googleClientId,
          callback: async ({ credential }) => {
            if (!credential) return fail('Google no devolvió ninguna credencial.');
            setError('');
            setStatus('signing');
            try {
              await loginWithGoogle(credential);
              onSignedIn?.();
            } catch (err) {
              fail(parseAuthError(err));
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
      } catch (err) {
        fail(err instanceof Error ? err.message : 'No se pudo preparar el acceso con Google.');
      }
    })();

    return () => { cancelled = true; };
    // Se monta una vez por botón: reinicializar Google en cada render duplicaría el widget.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Google inyecta su iframe aquí; se oculta mientras no esté listo. */}
      <div ref={holder} className={status === 'ready' || status === 'signing' ? '' : 'hidden'} />

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
