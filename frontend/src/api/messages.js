import { api } from './client';
export const messagesApi = {
    page: (chatId, before, limit = 50) => api.get(`/chats/${chatId}/messages`, { params: { before, limit } }).then(r => r.data),
    send: (chatId, p) => api.post(`/chats/${chatId}/messages`, p).then(r => r.data),
    edit: (id, text) => api.patch(`/messages/${id}`, { text }).then(r => r.data),
    delete: (id) => api.delete(`/messages/${id}`).then(r => r.data),
    markRead: (chatId, messageId) => api.post(`/chats/${chatId}/read`, { messageId }).then(r => r.data),
};
export const attachmentsApi = {
    upload: async (file, comment) => {
        const form = new FormData();
        form.append('file', file);
        if (comment)
            form.append('comment', comment);
        const res = await api.post('/attachments', form, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res.data;
    },
    url: (id) => `/api/attachments/${id}`,
};
