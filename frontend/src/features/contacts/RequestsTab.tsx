import { useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { friendsApi, PendingRequest } from '@/api/friends';

export function RequestsTab() {
  const [list, setList] = useState<PendingRequest[]>([]);

  useEffect(() => { reload(); }, []);
  async function reload() {
    try { setList(await friendsApi.pending()); } catch { /* ignore */ }
  }
  async function accept(requesterId: number)  { await friendsApi.accept(requesterId);  reload(); }
  async function decline(requesterId: number) { await friendsApi.decline(requesterId); reload(); }

  const incoming = list.filter(x => x.direction === 'incoming');
  const outgoing = list.filter(x => x.direction === 'outgoing');

  return (
    <div className="space-y-5">
      <section>
        <h3 className="text-sm font-semibold text-gray-600 mb-2">Incoming</h3>
        {incoming.length === 0 && <div className="text-sm text-gray-500">No incoming requests.</div>}
        <ul className="divide-y divide-gray-100">
          {incoming.map(r => (
            <li key={`${r.requesterId}-${r.addresseeId}`} className="py-2 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-medium">{r.user.username}</div>
                {r.message && <div className="text-xs text-gray-500">&ldquo;{r.message}&rdquo;</div>}
              </div>
              <Button onClick={() => accept(r.requesterId)}>Accept</Button>
              <Button variant="secondary" onClick={() => decline(r.requesterId)}>Decline</Button>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h3 className="text-sm font-semibold text-gray-600 mb-2">Sent</h3>
        {outgoing.length === 0 && <div className="text-sm text-gray-500">No pending outgoing requests.</div>}
        <ul className="divide-y divide-gray-100">
          {outgoing.map(r => (
            <li key={`${r.requesterId}-${r.addresseeId}`} className="py-2 text-sm">
              Waiting for <span className="font-medium">{r.user.username}</span> to respond.
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
