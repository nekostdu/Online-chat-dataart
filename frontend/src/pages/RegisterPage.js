import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/store/authStore';
import { Button, Card, ErrorText, Input, Label } from '@/components/ui';
import { errorMessage } from '@/api/client';
export default function RegisterPage() {
    const nav = useNavigate();
    const { register, loading } = useAuth();
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [pw, setPw] = useState('');
    const [pw2, setPw2] = useState('');
    const [err, setErr] = useState(null);
    async function submit(e) {
        e.preventDefault();
        setErr(null);
        if (pw !== pw2) {
            setErr('Passwords do not match');
            return;
        }
        try {
            await register(email, username, pw);
            nav('/chat');
        }
        catch (ex) {
            setErr(errorMessage(ex, 'Registration failed'));
        }
    }
    return (_jsxs("div", { className: "min-h-full flex flex-col", children: [_jsxs("header", { className: "px-6 py-4 bg-white border-b border-gray-100 flex justify-between items-center", children: [_jsx("div", { className: "font-bold text-brand-600 text-lg", children: "ChatLogo" }), _jsxs("div", { className: "text-sm", children: [_jsx(Link, { to: "/login", className: "mr-4 text-gray-600 hover:text-gray-900", children: "Sign in" }), _jsx(Link, { to: "/register", className: "text-brand-600 font-medium", children: "Register" })] })] }), _jsx("div", { className: "flex-1 flex items-center justify-center p-6", children: _jsxs(Card, { className: "w-full max-w-md p-6", children: [_jsx("h1", { className: "text-xl font-semibold mb-5 text-center", children: "Create account" }), _jsxs("form", { onSubmit: submit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { children: "Email" }), _jsx(Input, { type: "email", value: email, onChange: e => setEmail(e.target.value), required: true })] }), _jsxs("div", { children: [_jsx(Label, { children: "Username" }), _jsx(Input, { value: username, onChange: e => setUsername(e.target.value), required: true, minLength: 3, maxLength: 32, pattern: "[a-zA-Z0-9_.\\-]{3,32}" }), _jsx("div", { className: "text-xs text-gray-500 mt-1", children: "3\u201332 chars, letters, digits, . _ -" })] }), _jsxs("div", { children: [_jsx(Label, { children: "Password" }), _jsx(Input, { type: "password", value: pw, onChange: e => setPw(e.target.value), required: true, minLength: 8 })] }), _jsxs("div", { children: [_jsx(Label, { children: "Confirm password" }), _jsx(Input, { type: "password", value: pw2, onChange: e => setPw2(e.target.value), required: true, minLength: 8 })] }), _jsx(ErrorText, { children: err }), _jsx(Button, { type: "submit", disabled: loading, className: "w-full", children: "Create account" }), _jsxs("div", { className: "text-sm text-center text-gray-600 pt-2 border-t border-gray-100", children: ["Have account? ", _jsx(Link, { to: "/login", className: "text-brand-600 hover:underline", children: "Sign in" })] })] })] }) })] }));
}
