import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/store/authStore';
import { Button, Card, ErrorText, Input, Label } from '@/components/ui';
import { errorMessage } from '@/api/client';
export default function LoginPage() {
    const nav = useNavigate();
    const { login, loading } = useAuth();
    const [id, setId] = useState('');
    const [pw, setPw] = useState('');
    const [err, setErr] = useState(null);
    async function submit(e) {
        e.preventDefault();
        setErr(null);
        try {
            await login(id, pw);
            nav('/chat');
        }
        catch (ex) {
            setErr(errorMessage(ex, 'Sign-in failed'));
        }
    }
    return (_jsxs("div", { className: "min-h-full flex flex-col", children: [_jsxs("header", { className: "px-6 py-4 bg-white border-b border-gray-100 flex justify-between items-center", children: [_jsx("div", { className: "font-bold text-brand-600 text-lg", children: "ChatLogo" }), _jsxs("div", { className: "text-sm", children: [_jsx(Link, { to: "/login", className: "mr-4 text-brand-600 font-medium", children: "Sign in" }), _jsx(Link, { to: "/register", className: "text-gray-600 hover:text-gray-900", children: "Register" })] })] }), _jsx("div", { className: "flex-1 flex items-center justify-center p-6", children: _jsxs(Card, { className: "w-full max-w-md p-6", children: [_jsx("h1", { className: "text-xl font-semibold mb-5 text-center", children: "Sign in" }), _jsxs("form", { onSubmit: submit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { children: "Email or username" }), _jsx(Input, { autoFocus: true, value: id, onChange: e => setId(e.target.value), placeholder: "you@example.com", required: true })] }), _jsxs("div", { children: [_jsx(Label, { children: "Password" }), _jsx(Input, { type: "password", value: pw, onChange: e => setPw(e.target.value), required: true })] }), _jsx(ErrorText, { children: err }), _jsx(Button, { type: "submit", disabled: loading, className: "w-full", children: "Sign in" }), _jsx("div", { className: "text-sm text-center text-gray-500", children: _jsx(Link, { to: "/forgot-password", className: "text-brand-600 hover:underline", children: "Forgot password?" }) }), _jsxs("div", { className: "text-sm text-center text-gray-600 pt-2 border-t border-gray-100", children: ["No account? ", _jsx(Link, { to: "/register", className: "text-brand-600 hover:underline", children: "Create one" })] })] })] }) })] }));
}
