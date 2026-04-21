import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Modal } from '@/components/Modal';
import { FriendsTab } from './FriendsTab';
import { RequestsTab } from './RequestsTab';
import { AddTab } from './AddTab';
import { BlockedTab } from './BlockedTab';
const TABS = ['friends', 'requests', 'add', 'blocked'];
export function ContactsModal({ open, onClose }) {
    const [tab, setTab] = useState('friends');
    return (_jsxs(Modal, { open: open, onClose: onClose, title: "Contacts", width: 640, children: [_jsx("div", { className: "flex gap-1 border-b border-gray-100 mb-4 -mx-5 px-5", children: TABS.map(t => (_jsx("button", { className: `px-3 py-2 text-sm rounded-t border-b-2 ${tab === t ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`, onClick: () => setTab(t), children: t[0].toUpperCase() + t.slice(1) }, t))) }), tab === 'friends' && _jsx(FriendsTab, { onClose: onClose }), tab === 'requests' && _jsx(RequestsTab, {}), tab === 'add' && _jsx(AddTab, {}), tab === 'blocked' && _jsx(BlockedTab, {})] }));
}
