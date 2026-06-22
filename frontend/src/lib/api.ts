import axios from 'axios';
import type {
  AuthResponse,
  AuthUser,
  Dashboard,
  Game,
  QueueStatus,
  SearchFilters,
  UserConnection,
} from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
});

export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
  return data;
}

export async function register(username: string, email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/register', { username, email, password });
  return data;
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

export async function getMe(): Promise<AuthUser> {
  const { data } = await api.get<{ user: AuthUser }>('/auth/me');
  return data.user;
}

export async function fetchGames(): Promise<Game[]> {
  const { data } = await api.get<Game[]>('/matchmaking/games');
  return data;
}

export async function fetchDashboard(): Promise<Dashboard> {
  const { data } = await api.get<Dashboard>('/dashboard');
  return data;
}

export async function joinQueue(game: string, filters: SearchFilters): Promise<QueueStatus> {
  const { data } = await api.post<QueueStatus>('/queue/join', { game, filters });
  return data;
}

export async function leaveQueue(): Promise<void> {
  await api.delete('/queue/leave');
}

export async function getQueueStatus(): Promise<QueueStatus> {
  const { data } = await api.get<QueueStatus>('/queue/status');
  return data;
}

export async function acceptMatch(matchId: string): Promise<QueueStatus> {
  const { data } = await api.post<QueueStatus>(`/queue/matches/${matchId}/accept`);
  return data;
}

export async function rejectMatch(matchId: string): Promise<QueueStatus> {
  const { data } = await api.post<QueueStatus>(`/queue/matches/${matchId}/reject`);
  return data;
}

export async function fetchConnections(): Promise<{ connections: UserConnection[] }> {
  const { data } = await api.get<{ connections: UserConnection[] }>('/connections');
  return data;
}

export async function saveRiotConnection(payload: {
  gameName: string;
  tagLine: string;
  region: string;
  apiKey?: string;
}): Promise<{ connection: UserConnection; message: string }> {
  const { data } = await api.put('/connections/riot', payload);
  return data;
}

export async function saveDiscordConnection(payload: {
  username: string;
  userId?: string;
}): Promise<{ connection: UserConnection; message: string }> {
  const { data } = await api.put('/connections/discord', payload);
  return data;
}

export async function disconnectProvider(provider: string): Promise<void> {
  await api.delete(`/connections/${provider}`);
}
