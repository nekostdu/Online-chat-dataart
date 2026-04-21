import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { Button, ErrorText } from '@/components/ui';
import { roomsApi } from '@/api/rooms';
import { errorMessage } from '@/api/client';
import { useAuth } from '@/store/authStore';
import type { Chat, ChatMember } from '@/api/types';

export function MembersTab({ chat, isOwner }: { chat: Chat; isOwner: boolean }) {
  const [list, setList] = useState<ChatMember[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => { reload(); }, [chat.id]);
  async function reload() {
    try { setList(await roomsApi.members(chat.id)); }
    catch (e) { setErr(errorMessage(e)); }
  }

  async function makeAdmin(userId: number) {
    try { await roomsApi.makeAdmin(chat.id, userId); reload(); }
    catch (e) { alert(errorMessage(e)); }
  }
  async function demote(userId: number) {
    try { await roomsApi.removeAdmin(chat.id, userId); reload(); }
    catch (e) { alert(errorMessage(e)); }
  }
  async function kick(userId: number) {
    if (!confirm('Remove this user from the room? They will be banned from rejoining.')) return;
    try { await roomsApi.kick(chat.id, userId); reload(); }
    catch (e) { alert(errorMessage(e)); }
  }

  return (
    <div>
      <ErrorText>{err}</ErrorText>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b border-gray-100">
            <th className="py-2">Username</th>
            <th>Role</th>
            <th>Joined</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {list.map(m => {
            const amI = user?.id === m.userId;
            const isTheOwner = m.role === 'owner';
            return (
              <tr key={m.userId} className="border-b border-gray-50">
                <td className="py-2">{m.username}{amI && <span className="text-xs text-gray-400"> (you)</span>}</td>
                <td>{m.role}</td>
                <td>{dayjs(m.joinedAt).format('YYYY-MM-DD HH:mm')}</td>
                <td className="text-right">
                  {!isTheOwner && !amI && m.role !== 'admin' && (
                    <Button variant="secondary" onClick={() => makeAdmin(m.userId)}>Make admin</Button>
                  )}
                  {!isTheOwner && !amI && m.role === 'admin' && isOwner && (
                    <Button variant="secondary" onClick={() => demote(m.userId)}>Remove admin</Button>
                  )}
                  {!isTheOwner && !amI && (
                    <Button variant="danger" className="ml-2" onClick={() => kick(m.userId)}>Ban</Button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
