'use client';

import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-rose-50">
      <div className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-rose-500">SkinCare AI</h1>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/login')}
            className="border border-rose-300 text-rose-500 px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-50 transition"
          >
            Sign In
          </button>
          <button
            onClick={() => router.push('/register')}
            className="bg-rose-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-600 transition"
          >
            Get Started
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h2 className="text-4xl font-bold text-gray-800 mb-4">
          AI-Powered Skincare<br />
          <span className="text-rose-500">Personalized For You</span>
        </h2>
        <p className="text-gray-600 text-lg mb-8 max-w-xl mx-auto">
          Analyze your skin with advanced AI, get personalized recommendations based on your skin type, concerns, and today's weather.
        </p>
        <button
          onClick={() => router.push('/register')}
          className="bg-rose-500 text-white px-8 py-3 rounded-xl text-md font-medium hover:bg-rose-600 transition shadow-md"
        >
          Start Free Analysis →
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
            <p className="text-4xl mb-3">📷</p>
            <h3 className="font-semibold text-gray-800 mb-2">Skin Analysis</h3>
            <p className="text-sm text-gray-500">Upload a photo and get instant AI analysis of acne, redness, texture and more.</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
            <p className="text-4xl mb-3">🌤️</p>
            <h3 className="font-semibold text-gray-800 mb-2">Weather-Aware</h3>
            <p className="text-sm text-gray-500">Recommendations adapt to today's UV index, humidity and weather conditions.</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
            <p className="text-4xl mb-3">📈</p>
            <h3 className="font-semibold text-gray-800 mb-2">Track Progress</h3>
            <p className="text-sm text-gray-500">Monitor your skin improvement over time with detailed progress charts.</p>
          </div>
        </div>
      </div>
    </div>
  );
}