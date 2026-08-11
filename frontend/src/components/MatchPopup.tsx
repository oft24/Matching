import { useState } from 'react';
import { Check, X } from '@phosphor-icons/react';
import Avatar, { accentOf } from './Avatar';
import type { QueueStatus } from '../types';

interface MatchPopupProps {
  status: QueueStatus;
  onAccept: () => void;
  onReject: () => void;
  onClose: () => void;
  loading: boolean;
}

/**
 * Propuesta de match: sólo se muestra mientras el match está `pending`.
 * La celebración vive en MatchFoundOverlay y el chat en MatchChatDock.
 */
export default function MatchPopup({ status, onAccept, onReject, loading }: MatchPopupProps) {
  const [exiting, setExiting] = useState(false);
  const opponent = status.opponent;

  if (!opponent || !status.matchId) return null;

  const decide = (choice: 'accept' | 'reject') => {
    if (loading || exiting) return;
    setExiting(true);
    // La tarjeta se retira hacia el fondo antes de confirmar — sin deslizamiento lateral
    window.setTimeout(() => (choice === 'accept' ? onAccept() : onReject()), 220);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="match-backdrop absolute inset-0 bg-black/85" />

      <div className={`match-card relative w-full max-w-md ${exiting ? 'match-card-out' : ''}`}>
        <div className="glass glow-violet relative overflow-hidden rounded-3xl">
          <div className="relative px-6 pb-6 pt-8 text-center">
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-40 opacity-70"
              style={{ background: `radial-gradient(60% 100% at 50% 0%, ${accentOf(opponent.username)}33, transparent 70%)` }}
            />

            <div className="relative">
              <p className="match-kicker section-kicker">JUGADOR ENCONTRADO</p>

              <div className="relative mx-auto mt-5 w-fit">
                <Avatar name={opponent.username} src={opponent.avatar} size={132} radius={34} className="anim-pop" />
                {status.compatibility && (
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-brand-violet to-brand-blue px-3 py-1 text-xs font-black text-white shadow-lg">
                    {status.compatibility}% compatible
                  </span>
                )}
              </div>

              <h2 className="mt-6 text-2xl font-black text-white">{opponent.username}</h2>
              <p className="mt-1 text-sm text-slate-400">Nivel {opponent.level}</p>
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
                  onClick={onReject}
                  disabled={loading}
                  className="mt-4 text-xs font-semibold text-red-400 transition-colors hover:text-red-300"
                >
                  Cancelar solicitud
                </button>
              </div>
            </div>
          ) : (
            <div className="border-t border-white/10 px-6 py-6">
              <p className="mb-5 text-center text-xs text-slate-500">
                Si ambos aceptan, se abre el chat.
              </p>
              <div className="flex items-center justify-center gap-8">
                <button
                  onClick={() => decide('reject')}
                  disabled={loading}
                  title="Rechazar"
                  aria-label="Rechazar"
                  className="decision-button decision-nope disabled:opacity-50"
                >
                  <X className="h-7 w-7" weight="bold" />
                </button>
                <button
                  onClick={() => decide('accept')}
                  disabled={loading}
                  title="Conectar"
                  aria-label="Conectar"
                  className="decision-button decision-like disabled:opacity-50"
                >
                  <Check className="h-7 w-7" weight="bold" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
