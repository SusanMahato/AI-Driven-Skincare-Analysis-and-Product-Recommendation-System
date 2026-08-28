import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const pushMock = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => new URLSearchParams(),
}));

const loginUserMock = jest.fn();
const getSkinProfileMock = jest.fn();
jest.mock('@/lib/api', () => ({
  loginUser: (...args: any[]) => loginUserMock(...args),
  getSkinProfile: (...args: any[]) => getSkinProfileMock(...args),
}));

const saveTokenMock = jest.fn();
jest.mock('@/lib/auth', () => ({
  saveToken: (...args: any[]) => saveTokenMock(...args),
}));

import LoginPage from '@/app/login/page';

async function fillAndSubmit(email = 'jane@example.com', password = 'StrongPass123') {
  await userEvent.type(screen.getByPlaceholderText('you@example.com'), email);
  await userEvent.type(screen.getByPlaceholderText('••••••••'), password);

  const submitButton = screen.getByRole('button', { name: /log in|sign in/i });
  await userEvent.click(submitButton);
}

describe('LoginPage', () => {
  beforeEach(() => {
    pushMock.mockReset();
    loginUserMock.mockReset();
    getSkinProfileMock.mockReset();
    saveTokenMock.mockReset();
    jest.useFakeTimers({ advanceTimers: true });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('saves the access token on successful login', async () => {
    loginUserMock.mockResolvedValueOnce({ data: { access_token: 'jwt-token-123' } });
    getSkinProfileMock.mockResolvedValueOnce({ data: { id: 1 } });
    render(<LoginPage />);

    await fillAndSubmit();

    await waitFor(() => {
      expect(saveTokenMock).toHaveBeenCalledWith('jwt-token-123');
    });
  });

  it('redirects to /quiz for a logged-in user with no skin profile yet', async () => {
    loginUserMock.mockResolvedValueOnce({ data: { access_token: 'jwt-token-123' } });
    getSkinProfileMock.mockRejectedValueOnce({ response: { status: 404 } });
    render(<LoginPage />);

    await fillAndSubmit();

    await waitFor(() => expect(saveTokenMock).toHaveBeenCalled());
    jest.advanceTimersByTime(1000);
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/quiz'));
  });

  it('shows the backend error message on invalid credentials', async () => {
    loginUserMock.mockRejectedValueOnce({
      response: { data: { detail: 'Invalid email or password' } },
    });
    render(<LoginPage />);

    await fillAndSubmit('jane@example.com', 'WrongPassword');

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });
  });

  it('shows a fallback error message when the backend gives no detail string', async () => {
    loginUserMock.mockRejectedValueOnce({ response: { data: {} } });
    render(<LoginPage />);

    await fillAndSubmit();

    await waitFor(() => {
      expect(screen.getByText(/invalid email or password\. please try again\./i)).toBeInTheDocument();
    });
  });
});
