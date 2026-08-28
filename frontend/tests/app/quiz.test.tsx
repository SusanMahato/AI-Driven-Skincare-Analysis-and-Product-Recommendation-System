import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const pushMock = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => new URLSearchParams(),
}));

const submitQuizMock = jest.fn();
jest.mock('@/lib/api', () => ({
  submitQuiz: (...args: any[]) => submitQuizMock(...args),
}));

const isLoggedInMock = jest.fn();
jest.mock('@/lib/auth', () => ({
  isLoggedIn: () => isLoggedInMock(),
}));

import QuizPage from '@/app/quiz/page';

// Mirrors the answers a user would give across all 8 quiz questions, in order.
const ANSWERS_IN_ORDER = [
  '25-34', 'Female', 'Oily', 'Regularly', '1-3hrs', 'Acne', 'None', 'Clear skin',
];

async function answerAllQuestions() {
  for (let i = 0; i < ANSWERS_IN_ORDER.length; i++) {
    const answer = ANSWERS_IN_ORDER[i];
    await userEvent.click(screen.getByRole('button', { name: new RegExp(`^${escapeRegex(answer)}`) }));
    const isLast = i === ANSWERS_IN_ORDER.length - 1;
    const navButton = isLast
      ? screen.getByRole('button', { name: /complete quiz/i })
      : screen.getByRole('button', { name: /next/i });
    await userEvent.click(navButton);
  }
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

describe('QuizPage', () => {
  beforeEach(() => {
    pushMock.mockReset();
    submitQuizMock.mockReset();
    isLoggedInMock.mockReset().mockReturnValue(true);
  });

  it('redirects to /login if the user is not logged in', () => {
    isLoggedInMock.mockReturnValue(false);
    render(<QuizPage />);
    expect(pushMock).toHaveBeenCalledWith('/login');
  });

  it('shows the first question and a progress indicator of 1/8', () => {
    render(<QuizPage />);
    expect(screen.getByText('What is your age range?')).toBeInTheDocument();
    expect(screen.getByText('1/8')).toBeInTheDocument();
  });

  it('disables the Next button until an option is selected', () => {
    render(<QuizPage />);
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
  });

  it('enables Next once an option is selected, and advances to question 2', async () => {
    render(<QuizPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Under 18' }));
    const nextButton = screen.getByRole('button', { name: /next/i });
    expect(nextButton).toBeEnabled();

    await userEvent.click(nextButton);
    expect(screen.getByText('What is your gender?')).toBeInTheDocument();
    expect(screen.getByText('2/8')).toBeInTheDocument();
  });

  it('Back returns to the previous question and preserves the earlier answer', async () => {
    render(<QuizPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Under 18' }));
    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    await userEvent.click(screen.getByRole('button', { name: /back/i }));

    expect(screen.getByText('What is your age range?')).toBeInTheDocument();
    // The previously-selected option should render with its "selected" checkmark.
    expect(screen.getByRole('button', { name: /Under 18\s*✓/ })).toBeInTheDocument();
  });

  it('submits the mapped payload (sensitivity: null, concern_two "None" -> null) on the last question', async () => {
    submitQuizMock.mockResolvedValueOnce({ data: { id: 1 } });
    render(<QuizPage />);

    await answerAllQuestions();

    await waitFor(() => {
      expect(submitQuizMock).toHaveBeenCalledWith({
        age_range: '25-34',
        gender: 'Female',
        skin_type: 'Oily',
        products_used_before: 'Regularly',
        sun_exposure: '1-3hrs',
        concern_one: 'Acne',
        concern_two: null,
        skin_goal: 'Clear skin',
        sensitivity: null,
      });
    });
  });

  it('navigates to /scan after a successful submission', async () => {
    submitQuizMock.mockResolvedValueOnce({ data: { id: 1 } });
    render(<QuizPage />);

    await answerAllQuestions();

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/scan'));
  });

  it('shows an error message and stays on the page if submission fails', async () => {
    submitQuizMock.mockRejectedValueOnce(new Error('network error'));
    render(<QuizPage />);

    await answerAllQuestions();

    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
    expect(pushMock).not.toHaveBeenCalledWith('/scan');
  });
});
