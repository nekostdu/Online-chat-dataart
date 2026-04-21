import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '@/api/auth';
import { Button, Card, ErrorText, Input, Label } from '@/components/ui';
import { errorMessage } from '@/api/client';
export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState(null);
    async function submit(e) {
        e.preventDefault();
        setErr(null);
        setLoading(true);
        try {
            await authApi.requestReset(email);
            setSent(true);
        }
        catch (ex) {
            setErr(errorMessage(ex, 'Request failed'));
        }
        finally {
            setLoading(false);
        }
    }
    return (_jsx("div", { className: "min-h-full flex items-center justify-center p-6", children: _jsxs(Card, { className: "w-full max-w-md p-6", children: [_jsx("h1", { className: "text-xl font-semibold mb-4 text-center", children: "Forgot password" }), sent ? (_jsxs("div", { className: "text-center space-y-3", children: [_jsxs("p", { className: "text-sm text-gray-700", children: ["If the email is registered, a reset link has been sent. In local dev, open", ' ', _jsx("a", { href: "http://localhost:8025", target: "_blank", rel: "noreferrer", className: "text-brand-600 hover:underline", children: "MailHog" }), ' ', "to see the message."] }), _jsx(Link, { to: "/login", className: "text-brand-600 hover:underline text-sm", children: "Back to sign in" })] })) : (_jsxs("form", { onSubmit: submit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { children: "Email" }), _jsx(Input, { type: "email", value: email, onChange: e => setEmail(e.target.value), required: true })] }), _jsx(ErrorText, { children: err }), _jsx(Button, { type: "submit", disabled: loading, className: "w-full", children: "Send reset link" }), _jsx("div", { className: "text-sm text-center", children: _jsx(Link, { to: "/login", className: "text-brand-600 hover:underline", children: "Back to sign in" }) })] }))] }) }));
}
