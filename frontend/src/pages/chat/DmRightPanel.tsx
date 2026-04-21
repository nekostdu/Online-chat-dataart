import { usePresence } from '@/store/presenceStore';
import { PresenceDot } from '@/features/presence/PresenceDot';
import type { Chat } from '@/api/types';

export function DmRightPanel({ chat }: { chat: Chat }) {
  const { byUserId } = usePresence();
  if (!chat.peer) return null;
  const p = byUserId[chat.peer.id] ?? 'offline';
  return (
    <div className="p-3">
      <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Direct message</div>
      <div className="flex items-center gap-2 text-sm font-semibold">
        <PresenceDot presence={p} /> {chat.peer.username}
      </div>
      <div className="text-xs text-gray-500 mt-1">Presence: {p}</div>
    </div>
  );
}
