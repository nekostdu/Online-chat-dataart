import { useState } from 'react';
import { Button, ErrorText, Input, Label } from '@/components/ui';
import { roomsApi } from '@/api/rooms';
import { errorMessage } from '@/api/client';
import type { Chat } from '@/api/types';

export function InvitesTab({ chat }: { chat: Chat }) {
  const [username, setUsername] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setMsg(null);
    try {
      await roomsApi.invite(chat.id, { username: username.trim() });
      setMsg(`Invitation sent to ${username.trim()}.`);
      setUsername('');
    } catch (e) {
      setErr(errorMessage(e));
    }
  }

  return (
    <form onSubmit={send} className="space-y-3 max-w-md">
      <Label>Invite by username</Label>
      <div className="flex gap-2">
        <Input value={username} onChange={e => setUsername(e.target.value)} placeholder="username" required />
        <Button type="submit">Send invite</Button>
      </div>
      {msg && <div className="text-sm text-green-600">{msg}</div>}
      <ErrorText>{err}</ErrorText>
    </form>
  );
}
