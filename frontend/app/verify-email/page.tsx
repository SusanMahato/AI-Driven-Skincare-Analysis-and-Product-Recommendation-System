'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get('email') || '';

  const [email, setEmail] = useState(emailFromQuery);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post(`${API_BASE_URL}/auth/verify-email`, { email, otp });
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-rose-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-md">

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-rose-500">SkinCare AI</h1>
          <p className="text-gray-500 mt-1 text-sm">Verify your email</p>
        </div>

        {success ? (
          <div className="text-center">
            <p className="text-4xl mb-4">✅</p>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Email Verified!</h2>
            <p className="text-gray-500 text-sm">Your account is now active. Redirecting to login...</p>
          </div>
        ) : (
          <form onSubmit={handleVerify} className="space-y-5">
            <div className="bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">
              <p className="text-rose-600 text-sm">Enter the 6-digit code sent to your email.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 bg-white"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">6-digit code</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                maxLength={6}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 bg-white tracking-widest text-center text-lg font-bold"
                placeholder="000000"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-rose-500 text-white rounded-xl py-3 text-sm font-semibold hover:bg-rose-600 transition disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          <a href="/login" className="text-rose-500 font-semibold hover:underline">
            Back to Sign in
          </a>
        </p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
