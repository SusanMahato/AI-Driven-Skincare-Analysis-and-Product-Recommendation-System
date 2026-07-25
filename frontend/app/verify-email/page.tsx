'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      if (!tokenFromUrl) {
        setError('No verification token provided.');
        setLoading(false);
        return;
      }

      try {
        await axios.post(`${API_BASE_URL}/auth/verify-email`, { token: tokenFromUrl });
        setSuccess(true);
        setTimeout(() => router.push('/login'), 2000);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to verify email. The link may have expired.');
        setLoading(false);
      }
    };

    verifyEmail();
  }, [tokenFromUrl, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-rose-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-md">
          <div className="text-center">
            <p className="text-2xl mb-4">⏳</p>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Verifying your email...</h2>
            <p className="text-gray-500 text-sm">Please wait while we confirm your email address.</p>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-rose-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-md">
          <div className="text-center">
            <p className="text-4xl mb-4">✅</p>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Email Verified!</h2>
            <p className="text-gray-500 text-sm">Your account is now active. Redirecting to login...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rose-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-rose-500">SkinCare AI</h1>
          <p className="text-gray-500 mt-1 text-sm">Email Verification</p>
        </div>

        <div className="text-center">
          <p className="text-5xl mb-4">❌</p>
          <h2 className="text-xl font-bold text-gray-800 mb-4">Verification Failed</h2>
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
          <a
            href="/register"
            className="inline-block bg-rose-500 text-white rounded-xl px-6 py-3 text-sm font-semibold hover:bg-rose-600 transition"
          >
            Back to Sign Up
          </a>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-rose-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-md">
            <p className="text-center text-gray-500">Loading...</p>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
