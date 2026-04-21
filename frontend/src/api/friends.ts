import { api } from './client';
import type { Friend, User } from './types';

export interface PendingRequest {
  requesterId: number;
  addresseeId: number;
  user: User;
  direction: 'incoming' | 'outgoing';
  message: string | null;
  createdAt: string;
}

export const friendsApi = {
  list: () => api.get<Friend[]>('/friends').then(r => r.data),

  pending: () => api.get<PendingRequest[]>('/friends/pending').then(r => r.data),

  send: (payload: { userId?: number; username?: string; message?: string }) =>
    api.post('/friends/requests', payload).then(r => r.data),

  accept: (requesterId: number) =>
    api.post(`/friends/requests/accept/${requesterId}`).then(r => r.data),

  decline: (requesterId: number) =>
    api.post(`/friends/requests/decline/${requesterId}`).then(r => r.data),

  remove: (userId: number) =>
    api.delete(`/friends/${userId}`).then(r => r.data),
};

export interface BlockedEntry {
  user: User;
  since: string;
}

export const blocksApi = {
  list: () => api.get<BlockedEntry[]>('/blocks').then(r => r.data),
  block: (userId: number) => api.post(`/blocks/${userId}`).then(r => r.data),
  unblock: (userId: number) => api.delete(`/blocks/${userId}`).then(r => r.data),
};

export const usersApi = {
  byUsername: (username: string) =>
    api.get<User>(`/users/by-username/${encodeURIComponent(username)}`).then(r => r.data),
};
