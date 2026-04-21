import { useEffect, useMemo } from 'react';
import { useChats } from '@/store/chatStore';
import { usePresence } from '@/store/presenceStore';
import { ws } from '@/ws/client';
import { presenceApi } from '@/api/presence';
import type { ChatMember, Friend, Presence, User } from '@/api/types';

/** Keeps presence subscriptions + seed values in sync with the visible user set. */
export function useChatPresence(user: User | null, friends: Friend[], members: ChatMember[]) {
  const presence = usePresence();
  const chats = useChats(s => s.chats);

  // Collect every user whose presence we want to track: friends, current room members, DM peers.
  const ids = useMemo(() => {
    const set = new Set<number>();
    for (const f of friends) set.add(f.user.id);
    for (const m of members) set.add(m.userId);
    for (const c of chats) if (c.peer) set.add(c.peer.id);
    if (user) set.delete(user.id); // self is handled separately
    return Array.from(set);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [friends, members, chats, user?.id]);

  useEffect(() => {
    if (ids.length === 0) return;
    presenceApi.forUsers(ids).then(map => {
      presence.bulk(Object.fromEntries(Object.entries(map).map(([k, v]) => [Number(k), v])));
    }).catch(() => {});
    const unsubs = ids.map(id =>
      ws.subscribe(`/topic/presence/${id}`, (evt: any) => {
        if (evt?.presence) presence.set(id, evt.presence as Presence);
      })
    );
    return () => unsubs.forEach(fn => fn());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(',')]);
}

/** DOM activity → throttled /app/activity ping (req 2.2.2). */
export function useActivityReporting(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const onActivity = () => ws.reportActivity();
    const events: (keyof WindowEventMap)[] = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    for (const ev of events) window.addEventListener(ev, onActivity, { passive: true });
    const onVisibility = () => { if (!document.hidden) ws.reportActivity(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      for (const ev of events) window.removeEventListener(ev, onActivity);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [enabled]);
}
