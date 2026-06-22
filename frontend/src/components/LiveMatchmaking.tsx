import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Radio, Square } from 'lucide-react';
import MatchmakingPanel from './MatchmakingPanel';
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
}

export default function LiveMatchmaking({ filters, onChange }: LiveMatchmakingProps) {
  const [status, setStatus] = useState<QueueStatus>({ status: 'idle' });
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const refreshStatus = useCallback(async () => {
    try {
      const s = await getQueueStatus();
      setStatus(s);
      if (s.status === 'idle' || s.status === 'rejected' || s.status === 'expired') {
        stopPolling();
      }
    } catch {
      stopPolling();
    }
  }, [stopPolling]);

  const startPolling = useCallback(() => {
    stopPolling();
    pollRef.current = setInterval(refreshStatus, 2000);
  }, [stopPolling, refreshStatus]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  useEffect(() => {
    getQueueStatus().then((s) => {
      setStatus(s);
      if (s.status === 'searching' || s.status === 'pending') startPolling();
    }).catch(() => {});
  }, [startPolling]);

  const handleStartSearch = async () => {
    setLoading(true);
    try {
      const s = await joinQueue(filters.game, filters);
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
  const showPopup = status.status === 'pending' || status.status === 'accepted';

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
      />

      <div className="flex gap-3 mt-4">
        {!isSearching ? (
          <button
            onClick={handleStartSearch}
            disabled={loading}
            className="gradient-btn flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl
              text-white font-bold text-sm disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radio className="w-4 h-4" />}
            BUSCAR JUGADOR
          </button>
        ) : (
          <button
            onClick={handleStopSearch}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-red-500/30
              text-red-400 hover:bg-red-500/10 font-bold text-sm disabled:opacity-50"
          >
            <Square className="w-4 h-4" /> CANCELAR BÚSQUEDA
          </button>
        )}
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
          loading={actionLoading}
        />
      )}
    </section>
  );
}
