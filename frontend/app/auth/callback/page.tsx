'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { saveToken } from '@/lib/auth';
import { Suspense } from 'react';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const redirect = searchParams.get('redirect') || 'dashboard';
    if (token) {
      saveToken(token);
      router.push(`/${redirect}`);
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