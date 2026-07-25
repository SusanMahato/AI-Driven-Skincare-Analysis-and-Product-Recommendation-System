'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import { registerUser } from '@/lib/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

// NOTE: hoist these into layout.tsx if not already done there for the login page,
// so fonts aren't re-initialized per route.
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

const SCAN_TAGS = [
  { label: 'ACNE', top: '30%', left: '38%' },
  { label: 'WRINKLES', top: '42%', left: '75%' },
  { label: 'DARK CIRCLES', top: '72%', left: '78%' },
  { label: 'REDNESS', top: '88%', left: '38%' },
  { label: 'DARK SPOTS', top: '72%', left: '10%' },
  { label: 'PORES', top: '42%', left: '10%' },
];

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await registerUser({ full_name: fullName, email, password });
      setRegistrationSuccess(true);
      setTimeout(() => router.push('/login'), 3000);
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

  if (registrationSuccess) {
    return (
      <div
        className={`${fraunces.variable} ${plexSans.variable} ${plexMono.variable} min-h-screen flex bg-[#F5F2EA] font-[family-name:var(--font-body)]`}
      >
        <div className="hidden lg:block relative w-2/5 overflow-hidden bg-[#182019]">
          <img
            src="/skincare-hero.jpeg"
            alt="Skincare atmosphere"
            className="absolute inset-0 w-full h-full object-cover grayscale contrast-110"
          />
          <div
            className="absolute inset-0 mix-blend-color"
            style={{
              background: 'linear-gradient(160deg, #182019 15%, #93A899 60%, #C9A47E 100%)',
            }}
          />
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm">
            <div className="text-center">
              <p className="text-5xl mb-6">✅</p>
              <h1 className="font-[family-name:var(--font-display)] text-3xl font-medium text-[#20241F] mb-4">
                Account Created!
              </h1>
              <p className="text-sm text-[#20241F]/70 mb-2">
                We've sent a verification link to:
              </p>
              <p className="font-medium text-[#20241F] mb-6">{email}</p>
              <div className="bg-[#F5F2EA] border border-[#BD7B54]/20 rounded-lg px-4 py-4 mb-6">
                <p className="text-sm text-[#20241F]/70">
                  Check your email and click the verification link to activate your account. The link expires in 24 hours.
                </p>
              </div>
              <p className="text-xs text-[#20241F]/50 mb-4">
                Redirecting to login in a few seconds...
              </p>
              <button
                onClick={() => router.push('/login')}
                className="text-sm font-[family-name:var(--font-mono)] text-[#BD7B54] hover:text-[#20241F] transition-colors"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${fraunces.variable} ${plexSans.variable} ${plexMono.variable} min-h-screen flex bg-[#F5F2EA] font-[family-name:var(--font-body)]`}
    >
      {/* LEFT — atmosphere panel */}
      <div className="hidden lg:block relative w-2/5 overflow-hidden bg-[#182019]">
        <img
          src="/skincare-hero.jpeg"
          alt="Skincare atmosphere"
          className="absolute inset-0 w-full h-full object-cover grayscale contrast-110"
        />
        <div
          className="absolute inset-0 mix-blend-color"
          style={{
            background: 'linear-gradient(160deg, #182019 15%, #93A899 60%, #C9A47E 100%)',
          }}
        />
        <div className="absolute inset-0 bg-[#182019]/40" />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 42% 58%, transparent 0%, transparent 30%, rgba(24,32,25,0.55) 85%)',
          }}
        />

        <div className="absolute inset-0">
          <svg
            viewBox="0 0 400 400"
            className="absolute top-[58%] left-[38%] -translate-x-1/2 -translate-y-1/2 w-[85%] max-w-[420px] scan-ring"
          >
            <circle cx="200" cy="200" r="80" fill="none" stroke="#F5F2EA" strokeOpacity="0.5" strokeWidth="1.25" />
            <circle cx="200" cy="200" r="130" fill="none" stroke="#F5F2EA" strokeOpacity="0.35" strokeWidth="1.25" />
            <circle
              cx="200"
              cy="200"
              r="175"
              fill="none"
              stroke="#E7C8A6"
              strokeOpacity="0.8"
              strokeWidth="1.5"
              strokeDasharray="3 9"
              className="scan-ring-rotate"
            />
          </svg>

          {SCAN_TAGS.map((tag) => (
            <span
              key={tag.label}
              className="absolute -translate-x-1/2 -translate-y-1/2 font-[family-name:var(--font-mono)] text-[10px] tracking-[0.16em] text-[#F5F2EA] uppercase whitespace-nowrap px-2.5 py-1 rounded-full bg-[#182019]/70 border border-[#F5F2EA]/15"
              style={{ top: tag.top, left: tag.left }}
            >
              {tag.label}
            </span>
          ))}
        </div>

        <style jsx>{`
          .scan-ring-rotate {
            transform-origin: 200px 200px;
            animation: rotate-slow 40s linear infinite;
          }
          @keyframes rotate-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @media (prefers-reduced-motion: reduce) {
            .scan-ring-rotate {
              animation: none;
            }
          }
        `}</style>
      </div>

      {/* RIGHT — form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <p className="font-[family-name:var(--font-mono)] text-xs tracking-[0.2em] text-[#BD7B54] uppercase mb-3">
            Create account
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-medium text-[#20241F] mb-1">
            Sign up
          </h1>
          <p className="text-sm text-[#20241F]/55 mb-8">
            Free forever. No credit card required.
          </p>

          
            <a href={`${API_BASE_URL}/auth/google`} className="w-full flex items-center justify-center gap-3 border border-[#20241F]/15 py-3 text-sm font-medium text-[#20241F]/80 hover:bg-[#20241F]/5 transition-colors cursor-pointer mb-6">
            <svg width="16" height="16" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z" />
              <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.04a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z" />
              <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z" />
              <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.31z" />
            </svg>
            Sign up with Google
          </a>
          
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#20241F]/12"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[#F5F2EA] px-3 font-[family-name:var(--font-mono)] text-[10px] tracking-[0.15em] text-[#20241F]/45 uppercase">
                Or register with email
              </span>
            </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-6">
            <div>
              <label className="block font-[family-name:var(--font-mono)] text-[11px] tracking-[0.12em] text-[#20241F]/60 uppercase mb-2">
                Full name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full bg-transparent border-b-2 border-[#20241F]/15 px-1 py-2 text-sm text-[#20241F] focus:outline-none focus:border-[#BD7B54] transition-colors"
                placeholder="Your full name"
              />
            </div>

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

            <div>
              <label className="block font-[family-name:var(--font-mono)] text-[11px] tracking-[0.12em] text-[#20241F]/60 uppercase mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full bg-transparent border-b-2 border-[#20241F]/15 px-1 py-2 pr-9 text-sm text-[#20241F] focus:outline-none focus:border-[#BD7B54] transition-colors"
                  placeholder="Min 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 text-[#20241F]/35 hover:text-[#20241F] cursor-pointer p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="border-l-4 border-red-500 bg-red-500/5 px-3 py-2">
                <p className="font-[family-name:var(--font-mono)] text-xs text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#182019] text-[#F5F2EA] py-3 text-sm font-[family-name:var(--font-mono)] uppercase tracking-[0.12em] hover:bg-[#BD7B54] transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="mt-8 text-sm text-[#20241F]/55">
            Already have an account?{' '}
            <a href="/login" className="text-[#BD7B54] font-medium hover:underline underline-offset-2 cursor-pointer">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}