import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
export function Modal({ open, onClose, title, children, width = 520 }) {
    useEffect(() => {
        if (!open)
            return;
        const handler = (e) => {
            if (e.key === 'Escape')
                onClose();
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [open, onClose]);
    if (!open)
        return null;
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/40", onClick: onClose, children: _jsxs("div", { className: "rounded-lg bg-white shadow-xl overflow-hidden max-h-[90vh] flex flex-col", style: { width }, onClick: e => e.stopPropagation(), children: [title !== undefined && (_jsxs("div", { className: "px-5 py-3 border-b border-gray-100 flex items-center justify-between", children: [_jsx("div", { className: "font-semibold text-gray-900", children: title }), _jsx("button", { className: "text-gray-400 hover:text-gray-600 text-xl leading-none", onClick: onClose, "aria-label": "close", children: "\u00D7" })] })), _jsx("div", { className: "p-5 overflow-y-auto", children: children })] }) }));
}
