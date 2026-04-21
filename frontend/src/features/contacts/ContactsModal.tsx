import { useState } from 'react';
import { Modal } from '@/components/Modal';
import { FriendsTab } from './FriendsTab';
import { RequestsTab } from './RequestsTab';
import { AddTab } from './AddTab';
import { BlockedTab } from './BlockedTab';

type Tab = 'friends' | 'requests' | 'add' | 'blocked';
const TABS: Tab[] = ['friends', 'requests', 'add', 'blocked'];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ContactsModal({ open, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('friends');
  return (
    <Modal open={open} onClose={onClose} title="Contacts" width={640}>
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
      {tab === 'friends'  && <FriendsTab onClose={onClose} />}
      {tab === 'requests' && <RequestsTab />}
      {tab === 'add'      && <AddTab />}
      {tab === 'blocked'  && <BlockedTab />}
    </Modal>
  );
}
