import { useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { roomsApi } from '@/api/rooms';
import { errorMessage } from '@/api/client';
import type { Chat, ChatMember } from '@/api/types';

export function AdminsTab({ chat, isOwner }: { chat: Chat; isOwner: boolean }) {
  const [list, setList] = useState<ChatMember[]>([]);
  useEffect(() => { roomsApi.members(chat.id).then(setList).catch(() => {}); }, [chat.id]);
  const admins = list.filter(m => m.role === 'owner' || m.role === 'admin');

  async function demote(userId: number) {
    try {
      await roomsApi.removeAdmin(chat.id, userId);
      setList(await roomsApi.members(chat.id));
    } catch (e) { alert(errorMessage(e)); }
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-gray-500 border-b border-gray-100">
          <th className="py-2">Username</th><th>Role</th><th></th>
        </tr>
      </thead>
      <tbody>
        {admins.map(m => (
          <tr key={m.userId} className="border-b border-gray-50">
            <td className="py-2">{m.username}</td>
            <td>{m.role}</td>
            <td className="text-right">
              {isOwner && m.role === 'admin' && (
                <Button variant="secondary" onClick={() => demote(m.userId)}>Remove admin</Button>
              )}
              {m.role === 'owner' && <span className="text-xs text-gray-400">cannot lose admin rights</span>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
