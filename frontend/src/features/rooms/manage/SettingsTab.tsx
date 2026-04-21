import { useState } from 'react';
import { Button, ErrorText, Input, Textarea, Label } from '@/components/ui';
import { roomsApi } from '@/api/rooms';
import { errorMessage } from '@/api/client';
import { useChats } from '@/store/chatStore';
import type { Chat, RoomVisibility } from '@/api/types';

interface Props {
  chat: Chat;
  isOwner: boolean;
  onClose: () => void;
}

export function SettingsTab({ chat, isOwner, onClose }: Props) {
  const [name, setName] = useState(chat.name ?? '');
  const [description, setDescription] = useState(chat.description ?? '');
  const [visibility, setVisibility] = useState<RoomVisibility>(chat.visibility ?? 'public');
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const { loadChats, removeChat } = useChats();

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setOk(null);
    try {
      await roomsApi.update(chat.id, { name, description, visibility });
      setOk('Saved.');
      await loadChats();
    } catch (e) {
      setErr(errorMessage(e));
    }
  }

  async function deleteRoom() {
    if (!confirm('Delete this room? All messages and files will be lost permanently.')) return;
    try {
      await roomsApi.delete(chat.id);
      removeChat(chat.id);
      onClose();
    } catch (e) {
      alert(errorMessage(e));
    }
  }

  return (
    <form onSubmit={save} className="space-y-4 max-w-md">
      <div>
        <Label>Name</Label>
        <Input value={name} onChange={e => setName(e.target.value)} disabled={!isOwner} />
      </div>
      <div>
        <Label>Description</Label>
        <Textarea value={description} onChange={e => setDescription(e.target.value)}
                  rows={3} disabled={!isOwner} />
      </div>
      <div>
        <Label>Visibility</Label>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="radio" checked={visibility === 'public'}  onChange={() => setVisibility('public')}
                   disabled={!isOwner} /> Public
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" checked={visibility === 'private'} onChange={() => setVisibility('private')}
                   disabled={!isOwner} /> Private
          </label>
        </div>
      </div>
      <ErrorText>{err}</ErrorText>
      {ok && <div className="text-sm text-green-600">{ok}</div>}
      <div className="flex justify-between">
        <Button type="submit" disabled={!isOwner}>Save changes</Button>
        {isOwner && (
          <Button type="button" variant="danger" onClick={deleteRoom}>Delete room</Button>
        )}
      </div>
    </form>
  );
}
