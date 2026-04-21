import { Button } from '@/components/ui';
import { ChatEntry } from './ChatEntry';
import type { Chat, Invitation } from '@/api/types';

interface Props {
  chats: Chat[];
  invitations: Invitation[];
  onCreateRoom: () => void;
  onAcceptInvite: (id: number) => void;
  onDeclineInvite: (id: number) => void;
}

const sortedByActivity = (list: Chat[]) =>
  [...list].sort((a, b) => (b.lastMessageAt ?? '').localeCompare(a.lastMessageAt ?? ''));

export function Sidebar(props: Props) {
  const { chats, invitations, onCreateRoom, onAcceptInvite, onDeclineInvite } = props;
  const rooms = chats.filter(c => c.type === 'room');
  const publicRooms = rooms.filter(c => c.visibility === 'public');
  const privateRooms = rooms.filter(c => c.visibility === 'private');
  const dms = chats.filter(c => c.type === 'dm');

  return (
    <aside className="w-72 bg-white border-r border-gray-100 flex flex-col">
      <div className="p-3 border-b border-gray-100 flex gap-2">
        <Button onClick={onCreateRoom} className="flex-1">Create room</Button>
      </div>

      {invitations.length > 0 && (
        <InvitationsSection
          invitations={invitations}
          onAccept={onAcceptInvite}
          onDecline={onDeclineInvite}
        />
      )}

      <div className="flex-1 overflow-y-auto">
        <SidebarSection title="Public rooms">
          {publicRooms.length === 0 && <Empty>no public rooms yet</Empty>}
          {sortedByActivity(publicRooms).map(c => <ChatEntry key={c.id} chat={c} />)}
        </SidebarSection>
        <SidebarSection title="Private rooms">
          {privateRooms.length === 0 && <Empty>no private rooms</Empty>}
          {sortedByActivity(privateRooms).map(c => <ChatEntry key={c.id} chat={c} />)}
        </SidebarSection>
        <SidebarSection title="Direct messages">
          {dms.length === 0 && <Empty>no direct messages</Empty>}
          {sortedByActivity(dms).map(c => <ChatEntry key={c.id} chat={c} />)}
        </SidebarSection>
      </div>
    </aside>
  );
}

function InvitationsSection({
  invitations, onAccept, onDecline,
}: {
  invitations: Invitation[];
  onAccept: (id: number) => void;
  onDecline: (id: number) => void;
}) {
  return (
    <section className="p-3 border-b border-gray-100 bg-amber-50">
      <div className="text-xs font-semibold text-amber-800 mb-1">Invitations ({invitations.length})</div>
      <ul className="space-y-1">
        {invitations.map(i => (
          <li key={i.id} className="text-sm flex items-center gap-2">
            <span className="flex-1 truncate" title={i.chatDescription ?? ''}>
              #{i.chatName}
              {i.invitedBy && <span className="text-xs text-gray-500"> · from {i.invitedBy.username}</span>}
            </span>
            <button className="text-xs text-brand-600" onClick={() => onAccept(i.id)}>accept</button>
            <button className="text-xs text-gray-500" onClick={() => onDecline(i.id)}>decline</button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="py-2">
      <div className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">{title}</div>
      <ul>{children}</ul>
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <li className="px-3 py-1 text-xs text-gray-400 italic">{children}</li>;
}
