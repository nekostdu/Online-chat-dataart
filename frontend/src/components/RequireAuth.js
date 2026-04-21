import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/store/authStore';
export default function RequireAuth({ children }) {
    const { user, initialized } = useAuth();
    const location = useLocation();
    if (!initialized)
        return _jsx("div", { className: "p-8 text-gray-400", children: "Loading\u2026" });
    if (!user)
        return _jsx(Navigate, { to: "/login", state: { from: location }, replace: true });
    return _jsx(_Fragment, { children: children });
}
