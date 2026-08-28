import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const pushMock = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

const registerUserMock = jest.fn();
jest.mock('@/lib/api', () => ({
  registerUser: (...args: any[]) => registerUserMock(...args),
}));

import RegisterPage from '@/app/register/page';

async function fillAndSubmit(overrides: Partial<{ name: string; email: string; password: string }> = {}) {
  const user = userEvent.setup();
  const name = overrides.name ?? 'Jane Doe';
  const email = overrides.email ?? 'jane@example.com';
  const password = overrides.password ?? 'StrongPass123';

  await user.type(screen.getByPlaceholderText('Your full name'), name);
  await user.type(screen.getByPlaceholderText('you@example.com'), email);
  await user.type(screen.getByPlaceholderText('Min 8 characters'), password);
  await user.click(screen.getByRole('button', { name: /create account|register|sign up/i }));
}

describe('RegisterPage', () => {
  beforeEach(() => {
    pushMock.mockReset();
    registerUserMock.mockReset();
    jest.useFakeTimers({ advanceTimers: true });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders full name, email, and password fields', () => {
    render(<RegisterPage />);
    expect(screen.getByPlaceholderText('Your full name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Min 8 characters')).toBeInTheDocument();
  });

  it('calls registerUser with the entered values on submit', async () => {
    registerUserMock.mockResolvedValueOnce({ data: { id: 1, email: 'jane@example.com' } });
    render(<RegisterPage />);

    await fillAndSubmit();

    await waitFor(() => {
      expect(registerUserMock).toHaveBeenCalledWith({
        full_name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'StrongPass123',
      });
    });
  });

  it('shows a success state after successful registration', async () => {
    registerUserMock.mockResolvedValueOnce({ data: { id: 1, email: 'jane@example.com' } });
    render(<RegisterPage />);

    await fillAndSubmit();

    await waitFor(() => {
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    });
  });

  it('shows a specific error message when the email is already registered', async () => {
    registerUserMock.mockRejectedValueOnce({
      response: { data: { detail: 'Email already registered' } },
    });
    render(<RegisterPage />);

    await fillAndSubmit();

    await waitFor(() => {
      expect(screen.getByText(/already registered/i)).toBeInTheDocument();
    });
  });

  it('shows a generic error message for a validation (422) failure', async () => {
    // The backend returns `detail` as an array of error objects for 422s,
    // not a string — register/page.tsx only string-matches for the
    // "already registered" case, so this path falls through to the
    // generic message. See Test Plan, Defects & Observations, item D-02.
    registerUserMock.mockRejectedValueOnce({
      response: { data: { detail: [{ msg: 'Password must be at least 8 characters long.' }] } },
    });
    render(<RegisterPage />);

    await fillAndSubmit({ password: 'short1' });

    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });

  it('the password field enforces an 8-character minimum via minLength', () => {
    render(<RegisterPage />);
    const passwordInput = screen.getByPlaceholderText('Min 8 characters') as HTMLInputElement;
    expect(passwordInput).toHaveAttribute('minLength', '8');
  });
});
