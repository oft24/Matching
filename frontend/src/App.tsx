import { useCallback, useEffect, useState } from 'react';
import IconRail from './components/IconRail';
import Header from './components/Header';
import Hero from './components/Hero';
import GameGrid from './components/GameGrid';
import LiveMatchmaking from './components/LiveMatchmaking';
import PreLogin from './components/PreLogin';
import DashboardPanel from './components/DashboardPanel';
import ProfilePage from './components/ProfilePage';
import FriendsPage from './components/FriendsPage';
import GroupsPage from './components/GroupsPage';
import SettingsPage from './components/SettingsPage';
import MatchChatDock from './components/MatchChatDock';
import MessagesPage from './components/MessagesPage';
import LoginModal from './components/LoginModal';
import QuickSearch from './components/QuickSearch';
import { useAuth } from './context/AuthContext';
import { fetchDashboard, fetchGames } from './lib/api';
import { DEFAULT_GAMES } from './data/games';
import { GAME_RANKS } from './data/gameRanks';
import { DEFAULT_SEARCH_FILTERS } from './data/searchDefaults';
import type { Dashboard, Game, SearchFilters } from './types';

export default function App() {
  const { isAuthenticated, user } = useAuth();
  const [activeNav, setActiveNav] = useState('inicio');
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginMode, setLoginMode] = useState<'login' | 'register'>('login');
  const [games, setGames] = useState<Game[]>(DEFAULT_GAMES);
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_SEARCH_FILTERS);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [dashboardError, setDashboardError] = useState('');
  const [dashboardGame, setDashboardGame] = useState<'lol' | 'valorant'>('lol');
  const [dashboardQueue, setDashboardQueue] = useState<'solo' | 'flex'>('solo');
  const [matchmakingLocked, setMatchmakingLocked] = useState(false);

  const openLogin = useCallback((mode: 'login' | 'register' = 'login') => {
    setLoginMode(mode);
    setLoginOpen(true);
  }, []);

  useEffect(() => {
    fetchGames()
      .then((data) => { if (data.length) setGames(data); })
      .catch(() => setGames(DEFAULT_GAMES));
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setActiveNav('inicio');
      setDashboard(null);
      return;
    }
    setDashboard(null);
    fetchDashboard(dashboardGame, dashboardQueue)
      .then((data) => { setDashboard(data); setDashboardError(''); })
      .catch(() => {
        setDashboard(null);
        // Un fallo de red no debe quedarse en un panel vacío sin explicación
        setDashboardError('No pudimos contactar con el servidor. Revisa tu conexión e inténtalo de nuevo.');
      });
  }, [isAuthenticated, user?.id, activeNav, dashboardGame, dashboardQueue]);

  const handleGameSelect = (id: string) => {
    setFilters((f) => ({ ...f, game: id, rank: GAME_RANKS[id]?.[0] ?? 'Sin rango' }));
  };

  const showBuscar = activeNav === 'buscar';
  const showDashboard = activeNav === 'dashboard';
  const showProfile = activeNav === 'perfil';
  const showInicio = activeNav === 'inicio';

  const renderAuthenticatedContent = () => {
    if (showProfile) return <ProfilePage onOpenLogin={() => openLogin()} />;
    if (showDashboard) return <DashboardPanel error={dashboardError} data={dashboard} game={dashboardGame} onGameChange={setDashboardGame} queue={dashboardQueue} onQueueChange={setDashboardQueue} />;
    if (activeNav === 'grupos') return <GroupsPage />;
    if (activeNav === 'amigos') return <FriendsPage />;
    if (activeNav === 'mensajes') return <MessagesPage />;
    if (activeNav === 'ajustes') return <SettingsPage />;

    if (showBuscar) {
      return (
        <>
          <GameGrid games={games} selected={filters.game} onSelect={handleGameSelect} disabled={matchmakingLocked} />
          <LiveMatchmaking filters={filters} onChange={setFilters} onLockChange={setMatchmakingLocked} />
        </>
      );
    }

    if (showInicio) {
      return (
        <>
          <Hero onNavigate={setActiveNav} />
          <GameGrid games={games} selected={filters.game} onSelect={handleGameSelect} />
        </>
      );
    }

    return null;
  };

  // Sin sesión la pantalla previa ocupa todo: trae su propia cabecera y layout.
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-brand-dark">
        <PreLogin />
        <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} initialMode={loginMode} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-brand-dark">
      {/* Rail + panel viven a la izquierda y ocupan toda la altura; la cabecera va dentro del contenido. */}
      <IconRail active={activeNav} onNavigate={setActiveNav} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          level={dashboard?.level ?? user?.level ?? 1}
          xp={dashboard?.xp ?? user?.xp ?? 0}
          xpToNext={dashboard?.xpToNext ?? 100}
          activeNav={activeNav}
        />

        <div className="flex flex-1">
          <main className="min-w-0 flex-1 overflow-y-auto p-4 lg:p-6">
            <div key={activeNav} className="page-view mx-auto w-full max-w-6xl">
              {renderAuthenticatedContent()}
            </div>
          </main>

          {showBuscar && (
            <div className="hidden p-4 pl-0 lg:p-6 lg:pl-0 xl:block">
              <QuickSearch filters={filters} />
            </div>
          )}
        </div>
      </div>

      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        initialMode={loginMode}
      />
      <MatchChatDock />
    </div>
  );
}
