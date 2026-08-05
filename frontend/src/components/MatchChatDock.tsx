import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, ChevronUp, Copy, MessageCircle, Send, X } from 'lucide-react';
import { closeMatchChat, fetchActiveMatchChats, fetchMatchMessages, sendMatchMessage } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { MatchMessage, QueueStatus } from '../types';

const CHAT_REVEAL_DELAY = 3200;

export default function MatchChatDock() {
  const { isAuthenticated } = useAuth();
  const [chats, setChats] = useState<QueueStatus[]>([]);
  const visibleRef = useRef<QueueStatus[]>([]);
  const pendingRef = useRef(new Map<string, QueueStatus>());
  const timersRef = useRef(new Map<string, number>());
  const revealAtRef = useRef(new Map<string, number>());

  const publish = useCallback((next: QueueStatus[]) => {
    visibleRef.current = next;
    setChats(next);
  }, []);

  const reveal = useCallback((matchId: string) => {
    const pending = pendingRef.current.get(matchId);
    pendingRef.current.delete(matchId);
    timersRef.current.delete(matchId);
    revealAtRef.current.delete(matchId);
    if (!pending) return;
    publish([...visibleRef.current.filter((item) => item.matchId !== matchId), pending]);
  }, [publish]);

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
    const announce = (event: Event) => {
      const matchId = (event as CustomEvent<{ matchId?: string }>).detail?.matchId;
      if (!matchId) return;
      revealAtRef.current.set(matchId, Date.now() + CHAT_REVEAL_DELAY);
      if (pendingRef.current.has(matchId)) scheduleReveal(matchId);
    };
    window.addEventListener('matching-found', announce);
    return () => {
      window.removeEventListener('matching-found', announce);
      for (const timer of timersRef.current.values()) window.clearTimeout(timer);
    };
  }, [scheduleReveal]);

  if (!chats.length) return null;
  return <div className="fixed bottom-0 right-4 z-[90] flex max-w-[calc(100vw-2rem)] items-end gap-3 overflow-x-auto px-1 pt-2">
    {chats.map((chat) => <ChatWindow key={chat.matchId} status={chat} onClosed={() => removeVisible(chat.matchId!)} />)}
  </div>;
}

function ChatWindow({ status, onClosed }: { status: QueueStatus; onClosed: () => void }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MatchMessage[]>([]);
  const [message, setMessage] = useState('');
  const [minimized, setMinimized] = useState(false);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const messagesReadyRef = useRef(false);
  const opponent = status.opponent!;

  const refreshMessages = useCallback(async () => {
    if (!status.matchId) return;
    try {
      const nextMessages = await fetchMatchMessages(status.matchId);
      setMessages((current) => {
        if (messagesReadyRef.current && document.hidden) {
          const knownIds = new Set(current.map((item) => item.id));
          const incoming = nextMessages.find((item) => item.sender.id !== user?.id && !knownIds.has(item.id));
          if (incoming) void window.matchingDesktop?.notify(opponent.username, incoming.content);
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

  const send = async (event: FormEvent) => {
    event.preventDefault();
    const content = message.trim();
    if (!content || sending || !status.matchId) return;
    setSending(true);
    try {
      const created = await sendMatchMessage(status.matchId, content);
      setMessages((current) => [...current, created]);
      setMessage('');
    } finally { setSending(false); }
  };

  return <aside className={`relative w-[min(350px,calc(100vw-2rem))] shrink-0 overflow-hidden rounded-t-xl border border-white/10 bg-[#0b111d] shadow-2xl transition-all ${minimized ? 'h-14' : 'h-[480px]'}`}>
    <button onClick={() => setMinimized((value) => !value)} className="flex h-14 w-full items-center gap-3 border-b border-white/10 px-4 pr-20 text-left hover:bg-white/[0.035]">
      <span className="relative"><img src={opponent.avatar} alt="" className="h-9 w-9 rounded-lg object-cover" /><span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-[#0b111d] bg-emerald-400" /></span>
      <span className="min-w-0 flex-1"><strong className="block truncate text-sm text-white">{opponent.username}</strong><small className="text-emerald-400">Match conectado</small></span>
    </button>
    <button title={minimized ? 'Abrir chat' : 'Minimizar chat'} onClick={() => setMinimized((value) => !value)} className="absolute right-11 top-3 grid h-8 w-8 place-items-center rounded-md text-slate-500 hover:bg-white/10 hover:text-white">{minimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</button>
    <button title="Cerrar chat y finalizar match" onClick={async () => { await closeMatchChat(status.matchId!); onClosed(); }} className="absolute right-2 top-3 grid h-8 w-8 place-items-center rounded-md text-slate-500 hover:bg-red-500/10 hover:text-red-300"><X className="h-4 w-4" /></button>

    {!minimized && <div className="flex h-[426px] flex-col">
      {opponent.discord && <div className="flex items-center gap-3 border-b border-white/10 bg-[#5865F2]/10 px-4 py-2.5"><MessageCircle className="h-4 w-4 text-[#8b95ff]" /><span className="min-w-0 flex-1 truncate text-sm text-slate-200">Discord: <strong>{opponent.discord.username}</strong></span><button title="Copiar Discord" onClick={async () => { await navigator.clipboard.writeText(opponent.discord!.username); setCopied(true); }} className="grid h-8 w-8 place-items-center rounded-md text-indigo-300 hover:bg-white/10">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</button></div>}
      <div className="flex-1 space-y-2 overflow-y-auto p-4" aria-live="polite">{!messages.length && <p className="py-16 text-center text-sm text-slate-500">Ya hicieron match. Escribe para coordinar la partida.</p>}{messages.map((item) => { const mine = item.sender.id === user?.id; return <div key={item.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[82%] rounded-lg px-3 py-2 text-sm ${mine ? 'bg-brand-violet text-white' : 'bg-slate-700 text-slate-100'}`}>{!mine && <p className="mb-0.5 text-xs font-semibold text-slate-300">{item.sender.username}</p>}<p className="break-words">{item.content}</p></div></div>; })}</div>
      <form onSubmit={send} className="flex gap-2 border-t border-white/10 p-3"><input value={message} onChange={(event) => setMessage(event.target.value)} maxLength={500} placeholder="Escribe un mensaje..." className="min-w-0 flex-1 rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-violet" /><button type="submit" disabled={!message.trim() || sending} title="Enviar" className="gradient-btn grid h-10 w-10 place-items-center rounded-lg text-white disabled:opacity-50"><Send className="h-4 w-4" /></button></form>
    </div>}
  </aside>;
}
