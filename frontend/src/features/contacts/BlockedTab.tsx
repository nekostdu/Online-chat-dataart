import { useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { blocksApi, BlockedEntry } from '@/api/friends';

export function BlockedTab() {
  const [list, setList] = useState<BlockedEntry[]>([]);
  useEffect(() => { blocksApi.list().then(setList).catch(() => {}); }, []);

  async function unblock(userId: number) {
    await blocksApi.unblock(userId);
    setList(await blocksApi.list());
  }

  return (
    <div>
      {list.length === 0 && <div className="text-sm text-gray-500">No blocked users.</div>}
      <ul className="divide-y divide-gray-100">
        {list.map(b => (
          <li key={b.user.id} className="py-2 flex items-center gap-3">
            <div className="flex-1 font-medium">{b.user.username}</div>
            <Button variant="secondary" onClick={() => unblock(b.user.id)}>Unblock</Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
