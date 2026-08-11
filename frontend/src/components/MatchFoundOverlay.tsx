import { useEffect } from 'react';
import { ChatCircle, Check, Users } from '@phosphor-icons/react';
import Avatar from './Avatar';
import { useAuth } from '../context/AuthContext';
import type { QueueStatus } from '../types';

interface MatchFoundOverlayProps {
  status: QueueStatus;
  onDone: () => void;
}

export default function MatchFoundOverlay({ status, onDone }: MatchFoundOverlayProps) {
  const { user } = useAuth();
  const opponent = status.opponent;

  useEffect(() => {
    const timer = window.setTimeout(onDone, 2800);
    return () => window.clearTimeout(timer);
  }, [onDone]);

  if (!opponent) return null;

  return <div className="fixed inset-0 z-[120] flex items-center justify-center p-4" role="status" aria-live="assertive">
    <div className="absolute inset-0 bg-[#050914]/90 backdrop-blur-md" />
    <div className="match-found-panel relative w-full max-w-xl overflow-hidden rounded-2xl border border-indigo-300/25 bg-[#101827] px-6 py-10 text-center shadow-2xl shadow-indigo-950/50 sm:px-12 sm:py-14">
      <div className="match-found-ring absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-indigo-300/20" />
      <div className="relative">
        <div className="mb-7 flex items-center justify-center gap-5 sm:gap-8">
          <Avatar name={user?.username ?? 'Tú'} src={user?.avatar} size={88} radius={16} brand className="match-found-avatar" />
          <div className="match-found-connector grid h-12 w-12 place-items-center rounded-full border border-indigo-300/40 bg-indigo-400/15 text-indigo-200"><Users className="h-6 w-6" /></div>
          <Avatar name={opponent.username} src={opponent.avatar} size={88} radius={16} className="match-found-avatar match-found-avatar-delay" />
        </div>
        <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-full bg-emerald-400/15 text-emerald-300"><Check className="h-6 w-6" /></div>
        <p className="text-3xl font-black uppercase tracking-[0.12em] text-indigo-200 sm:text-5xl">MATCH REALIZADO</p>
        <p className="mt-3 text-base text-slate-300">Ambos aceptaron. Ya pueden coordinar su partida.</p>
        <p className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-emerald-300"><ChatCircle className="h-4 w-4" /> Abriendo el chat...</p>
      </div>
    </div>
  </div>;
}
