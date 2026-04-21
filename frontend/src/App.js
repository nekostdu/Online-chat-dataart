import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '@/store/authStore';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import ProfilePage from '@/pages/ProfilePage';
import ChatPage from '@/pages/ChatPage';
import RequireAuth from '@/components/RequireAuth';
export default function App() {
    const { init, initialized } = useAuth();
    useEffect(() => {
        if (!initialized)
            init();
    }, [init, initialized]);
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Navigate, { to: "/chat", replace: true }) }), _jsx(Route, { path: "/login", element: _jsx(LoginPage, {}) }), _jsx(Route, { path: "/register", element: _jsx(RegisterPage, {}) }), _jsx(Route, { path: "/forgot-password", element: _jsx(ForgotPasswordPage, {}) }), _jsx(Route, { path: "/reset-password", element: _jsx(ResetPasswordPage, {}) }), _jsx(Route, { path: "/chat", element: _jsx(RequireAuth, { children: _jsx(ChatPage, {}) }) }), _jsx(Route, { path: "/profile", element: _jsx(RequireAuth, { children: _jsx(ProfilePage, {}) }) }), _jsx(Route, { path: "*", element: _jsx("div", { className: "p-8", children: "404" }) })] }));
}
