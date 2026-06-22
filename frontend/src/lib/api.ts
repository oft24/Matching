import axios from 'axios';
import type { AuthResponse, AuthUser, Dashboard, Game, Player, SearchFilters } from '../types';

const api = axios.create({ baseURL: '/api' });

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

export async function searchPlayers(filters: SearchFilters): Promise<Player[]> {
  const { data } = await api.post<Player[]>('/matchmaking/search', filters);
  return data;
}

export async function fetchDashboard(): Promise<Dashboard> {
  const { data } = await api.get<Dashboard>('/dashboard');
  return data;
}
