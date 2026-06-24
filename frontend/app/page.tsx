'use client';

import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">

      {/* Header */}
      <div className="border-b border-gray-100 px-6 py-4 flex justify-between items-center sticky top-0 bg-white/90 backdrop-blur-md z-10">
        <h1 className="text-xl font-bold text-rose-500">SkinCare AI</h1>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/login')}
            className="border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition cursor-pointer"
          >
            Sign In
          </button>
          <button
            onClick={() => router.push('/register')}
            className="bg-rose-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-rose-600 transition cursor-pointer"
          >
            Get Started Free
          </button>
        </div>
      </div>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-rose-50 text-rose-600 text-xs font-medium px-3 py-1.5 rounded-full mb-6 border border-rose-100">
          ✨ AI-Powered Skin Analysis
        </div>
        <h2 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
          Know Your Skin.<br />
          <span className="text-rose-500">Glow With Confidence.</span>
        </h2>
        <p className="text-gray-500 text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
          Upload a photo, answer a few questions, and get a personalized skincare routine powered by AI — tailored to your skin type and today's weather.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <button
            onClick={() => router.push('/register')}
            className="bg-rose-500 text-white px-8 py-4 rounded-xl text-md font-semibold hover:bg-rose-600 transition shadow-lg shadow-rose-200 cursor-pointer"
          >
            Start Free Analysis →
          </button>
          <button
            onClick={() => router.push('/login')}
            className="border border-gray-200 text-gray-700 px-8 py-4 rounded-xl text-md font-semibold hover:bg-gray-50 transition cursor-pointer"
          >
            Sign In
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-4">Free forever · No credit card required</p>
      </div>

      {/* How it works */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-800 mb-3">How It Works</h3>
            <p className="text-gray-500">Three simple steps to better skin</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', emoji: '📋', title: 'Take the Quiz', desc: 'Answer 7 quick questions about your skin type, concerns and goals.' },
              { step: '02', emoji: '📷', title: 'Upload a Photo', desc: 'Take a clear selfie and our AI analyzes acne, redness, texture and more.' },
              { step: '03', emoji: '✨', title: 'Get Your Routine', desc: 'Receive a personalized morning and night routine with recommended ingredients.' },
            ].map(({ step, emoji, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                  {emoji}
                </div>
                <p className="text-xs font-bold text-rose-400 mb-2">STEP {step}</p>
                <h4 className="font-bold text-gray-800 text-lg mb-2">{title}</h4>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-gray-800 mb-3">Everything Your Skin Needs</h3>
          <p className="text-gray-500">Powered by AI, personalized for you</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { emoji: '🔬', title: 'Deep Skin Analysis', desc: 'Detects acne, redness, texture, dark spots, pores and dark circles from a single photo.' },
            { emoji: '🌤️', title: 'Weather-Aware', desc: 'UV index, humidity and temperature all factor into your daily recommendations.' },
            { emoji: '📈', title: 'Progress Tracking', desc: 'Track improvement across all skin conditions with beautiful progress charts.' },
            { emoji: '🧴', title: 'Ingredient Guide', desc: 'Know exactly why each ingredient was chosen and how to use it safely.' },
            { emoji: '🎯', title: 'Goal-Based Routine', desc: 'Whether you want clear skin, anti-aging, or hydration — we build around your goal.' },
            { emoji: '🔒', title: 'Private & Secure', desc: 'Your photos and skin data are yours. We never share your personal information.' },
          ].map(({ emoji, title, desc }) => (
            <div key={title} className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-md transition hover:border-rose-100">
              <p className="text-3xl mb-3">{emoji}</p>
              <h4 className="font-semibold text-gray-800 mb-2">{title}</h4>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-br from-rose-500 to-pink-500 py-20">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h3 className="text-3xl font-bold text-white mb-4">Ready to Transform Your Skin?</h3>
          <p className="text-rose-100 text-lg mb-8">Join and get your personalized skincare routine in minutes.</p>
          <button
            onClick={() => router.push('/register')}
            className="bg-white text-rose-500 px-8 py-4 rounded-xl text-md font-bold hover:bg-rose-50 transition shadow-lg cursor-pointer"
          >
            Get Started Free →
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 px-6 py-8 text-center">
        <p className="text-sm text-gray-400">© Built with ❤️ for better skin</p>
      </div>

    </div>
  );
}