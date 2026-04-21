import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { usePresence } from '@/store/presenceStore';
import { PresenceDot } from '@/features/presence/PresenceDot';
export function DmRightPanel({ chat }) {
    const { byUserId } = usePresence();
    if (!chat.peer)
        return null;
    const p = byUserId[chat.peer.id] ?? 'offline';
    return (_jsxs("div", { className: "p-3", children: [_jsx("div", { className: "text-xs text-gray-400 uppercase tracking-wide mb-1", children: "Direct message" }), _jsxs("div", { className: "flex items-center gap-2 text-sm font-semibold", children: [_jsx(PresenceDot, { presence: p }), " ", chat.peer.username] }), _jsxs("div", { className: "text-xs text-gray-500 mt-1", children: ["Presence: ", p] })] }));
}
