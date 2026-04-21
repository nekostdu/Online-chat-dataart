import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MessageList } from '@/features/messages/MessageList';
import type { Message, User } from '@/api/types';

// jsdom doesn't implement scroll mechanics — stub the scroller dimensions.
function mockScroller(el: HTMLElement, scrollHeight: number, clientHeight: number, scrollTop: number) {
  Object.defineProperty(el, 'scrollHeight', { configurable: true, value: scrollHeight });
  Object.defineProperty(el, 'clientHeight', { configurable: true, value: clientHeight });
  Object.defineProperty(el, 'scrollTop',    { configurable: true, writable: true, value: scrollTop });
}

function msg(partial: Partial<Message>): Message {
  return {
    id: 1, chatId: 1, authorId: 1, authorUsername: 'alice',
    text: 'hello', replyToId: null, createdAt: '2026-04-20T10:00:00Z',
    editedAt: null, deletedAt: null, attachments: [],
    ...partial,
  };
}

const me: User = { id: 1, username: 'alice', email: null };

describe('MessageList', () => {
  const noop = () => {};

  beforeEach(() => {
    // Each test renders its own tree; no shared state.
  });

  it('renders messages with author name and time', () => {
    render(
      <MessageList
        messages={[msg({ id: 10, text: 'hi' }), msg({ id: 11, text: 'there', authorUsername: 'bob', authorId: 2 })]}
        hasMore={false} loading={false}
        onLoadMore={noop} onReply={noop} onEdit={noop} onDelete={noop}
        canDeleteOthers={false} currentUser={me}
      />
    );
    expect(screen.getByText('hi')).toBeInTheDocument();
    expect(screen.getByText('there')).toBeInTheDocument();
    expect(screen.getAllByText('alice').length).toBeGreaterThan(0);
    expect(screen.getByText('bob')).toBeInTheDocument();
  });

  it('shows "(edited)" badge for edited messages', () => {
    render(
      <MessageList
        messages={[msg({ id: 1, editedAt: '2026-04-20T10:05:00Z' })]}
        hasMore={false} loading={false}
        onLoadMore={noop} onReply={noop} onEdit={noop} onDelete={noop}
        canDeleteOthers={false} currentUser={me}
      />
    );
    expect(screen.getByText(/\(edited\)/)).toBeInTheDocument();
  });

  it('shows "message deleted" placeholder for soft-deleted messages', () => {
    render(
      <MessageList
        messages={[msg({ id: 1, deletedAt: '2026-04-20T10:05:00Z', text: null })]}
        hasMore={false} loading={false}
        onLoadMore={noop} onReply={noop} onEdit={noop} onDelete={noop}
        canDeleteOthers={false} currentUser={me}
      />
    );
    expect(screen.getByText(/message deleted/i)).toBeInTheDocument();
  });

  it('renders a reply preview with quoted block', () => {
    render(
      <MessageList
        messages={[msg({
          id: 2, text: 'response',
          replyTo: { id: 1, authorId: 2, authorUsername: 'bob', text: 'original question', deleted: false },
          replyToId: 1,
        })]}
        hasMore={false} loading={false}
        onLoadMore={noop} onReply={noop} onEdit={noop} onDelete={noop}
        canDeleteOthers={false} currentUser={me}
      />
    );
    expect(screen.getByText(/original question/)).toBeInTheDocument();
  });

  it('calls onLoadMore when the user scrolls near the top', () => {
    const onLoadMore = vi.fn();
    const { container } = render(
      <MessageList
        messages={[msg({ id: 1 })]}
        hasMore={true} loading={false}
        onLoadMore={onLoadMore} onReply={noop} onEdit={noop} onDelete={noop}
        canDeleteOthers={false} currentUser={me}
      />
    );
    const scroller = container.querySelector('.overflow-y-auto') as HTMLElement;
    expect(scroller).toBeTruthy();
    mockScroller(scroller, 2000, 400, 10);   // ~top
    fireEvent.scroll(scroller);
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('does NOT call onLoadMore when already loading', () => {
    const onLoadMore = vi.fn();
    const { container } = render(
      <MessageList
        messages={[msg({ id: 1 })]}
        hasMore={true} loading={true}
        onLoadMore={onLoadMore} onReply={noop} onEdit={noop} onDelete={noop}
        canDeleteOthers={false} currentUser={me}
      />
    );
    const scroller = container.querySelector('.overflow-y-auto') as HTMLElement;
    mockScroller(scroller, 2000, 400, 10);
    fireEvent.scroll(scroller);
    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it('does NOT call onLoadMore when hasMore is false', () => {
    const onLoadMore = vi.fn();
    const { container } = render(
      <MessageList
        messages={[msg({ id: 1 })]}
        hasMore={false} loading={false}
        onLoadMore={onLoadMore} onReply={noop} onEdit={noop} onDelete={noop}
        canDeleteOthers={false} currentUser={me}
      />
    );
    const scroller = container.querySelector('.overflow-y-auto') as HTMLElement;
    mockScroller(scroller, 2000, 400, 0);
    fireEvent.scroll(scroller);
    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it('shows "beginning of conversation" once hasMore=false', () => {
    render(
      <MessageList
        messages={[msg({ id: 1 })]}
        hasMore={false} loading={false}
        onLoadMore={noop} onReply={noop} onEdit={noop} onDelete={noop}
        canDeleteOthers={false} currentUser={me}
      />
    );
    expect(screen.getByText(/beginning of conversation/i)).toBeInTheDocument();
  });

  it('reply action fires with the right message', () => {
    const onReply = vi.fn();
    render(
      <MessageList
        messages={[msg({ id: 42, text: 'pick me' })]}
        hasMore={false} loading={false}
        onLoadMore={noop} onReply={onReply} onEdit={noop} onDelete={noop}
        canDeleteOthers={false} currentUser={me}
      />
    );
    fireEvent.click(screen.getByText('Reply'));
    expect(onReply).toHaveBeenCalledWith(expect.objectContaining({ id: 42, text: 'pick me' }));
  });

  it('shows Edit only for own messages', () => {
    render(
      <MessageList
        messages={[
          msg({ id: 1, authorId: me.id, text: 'mine' }),
          msg({ id: 2, authorId: 99, authorUsername: 'zoe', text: 'theirs' }),
        ]}
        hasMore={false} loading={false}
        onLoadMore={noop} onReply={noop} onEdit={noop} onDelete={noop}
        canDeleteOthers={false} currentUser={me}
      />
    );
    // Exactly one Edit button — for the user's own message
    expect(screen.getAllByText('Edit')).toHaveLength(1);
  });

  it('shows Delete on others messages when canDeleteOthers=true (admin)', () => {
    render(
      <MessageList
        messages={[
          msg({ id: 2, authorId: 99, authorUsername: 'zoe', text: 'theirs' }),
        ]}
        hasMore={false} loading={false}
        onLoadMore={noop} onReply={noop} onEdit={noop} onDelete={noop}
        canDeleteOthers={true} currentUser={me}
      />
    );
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });
});
