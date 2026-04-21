import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { Button, ErrorText } from '@/components/ui';
import { roomsApi } from '@/api/rooms';
import { errorMessage } from '@/api/client';
export function BannedTab({ chat }) {
    const [list, setList] = useState([]);
    const [err, setErr] = useState(null);
    useEffect(() => { reload(); }, [chat.id]);
    async function reload() {
        try {
            setList(await roomsApi.bans(chat.id));
        }
        catch (e) {
            setErr(errorMessage(e));
        }
    }
    async function unban(userId) {
        try {
            await roomsApi.unban(chat.id, userId);
            reload();
        }
        catch (e) {
            alert(errorMessage(e));
        }
    }
    return (_jsxs("div", { children: [_jsx(ErrorText, { children: err }), list.length === 0 && _jsx("div", { className: "text-sm text-gray-500", children: "No banned users." }), _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "text-left text-gray-500 border-b border-gray-100", children: [_jsx("th", { className: "py-2", children: "Username" }), _jsx("th", { children: "Banned by" }), _jsx("th", { children: "Date" }), _jsx("th", {})] }) }), _jsx("tbody", { children: list.map(b => (_jsxs("tr", { className: "border-b border-gray-50", children: [_jsx("td", { className: "py-2", children: b.username }), _jsx("td", { children: b.bannedByUsername ?? '—' }), _jsx("td", { children: dayjs(b.bannedAt).format('YYYY-MM-DD HH:mm') }), _jsx("td", { className: "text-right", children: _jsx(Button, { variant: "secondary", onClick: () => unban(b.userId), children: "Unban" }) })] }, b.userId))) })] })] }));
}
