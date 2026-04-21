import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { usePresence } from '@/store/presenceStore';
import { PresenceDot } from '@/features/presence/PresenceDot';
import { friendsApi } from '@/api/friends';
import { errorMessage } from '@/api/client';
export function RoomRightPanel({ chat, members, friendIds, myId }) {
    const { byUserId } = usePresence();
    const admins = members.filter(m => m.role === 'owner' || m.role === 'admin');
    const regular = members.filter(m => m.role === 'member');
    async function addFriend(username) {
        try {
            await friendsApi.send({ username });
            alert(`Friend request sent to ${username}.`);
        }
        catch (e) {
            alert(errorMessage(e));
        }
    }
    function renderMember(m, withRole) {
        const canFriend = myId !== undefined && m.userId !== myId && !friendIds.has(m.userId);
        return (_jsxs("li", { className: "flex items-center gap-2 text-sm py-0.5", children: [_jsx(PresenceDot, { presence: byUserId[m.userId] ?? 'offline' }), _jsx("span", { className: "flex-1 truncate", children: m.username }), withRole && _jsx("span", { className: "text-xs text-gray-400", children: m.role }), canFriend && (_jsx("button", { className: "text-xs text-brand-600 hover:underline", title: "Send friend request", onClick: () => addFriend(m.username), children: "+friend" }))] }, m.userId));
    }
    return (_jsxs("div", { className: "p-3", children: [_jsx("div", { className: "text-xs text-gray-400 uppercase tracking-wide mb-1", children: "Room" }), _jsx("div", { className: "text-sm font-semibold", children: chat.name }), _jsxs("div", { className: "text-xs text-gray-500 mb-3", children: [chat.visibility === 'public' ? 'Public room' : 'Private room', " \u00B7 ", members.length, " members"] }), _jsx("div", { className: "text-xs text-gray-400 uppercase tracking-wide mb-1", children: "Admins" }), _jsx("ul", { className: "mb-3", children: admins.map(m => renderMember(m, true)) }), _jsx("div", { className: "text-xs text-gray-400 uppercase tracking-wide mb-1", children: "Members" }), _jsx("ul", { children: regular.map(m => renderMember(m, false)) })] }));
}
