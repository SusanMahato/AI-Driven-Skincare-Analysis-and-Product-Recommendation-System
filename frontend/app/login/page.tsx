'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginUser } from '@/lib/api';
import { saveToken } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await loginUser(email, password);
      saveToken(response.data.access_token);
      router.push('/dashboard');
    } catch (err: any) {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-rose-50 flex">
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-rose-400 to-pink-500 items-center justify-center p-12">
        <div className="text-white text-center">
          <div className="text-6xl mb-6">✨</div>
          <h2 className="text-3xl font-bold mb-4">Welcome Back</h2>
          <p className="text-rose-100 text-lg leading-relaxed">Your personalized skincare journey continues.</p>
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div className="bg-white/20 rounded-xl p-3">
              <p className="text-2xl font-bold">AI</p>
              <p className="text-xs text-rose-100">Powered</p>
            </div>
            <div className="bg-white/20 rounded-xl p-3">
              <p className="text-2xl font-bold">6+</p>
              <p className="text-xs text-rose-100">Conditions</p>
            </div>
            <div className="bg-white/20 rounded-xl p-3">
              <p className="text-2xl font-bold">UV</p>
              <p className="text-xs text-rose-100">Aware</p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-800">Sign in to SkinCare AI</h1>
            <p className="text-gray-500 mt-1 text-sm">Enter your credentials to continue</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 bg-white" placeholder="you@example.com" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <a href="/forgot-password" className="text-xs text-rose-500 hover:underline cursor-pointer">Forgot password?</a>
              </div>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 bg-white" placeholder="••••••••" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="remember" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4 accent-rose-500" />
              <label htmlFor="remember" className="text-sm text-gray-600">Remember me for 30 days</label>
            </div>
            {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3"><p className="text-red-600 text-sm">{error}</p></div>}
            <button type="submit" disabled={loading} className="w-full bg-rose-500 text-white rounded-xl py-3 text-sm font-semibold hover:bg-rose-600 transition disabled:opacity-50 shadow-sm cursor-pointer">{loading ? 'Signing in...' : 'Sign In'}</button>
          </form>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
            <div className="relative flex justify-center text-sm"><span className="bg-rose-50 px-2 text-gray-400">or continue with</span></div>
          </div>
          <a href="http://localhost:8000/auth/google" className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition cursor-pointer">
            <img src="https://www.google.com/favicon.ico" width="18" height="18" alt="Google" />
            Sign in with Google
          </a>
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">Don't have an account?{' '}<a href="/register" className="text-rose-500 font-semibold hover:underline cursor-pointer">Create an account</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}