'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { analyzeScan } from '@/lib/api';
import { isLoggedIn } from '@/lib/auth';
import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import { ArrowLeft, Camera, Loader2, ScanSearch, CloudSun, ArrowRight, X, Upload, RotateCcw } from 'lucide-react';

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

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
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

  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    setCameraError('');
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setCameraError('Could not access camera. Check your browser permissions and try again.');
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setShowCamera(false);
    setCameraError('');
  };

    const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // Flip horizontally so the saved photo matches the mirrored preview
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const captured = new File([blob], `scan-${Date.now()}.jpg`, { type: 'image/jpeg' });
      setFile(captured);
      setPreview(URL.createObjectURL(captured));
      setResult(null);
      setError('');
      stopCamera();
    }, 'image/jpeg', 0.92);
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
    if (score < 0.3) return 'bg-emerald-500';
    if (score < 0.6) return 'bg-[#BD7B54]';
    return 'bg-red-500';
  };

  const scoreTextColor = (score: number) => {
    if (score < 0.3) return 'text-emerald-600';
    if (score < 0.6) return 'text-[#BD7B54]';
    return 'text-red-600';
  };

  const scoreLabel = (score: number) => {
    if (score < 0.3) return 'Low';
    if (score < 0.6) return 'Moderate';
    return 'High';
  };

  return (
    <div className={`${fraunces.variable} ${plexSans.variable} ${plexMono.variable} min-h-screen bg-[#F5F2EA] font-[family-name:var(--font-body)]`}>
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-[#20241F]/10 bg-[#F5F2EA]/90 backdrop-blur-md px-6 py-4 flex justify-between items-center">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-[#20241F]/60 hover:text-[#20241F] text-sm flex items-center gap-1.5 cursor-pointer transition"
        >
          <ArrowLeft size={15} /> Back
        </button>
        <h1 className="font-[family-name:var(--font-display)] text-lg font-medium text-[#20241F]">Skin Analysis</h1>
        <div className="w-12"></div>
      </div>

      <div className="max-w-lg mx-auto px-6 py-8 space-y-4">

        {/* Tips */}
        <div className="rounded-lg border border-[#BD7B54]/25 bg-[#BD7B54]/5 p-4">
          <p className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.08em] text-[#BD7B54] mb-2">
            Tips for best results
          </p>
          <ul className="text-xs text-[#20241F]/65 space-y-1">
            <li>— Good natural lighting, face the camera directly</li>
            <li>— Remove glasses and pull hair back</li>
            <li>— Clean bare skin, no makeup</li>
          </ul>
        </div>

        {/* Upload */}
        <div className="rounded-lg border border-[#20241F]/12 bg-white p-6">
          <h2 className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#20241F]/50 mb-4">
            Upload Photo
          </h2>

                    {showCamera ? (
            <div className="rounded-lg border border-[#20241F]/15 overflow-hidden bg-black">
              {cameraError ? (
                <div className="p-8 text-center">
                  <p className="text-red-600 text-sm mb-3">{cameraError}</p>
                  <button
                    onClick={stopCamera}
                    className="text-xs text-[#20241F]/60 hover:text-[#20241F] underline"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <>
                                    <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-72 object-cover scale-x-[-1]"
                  />
                  <div className="flex items-center justify-center gap-3 bg-white p-4">
                    <button
                      onClick={stopCamera}
                      className="flex items-center gap-1.5 rounded-md border border-[#20241F]/15 px-4 py-2 text-xs font-medium text-[#20241F]/70 hover:bg-[#20241F]/5 transition"
                    >
                      <X size={14} /> Cancel
                    </button>
                    <button
                      onClick={capturePhoto}
                      className="flex items-center gap-1.5 rounded-md bg-[#182019] px-5 py-2 text-xs font-medium text-[#F5F2EA] hover:bg-[#BD7B54] transition"
                    >
                      <Camera size={14} /> Capture
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : preview ? (
            <div className="border-2 border-dashed border-[#20241F]/15 rounded-lg p-8 text-center">
              <img src={preview} alt="Preview" className="w-48 h-48 object-cover rounded-lg mx-auto" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block cursor-pointer">
                <div className="border-2 border-dashed border-[#20241F]/15 rounded-lg p-8 text-center hover:border-[#BD7B54]/50 transition h-full flex flex-col items-center justify-center">
                  <Upload size={32} className="mx-auto mb-3 text-[#20241F]/25" strokeWidth={1.5} />
                  <p className="text-sm font-medium text-[#20241F]/70">Upload from device</p>
                  <p className="text-xs text-[#20241F]/40 mt-1">JPG, PNG or WEBP</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              <button
                onClick={startCamera}
                className="border-2 border-dashed border-[#20241F]/15 rounded-lg p-8 text-center hover:border-[#BD7B54]/50 transition flex flex-col items-center justify-center cursor-pointer"
              >
                <Camera size={32} className="mx-auto mb-3 text-[#20241F]/25" strokeWidth={1.5} />
                <p className="text-sm font-medium text-[#20241F]/70">Take a photo</p>
                <p className="text-xs text-[#20241F]/40 mt-1">Use your camera</p>
              </button>
            </div>
          )}

                    {preview && !showCamera && (
            <div className="mt-3 flex items-center gap-4">
              <button
                onClick={() => { setFile(null); setPreview(null); setResult(null); }}
                className="text-xs text-[#20241F]/40 hover:text-[#20241F]/70 transition cursor-pointer flex items-center gap-1"
              >
                <X size={12} /> Remove photo
              </button>
              <button
                onClick={startCamera}
                className="text-xs text-[#20241F]/40 hover:text-[#20241F]/70 transition cursor-pointer flex items-center gap-1"
              >
                <RotateCcw size={12} /> Retake with camera
              </button>
            </div>
          )}

          {error && (
            <div className="mt-3 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleScan}
            disabled={!file || loading}
            className="mt-4 w-full cursor-pointer rounded-md bg-[#182019] py-3 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.1em] text-[#F5F2EA] transition hover:bg-[#BD7B54] disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={14} className="animate-spin" /> Analyzing your skin...
              </span>
            ) : 'Analyze Skin'}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="rounded-lg border border-[#20241F]/12 bg-white p-6">
            <div className="flex items-center gap-2 mb-5">
              <ScanSearch size={16} className="text-[#BD7B54]" />
              <h3 className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#20241F]/50">
                Analysis Results
              </h3>
            </div>

            <div className="space-y-4">
              {Object.entries(result.cv_scores)
                .filter(([key]) => key !== 'photo_confidence')
                .map(([key, value]: [string, any]) => (
                  <div key={key}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-[#20241F]/75 capitalize font-medium">
                        {key.replace('_score', '').replace('_', ' ')}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium ${scoreTextColor(value)}`}>
                          {scoreLabel(value)}
                        </span>
                        <span className="font-[family-name:var(--font-display)] text-sm font-medium text-[#20241F]">{(value * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-[#20241F]/8 rounded-full h-1.5">
                      <div
                        className={`${scoreColor(value)} h-1.5 rounded-full transition-all duration-500`}
                        style={{ width: `${value * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>

            <div className="mt-5 bg-[#F5F2EA] rounded-lg p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <CloudSun size={16} className="text-[#20241F]/40" />
                <div>
                  <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.06em] text-[#20241F]/40">Weather at scan time</p>
                  <p className="text-sm text-[#20241F]/75 mt-0.5 font-medium">
                    {result.weather.weather_condition} · {result.weather.temperature}°C
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.06em] text-[#20241F]/40">UV Index</p>
                <p className="font-[family-name:var(--font-display)] text-sm font-medium text-[#BD7B54]">{result.weather.uv_index}</p>
              </div>
            </div>

            <button
              onClick={() => router.push('/dashboard')}
              className="mt-4 w-full cursor-pointer rounded-md bg-[#182019] py-3 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.1em] text-[#F5F2EA] transition hover:bg-[#BD7B54] flex items-center justify-center gap-2"
            >
              View Full Recommendation <ArrowRight size={14} />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
