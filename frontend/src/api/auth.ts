import { api } from './client';
import type { Session, User } from './types';

export const authApi = {
  me: () => api.get<User>('/auth/me').then(r => r.data),

  register: (email: string, username: string, password: string) =>
    api.post<User>('/auth/register', { email, username, password }).then(r => r.data),

  login: (emailOrUsername: string, password: string) =>
    api.post<User>('/auth/login', { emailOrUsername, password }).then(r => r.data),

  logout: () => api.post('/auth/logout').then(r => r.data),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/password-change', { currentPassword, newPassword }).then(r => r.data),

  requestReset: (email: string) =>
    api.post('/auth/password-reset-request', { email }).then(r => r.data),

  confirmReset: (token: string, newPassword: string) =>
    api.post('/auth/password-reset-confirm', { token, newPassword }).then(r => r.data),

  deleteAccount: () => api.delete('/users/me').then(r => r.data),

  sessions: () => api.get<Session[]>('/sessions').then(r => r.data),

  revokeSession: (id: number) => api.delete(`/sessions/${id}`).then(r => r.data),
};
