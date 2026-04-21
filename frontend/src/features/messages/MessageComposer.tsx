import { useEffect, useRef, useState, FormEvent, KeyboardEvent } from 'react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { messagesApi, attachmentsApi, UploadedAttachment } from '@/api/messages';
import { errorMessage } from '@/api/client';
import type { Message } from '@/api/types';

interface Props {
  chatId: number;
  replyTo?: Message | null;
  clearReply: () => void;
  editing?: Message | null;
  clearEditing: () => void;
  disabled?: boolean;
  disabledReason?: string;
}

export function MessageComposer(props: Props) {
  const { chatId, replyTo, clearReply, editing, clearEditing, disabled, disabledReason } = props;
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) { setText(editing.text ?? ''); setAttachments([]); }
  }, [editing?.id]);

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      try {
        const uploaded = await attachmentsApi.upload(f);
        setAttachments(prev => [...prev, uploaded]);
      } catch (e) {
        alert(errorMessage(e));
      }
    }
  }

  function onPaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const items = e.clipboardData?.items;
    if (!items) return;
    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it.kind === 'file') {
        const f = it.getAsFile();
        if (f) files.push(f);
      }
    }
    if (files.length > 0) {
      e.preventDefault();
      const dt = new DataTransfer();
      files.forEach(f => dt.items.add(f));
      onFiles(dt.files);
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy || disabled) return;
    if (!text.trim() && attachments.length === 0 && !editing) return;
    setBusy(true); setErr(null);
    try {
      if (editing) {
        await messagesApi.edit(editing.id, text);
        clearEditing();
      } else {
        await messagesApi.send(chatId, {
          text: text || undefined,
          replyToId: replyTo?.id,
          attachmentIds: attachments.map(a => a.id),
        });
      }
      setText(''); setAttachments([]); clearReply();
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setBusy(false);
      areaRef.current?.focus();
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit(e as unknown as FormEvent);
    }
    if (e.key === 'Escape') {
      if (editing) clearEditing();
      if (replyTo) clearReply();
    }
  }

  return (
    <div className="border-t border-gray-100 bg-white">
      {(replyTo || editing) && (
        <div className="flex items-center justify-between px-4 py-1 bg-gray-50 text-xs border-b border-gray-100">
          {replyTo && !editing && (
            <span className="text-gray-600">Replying to <b>{replyTo.authorUsername}</b>: {truncate(replyTo.text ?? '')}</span>
          )}
          {editing && <span className="text-gray-600">Editing message…</span>}
          <button className="text-gray-400 hover:text-gray-700" onClick={() => { clearReply(); clearEditing(); }}>✕</button>
        </div>
      )}
      {attachments.length > 0 && (
        <div className="px-4 py-2 flex flex-wrap gap-2 border-b border-gray-50">
          {attachments.map(a => (
            <div key={a.id} className="text-xs bg-gray-100 rounded px-2 py-1 flex items-center gap-2">
              {a.isImage ? '🖼' : '📎'} {a.originalName}
              <button onClick={() => setAttachments(prev => prev.filter(x => x.id !== a.id))}
                      className="text-gray-400 hover:text-red-600">×</button>
            </div>
          ))}
        </div>
      )}
      {disabled && (
        <div className="px-4 py-2 text-xs text-amber-700 bg-amber-50 border-b border-amber-100">
          {disabledReason ?? 'You cannot send messages in this chat.'}
        </div>
      )}
      {err && <div className="px-4 py-1 text-xs text-red-600">{err}</div>}
      <form onSubmit={submit} className="flex items-end gap-2 p-2 relative">
        <button type="button"
          className="text-gray-500 hover:text-gray-800 px-2"
          onClick={() => setShowEmoji(v => !v)}
          title="Emoji"
          disabled={disabled}
        >😊</button>
        <label className={`text-gray-500 hover:text-gray-800 px-2 cursor-pointer ${disabled ? 'opacity-50' : ''}`} title="Attach">
          📎
          <input type="file" hidden multiple disabled={disabled} onChange={e => onFiles(e.target.files)} />
        </label>
        <textarea
          ref={areaRef}
          className="flex-1 rounded border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none resize-none"
          rows={Math.min(5, Math.max(1, text.split('\n').length))}
          placeholder={disabled ? '' : 'Type a message… (Enter to send, Shift+Enter for newline)'}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          disabled={disabled}
          maxLength={3500}
        />
        <button
          type="submit"
          disabled={busy || disabled || (!text.trim() && attachments.length === 0 && !editing)}
          className="rounded bg-brand-500 text-white text-sm px-3 py-2 disabled:opacity-50"
        >{editing ? 'Save' : 'Send'}</button>
        {showEmoji && (
          <div className="absolute bottom-16 left-0 z-30">
            <Picker
              data={data}
              onEmojiSelect={(emoji: { native?: string }) => {
                if (emoji.native) setText(t => t + emoji.native);
                setShowEmoji(false);
                areaRef.current?.focus();
              }}
              theme="light"
              autoFocus={true}
            />
          </div>
        )}
      </form>
    </div>
  );
}

function truncate(s: string, n = 80) {
  if (!s) return '';
  return s.length > n ? s.slice(0, n) + '…' : s;
}
