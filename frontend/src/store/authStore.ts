import { create } from 'zustand';
import { authApi } from '@/api/auth';
import type { User } from '@/api/types';

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  init: () => Promise<void>;
  login: (id: string, pw: string) => Promise<void>;
  register: (email: string, username: string, pw: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: false,
  initialized: false,

  init: async () => {
    try {
      const user = await authApi.me();
      set({ user, initialized: true });
    } catch {
      set({ user: null, initialized: true });
    }
  },

  login: async (id, pw) => {
    set({ loading: true });
    try {
      const user = await authApi.login(id, pw);
      set({ user });
    } finally {
      set({ loading: false });
    }
  },

  register: async (email, username, pw) => {
    set({ loading: true });
    try {
      const user = await authApi.register(email, username, pw);
      set({ user });
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    set({ user: null });
  },

  refresh: async () => {
    try {
      const user = await authApi.me();
      set({ user });
    } catch {
      set({ user: null });
    }
  },
}));
