import { api } from './client';
import type { Attachment, Message } from './types';

export interface SendPayload {
  text?: string;
  replyToId?: number;
  attachmentIds?: number[];
}

export const messagesApi = {
  page: (chatId: number, before?: number, limit = 50) =>
    api.get<Message[]>(`/chats/${chatId}/messages`, { params: { before, limit } }).then(r => r.data),

  send: (chatId: number, p: SendPayload) =>
    api.post<Message>(`/chats/${chatId}/messages`, p).then(r => r.data),

  edit: (id: number, text: string) =>
    api.patch<Message>(`/messages/${id}`, { text }).then(r => r.data),

  delete: (id: number) =>
    api.delete<Message>(`/messages/${id}`).then(r => r.data),

  markRead: (chatId: number, messageId?: number) =>
    api.post(`/chats/${chatId}/read`, { messageId }).then(r => r.data),
};

export interface UploadedAttachment {
  id: number;
  originalName: string;
  mimeType: string | null;
  sizeBytes: number;
  isImage: boolean;
}

export const attachmentsApi = {
  upload: async (file: File, comment?: string): Promise<UploadedAttachment> => {
    const form = new FormData();
    form.append('file', file);
    if (comment) form.append('comment', comment);
    const res = await api.post<UploadedAttachment>('/attachments', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  url: (id: number) => `/api/attachments/${id}`,
};

export type { Attachment };
