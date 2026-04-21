import { api } from './client';
import type { Chat, ChatMember, Invitation, RoomBan, RoomVisibility } from './types';

export interface RoomSummary {
  id: number;
  name: string;
  description: string | null;
  visibility: RoomVisibility;
  ownerId: number | null;
  memberCount: number;
}

export const roomsApi = {
  listPublic: (q = '', limit = 50) =>
    api.get<RoomSummary[]>('/rooms/public', { params: { q, limit } }).then(r => r.data),

  get: (id: number) => api.get<RoomSummary>(`/rooms/${id}`).then(r => r.data),

  create: (name: string, description: string, visibility: RoomVisibility) =>
    api.post<RoomSummary>('/rooms', { name, description, visibility }).then(r => r.data),

  update: (id: number, patch: { name?: string; description?: string; visibility?: RoomVisibility }) =>
    api.patch<RoomSummary>(`/rooms/${id}`, patch).then(r => r.data),

  delete: (id: number) => api.delete(`/rooms/${id}`).then(r => r.data),

  join: (id: number) => api.post(`/rooms/${id}/join`).then(r => r.data),

  leave: (id: number) => api.post(`/rooms/${id}/leave`).then(r => r.data),

  members: (id: number, page = 0, size = 100) =>
    api.get<ChatMember[]>(`/rooms/${id}/members`, { params: { page, size } }).then(r => r.data),

  bans: (id: number) => api.get<RoomBan[]>(`/rooms/${id}/bans`).then(r => r.data),

  kick: (id: number, userId: number) =>
    api.delete(`/rooms/${id}/members/${userId}`).then(r => r.data),

  makeAdmin: (id: number, userId: number) =>
    api.post(`/rooms/${id}/members/${userId}/admin`).then(r => r.data),

  removeAdmin: (id: number, userId: number) =>
    api.delete(`/rooms/${id}/members/${userId}/admin`).then(r => r.data),

  unban: (id: number, userId: number) =>
    api.delete(`/rooms/${id}/bans/${userId}`).then(r => r.data),

  invite: (id: number, target: { userId?: number; username?: string }) =>
    api.post(`/rooms/${id}/invitations`, target).then(r => r.data),
};

export const chatsApi = {
  mine: () => api.get<Chat[]>('/chats').then(r => r.data),

  openDm: (userId: number) =>
    api.post<Chat>('/dms', { userId }).then(r => r.data),
};

export const invitationsApi = {
  mine: () => api.get<Invitation[]>('/invitations/me').then(r => r.data),

  accept: (id: number) =>
    api.post<{ ok: boolean; chatId: number }>(`/invitations/${id}/accept`).then(r => r.data),

  decline: (id: number) =>
    api.post(`/invitations/${id}/decline`).then(r => r.data),
};
