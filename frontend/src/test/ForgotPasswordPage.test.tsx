import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/api/auth', () => ({
  authApi: {
    requestReset: vi.fn(),
  },
}));

import { authApi } from '@/api/auth';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';

const mocked = authApi as unknown as {
  requestReset: ReturnType<typeof vi.fn>;
};

describe('ForgotPasswordPage', () => {
  beforeEach(() => { mocked.requestReset.mockReset(); });

  it('submits the email and shows the MailHog hint', async () => {
    mocked.requestReset.mockResolvedValueOnce({ ok: true });
    const { container } = render(<MemoryRouter><ForgotPasswordPage /></MemoryRouter>);
    const email = container.querySelector('input[type="email"]') as HTMLInputElement;
    fireEvent.change(email, { target: { value: 'a@x.io' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));
    });
    expect(mocked.requestReset).toHaveBeenCalledWith('a@x.io');
    expect(screen.getByText(/MailHog/i)).toBeInTheDocument();
  });
});
