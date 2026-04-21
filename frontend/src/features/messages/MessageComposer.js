import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { messagesApi, attachmentsApi } from '@/api/messages';
import { errorMessage } from '@/api/client';
export function MessageComposer(props) {
    const { chatId, replyTo, clearReply, editing, clearEditing, disabled, disabledReason } = props;
    const [text, setText] = useState('');
    const [showEmoji, setShowEmoji] = useState(false);
    const [attachments, setAttachments] = useState([]);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState(null);
    const areaRef = useRef(null);
    useEffect(() => {
        if (editing) {
            setText(editing.text ?? '');
            setAttachments([]);
        }
    }, [editing?.id]);
    async function onFiles(files) {
        if (!files || files.length === 0)
            return;
        for (let i = 0; i < files.length; i++) {
            const f = files[i];
            try {
                const uploaded = await attachmentsApi.upload(f);
                setAttachments(prev => [...prev, uploaded]);
            }
            catch (e) {
                alert(errorMessage(e));
            }
        }
    }
    function onPaste(e) {
        const items = e.clipboardData?.items;
        if (!items)
            return;
        const files = [];
        for (let i = 0; i < items.length; i++) {
            const it = items[i];
            if (it.kind === 'file') {
                const f = it.getAsFile();
                if (f)
                    files.push(f);
            }
        }
        if (files.length > 0) {
            e.preventDefault();
            const dt = new DataTransfer();
            files.forEach(f => dt.items.add(f));
            onFiles(dt.files);
        }
    }
    async function submit(e) {
        e.preventDefault();
        if (busy || disabled)
            return;
        if (!text.trim() && attachments.length === 0 && !editing)
            return;
        setBusy(true);
        setErr(null);
        try {
            if (editing) {
                await messagesApi.edit(editing.id, text);
                clearEditing();
            }
            else {
                await messagesApi.send(chatId, {
                    text: text || undefined,
                    replyToId: replyTo?.id,
                    attachmentIds: attachments.map(a => a.id),
                });
            }
            setText('');
            setAttachments([]);
            clearReply();
        }
        catch (e) {
            setErr(errorMessage(e));
        }
        finally {
            setBusy(false);
            areaRef.current?.focus();
        }
    }
    function onKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit(e);
        }
        if (e.key === 'Escape') {
            if (editing)
                clearEditing();
            if (replyTo)
                clearReply();
        }
    }
    return (_jsxs("div", { className: "border-t border-gray-100 bg-white", children: [(replyTo || editing) && (_jsxs("div", { className: "flex items-center justify-between px-4 py-1 bg-gray-50 text-xs border-b border-gray-100", children: [replyTo && !editing && (_jsxs("span", { className: "text-gray-600", children: ["Replying to ", _jsx("b", { children: replyTo.authorUsername }), ": ", truncate(replyTo.text ?? '')] })), editing && _jsx("span", { className: "text-gray-600", children: "Editing message\u2026" }), _jsx("button", { className: "text-gray-400 hover:text-gray-700", onClick: () => { clearReply(); clearEditing(); }, children: "\u2715" })] })), attachments.length > 0 && (_jsx("div", { className: "px-4 py-2 flex flex-wrap gap-2 border-b border-gray-50", children: attachments.map(a => (_jsxs("div", { className: "text-xs bg-gray-100 rounded px-2 py-1 flex items-center gap-2", children: [a.isImage ? '🖼' : '📎', " ", a.originalName, _jsx("button", { onClick: () => setAttachments(prev => prev.filter(x => x.id !== a.id)), className: "text-gray-400 hover:text-red-600", children: "\u00D7" })] }, a.id))) })), disabled && (_jsx("div", { className: "px-4 py-2 text-xs text-amber-700 bg-amber-50 border-b border-amber-100", children: disabledReason ?? 'You cannot send messages in this chat.' })), err && _jsx("div", { className: "px-4 py-1 text-xs text-red-600", children: err }), _jsxs("form", { onSubmit: submit, className: "flex items-end gap-2 p-2 relative", children: [_jsx("button", { type: "button", className: "text-gray-500 hover:text-gray-800 px-2", onClick: () => setShowEmoji(v => !v), title: "Emoji", disabled: disabled, children: "\uD83D\uDE0A" }), _jsxs("label", { className: `text-gray-500 hover:text-gray-800 px-2 cursor-pointer ${disabled ? 'opacity-50' : ''}`, title: "Attach", children: ["\uD83D\uDCCE", _jsx("input", { type: "file", hidden: true, multiple: true, disabled: disabled, onChange: e => onFiles(e.target.files) })] }), _jsx("textarea", { ref: areaRef, className: "flex-1 rounded border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none resize-none", rows: Math.min(5, Math.max(1, text.split('\n').length)), placeholder: disabled ? '' : 'Type a message… (Enter to send, Shift+Enter for newline)', value: text, onChange: e => setText(e.target.value), onKeyDown: onKeyDown, onPaste: onPaste, disabled: disabled, maxLength: 3500 }), _jsx("button", { type: "submit", disabled: busy || disabled || (!text.trim() && attachments.length === 0 && !editing), className: "rounded bg-brand-500 text-white text-sm px-3 py-2 disabled:opacity-50", children: editing ? 'Save' : 'Send' }), showEmoji && (_jsx("div", { className: "absolute bottom-16 left-0 z-30", children: _jsx(Picker, { data: data, onEmojiSelect: (emoji) => {
                                if (emoji.native)
                                    setText(t => t + emoji.native);
                                setShowEmoji(false);
                                areaRef.current?.focus();
                            }, theme: "light", autoFocus: true }) }))] })] }));
}
function truncate(s, n = 80) {
    if (!s)
        return '';
    return s.length > n ? s.slice(0, n) + '…' : s;
}
