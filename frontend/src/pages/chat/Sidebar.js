import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from '@/components/ui';
import { ChatEntry } from './ChatEntry';
const sortedByActivity = (list) => [...list].sort((a, b) => (b.lastMessageAt ?? '').localeCompare(a.lastMessageAt ?? ''));
export function Sidebar(props) {
    const { chats, invitations, onCreateRoom, onAcceptInvite, onDeclineInvite } = props;
    const rooms = chats.filter(c => c.type === 'room');
    const publicRooms = rooms.filter(c => c.visibility === 'public');
    const privateRooms = rooms.filter(c => c.visibility === 'private');
    const dms = chats.filter(c => c.type === 'dm');
    return (_jsxs("aside", { className: "w-72 bg-white border-r border-gray-100 flex flex-col", children: [_jsx("div", { className: "p-3 border-b border-gray-100 flex gap-2", children: _jsx(Button, { onClick: onCreateRoom, className: "flex-1", children: "Create room" }) }), invitations.length > 0 && (_jsx(InvitationsSection, { invitations: invitations, onAccept: onAcceptInvite, onDecline: onDeclineInvite })), _jsxs("div", { className: "flex-1 overflow-y-auto", children: [_jsxs(SidebarSection, { title: "Public rooms", children: [publicRooms.length === 0 && _jsx(Empty, { children: "no public rooms yet" }), sortedByActivity(publicRooms).map(c => _jsx(ChatEntry, { chat: c }, c.id))] }), _jsxs(SidebarSection, { title: "Private rooms", children: [privateRooms.length === 0 && _jsx(Empty, { children: "no private rooms" }), sortedByActivity(privateRooms).map(c => _jsx(ChatEntry, { chat: c }, c.id))] }), _jsxs(SidebarSection, { title: "Direct messages", children: [dms.length === 0 && _jsx(Empty, { children: "no direct messages" }), sortedByActivity(dms).map(c => _jsx(ChatEntry, { chat: c }, c.id))] })] })] }));
}
function InvitationsSection({ invitations, onAccept, onDecline, }) {
    return (_jsxs("section", { className: "p-3 border-b border-gray-100 bg-amber-50", children: [_jsxs("div", { className: "text-xs font-semibold text-amber-800 mb-1", children: ["Invitations (", invitations.length, ")"] }), _jsx("ul", { className: "space-y-1", children: invitations.map(i => (_jsxs("li", { className: "text-sm flex items-center gap-2", children: [_jsxs("span", { className: "flex-1 truncate", title: i.chatDescription ?? '', children: ["#", i.chatName, i.invitedBy && _jsxs("span", { className: "text-xs text-gray-500", children: [" \u00B7 from ", i.invitedBy.username] })] }), _jsx("button", { className: "text-xs text-brand-600", onClick: () => onAccept(i.id), children: "accept" }), _jsx("button", { className: "text-xs text-gray-500", onClick: () => onDecline(i.id), children: "decline" })] }, i.id))) })] }));
}
function SidebarSection({ title, children }) {
    return (_jsxs("section", { className: "py-2", children: [_jsx("div", { className: "px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-400", children: title }), _jsx("ul", { children: children })] }));
}
function Empty({ children }) {
    return _jsx("li", { className: "px-3 py-1 text-xs text-gray-400 italic", children: children });
}
