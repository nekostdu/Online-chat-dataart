import { api } from './client';
import type { Presence } from './types';

export const presenceApi = {
  friends: () => api.get<Record<number, Presence>>('/presence/friends').then(r => r.data),

  forUsers: (ids: number[]) =>
    api.get<Record<number, Presence>>('/presence', { params: { ids: ids.join(',') } })
      .then(r => r.data),
};
