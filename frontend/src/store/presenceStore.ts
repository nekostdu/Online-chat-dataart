import { create } from 'zustand';
import type { Presence } from '@/api/types';

interface PresenceState {
  byUserId: Record<number, Presence>;
  set: (userId: number, presence: Presence) => void;
  bulk: (map: Record<number, Presence>) => void;
}

export const usePresence = create<PresenceState>((set) => ({
  byUserId: {},
  set: (userId, presence) =>
    set(state => ({ byUserId: { ...state.byUserId, [userId]: presence } })),
  bulk: (map) =>
    set(state => ({ byUserId: { ...state.byUserId, ...map } })),
}));
