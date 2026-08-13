import { useCallback, useEffect, useRef, useState } from 'react';
import { Broadcast, CircleNotch, Square } from '@phosphor-icons/react';
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
import { DEFAULT_SEARCH_FILTERS } from '../data/searchDefaults';
import type { QueueStatus, SearchFilters } from '../types';

function formatElapsed(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

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

  // Sin el perfil del rival no hay nada que celebrar todavía: se espera al
  // siguiente sondeo, que es cuando el backend ya lo trae.
  const announceCelebration = useCallback((nextStatus: QueueStatus) => {
    if (!nextStatus.matchId || !nextStatus.opponent) return;
    if (celebratedMatchRef.current === nextStatus.matchId) return;
    celebratedMatchRef.current = nextStatus.matchId;
    setCelebration(nextStatus);
    // El dock retiene la ventana de chat mientras la celebración está en pantalla
    window.dispatchEvent(new CustomEvent('matching-found', { detail: { matchId: nextStatus.matchId } }));
  }, []);

  // Al salir de la celebración el chat se libera: se abre y toma el foco si el
  // usuario eligió escribir, y aparece sin robar el foco si eligió seguir.
  const endCelebration = useCallback((matchId: string | undefined, intent: 'message' | 'dismiss') => {
    setCelebration(null);
    if (!matchId) return;
    window.dispatchEvent(new CustomEvent('matching-chat-release', {
      detail: { matchId, focus: intent === 'message' },
    }));
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

  // Cronómetro de cola: se reinicia cada vez que entra o sale de búsqueda
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!isSearching) return setElapsed(0);
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [isSearching]);

  const showPopup = status.status === 'pending'
    && status.matchId !== dismissedMatchId;

  return (
    <section className="mb-8">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="section-kicker">PASO 02</p>
          <h3 className="mt-2 text-xl font-bold text-white">Configura tu búsqueda</h3>
        </div>
        {isSearching && (
          <span className="flex items-center gap-2 rounded-full border border-brand-violet/30 bg-brand-violet/10 px-3 py-1.5 text-xs font-semibold text-violet-300">
            <span className="status-dot h-1.5 w-1.5 rounded-full bg-violet-300 text-violet-300" />
            En cola · {formatElapsed(elapsed)}
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
        defaults={DEFAULT_SEARCH_FILTERS}
      />

      <div className="flex gap-3 mt-4">
        {!isSearching && status.status !== 'pending' && !isMatchActive ? (
          <button
            onClick={handleStartSearch}
            disabled={loading}
            className="primary-button flex flex-1 items-center justify-center gap-2 py-4 text-sm font-bold tracking-wide disabled:opacity-50"
          >
            {loading ? <CircleNotch className="w-4 h-4 animate-spin" /> : <Broadcast className="w-4 h-4" />}
            BUSCAR JUGADOR
          </button>
        ) : isSearching ? (
          <button
            onClick={handleStopSearch}
            disabled={loading}
            className="danger-button flex flex-1 items-center justify-center gap-2 py-4 text-sm font-bold tracking-wide disabled:opacity-50"
          >
            <Square className="w-4 h-4" /> CANCELAR BÚSQUEDA
          </button>
        ) : <button disabled className="flex-1 rounded-2xl border border-brand-violet/20 py-3 text-sm font-bold text-brand-violet opacity-70">{isMatchActive ? 'MATCH REALIZADO' : 'MATCH PENDIENTE'}</button>}
      </div>

      {isSearching && (
        <div className="surface-soft anim-fade-up mt-6 rounded-2xl p-10 text-center">
          <div className="radar mx-auto mb-5 h-16 w-16">
            <span className="radar-ring" />
            <span className="radar-ring" />
            <span className="radar-ring" />
            <span className="radar-sweep" />
            <span className="h-12 w-12 animate-spin rounded-full border-2 border-brand-violet border-t-transparent" />
          </div>
          <p className="mb-1 font-semibold text-white">Esperando a otro jugador en cola...</p>
          <p className="text-sm text-slate-500">
            Cuando alguien con filtros compatibles también busque, verás su perfil aquí.
          </p>
          <p className="mt-4 text-xs text-slate-600">Tiempo en cola: {formatElapsed(elapsed)}</p>
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
      {celebration && (
        <MatchFoundOverlay
          status={celebration}
          onClose={(intent) => endCelebration(celebration.matchId, intent)}
        />
      )}
    </section>
  );
}
