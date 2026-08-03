const PLATFORM_ROUTES = {
  americas: 'la1', na: 'na1', lan: 'la1', las: 'la2', br: 'br1',
  europe: 'euw1', asia: 'kr', sea: 'sg2',
};

const REGIONAL_ROUTES = {
  na1: 'americas', la1: 'americas', la2: 'americas', br1: 'americas',
  euw1: 'europe', eun1: 'europe', tr1: 'europe', ru: 'europe',
  kr: 'asia', jp1: 'asia', oc1: 'sea', ph2: 'sea', sg2: 'sea',
  th2: 'sea', tw2: 'sea', vn2: 'sea',
};

const QUEUE_NAMES = {
  400: 'Normal Draft', 420: 'Ranked Solo/Duo', 430: 'Normal Blind',
  440: 'Ranked Flex', 450: 'ARAM', 490: 'Quickplay', 1700: 'Arena',
};

const VALORANT_QUEUES = {
  competitive: 'Competitivo', unrated: 'Normal', swiftplay: 'Swiftplay',
  spikerush: 'Spike Rush', deathmatch: 'Deathmatch', ggteam: 'Escalation',
  onefa: 'Replication', hurm: 'Team Deathmatch', custom: 'Personalizada',
};

const VALORANT_TIERS = {
  0: 'Sin rango', 3: 'Iron 1', 4: 'Iron 2', 5: 'Iron 3',
  6: 'Bronze 1', 7: 'Bronze 2', 8: 'Bronze 3', 9: 'Silver 1',
  10: 'Silver 2', 11: 'Silver 3', 12: 'Gold 1', 13: 'Gold 2',
  14: 'Gold 3', 15: 'Platinum 1', 16: 'Platinum 2', 17: 'Platinum 3',
  18: 'Diamond 1', 19: 'Diamond 2', 20: 'Diamond 3', 21: 'Ascendant 1',
  22: 'Ascendant 2', 23: 'Ascendant 3', 24: 'Immortal 1', 25: 'Immortal 2',
  26: 'Immortal 3', 27: 'Radiant',
};

export class RiotApiError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.name = 'RiotApiError';
    this.status = status;
  }
}

function apiKey() {
  if (!process.env.RIOT_API_KEY) throw new RiotApiError('La API de Riot no está configurada', 503);
  return process.env.RIOT_API_KEY;
}

function routes(region) {
  const value = String(region).toLowerCase();
  const platform = PLATFORM_ROUTES[value] ?? value;
  return { platform, regional: REGIONAL_ROUTES[platform] ?? 'americas' };
}

async function riotFetch(host, path) {
  const response = await fetch(`https://${host}.api.riotgames.com${path}`, {
    headers: { 'X-Riot-Token': apiKey() },
  });
  if (response.ok) return response.json();
  if (response.status === 401 || response.status === 403) throw new RiotApiError('La clave de Riot expiró o no tiene permisos', 503);
  if (response.status === 404) throw new RiotApiError('No se encontró esa cuenta Riot', 404);
  if (response.status === 429) throw new RiotApiError('Riot limitó temporalmente las consultas. Intenta de nuevo en un minuto', 429);
  throw new RiotApiError('Riot Games no pudo responder en este momento', 502);
}

let dataDragonCache;
async function dataDragon() {
  if (dataDragonCache) return dataDragonCache;
  const versions = await fetch('https://ddragon.leagueoflegends.com/api/versions.json').then((res) => res.json());
  const version = versions[0];
  const champions = await fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/es_MX/champion.json`).then((res) => res.json());
  dataDragonCache = { version, champions: Object.values(champions.data) };
  return dataDragonCache;
}

export async function resolveRiotAccount(gameName, tagLine, region) {
  const { regional } = routes(region);
  return riotFetch(regional, `/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`);
}

export async function getLeagueIdentity(puuid, region) {
  const { platform } = routes(region);
  const [summoner, mastery, dragon] = await Promise.all([
    riotFetch(platform, `/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(puuid)}`),
    riotFetch(platform, `/lol/champion-mastery/v4/champion-masteries/by-puuid/${encodeURIComponent(puuid)}/top?count=1`).catch(() => []),
    dataDragon(),
  ]);
  const champion = mastery[0] ? dragon.champions.find((item) => Number(item.key) === mastery[0].championId) : null;
  return {
    profileIconId: summoner.profileIconId,
    profileIconUrl: `https://ddragon.leagueoflegends.com/cdn/${dragon.version}/img/profileicon/${summoner.profileIconId}.png`,
    summonerLevel: summoner.summonerLevel,
    topChampion: champion ? {
      id: champion.id, name: champion.name, masteryLevel: mastery[0].championLevel,
      masteryPoints: mastery[0].championPoints,
      imageUrl: `https://ddragon.leagueoflegends.com/cdn/${dragon.version}/img/champion/${champion.id}.png`,
    } : null,
  };
}

function rankedSummary(entries, selectedQueue) {
  const queueType = selectedQueue === 'flex' ? 'RANKED_FLEX_SR' : selectedQueue === 'solo' ? 'RANKED_SOLO_5x5' : null;
  return entries
    .filter((entry) => ['RANKED_SOLO_5x5', 'RANKED_FLEX_SR'].includes(entry.queueType))
    .filter((entry) => !queueType || entry.queueType === queueType)
    .map((entry) => ({
      queue: entry.queueType === 'RANKED_SOLO_5x5' ? 'Solo/Duo' : 'Flex',
      tier: entry.tier,
      rank: entry.rank,
      leaguePoints: entry.leaguePoints,
      wins: entry.wins,
      losses: entry.losses,
      winRate: Math.round((entry.wins / Math.max(1, entry.wins + entry.losses)) * 100),
    }));
}

function championImage(dragon, championName) {
  const champion = dragon.champions.find((item) => item.name === championName || item.id === championName);
  return champion ? `https://ddragon.leagueoflegends.com/cdn/${dragon.version}/img/champion/${champion.id}.png` : null;
}

function matchSummary(match, puuid, dragon) {
  const participant = match.info.participants.find((item) => item.puuid === puuid);
  if (!participant) return null;
  return {
    id: match.metadata.matchId,
    champion: participant.championName,
    championId: participant.championId,
    championImageUrl: championImage(dragon, participant.championName),
    win: participant.win,
    kills: participant.kills,
    deaths: participant.deaths,
    assists: participant.assists,
    kda: Number(((participant.kills + participant.assists) / Math.max(1, participant.deaths)).toFixed(2)),
    cs: participant.totalMinionsKilled + participant.neutralMinionsKilled,
    visionScore: participant.visionScore,
    role: participant.teamPosition || participant.individualPosition || 'FILL',
    queue: QUEUE_NAMES[match.info.queueId] ?? `Cola ${match.info.queueId}`,
    durationSeconds: match.info.gameDuration ?? 0,
    playedAt: new Date(match.info.gameEndTimestamp ?? match.info.gameStartTimestamp).toISOString(),
  };
}

export async function getLeagueProfile(puuid, region, selectedQueue = 'solo') {
  const { platform, regional } = routes(region);
  const queueId = selectedQueue === 'flex' ? 440 : 420;
  const [ranked, matchIds, dragon] = await Promise.all([
    riotFetch(platform, `/lol/league/v4/entries/by-puuid/${encodeURIComponent(puuid)}`),
    riotFetch(regional, `/lol/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids?queue=${queueId}&start=0&count=5`),
    dataDragon(),
  ]);
  const rawMatches = await Promise.all(matchIds.map((id) => riotFetch(regional, `/lol/match/v5/matches/${encodeURIComponent(id)}`)));
  const matches = rawMatches.map((match) => matchSummary(match, puuid, dragon)).filter(Boolean);
  const wins = matches.filter((match) => match.win).length;
  const recent = matches.length ? {
    wins,
    losses: matches.length - wins,
    winRate: Math.round((wins / matches.length) * 100),
    kda: Number((matches.reduce((sum, match) => sum + match.kda, 0) / matches.length).toFixed(2)),
    cs: Math.round(matches.reduce((sum, match) => sum + match.cs, 0) / matches.length),
  } : { wins: 0, losses: 0, winRate: 0, kda: 0, cs: 0 };
  return { ranked: rankedSummary(ranked, selectedQueue), recent, matches };
}

export async function getLeagueMatchDetail(matchId, viewerPuuid, region) {
  const { regional } = routes(region);
  const [match, dragon] = await Promise.all([
    riotFetch(regional, `/lol/match/v5/matches/${encodeURIComponent(matchId)}`),
    dataDragon(),
  ]);
  if (!match.metadata.participants.includes(viewerPuuid)) throw new RiotApiError('Esa partida no pertenece a tu historial', 403);
  const teams = match.info.teams.map((team) => ({
    teamId: team.teamId,
    win: team.win,
    objectives: team.objectives,
    bans: team.bans,
  }));
  const participants = match.info.participants.map((player) => ({
    puuid: player.puuid,
    teamId: player.teamId,
    riotIdGameName: player.riotIdGameName || player.summonerName || 'Jugador',
    riotIdTagLine: player.riotIdTagline || '',
    champion: player.championName,
    championId: player.championId,
    championImageUrl: championImage(dragon, player.championName),
    position: player.teamPosition || player.individualPosition || 'FILL',
    kills: player.kills,
    deaths: player.deaths,
    assists: player.assists,
    kda: Number(((player.kills + player.assists) / Math.max(1, player.deaths)).toFixed(2)),
    cs: player.totalMinionsKilled + player.neutralMinionsKilled,
    gold: player.goldEarned,
    damage: player.totalDamageDealtToChampions,
    visionScore: player.visionScore,
    items: [player.item0, player.item1, player.item2, player.item3, player.item4, player.item5, player.item6].filter(Boolean),
    win: player.win,
  }));
  return {
    id: match.metadata.matchId,
    queue: QUEUE_NAMES[match.info.queueId] ?? `Cola ${match.info.queueId}`,
    durationSeconds: match.info.gameDuration,
    playedAt: new Date(match.info.gameEndTimestamp ?? match.info.gameStartTimestamp).toISOString(),
    gameVersion: match.info.gameVersion,
    dataDragonVersion: dragon.version,
    teams,
    participants,
  };
}

export async function getLeaguePublicPlayer(puuid, region, selectedQueue = 'solo') {
  const { regional } = routes(region);
  const [account, profile] = await Promise.all([
    riotFetch(regional, `/riot/account/v1/accounts/by-puuid/${encodeURIComponent(puuid)}`),
    getLeagueProfile(puuid, region, selectedQueue),
  ]);
  return { account, ...profile };
}

let valorantContentCache = new Map();
async function valorantContent(regional) {
  if (valorantContentCache.has(regional)) return valorantContentCache.get(regional);
  const content = await riotFetch(regional, '/val/content/v1/contents?locale=es-MX');
  const agents = new Map((content.characters ?? []).map((agent) => [agent.id, agent.name]));
  const maps = new Map((content.maps ?? []).map((map) => [map.id, map.name]));
  const value = { agents, maps };
  valorantContentCache.set(regional, value);
  return value;
}

function valorantMatchSummary(match, puuid, content) {
  const player = match.players?.find((item) => item.puuid === puuid);
  if (!player) return null;
  const team = match.teams?.find((item) => item.teamId === player.teamId);
  const rounds = match.roundResults ?? [];
  let headshots = 0;
  let damage = 0;
  for (const round of rounds) {
    const roundPlayer = round.playerStats?.find((item) => item.puuid === puuid);
    for (const dealt of roundPlayer?.damage ?? []) {
      headshots += dealt.headshots ?? 0;
      damage += dealt.damage ?? 0;
    }
  }
  const stats = player.stats ?? {};
  const kills = stats.kills ?? 0;
  const deaths = stats.deaths ?? 0;
  const assists = stats.assists ?? 0;
  return {
    id: match.matchInfo.matchId,
    champion: content.agents.get(player.characterId) ?? 'Agente desconocido',
    championId: player.characterId,
    win: Boolean(team?.won),
    kills, deaths, assists,
    kda: Number(((kills + assists) / Math.max(1, deaths)).toFixed(2)),
    cs: 0,
    visionScore: 0,
    score: stats.score ?? 0,
    roundsPlayed: stats.roundsPlayed ?? team?.roundsPlayed ?? 0,
    headshots,
    damage,
    role: content.maps.get(match.matchInfo.mapId) ?? 'Mapa',
    queue: VALORANT_QUEUES[match.matchInfo.queueId] ?? match.matchInfo.queueId ?? 'Cola desconocida',
    queueId: match.matchInfo.queueId,
    rank: VALORANT_TIERS[player.competitiveTier] ?? `Tier ${player.competitiveTier ?? 0}`,
    durationSeconds: Math.round((match.matchInfo.gameLengthMillis ?? 0) / 1000),
    playedAt: new Date(match.matchInfo.gameStartMillis).toISOString(),
  };
}

export async function getValorantProfile(puuid, region) {
  const { regional } = routes(region);
  const [matchList, content] = await Promise.all([
    riotFetch(regional, `/val/match/v1/matchlists/by-puuid/${encodeURIComponent(puuid)}`),
    valorantContent(regional),
  ]);
  const history = (matchList.history ?? []).slice(0, 5);
  const rawMatches = await Promise.all(history.map((item) => riotFetch(regional, `/val/match/v1/matches/${encodeURIComponent(item.matchId)}`)));
  const matches = rawMatches.map((match) => valorantMatchSummary(match, puuid, content)).filter(Boolean);
  const wins = matches.filter((match) => match.win).length;
  const competitive = matches.filter((match) => match.queueId === 'competitive');
  const latestRank = competitive[0]?.rank;
  const recent = matches.length ? {
    wins,
    losses: matches.length - wins,
    winRate: Math.round((wins / matches.length) * 100),
    kda: Number((matches.reduce((sum, match) => sum + match.kda, 0) / matches.length).toFixed(2)),
    cs: 0,
    avgScore: Math.round(matches.reduce((sum, match) => sum + match.score, 0) / matches.length),
    avgDamage: Math.round(matches.reduce((sum, match) => sum + match.damage, 0) / matches.length),
    headshots: matches.reduce((sum, match) => sum + match.headshots, 0),
  } : { wins: 0, losses: 0, winRate: 0, kda: 0, cs: 0, avgScore: 0, avgDamage: 0, headshots: 0 };
  return {
    ranked: latestRank ? [{ queue: 'Competitivo', tier: latestRank, rank: '', leaguePoints: 0, wins: competitive.filter((match) => match.win).length, losses: competitive.filter((match) => !match.win).length, winRate: competitive.length ? Math.round((competitive.filter((match) => match.win).length / competitive.length) * 100) : 0 }] : [],
    recent,
    matches,
  };
}
