import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { ChatCircle, GameController, PaperPlaneTilt, Users } from '@phosphor-icons/react';
import Avatar from './Avatar';
import PageHeader from './PageHeader';
import { fetchConversations, fetchDirectMessages, fetchFriends, fetchMatchMessages, sendDirectMessage, sendMatchMessage } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { Conversation, FriendProfile, MatchMessage } from '../types';

type Selection = { kind: 'match' | 'direct'; id: string; matchId?: string; status?: string; participant: { id: string; username: string; avatar: string; level: number } };

export default function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [selected, setSelected] = useState<Selection | null>(null);
  const [messages, setMessages] = useState<MatchMessage[]>([]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const loadConversations = useCallback(async () => setConversations(await fetchConversations()), []);
  useEffect(() => {
    void loadConversations();
    fetchFriends().then((data) => setFriends(data.friends));
    const timer = window.setInterval(loadConversations, 5000);
    return () => window.clearInterval(timer);
  }, [loadConversations]);

  const loadMessages = useCallback(async () => {
    if (!selected) return;
    const next = selected.kind === 'match' && selected.matchId
      ? await fetchMatchMessages(selected.matchId)
      : await fetchDirectMessages(selected.participant.id);
    setMessages(next);
  }, [selected]);

  useEffect(() => {
    if (!selected) return;
    void loadMessages();
    const timer = window.setInterval(loadMessages, 2500);
    return () => window.clearInterval(timer);
  }, [selected, loadMessages]);

  const conversationFriendIds = useMemo(() => new Set(conversations.filter((item) => item.kind === 'direct').map((item) => item.participant.id)), [conversations]);
  const availableFriends = friends.filter((friend) => !conversationFriendIds.has(friend.id));
  const chooseConversation = (conversation: Conversation) => setSelected({ kind: conversation.kind, id: conversation.id, matchId: conversation.matchId, status: conversation.status, participant: conversation.participant });
  const chooseFriend = (friend: FriendProfile) => setSelected({ kind: 'direct', id: `direct:${friend.id}`, participant: friend });

  const send = async (event: FormEvent) => {
    event.preventDefault();
    const content = message.trim();
    if (!selected || !content || sending) return;
    setSending(true);
    try {
      const created = selected.kind === 'match' && selected.matchId
        ? await sendMatchMessage(selected.matchId, content)
        : await sendDirectMessage(selected.participant.id, content);
      setMessages((items) => [...items, created]);
      setMessage('');
      void loadConversations();
    } finally { setSending(false); }
  };

  const matchClosed = selected?.kind === 'match' && selected.status === 'closed';
  return <section className="mx-auto mb-8 max-w-6xl">
    <PageHeader kicker="CONVERSACIONES" title="Mensajes" description="Continúa un match o escribe a tus amigos." />
    <div className="anim-fade-up grid min-h-[650px] overflow-hidden rounded-2xl border border-white/10 bg-[#0b111d] md:grid-cols-[300px_1fr]" style={{ animationDelay: '60ms' }}>
      <aside className="border-b border-white/10 md:border-b-0 md:border-r">
        <div className="border-b border-white/10 px-4 py-3"><h3 className="text-sm font-semibold text-white">Recientes</h3></div>
        <div className="max-h-[400px] overflow-y-auto">{conversations.map((conversation) => <ConversationButton key={conversation.id} conversation={conversation} active={selected?.id === conversation.id} onClick={() => chooseConversation(conversation)} />)}{!conversations.length && <p className="px-4 py-8 text-center text-sm text-slate-500">Tus conversaciones aparecerán aquí.</p>}</div>
        {!!availableFriends.length && <div className="border-t border-white/10"><p className="px-4 pb-2 pt-4 text-xs font-semibold uppercase text-slate-500">Iniciar con un amigo</p>{availableFriends.map((friend) => <button key={friend.id} onClick={() => chooseFriend(friend)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.035]"><Avatar name={friend.username} src={friend.avatar} size={36} /><span className="truncate text-sm text-slate-300">{friend.username}</span></button>)}</div>}
      </aside>

      {!selected ? <div className="grid place-items-center p-8 text-center"><div><ChatCircle className="mx-auto mb-4 h-12 w-12 text-slate-700" /><h3 className="font-semibold text-white">Selecciona una conversación</h3><p className="mt-2 text-sm text-slate-500">Continúa un match o escribe a uno de tus amigos.</p></div></div> : <div className="flex min-w-0 flex-col">
        <header className="flex h-16 items-center gap-3 border-b border-white/10 px-5"><Avatar name={selected.participant.username} src={selected.participant.avatar} size={38} /><span className="min-w-0 flex-1"><strong className="block truncate text-white">{selected.participant.username}</strong><small className="flex items-center gap-1 text-slate-500">{selected.kind === 'match' ? <><GameController className="h-3 w-3" /> Chat de match</> : <><Users className="h-3 w-3" /> Amigo</>}</small></span></header>
        <div className="flex-1 space-y-3 overflow-y-auto p-5">{!messages.length && <p className="py-20 text-center text-sm text-slate-500">Aún no hay mensajes. Saluda para comenzar.</p>}{messages.map((item) => { const mine = item.sender.id === user?.id; return <div key={item.id} className={`flex ${mine ? 'justify-end' : 'justify-start'} ${mine ? 'bubble-out' : 'bubble-in'}`}><div className={`max-w-[76%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${mine ? 'bg-brand-violet text-white' : 'bg-slate-700 text-slate-100'}`}>{!mine && <p className="mb-0.5 text-xs font-semibold text-slate-300">{item.sender.username}</p>}<p className="break-words">{item.content}</p></div></div>; })}</div>
        {matchClosed ? <div className="border-t border-white/10 p-4 text-center text-sm text-slate-500">Este match terminó. El historial permanece disponible.</div> : <form onSubmit={send} className="flex gap-2 border-t border-white/10 p-4"><input value={message} onChange={(event) => setMessage(event.target.value)} maxLength={500} placeholder="Escribe un mensaje..." className="min-w-0 flex-1 rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-violet" /><button disabled={!message.trim() || sending} title="Enviar" className="gradient-btn grid h-10 w-10 place-items-center rounded-lg text-white disabled:opacity-50"><PaperPlaneTilt className="h-4 w-4" /></button></form>}
      </div>}
    </div>
  </section>;
}

function ConversationButton({ conversation, active, onClick }: { conversation: Conversation; active: boolean; onClick: () => void }) {
  return <button onClick={onClick} className={`flex w-full items-center gap-3 border-b border-white/[0.05] px-4 py-3 text-left transition-colors ${active ? 'bg-brand-violet/10' : 'hover:bg-white/[0.035]'}`}><Avatar name={conversation.participant.username} src={conversation.participant.avatar} size={42} /><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><strong className="truncate text-sm text-white">{conversation.participant.username}</strong>{conversation.unread > 0 && <span className="grid min-w-5 place-items-center rounded-full bg-brand-violet px-1.5 text-[10px] font-bold text-white">{conversation.unread}</span>}</span><small className="mt-0.5 block truncate text-slate-500">{conversation.kind === 'match' ? 'Match · ' : ''}{conversation.lastMessage}</small></span></button>;
}
