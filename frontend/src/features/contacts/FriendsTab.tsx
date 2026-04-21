import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { Button, ErrorText } from '@/components/ui';
import { blocksApi, friendsApi } from '@/api/friends';
import { chatsApi } from '@/api/rooms';
import { errorMessage } from '@/api/client';
import type { Friend } from '@/api/types';
import { useChats } from '@/store/chatStore';
import { PresenceDot } from '@/features/presence/PresenceDot';
import { usePresence } from '@/store/presenceStore';

export function FriendsTab({ onClose }: { onClose: () => void }) {
  const [list, setList] = useState<Friend[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const { byUserId } = usePresence();
  const { loadChats, select } = useChats();

  useEffect(() => { reload(); }, []);
  async function reload() {
    try { setList(await friendsApi.list()); }
    catch (e) { setErr(errorMessage(e)); }
  }

  async function openDm(userId: number) {
    try {
      const chat = await chatsApi.openDm(userId);
      await loadChats();
      select(chat.id);
      onClose();
    } catch (e) { alert(errorMessage(e)); }
  }

  async function removeFriend(userId: number) {
    if (!confirm('Remove from friends?')) return;
    try { await friendsApi.remove(userId); reload(); }
    catch (e) { alert(errorMessage(e)); }
  }

  async function block(userId: number) {
    if (!confirm('Block this user? You will not be able to exchange messages with them.')) return;
    try { await blocksApi.block(userId); reload(); }
    catch (e) { alert(errorMessage(e)); }
  }

  return (
    <div>
      <ErrorText>{err}</ErrorText>
      {list.length === 0 && <div className="text-sm text-gray-500">You have no friends yet.</div>}
      <ul className="divide-y divide-gray-100">
        {list.map(f => (
          <li key={f.user.id} className="py-2 flex items-center gap-3">
            <PresenceDot presence={byUserId[f.user.id] ?? 'offline'} />
            <div className="flex-1 min-w-0">
              <div className="font-medium">{f.user.username}</div>
              <div className="text-xs text-gray-500">friends since {dayjs(f.since).format('YYYY-MM-DD')}</div>
            </div>
            <Button variant="secondary" onClick={() => openDm(f.user.id)}>Message</Button>
            <Button variant="ghost" onClick={() => removeFriend(f.user.id)}>Remove</Button>
            <Button variant="ghost" onClick={() => block(f.user.id)}>Block</Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
