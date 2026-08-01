'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import { ArrowLeft, Mail } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['500', '600'],
  variable: '--font-display',
});
const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-body',
});
const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
});

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post(`${API_BASE_URL}/auth/forgot-password`, { email });
      setStep('otp');
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail[0]?.msg || 'Please check your email and try again.');
      } else if (typeof detail === 'string') {
        setError(detail);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post(`${API_BASE_URL}/auth/reset-password`, {
        email,
        otp,
        new_password: newPassword
      });
      setSuccess('Password reset successfully!');
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail[0]?.msg || 'Please check your new password and try again.');
      } else if (typeof detail === 'string') {
        setError(detail);
      } else {
        setError('Invalid or expired OTP.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${fraunces.variable} ${plexSans.variable} ${plexMono.variable} min-h-screen bg-[#F5F2EA] font-[family-name:var(--font-body)] flex items-center justify-center px-4`}>
      <div className="bg-white rounded-lg border border-[#20241F]/12 p-8 w-full max-w-md">

        <div className="text-center mb-8">
          <p className="font-[family-name:var(--font-mono)] text-xs tracking-[0.2em] text-[#BD7B54] uppercase mb-3">
            Access · Skincare AI
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-medium text-[#20241F]">
            {step === 'email' ? 'Reset your password' : 'Enter your OTP'}
          </h1>
        </div>

        {step === 'email' ? (
          <form onSubmit={handleSendOtp} className="space-y-6">
            <div>
              <label className="block font-[family-name:var(--font-mono)] text-[11px] tracking-[0.12em] text-[#20241F]/60 uppercase mb-2">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-transparent border-b-2 border-[#20241F]/15 px-1 py-2 text-sm text-[#20241F] focus:outline-none focus:border-[#BD7B54] transition-colors"
                placeholder="you@example.com"
              />
            </div>

            {error && (
              <div className="border-l-4 border-red-500 bg-red-500/5 px-3 py-2">
                <p className="font-[family-name:var(--font-mono)] text-xs text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#182019] text-[#F5F2EA] py-3 text-sm font-[family-name:var(--font-mono)] uppercase tracking-[0.12em] hover:bg-[#BD7B54] transition-colors disabled:opacity-50 cursor-pointer rounded-md flex items-center justify-center gap-2"
            >
              <Mail size={14} />
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div className="rounded-lg border border-[#BD7B54]/25 bg-[#BD7B54]/5 px-4 py-3">
              <p className="text-sm text-[#20241F]/75">OTP sent to <strong className="text-[#20241F]">{email}</strong>. Check your inbox.</p>
            </div>

            <div>
              <label className="block font-[family-name:var(--font-mono)] text-[11px] tracking-[0.12em] text-[#20241F]/60 uppercase mb-2">
                6-digit OTP
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                maxLength={6}
                className="w-full bg-transparent border-b-2 border-[#20241F]/15 px-1 py-2 text-sm text-[#20241F] focus:outline-none focus:border-[#BD7B54] transition-colors tracking-[0.3em] text-center font-[family-name:var(--font-display)] text-lg"
                placeholder="000000"
              />
            </div>

            <div>
              <label className="block font-[family-name:var(--font-mono)] text-[11px] tracking-[0.12em] text-[#20241F]/60 uppercase mb-2">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full bg-transparent border-b-2 border-[#20241F]/15 px-1 py-2 text-sm text-[#20241F] focus:outline-none focus:border-[#BD7B54] transition-colors"
                placeholder="Min 8 characters"
              />
            </div>

            {error && (
              <div className="border-l-4 border-red-500 bg-red-500/5 px-3 py-2">
                <p className="font-[family-name:var(--font-mono)] text-xs text-red-600">{error}</p>
              </div>
            )}

            {success && (
              <div className="border-l-4 border-emerald-500 bg-emerald-500/5 px-3 py-2">
                <p className="font-[family-name:var(--font-mono)] text-xs text-emerald-700">{success}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#182019] text-[#F5F2EA] py-3 text-sm font-[family-name:var(--font-mono)] uppercase tracking-[0.12em] hover:bg-[#BD7B54] transition-colors disabled:opacity-50 cursor-pointer rounded-md"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>

            <button
              type="button"
              onClick={() => setStep('email')}
              className="w-full text-[#20241F]/50 text-sm hover:text-[#20241F] transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <ArrowLeft size={13} /> Back
            </button>
          </form>
        )}

        <p className="text-center text-sm text-[#20241F]/55 mt-8">
          Remember your password?{' '}
          <a href="/login" className="text-[#BD7B54] font-medium hover:underline underline-offset-2 cursor-pointer">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
