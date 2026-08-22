import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, GameController, Timer, X } from '@phosphor-icons/react';
import Avatar, { accentOf } from './Avatar';
import { DEFAULT_GAMES } from '../data/games';
import type { QueueStatus } from '../types';

interface MatchPopupProps {
  status: QueueStatus;
  onAccept: () => Promise<boolean>;
  onReject: () => Promise<boolean>;
  onClose: () => void;
  loading: boolean;
}

/**
 * Propuesta de match: sólo se muestra mientras el match está `pending`.
 * La celebración vive en MatchFoundOverlay y el chat en MatchChatDock.
 */
export default function MatchPopup({ status, onAccept, onReject, onClose, loading }: MatchPopupProps) {
  const [exiting, setExiting] = useState(false);
  const [decision, setDecision] = useState<'accept' | 'reject' | null>(null);
  const [remaining, setRemaining] = useState(() => secondsUntil(status.expiresAt));
  const exitRef = useRef<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const opponent = status.opponent;

  useEffect(() => {
    setRemaining(secondsUntil(status.expiresAt));
    const timer = window.setInterval(() => setRemaining(secondsUntil(status.expiresAt)), 1000);
    return () => window.clearInterval(timer);
  }, [status.expiresAt]);

  useEffect(() => () => { if (exitRef.current) window.clearTimeout(exitRef.current); }, []);

  useEffect(() => { closeRef.current?.focus(); }, [status.matchId]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !loading) { onClose(); return; }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled])');
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKey);
    };
  }, [loading, onClose]);

  if (!opponent || !status.matchId) return null;

  const decide = (choice: 'accept' | 'reject') => {
    if (loading || exiting) return;
    setDecision(choice);
    setExiting(true);
    // La tarjeta confirma después de retirarse; si la API falla vuelve a su sitio.
    exitRef.current = window.setTimeout(async () => {
      const completed = await (choice === 'accept' ? onAccept() : onReject());
      if (choice === 'accept' || !completed) {
        setExiting(false);
        setDecision(null);
      }
      exitRef.current = null;
    }, 220);
  };

  const game = DEFAULT_GAMES.find((item) => item.id === status.game);

  // Igual que la celebración: fuera del árbol de la página, que arrastra un
  // transform de entrada y desplazaría este `fixed` con el contenido.
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="match-proposal-title">
      <button type="button" disabled={loading || exiting} className="match-backdrop absolute inset-0 bg-black/85" aria-label="Cerrar propuesta" onClick={onClose} />

      <div ref={panelRef} className={`match-card relative w-full max-w-md ${exiting ? 'match-card-out' : ''}`}>
        <div className="glass glow-violet relative overflow-hidden rounded-3xl">
          <span className="match-scan-line" aria-hidden="true" />
          <button ref={closeRef} type="button" onClick={onClose} disabled={loading || exiting} aria-label="Cerrar propuesta" className="absolute right-4 top-4 z-20 grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-black/25 text-slate-400 transition hover:border-white/25 hover:text-white">
            <X className="h-4 w-4" />
          </button>
          <div className="relative px-6 pb-6 pt-8 text-center">
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-40 opacity-70"
              style={{ background: `radial-gradient(60% 100% at 50% 0%, ${accentOf(opponent.username)}33, transparent 70%)` }}
            />

            <div className="relative">
              <p className="match-kicker section-kicker">JUGADOR ENCONTRADO</p>
              <div className="match-signal-lock" aria-hidden="true"><i /><i /><i /></div>

              <div className="relative mx-auto mt-5 w-fit">
                <Avatar name={opponent.username} src={opponent.avatar} size={132} radius={34} className="anim-pop" />
                {status.compatibility && (
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-brand-violet to-brand-blue px-3 py-1 text-xs font-black text-white shadow-lg">
                    {status.compatibility}% compatible
                  </span>
                )}
              </div>

              <h2 id="match-proposal-title" className="mt-6 text-2xl font-black text-white">{opponent.username}</h2>
              <p className="mt-1 text-sm text-slate-400">Nivel {opponent.level}</p>
              {game && (
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-slate-300">
                  <GameController weight="fill" className="h-3.5 w-3.5 text-violet-300" /> {game.name}
                </p>
              )}
              {opponent.riot && (
                <p className="mt-1 text-sm font-semibold text-violet-300">
                  {opponent.riot.gameName}#{opponent.riot.tagLine} · {opponent.riot.region}
                </p>
              )}
            </div>
          </div>

          {status.myAccepted ? (
            <div className="relative overflow-hidden border-t border-white/10 p-6 text-center">
              <span className="waiting-sweep" aria-hidden="true" />
              <div className="relative">
                <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-brand-violet border-t-transparent" />
                <p className="text-sm font-bold text-white">Ya aceptaste</p>
                <p className="mt-1 text-xs text-slate-400">
                  El chat se abre cuando {opponent.username} acepte.
                </p>
                <button
                  onClick={() => decide('reject')}
                  disabled={loading}
                  className="mt-4 text-xs font-semibold text-red-400 transition-colors hover:text-red-300"
                >
                  Cancelar solicitud
                </button>
              </div>
            </div>
          ) : (
            <div className="border-t border-white/10 px-6 py-6">
              <div className="mb-5 flex items-center justify-center gap-2 text-center text-xs text-slate-500">
                <Timer className="h-4 w-4 text-violet-300" /> {remaining === null ? 'Si ambos aceptan, se abre el chat.' : `${formatRemaining(remaining)} para responder`}
              </div>
              <div className="flex items-center justify-center gap-8">
                <button
                  onClick={() => decide('reject')}
                  disabled={loading}
                  title="Rechazar"
                  aria-label="Rechazar"
                  className="decision-button decision-nope disabled:opacity-50"
                >
                  {decision === 'reject' ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <X className="h-7 w-7" weight="bold" />}
                </button>
                <button
                  onClick={() => decide('accept')}
                  disabled={loading}
                  title="Conectar"
                  aria-label="Conectar"
                  className="decision-button decision-like disabled:opacity-50"
                >
                  {decision === 'accept' ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <Check className="h-7 w-7" weight="bold" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function secondsUntil(expiresAt?: string) {
  if (!expiresAt) return null;
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000));
}

function formatRemaining(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
