'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getRecommendation, getScanHistory, getProductRecommendations, compareScans } from '@/lib/api';
import { isLoggedIn, removeToken } from '@/lib/auth';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ProductTabs from '@/components/ProductTabs';
import JournalTab from '@/components/JournalTab';
import { SKIN_CONDITIONS, CHART_LINE_COLORS } from '@/lib/constants';
import type { Scan, Recommendation, ComparisonResult } from '@/lib/types';

import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import {
  Camera,
  User,
  LogOut,
  LayoutGrid,
  FlaskConical,
  TrendingUp,
  History as HistoryIcon,
  NotebookPen,
  BarChart3,
  ScanSearch,
  X,
  ArrowLeftRight,
  Check,
  ChevronRight,
  LucideIcon
} from 'lucide-react';

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

const TAB_ICONS: Record<string, LucideIcon> = {
  overview: LayoutGrid,
  recommendations: FlaskConical,
  progress: TrendingUp,
  history: HistoryIcon,
  journal: NotebookPen,
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export default function DashboardPage() {
  const router = useRouter();
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [scanHistory, setScanHistory] = useState<Scan[]>([]);
  const [productRec, setProductRec] = useState<any>(null); // ProductTabs' own shape — out of scope for this pass
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedScan, setSelectedScan] = useState<Scan | null>(null);

  // Scan comparison state
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<number[]>([]);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
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

  const chartData = useMemo(() => [...scanHistory].reverse().map((scan, index) => ({
    scan: `#${index + 1}`,
    date: new Date(scan.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    Acne: Math.round(scan.acne_score * 100),
    Redness: Math.round(scan.redness_score * 100),
    Wrinkles: Math.round(scan.wrinkles_score * 100),
    'Dark Spots': Math.round(scan.dark_spots_score * 100),
    Pores: Math.round(scan.pores_score * 100),
    'Dark Circles': Math.round(scan.dark_circles_score * 100),
  })), [scanHistory]);

  const improvementSummary = useMemo(() => {
    if (scanHistory.length < 2) return null;
    const first = scanHistory[scanHistory.length - 1];
    const latest = scanHistory[0];
    return SKIN_CONDITIONS.reduce((acc, { key }) => {
      acc[key] = Math.round(
        ((latest[key as keyof Scan] as number) - (first[key as keyof Scan] as number)) * 100
      );
      return acc;
    }, {} as Record<string, number>);
  }, [scanHistory]);

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
    setCompareMode(false);
    setSelectedForCompare([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F2EA] flex items-center justify-center">
        <div className="text-center">
          <Camera
            size={32}
            className="mx-auto mb-3 text-[#20241F]/30"
            strokeWidth={1.5}
          />
          <p className="text-[#20241F]/60 text-sm font-[family-name:var(--font-mono)]">Loading your skin data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${fraunces.variable} ${plexSans.variable} ${plexMono.variable} min-h-screen bg-[#F5F2EA] font-[family-name:var(--font-body)]`}>
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-[#20241F]/10 bg-[#F5F2EA]/90 backdrop-blur-md px-6 py-4 flex justify-between items-center">
        <span className="font-[family-name:var(--font-display)] text-xl font-medium text-[#20241F]">
          SkinCare AI
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => router.push('/scan')}
            className="cursor-pointer rounded-md bg-[#182019] px-4 py-2 text-sm font-[family-name:var(--font-mono)] uppercase tracking-[0.08em] text-[#F5F2EA] transition hover:bg-[#BD7B54] flex items-center gap-2"
          >
            <Camera size={15} />
            New Scan
          </button>
          <button
           onClick={() => router.push('/profile')}
           className="cursor-pointer rounded-md border border-[#20241F]/15 bg-white/60 px-4 py-2 text-sm font-[family-name:var(--font-mono)] uppercase tracking-[0.08em] text-[#20241F]/80 transition hover:bg-white flex items-center gap-2"
           >
           <User size={15} />
            Profile
          </button>
          <button
           onClick={() => { removeToken(); router.push('/login?logout=success'); }}
           className="cursor-pointer rounded-md border border-red-300/50 px-4 py-2 text-sm font-[family-name:var(--font-mono)] uppercase tracking-[0.08em] text-red-600/80 transition hover:bg-red-50 flex items-center gap-2"
           > 
          <LogOut size={15} />
          Logout
         </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-lg border border-[#20241F]/12 bg-white p-5">
            <p className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#20241F]/50 mb-2">Total Scans</p>
            <p className="font-[family-name:var(--font-display)] text-2xl font-medium text-[#20241F]">{scanHistory.length}</p>
          </div>
          <div className="rounded-lg border border-[#20241F]/12 bg-white p-5">
            <p className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#20241F]/50 mb-2">Last Acne Score</p>
            <p className="font-[family-name:var(--font-display)] text-2xl font-medium text-[#BD7B54]">
              {scanHistory.length > 0 ? `${Math.round(scanHistory[0].acne_score * 100)}%` : '—'}
            </p>
          </div>
          <div className="rounded-lg border border-[#20241F]/12 bg-white p-5">
            <p className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#20241F]/50 mb-2">Recommended SPF</p>
            <p className="font-[family-name:var(--font-display)] text-2xl font-medium text-[#20241F]">
              {recommendation?.recommended_spf || '—'}
            </p>
          </div>
          <div className="rounded-lg border border-[#20241F]/12 bg-white p-5">
            <p className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#20241F]/50 mb-2">Ingredients</p>
            <p className="font-[family-name:var(--font-display)] text-2xl font-medium text-[#20241F]">
              {recommendation?.ingredients?.length || '—'}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {['overview', 'recommendations', 'progress', 'history', 'journal'].map((tab) => {
            const Icon = TAB_ICONS[tab];
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`cursor-pointer rounded-md px-4 py-2 text-sm font-[family-name:var(--font-mono)] uppercase tracking-[0.06em] transition flex items-center gap-2 ${
                  activeTab === tab
                    ? 'bg-[#182019] text-[#F5F2EA]'
                    : 'bg-white text-[#20241F]/60 border border-[#20241F]/12 hover:border-[#BD7B54]/40 hover:text-[#20241F]'
                }`}
              >
                <Icon size={14} />
                {tab === 'recommendations' ? 'Products' : tab}
              </button>
            );
          })}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {recommendation ? (
              <>
                {/* Skin Condition Scores */}
                {scanHistory.length > 0 && (
                  <div className="rounded-lg border border-[#20241F]/12 bg-white p-6">
                    <div className="flex items-center gap-2 mb-5">
                      <BarChart3 size={16} className="text-[#BD7B54]" />
                      <h3 className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#20241F]/50">
                        Your Skin Conditions
                      </h3>
                    </div>
                    <div className="space-y-4">
                      {SKIN_CONDITIONS.map(({ label, key }) => {
                        const score = Math.round(((scanHistory[0][key as keyof Scan] as number) || 0) * 100);
                        const severity = score >= 60 ? 'High' : score >= 30 ? 'Moderate' : 'Low';
                        const severityColor =
                          score >= 60 ? 'text-red-600' : score >= 30 ? 'text-[#BD7B54]' : 'text-emerald-600';
                        const barColor =
                          score >= 60 ? 'bg-red-500' : score >= 30 ? 'bg-[#BD7B54]' : 'bg-emerald-500';
                        return (
                          <div key={key}>
                            <div className="flex justify-between items-center mb-1.5">
                              <span className="text-sm text-[#20241F]/75">{label}</span>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-medium ${severityColor}`}>{severity}</span>
                                <span className="font-[family-name:var(--font-display)] text-sm font-medium text-[#20241F]">{score}%</span>
                              </div>
                            </div>
                            <div className="w-full bg-[#20241F]/8 rounded-full h-1.5">
                              <div
                                className={`${barColor} h-1.5 rounded-full transition-all`}
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
                <div className="rounded-lg border border-[#20241F]/12 bg-white p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <ScanSearch size={16} className="text-[#BD7B54]" />
                    <h3 className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#20241F]/50">
                      Your Skin Report
                    </h3>
                  </div>
                  <p className="text-[#20241F]/75 text-sm leading-relaxed">{recommendation.skin_report}</p>
                </div>

                {/* Recommended Ingredients */}
                <div className="rounded-lg border border-[#20241F]/12 bg-white p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <FlaskConical size={16} className="text-[#BD7B54]" />
                      <h3 className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#20241F]/50">
                        Recommended Ingredients
                      </h3>
                    </div>
                    <button
                      onClick={() => setActiveTab('recommendations')}
                      className="text-xs text-[#BD7B54] font-medium hover:underline cursor-pointer"
                    >
                      See products
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recommendation.ingredients.map((ing: string, i: number) => (
                      <span
                        key={i}
                        className="bg-[#F5F2EA] text-[#20241F]/75 border border-[#20241F]/12 text-xs px-3 py-1.5 rounded-md font-medium"
                      >
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-[#20241F]/12 bg-white p-12 text-center">
                <Camera size={32} className="mx-auto mb-4 text-[#20241F]/30" strokeWidth={1.5} />
                <h3 className="font-[family-name:var(--font-display)] text-lg font-medium text-[#20241F] mb-2">No scan yet</h3>
                <p className="text-[#20241F]/60 text-sm mb-6">
                  Complete the quiz and do your first scan to get personalized recommendations.
                </p>
                <button
                  onClick={() => router.push('/quiz')}
                  className="cursor-pointer rounded-md bg-[#182019] px-6 py-3 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.1em] text-[#F5F2EA] transition hover:bg-[#BD7B54]"
                >
                  Start Quiz
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
              <div className="rounded-lg border border-[#20241F]/12 bg-white p-12 text-center">
                <FlaskConical size={32} className="mx-auto mb-4 text-[#20241F]/30" strokeWidth={1.5} />
                <h3 className="font-[family-name:var(--font-display)] text-lg font-medium text-[#20241F] mb-2">No recommendations yet</h3>
                <p className="text-[#20241F]/60 text-sm mb-6">
                  Complete the quiz and do a scan to get personalized product recommendations.
                </p>
                <button
                  onClick={() => router.push('/scan')}
                  className="cursor-pointer rounded-md bg-[#182019] px-6 py-3 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.1em] text-[#F5F2EA] transition hover:bg-[#BD7B54]"
                >
                  Start Scan
                </button>
              </div>
            )}
          </div>
        )}

        {/* Progress Tab */}
        {activeTab === 'progress' && (
          <div className="space-y-4">
            {scanHistory.length > 1 ? (
              <>
                <div className="rounded-lg border border-[#20241F]/12 bg-white p-6">
                  <h3 className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#20241F]/50 mb-6">
                    Condition Severity Trends (%)
                  </h3>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#20241F" strokeOpacity={0.08} />
                        <XAxis dataKey="date" stroke="#20241F" opacity={0.4} tick={{ fontSize: 12 }} />
                        <YAxis stroke="#20241F" opacity={0.4} tick={{ fontSize: 12 }} domain={[0, 100]} />
                        <Tooltip />
                        {Object.entries(CHART_LINE_COLORS).map(([key, color]) => (
                          <Line key={key} type="monotone" dataKey={key} stroke={color} strokeWidth={2} dot={{ r: 3 }} />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Improvement Summary */}
                <div className="rounded-lg border border-[#20241F]/12 bg-white p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <TrendingUp size={16} className="text-[#BD7B54]" />
                    <h3 className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#20241F]/50">
                      Change Since First Scan
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {SKIN_CONDITIONS.map(({ label, key }) => {
                      const change = improvementSummary ? improvementSummary[key] : null;
                      const improved = change !== null && change < 0;
                      const worsened = change !== null && change > 0;
                      const valueColor = improved ? 'text-emerald-600' : worsened ? 'text-red-600' : 'text-[#20241F]';
                      return (
                        <div key={key} className="rounded-lg border border-[#20241F]/10 bg-[#F5F2EA] p-4">
                          <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.08em] text-[#20241F]/45 mb-1.5">{label}</p>
                          <div className="flex items-center gap-1.5">
                            <p className={`font-[family-name:var(--font-display)] text-lg font-medium ${valueColor}`}>
                              {change !== null ? `${change > 0 ? '+' : ''}${change}%` : '—'}
                            </p>
                            {improved && <span className="text-emerald-600 text-xs">↓ improved</span>}
                            {worsened && <span className="text-red-500 text-xs">↑ worsened</span>}
                            {change === 0 && <span className="text-[#20241F]/40 text-xs">no change</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-[#20241F]/12 bg-white p-12 text-center">
                <TrendingUp size={32} className="mx-auto mb-4 text-[#20241F]/30" strokeWidth={1.5} />
                <h3 className="font-[family-name:var(--font-display)] text-lg font-medium text-[#20241F] mb-2">Not enough scan data</h3>
                <p className="text-[#20241F]/60 text-sm">
                  Complete at least 2 scans over time to see your progress trends.
                </p>
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="rounded-lg border border-[#20241F]/12 bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#20241F]/50">
                Scan History
              </h3>
              {scanHistory.length >= 2 && (
                <button
                  onClick={toggleCompareMode}
                  className={`cursor-pointer rounded-md text-xs font-medium px-3 py-1.5 transition flex items-center gap-1.5 ${
                    compareMode
                      ? 'bg-[#182019] text-[#F5F2EA]'
                      : 'bg-white text-[#BD7B54] border border-[#BD7B54]/30 hover:bg-[#BD7B54]/5'
                  }`}
                >
                  {compareMode ? <X size={13} /> : <ArrowLeftRight size={13} />}
                  {compareMode ? 'Cancel Compare' : 'Compare Scans'}
                </button>
              )}
            </div>

            {compareMode && (
              <div className="mb-4 bg-[#F5F2EA] border border-[#BD7B54]/20 rounded-lg p-3 text-xs text-[#20241F]/70 font-medium">
                Selected {selectedForCompare.length} of 2 scans
              </div>
            )}

            {scanHistory.length > 0 ? (
              <div className="space-y-2">
                {scanHistory.map((scan, i) => {
                  const isSelected = selectedForCompare.includes(scan.id);
                  const isDisabled = compareMode && !isSelected && selectedForCompare.length >= 2;
                  return (
                    <button
                      key={scan.id}
                      onClick={() => {
                        if (isDisabled) return;
                        compareMode ? toggleScanSelection(scan.id) : setSelectedScan(scan);
                      }}
                      disabled={isDisabled}
                      className={`w-full flex items-center gap-4 p-4 rounded-lg border transition text-left ${
                        isDisabled
                          ? 'border-[#20241F]/8 opacity-40 cursor-not-allowed'
                          : isSelected
                          ? 'border-[#BD7B54] bg-[#BD7B54]/5 cursor-pointer'
                          : 'border-[#20241F]/10 hover:border-[#BD7B54]/40 cursor-pointer'
                      }`}
                    >
                      {scan.photo_url ? (
                        <img
                          src={`${API_BASE_URL}${scan.photo_url}`}
                          alt="Scan"
                          className="w-14 h-14 object-cover rounded-md border border-[#20241F]/10 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-md border border-[#20241F]/10 bg-[#F5F2EA] flex items-center justify-center flex-shrink-0">
                          <Camera size={18} className="text-[#20241F]/30" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[#20241F]">Scan #{scanHistory.length - i}</p>
                        <p className="text-xs text-[#20241F]/45 mt-0.5">
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
                          <span className="text-[#BD7B54] text-sm font-semibold flex-shrink-0 flex items-center gap-1">
                            <Check size={14} /> Selected
                          </span>
                        )
                      ) : (
                        <ChevronRight size={18} className="text-[#20241F]/25" />
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-[#20241F]/45 text-sm">No scans yet.</p>
              </div>
            )}

            {compareError && (
              <div className="mt-4 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                <p className="text-red-600 text-sm">{compareError}</p>
              </div>
            )}

            {compareMode && selectedForCompare.length === 2 && (
              <button
                onClick={handleCompare}
                disabled={comparing}
                className="mt-4 w-full cursor-pointer rounded-md bg-[#182019] py-3 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.1em] text-[#F5F2EA] transition hover:bg-[#BD7B54] disabled:opacity-50"
              >
                {comparing ? 'Comparing...' : 'Compare Selected Scans'}
              </button>
            )}
          </div>
        )}

        {/* Journal Tab */}
        {activeTab === 'journal' && <JournalTab />}
      </div>

      {/* Selected Scan Details Modal */}
      {selectedScan && (
        <div className="fixed inset-0 z-50 bg-[#20241F]/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 border border-[#20241F]/10 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedScan(null)}
              className="absolute top-4 right-4 text-[#20241F]/40 hover:text-[#20241F] cursor-pointer p-1"
            >
              <X size={20} />
            </button>
            <h3 className="font-[family-name:var(--font-display)] text-lg font-medium text-[#20241F] mb-1">
              Scan Details
            </h3>
            <p className="text-xs text-[#20241F]/45 mb-5">
              {new Date(selectedScan.created_at).toLocaleString()}
            </p>

            {selectedScan.photo_url && (
              <img
                src={`${API_BASE_URL}${selectedScan.photo_url}`}
                alt="Scan detail"
                className="w-full h-56 object-cover rounded-lg border border-[#20241F]/10 mb-6"
              />
            )}

            <div className="space-y-3">
              {SKIN_CONDITIONS.map(({ label, key }) => {
                const score = Math.round(((selectedScan[key as keyof Scan] as number) || 0) * 100);
                return (
                  <div key={key} className="flex justify-between items-center text-sm border-b border-[#20241F]/8 pb-2">
                    <span className="text-[#20241F]/65">{label}</span>
                    <span className="font-[family-name:var(--font-display)] font-medium text-[#20241F]">{score}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Comparison Results Modal */}
      {comparisonResult && (
        <div className="fixed inset-0 z-50 bg-[#20241F]/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full p-6 border border-[#20241F]/10 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeComparison}
              className="absolute top-4 right-4 text-[#20241F]/40 hover:text-[#20241F] cursor-pointer p-1"
            >
              <X size={20} />
            </button>

            <h3 className="font-[family-name:var(--font-display)] text-xl font-medium text-[#20241F] mb-1">
              Scan Comparison
            </h3>
            <p className="text-xs text-[#20241F]/45 mb-6">
              Compare your older and newer scans.
            </p>

            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center">
                <p className="font-[family-name:var(--font-mono)] text-[10px] text-emerald-700 uppercase tracking-[0.08em]">
                  Improved
                </p>
                <p className="font-[family-name:var(--font-display)] text-2xl font-medium text-emerald-700 mt-1">
                  {comparisonResult.summary?.improved ?? 0}
                </p>
              </div>

              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
                <p className="font-[family-name:var(--font-mono)] text-[10px] text-red-600 uppercase tracking-[0.08em]">
                  Worsened
                </p>
                <p className="font-[family-name:var(--font-display)] text-2xl font-medium text-red-600 mt-1">
                  {comparisonResult.summary?.worsened ?? 0}
                </p>
              </div>

              <div className="rounded-lg border border-[#20241F]/12 bg-[#F5F2EA] p-4 text-center">
                <p className="font-[family-name:var(--font-mono)] text-[10px] text-[#20241F]/50 uppercase tracking-[0.08em]">
                  No Change
                </p>
                <p className="font-[family-name:var(--font-display)] text-2xl font-medium text-[#20241F] mt-1">
                  {comparisonResult.summary?.no_significant_change ?? 0}
                </p>
              </div>

              <div className="rounded-lg border border-[#BD7B54]/25 bg-[#BD7B54]/5 p-4 text-center">
                <p className="font-[family-name:var(--font-mono)] text-[10px] text-[#BD7B54] uppercase tracking-[0.08em]">
                  Threshold
                </p>
                <p className="font-[family-name:var(--font-display)] text-lg font-medium text-[#BD7B54] mt-1">
                  {Math.round((comparisonResult.summary?.threshold_used ?? 0) * 100)}%
                </p>
              </div>
            </div>

            {/* Scan Images */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="border border-[#20241F]/10 rounded-lg p-4">
                <h4 className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.08em] text-[#20241F]/50 mb-3">
                  Older Scan
                </h4>
                {comparisonResult.older_scan?.photo_url && (
                  <img
                    src={`${API_BASE_URL}${comparisonResult.older_scan.photo_url}`}
                    alt="Older Scan"
                    className="w-full h-48 object-cover rounded-md border border-[#20241F]/10"
                  />
                )}
                <p className="text-xs text-[#20241F]/45 mt-3">
                  {new Date(comparisonResult.older_scan.created_at).toLocaleString()}
                </p>
              </div>

              <div className="border border-[#20241F]/10 rounded-lg p-4">
                <h4 className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.08em] text-[#20241F]/50 mb-3">
                  Newer Scan
                </h4>
                {comparisonResult.newer_scan?.photo_url && (
                  <img
                    src={`${API_BASE_URL}${comparisonResult.newer_scan.photo_url}`}
                    alt="Newer Scan"
                    className="w-full h-48 object-cover rounded-md border border-[#20241F]/10"
                  />
                )}
                <p className="text-xs text-[#20241F]/45 mt-3">
                  {new Date(comparisonResult.newer_scan.created_at).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Condition Comparison */}
            <div>
              <h4 className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#20241F]/50 mb-4">
                Condition Changes
              </h4>

              <div className="space-y-2">
                {comparisonResult.comparisons?.map((item, index) => {
                  const delta = Math.abs(Math.round((item.delta ?? 0) * 100));
                  return (
                    <div
                      key={index}
                      className="border border-[#20241F]/10 rounded-lg p-4 flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium text-[#20241F] capitalize">{item.condition}</p>
                        <p className="text-xs text-[#20241F]/45 mt-1">
                          {Math.round((item.older_score ?? 0) * 100)}% → {Math.round((item.newer_score ?? 0) * 100)}%
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-[family-name:var(--font-display)] font-medium ${
                            item.status === 'improved'
                              ? 'text-emerald-600'
                              : item.status === 'worsened'
                              ? 'text-red-600'
                              : 'text-[#20241F]/50'
                          }`}
                        >
                          {item.status === 'improved' ? `↓ ${delta}%` : item.status === 'worsened' ? `↑ ${delta}%` : `${delta}%`}
                        </p>
                        <p className="text-xs capitalize text-[#20241F]/45">
                          {item.status.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
