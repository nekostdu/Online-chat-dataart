import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { roomsApi } from '@/api/rooms';
import { errorMessage } from '@/api/client';
export function AdminsTab({ chat, isOwner }) {
    const [list, setList] = useState([]);
    useEffect(() => { roomsApi.members(chat.id).then(setList).catch(() => { }); }, [chat.id]);
    const admins = list.filter(m => m.role === 'owner' || m.role === 'admin');
    async function demote(userId) {
        try {
            await roomsApi.removeAdmin(chat.id, userId);
            setList(await roomsApi.members(chat.id));
        }
        catch (e) {
            alert(errorMessage(e));
        }
    }
    return (_jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "text-left text-gray-500 border-b border-gray-100", children: [_jsx("th", { className: "py-2", children: "Username" }), _jsx("th", { children: "Role" }), _jsx("th", {})] }) }), _jsx("tbody", { children: admins.map(m => (_jsxs("tr", { className: "border-b border-gray-50", children: [_jsx("td", { className: "py-2", children: m.username }), _jsx("td", { children: m.role }), _jsxs("td", { className: "text-right", children: [isOwner && m.role === 'admin' && (_jsx(Button, { variant: "secondary", onClick: () => demote(m.userId), children: "Remove admin" })), m.role === 'owner' && _jsx("span", { className: "text-xs text-gray-400", children: "cannot lose admin rights" })] })] }, m.userId))) })] }));
}
