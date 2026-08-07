export interface Game {
  id: string;
  name: string;
  color: string;
  short: string;
}

export interface SearchFilters {
  game: string;
  region: string;
  language: string;
  matchType: string;
  rank: string;
  role: string;
  age: string;
  preferredGender: 'any' | 'man' | 'woman';
  verifiedOnly: boolean;
  playstyle: string;
  objectives: string;
  activityLevel: string;
  hasMic: boolean;
}

export interface MatchOpponent {
  id: string;
  username: string;
  avatar: string;
  level: number;
  riot: { gameName: string; tagLine: string; region: string } | null;
  discord: { username: string } | null;
}

export interface QueueStatus {
  status: 'idle' | 'searching' | 'pending' | 'accepted' | 'rejected' | 'expired';
  matchId?: string;
  myAccepted?: boolean;
  opponentAccepted?: boolean;
  opponent?: MatchOpponent | null;
  compatibility?: number;
  discordInviteUrl?: string | null;
  expiresAt?: string;
  waitingForOpponent?: boolean;
}

export interface MatchMessage {
  id: string;
  content: string;
  createdAt: string;
  sender: { id: string; username: string };
}

export interface Conversation {
  id: string;
  kind: 'match' | 'direct';
  matchId?: string;
  status?: 'accepted' | 'closed';
  participant: { id: string; username: string; avatar: string; level: number };
  lastMessage: string;
  updatedAt: string;
  unread: number;
}

export interface UserConnection {
  provider: string;
  connected: boolean;
  riotGameName?: string;
  riotTagLine?: string;
  riotRegion?: string;
  discordUsername?: string;
  metadata?: { activeGame?: 'lol' | 'valorant'; topChampion?: TopChampion; profileIconUrl?: string; summonerLevel?: number };
}

export interface TopChampion {
  id: string;
  name: string;
  masteryLevel: number;
  masteryPoints: number;
  imageUrl: string;
}

export interface FriendProfile {
  id: string;
  username: string;
  avatar: string;
  level: number;
  gender: string | null;
  isFriend: boolean;
  requestStatus: 'none' | 'sent' | 'received' | 'accepted';
  riot: { gameName: string; tagLine: string; region: string; topChampion: TopChampion | null } | null;
  discord: { username: string; userId?: string } | null;
}

export interface FriendRating {
  average: number;
  count: number;
  myRating: number | null;
}

export interface Dashboard {
  game: 'lol' | 'valorant';
  queue: 'solo' | 'flex';
  level: number;
  xp: number;
  xpToNext: number;
  riotConnected: boolean;
  riotAccount: { gameName: string; tagLine: string; region: string } | null;
  stats: {
    ranked: Array<{ queue: string; tier: string; rank: string; leaguePoints: number; wins: number; losses: number; winRate: number }>;
    recent: RecentStats;
  } | null;
  matchHistory: MatchSummary[];
  message: string;
}

export interface ChampionStat {
  champion: string;
  imageUrl?: string | null;
  games: number;
  wins: number;
  winRate: number;
  kda: number;
}

export interface RoleStat {
  role: string;
  games: number;
  share: number;
}

export interface RecentStats {
  games?: number;
  wins: number;
  losses: number;
  winRate: number;
  kda: number;
  cs: number;
  csPerMin?: number;
  avgKills?: number;
  avgDeaths?: number;
  avgAssists?: number;
  killParticipation?: number;
  champions?: ChampionStat[];
  roles?: RoleStat[];
  /** Sólo Valorant */
  avgScore?: number;
  avgDamage?: number;
  headshots?: number;
}

export interface MatchAsset {
  name?: string;
  id?: number;
  imageUrl: string | null;
}

export interface MatchSummary {
  id: string;
  champion: string;
  championId: number;
  championLevel?: number;
  championImageUrl?: string | null;
  win: boolean;
  remake?: boolean;
  kills: number;
  deaths: number;
  assists: number;
  kda: number;
  killParticipation?: number;
  cs: number;
  csPerMin?: number;
  gold?: number;
  visionScore: number;
  doubleKills?: number;
  tripleKills?: number;
  quadraKills?: number;
  pentaKills?: number;
  spells?: MatchAsset[];
  runes?: MatchAsset[];
  items?: Array<MatchAsset | null>;
  trinket?: MatchAsset | null;
  teammates?: Array<{ puuid: string; name: string; champion: string; championImageUrl: string | null; teamId: number }>;
  score?: number;
  roundsPlayed?: number;
  headshots?: number;
  damage?: number;
  rank?: string;
  role: string;
  queue: string;
  durationSeconds: number;
  playedAt: string;
}

export interface FriendDashboard {
  stats: NonNullable<Dashboard['stats']>;
  matchHistory: Dashboard['matchHistory'];
  message: string;
}

export interface LeagueMatchParticipant {
  puuid: string;
  teamId: number;
  riotIdGameName: string;
  riotIdTagLine: string;
  champion: string;
  championImageUrl: string | null;
  position: string;
  kills: number;
  deaths: number;
  assists: number;
  kda: number;
  cs: number;
  gold: number;
  damage: number;
  visionScore: number;
  items: number[];
  win: boolean;
}

export interface LeagueMatchDetail {
  id: string;
  queue: string;
  durationSeconds: number;
  playedAt: string;
  gameVersion: string;
  dataDragonVersion: string;
  teams: Array<{ teamId: number; win: boolean; objectives: Record<string, { first: boolean; kills: number }>; bans: Array<{ championId: number; pickTurn: number }> }>;
  participants: LeagueMatchParticipant[];
}

export interface LeaguePublicPlayer {
  account: { puuid: string; gameName: string; tagLine: string };
  ranked: Dashboard['stats'] extends infer _T ? Array<{ queue: string; tier: string; rank: string; leaguePoints: number; wins: number; losses: number; winRate: number }> : never;
  recent: NonNullable<Dashboard['stats']>['recent'];
  matches: Dashboard['matchHistory'];
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  avatar: string | null;
  gender: 'man' | 'woman' | 'other' | null;
  level: number;
  xp: number;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}
