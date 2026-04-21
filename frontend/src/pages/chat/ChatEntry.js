import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useChats } from '@/store/chatStore';
import { usePresence } from '@/store/presenceStore';
import { PresenceDot } from '@/features/presence/PresenceDot';
export function ChatEntry({ chat }) {
    const { selectedId, select } = useChats();
    const { byUserId } = usePresence();
    const active = selectedId === chat.id;
    const label = chat.type === 'room' ? `#${chat.name ?? '(unnamed)'}`
        : chat.peer?.username ?? 'direct message';
    const presenceOfPeer = chat.type === 'dm' && chat.peer ? byUserId[chat.peer.id] : undefined;
    return (_jsx("li", { children: _jsxs("button", { className: `w-full text-left px-3 py-1.5 flex items-center justify-between gap-2 ${active ? 'bg-brand-50 text-brand-700' : 'hover:bg-gray-50 text-gray-800'}`, onClick: () => select(chat.id), children: [_jsxs("span", { className: "flex items-center gap-2 min-w-0", children: [chat.type === 'dm' && _jsx(PresenceDot, { presence: presenceOfPeer ?? 'offline' }), _jsx("span", { className: "truncate", children: label })] }), chat.unreadCount > 0 && (_jsx("span", { className: "text-xs bg-brand-500 text-white rounded-full px-2 py-0.5 shrink-0", children: chat.unreadCount }))] }) }));
}
