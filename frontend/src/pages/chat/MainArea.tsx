import { Button } from '@/components/ui';
import { MessageList } from '@/features/messages/MessageList';
import { MessageComposer } from '@/features/messages/MessageComposer';
import { messagesApi } from '@/api/messages';
import { errorMessage } from '@/api/client';
import { useChats } from '@/store/chatStore';
import type { Chat, Message, User } from '@/api/types';

interface Props {
  selected: Chat;
  currentUser: User | null;
  canDeleteOthers: boolean;
  replyTo: Message | null;
  editing: Message | null;
  setReplyTo: (m: Message | null) => void;
  setEditing: (m: Message | null) => void;
  dmDisabled: boolean;
  dmDisabledReason?: string;
  onManageRoom: () => void;
}

export function MainArea(props: Props) {
  const {
    selected, currentUser, canDeleteOthers,
    replyTo, editing, setReplyTo, setEditing,
    dmDisabled, dmDisabledReason, onManageRoom,
  } = props;
  const chatStore = useChats();

  async function onDelete(m: Message) {
    if (!confirm('Delete this message?')) return;
    try { await messagesApi.delete(m.id); }
    catch (e) { alert(errorMessage(e)); }
  }

  return (
    <>
      <div className="px-4 py-2 border-b border-gray-100 bg-white flex items-center justify-between shrink-0">
        <div className="min-w-0">
          <div className="font-semibold text-gray-900 truncate">
            {selected.type === 'room' ? `#${selected.name}` : (selected.peer?.username ?? 'Direct message')}
          </div>
          {selected.type === 'room' && selected.description && (
            <div className="text-xs text-gray-500 truncate">{selected.description}</div>
          )}
        </div>
        {selected.type === 'room' && (
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onManageRoom}>Manage room</Button>
          </div>
        )}
      </div>
      <MessageList
        messages={chatStore.messagesByChat[selected.id] ?? []}
        hasMore={chatStore.hasMoreByChat[selected.id] ?? false}
        loading={chatStore.loadingByChat[selected.id] ?? false}
        onLoadMore={() => chatStore.loadMore(selected.id)}
        onReply={m => { setReplyTo(m); setEditing(null); }}
        onEdit={m  => { setEditing(m); setReplyTo(null); }}
        onDelete={onDelete}
        canDeleteOthers={canDeleteOthers}
        currentUser={currentUser}
      />
      <MessageComposer
        chatId={selected.id}
        replyTo={replyTo}
        clearReply={() => setReplyTo(null)}
        editing={editing}
        clearEditing={() => setEditing(null)}
        disabled={dmDisabled}
        disabledReason={dmDisabledReason}
      />
    </>
  );
}
