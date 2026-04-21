import { useState } from 'react';
import { Modal } from '@/components/Modal';
import { useAuth } from '@/store/authStore';
import type { Chat } from '@/api/types';
import { MembersTab } from './manage/MembersTab';
import { AdminsTab } from './manage/AdminsTab';
import { BannedTab } from './manage/BannedTab';
import { InvitesTab } from './manage/InvitesTab';
import { SettingsTab } from './manage/SettingsTab';

type Tab = 'members' | 'admins' | 'banned' | 'invitations' | 'settings';
const TABS: Tab[] = ['members', 'admins', 'banned', 'invitations', 'settings'];

interface Props {
  open: boolean;
  onClose: () => void;
  chat: Chat;
}

export function ManageRoomModal({ open, onClose, chat }: Props) {
  const [tab, setTab] = useState<Tab>('members');
  const { user } = useAuth();
  const isOwner = !!user && chat.ownerId === user.id;

  return (
    <Modal open={open} onClose={onClose} title={`Manage room: ${chat.name ?? ''}`} width={680}>
      <div className="flex gap-1 border-b border-gray-100 mb-4 -mx-5 px-5">
        {TABS.map(t => (
          <button
            key={t}
            className={`px-3 py-2 text-sm rounded-t border-b-2 ${tab === t ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
            onClick={() => setTab(t)}
          >
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'members'     && <MembersTab  chat={chat} isOwner={isOwner} />}
      {tab === 'admins'      && <AdminsTab   chat={chat} isOwner={isOwner} />}
      {tab === 'banned'      && <BannedTab   chat={chat} />}
      {tab === 'invitations' && <InvitesTab  chat={chat} />}
      {tab === 'settings'    && <SettingsTab chat={chat} isOwner={isOwner} onClose={onClose} />}
    </Modal>
  );
}
