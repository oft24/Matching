import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Check, Copy, ExternalLink, Heart, MessageCircle, Send, Users, X } from 'lucide-react';
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

export default function MatchPopup({ status, onAccept, onReject, onClose, loading }: MatchPopupProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MatchMessage[]>([]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
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

  if (!opponent || !status.matchId) return null;

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
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative glass rounded-lg w-full max-w-lg p-6 glow-violet">
        {isAccepted && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 p-2 text-slate-400 hover:text-white"
            title="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {!isAccepted ? (
          <>
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-violet/20 text-brand-violet text-sm font-medium mb-4">
                <Users className="w-4 h-4" /> Solicitud encontrada
              </div>
              <h2 className="text-xl font-bold text-white">{status.myAccepted ? 'Esperando confirmación' : '¿Jugar con esta persona?'}</h2>
              {status.compatibility && (
                <p className="text-slate-400 text-sm mt-1">{status.compatibility}% de compatibilidad</p>
              )}
            </div>

            <div className="border-y border-white/10 py-5 mb-6 text-center">
              <img
                src={opponent.avatar}
                alt={opponent.username}
                className="w-20 h-20 rounded-lg mx-auto mb-3 ring-2 ring-brand-violet/50"
              />
              <h3 className="text-lg font-bold text-white">{opponent.username}</h3>
              <p className="text-sm text-slate-400 mb-2">Nivel {opponent.level}</p>
              {opponent.riot && (
                <p className="text-sm text-brand-violet font-medium">
                  {opponent.riot.gameName}#{opponent.riot.tagLine} · {opponent.riot.region}
                </p>
              )}
            </div>

            {status.myAccepted ? <div className="rounded-lg border border-brand-violet/20 bg-brand-violet/10 p-4 text-center"><div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-brand-violet border-t-transparent" /><p className="text-sm font-semibold text-white">Ya aceptaste este match</p><p className="mt-1 text-xs text-slate-400">El chat se abrirá cuando {opponent.username} también acepte.</p><button onClick={onReject} disabled={loading} className="mt-4 text-xs font-semibold text-red-400 hover:text-red-300">Cancelar solicitud</button></div> : <div className="flex gap-3">
              <button
                onClick={onReject}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 font-medium text-sm disabled:opacity-50"
              >
                <X className="w-4 h-4" /> Rechazar
              </button>
              <button
                onClick={onAccept}
                disabled={loading}
                className="flex-1 gradient-btn flex items-center justify-center gap-2 py-3 rounded-lg text-white font-bold text-sm disabled:opacity-50"
              >
                <Check className="w-4 h-4" /> Aceptar y conectar
              </button>
            </div>}
          </>
        ) : (
          <div>
            <div className="match-celebration text-center pr-8">
              <div className="relative mx-auto mb-5 h-28 max-w-[240px]">
                <img src={user?.avatar ?? `https://api.dicebear.com/9.x/avataaars/svg?seed=${user?.username}`} alt={user?.username ?? 'Tu perfil'} className="match-avatar-left absolute left-5 top-2 h-24 w-20 rounded-xl border-2 border-white/20 object-cover shadow-xl" />
                <img src={opponent.avatar} alt={opponent.username} className="match-avatar-right absolute right-5 top-2 h-24 w-20 rounded-xl border-2 border-white/20 object-cover shadow-xl" />
                <span className="match-heart absolute left-1/2 top-10 z-10 grid h-11 w-11 place-items-center rounded-full bg-pink-500 text-white shadow-lg"><Heart className="h-6 w-6 fill-current" /></span>
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-pink-400">MATCH CONFIRMADO</p>
              <h2 className="mt-1 text-3xl font-black text-white mb-1">¡Hicieron match!</h2>
              <p className="text-slate-400 text-sm mb-4">
                Coordina la partida con {opponent.username}.
              </p>
              {opponent.discord && <div className="mx-auto mb-4 flex max-w-sm items-center gap-3 rounded-lg border border-[#5865F2]/30 bg-[#5865F2]/10 px-4 py-3 text-left"><MessageCircle className="h-5 w-5 text-[#8b95ff]" /><span className="min-w-0 flex-1"><small className="block text-slate-500">Discord</small><strong className="block truncate text-sm text-white">{opponent.discord.username}</strong></span><button title="Copiar Discord" onClick={async () => { await navigator.clipboard.writeText(opponent.discord!.username); setCopied(true); }} className="grid h-8 w-8 place-items-center rounded-md text-indigo-300 hover:bg-white/10">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</button></div>}
              {status.discordInviteUrl && (
                <a
                  href={status.discordInviteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gradient-btn inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white font-bold text-sm mb-4"
                >
                  <ExternalLink className="w-4 h-4" /> Abrir llamada de Discord
                </a>
              )}
            </div>

            <div className="border-t border-white/10 pt-4">
              <div className="h-48 overflow-y-auto space-y-3 mb-3" aria-live="polite">
                {messages.length === 0 && (
                  <p className="text-center text-slate-500 text-sm py-12">
                    Escribe un mensaje o comparte tu usuario de Discord.
                  </p>
                )}
                {messages.map((item) => {
                  const mine = item.sender.id === user?.id;
                  return (
                    <div key={item.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[82%] rounded-lg px-3 py-2 text-sm ${mine ? 'bg-brand-violet text-white' : 'bg-slate-700 text-slate-100'}`}>
                        {!mine && <p className="text-xs text-slate-300 font-semibold mb-0.5">{item.sender.username}</p>}
                        <p className="break-words">{item.content}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <form onSubmit={handleSend} className="flex gap-2">
                <input
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  maxLength={500}
                  placeholder="Mensaje o usuario de Discord"
                  className="min-w-0 flex-1 rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-violet"
                />
                <button
                  type="submit"
                  disabled={!message.trim() || sending}
                  className="gradient-btn rounded-lg p-3 text-white disabled:opacity-50"
                  title="Enviar mensaje"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
