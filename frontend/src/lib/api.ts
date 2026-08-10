import axios from 'axios';
import type {
  AuthResponse,
  AuthUser,
  Dashboard,
  Conversation,
  Game,
  FriendDashboard,
  FriendProfile,
  FriendRating,
  LeagueMatchDetail,
  LeaguePublicPlayer,
  MatchMessage,
  QueueStatus,
  SearchFilters,
  UserConnection,
} from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'desktop' ? 'https://matching-2.vercel.app/api' : '/api'),
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

export async function fetchDashboard(game: 'lol' | 'valorant' = 'lol', queue: 'solo' | 'flex' = 'solo'): Promise<Dashboard> {
  const { data } = await api.get<Dashboard>('/dashboard', { params: { game, queue } });
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

export async function fetchLeagueMatch(matchId: string): Promise<LeagueMatchDetail> {
  const { data } = await api.get<{ match: LeagueMatchDetail }>(`/dashboard/matches/${encodeURIComponent(matchId)}`);
  return data.match;
}

export async function fetchLeaguePlayer(puuid: string, queue: 'solo' | 'flex'): Promise<LeaguePublicPlayer> {
  const { data } = await api.get<{ player: LeaguePublicPlayer }>(`/dashboard/players/${encodeURIComponent(puuid)}`, { params: { queue } });
  return data.player;
}

export async function fetchMatchMessages(matchId: string): Promise<MatchMessage[]> {
  const { data } = await api.get<{ messages: MatchMessage[] }>(`/matches/${matchId}/messages`);
  return data.messages;
}

export async function sendMatchMessage(matchId: string, content: string): Promise<MatchMessage> {
  const { data } = await api.post<{ message: MatchMessage }>(`/matches/${matchId}/messages`, { content });
  return data.message;
}

export async function closeMatchChat(matchId: string): Promise<void> {
  await api.post(`/matches/${matchId}/close`);
}

export async function fetchActiveMatchChats(): Promise<QueueStatus[]> {
  const { data } = await api.get<{ chats: QueueStatus[] }>('/matches/active/chats');
  return data.chats;
}

export async function fetchConversations(): Promise<Conversation[]> {
  const { data } = await api.get<{ conversations: Conversation[] }>('/conversations');
  return data.conversations;
}

export async function fetchDirectMessages(friendId: string): Promise<MatchMessage[]> {
  const { data } = await api.get<{ messages: MatchMessage[] }>(`/conversations/direct/${friendId}/messages`);
  return data.messages;
}

export async function sendDirectMessage(friendId: string, content: string): Promise<MatchMessage> {
  const { data } = await api.post<{ message: MatchMessage }>(`/conversations/direct/${friendId}/messages`, { content });
  return data.message;
}

export async function fetchConnections(): Promise<{ connections: UserConnection[]; capabilities: { discordOauth: boolean; discordVoice: boolean } }> {
  const { data } = await api.get<{ connections: UserConnection[]; capabilities: { discordOauth: boolean; discordVoice: boolean } }>('/connections');
  return data;
}

export async function getDiscordOauthUrl(): Promise<string> {
  const { data } = await api.get<{ url: string }>('/connections/discord/oauth-url');
  return data.url;
}

export async function saveRiotConnection(payload: {
  gameName: string;
  tagLine: string;
  region: string;
  game: 'lol' | 'valorant';
}): Promise<{ connection: UserConnection; user: AuthUser; message: string }> {
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

export async function saveProfile(gender: AuthUser['gender'], avatar?: string | null): Promise<AuthUser> {
  const body: { gender: AuthUser['gender']; avatar?: string | null } = { gender };
  if (avatar !== undefined) body.avatar = avatar;
  const { data } = await api.put<{ user: AuthUser }>('/players/me/profile', body);
  return data.user;
}

export interface AvatarOptions {
  version: string;
  icons: { id: number; url: string }[];
  riot: { url: string; label: string } | null;
}

export async function fetchAvatarOptions(): Promise<AvatarOptions> {
  const { data } = await api.get<AvatarOptions>('/players/avatar-options');
  return data;
}

export async function fetchFriends(): Promise<{ friends: FriendProfile[]; incoming: FriendProfile[]; outgoing: FriendProfile[] }> {
  const { data } = await api.get<{ friends: FriendProfile[]; incoming: FriendProfile[]; outgoing: FriendProfile[] }>('/friends');
  return data;
}

export async function searchPlayers(q: string): Promise<FriendProfile[]> {
  const { data } = await api.get<{ results: FriendProfile[] }>('/friends/search', { params: { q } });
  return data.results;
}

export async function addFriend(userId: string): Promise<FriendProfile> {
  const { data } = await api.post<{ request: FriendProfile }>(`/friends/${userId}`);
  return data.request;
}

export async function acceptFriend(userId: string): Promise<FriendProfile> {
  const { data } = await api.post<{ friend: FriendProfile }>(`/friends/${userId}/accept`);
  return data.friend;
}

export async function removeFriend(userId: string): Promise<void> {
  await api.delete(`/friends/${userId}`);
}

export async function fetchFriendProfile(userId: string): Promise<{ profile: FriendProfile; rating: FriendRating }> {
  const { data } = await api.get<{ profile: FriendProfile; rating: FriendRating }>(`/friends/${userId}`);
  return data;
}

export async function fetchFriendDashboard(userId: string, queue: 'solo' | 'flex'): Promise<FriendDashboard> {
  const { data } = await api.get<{ dashboard: FriendDashboard }>(`/friends/${userId}/dashboard`, { params: { queue } });
  return data.dashboard;
}

export async function rateFriend(userId: string, score: number): Promise<FriendRating> {
  const { data } = await api.put<{ rating: FriendRating }>(`/friends/${userId}/rating`, { score });
  return data.rating;
}
