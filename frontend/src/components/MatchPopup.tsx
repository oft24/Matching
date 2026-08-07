import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Copy, ExternalLink, MessageCircle, Send, UsersRound, X } from 'lucide-react';
import Avatar, { accentOf, initialsOf } from './Avatar';
import { fetchMatchMessages, sendMatchMessage } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { MatchMessage, QueueStatus } from '../types';

interface MatchPopupProps {
  status: QueueStatus;
  onAccept: () => void;
  onReject: () => void;
  onClose: () => void;
  loading: boolean;
}

const CONFETTI_COLORS = ['#7c3aed', '#3b82f6', '#a78bfa', '#34d399', '#38bdf8', '#fbbf24'];

/** Confeti del momento del match: piezas con posición, color y giro fijos por render. */
function Confetti() {
  const pieces = useMemo(
    () => Array.from({ length: 26 }, (_, i) => ({
      left: `${(i * 3.9 + (i % 5) * 2) % 100}%`,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: `${(i % 8) * 90}ms`,
      drift: `${((i % 7) - 3) * 26}px`,
      spin: `${360 + (i % 4) * 220}deg`,
    })),
    [],
  );

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-64 overflow-hidden" aria-hidden="true">
      {pieces.map((piece, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: piece.left,
            background: piece.color,
            animationDelay: piece.delay,
            ['--drift' as string]: piece.drift,
            ['--spin' as string]: piece.spin,
          }}
        />
      ))}
    </div>
  );
}

export default function MatchPopup({ status, onAccept, onReject, onClose, loading }: MatchPopupProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MatchMessage[]>([]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exiting, setExiting] = useState(false);
  // El chat aparece un instante después de la celebración, para que se lea "match encontrado"
  const [chatVisible, setChatVisible] = useState(false);

  const opponent = status.opponent;
  const isAccepted = status.status === 'accepted';

  const loadMessages = useCallback(async () => {
    if (!isAccepted || !status.matchId) return;
    try {
      setMessages(await fetchMatchMessages(status.matchId));
    } catch {
      // A temporary poll failure should not close a confirmed match.
    }
  }, [isAccepted, status.matchId]);

  useEffect(() => {
    if (!isAccepted) return;
    void loadMessages();
    const timer = setInterval(loadMessages, 2500);
    return () => clearInterval(timer);
  }, [isAccepted, loadMessages]);

  useEffect(() => {
    if (!isAccepted) return setChatVisible(false);
    const timer = window.setTimeout(() => setChatVisible(true), 1400);
    return () => window.clearTimeout(timer);
  }, [isAccepted]);

  if (!opponent || !status.matchId) return null;

  const decide = (choice: 'accept' | 'reject') => {
    if (loading || exiting) return;
    setExiting(true);
    // La tarjeta se retira hacia el fondo antes de confirmar — sin deslizamiento lateral
    window.setTimeout(() => (choice === 'accept' ? onAccept() : onReject()), 220);
  };

  const handleSend = async (event: FormEvent) => {
    event.preventDefault();
    const content = message.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      const created = await sendMatchMessage(status.matchId!, content);
      setMessages((current) => [...current, created]);
      setMessage('');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="match-backdrop absolute inset-0 bg-black/85" />

      <div className={`match-card relative w-full max-w-md ${exiting ? 'match-card-out' : ''}`}>
        {isAccepted && <Confetti />}

        <div className="glass glow-violet relative overflow-hidden rounded-3xl">
          {isAccepted && (
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 z-10 rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
              title="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          )}

          {!isAccepted ? (
            /* ---------- Propuesta de match ---------- */
            <>
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
                      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-brand-violet to-pink-500 px-3 py-1 text-xs font-black text-white shadow-lg">
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
                      <X className="h-7 w-7" strokeWidth={2.5} />
                    </button>
                    <button
                      onClick={() => decide('accept')}
                      disabled={loading}
                      title="Conectar"
                      aria-label="Conectar"
                      className="decision-button decision-like disabled:opacity-50"
                    >
                      <Check className="h-7 w-7" strokeWidth={3} />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* ---------- Match confirmado ---------- */
            <div>
              <div className="relative px-6 pb-6 pt-9 text-center">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(124,58,237,0.32),transparent_70%)]" />

                <div className="relative mx-auto mb-6 h-28 max-w-[250px]">
                  <span className="avatar-initials match-avatar-left absolute left-4 top-2 h-24 w-20 rounded-2xl border-2 border-white/25 text-2xl shadow-xl">
                    {initialsOf(user?.username ?? '')}
                  </span>
                  <span
                    className="avatar-initials match-avatar-right absolute right-4 top-2 h-24 w-20 rounded-2xl border-2 border-white/25 text-2xl shadow-xl"
                    style={{ background: accentOf(opponent.username) }}
                  >
                    {initialsOf(opponent.username)}
                  </span>
                  <span className="match-link absolute left-1/2 top-9 z-10 grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-brand-violet to-brand-blue text-white shadow-[0_0_30px_rgba(124,58,237,0.75)]">
                    <span className="match-halo" />
                    <span className="match-halo" />
                    <UsersRound className="h-6 w-6" strokeWidth={2.2} />
                  </span>
                </div>

                <h2 className="match-title text-[clamp(2rem,10vw,3.25rem)] font-black leading-none tracking-tight text-white">
                  MATCH<br />REALIZADO
                </h2>
                <p className="match-sub mt-3 text-sm text-slate-400">
                  Tú y {opponent.username} se aceptaron.
                </p>

                {opponent.discord && (
                  <div className="match-sub mx-auto mt-5 flex max-w-sm items-center gap-3 rounded-xl border border-[#5865F2]/30 bg-[#5865F2]/10 px-4 py-3 text-left">
                    <MessageCircle className="h-5 w-5 flex-shrink-0 text-[#8b95ff]" />
                    <span className="min-w-0 flex-1">
                      <small className="block text-xs text-slate-500">Discord</small>
                      <strong className="block truncate text-sm text-white">{opponent.discord.username}</strong>
                    </span>
                    <button
                      title="Copiar Discord"
                      onClick={async () => { await navigator.clipboard.writeText(opponent.discord!.username); setCopied(true); }}
                      className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-md text-indigo-300 transition-colors hover:bg-white/10"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                )}

                {status.discordInviteUrl && (
                  <a
                    href={status.discordInviteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="primary-button match-sub mt-4 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold"
                  >
                    <ExternalLink className="h-4 w-4" /> Abrir llamada de Discord
                  </a>
                )}
              </div>

              {/* El chat entra después, para que la celebración se lea primero */}
              {chatVisible && (
                <div className="match-chat-reveal border-t border-white/10 p-5">
                  <p className="mb-3 text-center text-xs text-slate-500">Escríbele para coordinar la partida.</p>

                  <div className="mb-3 h-44 space-y-2.5 overflow-y-auto" aria-live="polite">
                    {messages.length === 0 ? (
                      <p className="py-14 text-center text-sm text-slate-600">Aún no hay mensajes.</p>
                    ) : (
                      messages.map((item) => {
                        const mine = item.sender.id === user?.id;
                        return (
                          <div key={item.id} className={`flex ${mine ? 'justify-end bubble-out' : 'justify-start bubble-in'}`}>
                            <div className={`max-w-[82%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${mine ? 'bg-brand-violet text-white' : 'bg-slate-700 text-slate-100'}`}>
                              {!mine && <p className="mb-0.5 text-xs font-semibold text-slate-300">{item.sender.username}</p>}
                              <p className="break-words">{item.content}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <form onSubmit={handleSend} className="flex gap-2">
                    <input
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      maxLength={500}
                      autoFocus
                      placeholder={`Saluda a ${opponent.username}...`}
                      className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#0b1220] px-3.5 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-brand-violet"
                    />
                    <button
                      type="submit"
                      disabled={!message.trim() || sending}
                      className="primary-button grid h-11 w-11 flex-shrink-0 place-items-center text-white disabled:opacity-50"
                      title="Enviar mensaje"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
