import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Button, ErrorText, Input, Label } from '@/components/ui';
import { roomsApi } from '@/api/rooms';
import { errorMessage } from '@/api/client';
export function InvitesTab({ chat }) {
    const [username, setUsername] = useState('');
    const [msg, setMsg] = useState(null);
    const [err, setErr] = useState(null);
    async function send(e) {
        e.preventDefault();
        setErr(null);
        setMsg(null);
        try {
            await roomsApi.invite(chat.id, { username: username.trim() });
            setMsg(`Invitation sent to ${username.trim()}.`);
            setUsername('');
        }
        catch (e) {
            setErr(errorMessage(e));
        }
    }
    return (_jsxs("form", { onSubmit: send, className: "space-y-3 max-w-md", children: [_jsx(Label, { children: "Invite by username" }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Input, { value: username, onChange: e => setUsername(e.target.value), placeholder: "username", required: true }), _jsx(Button, { type: "submit", children: "Send invite" })] }), msg && _jsx("div", { className: "text-sm text-green-600", children: msg }), _jsx(ErrorText, { children: err })] }));
}
