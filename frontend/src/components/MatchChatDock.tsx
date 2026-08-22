import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { ArrowSquareOut, CaretDown, CaretUp, ChatCircle, Check, Copy, DiscordLogo, GameController, LockKey, PaperPlaneTilt, ShieldCheck, Timer, X } from '@phosphor-icons/react';
import Avatar from './Avatar';
import { closeMatchChat, fetchActiveMatchChats, fetchMatchMessages, sendMatchMessage } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { MatchMessage, QueueStatus } from '../types';
import { DEFAULT_GAMES } from '../data/games';

const CHAT_REVEAL_DELAY = 3200;
/** Con la celebración en pantalla el chat espera: lo abre el usuario, no el reloj.
 *  El tope evita que una celebración interrumpida deje la ventana retenida. */
const CELEBRATION_HOLD = 20000;
/** Margen para que la salida de la celebración termine antes de que aparezca el chat. */
const RELEASE_DELAY = 160;
const QUICK_MESSAGES = ['¿Listo para jugar?', '¿Qué rol prefieres?', '¿Entramos a voz?'];

function roomTimeLeft(expiresAt?: string | null) {
  if (!expiresAt) return '';
  const minutes = Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 60000));
  if (!minutes) return 'Expira pronto';
  if (minutes < 60) return `${minutes} min restantes`;
  return `${Math.ceil(minutes / 60)} h restantes`;
}

export default function MatchChatDock() {
  const { isAuthenticated } = useAuth();
  const [chats, setChats] = useState<QueueStatus[]>([]);
  const [focusTarget, setFocusTarget] = useState<string | null>(null);
  const visibleRef = useRef<QueueStatus[]>([]);
  const pendingRef = useRef(new Map<string, QueueStatus>());
  const timersRef = useRef(new Map<string, number>());
  const revealAtRef = useRef(new Map<string, number>());
  const focusRef = useRef(new Set<string>());

  const publish = useCallback((next: QueueStatus[]) => {
    visibleRef.current = next;
    setChats(next);
  }, []);

  const reveal = useCallback((matchId: string) => {
    const pending = pendingRef.current.get(matchId);
    const wanted = focusRef.current.delete(matchId);
    pendingRef.current.delete(matchId);
    timersRef.current.delete(matchId);
    revealAtRef.current.delete(matchId);
    if (!pending) return;
    publish([...visibleRef.current.filter((item) => item.matchId !== matchId), pending]);
    if (wanted) setFocusTarget(matchId);
  }, [publish]);

  // El foco es una señal de un solo uso: si se quedara pegado, una reapertura
  // posterior de ese mismo chat robaría el cursor sin que nadie lo pidiera.
  const clearFocusTarget = useCallback(() => setFocusTarget(null), []);

  const scheduleReveal = useCallback((matchId: string) => {
    const previousTimer = timersRef.current.get(matchId);
    if (previousTimer) window.clearTimeout(previousTimer);
    const releaseAt = revealAtRef.current.get(matchId) ?? Date.now() + CHAT_REVEAL_DELAY;
    revealAtRef.current.set(matchId, releaseAt);
    const timer = window.setTimeout(() => reveal(matchId), Math.max(0, releaseAt - Date.now()));
    timersRef.current.set(matchId, timer);
  }, [reveal]);

  const removeVisible = useCallback((matchId: string) => {
    publish(visibleRef.current.filter((item) => item.matchId !== matchId));
  }, [publish]);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      publish([]);
      return;
    }
    try { setChats(await fetchActiveMatchChats()); } catch { /* preserve current windows on a temporary failure */ }
  }, [isAuthenticated, publish]);

  const refreshWithReveal = useCallback(async () => {
    if (!isAuthenticated) return refresh();
    try {
      const incoming = await fetchActiveMatchChats();
      const incomingIds = new Set(incoming.map((item) => item.matchId).filter(Boolean));
      const incomingById = new Map(incoming.map((item) => [item.matchId, item]));
      publish(visibleRef.current.filter((item) => incomingIds.has(item.matchId)).map((item) => incomingById.get(item.matchId) ?? item));

      for (const [matchId, timer] of timersRef.current) {
        if (!incomingIds.has(matchId)) {
          window.clearTimeout(timer);
          timersRef.current.delete(matchId);
          pendingRef.current.delete(matchId);
          revealAtRef.current.delete(matchId);
        }
      }
      for (const chat of incoming) {
        if (!chat.matchId || visibleRef.current.some((item) => item.matchId === chat.matchId)) continue;
        pendingRef.current.set(chat.matchId, chat);
        if (!timersRef.current.has(chat.matchId)) scheduleReveal(chat.matchId);
      }
    } catch { /* preserve current windows on a temporary failure */ }
  }, [isAuthenticated, publish, refresh, scheduleReveal]);

  useEffect(() => {
    void refreshWithReveal();
    const timer = window.setInterval(refreshWithReveal, 2000);
    return () => window.clearInterval(timer);
  }, [refreshWithReveal]);

  useEffect(() => {
    // Empieza la celebración: el chat queda retenido detrás de ella.
    const announce = (event: Event) => {
      const matchId = (event as CustomEvent<{ matchId?: string }>).detail?.matchId;
      if (!matchId) return;
      revealAtRef.current.set(matchId, Date.now() + CELEBRATION_HOLD);
      if (pendingRef.current.has(matchId)) scheduleReveal(matchId);
    };
    // Termina la celebración: el chat se abre ya, con o sin foco según la salida.
    const release = (event: Event) => {
      const detail = (event as CustomEvent<{ matchId?: string; focus?: boolean }>).detail;
      if (!detail?.matchId) return;
      revealAtRef.current.set(detail.matchId, Date.now() + (detail.focus ? 0 : RELEASE_DELAY));
      if (detail.focus) focusRef.current.add(detail.matchId);
      // Si el chat todavía no se ha descubierto, se pide ahora en vez de esperar al sondeo
      if (pendingRef.current.has(detail.matchId)) scheduleReveal(detail.matchId);
      else void refreshWithReveal();
    };
    window.addEventListener('q2play-found', announce);
    window.addEventListener('q2play-chat-release', release);
    return () => {
      window.removeEventListener('q2play-found', announce);
      window.removeEventListener('q2play-chat-release', release);
    };
  }, [refreshWithReveal, scheduleReveal]);

  // Los temporizadores pendientes mueren con el dock, no antes
  useEffect(() => () => {
    for (const timer of timersRef.current.values()) window.clearTimeout(timer);
    timersRef.current.clear();
  }, []);

  if (!chats.length) return null;
  return <div className="fixed bottom-0 right-4 z-[90] flex max-w-[calc(100vw-2rem)] items-end gap-3 overflow-x-auto pt-2">
    {chats.map((chat) => <ChatWindow key={chat.matchId} status={chat} takeFocus={chat.matchId === focusTarget} onFocused={clearFocusTarget} onClosed={() => removeVisible(chat.matchId!)} />)}
  </div>;
}

function ChatWindow({ status, takeFocus = false, onFocused, onClosed }: { status: QueueStatus; takeFocus?: boolean; onFocused?: () => void; onClosed: () => void }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MatchMessage[]>([]);
  const [message, setMessage] = useState('');
  const [minimized, setMinimized] = useState(false);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sendError, setSendError] = useState('');
  const [, tickRoomClock] = useState(0);
  const messagesReadyRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const opponent = status.opponent!;
  const game = DEFAULT_GAMES.find((item) => item.id === status.game);

  // Si el chat se abrió porque el usuario pulsó "Enviar mensaje", el cursor ya
  // está donde va a escribir: la celebración conecta con el chat sin un paso muerto.
  useEffect(() => {
    if (!takeFocus) return;
    setMinimized(false);
    inputRef.current?.focus();
    onFocused?.();
  }, [takeFocus, onFocused]);

  const refreshMessages = useCallback(async () => {
    if (!status.matchId) return;
    try {
      const nextMessages = await fetchMatchMessages(status.matchId);
      setMessages((current) => {
        if (messagesReadyRef.current && document.hidden) {
          const knownIds = new Set(current.map((item) => item.id));
          const incoming = nextMessages.find((item) => item.sender.id !== user?.id && !knownIds.has(item.id));
          if (incoming) void window.q2playDesktop?.notify(opponent.username, incoming.content);
        }
        messagesReadyRef.current = true;
        return nextMessages;
      });
    } catch { /* retry on next poll */ }
  }, [opponent.username, status.matchId, user?.id]);

  useEffect(() => {
    void refreshMessages();
    const timer = window.setInterval(refreshMessages, 2500);
    return () => window.clearInterval(timer);
  }, [refreshMessages]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: messagesReadyRef.current ? 'smooth' : 'auto', block: 'end' });
  }, [messages]);

  useEffect(() => {
    if (!status.discordChannelExpiresAt) return;
    const timer = window.setInterval(() => tickRoomClock((value) => value + 1), 30000);
    return () => window.clearInterval(timer);
  }, [status.discordChannelExpiresAt]);

  const sendContent = async (rawContent: string) => {
    const content = rawContent.trim();
    if (!content || sending || !status.matchId) return;
    setSending(true);
    setSendError('');
    try {
      const created = await sendMatchMessage(status.matchId, content);
      setMessages((current) => [...current, created]);
      if (content === message.trim()) setMessage('');
    } catch {
      setSendError('No se envió. Reintenta.');
    } finally { setSending(false); }
  };

  const send = async (event: FormEvent) => {
    event.preventDefault();
    await sendContent(message);
  };

  return <aside className={`match-dock-window relative w-[min(380px,calc(100vw-2rem))] shrink-0 overflow-hidden rounded-t-2xl border border-white/10 bg-[#0b111d] shadow-2xl transition-all ${minimized ? 'h-16' : 'h-[min(620px,calc(100vh-5rem))]'}`}>
    <button onClick={() => setMinimized((value) => !value)} className="match-dock-head flex h-16 w-full items-center gap-3 border-b border-white/10 px-4 pr-20 text-left hover:bg-white/[0.035]">
      <Avatar name={opponent.username} src={opponent.avatar} size={36} status="online" />
      <span className="min-w-0 flex-1"><strong className="block truncate text-sm text-white">{opponent.username}</strong><small className="flex items-center gap-1.5 text-emerald-300"><i className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Sesión privada activa</small></span>
    </button>
    <button title={minimized ? 'Abrir chat' : 'Minimizar chat'} onClick={() => setMinimized((value) => !value)} className="absolute right-11 top-3 grid h-8 w-8 place-items-center rounded-md text-slate-500 hover:bg-white/10 hover:text-white">{minimized ? <CaretUp className="h-4 w-4" /> : <CaretDown className="h-4 w-4" />}</button>
    <button title="Cerrar chat y finalizar match" onClick={async () => { if (!window.confirm(`¿Finalizar tu match con ${opponent.username}? La sala privada también se cerrará.`)) return; await closeMatchChat(status.matchId!); onClosed(); }} className="absolute right-2 top-4 grid h-8 w-8 place-items-center rounded-md text-slate-500 hover:bg-red-500/10 hover:text-red-300"><X className="h-4 w-4" /></button>

    {!minimized && <div className="flex h-[calc(100%_-_4rem)] flex-col">
      <div className="match-session-strip">
        <span><GameController weight="fill" /> {game?.name ?? status.game ?? 'Partida'}</span>
        {status.compatibility != null ? <span><ShieldCheck weight="fill" /> {status.compatibility}% compatible</span> : null}
      </div>
      {status.discordInviteUrl && (
        <div className="private-voice-card">
          <span className="private-voice-orb"><DiscordLogo weight="fill" /></span>
          <span className="min-w-0 flex-1">
            <strong>Sala de voz · sólo ustedes 2</strong>
            <small><Timer /> {roomTimeLeft(status.discordChannelExpiresAt) || 'Invitación temporal'}</small>
          </span>
          <a
            href={status.discordInviteUrl}
            target="_blank"
            rel="noreferrer"
            className="private-voice-join"
          >
            Entrar <ArrowSquareOut className="h-3.5 w-3.5" />
          </a>
        </div>
      )}
      {!status.discordInviteUrl && <div className="private-voice-card private-voice-pending"><span className="private-voice-orb"><LockKey weight="fill" /></span><span><strong>Chat protegido para este match</strong><small>Para voz privada, ambos deben conectar Discord desde Ajustes.</small></span></div>}
      {opponent.discord && <div className="flex items-center gap-3 border-b border-white/10 bg-[#5865F2]/10 px-4 py-2.5"><ChatCircle className="h-4 w-4 text-[#8b95ff]" /><span className="min-w-0 flex-1 truncate text-sm text-slate-200">Discord: <strong>{opponent.discord.username}</strong></span><button title="Copiar Discord" onClick={async () => { await navigator.clipboard.writeText(opponent.discord!.username); setCopied(true); }} className="grid h-8 w-8 place-items-center rounded-md text-indigo-300 hover:bg-white/10">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</button></div>}
      <div className="flex-1 space-y-2 overflow-y-auto p-4" aria-live="polite">{!messages.length && <div className="match-chat-empty"><span><ChatCircle weight="duotone" /></span><strong>Rompe el hielo</strong><p>Coordinen rol, modo y si quieren entrar a voz.</p></div>}{messages.map((item) => { const mine = item.sender.id === user?.id; return <div key={item.id} className={`match-message flex ${mine ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[82%] rounded-xl px-3 py-2 text-sm ${mine ? 'bg-brand-violet/80 text-white' : 'bg-slate-700 text-slate-100'}`}>{!mine && <p className="mb-0.5 text-xs font-semibold text-slate-300">{item.sender.username}</p>}<p className="break-words">{item.content}</p></div></div>; })}<div ref={messageEndRef} /></div>
      <div className="quick-message-row" aria-label="Mensajes rápidos">{QUICK_MESSAGES.map((item) => <button key={item} type="button" disabled={sending} onClick={() => void sendContent(item)}>{item}</button>)}</div>
      <form onSubmit={send} className="border-t border-white/10 p-3"><div className="flex gap-2"><input ref={inputRef} value={message} onChange={(event) => { setMessage(event.target.value); setSendError(''); }} maxLength={500} aria-label="Mensaje" placeholder="Escribe un mensaje..." className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-violet" /><button type="submit" disabled={!message.trim() || sending} title="Enviar" className="gradient-btn grid h-10 w-10 place-items-center rounded-lg text-white disabled:opacity-50"><PaperPlaneTilt className="h-4 w-4" /></button></div>{sendError ? <p className="mt-2 text-xs text-red-300" role="alert">{sendError}</p> : null}</form>
    </div>}
  </aside>;
}
