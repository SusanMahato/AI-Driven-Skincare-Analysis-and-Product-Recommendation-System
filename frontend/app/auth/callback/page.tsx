'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { saveToken } from '@/lib/auth';
import { Suspense } from 'react';

function CallbackContent() {
  const router = useRouter();

  useEffect(() => {
    // Token arrives as a URL fragment (#token=...&redirect=...), not a query param —
    // fragments are never sent to the server or logged, unlike query strings.
    const hash = window.location.hash.startsWith('#')
      ? window.location.hash.slice(1)
      : window.location.hash;
    const params = new URLSearchParams(hash);

    const token = params.get('token');
    const rawRedirect = params.get('redirect') || '/dashboard';
    const redirect = rawRedirect.startsWith('/') ? rawRedirect : `/${rawRedirect}`;

    if (token) {
      saveToken(token);
      router.push(redirect);
    } else {
      router.push('/login');
    }
  }, []);

  return (
    <div className="min-h-screen bg-rose-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-4xl mb-4">⏳</p>
        <p className="text-gray-500 text-sm">Completing sign in...</p>
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense>
      <CallbackContent />
    </Suspense>
  );
}
