import { api } from './client';
export const authApi = {
    me: () => api.get('/auth/me').then(r => r.data),
    register: (email, username, password) => api.post('/auth/register', { email, username, password }).then(r => r.data),
    login: (emailOrUsername, password) => api.post('/auth/login', { emailOrUsername, password }).then(r => r.data),
    logout: () => api.post('/auth/logout').then(r => r.data),
    changePassword: (currentPassword, newPassword) => api.post('/auth/password-change', { currentPassword, newPassword }).then(r => r.data),
    requestReset: (email) => api.post('/auth/password-reset-request', { email }).then(r => r.data),
    confirmReset: (token, newPassword) => api.post('/auth/password-reset-confirm', { token, newPassword }).then(r => r.data),
    deleteAccount: () => api.delete('/users/me').then(r => r.data),
    sessions: () => api.get('/sessions').then(r => r.data),
    revokeSession: (id) => api.delete(`/sessions/${id}`).then(r => r.data),
};
