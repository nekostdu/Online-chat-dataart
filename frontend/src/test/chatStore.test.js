import { beforeEach, describe, expect, it } from 'vitest';
import { useChats } from '@/store/chatStore';
function chat(partial) {
    return {
        id: 1, type: 'room', name: 'general', description: '',
        visibility: 'public', ownerId: 1, memberCount: 1,
        unreadCount: 0, lastMessageAt: null,
        ...partial,
    };
}
function msg(partial) {
    return {
        id: 100, chatId: 1, authorId: 1, authorUsername: 'alice',
        text: 'hi', replyToId: null, createdAt: '2026-04-20T10:00:00Z',
        editedAt: null, deletedAt: null, attachments: [],
        ...partial,
    };
}
describe('chatStore', () => {
    beforeEach(() => {
        useChats.setState({
            chats: [], selectedId: null,
            messagesByChat: {}, hasMoreByChat: {}, loadingByChat: {},
        });
    });
    it('applyIncoming appends message and bumps unread when chat is not selected', () => {
        useChats.setState({ chats: [chat({ id: 1, unreadCount: 0 })], selectedId: null });
        useChats.getState().applyIncoming(msg({ id: 200, chatId: 1 }));
        expect(useChats.getState().messagesByChat[1]).toHaveLength(1);
        expect(useChats.getState().chats[0].unreadCount).toBe(1);
        expect(useChats.getState().chats[0].lastMessageAt).not.toBeNull();
    });
    it('applyIncoming keeps unread at 0 when the chat is currently selected', () => {
        useChats.setState({ chats: [chat({ id: 1, unreadCount: 3 })], selectedId: 1 });
        useChats.getState().applyIncoming(msg({ id: 201, chatId: 1 }));
        expect(useChats.getState().chats[0].unreadCount).toBe(0);
    });
    it('applyIncoming de-duplicates on message.id', () => {
        useChats.setState({
            chats: [chat({})],
            messagesByChat: { 1: [msg({ id: 300, text: 'old' })] },
        });
        useChats.getState().applyIncoming(msg({ id: 300, text: 'new', chatId: 1 }));
        const list = useChats.getState().messagesByChat[1];
        expect(list).toHaveLength(1);
        expect(list[0].text).toBe('new');
    });
    it('applyUpdated replaces the message in-place', () => {
        useChats.setState({ messagesByChat: { 1: [msg({ id: 400, text: 'before' })] } });
        useChats.getState().applyUpdated(msg({ id: 400, text: 'after' }));
        expect(useChats.getState().messagesByChat[1][0].text).toBe('after');
    });
    it('removeChat drops from the list and resets selection if needed', () => {
        useChats.setState({
            chats: [chat({ id: 1 }), chat({ id: 2, name: 'other' })],
            selectedId: 2,
        });
        useChats.getState().removeChat(2);
        expect(useChats.getState().chats.map(c => c.id)).toEqual([1]);
        expect(useChats.getState().selectedId).toBeNull();
    });
    it('select clears the unread counter for that chat', () => {
        useChats.setState({
            chats: [chat({ id: 1, unreadCount: 5 })],
            messagesByChat: { 1: [msg({})] },
        });
        useChats.getState().select(1);
        expect(useChats.getState().selectedId).toBe(1);
        expect(useChats.getState().chats[0].unreadCount).toBe(0);
    });
});
