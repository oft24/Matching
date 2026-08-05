import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Radio, Square } from 'lucide-react';
import MatchmakingPanel from './MatchmakingPanel';
import MatchFoundOverlay from './MatchFoundOverlay';
import MatchPopup from './MatchPopup';
import {
  acceptMatch,
  getQueueStatus,
  joinQueue,
  leaveQueue,
  rejectMatch,
} from '../lib/api';
import type { QueueStatus, SearchFilters } from '../types';

interface LiveMatchmakingProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  onLockChange?: (locked: boolean) => void;
}

export default function LiveMatchmaking({ filters, onChange, onLockChange }: LiveMatchmakingProps) {
  const [status, setStatus] = useState<QueueStatus>({ status: 'idle' });
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [dismissedMatchId, setDismissedMatchId] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<QueueStatus | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const celebratedMatchRef = useRef<string | null>(null);

  const announceCelebration = useCallback((nextStatus: QueueStatus) => {
    if (!nextStatus.matchId || celebratedMatchRef.current === nextStatus.matchId) return;
    celebratedMatchRef.current = nextStatus.matchId;
    setCelebration(nextStatus);
    window.dispatchEvent(new CustomEvent('matching-found', { detail: { matchId: nextStatus.matchId } }));
  }, []);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const refreshStatus = useCallback(async () => {
    try {
      const s = await getQueueStatus();
      if (s.status === 'accepted') announceCelebration(s);
      setStatus(s);
      if (s.status === 'idle' || s.status === 'rejected' || s.status === 'expired') {
        stopPolling();
      }
    } catch {
      stopPolling();
    }
  }, [announceCelebration, stopPolling]);

  const startPolling = useCallback(() => {
    stopPolling();
    pollRef.current = setInterval(refreshStatus, 2000);
  }, [stopPolling, refreshStatus]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  useEffect(() => {
    getQueueStatus().then((s) => {
      if (s.status === 'accepted') announceCelebration(s);
      setStatus(s);
      if (s.status === 'searching' || s.status === 'pending') startPolling();
    }).catch(() => {});
  }, [announceCelebration, startPolling]);

  const handleStartSearch = async () => {
    setLoading(true);
    try {
      const s = await joinQueue(filters.game, filters);
      setDismissedMatchId(null);
      celebratedMatchRef.current = null;
      setCelebration(null);
      setStatus(s);
      startPolling();
    } catch {
      setStatus({ status: 'idle' });
    } finally {
      setLoading(false);
    }
  };

  const handleStopSearch = async () => {
    setLoading(true);
    stopPolling();
    try {
      await leaveQueue();
      setStatus({ status: 'idle' });
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!status.matchId) return;
    setActionLoading(true);
    try {
      await acceptMatch(status.matchId);
      await refreshStatus();
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!status.matchId) return;
    setActionLoading(true);
    try {
      await rejectMatch(status.matchId);
      setStatus({ status: 'idle' });
      stopPolling();
    } finally {
      setActionLoading(false);
    }
  };

  const isSearching = status.status === 'searching';
  const isMatchActive = status.status === 'accepted';
  const isLocked = isSearching || status.status === 'pending' || isMatchActive;
  useEffect(() => { onLockChange?.(isLocked); }, [isLocked, onLockChange]);
  const showPopup = status.status === 'pending'
    && status.matchId !== dismissedMatchId;

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
          Matchmaking en vivo
        </h3>
        {isSearching && (
          <span className="flex items-center gap-2 text-sm text-brand-violet animate-pulse">
            <Radio className="w-4 h-4" /> Buscando jugador...
          </span>
        )}
      </div>

      <MatchmakingPanel
        filters={filters}
        onChange={onChange}
        onSearch={handleStartSearch}
        loading={loading}
        hideSearchButton
        disabled={isLocked}
      />

      <div className="flex gap-3 mt-4">
        {!isSearching && status.status !== 'pending' && !isMatchActive ? (
          <button
            onClick={handleStartSearch}
            disabled={loading}
            className="gradient-btn flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl
              text-white font-bold text-sm disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radio className="w-4 h-4" />}
            BUSCAR JUGADOR
          </button>
        ) : isSearching ? (
          <button
            onClick={handleStopSearch}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-red-500/30
              text-red-400 hover:bg-red-500/10 font-bold text-sm disabled:opacity-50"
          >
            <Square className="w-4 h-4" /> CANCELAR BÚSQUEDA
          </button>
        ) : <button disabled className="flex-1 rounded-2xl border border-brand-violet/20 py-3 text-sm font-bold text-brand-violet opacity-70">{isMatchActive ? 'MATCHING ENCONTRADO' : 'MATCH PENDIENTE'}</button>}
      </div>

      {isSearching && (
        <div className="glass rounded-2xl p-8 text-center mt-6">
          <div className="w-12 h-12 border-2 border-brand-violet border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white font-medium mb-1">Esperando a otro jugador en cola...</p>
          <p className="text-slate-500 text-sm">
            Cuando alguien con filtros compatibles también busque, verás su perfil aquí.
          </p>
        </div>
      )}

      {showPopup && (
        <MatchPopup
          status={status}
          onAccept={handleAccept}
          onReject={handleReject}
          onClose={() => setDismissedMatchId(status.matchId ?? null)}
          loading={actionLoading}
        />
      )}
      {celebration && <MatchFoundOverlay status={celebration} onDone={() => setCelebration(null)} />}
    </section>
  );
}
