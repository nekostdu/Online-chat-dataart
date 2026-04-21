import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Modal } from '@/components/Modal';
import { useAuth } from '@/store/authStore';
import { MembersTab } from './manage/MembersTab';
import { AdminsTab } from './manage/AdminsTab';
import { BannedTab } from './manage/BannedTab';
import { InvitesTab } from './manage/InvitesTab';
import { SettingsTab } from './manage/SettingsTab';
const TABS = ['members', 'admins', 'banned', 'invitations', 'settings'];
export function ManageRoomModal({ open, onClose, chat }) {
    const [tab, setTab] = useState('members');
    const { user } = useAuth();
    const isOwner = !!user && chat.ownerId === user.id;
    return (_jsxs(Modal, { open: open, onClose: onClose, title: `Manage room: ${chat.name ?? ''}`, width: 680, children: [_jsx("div", { className: "flex gap-1 border-b border-gray-100 mb-4 -mx-5 px-5", children: TABS.map(t => (_jsx("button", { className: `px-3 py-2 text-sm rounded-t border-b-2 ${tab === t ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`, onClick: () => setTab(t), children: t[0].toUpperCase() + t.slice(1) }, t))) }), tab === 'members' && _jsx(MembersTab, { chat: chat, isOwner: isOwner }), tab === 'admins' && _jsx(AdminsTab, { chat: chat, isOwner: isOwner }), tab === 'banned' && _jsx(BannedTab, { chat: chat }), tab === 'invitations' && _jsx(InvitesTab, { chat: chat }), tab === 'settings' && _jsx(SettingsTab, { chat: chat, isOwner: isOwner, onClose: onClose })] }));
}
