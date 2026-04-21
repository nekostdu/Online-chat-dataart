import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { blocksApi } from '@/api/friends';
export function BlockedTab() {
    const [list, setList] = useState([]);
    useEffect(() => { blocksApi.list().then(setList).catch(() => { }); }, []);
    async function unblock(userId) {
        await blocksApi.unblock(userId);
        setList(await blocksApi.list());
    }
    return (_jsxs("div", { children: [list.length === 0 && _jsx("div", { className: "text-sm text-gray-500", children: "No blocked users." }), _jsx("ul", { className: "divide-y divide-gray-100", children: list.map(b => (_jsxs("li", { className: "py-2 flex items-center gap-3", children: [_jsx("div", { className: "flex-1 font-medium", children: b.user.username }), _jsx(Button, { variant: "secondary", onClick: () => unblock(b.user.id), children: "Unblock" })] }, b.user.id))) })] }));
}
