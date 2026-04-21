import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Button } from '@/components/ui';
import { MessageList } from '@/features/messages/MessageList';
import { MessageComposer } from '@/features/messages/MessageComposer';
import { messagesApi } from '@/api/messages';
import { errorMessage } from '@/api/client';
import { useChats } from '@/store/chatStore';
export function MainArea(props) {
    const { selected, currentUser, canDeleteOthers, replyTo, editing, setReplyTo, setEditing, dmDisabled, dmDisabledReason, onManageRoom, } = props;
    const chatStore = useChats();
    async function onDelete(m) {
        if (!confirm('Delete this message?'))
            return;
        try {
            await messagesApi.delete(m.id);
        }
        catch (e) {
            alert(errorMessage(e));
        }
    }
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "px-4 py-2 border-b border-gray-100 bg-white flex items-center justify-between shrink-0", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "font-semibold text-gray-900 truncate", children: selected.type === 'room' ? `#${selected.name}` : (selected.peer?.username ?? 'Direct message') }), selected.type === 'room' && selected.description && (_jsx("div", { className: "text-xs text-gray-500 truncate", children: selected.description }))] }), selected.type === 'room' && (_jsx("div", { className: "flex items-center gap-2", children: _jsx(Button, { variant: "secondary", onClick: onManageRoom, children: "Manage room" }) }))] }), _jsx(MessageList, { messages: chatStore.messagesByChat[selected.id] ?? [], hasMore: chatStore.hasMoreByChat[selected.id] ?? false, loading: chatStore.loadingByChat[selected.id] ?? false, onLoadMore: () => chatStore.loadMore(selected.id), onReply: m => { setReplyTo(m); setEditing(null); }, onEdit: m => { setEditing(m); setReplyTo(null); }, onDelete: onDelete, canDeleteOthers: canDeleteOthers, currentUser: currentUser }), _jsx(MessageComposer, { chatId: selected.id, replyTo: replyTo, clearReply: () => setReplyTo(null), editing: editing, clearEditing: () => setEditing(null), disabled: dmDisabled, disabledReason: dmDisabledReason })] }));
}
