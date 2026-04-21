import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { authApi } from '@/api/auth';
import { Button, Card, ErrorText, Input, Label } from '@/components/ui';
import { errorMessage } from '@/api/client';
export default function ResetPasswordPage() {
    const [params] = useSearchParams();
    const nav = useNavigate();
    const token = params.get('token') ?? '';
    const [pw, setPw] = useState('');
    const [pw2, setPw2] = useState('');
    const [err, setErr] = useState(null);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    async function submit(e) {
        e.preventDefault();
        setErr(null);
        if (pw !== pw2) {
            setErr('Passwords do not match');
            return;
        }
        setLoading(true);
        try {
            await authApi.confirmReset(token, pw);
            setDone(true);
            setTimeout(() => nav('/login'), 1500);
        }
        catch (ex) {
            setErr(errorMessage(ex, 'Reset failed'));
        }
        finally {
            setLoading(false);
        }
    }
    if (!token) {
        return (_jsxs("div", { className: "p-6 text-center", children: [_jsx("p", { children: "Missing reset token." }), _jsx(Link, { to: "/forgot-password", className: "text-brand-600 hover:underline", children: "Request again" })] }));
    }
    return (_jsx("div", { className: "min-h-full flex items-center justify-center p-6", children: _jsxs(Card, { className: "w-full max-w-md p-6", children: [_jsx("h1", { className: "text-xl font-semibold mb-4 text-center", children: "Set a new password" }), done ? (_jsx("p", { className: "text-sm text-center", children: "Password updated. Redirecting to sign in\u2026" })) : (_jsxs("form", { onSubmit: submit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { children: "New password" }), _jsx(Input, { type: "password", value: pw, onChange: e => setPw(e.target.value), required: true, minLength: 8 })] }), _jsxs("div", { children: [_jsx(Label, { children: "Confirm password" }), _jsx(Input, { type: "password", value: pw2, onChange: e => setPw2(e.target.value), required: true, minLength: 8 })] }), _jsx(ErrorText, { children: err }), _jsx(Button, { type: "submit", disabled: loading, className: "w-full", children: "Save new password" })] }))] }) }));
}
