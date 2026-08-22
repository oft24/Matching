import { useCallback, useEffect, useRef, useState } from 'react';
import { Broadcast, CircleNotch, WarningCircle, Square } from '@phosphor-icons/react';
import MatchmakingPanel from './MatchmakingPanel';
import MatchFoundOverlay from './MatchFoundOverlay';
import MatchPopup from './MatchPopup';
import SearchExperience from './SearchExperience';
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
  const [flowError, setFlowError] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollFailuresRef = useRef(0);
  const celebratedMatchRef = useRef<string | null>(null);

  // Sin el perfil del rival no hay nada que celebrar todavía: se espera al
  // siguiente sondeo, que es cuando el backend ya lo trae.
  const announceCelebration = useCallback((nextStatus: QueueStatus) => {
    if (!nextStatus.matchId || !nextStatus.opponent) return;
    if (celebratedMatchRef.current === nextStatus.matchId) {
      // Discord puede terminar de crear el canal unos segundos despues del
      // match. Actualizamos la escena abierta sin repetir la celebracion.
      setCelebration((current) => current?.matchId === nextStatus.matchId
        ? { ...current, ...nextStatus }
        : current);
      return;
    }
    celebratedMatchRef.current = nextStatus.matchId;
    setCelebration(nextStatus);
    // El dock retiene la ventana de chat mientras la celebración está en pantalla
    window.dispatchEvent(new CustomEvent('q2play-found', { detail: { matchId: nextStatus.matchId } }));
  }, []);

  // Al salir de la celebración el chat se libera: se abre y toma el foco si el
  // usuario eligió escribir, y aparece sin robar el foco si eligió seguir.
  const endCelebration = useCallback((matchId: string | undefined, intent: 'message' | 'dismiss') => {
    setCelebration(null);
    if (!matchId) return;
    window.dispatchEvent(new CustomEvent('q2play-chat-release', {
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
      pollFailuresRef.current = 0;
      setFlowError('');
      if (s.status === 'accepted') announceCelebration(s);
      setStatus(s);
      if (s.status === 'idle' || s.status === 'rejected' || s.status === 'expired') {
        stopPolling();
      }
      return s;
    } catch {
      pollFailuresRef.current += 1;
      if (pollFailuresRef.current >= 3) {
        stopPolling();
        setFlowError('Se perdió la conexión con la cola. Tu estado sigue seguro; reintenta para sincronizarlo.');
      } else {
        setFlowError('Reconectando con la cola…');
      }
      return null;
    }
  }, [announceCelebration, stopPolling]);

  const startPolling = useCallback(() => {
    stopPolling();
    pollFailuresRef.current = 0;
    pollRef.current = setInterval(refreshStatus, 2000);
  }, [stopPolling, refreshStatus]);

  const handleRetrySync = useCallback(async () => {
    setFlowError('');
    const next = await refreshStatus();
    if (next && (next.status === 'searching' || next.status === 'pending' || next.status === 'accepted')) {
      startPolling();
    }
  }, [refreshStatus, startPolling]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  useEffect(() => {
    getQueueStatus().then((s) => {
      if (s.status === 'accepted') announceCelebration(s);
      setStatus(s);
      if (s.status === 'searching' || s.status === 'pending' || s.status === 'accepted') startPolling();
    }).catch(() => setFlowError('No pudimos sincronizar tu estado de búsqueda. Intenta de nuevo.'));
  }, [announceCelebration, startPolling]);

  const handleStartSearch = async () => {
    setLoading(true);
    setFlowError('');
    try {
      const s = await joinQueue(filters.game, filters);
      setDismissedMatchId(null);
      celebratedMatchRef.current = null;
      setCelebration(null);
      setStatus(s);
      startPolling();
    } catch {
      setStatus({ status: 'idle' });
      setFlowError('No pudimos iniciar la búsqueda. Revisa tu conexión e intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleStopSearch = async () => {
    setLoading(true);
    setFlowError('');
    stopPolling();
    try {
      await leaveQueue();
      setStatus({ status: 'idle' });
    } catch {
      setFlowError('No pudimos cancelar la búsqueda. Sincroniza tu estado antes de volver a intentar.');
      await refreshStatus();
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!status.matchId) return false;
    setActionLoading(true);
    setFlowError('');
    try {
      const result = await acceptMatch(status.matchId);
      const merged = { ...status, ...result };
      if (result.status === 'pending') merged.myAccepted = true;
      setStatus(merged);
      if (result.status === 'accepted') announceCelebration(merged);
      startPolling();
      await refreshStatus();
      return true;
    } catch {
      setFlowError('No pudimos confirmar el match. La propuesta sigue abierta; vuelve a intentar.');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!status.matchId) return false;
    setActionLoading(true);
    setFlowError('');
    try {
      await rejectMatch(status.matchId);
      setStatus({ status: 'idle' });
      stopPolling();
      return true;
    } catch {
      setFlowError('No pudimos cerrar esta propuesta. Intenta de nuevo.');
      return false;
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
  const dismissProposal = useCallback(() => {
    setDismissedMatchId(status.matchId ?? null);
  }, [status.matchId]);

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

      {flowError && (
        <div className="anim-fade-up mt-4 flex items-start justify-between gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/[0.07] px-4 py-3 text-sm text-amber-100" role="alert">
          <span className="flex items-start gap-2"><WarningCircle className="mt-0.5 h-4 w-4 flex-none text-amber-300" />{flowError}</span>
          <button type="button" onClick={() => void handleRetrySync()} className="text-xs font-black uppercase tracking-wide text-amber-300 hover:text-amber-200">
            Reintentar
          </button>
        </div>
      )}

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

      {isSearching && <SearchExperience gameId={status.game ?? filters.game} elapsed={elapsed} />}

      {status.status === 'pending' && !showPopup && (
        <button
          type="button"
          onClick={() => setDismissedMatchId(null)}
          className="proposal-reopen mt-5 flex w-full items-center justify-between gap-4 rounded-2xl border border-brand-violet/30 bg-brand-violet/[0.08] px-5 py-4 text-left"
        >
          <span><b className="block text-sm text-white">Tienes una propuesta esperando</b><small className="mt-1 block text-xs text-slate-400">Ábrela para aceptar o seguir buscando.</small></span>
          <span className="rounded-full bg-brand-violet px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white">Ver match</span>
        </button>
      )}

      {showPopup && (
        <MatchPopup
          status={status}
          onAccept={handleAccept}
          onReject={handleReject}
          onClose={dismissProposal}
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
