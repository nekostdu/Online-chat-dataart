import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

vi.mock('@/api/messages', () => ({
  messagesApi: {
    send: vi.fn(),
    edit: vi.fn(),
    delete: vi.fn(),
    markRead: vi.fn(),
    page: vi.fn(),
  },
  attachmentsApi: {
    upload: vi.fn(),
    url: (id: number) => `/api/attachments/${id}`,
  },
}));

// Avoid loading the real emoji picker — it's heavy and not needed for these tests.
vi.mock('@emoji-mart/react', () => ({
  default: () => <div data-testid="emoji-picker" />,
}));

import { MessageComposer } from '@/features/messages/MessageComposer';
import { messagesApi, attachmentsApi } from '@/api/messages';

const mocked = {
  send: messagesApi.send as ReturnType<typeof vi.fn>,
  edit: messagesApi.edit as ReturnType<typeof vi.fn>,
  upload: attachmentsApi.upload as ReturnType<typeof vi.fn>,
};

describe('MessageComposer', () => {
  beforeEach(() => {
    mocked.send.mockReset();
    mocked.edit.mockReset();
    mocked.upload.mockReset();
    mocked.send.mockResolvedValue({});
    mocked.edit.mockResolvedValue({});
  });

  it('Enter submits a text message; Shift+Enter inserts a newline', async () => {
    const clearReply = vi.fn();
    const clearEditing = vi.fn();
    render(
      <MessageComposer
        chatId={1}
        replyTo={null} clearReply={clearReply}
        editing={null} clearEditing={clearEditing}
      />
    );
    const area = screen.getByPlaceholderText(/type a message/i) as HTMLTextAreaElement;

    // Shift+Enter — should NOT send
    fireEvent.change(area, { target: { value: 'line1' } });
    fireEvent.keyDown(area, { key: 'Enter', shiftKey: true });
    expect(mocked.send).not.toHaveBeenCalled();

    // Plain Enter — submits
    fireEvent.change(area, { target: { value: 'hello' } });
    await act(async () => {
      fireEvent.keyDown(area, { key: 'Enter' });
    });
    expect(mocked.send).toHaveBeenCalledWith(1, expect.objectContaining({ text: 'hello' }));
  });

  it('disables Send when there is no text and no attachments', () => {
    render(
      <MessageComposer
        chatId={1} replyTo={null} clearReply={() => {}}
        editing={null} clearEditing={() => {}}
      />
    );
    const send = screen.getByRole('button', { name: /send/i });
    expect(send).toBeDisabled();
  });

  it('Escape while replying clears the reply draft', () => {
    const clearReply = vi.fn();
    render(
      <MessageComposer
        chatId={1}
        replyTo={{ id: 5, chatId: 1, authorId: 2, authorUsername: 'bob',
                   text: 'hi', replyToId: null,
                   createdAt: '2026', editedAt: null, deletedAt: null, attachments: [] }}
        clearReply={clearReply}
        editing={null} clearEditing={() => {}}
      />
    );
    const area = screen.getByPlaceholderText(/type a message/i);
    fireEvent.keyDown(area, { key: 'Escape' });
    expect(clearReply).toHaveBeenCalled();
  });

  it('editing mode submits via messagesApi.edit instead of .send', async () => {
    const clearEditing = vi.fn();
    render(
      <MessageComposer
        chatId={1}
        replyTo={null} clearReply={() => {}}
        editing={{ id: 77, chatId: 1, authorId: 1, authorUsername: 'me',
                   text: 'old', replyToId: null, createdAt: '', editedAt: null,
                   deletedAt: null, attachments: [] }}
        clearEditing={clearEditing}
      />
    );
    const area = screen.getByPlaceholderText(/type a message/i) as HTMLTextAreaElement;
    // initial value populated from editing
    expect(area.value).toBe('old');
    fireEvent.change(area, { target: { value: 'edited' } });
    await act(async () => {
      fireEvent.keyDown(area, { key: 'Enter' });
    });
    expect(mocked.edit).toHaveBeenCalledWith(77, 'edited');
    expect(mocked.send).not.toHaveBeenCalled();
    expect(clearEditing).toHaveBeenCalled();
  });

  it('shows disabled banner and reason when disabled', () => {
    render(
      <MessageComposer
        chatId={1}
        replyTo={null} clearReply={() => {}}
        editing={null} clearEditing={() => {}}
        disabled={true}
        disabledReason="Messaging blocked"
      />
    );
    expect(screen.getByText(/messaging blocked/i)).toBeInTheDocument();
    // textarea disabled
    const area = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(area).toBeDisabled();
  });

  it('uploads a file and shows it as a pending attachment chip', async () => {
    mocked.upload.mockResolvedValueOnce({
      id: 99, originalName: 'report.pdf', mimeType: 'application/pdf',
      sizeBytes: 1234, isImage: false,
    });
    const { container } = render(
      <MessageComposer
        chatId={1} replyTo={null} clearReply={() => {}}
        editing={null} clearEditing={() => {}}
      />
    );
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull();
    const file = new File(['dummy'], 'report.pdf', { type: 'application/pdf' });
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });
    expect(mocked.upload).toHaveBeenCalledWith(file);
    expect(await screen.findByText(/report\.pdf/)).toBeInTheDocument();
  });
});
