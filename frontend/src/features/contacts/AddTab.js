import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Button, ErrorText, Input, Label } from '@/components/ui';
import { friendsApi } from '@/api/friends';
import { errorMessage } from '@/api/client';
export function AddTab() {
    const [username, setUsername] = useState('');
    const [message, setMessage] = useState('');
    const [ok, setOk] = useState(null);
    const [err, setErr] = useState(null);
    async function submit(e) {
        e.preventDefault();
        setOk(null);
        setErr(null);
        try {
            await friendsApi.send({ username: username.trim(), message: message.trim() || undefined });
            setOk(`Request sent to ${username.trim()}.`);
            setUsername('');
            setMessage('');
        }
        catch (e) {
            setErr(errorMessage(e));
        }
    }
    return (_jsxs("form", { onSubmit: submit, className: "space-y-3 max-w-md", children: [_jsxs("div", { children: [_jsx(Label, { children: "Username" }), _jsx(Input, { value: username, onChange: e => setUsername(e.target.value), required: true })] }), _jsxs("div", { children: [_jsx(Label, { children: "Message (optional)" }), _jsx(Input, { value: message, onChange: e => setMessage(e.target.value), maxLength: 500 })] }), ok && _jsx("div", { className: "text-sm text-green-600", children: ok }), _jsx(ErrorText, { children: err }), _jsx(Button, { type: "submit", children: "Send friend request" })] }));
}
