import { useState, FormEvent } from 'react';
import { Button, ErrorText, Input, Label } from '@/components/ui';
import { friendsApi } from '@/api/friends';
import { errorMessage } from '@/api/client';

export function AddTab() {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setOk(null); setErr(null);
    try {
      await friendsApi.send({ username: username.trim(), message: message.trim() || undefined });
      setOk(`Request sent to ${username.trim()}.`);
      setUsername(''); setMessage('');
    } catch (e) {
      setErr(errorMessage(e));
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 max-w-md">
      <div>
        <Label>Username</Label>
        <Input value={username} onChange={e => setUsername(e.target.value)} required />
      </div>
      <div>
        <Label>Message (optional)</Label>
        <Input value={message} onChange={e => setMessage(e.target.value)} maxLength={500} />
      </div>
      {ok  && <div className="text-sm text-green-600">{ok}</div>}
      <ErrorText>{err}</ErrorText>
      <Button type="submit">Send friend request</Button>
    </form>
  );
}
