import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { Button, ErrorText } from '@/components/ui';
import { roomsApi } from '@/api/rooms';
import { errorMessage } from '@/api/client';
import type { Chat, RoomBan } from '@/api/types';

export function BannedTab({ chat }: { chat: Chat }) {
  const [list, setList] = useState<RoomBan[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { reload(); }, [chat.id]);
  async function reload() {
    try { setList(await roomsApi.bans(chat.id)); }
    catch (e) { setErr(errorMessage(e)); }
  }
  async function unban(userId: number) {
    try { await roomsApi.unban(chat.id, userId); reload(); }
    catch (e) { alert(errorMessage(e)); }
  }

  return (
    <div>
      <ErrorText>{err}</ErrorText>
      {list.length === 0 && <div className="text-sm text-gray-500">No banned users.</div>}
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b border-gray-100">
            <th className="py-2">Username</th><th>Banned by</th><th>Date</th><th></th>
          </tr>
        </thead>
        <tbody>
          {list.map(b => (
            <tr key={b.userId} className="border-b border-gray-50">
              <td className="py-2">{b.username}</td>
              <td>{b.bannedByUsername ?? '—'}</td>
              <td>{dayjs(b.bannedAt).format('YYYY-MM-DD HH:mm')}</td>
              <td className="text-right">
                <Button variant="secondary" onClick={() => unban(b.userId)}>Unban</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
