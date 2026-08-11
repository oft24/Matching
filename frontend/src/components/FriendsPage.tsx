import { useEffect, useState } from 'react';
import { ChartBar, ChatCircle, Check, CircleNotch, GameController, MagnifyingGlass, Star, Sword, Target, Trophy, UserMinus, UserPlus, X } from '@phosphor-icons/react';
import Avatar from './Avatar';
import PageHeader from './PageHeader';
import { acceptFriend, addFriend, fetchFriendDashboard, fetchFriendProfile, fetchFriends, rateFriend, removeFriend, searchPlayers } from '../lib/api';
import type { FriendDashboard, FriendProfile, FriendRating } from '../types';

export default function FriendsPage() {
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [incoming, setIncoming] = useState<FriendProfile[]>([]);
  const [outgoing, setOutgoing] = useState<FriendProfile[]>([]);
  const [results, setResults] = useState<FriendProfile[]>([]);
  const [selected, setSelected] = useState<FriendProfile | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const reload = () => fetchFriends().then((data) => { setFriends(data.friends); setIncoming(data.incoming); setOutgoing(data.outgoing); });
  useEffect(() => { reload().finally(() => setLoading(false)); }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (query.trim().length < 2) return setResults([]);
      searchPlayers(query).then(setResults);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  const sendRequest = async (person: FriendProfile) => {
    const request = await addFriend(person.id);
    setOutgoing((items) => [request, ...items]);
    setResults((items) => items.map((item) => item.id === person.id ? request : item));
  };
  const accept = async (person: FriendProfile) => {
    const friend = await acceptFriend(person.id);
    setIncoming((items) => items.filter((item) => item.id !== person.id));
    setFriends((items) => [friend, ...items]);
    setResults((items) => items.map((item) => item.id === person.id ? friend : item));
  };
  const remove = async (person: FriendProfile) => {
    await removeFriend(person.id);
    setFriends((items) => items.filter((item) => item.id !== person.id));
    setIncoming((items) => items.filter((item) => item.id !== person.id));
    setOutgoing((items) => items.filter((item) => item.id !== person.id));
    setResults((items) => items.map((item) => item.id === person.id ? { ...item, isFriend: false, requestStatus: 'none', discord: null } : item));
    if (selected?.id === person.id) setSelected(null);
  };

  return <section className="mb-8 max-w-6xl mx-auto">
    <PageHeader kicker="TU SQUAD" title="Amigos" action={<span className="text-sm text-slate-500">{friends.length} contactos</span>} />
    <div className="anim-fade-up relative mb-6" style={{ animationDelay: '60ms' }}><MagnifyingGlass className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar jugadores por nombre..." className="w-full rounded-xl border border-white/10 bg-[#0b1220] py-3 pl-11 pr-4 text-sm text-white transition-colors placeholder:text-slate-600 focus:border-brand-violet/60 focus:outline-none" /></div>

    {!!incoming.length && <List title={`Solicitudes recibidas (${incoming.length})`} people={incoming} renderAction={(person) => <div className="flex gap-2"><IconButton title="Aceptar" onClick={() => accept(person)} accent><Check className="h-4 w-4" /></IconButton><IconButton title="Rechazar" onClick={() => remove(person)}><X className="h-4 w-4" /></IconButton></div>} />}
    {!!outgoing.length && <List title={`Solicitudes enviadas (${outgoing.length})`} people={outgoing} renderAction={(person) => <button onClick={() => remove(person)} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-400 hover:text-white">Cancelar</button>} />}
    {query.trim().length >= 2 && <List title="Resultados en Matching" people={results} empty="No encontramos jugadores con ese nombre." renderAction={(person) => <RequestAction person={person} onSend={sendRequest} onAccept={accept} onRemove={remove} />} />}

    <h3 className="mb-3 text-sm text-slate-400">Tus amigos</h3>
    {loading ? <CircleNotch className="h-6 w-6 animate-spin text-brand-violet" /> : friends.length ? <div className="stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{friends.map((person) => <PersonCard key={person.id} person={person} onOpen={setSelected} action={<IconButton title="Eliminar amigo" onClick={() => remove(person)}><UserMinus className="h-4 w-4" /></IconButton>} />)}</div> : <div className="glass rounded-xl p-8 text-center text-slate-400">Busca jugadores y envía una solicitud. Serán amigos cuando la acepten.</div>}
    {selected && <ProfileDialog person={selected} onClose={() => setSelected(null)} />}
  </section>;
}

function List({ title, people, empty, renderAction }: { title: string; people: FriendProfile[]; empty?: string; renderAction: (person: FriendProfile) => React.ReactNode }) {
  return <div className="mb-7"><h3 className="mb-3 text-sm text-slate-400">{title}</h3>{people.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{people.map((person) => <PersonCard key={person.id} person={person} action={renderAction(person)} />)}</div> : empty && <p className="text-sm text-slate-500">{empty}</p>}</div>;
}

function RequestAction({ person, onSend, onAccept, onRemove }: { person: FriendProfile; onSend: (p: FriendProfile) => void; onAccept: (p: FriendProfile) => void; onRemove: (p: FriendProfile) => void }) {
  if (person.requestStatus === 'accepted') return <span className="text-xs text-emerald-400">Amigos</span>;
  if (person.requestStatus === 'sent') return <button onClick={() => onRemove(person)} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-400">Enviada</button>;
  if (person.requestStatus === 'received') return <IconButton title="Aceptar solicitud" onClick={() => onAccept(person)} accent><Check className="h-4 w-4" /></IconButton>;
  return <IconButton title="Enviar solicitud" onClick={() => onSend(person)} accent><UserPlus className="h-4 w-4" /></IconButton>;
}

function PersonCard({ person, onOpen, action }: { person: FriendProfile; onOpen?: (p: FriendProfile) => void; action: React.ReactNode }) {
  return <article className="surface card-lift flex items-center gap-3 rounded-2xl p-3.5"><button disabled={!onOpen} onClick={() => onOpen?.(person)} aria-label={onOpen ? `Ver perfil de ${person.username}` : undefined} className="group flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left disabled:cursor-default"><Avatar name={person.username} src={person.avatar} size={46} /><span className="min-w-0"><strong className="block truncate text-sm text-white transition-colors group-hover:text-violet-300">{person.username}</strong><small className="text-xs text-slate-500">Nivel {person.level}{person.riot ? ` · ${person.riot.gameName}#${person.riot.tagLine}` : ''}</small></span></button>{action}</article>;
}

function IconButton({ title, onClick, accent, children }: { title: string; onClick: () => void; accent?: boolean; children: React.ReactNode }) {
  return <button title={title} onClick={onClick} className={`grid h-9 w-9 place-items-center rounded-lg border ${accent ? 'border-brand-violet/40 bg-brand-violet/10 text-brand-violet' : 'border-white/10 text-slate-400 hover:text-white'}`}>{children}</button>;
}

function ProfileDialog({ person, onClose }: { person: FriendProfile; onClose: () => void }) {
  const [profile, setProfile] = useState(person);
  const [rating, setRating] = useState<FriendRating | null>(null);
  const [dashboard, setDashboard] = useState<FriendDashboard | null>(null);
  const [queue, setQueue] = useState<'solo' | 'flex'>('solo');
  const [loading, setLoading] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState('');
  const [ratingSaving, setRatingSaving] = useState(false);
  const [ratingError, setRatingError] = useState('');

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchFriendProfile(person.id).then((data) => {
      if (!active) return;
      setProfile(data.profile);
      setRating(data.rating);
    }).catch((error) => {
      if (active) setRatingError(apiErrorMessage(error, 'No pudimos actualizar este perfil.'));
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [person.id]);

  useEffect(() => {
    let active = true;
    setDashboardLoading(true);
    setDashboardError('');
    fetchFriendDashboard(person.id, queue).then((data) => {
      if (!active) return;
      setDashboard(data);
    }).catch((error) => {
      if (!active) return;
      setDashboard(null);
      setDashboardError(apiErrorMessage(error, 'No pudimos cargar su dashboard de League.'));
    }).finally(() => { if (active) setDashboardLoading(false); });
    return () => { active = false; };
  }, [person.id, queue]);

  const submitRating = async (score: number) => {
    if (ratingSaving) return;
    setRatingSaving(true);
    setRatingError('');
    try {
      setRating(await rateFriend(person.id, score));
    } catch (error) {
      setRatingError(apiErrorMessage(error, 'No se pudo guardar tu calificación.'));
    } finally {
      setRatingSaving(false);
    }
  };

  const recent = dashboard?.stats.recent;
  const rank = dashboard?.stats.ranked[0];
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-6" onClick={onClose}>
    <div role="dialog" aria-modal="true" aria-labelledby="friend-profile-title" className="glass max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-xl" onClick={(event) => event.stopPropagation()}>
      <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-white/10 bg-[#111827]/95 p-5 backdrop-blur-xl sm:p-6">
        <div className="flex min-w-0 gap-4"><Avatar name={profile.username} src={profile.avatar} size={76} radius={16} /><div className="min-w-0"><h3 id="friend-profile-title" className="truncate text-xl font-bold text-white sm:text-2xl">{profile.username}</h3><p className="mt-1 text-sm text-slate-400">Nivel {profile.level} · {genderLabel(profile.gender)}</p>{profile.riot && <p className="mt-1 truncate text-sm text-indigo-300">{profile.riot.gameName}#{profile.riot.tagLine} · {profile.riot.region?.toUpperCase()}</p>}</div></div>
        <button onClick={onClose} title="Cerrar perfil" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 text-slate-400 hover:bg-white/5 hover:text-white"><X className="h-4 w-4" /></button>
      </header>

      <div className="p-5 sm:p-6">
        {loading && <div className="flex items-center gap-2 py-8 text-sm text-slate-400"><CircleNotch className="h-5 w-5 animate-spin text-brand-violet" /> Cargando perfil...</div>}
        {!loading && <>
          <section className="grid gap-5 border-b border-white/10 pb-6 md:grid-cols-[1fr_auto] md:items-center">
            <div><p className="text-sm font-semibold text-white">Calificación de la comunidad</p><div className="mt-2 flex flex-wrap items-center gap-3"><StarRow value={rating?.average ?? 0} /><strong className="text-xl text-white">{rating?.count ? rating.average.toFixed(1) : 'Sin calificar'}</strong><span className="text-xs text-slate-500">{rating?.count ?? 0} {(rating?.count ?? 0) === 1 ? 'valoración' : 'valoraciones'}</span></div></div>
            <div><p className="mb-2 text-xs font-medium text-slate-400">Tu calificación</p><div className="flex items-center gap-1">{[1, 2, 3, 4, 5].map((score) => <button key={score} type="button" onClick={() => submitRating(score)} disabled={ratingSaving} aria-label={`Calificar con ${score} estrellas`} title={`${score} estrellas`} className="grid h-9 w-9 place-items-center rounded-md text-amber-300 hover:bg-amber-300/10 disabled:opacity-50"><Star className={`h-6 w-6 ${(rating?.myRating ?? 0) >= score ? 'fill-current' : ''}`} /></button>)}{ratingSaving && <CircleNotch className="ml-2 h-4 w-4 animate-spin text-slate-500" />}</div>{ratingError && <p className="mt-2 text-xs text-red-300">{ratingError}</p>}</div>
          </section>

          <section className="border-b border-white/10 py-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h4 className="flex items-center gap-2 font-semibold text-white"><GameController className="h-4 w-4 text-indigo-300" /> Dashboard de League of Legends</h4><p className="mt-1 text-xs text-slate-500">Rendimiento de su cuenta conectada de Riot.</p></div><div className="grid grid-cols-2 rounded-lg border border-white/10 bg-[#0d1523] p-1"><button onClick={() => setQueue('solo')} className={`rounded-md px-4 py-2 text-xs font-semibold ${queue === 'solo' ? 'bg-indigo-500 text-white' : 'text-slate-400'}`}>Solo/Duo</button><button onClick={() => setQueue('flex')} className={`rounded-md px-4 py-2 text-xs font-semibold ${queue === 'flex' ? 'bg-indigo-500 text-white' : 'text-slate-400'}`}>Flex</button></div></div>

            {dashboardLoading ? <div className="flex items-center gap-2 py-10 text-sm text-slate-400"><CircleNotch className="h-5 w-5 animate-spin text-brand-violet" /> Consultando Riot Games...</div> : dashboardError ? <div className="mt-5 border-l-2 border-amber-400/60 py-2 pl-4 text-sm text-slate-400">{dashboardError}</div> : dashboard && <>
              <div className="mt-6 grid grid-cols-2 border-y border-white/10 sm:grid-cols-4">
                <ProfileStat icon={Trophy} label="Rango" value={rank ? `${rank.tier} ${rank.rank}`.trim() : 'Sin rango'} detail={rank ? `${rank.leaguePoints} LP` : ''} />
                <ProfileStat icon={Target} label="Win rate" value={`${recent?.winRate ?? 0}%`} detail={recent ? `${recent.wins}V · ${recent.losses}D` : ''} />
                <ProfileStat icon={Sword} label="KDA" value={String(recent?.kda ?? 0)} detail="Últimas 5" />
                <ProfileStat icon={ChartBar} label="CS promedio" value={String(recent?.cs ?? 0)} detail="Por partida" />
              </div>
              <div className="mt-6"><h5 className="text-sm font-semibold text-white">Partidas recientes</h5>{dashboard.matchHistory.length ? <div className="mt-3 divide-y divide-white/10 border-y border-white/10">{dashboard.matchHistory.map((match) => <article key={match.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 py-3"><img src={match.championImageUrl ?? ''} alt={match.champion} className="h-11 w-11 rounded-lg object-cover ring-1 ring-white/10" /><div className="min-w-0"><div className="flex flex-wrap items-center gap-x-2"><strong className="text-sm text-white">{match.champion}</strong><span className={match.win ? 'text-xs font-semibold text-emerald-300' : 'text-xs font-semibold text-red-300'}>{match.win ? 'Victoria' : 'Derrota'}</span></div><p className="mt-1 truncate text-xs text-slate-500">{match.queue} · {match.cs} CS · {playedDate(match.playedAt)}</p></div><div className="text-right"><p className="text-sm font-semibold text-white">{match.kills} / {match.deaths} / {match.assists}</p><p className="mt-1 text-xs text-indigo-300">{match.kda} KDA</p></div></article>)}</div> : <p className="mt-4 text-sm text-slate-500">{dashboard.message}</p>}</div>
            </>}
          </section>

          <section className="pt-5"><div className="grid gap-4 sm:grid-cols-2">{profile.riot?.topChampion && <div className="flex items-center gap-3"><img src={profile.riot.topChampion.imageUrl} alt={profile.riot.topChampion.name} className="h-12 w-12 rounded-lg object-cover" /><p className="text-sm text-slate-300">Más jugado: <strong className="text-white">{profile.riot.topChampion.name}</strong><br /><span className="text-xs text-slate-500">{profile.riot.topChampion.masteryPoints.toLocaleString()} puntos de maestría</span></p></div>}{profile.discord && <p className="flex items-center gap-2 text-sm text-indigo-300"><ChatCircle className="h-4 w-4" /> Discord: {profile.discord.username}</p>}</div></section>
        </>}
      </div>
    </div>
  </div>;
}

function StarRow({ value }: { value: number }) {
  return <span className="flex gap-0.5" aria-label={`${value} de 5 estrellas`}>{[1, 2, 3, 4, 5].map((score) => <Star key={score} className={`h-4 w-4 text-amber-300 ${value >= score - 0.25 ? 'fill-current' : ''}`} />)}</span>;
}

function ProfileStat({ icon: Icon, label, value, detail }: { icon: typeof Trophy; label: string; value: string; detail: string }) {
  return <div className="border-white/10 px-3 py-4 sm:border-r sm:last:border-r-0"><Icon className="mb-3 h-4 w-4 text-indigo-300" /><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-lg font-semibold text-white">{value}</p>{detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}</div>;
}

function genderLabel(gender: string | null) {
  if (gender === 'man') return 'Hombre';
  if (gender === 'woman') return 'Mujer';
  if (gender === 'other') return 'Otro género';
  return 'Género no indicado';
}

function playedDate(value: string) {
  return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' }).format(new Date(value));
}

function apiErrorMessage(error: unknown, fallback: string) {
  const candidate = error as { response?: { data?: { error?: string } } };
  return candidate.response?.data?.error ?? fallback;
}
