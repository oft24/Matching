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
  availability: string;
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

export interface UserConnection {
  provider: string;
  connected: boolean;
  riotGameName?: string;
  riotTagLine?: string;
  riotRegion?: string;
  discordUsername?: string;
}

export interface Dashboard {
  level: number;
  xp: number;
  xpToNext: number;
  riotConnected: boolean;
  riotAccount: { gameName: string; tagLine: string; region: string } | null;
  stats: null;
  matchHistory: [];
  message: string;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  avatar: string | null;
  level: number;
  xp: number;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}
