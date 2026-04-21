import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Modal } from '@/components/Modal';
import { Button, Input } from '@/components/ui';
import { roomsApi } from '@/api/rooms';
import { errorMessage } from '@/api/client';
import { useChats } from '@/store/chatStore';
export function PublicCatalogModal({ open, onClose }) {
    const [q, setQ] = useState('');
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState(null);
    const { loadChats, select } = useChats();
    useEffect(() => {
        if (!open)
            return;
        load('');
    }, [open]);
    async function load(query) {
        setErr(null);
        setLoading(true);
        try {
            setList(await roomsApi.listPublic(query, 50));
        }
        catch (e) {
            setErr(errorMessage(e));
        }
        finally {
            setLoading(false);
        }
    }
    async function join(id) {
        try {
            await roomsApi.join(id);
            await loadChats();
            select(id);
            onClose();
        }
        catch (e) {
            alert(errorMessage(e));
        }
    }
    return (_jsxs(Modal, { open: open, onClose: onClose, title: "Public rooms", width: 620, children: [_jsxs("div", { className: "flex gap-2 mb-4", children: [_jsx(Input, { placeholder: "Search by name or description", value: q, onChange: e => setQ(e.target.value), onKeyDown: e => { if (e.key === 'Enter')
                            load(q); } }), _jsx(Button, { variant: "secondary", onClick: () => load(q), children: "Search" })] }), err && _jsx("div", { className: "text-sm text-red-600 mb-2", children: err }), loading && _jsx("div", { className: "text-sm text-gray-500", children: "Loading\u2026" }), !loading && list.length === 0 && _jsx("div", { className: "text-sm text-gray-500", children: "No rooms found." }), _jsx("ul", { className: "divide-y divide-gray-100", children: list.map(r => (_jsxs("li", { className: "py-2 flex items-center justify-between gap-3", children: [_jsxs("div", { className: "min-w-0 flex-1", children: [_jsxs("div", { className: "font-medium text-gray-900", children: ["#", r.name] }), r.description && _jsx("div", { className: "text-xs text-gray-500 truncate", children: r.description }), _jsxs("div", { className: "text-xs text-gray-400", children: [r.memberCount, " members"] })] }), _jsx(Button, { onClick: () => join(r.id), children: "Join" })] }, r.id))) })] }));
}
