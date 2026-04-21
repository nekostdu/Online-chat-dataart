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
import RegisterPage from '@/pages/RegisterPage';

const mocked = authApi as unknown as {
  register: ReturnType<typeof vi.fn>;
};

describe('RegisterPage', () => {
  beforeEach(() => {
    mockNav.mockReset();
    mocked.register.mockReset();
    useAuth.setState({ user: null, loading: false, initialized: true });
  });

  function fillForm(container: HTMLElement, password: string, confirm: string) {
    const inputs = container.querySelectorAll('input');
    // Order in the JSX: email, username, password, confirm password
    fireEvent.change(inputs[0], { target: { value: 'a@x.io' } });
    fireEvent.change(inputs[1], { target: { value: 'alice' } });
    fireEvent.change(inputs[2], { target: { value: password } });
    fireEvent.change(inputs[3], { target: { value: confirm } });
  }

  it('does NOT hit the API when passwords do not match', async () => {
    const { container } = render(<MemoryRouter><RegisterPage /></MemoryRouter>);
    fillForm(container, 'pw12345678', 'different!');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    });
    expect(mocked.register).not.toHaveBeenCalled();
    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it('calls register and navigates to /chat on success', async () => {
    mocked.register.mockResolvedValueOnce({ id: 1, username: 'alice', email: 'a@x.io' });
    const { container } = render(<MemoryRouter><RegisterPage /></MemoryRouter>);
    fillForm(container, 'pw12345678', 'pw12345678');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    });
    expect(mocked.register).toHaveBeenCalledWith('a@x.io', 'alice', 'pw12345678');
    expect(mockNav).toHaveBeenCalledWith('/chat');
  });
});
