'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { analyzeScan } from '@/lib/api';
import { isLoggedIn } from '@/lib/auth';

export default function ScanPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!isLoggedIn()) {
        router.push('/login');
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setResult(null);
      setError('');
    }
  };

  const handleScan = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const response = await analyzeScan(file, 27.7172, 85.3240);
      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Scan failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = (score: number) => {
    if (score < 0.3) return 'bg-green-400';
    if (score < 0.6) return 'bg-yellow-400';
    return 'bg-rose-400';
  };

  const scoreLabel = (score: number) => {
    if (score < 0.3) return 'Low';
    if (score < 0.6) return 'Moderate';
    return 'High';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <button onClick={() => router.push('/dashboard')} className="text-rose-500 font-medium text-sm flex items-center gap-1 cursor-pointer">
          ← Back
        </button>
        <h1 className="text-lg font-bold text-gray-800">Skin Analysis</h1>
        <div></div>
      </div>

      <div className="max-w-lg mx-auto px-6 py-8 space-y-6">

        {/* Tips */}
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4">
          <p className="text-sm font-medium text-rose-600 mb-2">📸 Tips for best results</p>
          <ul className="text-xs text-rose-500 space-y-1">
            <li>• Good natural lighting, face the camera directly</li>
            <li>• Remove glasses and pull hair back</li>
            <li>• Clean bare skin, no makeup</li>
          </ul>
        </div>

        {/* Upload */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-md font-semibold text-gray-800 mb-4">Upload Photo</h2>

          <label className="block cursor-pointer">
            <div className="border-2 border-dashed border-rose-200 rounded-xl p-8 text-center hover:border-rose-400 transition">
              {preview ? (
                <img src={preview} alt="Preview" className="w-48 h-48 object-cover rounded-xl mx-auto" />
              ) : (
                <div>
                  <p className="text-5xl mb-3">📷</p>
                  <p className="text-sm font-medium text-gray-600">Click to upload photo</p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG or HEIC</p>
                </div>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {preview && (
            <button
              onClick={() => { setFile(null); setPreview(null); setResult(null); }}
              className="mt-3 text-xs text-gray-400 hover:text-gray-600 transition"
            >
              Remove photo
            </button>
          )}

          {error && (
            <div className="mt-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleScan}
            disabled={!file || loading}
            className="mt-4 w-full bg-rose-500 text-white rounded-xl py-3 text-sm font-semibold hover:bg-rose-600 transition disabled:opacity-50 shadow-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span> Analyzing your skin...
              </span>
            ) : 'Analyze Skin'}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-md font-semibold text-gray-800 mb-5">Analysis Results</h3>

            <div className="space-y-4">
              {Object.entries(result.cv_scores)
                .filter(([key]) => key !== 'photo_confidence')
                .map(([key, value]: [string, any]) => (
                  <div key={key}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-gray-600 capitalize font-medium">
                        {key.replace('_score', '').replace('_', ' ')}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full text-white ${scoreColor(value)}`}>
                          {scoreLabel(value)}
                        </span>
                        <span className="text-gray-800 font-semibold">{(value * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`${scoreColor(value)} h-2 rounded-full transition-all duration-500`}
                        style={{ width: `${value * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>

            <div className="mt-5 bg-gray-50 rounded-xl p-4 flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-400">Weather at scan time</p>
                <p className="text-sm text-gray-700 mt-0.5 font-medium">
                  {result.weather.weather_condition} · {result.weather.temperature}°C
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">UV Index</p>
                <p className="text-sm font-bold text-orange-500">{result.weather.uv_index}</p>
              </div>
            </div>

            <button
              onClick={() => router.push('/dashboard')}
              className="mt-4 w-full bg-gray-800 text-white rounded-xl py-3 text-sm font-semibold hover:bg-gray-900 transition"
            >
              View Full Recommendation →
            </button>
          </div>
        )}

      </div>
    </div>
  );
}