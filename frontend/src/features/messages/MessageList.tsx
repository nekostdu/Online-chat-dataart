import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import type { Message, User } from '@/api/types';
import { attachmentsApi } from '@/api/messages';
import { useAuth } from '@/store/authStore';

interface Props {
  messages: Message[];
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  onReply: (msg: Message) => void;
  onEdit: (msg: Message) => void;
  onDelete: (msg: Message) => void;
  canDeleteOthers: boolean;
  currentUser: User | null;
}

export function MessageList(props: Props) {
  const { messages, hasMore, loading, onLoadMore, onReply, onEdit, onDelete, canDeleteOthers, currentUser } = props;
  const scroller = useRef<HTMLDivElement>(null);
  const [stickBottom, setStickBottom] = useState(true);
  const prevLenRef = useRef(messages.length);
  const prevScrollHeightRef = useRef(0);

  // Rule 4.2: autoscroll only if user is near the bottom.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const prevLen = prevLenRef.current;
    const newLen = messages.length;
    prevLenRef.current = newLen;

    if (newLen > prevLen) {
      const addedAtTop = newLen > prevLen && messages[0] && prevLen > 0;
      if (addedAtTop && !stickBottom) {
        // We prepended older messages; preserve scroll position.
        el.scrollTop = el.scrollHeight - prevScrollHeightRef.current;
      } else if (stickBottom) {
        el.scrollTop = el.scrollHeight;
      }
    }
    prevScrollHeightRef.current = el.scrollHeight;
  }, [messages, stickBottom]);

  // Initial scroll-to-bottom on mount / chat-change.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    setStickBottom(true);
  }, [messages.length === 0]);

  function onScroll() {
    const el = scroller.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setStickBottom(nearBottom);
    if (el.scrollTop < 40 && hasMore && !loading) {
      onLoadMore();
    }
  }

  return (
    <div
      ref={scroller}
      onScroll={onScroll}
      className="flex-1 overflow-y-auto px-4 py-2 space-y-2 bg-white"
    >
      {loading && <div className="text-center text-xs text-gray-400 py-2">Loading…</div>}
      {!hasMore && messages.length > 0 && (
        <div className="text-center text-xs text-gray-400 py-2">— beginning of conversation —</div>
      )}
      {messages.map(m => (
        <MessageItem
          key={m.id}
          message={m}
          isMine={!!currentUser && m.authorId === currentUser.id}
          canDeleteOthers={canDeleteOthers}
          onReply={onReply}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

function MessageItem({
  message, isMine, canDeleteOthers, onReply, onEdit, onDelete,
}: {
  message: Message;
  isMine: boolean;
  canDeleteOthers: boolean;
  onReply: (m: Message) => void;
  onEdit: (m: Message) => void;
  onDelete: (m: Message) => void;
}) {
  const deleted = !!message.deletedAt;
  const canDelete = isMine || canDeleteOthers;

  return (
    <div className="group flex gap-3 hover:bg-gray-50 rounded p-1">
      <div className="pt-0.5 text-xs text-gray-400 w-14 shrink-0 tabular-nums">
        {dayjs(message.createdAt).format('HH:mm')}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm">
          <span className="font-medium text-gray-900">{message.authorUsername ?? '(deleted)'}</span>
          {message.editedAt && !deleted && <span className="text-xs text-gray-400 ml-2">(edited)</span>}
        </div>
        {message.replyTo && (
          <div className="mt-1 pl-2 border-l-2 border-brand-200 bg-brand-50 text-xs text-gray-600 rounded-sm py-1 px-2">
            <span className="font-medium">{message.replyTo.authorUsername ?? '(deleted)'}:</span>{' '}
            {message.replyTo.deleted ? <em className="text-gray-400">message deleted</em> : truncate(message.replyTo.text)}
          </div>
        )}
        {deleted ? (
          <div className="text-sm text-gray-400 italic">message deleted</div>
        ) : (
          <>
            {message.text && <div className="text-sm whitespace-pre-wrap break-words">{message.text}</div>}
            {message.attachments.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-2">
                {message.attachments.map(a => (
                  <AttachmentTile key={a.id} a={a} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
      {!deleted && (
        <div className="opacity-0 group-hover:opacity-100 text-xs text-gray-500 flex items-start gap-2 transition">
          <button className="hover:text-brand-600" onClick={() => onReply(message)}>Reply</button>
          {isMine && <button className="hover:text-brand-600" onClick={() => onEdit(message)}>Edit</button>}
          {canDelete && <button className="hover:text-red-600" onClick={() => onDelete(message)}>Delete</button>}
        </div>
      )}
    </div>
  );
}

function AttachmentTile({ a }: { a: Message['attachments'][number] }) {
  const href = attachmentsApi.url(a.id);
  if (a.isImage) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className="block">
        <img
          src={href}
          alt={a.originalName}
          className="max-h-56 rounded border border-gray-200"
        />
        {a.comment && <div className="text-xs text-gray-500 mt-0.5 max-w-xs">{a.comment}</div>}
      </a>
    );
  }
  return (
    <a
      href={href}
      className="inline-flex items-center gap-2 rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm hover:bg-gray-100"
      download={a.originalName}
    >
      <span role="img" aria-label="file">📎</span>
      <div>
        <div className="font-medium text-gray-800">{a.originalName}</div>
        <div className="text-xs text-gray-500">{formatSize(a.sizeBytes)}</div>
        {a.comment && <div className="text-xs text-gray-500">{a.comment}</div>}
      </div>
    </a>
  );
}

function truncate(s: string | null | undefined, n = 160) {
  if (!s) return '';
  return s.length > n ? s.slice(0, n) + '…' : s;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
