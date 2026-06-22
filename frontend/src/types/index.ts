export interface Game {
  id: string;
  name: string;
  color: string;
  short: string;
}

export interface Player {
  id: string;
  username: string;
  avatar: string;
  rank: string;
  roles: string[];
  languages: string[];
  region: string;
  game: string;
  playstyle: string;
  objectives: string;
  activityLevel: string;
  hasMic: boolean;
  verified: boolean;
  reputation: number;
  badges: string[];
  lastSeen: string;
  online: boolean;
  age: number;
  availability: string;
  compatibility?: number;
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

export interface Dashboard {
  level: number;
  xp: number;
  xpToNext: number;
  friendsOnline: number;
  pendingInvites: number;
  matchHistory: { id: string; game: string; result: string; teammates: number; date: string }[];
  stats: {
    totalMatches: number;
    successfulMatches: number;
    avgCompatibility: number;
    teammatesFound: number;
  };
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
