import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, ChatCircle } from '@phosphor-icons/react';
import Avatar from './Avatar';
import { useAuth } from '../context/AuthContext';
import type { QueueStatus } from '../types';

interface MatchFoundOverlayProps {
  status: QueueStatus;
  /** Cerrar y volver a la cola. */
  onDone: () => void;
  /** Abrir la conversación con el jugador emparejado. */
  onMessage?: () => void;
}

/** Chispas del momento de impacto: pocas y con recorrido fijo, no confeti. */
const SPARKS = Array.from({ length: 8 }, (_, i) => {
  const angle = (i / 8) * Math.PI * 2;
  return { dx: `${Math.cos(angle) * 78}px`, dy: `${Math.sin(angle) * 78}px`, delay: `${i * 24}ms` };
});

/** Antes de esto la escena aún se está montando: cerrar cortaría la animación. */
const LOCK_MS = 900;

export default function MatchFoundOverlay({ status, onDone, onMessage }: MatchFoundOverlayProps) {
  const { user } = useAuth();
  const opponent = status.opponent;
  const [closing, setClosing] = useState(false);
  const [interactive, setInteractive] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const firstCtaRef = useRef<HTMLButtonElement>(null);

  const close = useCallback((then?: () => void) => {
    setClosing(true);
    // La salida se ve completa antes de desmontar
    window.setTimeout(() => { then?.(); onDone(); }, 220);
  }, [onDone]);

  // El usuario toma el control cuando la narrativa ha terminado de contarse
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setInteractive(true);
      firstCtaRef.current?.focus();
    }, LOCK_MS);
    return () => window.clearTimeout(timer);
  }, []);

  // Bloqueo de scroll, restaurado exactamente como estaba
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, []);

  // Escape para salir y foco atrapado dentro del panel mientras está abierto
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && interactive) { close(); return; }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll<HTMLElement>('button, [href]');
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [interactive, close]);

  if (!opponent) return null;

  const yo = user?.username ?? 'Tú';

  return (
    <div
      className={`fixed inset-0 z-[120] grid place-items-center p-4 ${closing ? 'mf-closing' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="mf-title"
    >
      <div
        className="mf-veil absolute inset-0 bg-[color-mix(in_srgb,var(--color-bg)_92%,transparent)] backdrop-blur-md"
        onClick={() => interactive && close()}
        aria-hidden="true"
      />
      {/* Foco de luz: la única presencia saturada de la escena */}
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{ background: 'radial-gradient(52% 42% at 50% 42%, color-mix(in srgb, var(--color-accent) 24%, transparent), transparent 70%)' }}
        aria-hidden="true"
      />

      <div ref={panelRef} className="relative w-full max-w-md text-center">
        <div className="relative mx-auto mb-8 h-[150px] w-full max-w-[300px]">
          <div className="mf-card-a absolute left-2 top-2 sm:left-6">
            <Avatar name={yo} src={user?.avatar} size={116} radius={16} brand className="shadow-[0_18px_40px_rgba(0,0,0,0.55)] ring-1 ring-[var(--color-accent)]/35" />
          </div>
          <div className="mf-card-b absolute right-2 top-2 sm:right-6">
            <Avatar name={opponent.username} src={opponent.avatar} size={116} radius={16} brand className="shadow-[0_18px_40px_rgba(0,0,0,0.55)] ring-1 ring-[var(--color-accent)]/35" />
          </div>

          {/* Impacto: la marca de conexión, con ondas y chispas */}
          <div className="pointer-events-none absolute left-1/2 top-[58px] z-10" aria-hidden="true">
            <span className="mf-ring absolute left-1/2 top-1/2 h-16 w-16 rounded-full border border-[var(--color-accent)]" />
            <span className="mf-ring mf-ring-2 absolute left-1/2 top-1/2 h-16 w-16 rounded-full border border-[var(--color-accent)]" />
            {SPARKS.map((s, i) => (
              <span
                key={i}
                className="mf-spark absolute left-1/2 top-1/2 h-1 w-1 rounded-full bg-[var(--color-accent-200)]"
                style={{ ['--dx' as string]: s.dx, ['--dy' as string]: s.dy, animationDelay: `calc(560ms + ${s.delay})` }}
              />
            ))}
            <span className="mf-impact absolute left-1/2 top-1/2 grid h-14 w-14 place-items-center rounded-full bg-[var(--color-bg)] text-[var(--color-accent)] shadow-[0_0_0_1px_var(--color-accent),0_0_34px_color-mix(in_srgb,var(--color-accent)_45%,transparent)]">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                <circle cx="8" cy="8" r="3" /><circle cx="16" cy="16" r="3" /><path d="M10.2 9.8L13.8 14.2" />
              </svg>
            </span>
          </div>
        </div>

        <h2 id="mf-title" className="mf-title text-[clamp(30px,7vw,40px)] leading-none text-[var(--color-text)]">
          Hicieron match
        </h2>
        <p className="mf-sub mt-3 text-[15px] text-[color-mix(in_srgb,var(--color-text)_66%,transparent)]">
          A {opponent.username} también le interesó jugar contigo.
        </p>

        <div className="mt-8 flex flex-col items-stretch gap-2.5 sm:mx-auto sm:max-w-[320px]">
          <button
            ref={firstCtaRef}
            onClick={() => close(onMessage)}
            disabled={!interactive}
            className="mf-cta-1 primary-button min-h-[44px] whitespace-nowrap px-5 text-sm disabled:opacity-45"
          >
            <ChatCircle className="h-[18px] w-[18px]" /> Enviar mensaje
          </button>
          <button
            onClick={() => close()}
            disabled={!interactive}
            className="mf-cta-2 ghost-button inline-flex min-h-[40px] items-center justify-center gap-2 whitespace-nowrap px-5 text-sm disabled:opacity-45"
          >
            Seguir explorando <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
