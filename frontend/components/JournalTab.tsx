'use client';

import { useEffect, useState } from 'react';
import { upsertJournalEntry, getJournalEntries, getJournalInsights } from '@/lib/api';

export default function JournalTab() {
  const [entries, setEntries] = useState<any[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    date: todayStr,
    sleep_hours: '',
    water_intake_liters: '',
    stress_level: '',
    exercise_minutes: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [entriesRes, insightsRes] = await Promise.all([
        getJournalEntries().catch(() => ({ data: [] })),
        getJournalInsights().catch(() => ({ data: null })),
      ]);
      setEntries(entriesRes.data);
      setInsights(insightsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await upsertJournalEntry({
        date: form.date,
        sleep_hours: form.sleep_hours ? parseFloat(form.sleep_hours) : null,
        water_intake_liters: form.water_intake_liters ? parseFloat(form.water_intake_liters) : null,
        stress_level: form.stress_level ? parseInt(form.stress_level) : null,
        exercise_minutes: form.exercise_minutes ? parseFloat(form.exercise_minutes) : null,
        notes: form.notes || null,
      });
      setSuccess('Journal entry saved!');
      setForm({
        date: todayStr,
        sleep_hours: '',
        water_intake_liters: '',
        stress_level: '',
        exercise_minutes: '',
        notes: '',
      });
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save entry. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const stressLabel = (level: number) => {
    const labels: Record<number, string> = {
      1: 'Very Low', 2: 'Low', 3: 'Moderate', 4: 'High', 5: 'Very High',
    };
    return labels[level] || '—';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
        <p className="text-gray-400 text-sm">Loading your journal...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Entry Form */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4">Log a Day</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Date</label>
            <input
              type="date"
              value={form.date}
              max={todayStr}
              onChange={(e) => handleChange('date', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-rose-300"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Sleep (hours)</label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="24"
              placeholder="e.g. 7.5"
              value={form.sleep_hours}
              onChange={(e) => handleChange('sleep_hours', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-rose-300"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Water Intake (liters)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              placeholder="e.g. 2.0"
              value={form.water_intake_liters}
              onChange={(e) => handleChange('water_intake_liters', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-rose-300"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Stress Level (1-5)</label>
            <select
              value={form.stress_level}
              onChange={(e) => handleChange('stress_level', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-rose-300 bg-white"
            >
              <option value="">Select...</option>
              <option value="1">1 - Very Low</option>
              <option value="2">2 - Low</option>
              <option value="3">3 - Moderate</option>
              <option value="4">4 - High</option>
              <option value="5">5 - Very High</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Exercise (minutes)</label>
            <input
              type="number"
              step="1"
              min="0"
              placeholder="e.g. 30"
              value={form.exercise_minutes}
              onChange={(e) => handleChange('exercise_minutes', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-rose-300"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs text-gray-500 mb-1.5">Notes (optional)</label>
            <textarea
              placeholder="Anything else worth noting..."
              value={form.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-rose-300 resize-none"
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mt-4 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
            <p className="text-green-600 text-sm">{success}</p>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="mt-4 w-full bg-rose-500 text-white rounded-xl py-3 text-sm font-semibold hover:bg-rose-600 transition disabled:opacity-50 shadow-sm cursor-pointer"
        >
          {saving ? 'Saving...' : 'Save Entry'}
        </button>
      </div>

      {/* Insights */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">💡</span>
          <h3 className="font-semibold text-gray-800">Insights</h3>
        </div>

        {insights?.insights?.length > 0 ? (
          <div className="space-y-3">
            {insights.insights.map((insight: any, i: number) => (
              <div key={i} className="bg-rose-50 border border-rose-100 rounded-xl p-4">
                <p className="text-sm text-gray-700">{insight.message}</p>
                <p className="text-xs text-gray-400 mt-1.5">
                  Based on {insight.sample_size} comparison{insight.sample_size !== 1 ? 's' : ''}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl p-6 text-center">
            <p className="text-sm text-gray-500">
              Insights need a bit more data to be reliable. Keep logging your daily habits and doing regular scans —
              once there are enough scan comparisons with journal entries in between, patterns will start showing up here.
            </p>
          </div>
        )}
      </div>

      {/* Past Entries */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4">Past Entries</h3>

        {entries.length > 0 ? (
          <div className="space-y-3">
            {entries.map((entry: any) => (
              <div key={entry.id} className="border border-gray-100 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium text-gray-800">
                    {new Date(entry.date).toLocaleDateString('en-US', {
                      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
                    })}
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-gray-500">
                  <div>
                    <p className="text-gray-400">Sleep</p>
                    <p className="font-medium text-gray-700">{entry.sleep_hours != null ? `${entry.sleep_hours}h` : '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Water</p>
                    <p className="font-medium text-gray-700">{entry.water_intake_liters != null ? `${entry.water_intake_liters}L` : '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Stress</p>
                    <p className="font-medium text-gray-700">{entry.stress_level != null ? stressLabel(entry.stress_level) : '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Exercise</p>
                    <p className="font-medium text-gray-700">{entry.exercise_minutes != null ? `${entry.exercise_minutes}min` : '—'}</p>
                  </div>
                </div>
                {entry.notes && (
                  <p className="text-xs text-gray-500 mt-2 italic">"{entry.notes}"</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm">No journal entries yet. Log your first day above.</p>
          </div>
        )}
      </div>

    </div>
  );
}
