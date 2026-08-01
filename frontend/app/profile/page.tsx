'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSkinProfile, submitQuiz } from '@/lib/api';
import { isLoggedIn } from '@/lib/auth';
import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import { ArrowLeft, Pencil, X, RefreshCw, Camera, ChevronRight, User } from 'lucide-react';

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

const FIELD_OPTIONS: Record<string, string[]> = {
  age_range: ['Under 18', '18-24', '25-34', '35-44', '45+'],
  gender: ['Male', 'Female', 'Prefer not to say'],
  skin_type: ['Oily', 'Dry', 'Combination', 'Normal', "I don't know"],
  products_used_before: ['Never', 'Occasionally', 'Regularly', 'Used to but stopped'],
  sun_exposure: ['Under 1hr', '1-3hrs', '3hrs+'],
  concern_one: ['Acne', 'Oiliness', 'Dryness', 'Redness', 'Dark spots', 'Wrinkles', 'Dark circles', 'Pores'],
  concern_two: ['Acne', 'Oiliness', 'Dryness', 'Redness', 'Dark spots', 'Wrinkles', 'Dark circles', 'Pores', 'None'],
  skin_goal: ['Clear skin', 'Even tone', 'Anti-aging', 'Hydration', 'Oil control'],
};

const fields = [
  { key: 'age_range', label: 'Age Range' },
  { key: 'gender', label: 'Gender' },
  { key: 'skin_type', label: 'Skin Type' },
  { key: 'products_used_before', label: 'Product History' },
  { key: 'sun_exposure', label: 'Sun Exposure' },
  { key: 'concern_one', label: 'Primary Concern' },
  { key: 'concern_two', label: 'Secondary Concern' },
  { key: 'skin_goal', label: 'Skin Goal' },
];

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!isLoggedIn()) {
        router.push('/login');
        return;
      }
      loadProfile();
    }
  }, []);

  const loadProfile = async () => {
    try {
      const res = await getSkinProfile();
      setProfile(res.data);
      setForm(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      const payload = {
        ...form,
        concern_two: form.concern_two === 'None' ? null : form.concern_two,
      };

      await submitQuiz(payload);

      setProfile(payload);
      setForm(payload);
      setEditing(false);
    } catch (err) {
      console.error(err);
      setError('Unable to save profile. Please check your selections and try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={`${fraunces.variable} ${plexSans.variable} ${plexMono.variable} min-h-screen bg-[#F5F2EA] font-[family-name:var(--font-body)] flex items-center justify-center`}>
        <p className="text-[#20241F]/50 text-sm font-[family-name:var(--font-mono)]">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className={`${fraunces.variable} ${plexSans.variable} ${plexMono.variable} min-h-screen bg-[#F5F2EA] font-[family-name:var(--font-body)]`}>
      <div className="border-b border-[#20241F]/10 bg-[#F5F2EA]/90 backdrop-blur-md px-6 py-4 flex items-center relative">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-[#20241F]/60 hover:text-[#20241F] text-sm flex items-center gap-1.5 cursor-pointer transition"
        >
          <ArrowLeft size={15} /> Back
        </button>
        <h1 className="font-[family-name:var(--font-display)] text-lg font-medium text-[#20241F] absolute left-1/2 -translate-x-1/2">
          Profile
        </h1>
      </div>

      <div className="max-w-lg mx-auto px-6 py-8 space-y-4">
        <div className="rounded-lg border border-[#20241F]/12 bg-white p-6">
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-2">
              <User size={16} className="text-[#BD7B54]" />
              <h2 className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#20241F]/50">
                Skin Profile
              </h2>
            </div>
            <button
              onClick={() => {
                setError('');
                setEditing(!editing);
              }}
              className="cursor-pointer text-xs text-[#BD7B54] font-medium hover:underline flex items-center gap-1"
            >
              {editing ? <><X size={13} /> Cancel</> : <><Pencil size={13} /> Edit</>}
            </button>
          </div>

          <div className="space-y-3">
            {fields.map(({ key, label }) => (
              <div key={key} className="flex justify-between items-center border-b border-[#20241F]/8 pb-2.5">
                <span className="text-sm text-[#20241F]/55">{label}</span>
                {editing ? (
                  <select
                    value={
                      key === 'concern_two'
                        ? (form.concern_two || 'None')
                        : (form[key] || '')
                    }
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="text-sm text-[#20241F] border border-[#20241F]/15 rounded-md px-2 py-1.5 w-44 focus:outline-none focus:border-[#BD7B54] bg-white"
                  >
                    <option value="" disabled>Select option</option>
                    {FIELD_OPTIONS[key]?.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-sm font-medium text-[#20241F]">
                    {key === 'concern_two'
                      ? (profile?.concern_two || 'None')
                      : (profile?.[key] || '—')}
                  </span>
                )}
              </div>
            ))}
          </div>

          {error && (
            <p className="mt-4 text-xs text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
              {error}
            </p>
          )}

          {editing && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="mt-4 w-full cursor-pointer rounded-md bg-[#182019] py-2.5 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.1em] text-[#F5F2EA] transition hover:bg-[#BD7B54] disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>

        <div className="rounded-lg border border-[#20241F]/12 bg-white p-6">
          <h2 className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#20241F]/50 mb-4">
            Quick Actions
          </h2>
          <div className="space-y-2">
            <button
              onClick={() => router.push('/quiz?back=profile')}
              className="w-full flex items-center justify-between text-left px-4 py-3 rounded-lg border border-[#20241F]/10 text-sm text-[#20241F]/75 hover:border-[#BD7B54]/40 transition cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <RefreshCw size={15} className="text-[#20241F]/40" />
                Retake Quiz
              </span>
              <ChevronRight size={16} className="text-[#20241F]/25" />
            </button>
            <button
              onClick={() => router.push('/scan')}
              className="w-full flex items-center justify-between text-left px-4 py-3 rounded-lg border border-[#20241F]/10 text-sm text-[#20241F]/75 hover:border-[#BD7B54]/40 transition cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <Camera size={15} className="text-[#20241F]/40" />
                New Scan
              </span>
              <ChevronRight size={16} className="text-[#20241F]/25" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
