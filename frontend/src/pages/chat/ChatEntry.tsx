import { useChats } from '@/store/chatStore';
import { usePresence } from '@/store/presenceStore';
import { PresenceDot } from '@/features/presence/PresenceDot';
import type { Chat } from '@/api/types';

export function ChatEntry({ chat }: { chat: Chat }) {
  const { selectedId, select } = useChats();
  const { byUserId } = usePresence();
  const active = selectedId === chat.id;
  const label =
    chat.type === 'room' ? `#${chat.name ?? '(unnamed)'}`
    : chat.peer?.username ?? 'direct message';
  const presenceOfPeer = chat.type === 'dm' && chat.peer ? byUserId[chat.peer.id] : undefined;

  return (
    <li>
      <button
        className={`w-full text-left px-3 py-1.5 flex items-center justify-between gap-2 ${active ? 'bg-brand-50 text-brand-700' : 'hover:bg-gray-50 text-gray-800'}`}
        onClick={() => select(chat.id)}
      >
        <span className="flex items-center gap-2 min-w-0">
          {chat.type === 'dm' && <PresenceDot presence={presenceOfPeer ?? 'offline'} />}
          <span className="truncate">{label}</span>
        </span>
        {chat.unreadCount > 0 && (
          <span className="text-xs bg-brand-500 text-white rounded-full px-2 py-0.5 shrink-0">
            {chat.unreadCount}
          </span>
        )}
      </button>
    </li>
  );
}
