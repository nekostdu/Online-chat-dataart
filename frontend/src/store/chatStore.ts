import { create } from 'zustand';
import { chatsApi } from '@/api/rooms';
import type { Chat, Message } from '@/api/types';
import { messagesApi } from '@/api/messages';

interface ChatState {
  chats: Chat[];
  selectedId: number | null;
  messagesByChat: Record<number, Message[]>;
  hasMoreByChat: Record<number, boolean>;
  loadingByChat: Record<number, boolean>;

  loadChats: () => Promise<void>;
  select: (chatId: number | null) => void;
  ensureHistory: (chatId: number) => Promise<void>;
  loadMore: (chatId: number) => Promise<void>;
  applyIncoming: (msg: Message) => void;
  applyUpdated: (msg: Message) => void;
  applyRead: (chatId: number, userId: number, lastReadMessageId: number | null) => void;
  mergeChat: (chat: Chat) => void;
  removeChat: (chatId: number) => void;
}

export const useChats = create<ChatState>((set, get) => ({
  chats: [],
  selectedId: null,
  messagesByChat: {},
  hasMoreByChat: {},
  loadingByChat: {},

  loadChats: async () => {
    const chats = await chatsApi.mine();
    set({ chats });
  },

  select: (chatId) => {
    set({ selectedId: chatId });
    if (chatId != null) {
      get().ensureHistory(chatId);
      // Clear unread counter locally; backend read-receipt is sent by the page when messages render.
      set(state => ({
        chats: state.chats.map(c => c.id === chatId ? { ...c, unreadCount: 0 } : c),
      }));
    }
  },

  ensureHistory: async (chatId) => {
    if (get().messagesByChat[chatId]) return;
    set(s => ({ loadingByChat: { ...s.loadingByChat, [chatId]: true } }));
    try {
      const msgs = await messagesApi.page(chatId, undefined, 50);
      set(s => ({
        messagesByChat: { ...s.messagesByChat, [chatId]: msgs },
        hasMoreByChat:  { ...s.hasMoreByChat,  [chatId]: msgs.length === 50 },
        loadingByChat:  { ...s.loadingByChat,  [chatId]: false },
      }));
    } catch (e) {
      set(s => ({ loadingByChat: { ...s.loadingByChat, [chatId]: false } }));
      throw e;
    }
  },

  loadMore: async (chatId) => {
    const current = get().messagesByChat[chatId] ?? [];
    if (current.length === 0) return;
    const before = current[0].id;
    set(s => ({ loadingByChat: { ...s.loadingByChat, [chatId]: true } }));
    try {
      const older = await messagesApi.page(chatId, before, 50);
      set(s => ({
        messagesByChat: { ...s.messagesByChat, [chatId]: [...older, ...current] },
        hasMoreByChat:  { ...s.hasMoreByChat,  [chatId]: older.length === 50 },
        loadingByChat:  { ...s.loadingByChat,  [chatId]: false },
      }));
    } catch (e) {
      set(s => ({ loadingByChat: { ...s.loadingByChat, [chatId]: false } }));
      throw e;
    }
  },

  applyIncoming: (msg) => {
    set(state => {
      const list = state.messagesByChat[msg.chatId] ?? [];
      const exists = list.some(m => m.id === msg.id);
      const nextList = exists ? list.map(m => m.id === msg.id ? msg : m) : [...list, msg];
      const isOpen = state.selectedId === msg.chatId;
      return {
        messagesByChat: { ...state.messagesByChat, [msg.chatId]: nextList },
        chats: state.chats.map(c =>
          c.id === msg.chatId
            ? { ...c,
                lastMessageAt: msg.createdAt,
                unreadCount: isOpen ? 0 : (c.unreadCount ?? 0) + 1 }
            : c),
      };
    });
  },

  applyUpdated: (msg) => {
    set(state => {
      const list = state.messagesByChat[msg.chatId] ?? [];
      return {
        messagesByChat: {
          ...state.messagesByChat,
          [msg.chatId]: list.map(m => m.id === msg.id ? msg : m),
        },
      };
    });
  },

  applyRead: (_chatId, _userId, _lastReadMessageId) => {
    // Reserved for later read-receipt indicators; no-op for now.
  },

  mergeChat: (chat) => {
    set(state => {
      const without = state.chats.filter(c => c.id !== chat.id);
      return { chats: [...without, chat] };
    });
  },

  removeChat: (chatId) => {
    set(state => ({
      chats: state.chats.filter(c => c.id !== chatId),
      selectedId: state.selectedId === chatId ? null : state.selectedId,
    }));
  },
}));
