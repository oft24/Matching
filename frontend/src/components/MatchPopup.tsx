import { Check, X, Users, MessageCircle, ExternalLink } from 'lucide-react';
import type { QueueStatus } from '../types';

interface MatchPopupProps {
  status: QueueStatus;
  onAccept: () => void;
  onReject: () => void;
  loading: boolean;
}

export default function MatchPopup({ status, onAccept, onReject, loading }: MatchPopupProps) {
  const opponent = status.opponent;
  if (!opponent || !status.matchId) return null;

  const isAccepted = status.status === 'accepted';
  const waiting = status.myAccepted && !status.opponentAccepted && status.status === 'pending';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative glass rounded-2xl w-full max-w-md p-6 glow-violet animate-pulse-glow">
        {!isAccepted ? (
          <>
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-violet/20 text-brand-violet text-sm font-medium mb-4">
                <Users className="w-4 h-4" /> Jugador encontrado
              </div>
              <h2 className="text-xl font-bold text-white">¿Jugar con este compañero?</h2>
              {status.compatibility && (
                <p className="text-slate-400 text-sm mt-1">{status.compatibility}% compatibilidad</p>
              )}
            </div>

            <div className="glass rounded-2xl p-5 mb-6 text-center">
              <img
                src={opponent.avatar}
                alt={opponent.username}
                className="w-20 h-20 rounded-2xl mx-auto mb-3 ring-2 ring-brand-violet/50"
              />
              <h3 className="text-lg font-bold text-white">{opponent.username}</h3>
              <p className="text-sm text-slate-400 mb-2">Nivel {opponent.level}</p>
              {opponent.riot && (
                <p className="text-sm text-brand-violet font-medium">
                  {opponent.riot.gameName}#{opponent.riot.tagLine} · {opponent.riot.region}
                </p>
              )}
              {opponent.discord && (
                <p className="text-sm text-indigo-400 flex items-center justify-center gap-1 mt-1">
                  <MessageCircle className="w-3.5 h-3.5" /> {opponent.discord.username}
                </p>
              )}
            </div>

            {waiting ? (
              <p className="text-center text-amber-400 text-sm mb-4">
                Esperando que el otro jugador acepte...
              </p>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={onReject}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-red-500/30
                    text-red-400 hover:bg-red-500/10 font-medium text-sm disabled:opacity-50"
                >
                  <X className="w-4 h-4" /> Rechazar
                </button>
                <button
                  onClick={onAccept}
                  disabled={loading || status.myAccepted}
                  className="flex-1 gradient-btn flex items-center justify-center gap-2 py-3 rounded-2xl
                    text-white font-bold text-sm disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  {status.myAccepted ? 'Aceptado' : 'Aceptar'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">¡Match confirmado!</h2>
            <p className="text-slate-400 text-sm mb-6">
              Ambos aceptaron. Únete al grupo de Discord con {opponent.username}.
            </p>
            {status.discordInviteUrl && (
              <a
                href={status.discordInviteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="gradient-btn inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-bold text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                Abrir Discord
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
