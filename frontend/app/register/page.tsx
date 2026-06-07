'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerUser } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await registerUser({ full_name: fullName, email, password });
      router.push('/login');
    } catch (err: any) {
      if (err.response?.data?.detail === 'Email already registered') {
        setError('This email is already registered. Please login.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-rose-50 flex">

      {/* Left Panel */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-rose-400 to-pink-500 items-center justify-center p-12">
        <div className="text-white text-center">
          <div className="text-6xl mb-6">🌸</div>
          <h2 className="text-3xl font-bold mb-4">Start Your Journey</h2>
          <p className="text-rose-100 text-lg leading-relaxed">
            Join thousands of users getting personalized skincare recommendations powered by AI and real-time weather data.
          </p>
          <div className="mt-8 space-y-3">
            <div className="bg-white/20 rounded-xl p-3 flex items-center gap-3">
              <span className="text-2xl">📷</span>
              <p className="text-sm text-left">Upload a photo for instant skin analysis</p>
            </div>
            <div className="bg-white/20 rounded-xl p-3 flex items-center gap-3">
              <span className="text-2xl">🌤️</span>
              <p className="text-sm text-left">Weather-aware daily recommendations</p>
            </div>
            <div className="bg-white/20 rounded-xl p-3 flex items-center gap-3">
              <span className="text-2xl">📈</span>
              <p className="text-sm text-left">Track your skin progress over time</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-800">Create your account</h1>
            <p className="text-gray-500 mt-1 text-sm">Free forever. No credit card required.</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 bg-white"
                placeholder="Your full name"
              />
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 bg-white"
                placeholder="Min 8 characters"
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
              className="w-full bg-rose-500 text-white rounded-xl py-3 text-sm font-semibold hover:bg-rose-600 transition disabled:opacity-50 shadow-sm"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <a href="/login" className="text-rose-500 font-semibold hover:underline">
                Sign in
              </a>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}