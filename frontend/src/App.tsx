import { useCallback, useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Hero from './components/Hero';
import GameGrid from './components/GameGrid';
import LiveMatchmaking from './components/LiveMatchmaking';
import GuestLanding from './components/GuestLanding';
import DashboardPanel from './components/DashboardPanel';
import ProfilePage from './components/ProfilePage';
import FriendsPage from './components/FriendsPage';
import MatchChatDock from './components/MatchChatDock';
import MessagesPage from './components/MessagesPage';
import LoginModal from './components/LoginModal';
import QuickSearch, { TrustFooter } from './components/QuickSearch';
import { useAuth } from './context/AuthContext';
import { fetchDashboard, fetchGames } from './lib/api';
import { DEFAULT_GAMES } from './data/games';
import { GAME_RANKS } from './data/gameRanks';
import type { Dashboard, Game, SearchFilters } from './types';

const DEFAULT_FILTERS: SearchFilters = {
  game: 'lol',
  region: 'LAN',
  language: 'Español',
  matchType: 'Ranked',
  rank: 'Gold',
  role: 'Any',
  age: '18-25',
  preferredGender: 'any',
  verifiedOnly: false,
  playstyle: 'Competitivo',
  objectives: 'Subir de rango',
  activityLevel: 'Alto',
  hasMic: true,
};

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="glass rounded-2xl p-12 text-center mb-8">
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-slate-400">Próximamente disponible.</p>
    </div>
  );
}

export default function App() {
  const { isAuthenticated, user } = useAuth();
  const [activeNav, setActiveNav] = useState('inicio');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginMode, setLoginMode] = useState<'login' | 'register'>('login');
  const [games, setGames] = useState<Game[]>(DEFAULT_GAMES);
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
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
    fetchDashboard(dashboardGame, dashboardQueue).then(setDashboard).catch(() => setDashboard(null));
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
    if (showDashboard) return <DashboardPanel data={dashboard} game={dashboardGame} onGameChange={setDashboardGame} queue={dashboardQueue} onQueueChange={setDashboardQueue} />;
    if (activeNav === 'grupos') return <ComingSoon title="Grupos" />;
    if (activeNav === 'amigos') return <FriendsPage />;
    if (activeNav === 'mensajes') return <MessagesPage />;
    if (activeNav === 'eventos') return <ComingSoon title="Eventos" />;
    if (activeNav === 'ajustes') return <ComingSoon title="Ajustes" />;

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
          <Hero />
          <GameGrid games={games} selected={filters.game} onSelect={handleGameSelect} />
          <TrustFooter />
        </>
      );
    }

    return null;
  };

  return (
    <div className="flex min-h-screen bg-brand-dark">
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          level={dashboard?.level ?? user?.level ?? 1}
          xp={dashboard?.xp ?? user?.xp ?? 0}
          xpToNext={dashboard?.xpToNext ?? 100}
          onMenuClick={isAuthenticated ? () => setSidebarOpen(true) : undefined}
          onOpenLogin={() => openLogin()}
        />

        <div className="flex flex-1">
          <main className={`flex-1 overflow-y-auto ${isAuthenticated ? 'p-4 lg:p-6' : 'px-4 sm:px-6 lg:px-8'}`}>
            {!isAuthenticated ? (
              <GuestLanding
                games={games}
                selected={filters.game}
                onSelect={handleGameSelect}
                onOpenLogin={() => openLogin()}
              />
            ) : (
              renderAuthenticatedContent()
            )}
          </main>

          {isAuthenticated && showBuscar && (
            <div className="p-4 lg:p-6 pr-0 hidden xl:block">
              <QuickSearch filters={filters} />
            </div>
          )}
        </div>
      </div>

      {isAuthenticated && (
        <Sidebar
          active={activeNav}
          onNavigate={setActiveNav}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      )}

      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        initialMode={loginMode}
      />
      {isAuthenticated && <MatchChatDock />}
    </div>
  );
}
