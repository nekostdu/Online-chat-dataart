export interface User {
  id: number;
  username: string;
  email: string | null;
  lastLoginAt?: string | null;
}

export interface Session {
  id: number;
  userAgent: string | null;
  ip: string | null;
  createdAt: string;
  lastSeenAt: string;
  current: boolean;
}

export type Presence = 'online' | 'afk' | 'offline';

export type ChatType = 'room' | 'dm';
export type RoomVisibility = 'public' | 'private';
export type MemberRole = 'owner' | 'admin' | 'member';

export interface Chat {
  id: number;
  type: ChatType;
  name: string | null;
  description: string | null;
  visibility: RoomVisibility | null;
  ownerId: number | null;
  memberCount: number;
  unreadCount: number;
  lastMessageAt: string | null;
  peer?: User; // filled for DMs
}

export interface ChatMember {
  userId: number;
  username: string;
  role: MemberRole;
  joinedAt: string;
}

export interface RoomBan {
  userId: number;
  username: string;
  bannedBy: number | null;
  bannedByUsername: string | null;
  bannedAt: string;
}

export interface Attachment {
  id: number;
  originalName: string;
  mimeType: string | null;
  sizeBytes: number;
  isImage: boolean;
  comment: string | null;
}

export interface Message {
  id: number;
  chatId: number;
  authorId: number | null;
  authorUsername: string | null;
  text: string | null;
  replyToId: number | null;
  replyTo?: MessagePreview;
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
  attachments: Attachment[];
}

export interface MessagePreview {
  id: number;
  authorId: number | null;
  authorUsername: string | null;
  text: string | null;
  deleted: boolean;
}

export interface FriendRequest {
  id: number;
  requester: User;
  addressee: User;
  status: 'pending' | 'accepted';
  message: string | null;
  createdAt: string;
}

export interface Friend {
  user: User;
  presence: Presence;
  since: string;
}

export interface Invitation {
  id: number;
  chatId: number;
  chatName: string;
  chatDescription: string | null;
  invitedBy: User | null;
  createdAt: string;
}
