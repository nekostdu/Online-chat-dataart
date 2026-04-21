import { beforeEach, describe, expect, it, vi } from 'vitest';
// Stub the auth API module before importing the store.
vi.mock('@/api/auth', () => {
    return {
        authApi: {
            me: vi.fn(),
            login: vi.fn(),
            register: vi.fn(),
            logout: vi.fn(),
        },
    };
});
import { authApi } from '@/api/auth';
import { useAuth } from '@/store/authStore';
const mocked = authApi;
describe('authStore', () => {
    beforeEach(() => {
        useAuth.setState({ user: null, loading: false, initialized: false });
        Object.values(mocked).forEach(m => m.mockReset());
    });
    it('init: sets user and initialized when /me succeeds', async () => {
        mocked.me.mockResolvedValueOnce({ id: 1, username: 'alice', email: 'a@x.io' });
        await useAuth.getState().init();
        const s = useAuth.getState();
        expect(s.user?.username).toBe('alice');
        expect(s.initialized).toBe(true);
    });
    it('init: treats /me failure as anonymous but still initialized', async () => {
        mocked.me.mockRejectedValueOnce(new Error('no cookie'));
        await useAuth.getState().init();
        const s = useAuth.getState();
        expect(s.user).toBeNull();
        expect(s.initialized).toBe(true);
    });
    it('login: populates user on success', async () => {
        mocked.login.mockResolvedValueOnce({ id: 2, username: 'bob', email: 'b@x.io' });
        await useAuth.getState().login('bob', 'pw');
        expect(useAuth.getState().user?.username).toBe('bob');
    });
    it('logout: clears user even if server call fails', async () => {
        useAuth.setState({ user: { id: 1, username: 'alice', email: 'a@x.io' } });
        mocked.logout.mockRejectedValueOnce(new Error('network'));
        await useAuth.getState().logout();
        expect(useAuth.getState().user).toBeNull();
    });
});
