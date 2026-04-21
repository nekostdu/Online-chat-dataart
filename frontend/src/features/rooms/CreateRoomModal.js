import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Modal } from '@/components/Modal';
import { Button, ErrorText, Input, Label, Textarea } from '@/components/ui';
import { roomsApi } from '@/api/rooms';
import { errorMessage } from '@/api/client';
import { useChats } from '@/store/chatStore';
export function CreateRoomModal({ open, onClose }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [visibility, setVisibility] = useState('public');
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState(null);
    const { loadChats, select } = useChats();
    async function submit(e) {
        e.preventDefault();
        setErr(null);
        setLoading(true);
        try {
            const room = await roomsApi.create(name, description, visibility);
            await loadChats();
            select(room.id);
            reset();
            onClose();
        }
        catch (e) {
            setErr(errorMessage(e));
        }
        finally {
            setLoading(false);
        }
    }
    function reset() {
        setName('');
        setDescription('');
        setVisibility('public');
        setErr(null);
    }
    return (_jsx(Modal, { open: open, onClose: () => { reset(); onClose(); }, title: "Create room", children: _jsxs("form", { onSubmit: submit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { children: "Name" }), _jsx(Input, { value: name, onChange: e => setName(e.target.value), required: true, minLength: 3, maxLength: 64, placeholder: "general" }), _jsx("div", { className: "text-xs text-gray-500 mt-1", children: "3\u201364 chars: letters, digits, space, . _ -" })] }), _jsxs("div", { children: [_jsx(Label, { children: "Description" }), _jsx(Textarea, { value: description, onChange: e => setDescription(e.target.value), maxLength: 500, rows: 3, placeholder: "Optional" })] }), _jsxs("div", { children: [_jsx(Label, { children: "Visibility" }), _jsxs("div", { className: "flex gap-4 text-sm", children: [_jsxs("label", { className: "flex items-center gap-2", children: [_jsx("input", { type: "radio", name: "vis", checked: visibility === 'public', onChange: () => setVisibility('public') }), "Public (listed in catalog)"] }), _jsxs("label", { className: "flex items-center gap-2", children: [_jsx("input", { type: "radio", name: "vis", checked: visibility === 'private', onChange: () => setVisibility('private') }), "Private (invite only)"] })] })] }), _jsx(ErrorText, { children: err }), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx(Button, { type: "button", variant: "secondary", onClick: () => { reset(); onClose(); }, children: "Cancel" }), _jsx(Button, { type: "submit", disabled: loading, children: "Create" })] })] }) }));
}
