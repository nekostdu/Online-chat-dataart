import { useState, FormEvent } from 'react';
import { Modal } from '@/components/Modal';
import { Button, ErrorText, Input, Label, Textarea } from '@/components/ui';
import { roomsApi } from '@/api/rooms';
import { errorMessage } from '@/api/client';
import { useChats } from '@/store/chatStore';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CreateRoomModal({ open, onClose }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const { loadChats, select } = useChats();

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr(null); setLoading(true);
    try {
      const room = await roomsApi.create(name, description, visibility);
      await loadChats();
      select(room.id);
      reset();
      onClose();
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setName(''); setDescription(''); setVisibility('public'); setErr(null);
  }

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title="Create room">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label>Name</Label>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            required
            minLength={3}
            maxLength={64}
            placeholder="general"
          />
          <div className="text-xs text-gray-500 mt-1">3–64 chars: letters, digits, space, . _ -</div>
        </div>
        <div>
          <Label>Description</Label>
          <Textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Optional"
          />
        </div>
        <div>
          <Label>Visibility</Label>
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="radio" name="vis" checked={visibility === 'public'}
                     onChange={() => setVisibility('public')} />
              Public (listed in catalog)
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="vis" checked={visibility === 'private'}
                     onChange={() => setVisibility('private')} />
              Private (invite only)
            </label>
          </div>
        </div>
        <ErrorText>{err}</ErrorText>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => { reset(); onClose(); }}>Cancel</Button>
          <Button type="submit" disabled={loading}>Create</Button>
        </div>
      </form>
    </Modal>
  );
}
