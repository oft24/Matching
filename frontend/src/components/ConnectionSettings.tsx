import { useEffect, useState } from 'react';
import { ChatCircle, Check, CircleNotch, GameController, LinkBreak, LinkSimple } from '@phosphor-icons/react';
import {
  disconnectProvider,
  fetchConnections,
  getDiscordOauthUrl,
  saveDiscordConnection,
  saveRiotConnection,
} from '../lib/api';
import { useAuth } from '../context/AuthContext';

const RIOT_REGIONS = ['americas', 'asia', 'europe', 'sea', 'lan', 'las', 'na', 'br'];

export default function ConnectionSettings() {
  const { updateUser } = useAuth();
  const [riotGameName, setRiotGameName] = useState('');
  const [riotTagLine, setRiotTagLine] = useState('');
  const [riotRegion, setRiotRegion] = useState('americas');
  const [riotGame, setRiotGame] = useState<'lol' | 'valorant'>('lol');
  const [discordUsername, setDiscordUsername] = useState('');
  const [riotConnected, setRiotConnected] = useState(false);
  const [discordConnected, setDiscordConnected] = useState(false);
  const [discordOauth, setDiscordOauth] = useState(false);
  const [discordVoice, setDiscordVoice] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<'riot' | 'discord' | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchConnections()
      .then(({ connections, capabilities }) => {
        setDiscordOauth(capabilities.discordOauth);
        setDiscordVoice(capabilities.discordVoice);
        const riot = connections.find((c) => c.provider === 'riot');
        const discord = connections.find((c) => c.provider === 'discord');
        if (riot?.connected) {
          setRiotGameName(riot.riotGameName ?? '');
          setRiotTagLine(riot.riotTagLine ?? '');
          setRiotRegion(riot.riotRegion ?? 'americas');
          setRiotGame(riot.metadata?.activeGame ?? 'lol');
          setRiotConnected(true);
        }
        if (discord?.connected) {
          setDiscordUsername(discord.discordUsername ?? '');
          setDiscordConnected(true);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSaveRiot = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving('riot');
    setMessage('');
    try {
      const res = await saveRiotConnection({
        gameName: riotGameName,
        tagLine: riotTagLine,
        region: riotRegion,
        game: riotGame,
      });
      setRiotConnected(true);
      updateUser(res.user);
      setMessage(res.message);
    } catch {
      setMessage('No se pudo verificar esa cuenta Riot. Revisa el Riot ID, tag y región.');
    } finally {
      setSaving(null);
    }
  };

  const handleSaveDiscord = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving('discord');
    setMessage('');
    try {
      const res = await saveDiscordConnection({ username: discordUsername });
      setDiscordConnected(true);
      setMessage(res.message);
    } catch {
      setMessage('Error al guardar conexión Discord');
    } finally {
      setSaving(null);
    }
  };

  const handleDisconnect = async (provider: 'riot' | 'discord') => {
    await disconnectProvider(provider);
    if (provider === 'riot') {
      setRiotConnected(false);
      setRiotGameName('');
      setRiotTagLine('');
    } else {
      setDiscordConnected(false);
      setDiscordUsername('');
    }
    setMessage('');
  };

  if (loading) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <CircleNotch className="w-6 h-6 animate-spin mx-auto text-brand-violet" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-6 border-t border-white/8">
      <div>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">
          Conexiones
        </h3>
        <p className="text-xs text-slate-500">
          Configura Riot y Discord para matchmaking y grupos automáticos.
        </p>
      </div>

      {message && (
        <p className="text-sm text-emerald-400 bg-emerald-500/10 rounded-xl px-3 py-2 flex items-center gap-2">
          <Check className="w-4 h-4" /> {message}
        </p>
      )}

      <form onSubmit={handleSaveRiot} className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <GameController className="w-5 h-5 text-red-400" />
            <h4 className="font-semibold text-white">Riot Games</h4>
            {riotConnected && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">Conectado</span>
            )}
          </div>
          {riotConnected && (
            <button type="button" onClick={() => handleDisconnect('riot')} className="text-slate-400 hover:text-red-400">
              <LinkBreak className="w-4 h-4" />
            </button>
          )}
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Verificaremos tu Riot ID y mostraremos historial, colas y estadísticas del juego elegido.
        </p>
        <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-black/10 p-1">
          <button type="button" onClick={() => setRiotGame('lol')} className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${riotGame === 'lol' ? 'bg-brand-violet text-white' : 'text-slate-400 hover:text-white'}`}>League of Legends</button>
          <button type="button" onClick={() => setRiotGame('valorant')} className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${riotGame === 'valorant' ? 'bg-red-500 text-white' : 'text-slate-400 hover:text-white'}`}>Valorant</button>
        </div>
        <div className="grid gap-3 mb-3 sm:grid-cols-2">
          <input
            value={riotGameName}
            onChange={(e) => setRiotGameName(e.target.value)}
            placeholder="Nombre de invocador"
            required
            className="glass rounded-xl px-3 py-2.5 text-sm text-white border border-white/10 focus:border-brand-violet/50 focus:outline-none"
          />
          <input
            value={riotTagLine}
            onChange={(e) => setRiotTagLine(e.target.value)}
            placeholder="Tag (ej. LAN)"
            required
            className="glass rounded-xl px-3 py-2.5 text-sm text-white border border-white/10 focus:border-brand-violet/50 focus:outline-none"
          />
        </div>
        <div className="mb-3">
          <select
            value={riotRegion}
            onChange={(e) => setRiotRegion(e.target.value)}
            className="glass rounded-xl px-3 py-2.5 text-sm text-white border border-white/10 focus:outline-none"
          >
            {RIOT_REGIONS.map((r) => (
              <option key={r} value={r} className="bg-brand-dark">{r.toUpperCase()}</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={saving === 'riot'}
          className="gradient-btn flex items-center gap-2 px-5 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
        >
          {saving === 'riot' ? <CircleNotch className="w-4 h-4 animate-spin" /> : <LinkSimple className="w-4 h-4" />}
          {riotConnected ? 'Actualizar Riot' : 'Conectar Riot'}
        </button>
      </form>

      <form onSubmit={handleSaveDiscord} className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ChatCircle className="w-5 h-5 text-indigo-400" />
            <h4 className="font-semibold text-white">Discord</h4>
            {discordConnected && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">Conectado</span>
            )}
          </div>
          {discordConnected && (
            <button type="button" onClick={() => handleDisconnect('discord')} className="text-slate-400 hover:text-red-400">
              <LinkBreak className="w-4 h-4" />
            </button>
          )}
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Tu Discord sólo se comparte después del match.{discordVoice ? ' También se creará una invitación temporal al canal de voz.' : ''}
        </p>
        {discordOauth && <button type="button" onClick={async () => { window.location.href = await getDiscordOauthUrl(); }} className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#5865F2] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#4752c4]"><ChatCircle className="h-4 w-4" /> Conectar con Discord</button>}
        {discordOauth && <div className="mb-4 flex items-center gap-3 text-xs text-slate-600"><span className="h-px flex-1 bg-white/10" />o escribe tu usuario<span className="h-px flex-1 bg-white/10" /></div>}
        <input
          value={discordUsername}
          onChange={(e) => setDiscordUsername(e.target.value)}
          placeholder="Usuario Discord (ej. jugador#1234)"
          required
          className="w-full glass rounded-xl px-3 py-2.5 text-sm text-white border border-white/10
            focus:border-brand-violet/50 focus:outline-none mb-3"
        />
        <button
          type="submit"
          disabled={saving === 'discord'}
          className="gradient-btn flex items-center gap-2 px-5 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
        >
          {saving === 'discord' ? <CircleNotch className="w-4 h-4 animate-spin" /> : <LinkSimple className="w-4 h-4" />}
          {discordConnected ? 'Actualizar Discord' : 'Conectar Discord'}
        </button>
      </form>
    </div>
  );
}
