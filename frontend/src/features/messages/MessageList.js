import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { attachmentsApi } from '@/api/messages';
export function MessageList(props) {
    const { messages, hasMore, loading, onLoadMore, onReply, onEdit, onDelete, canDeleteOthers, currentUser } = props;
    const scroller = useRef(null);
    const [stickBottom, setStickBottom] = useState(true);
    const prevLenRef = useRef(messages.length);
    const prevScrollHeightRef = useRef(0);
    // Rule 4.2: autoscroll only if user is near the bottom.
    useLayoutEffect(() => {
        const el = scroller.current;
        if (!el)
            return;
        const prevLen = prevLenRef.current;
        const newLen = messages.length;
        prevLenRef.current = newLen;
        if (newLen > prevLen) {
            const addedAtTop = newLen > prevLen && messages[0] && prevLen > 0;
            if (addedAtTop && !stickBottom) {
                // We prepended older messages; preserve scroll position.
                el.scrollTop = el.scrollHeight - prevScrollHeightRef.current;
            }
            else if (stickBottom) {
                el.scrollTop = el.scrollHeight;
            }
        }
        prevScrollHeightRef.current = el.scrollHeight;
    }, [messages, stickBottom]);
    // Initial scroll-to-bottom on mount / chat-change.
    useEffect(() => {
        const el = scroller.current;
        if (!el)
            return;
        el.scrollTop = el.scrollHeight;
        setStickBottom(true);
    }, [messages.length === 0]);
    function onScroll() {
        const el = scroller.current;
        if (!el)
            return;
        const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        setStickBottom(nearBottom);
        if (el.scrollTop < 40 && hasMore && !loading) {
            onLoadMore();
        }
    }
    return (_jsxs("div", { ref: scroller, onScroll: onScroll, className: "flex-1 overflow-y-auto px-4 py-2 space-y-2 bg-white", children: [loading && _jsx("div", { className: "text-center text-xs text-gray-400 py-2", children: "Loading\u2026" }), !hasMore && messages.length > 0 && (_jsx("div", { className: "text-center text-xs text-gray-400 py-2", children: "\u2014 beginning of conversation \u2014" })), messages.map(m => (_jsx(MessageItem, { message: m, isMine: !!currentUser && m.authorId === currentUser.id, canDeleteOthers: canDeleteOthers, onReply: onReply, onEdit: onEdit, onDelete: onDelete }, m.id)))] }));
}
function MessageItem({ message, isMine, canDeleteOthers, onReply, onEdit, onDelete, }) {
    const deleted = !!message.deletedAt;
    const canDelete = isMine || canDeleteOthers;
    return (_jsxs("div", { className: "group flex gap-3 hover:bg-gray-50 rounded p-1", children: [_jsx("div", { className: "pt-0.5 text-xs text-gray-400 w-14 shrink-0 tabular-nums", children: dayjs(message.createdAt).format('HH:mm') }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "text-sm", children: [_jsx("span", { className: "font-medium text-gray-900", children: message.authorUsername ?? '(deleted)' }), message.editedAt && !deleted && _jsx("span", { className: "text-xs text-gray-400 ml-2", children: "(edited)" })] }), message.replyTo && (_jsxs("div", { className: "mt-1 pl-2 border-l-2 border-brand-200 bg-brand-50 text-xs text-gray-600 rounded-sm py-1 px-2", children: [_jsxs("span", { className: "font-medium", children: [message.replyTo.authorUsername ?? '(deleted)', ":"] }), ' ', message.replyTo.deleted ? _jsx("em", { className: "text-gray-400", children: "message deleted" }) : truncate(message.replyTo.text)] })), deleted ? (_jsx("div", { className: "text-sm text-gray-400 italic", children: "message deleted" })) : (_jsxs(_Fragment, { children: [message.text && _jsx("div", { className: "text-sm whitespace-pre-wrap break-words", children: message.text }), message.attachments.length > 0 && (_jsx("div", { className: "mt-1 flex flex-wrap gap-2", children: message.attachments.map(a => (_jsx(AttachmentTile, { a: a }, a.id))) }))] }))] }), !deleted && (_jsxs("div", { className: "opacity-0 group-hover:opacity-100 text-xs text-gray-500 flex items-start gap-2 transition", children: [_jsx("button", { className: "hover:text-brand-600", onClick: () => onReply(message), children: "Reply" }), isMine && _jsx("button", { className: "hover:text-brand-600", onClick: () => onEdit(message), children: "Edit" }), canDelete && _jsx("button", { className: "hover:text-red-600", onClick: () => onDelete(message), children: "Delete" })] }))] }));
}
function AttachmentTile({ a }) {
    const href = attachmentsApi.url(a.id);
    if (a.isImage) {
        return (_jsxs("a", { href: href, target: "_blank", rel: "noreferrer", className: "block", children: [_jsx("img", { src: href, alt: a.originalName, className: "max-h-56 rounded border border-gray-200" }), a.comment && _jsx("div", { className: "text-xs text-gray-500 mt-0.5 max-w-xs", children: a.comment })] }));
    }
    return (_jsxs("a", { href: href, className: "inline-flex items-center gap-2 rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm hover:bg-gray-100", download: a.originalName, children: [_jsx("span", { role: "img", "aria-label": "file", children: "\uD83D\uDCCE" }), _jsxs("div", { children: [_jsx("div", { className: "font-medium text-gray-800", children: a.originalName }), _jsx("div", { className: "text-xs text-gray-500", children: formatSize(a.sizeBytes) }), a.comment && _jsx("div", { className: "text-xs text-gray-500", children: a.comment })] })] }));
}
function truncate(s, n = 160) {
    if (!s)
        return '';
    return s.length > n ? s.slice(0, n) + '…' : s;
}
function formatSize(bytes) {
    if (bytes < 1024)
        return `${bytes} B`;
    if (bytes < 1024 * 1024)
        return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
