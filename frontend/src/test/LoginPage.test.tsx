import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const mockNav = vi.fn();
vi.mock('react-router-dom', async () => {
  const real = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...real, useNavigate: () => mockNav };
});

vi.mock('@/api/auth', () => ({
  authApi: {
    me: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}));

import { authApi } from '@/api/auth';
import { useAuth } from '@/store/authStore';
import LoginPage from '@/pages/LoginPage';

const mocked = authApi as unknown as {
  login: ReturnType<typeof vi.fn>;
};

describe('LoginPage', () => {
  beforeEach(() => {
    mockNav.mockReset();
    mocked.login.mockReset();
    useAuth.setState({ user: null, loading: false, initialized: true });
  });

  function getPasswordInput(container: HTMLElement): HTMLInputElement {
    const pw = container.querySelector('input[type="password"]');
    if (!pw) throw new Error('password input not found');
    return pw as HTMLInputElement;
  }

  it('navigates to /chat after successful login', async () => {
    mocked.login.mockResolvedValueOnce({ id: 1, username: 'alice', email: 'a@x.io' });
    const { container } = render(<MemoryRouter><LoginPage /></MemoryRouter>);

    fireEvent.change(screen.getByPlaceholderText(/you@example/i), { target: { value: 'alice' } });
    fireEvent.change(getPasswordInput(container), { target: { value: 'pw12345678' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }));
    });

    expect(mocked.login).toHaveBeenCalledWith('alice', 'pw12345678');
    expect(mockNav).toHaveBeenCalledWith('/chat');
  });

  it('shows backend error message on login failure', async () => {
    mocked.login.mockRejectedValueOnce({
      isAxiosError: true,
      response: { data: { error: 'invalid credentials' } },
      message: 'Request failed',
    });
    const { container } = render(<MemoryRouter><LoginPage /></MemoryRouter>);
    fireEvent.change(screen.getByPlaceholderText(/you@example/i), { target: { value: 'alice' } });
    fireEvent.change(getPasswordInput(container), { target: { value: 'wrong' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }));
    });
    expect(await screen.findByText(/invalid credentials|sign-in failed/i)).toBeInTheDocument();
    expect(mockNav).not.toHaveBeenCalled();
  });
});
