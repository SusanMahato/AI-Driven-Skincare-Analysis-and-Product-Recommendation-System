'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }
    verifyEmail(token);
  }, [token]);

  const verifyEmail = async (token: string) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/auth/verify-email?token=${token}`);
      if (response.ok) {
        setStatus('success');
        setTimeout(() => router.push('/login'), 3000);
      } else {
        setStatus('error');
      }
    } catch (err) {
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-rose-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-md p-10 w-full max-w-md text-center">
        {status === 'loading' && (
          <>
            <p className="text-4xl mb-4">⏳</p>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Verifying your email...</h2>
            <p className="text-gray-500 text-sm">Please wait a moment.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <p className="text-4xl mb-4">✅</p>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Email Verified!</h2>
            <p className="text-gray-500 text-sm">Your account is now active. Redirecting to login...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <p className="text-4xl mb-4">❌</p>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Verification Failed</h2>
            <p className="text-gray-500 text-sm mb-4">The link is invalid or has expired.</p>
            <button
              onClick={() => router.push('/login')}
              className="bg-rose-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-rose-600 transition"
            >
              Go to Login
            </button>
          </>
        )}
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