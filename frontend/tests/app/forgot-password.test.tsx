import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

import ForgotPasswordPage from '@/app/forgot-password/page';

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    mockedAxios.post.mockReset();
  });

  it('starts on the email step', () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send otp/i })).toBeInTheDocument();
  });

  it('advances to the OTP step after successfully requesting an OTP', async () => {
    const user = userEvent.setup();
    mockedAxios.post.mockResolvedValueOnce({ data: { message: 'OTP sent' } });
    render(<ForgotPasswordPage />);

    await user.type(screen.getByPlaceholderText('you@example.com'), 'jane@example.com');
    await user.click(screen.getByRole('button', { name: /send otp/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('000000')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
    });
  });

  it('shows the first validation message when the backend returns a 422 detail array', async () => {
    const user = userEvent.setup();
    // A syntactically valid email so HTML5's <input type="email"> lets the
    // form submit — the 422 array response below simulates a server-side
    // validation failure (e.g. domain deliverability), which client-side
    // HTML5 validation can't catch, so this is a realistic scenario rather
    // than an artificial one.
    mockedAxios.post.mockRejectedValueOnce({
      response: { data: { detail: [{ msg: 'value is not a valid email address' }] } },
    });
    render(<ForgotPasswordPage />);

    await user.type(screen.getByPlaceholderText('you@example.com'), 'jane@example.com');
    await user.click(screen.getByRole('button', { name: /send otp/i }));

    await waitFor(() => {
      expect(screen.getByText('value is not a valid email address')).toBeInTheDocument();
    }, { timeout: 3000 });
});

  it('shows an error and does not advance the step on OTP request failure', async () => {
    const user = userEvent.setup();
    mockedAxios.post.mockRejectedValueOnce({ response: { data: { detail: 'Server error' } } });
    render(<ForgotPasswordPage />);

    await user.type(screen.getByPlaceholderText('you@example.com'), 'jane@example.com');
    await user.click(screen.getByRole('button', { name: /send otp/i }));

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
      expect(screen.queryByPlaceholderText('000000')).not.toBeInTheDocument();
    });
  });

  it('submits email, OTP, and new password together on the reset step', async () => {
    const user = userEvent.setup();
    mockedAxios.post.mockResolvedValueOnce({ data: { message: 'OTP sent' } }); // step 1
    render(<ForgotPasswordPage />);
    await user.type(screen.getByPlaceholderText('you@example.com'), 'jane@example.com');
    await user.click(screen.getByRole('button', { name: /send otp/i }));
    await waitFor(() => screen.getByPlaceholderText('000000'));

    mockedAxios.post.mockResolvedValueOnce({ data: { message: 'Password reset successfully!' } }); // step 2
    await user.type(screen.getByPlaceholderText('000000'), '123456');
    await user.type(screen.getByPlaceholderText('Min 8 characters'), 'NewPassword1');
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenLastCalledWith(
        expect.stringContaining('/auth/reset-password'),
        { email: 'jane@example.com', otp: '123456', new_password: 'NewPassword1' }
      );
    });
  });
});
