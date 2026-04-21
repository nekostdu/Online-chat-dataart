import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { authApi } from '@/api/auth';
import { useAuth } from '@/store/authStore';
import { Button, Card, ErrorText, Input, Label } from '@/components/ui';
import { errorMessage } from '@/api/client';
dayjs.extend(relativeTime);
export default function ProfilePage() {
    const nav = useNavigate();
    const { user, logout } = useAuth();
    const [sessions, setSessions] = useState([]);
    const [curPw, setCurPw] = useState('');
    const [newPw, setNewPw] = useState('');
    const [pwStatus, setPwStatus] = useState(null);
    const [pwErr, setPwErr] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [revoking, setRevoking] = useState(null);
    useEffect(() => {
        loadSessions();
    }, []);
    async function loadSessions() {
        try {
            setSessions(await authApi.sessions());
        }
        catch (e) {
            console.error(e);
        }
    }
    async function changePassword(e) {
        e.preventDefault();
        setPwErr(null);
        setPwStatus(null);
        try {
            await authApi.changePassword(curPw, newPw);
            setPwStatus('Password updated.');
            setCurPw('');
            setNewPw('');
        }
        catch (ex) {
            setPwErr(errorMessage(ex, 'Password change failed'));
        }
    }
    async function revoke(s) {
        const msg = s.current
            ? 'Revoke THIS session? You will be signed out of this browser.'
            : 'Revoke this session? That device will be signed out.';
        if (!confirm(msg))
            return;
        setRevoking(s.id);
        try {
            await authApi.revokeSession(s.id);
            if (s.current) {
                await logout();
                nav('/login');
                return;
            }
            await loadSessions();
        }
        catch (ex) {
            alert(errorMessage(ex));
        }
        finally {
            setRevoking(null);
        }
    }
    async function deleteAccount() {
        if (!confirm('Delete your account? This cannot be undone. Your owned rooms will be removed.'))
            return;
        setDeleting(true);
        try {
            await authApi.deleteAccount();
            nav('/login');
        }
        catch (ex) {
            alert(errorMessage(ex));
        }
        finally {
            setDeleting(false);
        }
    }
    if (!user)
        return null;
    return (_jsxs("div", { className: "max-w-3xl mx-auto p-6 space-y-6", children: [_jsxs(Card, { className: "p-5", children: [_jsx("h2", { className: "text-lg font-semibold mb-4", children: "Profile" }), _jsxs("div", { className: "text-sm space-y-1", children: [_jsxs("div", { children: [_jsx("span", { className: "text-gray-500", children: "Username:" }), " ", user.username] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-500", children: "Email:" }), " ", user.email] }), user.lastLoginAt && (_jsxs("div", { children: [_jsx("span", { className: "text-gray-500", children: "Last login:" }), " ", dayjs(user.lastLoginAt).fromNow()] }))] })] }), _jsxs(Card, { className: "p-5", children: [_jsx("h2", { className: "text-lg font-semibold mb-4", children: "Change password" }), _jsxs("form", { onSubmit: changePassword, className: "space-y-3 max-w-sm", children: [_jsxs("div", { children: [_jsx(Label, { children: "Current password" }), _jsx(Input, { type: "password", value: curPw, onChange: e => setCurPw(e.target.value), required: true })] }), _jsxs("div", { children: [_jsx(Label, { children: "New password" }), _jsx(Input, { type: "password", value: newPw, onChange: e => setNewPw(e.target.value), required: true, minLength: 8 })] }), _jsx(ErrorText, { children: pwErr }), pwStatus && _jsx("div", { className: "text-sm text-green-600", children: pwStatus }), _jsx(Button, { type: "submit", children: "Update password" })] })] }), _jsxs(Card, { className: "p-5", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h2", { className: "text-lg font-semibold", children: "Active sessions" }), _jsx(Button, { variant: "ghost", onClick: loadSessions, children: "Refresh" })] }), _jsxs("ul", { className: "space-y-3", children: [sessions.length === 0 && (_jsx("li", { className: "text-sm text-gray-500", children: "No active sessions." })), sessions.map(s => (_jsx("li", { className: `rounded-lg border p-4 ${s.current ? 'border-brand-300 bg-brand-50/40' : 'border-gray-100 bg-white'}`, children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsxs("div", { className: "flex-1 min-w-0 space-y-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "font-medium text-gray-900", children: shortAgent(s.userAgent) }), s.current && (_jsx("span", { className: "inline-flex items-center rounded-full bg-brand-500 text-white text-xs px-2 py-0.5", children: "this device" }))] }), _jsx("div", { className: "text-xs text-gray-600 font-mono break-all", title: s.userAgent ?? '', children: s.userAgent ?? '—' }), _jsxs("div", { className: "text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1", children: [_jsxs("span", { children: [_jsx("span", { className: "text-gray-400", children: "IP:" }), " ", s.ip ?? '—'] }), _jsxs("span", { children: [_jsx("span", { className: "text-gray-400", children: "Signed in:" }), " ", dayjs(s.createdAt).fromNow()] }), _jsxs("span", { children: [_jsx("span", { className: "text-gray-400", children: "Last active:" }), " ", dayjs(s.lastSeenAt).fromNow()] })] })] }), _jsx(Button, { variant: s.current ? 'secondary' : 'danger', disabled: revoking === s.id, onClick: () => revoke(s), children: revoking === s.id ? 'Revoking…' : s.current ? 'Sign out here' : 'Revoke' })] }) }, s.id)))] })] }), _jsxs(Card, { className: "p-5 border-red-100", children: [_jsx("h2", { className: "text-lg font-semibold mb-2 text-red-600", children: "Danger zone" }), _jsx("p", { className: "text-sm text-gray-600 mb-3", children: "Deleting your account removes your owned rooms (and their messages/files) permanently." }), _jsx(Button, { variant: "danger", onClick: deleteAccount, disabled: deleting, children: "Delete account" })] })] }));
}
function shortAgent(ua) {
    if (!ua)
        return 'Unknown device';
    const browser = /Firefox\/[\d.]+/.exec(ua)?.[0] ||
        /Edg\/[\d.]+/.exec(ua)?.[0] ||
        /OPR\/[\d.]+/.exec(ua)?.[0] ||
        /Chrome\/[\d.]+/.exec(ua)?.[0] ||
        /Safari\/[\d.]+/.exec(ua)?.[0] ||
        'Browser';
    const os = /Mac OS X [\d_]+/.test(ua) ? 'macOS'
        : /Windows NT [\d.]+/.test(ua) ? 'Windows'
            : /Linux/.test(ua) ? 'Linux'
                : /Android/.test(ua) ? 'Android'
                    : /iPhone|iPad/.test(ua) ? 'iOS'
                        : 'Unknown OS';
    return `${browser.split('/')[0]} on ${os}`;
}
