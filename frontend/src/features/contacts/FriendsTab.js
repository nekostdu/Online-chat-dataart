import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { Button, ErrorText } from '@/components/ui';
import { blocksApi, friendsApi } from '@/api/friends';
import { chatsApi } from '@/api/rooms';
import { errorMessage } from '@/api/client';
import { useChats } from '@/store/chatStore';
import { PresenceDot } from '@/features/presence/PresenceDot';
import { usePresence } from '@/store/presenceStore';
export function FriendsTab({ onClose }) {
    const [list, setList] = useState([]);
    const [err, setErr] = useState(null);
    const { byUserId } = usePresence();
    const { loadChats, select } = useChats();
    useEffect(() => { reload(); }, []);
    async function reload() {
        try {
            setList(await friendsApi.list());
        }
        catch (e) {
            setErr(errorMessage(e));
        }
    }
    async function openDm(userId) {
        try {
            const chat = await chatsApi.openDm(userId);
            await loadChats();
            select(chat.id);
            onClose();
        }
        catch (e) {
            alert(errorMessage(e));
        }
    }
    async function removeFriend(userId) {
        if (!confirm('Remove from friends?'))
            return;
        try {
            await friendsApi.remove(userId);
            reload();
        }
        catch (e) {
            alert(errorMessage(e));
        }
    }
    async function block(userId) {
        if (!confirm('Block this user? You will not be able to exchange messages with them.'))
            return;
        try {
            await blocksApi.block(userId);
            reload();
        }
        catch (e) {
            alert(errorMessage(e));
        }
    }
    return (_jsxs("div", { children: [_jsx(ErrorText, { children: err }), list.length === 0 && _jsx("div", { className: "text-sm text-gray-500", children: "You have no friends yet." }), _jsx("ul", { className: "divide-y divide-gray-100", children: list.map(f => (_jsxs("li", { className: "py-2 flex items-center gap-3", children: [_jsx(PresenceDot, { presence: byUserId[f.user.id] ?? 'offline' }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("div", { className: "font-medium", children: f.user.username }), _jsxs("div", { className: "text-xs text-gray-500", children: ["friends since ", dayjs(f.since).format('YYYY-MM-DD')] })] }), _jsx(Button, { variant: "secondary", onClick: () => openDm(f.user.id), children: "Message" }), _jsx(Button, { variant: "ghost", onClick: () => removeFriend(f.user.id), children: "Remove" }), _jsx(Button, { variant: "ghost", onClick: () => block(f.user.id), children: "Block" })] }, f.user.id))) })] }));
}
