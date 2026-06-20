'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSkinProfile, submitQuiz } from '@/lib/api';
import { isLoggedIn, removeToken } from '@/lib/auth';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
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
    try {
      await submitQuiz(form);
      setProfile(form);
      setEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-rose-50 flex items-center justify-center">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }

  const fields = [
    { key: 'age_range', label: 'Age Range' },
    { key: 'gender', label: 'Gender' },
    { key: 'skin_type', label: 'Skin Type' },
    { key: 'products_used_before', label: 'Products Used Before' },
    { key: 'sensitivity', label: 'Sensitivity' },
    { key: 'sun_exposure', label: 'Sun Exposure' },
    { key: 'concern_one', label: 'Main Concern' },
    { key: 'concern_two', label: 'Secondary Concern' },
    { key: 'skin_goal', label: 'Skin Goal' },
  ];

  return (
    <div className="min-h-screen bg-rose-50">
      <div className="bg-white shadow-sm px-6 py-4 flex items-center">
        <button onClick={() => router.push('/dashboard')} className="text-rose-500 font-medium text-sm cursor-pointer">
          ← Back
        </button>
        <h1 className="text-lg font-bold text-gray-800 absolute left-1/2 -translate-x-1/2">Profile</h1>
      </div>

      <div className="max-w-lg mx-auto px-6 py-8 space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-md font-semibold text-gray-800">Skin Profile</h2>
            <button onClick={() => setEditing(!editing)} className="text-sm text-rose-500 font-medium hover:underline cursor-pointer">
              {editing ? 'Cancel' : 'Edit'}
            </button>
          </div>
          <div className="space-y-3">
            {fields.map(({ key, label }) => (
              <div key={key} className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-sm text-gray-500">{label}</span>
                {editing ? (
                  <input
                    value={form[key] || ''}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="text-sm text-gray-800 border border-gray-200 rounded-lg px-2 py-1 w-40 focus:outline-none focus:ring-1 focus:ring-rose-300"
                  />
                ) : (
                  <span className="text-sm font-medium text-gray-800">{profile?.[key] || '—'}</span>
                )}
              </div>
            ))}
          </div>
          {editing && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="mt-4 w-full bg-rose-500 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-rose-600 transition disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-md font-semibold text-gray-800 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/quiz?back=profile')}
              className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 hover:border-rose-200 transition cursor-pointer"
            >
              🔄 Retake Quiz
            </button>
            <button
              onClick={() => router.push('/scan')}
              className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 hover:border-rose-200 transition cursor-pointer"
            >
              📷 New Scan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}