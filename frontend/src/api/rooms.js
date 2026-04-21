import { api } from './client';
export const roomsApi = {
    listPublic: (q = '', limit = 50) => api.get('/rooms/public', { params: { q, limit } }).then(r => r.data),
    get: (id) => api.get(`/rooms/${id}`).then(r => r.data),
    create: (name, description, visibility) => api.post('/rooms', { name, description, visibility }).then(r => r.data),
    update: (id, patch) => api.patch(`/rooms/${id}`, patch).then(r => r.data),
    delete: (id) => api.delete(`/rooms/${id}`).then(r => r.data),
    join: (id) => api.post(`/rooms/${id}/join`).then(r => r.data),
    leave: (id) => api.post(`/rooms/${id}/leave`).then(r => r.data),
    members: (id, page = 0, size = 100) => api.get(`/rooms/${id}/members`, { params: { page, size } }).then(r => r.data),
    bans: (id) => api.get(`/rooms/${id}/bans`).then(r => r.data),
    kick: (id, userId) => api.delete(`/rooms/${id}/members/${userId}`).then(r => r.data),
    makeAdmin: (id, userId) => api.post(`/rooms/${id}/members/${userId}/admin`).then(r => r.data),
    removeAdmin: (id, userId) => api.delete(`/rooms/${id}/members/${userId}/admin`).then(r => r.data),
    unban: (id, userId) => api.delete(`/rooms/${id}/bans/${userId}`).then(r => r.data),
    invite: (id, target) => api.post(`/rooms/${id}/invitations`, target).then(r => r.data),
};
export const chatsApi = {
    mine: () => api.get('/chats').then(r => r.data),
    openDm: (userId) => api.post('/dms', { userId }).then(r => r.data),
};
export const invitationsApi = {
    mine: () => api.get('/invitations/me').then(r => r.data),
    accept: (id) => api.post(`/invitations/${id}/accept`).then(r => r.data),
    decline: (id) => api.post(`/invitations/${id}/decline`).then(r => r.data),
};
