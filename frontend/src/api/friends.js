import { api } from './client';
export const friendsApi = {
    list: () => api.get('/friends').then(r => r.data),
    pending: () => api.get('/friends/pending').then(r => r.data),
    send: (payload) => api.post('/friends/requests', payload).then(r => r.data),
    accept: (requesterId) => api.post(`/friends/requests/accept/${requesterId}`).then(r => r.data),
    decline: (requesterId) => api.post(`/friends/requests/decline/${requesterId}`).then(r => r.data),
    remove: (userId) => api.delete(`/friends/${userId}`).then(r => r.data),
};
export const blocksApi = {
    list: () => api.get('/blocks').then(r => r.data),
    block: (userId) => api.post(`/blocks/${userId}`).then(r => r.data),
    unblock: (userId) => api.delete(`/blocks/${userId}`).then(r => r.data),
};
export const usersApi = {
    byUsername: (username) => api.get(`/users/by-username/${encodeURIComponent(username)}`).then(r => r.data),
};
