import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Button, ErrorText, Input, Textarea, Label } from '@/components/ui';
import { roomsApi } from '@/api/rooms';
import { errorMessage } from '@/api/client';
import { useChats } from '@/store/chatStore';
export function SettingsTab({ chat, isOwner, onClose }) {
    const [name, setName] = useState(chat.name ?? '');
    const [description, setDescription] = useState(chat.description ?? '');
    const [visibility, setVisibility] = useState(chat.visibility ?? 'public');
    const [err, setErr] = useState(null);
    const [ok, setOk] = useState(null);
    const { loadChats, removeChat } = useChats();
    async function save(e) {
        e.preventDefault();
        setErr(null);
        setOk(null);
        try {
            await roomsApi.update(chat.id, { name, description, visibility });
            setOk('Saved.');
            await loadChats();
        }
        catch (e) {
            setErr(errorMessage(e));
        }
    }
    async function deleteRoom() {
        if (!confirm('Delete this room? All messages and files will be lost permanently.'))
            return;
        try {
            await roomsApi.delete(chat.id);
            removeChat(chat.id);
            onClose();
        }
        catch (e) {
            alert(errorMessage(e));
        }
    }
    return (_jsxs("form", { onSubmit: save, className: "space-y-4 max-w-md", children: [_jsxs("div", { children: [_jsx(Label, { children: "Name" }), _jsx(Input, { value: name, onChange: e => setName(e.target.value), disabled: !isOwner })] }), _jsxs("div", { children: [_jsx(Label, { children: "Description" }), _jsx(Textarea, { value: description, onChange: e => setDescription(e.target.value), rows: 3, disabled: !isOwner })] }), _jsxs("div", { children: [_jsx(Label, { children: "Visibility" }), _jsxs("div", { className: "flex gap-4 text-sm", children: [_jsxs("label", { className: "flex items-center gap-2", children: [_jsx("input", { type: "radio", checked: visibility === 'public', onChange: () => setVisibility('public'), disabled: !isOwner }), " Public"] }), _jsxs("label", { className: "flex items-center gap-2", children: [_jsx("input", { type: "radio", checked: visibility === 'private', onChange: () => setVisibility('private'), disabled: !isOwner }), " Private"] })] })] }), _jsx(ErrorText, { children: err }), ok && _jsx("div", { className: "text-sm text-green-600", children: ok }), _jsxs("div", { className: "flex justify-between", children: [_jsx(Button, { type: "submit", disabled: !isOwner, children: "Save changes" }), isOwner && (_jsx(Button, { type: "button", variant: "danger", onClick: deleteRoom, children: "Delete room" }))] })] }));
}
