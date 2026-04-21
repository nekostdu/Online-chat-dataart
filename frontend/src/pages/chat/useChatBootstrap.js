import { useEffect } from 'react';
import { useChats } from '@/store/chatStore';
import { usePresence } from '@/store/presenceStore';
import { ws } from '@/ws/client';
import { presenceApi } from '@/api/presence';
import { invitationsApi } from '@/api/rooms';
import { blocksApi, friendsApi } from '@/api/friends';
/** Connects WS, loads initial chats / friends / blocks / invitations / presence seed. */
export function useChatBootstrap(user, s) {
    const chatStore = useChats();
    const presence = usePresence();
    useEffect(() => {
        if (!user)
            return;
        ws.connect();
        chatStore.loadChats();
        friendsApi.list().then(s.setFriends).catch(() => { });
        blocksApi.list().then(list => s.setBlocks(list.map(b => b.user.id))).catch(() => { });
        invitationsApi.mine().then(s.setInvitations).catch(() => { });
        presenceApi.friends().then(m => presence.bulk(Object.fromEntries(Object.entries(m).map(([k, v]) => [Number(k), v])))).catch(() => { });
        // Self is online as soon as the page is open — AFK will kick in after idle.
        presence.set(user.id, 'online');
        return () => { ws.disconnect(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]);
}
/** Subscribes to personal queue + own presence + open-room topic. */
export function useChatSubscriptions(user, selectedId, selectedIsRoom, handleEvent) {
    const presence = usePresence();
    useEffect(() => {
        if (!user)
            return;
        const unsubInbox = ws.subscribe('/user/queue/messages', handleEvent);
        const unsubSelf = ws.subscribe(`/topic/presence/${user.id}`, (evt) => {
            if (evt?.presence)
                presence.set(user.id, evt.presence);
        });
        return () => { unsubInbox(); unsubSelf(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]);
    useEffect(() => {
        if (!selectedId || !selectedIsRoom)
            return;
        const unsub = ws.subscribe(`/topic/chat/${selectedId}`, handleEvent);
        return () => unsub();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedId, selectedIsRoom]);
}
