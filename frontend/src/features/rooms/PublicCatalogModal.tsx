import { useEffect, useState } from 'react';
import { Modal } from '@/components/Modal';
import { Button, Input } from '@/components/ui';
import { roomsApi, RoomSummary } from '@/api/rooms';
import { errorMessage } from '@/api/client';
import { useChats } from '@/store/chatStore';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function PublicCatalogModal({ open, onClose }: Props) {
  const [q, setQ] = useState('');
  const [list, setList] = useState<RoomSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const { loadChats, select } = useChats();

  useEffect(() => {
    if (!open) return;
    load('');
  }, [open]);

  async function load(query: string) {
    setErr(null); setLoading(true);
    try { setList(await roomsApi.listPublic(query, 50)); }
    catch (e) { setErr(errorMessage(e)); }
    finally { setLoading(false); }
  }

  async function join(id: number) {
    try {
      await roomsApi.join(id);
      await loadChats();
      select(id);
      onClose();
    } catch (e) {
      alert(errorMessage(e));
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Public rooms" width={620}>
      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Search by name or description"
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') load(q); }}
        />
        <Button variant="secondary" onClick={() => load(q)}>Search</Button>
      </div>
      {err && <div className="text-sm text-red-600 mb-2">{err}</div>}
      {loading && <div className="text-sm text-gray-500">Loading…</div>}
      {!loading && list.length === 0 && <div className="text-sm text-gray-500">No rooms found.</div>}
      <ul className="divide-y divide-gray-100">
        {list.map(r => (
          <li key={r.id} className="py-2 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="font-medium text-gray-900">#{r.name}</div>
              {r.description && <div className="text-xs text-gray-500 truncate">{r.description}</div>}
              <div className="text-xs text-gray-400">{r.memberCount} members</div>
            </div>
            <Button onClick={() => join(r.id)}>Join</Button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
