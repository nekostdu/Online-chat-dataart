import { api } from './client';
export const presenceApi = {
    friends: () => api.get('/presence/friends').then(r => r.data),
    forUsers: (ids) => api.get('/presence', { params: { ids: ids.join(',') } })
        .then(r => r.data),
};
