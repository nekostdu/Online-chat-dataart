import { jsx as _jsx } from "react/jsx-runtime";
export function Button({ variant = 'primary', className = '', ...rest }) {
    const base = 'inline-flex items-center justify-center gap-2 rounded px-4 py-2 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed';
    const styles = {
        primary: 'bg-brand-500 hover:bg-brand-600 text-white',
        secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-200',
        danger: 'bg-red-500 hover:bg-red-600 text-white',
        ghost: 'bg-transparent hover:bg-gray-100 text-gray-700',
    }[variant];
    return _jsx("button", { className: `${base} ${styles} ${className}`, ...rest });
}
export function Input({ className = '', ...rest }) {
    return (_jsx("input", { className: `w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 ${className}`, ...rest }));
}
export function Textarea({ className = '', ...rest }) {
    return (_jsx("textarea", { className: `w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 ${className}`, ...rest }));
}
export function Label({ children, htmlFor }) {
    return _jsx("label", { htmlFor: htmlFor, className: "block text-sm font-medium text-gray-700 mb-1", children: children });
}
export function ErrorText({ children }) {
    if (!children)
        return null;
    return _jsx("div", { className: "text-sm text-red-600 mt-1", children: children });
}
export function Card({ children, className = '' }) {
    return _jsx("div", { className: `rounded-lg bg-white shadow-sm border border-gray-100 ${className}`, children: children });
}
