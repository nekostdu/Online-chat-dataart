import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/store/authStore';
import { useChats } from '@/store/chatStore';
import { PublicCatalogModal } from '@/features/rooms/PublicCatalogModal';
import { CreateRoomModal } from '@/features/rooms/CreateRoomModal';
import { ManageRoomModal } from '@/features/rooms/ManageRoomModal';
import { ContactsModal } from '@/features/contacts/ContactsModal';
import { messagesApi } from '@/api/messages';
import { invitationsApi, roomsApi } from '@/api/rooms';
import { blocksApi, friendsApi } from '@/api/friends';
import { errorMessage } from '@/api/client';
import { ChatHeader } from './chat/ChatHeader';
import { Sidebar } from './chat/Sidebar';
import { MainArea } from './chat/MainArea';
import { RoomRightPanel } from './chat/RoomRightPanel';
import { DmRightPanel } from './chat/DmRightPanel';
import { useActivityReporting, useChatPresence } from './chat/useChatPresence';
import { useChatBootstrap, useChatSubscriptions } from './chat/useChatBootstrap';
export default function ChatPage() {
    const nav = useNavigate();
    const { user, logout } = useAuth();
    const chatStore = useChats();
    const [catalogOpen, setCatalogOpen] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);
    const [manageOpen, setManageOpen] = useState(false);
    const [contactsOpen, setContactsOpen] = useState(false);
    const [replyTo, setReplyTo] = useState(null);
    const [editing, setEditing] = useState(null);
    const [invitations, setInvitations] = useState([]);
    const [friends, setFriends] = useState([]);
    const [blocks, setBlocks] = useState([]);
    const [members, setMembers] = useState([]);
    const selected = chatStore.chats.find(c => c.id === chatStore.selectedId) ?? null;
    const myMembership = members.find(m => m.userId === user?.id);
    const amAdmin = !!myMembership && (myMembership.role === 'owner' || myMembership.role === 'admin');
    const markRead = (chatId, messageId) => {
        messagesApi.markRead(chatId, messageId).catch(() => { });
    };
    const handleChatEvent = useCallback((evt) => {
        if (!evt)
            return;
        if (evt.type === 'message') {
            const msg = evt.payload;
            const known = chatStore.chats.some(c => c.id === msg.chatId);
            if (!known)
                chatStore.loadChats().then(() => chatStore.applyIncoming(msg));
            else
                chatStore.applyIncoming(msg);
            if (selected?.id === msg.chatId && msg.authorId !== user?.id)
                markRead(msg.chatId, msg.id);
        }
        else if (evt.type === 'message.updated') {
            chatStore.applyUpdated(evt.payload);
        }
        else if (evt.type === 'read') {
            chatStore.applyRead(evt.chatId, evt.userId, evt.lastReadMessageId);
        }
        else if (evt.type === 'chat.deleted') {
            chatStore.removeChat(evt.chatId);
        }
        else if (evt.type === 'chat.created') {
            chatStore.loadChats();
        }
        else if (evt.type === 'invitation.new') {
            invitationsApi.mine().then(setInvitations).catch(() => { });
        }
        else if (evt.type === 'friends.changed') {
            friendsApi.list().then(setFriends).catch(() => { });
            blocksApi.list().then(list => setBlocks(list.map(b => b.user.id))).catch(() => { });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chatStore, selected?.id, user?.id]);
    useChatBootstrap(user, { setInvitations, setFriends, setBlocks });
    useChatSubscriptions(user, selected?.id ?? null, selected?.type === 'room', handleChatEvent);
    useActivityReporting(!!user);
    useChatPresence(user, friends, members);
    // --- load chat history + members on selection ---
    useEffect(() => {
        if (!selected) {
            setMembers([]);
            return;
        }
        chatStore.ensureHistory(selected.id);
        if (selected.type === 'room') {
            roomsApi.members(selected.id).then(setMembers).catch(() => setMembers([]));
        }
        else {
            setMembers([]);
        }
        markRead(selected.id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selected?.id]);
    async function doLogout() {
        await logout();
        nav('/login');
    }
    async function acceptInvite(id) {
        try {
            const res = await invitationsApi.accept(id);
            await chatStore.loadChats();
            setInvitations(invitations.filter(i => i.id !== id));
            chatStore.select(res.chatId);
        }
        catch (e) {
            alert(errorMessage(e));
        }
    }
    async function declineInvite(id) {
        await invitationsApi.decline(id);
        setInvitations(invitations.filter(i => i.id !== id));
    }
    // DM between friends who later blocked each other: history visible, composer read-only (req 2.3.5).
    const dmStatus = useMemo(() => {
        if (!selected || selected.type !== 'dm' || !selected.peer)
            return { disabled: false };
        const peerId = selected.peer.id;
        if (blocks.includes(peerId))
            return { disabled: true, reason: 'You have blocked this user.' };
        const isFriend = friends.some(f => f.user.id === peerId);
        if (!isFriend)
            return { disabled: true, reason: 'You are no longer friends — messaging is disabled.' };
        return { disabled: false };
    }, [selected?.id, selected?.type, selected?.peer?.id, friends, blocks]);
    return (_jsxs("div", { className: "h-full flex flex-col", children: [_jsx(ChatHeader, { username: user?.username, onOpenCatalog: () => setCatalogOpen(true), onOpenContacts: () => setContactsOpen(true), onOpenProfile: () => nav('/profile'), onLogout: doLogout }), _jsxs("div", { className: "flex-1 flex min-h-0", children: [_jsx(Sidebar, { chats: chatStore.chats, invitations: invitations, onCreateRoom: () => setCreateOpen(true), onAcceptInvite: acceptInvite, onDeclineInvite: declineInvite }), _jsx("section", { className: "flex-1 flex flex-col min-w-0", children: !selected ? (_jsx("div", { className: "flex-1 flex items-center justify-center text-gray-400", children: "Pick a chat from the left, or create one." })) : (_jsx(MainArea, { selected: selected, currentUser: user, canDeleteOthers: amAdmin, replyTo: replyTo, editing: editing, setReplyTo: setReplyTo, setEditing: setEditing, dmDisabled: dmStatus.disabled, dmDisabledReason: dmStatus.reason, onManageRoom: () => setManageOpen(true) })) }), selected && (_jsx("aside", { className: "w-60 bg-white border-l border-gray-100 overflow-y-auto shrink-0", children: selected.type === 'room' ? (_jsx(RoomRightPanel, { chat: selected, members: members, friendIds: new Set(friends.map(f => f.user.id)), myId: user?.id })) : (_jsx(DmRightPanel, { chat: selected })) }))] }), _jsx(PublicCatalogModal, { open: catalogOpen, onClose: () => setCatalogOpen(false) }), _jsx(CreateRoomModal, { open: createOpen, onClose: () => setCreateOpen(false) }), selected?.type === 'room' && (_jsx(ManageRoomModal, { open: manageOpen, onClose: () => setManageOpen(false), chat: selected })), _jsx(ContactsModal, { open: contactsOpen, onClose: () => setContactsOpen(false) })] }));
}
