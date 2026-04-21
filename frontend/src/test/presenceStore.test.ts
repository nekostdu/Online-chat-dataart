import { beforeEach, describe, expect, it } from 'vitest';
import { usePresence } from '@/store/presenceStore';

describe('presenceStore', () => {
  beforeEach(() => {
    usePresence.setState({ byUserId: {} });
  });

  it('set updates one user', () => {
    usePresence.getState().set(1, 'online');
    expect(usePresence.getState().byUserId[1]).toBe('online');
  });

  it('bulk merges without wiping existing', () => {
    usePresence.getState().set(1, 'online');
    usePresence.getState().bulk({ 2: 'afk', 3: 'offline' });
    expect(usePresence.getState().byUserId).toEqual({
      1: 'online', 2: 'afk', 3: 'offline',
    });
  });

  it('later set overrides earlier value', () => {
    usePresence.getState().set(7, 'online');
    usePresence.getState().set(7, 'offline');
    expect(usePresence.getState().byUserId[7]).toBe('offline');
  });
});
