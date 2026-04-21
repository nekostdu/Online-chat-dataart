import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { friendsApi } from '@/api/friends';
export function RequestsTab() {
    const [list, setList] = useState([]);
    useEffect(() => { reload(); }, []);
    async function reload() {
        try {
            setList(await friendsApi.pending());
        }
        catch { /* ignore */ }
    }
    async function accept(requesterId) { await friendsApi.accept(requesterId); reload(); }
    async function decline(requesterId) { await friendsApi.decline(requesterId); reload(); }
    const incoming = list.filter(x => x.direction === 'incoming');
    const outgoing = list.filter(x => x.direction === 'outgoing');
    return (_jsxs("div", { className: "space-y-5", children: [_jsxs("section", { children: [_jsx("h3", { className: "text-sm font-semibold text-gray-600 mb-2", children: "Incoming" }), incoming.length === 0 && _jsx("div", { className: "text-sm text-gray-500", children: "No incoming requests." }), _jsx("ul", { className: "divide-y divide-gray-100", children: incoming.map(r => (_jsxs("li", { className: "py-2 flex items-center gap-3", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("div", { className: "font-medium", children: r.user.username }), r.message && _jsxs("div", { className: "text-xs text-gray-500", children: ["\u201C", r.message, "\u201D"] })] }), _jsx(Button, { onClick: () => accept(r.requesterId), children: "Accept" }), _jsx(Button, { variant: "secondary", onClick: () => decline(r.requesterId), children: "Decline" })] }, `${r.requesterId}-${r.addresseeId}`))) })] }), _jsxs("section", { children: [_jsx("h3", { className: "text-sm font-semibold text-gray-600 mb-2", children: "Sent" }), outgoing.length === 0 && _jsx("div", { className: "text-sm text-gray-500", children: "No pending outgoing requests." }), _jsx("ul", { className: "divide-y divide-gray-100", children: outgoing.map(r => (_jsxs("li", { className: "py-2 text-sm", children: ["Waiting for ", _jsx("span", { className: "font-medium", children: r.user.username }), " to respond."] }, `${r.requesterId}-${r.addresseeId}`))) })] })] }));
}
