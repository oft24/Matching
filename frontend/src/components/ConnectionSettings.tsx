import { useEffect, useState } from 'react';
import { Gamepad2, MessageCircle, Link2, Unlink, Loader2, Check } from 'lucide-react';
import {
  disconnectProvider,
  fetchConnections,
  saveDiscordConnection,
  saveRiotConnection,
} from '../lib/api';

const RIOT_REGIONS = ['americas', 'asia', 'europe', 'sea', 'lan', 'las', 'na', 'br'];

export default function ConnectionSettings() {
  const [riotGameName, setRiotGameName] = useState('');
  const [riotTagLine, setRiotTagLine] = useState('');
  const [riotRegion, setRiotRegion] = useState('americas');
  const [riotApiKey, setRiotApiKey] = useState('');
  const [discordUsername, setDiscordUsername] = useState('');
  const [riotConnected, setRiotConnected] = useState(false);
  const [discordConnected, setDiscordConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<'riot' | 'discord' | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchConnections()
      .then(({ connections }) => {
        const riot = connections.find((c) => c.provider === 'riot');
        const discord = connections.find((c) => c.provider === 'discord');
        if (riot?.connected) {
          setRiotGameName(riot.riotGameName ?? '');
          setRiotTagLine(riot.riotTagLine ?? '');
          setRiotRegion(riot.riotRegion ?? 'americas');
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
        apiKey: riotApiKey || undefined,
      });
      setRiotConnected(true);
      setMessage(res.message);
    } catch {
      setMessage('Error al guardar conexión Riot');
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
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-violet" />
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
            <Gamepad2 className="w-5 h-5 text-red-400" />
            <h4 className="font-semibold text-white">Riot Games</h4>
            {riotConnected && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">Conectado</span>
            )}
          </div>
          {riotConnected && (
            <button type="button" onClick={() => handleDisconnect('riot')} className="text-slate-400 hover:text-red-400">
              <Unlink className="w-4 h-4" />
            </button>
          )}
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Necesario para el dashboard con estadísticas de LoL/Valorant (API Riot próximamente).
        </p>
        <div className="grid sm:grid-cols-2 gap-3 mb-3">
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
        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          <select
            value={riotRegion}
            onChange={(e) => setRiotRegion(e.target.value)}
            className="glass rounded-xl px-3 py-2.5 text-sm text-white border border-white/10 focus:outline-none"
          >
            {RIOT_REGIONS.map((r) => (
              <option key={r} value={r} className="bg-brand-dark">{r.toUpperCase()}</option>
            ))}
          </select>
          <input
            type="password"
            value={riotApiKey}
            onChange={(e) => setRiotApiKey(e.target.value)}
            placeholder="API Key Riot (opcional)"
            className="glass rounded-xl px-3 py-2.5 text-sm text-white border border-white/10 focus:border-brand-violet/50 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={saving === 'riot'}
          className="gradient-btn flex items-center gap-2 px-5 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
        >
          {saving === 'riot' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
          {riotConnected ? 'Actualizar Riot' : 'Conectar Riot'}
        </button>
      </form>

      <form onSubmit={handleSaveDiscord} className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-indigo-400" />
            <h4 className="font-semibold text-white">Discord</h4>
            {discordConnected && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">Conectado</span>
            )}
          </div>
          {discordConnected && (
            <button type="button" onClick={() => handleDisconnect('discord')} className="text-slate-400 hover:text-red-400">
              <Unlink className="w-4 h-4" />
            </button>
          )}
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Al aceptar un match mutuamente se generará invitación al grupo de Discord.
        </p>
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
          {saving === 'discord' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
          {discordConnected ? 'Actualizar Discord' : 'Conectar Discord'}
        </button>
      </form>
    </div>
  );
}
