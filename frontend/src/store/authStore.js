import { create } from 'zustand';
import { authApi } from '@/api/auth';
export const useAuth = create((set) => ({
    user: null,
    loading: false,
    initialized: false,
    init: async () => {
        try {
            const user = await authApi.me();
            set({ user, initialized: true });
        }
        catch {
            set({ user: null, initialized: true });
        }
    },
    login: async (id, pw) => {
        set({ loading: true });
        try {
            const user = await authApi.login(id, pw);
            set({ user });
        }
        finally {
            set({ loading: false });
        }
    },
    register: async (email, username, pw) => {
        set({ loading: true });
        try {
            const user = await authApi.register(email, username, pw);
            set({ user });
        }
        finally {
            set({ loading: false });
        }
    },
    logout: async () => {
        try {
            await authApi.logout();
        }
        catch { /* ignore */ }
        set({ user: null });
    },
    refresh: async () => {
        try {
            const user = await authApi.me();
            set({ user });
        }
        catch {
            set({ user: null });
        }
    },
}));
