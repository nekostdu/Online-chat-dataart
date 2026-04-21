import { Button } from '@/components/ui';

interface Props {
  username: string | undefined;
  onOpenCatalog: () => void;
  onOpenContacts: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
}

export function ChatHeader({ username, onOpenCatalog, onOpenContacts, onOpenProfile, onLogout }: Props) {
  return (
    <header className="h-12 px-4 bg-white border-b border-gray-100 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-4">
        <div className="font-bold text-brand-600">Chat</div>
        <button className="text-sm text-gray-600 hover:text-gray-900" onClick={onOpenCatalog}>
          Public rooms
        </button>
        <button className="text-sm text-gray-600 hover:text-gray-900" onClick={onOpenContacts}>
          Contacts
        </button>
        <button className="text-sm text-gray-600 hover:text-gray-900" onClick={onOpenProfile}>
          Sessions & profile
        </button>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <span className="text-gray-500">{username}</span>
        <Button variant="secondary" onClick={onLogout}>Sign out</Button>
      </div>
    </header>
  );
}
