import { usePresence } from '@/store/presenceStore';
import { PresenceDot } from '@/features/presence/PresenceDot';
import { friendsApi } from '@/api/friends';
import { errorMessage } from '@/api/client';
import type { Chat, ChatMember } from '@/api/types';

interface Props {
  chat: Chat;
  members: ChatMember[];
  friendIds: Set<number>;
  myId: number | undefined;
}

export function RoomRightPanel({ chat, members, friendIds, myId }: Props) {
  const { byUserId } = usePresence();
  const admins = members.filter(m => m.role === 'owner' || m.role === 'admin');
  const regular = members.filter(m => m.role === 'member');

  async function addFriend(username: string) {
    try {
      await friendsApi.send({ username });
      alert(`Friend request sent to ${username}.`);
    } catch (e) {
      alert(errorMessage(e));
    }
  }

  function renderMember(m: ChatMember, withRole: boolean) {
    const canFriend = myId !== undefined && m.userId !== myId && !friendIds.has(m.userId);
    return (
      <li key={m.userId} className="flex items-center gap-2 text-sm py-0.5">
        <PresenceDot presence={byUserId[m.userId] ?? 'offline'} />
        <span className="flex-1 truncate">{m.username}</span>
        {withRole && <span className="text-xs text-gray-400">{m.role}</span>}
        {canFriend && (
          <button
            className="text-xs text-brand-600 hover:underline"
            title="Send friend request"
            onClick={() => addFriend(m.username)}
          >+friend</button>
        )}
      </li>
    );
  }

  return (
    <div className="p-3">
      <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Room</div>
      <div className="text-sm font-semibold">{chat.name}</div>
      <div className="text-xs text-gray-500 mb-3">
        {chat.visibility === 'public' ? 'Public room' : 'Private room'} · {members.length} members
      </div>

      <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Admins</div>
      <ul className="mb-3">{admins.map(m => renderMember(m, true))}</ul>
      <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Members</div>
      <ul>{regular.map(m => renderMember(m, false))}</ul>
    </div>
  );
}
