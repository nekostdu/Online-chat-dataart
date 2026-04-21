import { create } from 'zustand';
export const usePresence = create((set) => ({
    byUserId: {},
    set: (userId, presence) => set(state => ({ byUserId: { ...state.byUserId, [userId]: presence } })),
    bulk: (map) => set(state => ({ byUserId: { ...state.byUserId, ...map } })),
}));
