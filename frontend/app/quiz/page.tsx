'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { submitQuiz } from '@/lib/api';
import { isLoggedIn } from '@/lib/auth';

const questions = [
  {
    id: 'age_range',
    question: 'What is your age range?',
    emoji: '🎂',
    options: ['Under 18', '18-24', '25-34', '35-44', '45+'],
  },
  {
    id: 'gender',
    question: 'What is your gender?',
    emoji: '👤',
    options: ['Male', 'Female', 'Prefer not to say'],
  },
  {
    id: 'skin_type',
    question: 'What is your skin type?',
    emoji: '✨',
    options: ['Oily', 'Dry', 'Combination', 'Normal', "I don't know"],
  },
  {
    id: 'products_used_before',
    question: 'Have you used skincare products before?',
    emoji: '🧴',
    options: ['Never', 'Occasionally', 'Moisturizer', 'Serum', 'Sunscreen'],
  },
  {
    id: 'sun_exposure',
    question: 'How much sun exposure do you get daily?',
    emoji: '☀️',
    options: ['Under 1hr', '1-3hrs', '3hrs+'],
  },
  {
    id: 'concern_one',
    question: 'What is your main skin concern?',
    emoji: '🔍',
    options: ['Acne', 'Oiliness', 'Dryness', 'Redness', 'Dark spots', 'Wrinkles', 'Dark circles', 'Pores'],
  },
  {
    id: 'skin_goal',
    question: 'What is your skin goal?',
    emoji: '🎯',
    options: ['Clear skin', 'Even tone', 'Anti-aging', 'Hydration', 'Oil control'],
  },
];

export default function QuizPage() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!isLoggedIn()) {
        router.push('/login');
      }
    }
  }, []);

  const handleSelect = (value: string) => {
    setAnswers({ ...answers, [questions[current].id]: value });
  };

  const handleNext = () => {
    if (current < questions.length - 1) setCurrent(current + 1);
  };

  const handleBack = () => {
    if (current > 0) setCurrent(current - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      await submitQuiz({ ...answers, concern_two: null, sensitivity: null });
      router.push('/scan');
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const question = questions[current];
  const selected = answers[question.id];
  const isLast = current === questions.length - 1;
  const progress = ((current + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
        <button onClick={() => router.push('/dashboard')} className="text-rose-500 font-medium text-sm">
          ← Exit
        </button>
        <p className="text-sm text-gray-500">Skin Quiz</p>
        <p className="text-sm font-medium text-gray-800">{current + 1}/{questions.length}</p>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-100">
        <div
          className="h-1 bg-rose-400 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="max-w-lg mx-auto px-6 py-10">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">

          {/* Question */}
          <div className="text-center mb-8">
            <p className="text-5xl mb-4">{question.emoji}</p>
            <h2 className="text-xl font-bold text-gray-800">{question.question}</h2>
          </div>

          {/* Options */}
          <div className="space-y-3 mb-8">
            {question.options.map((option) => (
              <button
                key={option}
                onClick={() => handleSelect(option)}
                className={`w-full text-left px-5 py-3.5 rounded-xl border-2 text-sm font-medium transition ${
                  selected === option
                    ? 'border-rose-400 bg-rose-50 text-rose-600'
                    : 'border-gray-100 text-gray-700 hover:border-rose-200 bg-gray-50'
                }`}
              >
                <span className="flex items-center justify-between">
                  {option}
                  {selected === option && <span>✓</span>}
                </span>
              </button>
            ))}
          </div>

          {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

          {/* Navigation */}
          <div className="flex gap-3">
            {current > 0 && (
              <button
                onClick={handleBack}
                className="flex-1 border-2 border-gray-200 text-gray-700 rounded-xl py-3 text-sm font-semibold hover:bg-gray-50 transition"
              >
                Back
              </button>
            )}
            {isLast ? (
              <button
                onClick={handleSubmit}
                disabled={!selected || loading}
                className="flex-1 bg-rose-500 text-white rounded-xl py-3 text-sm font-semibold hover:bg-rose-600 transition disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Complete Quiz ✓'}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!selected}
                className="flex-1 bg-rose-500 text-white rounded-xl py-3 text-sm font-semibold hover:bg-rose-600 transition disabled:opacity-50"
              >
                Next →
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}