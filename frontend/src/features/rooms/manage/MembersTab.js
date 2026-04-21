import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { Button, ErrorText } from '@/components/ui';
import { roomsApi } from '@/api/rooms';
import { errorMessage } from '@/api/client';
import { useAuth } from '@/store/authStore';
export function MembersTab({ chat, isOwner }) {
    const [list, setList] = useState([]);
    const [err, setErr] = useState(null);
    const { user } = useAuth();
    useEffect(() => { reload(); }, [chat.id]);
    async function reload() {
        try {
            setList(await roomsApi.members(chat.id));
        }
        catch (e) {
            setErr(errorMessage(e));
        }
    }
    async function makeAdmin(userId) {
        try {
            await roomsApi.makeAdmin(chat.id, userId);
            reload();
        }
        catch (e) {
            alert(errorMessage(e));
        }
    }
    async function demote(userId) {
        try {
            await roomsApi.removeAdmin(chat.id, userId);
            reload();
        }
        catch (e) {
            alert(errorMessage(e));
        }
    }
    async function kick(userId) {
        if (!confirm('Remove this user from the room? They will be banned from rejoining.'))
            return;
        try {
            await roomsApi.kick(chat.id, userId);
            reload();
        }
        catch (e) {
            alert(errorMessage(e));
        }
    }
    return (_jsxs("div", { children: [_jsx(ErrorText, { children: err }), _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "text-left text-gray-500 border-b border-gray-100", children: [_jsx("th", { className: "py-2", children: "Username" }), _jsx("th", { children: "Role" }), _jsx("th", { children: "Joined" }), _jsx("th", {})] }) }), _jsx("tbody", { children: list.map(m => {
                            const amI = user?.id === m.userId;
                            const isTheOwner = m.role === 'owner';
                            return (_jsxs("tr", { className: "border-b border-gray-50", children: [_jsxs("td", { className: "py-2", children: [m.username, amI && _jsx("span", { className: "text-xs text-gray-400", children: " (you)" })] }), _jsx("td", { children: m.role }), _jsx("td", { children: dayjs(m.joinedAt).format('YYYY-MM-DD HH:mm') }), _jsxs("td", { className: "text-right", children: [!isTheOwner && !amI && m.role !== 'admin' && (_jsx(Button, { variant: "secondary", onClick: () => makeAdmin(m.userId), children: "Make admin" })), !isTheOwner && !amI && m.role === 'admin' && isOwner && (_jsx(Button, { variant: "secondary", onClick: () => demote(m.userId), children: "Remove admin" })), !isTheOwner && !amI && (_jsx(Button, { variant: "danger", className: "ml-2", onClick: () => kick(m.userId), children: "Ban" }))] })] }, m.userId));
                        }) })] })] }));
}
