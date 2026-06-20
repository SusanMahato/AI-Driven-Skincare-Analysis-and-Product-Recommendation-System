'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getRecommendation, getScanHistory } from '@/lib/api';
import { isLoggedIn, removeToken } from '@/lib/auth';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function DashboardPage() {
  const router = useRouter();
  const [recommendation, setRecommendation] = useState<any>(null);
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedScan, setSelectedScan] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!isLoggedIn()) {
        router.push('/login');
        return;
      }
      loadData();
    }
  }, []);

  const loadData = async () => {
    try {
      const [recRes, histRes] = await Promise.all([
        getRecommendation(),
        getScanHistory()
      ]);
      setRecommendation(recRes.data);
      setScanHistory(histRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

 const chartData = [...scanHistory].reverse().map((scan: any, index: number) => ({
    scan: `#${index + 1}`,
    date: new Date(scan.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    Acne: Math.round(scan.acne_score * 100),
    Redness: Math.round(scan.redness_score * 100),
    Texture: Math.round(scan.texture_score * 100),
    'Dark Spots': Math.round(scan.dark_spots_score * 100),
    Pores: Math.round(scan.pores_score * 100),
    'Dark Circles': Math.round(scan.dark_circles_score * 100),
  }));

  const getImprovement = (key: string) => {
    if (scanHistory.length < 2) return null;
    const first = scanHistory[scanHistory.length - 1][key];
    const latest = scanHistory[0][key];
    const diff = Math.round((latest - first) * 100);
    return diff;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-rose-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3">✨</div>
          <p className="text-gray-500 text-sm">Loading your skin data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-rose-500 text-xl font-bold">SkinCare AI</span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/scan')}
            className="bg-rose-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-rose-600 transition flex items-center gap-2 cursor-pointer"
          >
            📷 New Scan
          </button>
          <button
            onClick={() => router.push('/profile')}
            className="border border-gray-200 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition cursor-pointer"
          >
            Profile
          </button>
          <button
            onClick={() => { removeToken(); router.push('/login'); }}
            className="border border-red-200 text-red-500 px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-50 transition cursor-pointer"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-400 mb-1">Total Scans</p>
            <p className="text-2xl font-bold text-gray-800">{scanHistory.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-400 mb-1">Last Acne Score</p>
            <p className="text-2xl font-bold text-rose-500">
              {scanHistory.length > 0 ? `${Math.round(scanHistory[0].acne_score * 100)}%` : '—'}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-400 mb-1">Recommended SPF</p>
            <p className="text-2xl font-bold text-orange-500">
              {recommendation?.recommended_spf || '—'}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-400 mb-1">Ingredients</p>
            <p className="text-2xl font-bold text-purple-500">
              {recommendation?.ingredients?.length || '—'}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {['overview', 'progress', 'history'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition cursor-pointer ${
                activeTab === tab
                  ? 'bg-rose-500 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-rose-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {recommendation ? (
              <>
                {/* Skin Report */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-lg">🔍</span>
                    <h3 className="font-semibold text-gray-800">Your Skin Report</h3>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">{recommendation.skin_report}</p>
                </div>

                {/* Routines */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-orange-100">
                    <p className="text-sm font-semibold text-orange-600 mb-3">☀️ Morning Routine</p>
                    <div className="space-y-2">
                      {recommendation.morning_routine.map((step: string, i: number) => (
                        <div key={i} className="flex items-center gap-3 bg-white rounded-xl px-3 py-2">
                          <span className="w-5 h-5 bg-orange-100 text-orange-600 rounded-full text-xs flex items-center justify-center font-bold">{i + 1}</span>
                          <span className="text-sm text-gray-700">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-purple-100">
                    <p className="text-sm font-semibold text-purple-600 mb-3">🌙 Night Routine</p>
                    <div className="space-y-2">
                      {recommendation.night_routine.map((step: string, i: number) => (
                        <div key={i} className="flex items-center gap-3 bg-white rounded-xl px-3 py-2">
                          <span className="w-5 h-5 bg-purple-100 text-purple-600 rounded-full text-xs flex items-center justify-center font-bold">{i + 1}</span>
                          <span className="text-sm text-gray-700">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Ingredients */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-lg">🧴</span>
                    <h3 className="font-semibold text-gray-800">Recommended Ingredients</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recommendation.ingredients.map((ing: string, i: number) => (
                      <span key={i} className="bg-rose-50 text-rose-600 border border-rose-100 text-xs px-3 py-1.5 rounded-full font-medium">
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
                <p className="text-4xl mb-3">📷</p>
                <h3 className="font-semibold text-gray-800 mb-2">No scan yet</h3>
                <p className="text-gray-500 text-sm mb-4">Complete the quiz and do your first scan to get personalized recommendations.</p>
                <button
                  onClick={() => router.push('/quiz')}
                  className="bg-rose-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-rose-600 transition cursor-pointer"
                >
                  Start Quiz →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Progress Tab */}
        {activeTab === 'progress' && (
          <div className="space-y-6">
            {chartData.length > 1 ? (
              <>
                {/* Improvement Summary */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="font-semibold text-gray-800 mb-4">Change Since First Scan</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { label: 'Acne', key: 'acne_score', color: 'text-rose-500' },
                      { label: 'Redness', key: 'redness_score', color: 'text-orange-500' },
                      { label: 'Texture', key: 'texture_score', color: 'text-purple-500' },
                      { label: 'Dark Spots', key: 'dark_spots_score', color: 'text-amber-600' },
                      { label: 'Pores', key: 'pores_score', color: 'text-blue-500' },
                      { label: 'Dark Circles', key: 'dark_circles_score', color: 'text-indigo-500' },
                    ].map(({ label, key, color }) => {
                      const change = getImprovement(key);
                      const improved = change !== null && change < 0;
                      const worsened = change !== null && change > 0;
                      return (
                        <div key={key} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                          <p className="text-xs text-gray-400">{label}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <p className={`text-lg font-bold ${color}`}>
                              {change !== null ? `${change > 0 ? '+' : ''}${change}%` : '—'}
                            </p>
                            {improved && <span className="text-green-500 text-xs">↓ improved</span>}
                            {worsened && <span className="text-red-400 text-xs">↑ worsened</span>}
                            {change === 0 && <span className="text-gray-400 text-xs">no change</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

               {/* Small Multiples Charts */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="font-semibold text-gray-800 mb-2">Skin Progress Over Time</h3>
                  <p className="text-xs text-gray-400 mb-6">Lower is better — a downward trend means improvement</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { key: 'Acne', color: '#dc2626' },
                      { key: 'Redness', color: '#ea580c' },
                      { key: 'Texture', color: '#9333ea' },
                      { key: 'Dark Spots', color: '#16a34a' },
                      { key: 'Pores', color: '#2563eb' },
                      { key: 'Dark Circles', color: '#db2777' },
                    ].map(({ key, color }) => (
                      <div key={key} className="border border-gray-100 rounded-xl p-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">{key}</p>
                        <ResponsiveContainer width="100%" height={140}>
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" width={35} />
                            <Tooltip formatter={(value) => `${value}%`} />
                            <Line type="monotone" dataKey={key} stroke={color} strokeWidth={2} dot={{ r: 3 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ))}
                  </div>
                </div>    </>
            ) : (
              <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
                <p className="text-gray-400 text-sm">Do at least 2 scans to see your progress chart.</p>
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4">Scan History</h3>
            {scanHistory.length > 0 ? (
              <div className="space-y-3">
                {scanHistory.map((scan: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => setSelectedScan(scan)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-rose-200 hover:bg-rose-50/30 transition text-left cursor-pointer"
                  >
                    {scan.photo_url ? (
                      <img
                        src={`http://127.0.0.1:8000${scan.photo_url}`}
                        alt="Scan"
                        className="w-14 h-14 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center flex-shrink-0 text-xl">
                        📷
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">Scan #{scanHistory.length - i}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{new Date(scan.created_at).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</p>
                    </div>
                    <span className="text-gray-300 text-lg">›</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400 text-sm">No scans yet.</p>
              </div>
            )}
          </div>
        )}

        {/* Scan Detail Modal */}
        {selectedScan && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
            onClick={() => setSelectedScan(null)}
          >
            <div
              className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-800">
                  Scan Details — {new Date(selectedScan.created_at).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                </h3>
                <button onClick={() => setSelectedScan(null)} className="text-gray-400 hover:text-gray-600 text-xl cursor-pointer">✕</button>
              </div>

              {selectedScan.photo_url ? (
                <img
                  src={`http://127.0.0.1:8000${selectedScan.photo_url}`}
                  alt="Scan"
                  className="w-full max-h-80 object-contain rounded-xl border border-gray-200 mb-4 bg-gray-50"
                />
              ) : (
                <div className="w-full h-40 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center mb-4 text-4xl">
                  📷
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400">Acne</p>
                  <p className="text-lg font-bold text-rose-500">{Math.round(selectedScan.acne_score * 100)}%</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400">Redness</p>
                  <p className="text-lg font-bold text-orange-500">{Math.round(selectedScan.redness_score * 100)}%</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400">Texture</p>
                  <p className="text-lg font-bold text-purple-500">{Math.round(selectedScan.texture_score * 100)}%</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400">Dark Spots</p>
                  <p className="text-lg font-bold text-amber-600">{Math.round(selectedScan.dark_spots_score * 100)}%</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400">Pores</p>
                  <p className="text-lg font-bold text-blue-500">{Math.round(selectedScan.pores_score * 100)}%</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400">Dark Circles</p>
                  <p className="text-lg font-bold text-indigo-500">{Math.round(selectedScan.dark_circles_score * 100)}%</p>
                </div>
              </div>

              {selectedScan.weather_condition && (
                <div className="mt-4 bg-rose-50 rounded-lg p-3 text-xs text-gray-600">
                  Weather: {selectedScan.weather_condition} · {selectedScan.temperature}°C · UV {selectedScan.uv_index}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}