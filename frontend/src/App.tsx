import { useCallback, useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Hero from './components/Hero';
import GameGrid from './components/GameGrid';
import MatchmakingPanel from './components/MatchmakingPanel';
import GuestLanding from './components/GuestLanding';
import PlayerResults from './components/PlayerResults';
import DashboardPanel from './components/DashboardPanel';
import ProfilePage from './components/ProfilePage';
import LoginModal from './components/LoginModal';
import QuickSearch, { TrustFooter } from './components/QuickSearch';
import { useAuth } from './context/AuthContext';
import { fetchDashboard, fetchGames, searchPlayers } from './lib/api';
import { DEFAULT_GAMES } from './data/games';
import type { Dashboard, Game, Player, SearchFilters } from './types';

const DEFAULT_FILTERS: SearchFilters = {
  game: 'lol',
  region: 'LAN',
  language: 'Español',
  matchType: 'Ranked',
  rank: 'Gold',
  role: 'Any',
  age: '18-25',
  availability: 'Noches',
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
  const [players, setPlayers] = useState<Player[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

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
      setPlayers([]);
      setSearched(false);
      return;
    }
    fetchDashboard().then(setDashboard).catch(() => setDashboard(null));
  }, [isAuthenticated, user?.id]);

  const handleSearch = useCallback(async () => {
    setLoading(true);
    setSearched(true);
    try {
      const results = await searchPlayers(filters);
      setPlayers(results);
    } catch {
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const handleGameSelect = (id: string) => {
    setFilters((f) => ({ ...f, game: id }));
  };

  const showSearch = activeNav === 'inicio' || activeNav === 'buscar';
  const showDashboard = activeNav === 'dashboard';
  const showProfile = activeNav === 'perfil';

  const renderAuthenticatedContent = () => {
    if (showProfile) return <ProfilePage onOpenLogin={() => openLogin()} />;
    if (showDashboard) return <DashboardPanel data={dashboard} onOpenLogin={() => openLogin()} />;
    if (activeNav === 'grupos') return <ComingSoon title="Grupos" />;
    if (activeNav === 'amigos') return <ComingSoon title="Amigos" />;
    if (activeNav === 'mensajes') return <ComingSoon title="Mensajes" />;
    if (activeNav === 'eventos') return <ComingSoon title="Eventos" />;
    if (activeNav === 'ajustes') return <ComingSoon title="Ajustes" />;

    if (showSearch) {
      return (
        <>
          <Hero />
          <GameGrid games={games} selected={filters.game} onSelect={handleGameSelect} />
          <MatchmakingPanel
            filters={filters}
            onChange={setFilters}
            onSearch={handleSearch}
            loading={loading}
          />
          <PlayerResults players={players} loading={loading} searched={searched} />
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
          <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
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

          {isAuthenticated && showSearch && (
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
    </div>
  );
}
