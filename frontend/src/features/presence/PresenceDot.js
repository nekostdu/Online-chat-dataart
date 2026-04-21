import { jsx as _jsx } from "react/jsx-runtime";
export function PresenceDot({ presence, size = 10 }) {
    const color = {
        online: 'bg-emerald-500',
        afk: 'bg-amber-400',
        offline: 'bg-gray-300',
    }[presence ?? 'offline'];
    return (_jsx("span", { className: `inline-block rounded-full ${color}`, style: { width: size, height: size }, title: presence }));
}
