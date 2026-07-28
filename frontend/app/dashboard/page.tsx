'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getRecommendation, getScanHistory, getProductRecommendations, compareScans } from '@/lib/api';
import { isLoggedIn, removeToken } from '@/lib/auth';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ProductTabs from '@/components/ProductTabs';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

const CONDITION_LABELS: Record<string, string> = {
  acne: 'Acne',
  redness: 'Redness',
  wrinkles: 'Wrinkles',
  dark_spots: 'Dark Spots',
  pores: 'Pores',
  dark_circles: 'Dark Circles',
};

export default function DashboardPage() {
  const router = useRouter();
  const [recommendation, setRecommendation] = useState<any>(null);
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [productRec, setProductRec] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedScan, setSelectedScan] = useState<any>(null);

  // Scan comparison state
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<number[]>([]);
  const [comparisonResult, setComparisonResult] = useState<any>(null);
  const [comparing, setComparing] = useState(false);
  const [compareError, setCompareError] = useState('');

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
        getRecommendation().catch(() => ({ data: null })),
        getScanHistory().catch(() => ({ data: [] })),
      ]);
      setRecommendation(recRes.data);
      setScanHistory(histRes.data);

      try {
        const prodRes = await getProductRecommendations();
        setProductRec(prodRes.data);
      } catch {
        setProductRec(null);
      }
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
    Wrinkles: Math.round(scan.wrinkles_score * 100),
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

  const toggleCompareMode = () => {
    setCompareMode((prev) => !prev);
    setSelectedForCompare([]);
    setComparisonResult(null);
    setCompareError('');
  };

  const toggleScanSelection = (scanId: number) => {
    setSelectedForCompare((prev) => {
      if (prev.includes(scanId)) {
        return prev.filter((id) => id !== scanId);
      }
      if (prev.length >= 2) {
        return prev;
      }
      return [...prev, scanId];
    });
  };

  const handleCompare = async () => {
    if (selectedForCompare.length !== 2) return;
    setComparing(true);
    setCompareError('');
    try {
      const res = await compareScans(selectedForCompare[0], selectedForCompare[1]);
      setComparisonResult(res.data);
    } catch (err: any) {
      setCompareError(err.response?.data?.detail || 'Comparison failed. Please try again.');
    } finally {
      setComparing(false);
    }
  };

  const closeComparison = () => {
    setComparisonResult(null);
    setCompareError('');
    setCompareMode(false);
    setSelectedForCompare([]);
  };

  const statusStyle = (status: string) => {
    if (status === 'improved') return { text: 'text-green-600', bg: 'bg-green-50', icon: '↓', label: 'Improved' };
    if (status === 'worsened') return { text: 'text-rose-500', bg: 'bg-rose-50', icon: '↑', label: 'Worsened' };
    if (status === 'no_data') return { text: 'text-gray-400', bg: 'bg-gray-50', icon: '—', label: 'No data' };
    return { text: 'text-gray-500', bg: 'bg-gray-50', icon: '→', label: 'No significant change' };
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
            onClick={() => {
              removeToken();
              router.push('/login');
            }}
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
        <div className="flex gap-2 mb-6 flex-wrap">
          {['overview', 'recommendations', 'progress', 'history'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition cursor-pointer ${
                activeTab === tab
                  ? 'bg-rose-500 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-rose-200'
              }`}
            >
              {tab === 'recommendations' ? '🧴 Products' : tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {recommendation ? (
              <>
                {/* Skin Condition Scores */}
                {scanHistory.length > 0 && (
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-lg">📊</span>
                      <h3 className="font-semibold text-gray-800">Your Skin Conditions</h3>
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: 'Acne', key: 'acne_score', color: 'bg-rose-500' },
                        { label: 'Redness', key: 'redness_score', color: 'bg-orange-400' },
                        { label: 'Wrinkles', key: 'wrinkles_score', color: 'bg-purple-500' },
                        { label: 'Dark Spots', key: 'dark_spots_score', color: 'bg-amber-500' },
                        { label: 'Pores', key: 'pores_score', color: 'bg-blue-500' },
                        { label: 'Dark Circles', key: 'dark_circles_score', color: 'bg-indigo-500' },
                      ].map(({ label, key, color }) => {
                        const score = Math.round((scanHistory[0][key] || 0) * 100);
                        const severity = score >= 60 ? 'High' : score >= 30 ? 'Moderate' : 'Low';
                        const severityColor =
                          score >= 60 ? 'text-rose-500' : score >= 30 ? 'text-amber-500' : 'text-green-500';
                        return (
                          <div key={key}>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm text-gray-700">{label}</span>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-medium ${severityColor}`}>{severity}</span>
                                <span className="text-sm font-bold text-gray-800">{score}%</span>
                              </div>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                              <div
                                className={`${color} h-2 rounded-full transition-all`}
                                style={{ width: `${score}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Skin Report */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-lg">🔍</span>
                    <h3 className="font-semibold text-gray-800">Your Skin Report</h3>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">{recommendation.skin_report}</p>
                </div>

                {/* Recommended Ingredients */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🧴</span>
                      <h3 className="font-semibold text-gray-800">Recommended Ingredients</h3>
                    </div>
                    <button
                      onClick={() => setActiveTab('recommendations')}
                      className="text-xs text-rose-500 font-medium hover:underline cursor-pointer"
                    >
                      See products →
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recommendation.ingredients.map((ing: string, i: number) => (
                      <span
                        key={i}
                        className="bg-rose-50 text-rose-600 border border-rose-100 text-xs px-3 py-1.5 rounded-full font-medium"
                      >
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
                <p className="text-gray-500 text-sm mb-4">
                  Complete the quiz and do your first scan to get personalized recommendations.
                </p>
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

        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && (
          <div>
            {productRec ? (
              <ProductTabs data={productRec} />
            ) : (
              <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
                <p className="text-4xl mb-3">🧴</p>
                <h3 className="font-semibold text-gray-800 mb-2">No recommendations yet</h3>
                <p className="text-gray-500 text-sm mb-4">
                  Complete the quiz and do a scan to get personalized product recommendations.
                </p>
                <button
                  onClick={() => router.push('/scan')}
                  className="bg-rose-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-rose-600 transition cursor-pointer"
                >
                  Start Scan →
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
                      { label: 'Wrinkles', key: 'wrinkles_score', color: 'text-purple-500' },
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

                {/* Charts */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="font-semibold text-gray-800 mb-2">Skin Progress Over Time</h3>
                  <p className="text-xs text-gray-400 mb-6">Lower is better — a downward trend means improvement</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { key: 'Acne', color: '#dc2626' },
                      { key: 'Redness', color: '#ea580c' },
                      { key: 'Wrinkles', color: '#9333ea' },
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
                </div>
              </>
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Scan History</h3>
              {scanHistory.length >= 2 && (
                <button
                  onClick={toggleCompareMode}
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    compareMode
                      ? 'bg-gray-800 text-white hover:bg-gray-900'
                      : 'bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100'
                  }`}
                >
                  {compareMode ? '✕ Cancel Compare' : '⇄ Compare Scans'}
                </button>
              )}
            </div>

            {compareMode && (
              <div className="mb-4 bg-rose-50 border border-rose-100 rounded-xl p-3 text-xs text-rose-600 font-medium">
                Selected {selectedForCompare.length} of 2 scans
              </div>
            )}

            {scanHistory.length > 0 ? (
              <div className="space-y-3">
                {scanHistory.map((scan: any, i: number) => {
                  const isSelected = selectedForCompare.includes(scan.id);
                  const isDisabled = compareMode && !isSelected && selectedForCompare.length >= 2;
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        if (isDisabled) return;
                        compareMode ? toggleScanSelection(scan.id) : setSelectedScan(scan);
                      }}
                      disabled={isDisabled}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition text-left ${
                        isDisabled
                          ? 'border-gray-100 opacity-40 cursor-not-allowed'
                          : isSelected
                          ? 'border-rose-500 bg-rose-50 cursor-pointer'
                          : 'border-gray-100 hover:border-rose-200 hover:bg-rose-50/30 cursor-pointer'
                      }`}
                    >
                      {scan.photo_url ? (
                        <img
                          src={`${API_BASE_URL}${scan.photo_url}`}
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
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(scan.created_at).toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      {compareMode ? (
                        isSelected && (
                          <span className="text-rose-500 text-sm font-semibold flex-shrink-0">✓ Selected</span>
                        )
                      ) : (
                        <span className="text-gray-300 text-lg">›</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400 text-sm">No scans yet.</p>
              </div>
            )}

            {compareError && (
              <div className="mt-4 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <p className="text-red-600 text-sm">{compareError}</p>
              </div>
            )}

            {compareMode && selectedForCompare.length === 2 && (
              <button
                onClick={handleCompare}
                disabled={comparing}
                className="mt-4 w-full bg-rose-500 text-white rounded-xl py-3 text-sm font-semibold hover:bg-rose-600 transition disabled:opacity-50 shadow-sm cursor-pointer"
              >
                {comparing ? 'Comparing...' : 'Compare Selected Scans'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Scan Comparison Result Modal */}
      {comparisonResult && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
          onClick={closeComparison}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-800">Scan Comparison</h3>
              <button onClick={closeComparison} className="text-gray-400 hover:text-gray-600 text-xl cursor-pointer">
                ✕
              </button>
            </div>

            {/* Timeline */}
            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3 mb-5 text-xs">
              <div className="text-center">
                <p className="text-gray-400">Older Scan</p>
                <p className="font-semibold text-gray-700 mt-0.5">
                  {new Date(comparisonResult.older_scan.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>

              <span className="text-rose-400 text-lg">→</span>

              <div className="text-center">
                <p className="text-gray-400">Newer Scan</p>
                <p className="font-semibold text-gray-700 mt-0.5">
                  {new Date(comparisonResult.newer_scan.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {/* Summary */}
            <div className="flex gap-2 mb-5">
              <div className="flex-1 bg-green-50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-green-600">{comparisonResult.summary.improved}</p>
                <p className="text-xs text-green-600">Improved</p>
              </div>
              <div className="flex-1 bg-rose-50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-rose-500">{comparisonResult.summary.worsened}</p>
                <p className="text-xs text-rose-500">Worsened</p>
              </div>
              <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-gray-500">{comparisonResult.summary.no_significant_change}</p>
                <p className="text-xs text-gray-500">Unchanged</p>
              </div>
            </div>

            {/* Per-condition breakdown */}
            <div className="space-y-2">
              {comparisonResult.comparisons.map((c: any) => {
                const style = statusStyle(c.status);
                return (
                  <div key={c.condition} className={`flex items-center justify-between rounded-xl p-3 ${style.bg}`}>
                    <span className="text-sm font-medium text-gray-700">
                      {CONDITION_LABELS[c.condition] || c.condition}
                    </span>
                    <div className="flex items-center gap-3 text-xs">
                      {c.older_score !== null && c.newer_score !== null ? (
                        <span className="text-gray-500">
                          {Math.round(c.older_score * 100)}% → {Math.round(c.newer_score * 100)}%
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                      <span className={`font-semibold ${style.text}`}>
                        {style.icon} {style.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Scan Details Modal */}
      {selectedScan && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
          onClick={() => setSelectedScan(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-semibold text-gray-800">Scan Details</h3>
              <button
                onClick={() => setSelectedScan(null)}
                className="text-gray-400 hover:text-gray-600 text-xl cursor-pointer"
              >
                ✕
              </button>
            </div>

            {selectedScan.photo_url && (
              <img
                src={`${API_BASE_URL}${selectedScan.photo_url}`}
                alt="Scan"
                className="w-full h-72 object-cover rounded-xl border border-gray-200 mb-5"
              />
            )}

            <div className="mb-5">
              <p className="text-xs text-gray-400">Scan Date</p>
              <p className="font-medium text-gray-700">{new Date(selectedScan.created_at).toLocaleString()}</p>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Acne', key: 'acne_score' },
                { label: 'Redness', key: 'redness_score' },
                { label: 'Wrinkles', key: 'wrinkles_score' },
                { label: 'Dark Spots', key: 'dark_spots_score' },
                { label: 'Pores', key: 'pores_score' },
                { label: 'Dark Circles', key: 'dark_circles_score' },
              ].map(({ label, key }) => {
                const score = Math.round((selectedScan[key] || 0) * 100);

                return (
                  <div key={key}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-700">{label}</span>
                      <span className="font-semibold text-gray-800">{score}%</span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-gray-100">
                      <div className="bg-rose-500 h-2 rounded-full" style={{ width: `${score}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
