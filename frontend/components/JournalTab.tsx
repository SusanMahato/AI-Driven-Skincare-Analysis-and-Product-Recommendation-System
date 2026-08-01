'use client';

import { useEffect, useState } from 'react';
import { upsertJournalEntry, getJournalEntries, getJournalInsights } from '@/lib/api';
import { Lightbulb, CalendarDays, NotebookPen } from 'lucide-react';

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

  const inputClass =
    'w-full border border-[#20241F]/15 rounded-md px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#BD7B54] transition-colors';
  const labelClass =
    'block font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.08em] text-[#20241F]/50 mb-1.5';

  if (loading) {
    return (
      <div className="rounded-lg border border-[#20241F]/12 bg-white p-12 text-center">
        <p className="text-[#20241F]/45 text-sm">Loading your journal...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* Entry Form */}
      <div className="rounded-lg border border-[#20241F]/12 bg-white p-6">
        <div className="flex items-center gap-2 mb-5">
          <NotebookPen size={16} className="text-[#BD7B54]" />
          <h3 className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#20241F]/50">
            Log a Day
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Date</label>
            <input
              type="date"
              value={form.date}
              max={todayStr}
              onChange={(e) => handleChange('date', e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Sleep (hours)</label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="24"
              placeholder="e.g. 7.5"
              value={form.sleep_hours}
              onChange={(e) => handleChange('sleep_hours', e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Water Intake (liters)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              placeholder="e.g. 2.0"
              value={form.water_intake_liters}
              onChange={(e) => handleChange('water_intake_liters', e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Stress Level (1-5)</label>
            <select
              value={form.stress_level}
              onChange={(e) => handleChange('stress_level', e.target.value)}
              className={inputClass}
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
            <label className={labelClass}>Exercise (minutes)</label>
            <input
              type="number"
              step="1"
              min="0"
              placeholder="e.g. 30"
              value={form.exercise_minutes}
              onChange={(e) => handleChange('exercise_minutes', e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Notes (optional)</label>
            <textarea
              placeholder="Anything else worth noting..."
              value={form.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={2}
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mt-4 bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-3">
            <p className="text-emerald-700 text-sm">{success}</p>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="mt-4 w-full cursor-pointer rounded-md bg-[#182019] py-3 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.1em] text-[#F5F2EA] transition hover:bg-[#BD7B54] disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Entry'}
        </button>
      </div>

      {/* Insights */}
      <div className="rounded-lg border border-[#20241F]/12 bg-white p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb size={16} className="text-[#BD7B54]" />
          <h3 className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#20241F]/50">
            Insights
          </h3>
        </div>

        {insights?.insights?.length > 0 ? (
          <div className="space-y-3">
            {insights.insights.map((insight: any, i: number) => (
              <div key={i} className="bg-[#BD7B54]/5 border border-[#BD7B54]/20 rounded-lg p-4">
                <p className="text-sm text-[#20241F]/80">{insight.message}</p>
                <p className="text-xs text-[#20241F]/40 mt-1.5">
                  Based on {insight.sample_size} comparison{insight.sample_size !== 1 ? 's' : ''}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#F5F2EA] rounded-lg p-6 text-center">
            <p className="text-sm text-[#20241F]/60">
              Insights need a bit more data to be reliable. Keep logging your daily habits and doing regular scans —
              once there are enough scan comparisons with journal entries in between, patterns will start showing up here.
            </p>
          </div>
        )}
      </div>

      {/* Past Entries */}
      <div className="rounded-lg border border-[#20241F]/12 bg-white p-6">
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays size={16} className="text-[#BD7B54]" />
          <h3 className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#20241F]/50">
            Past Entries
          </h3>
        </div>

        {entries.length > 0 ? (
          <div className="space-y-2">
            {entries.map((entry: any) => (
              <div key={entry.id} className="border border-[#20241F]/10 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium text-[#20241F]">
                    {new Date(entry.date).toLocaleDateString('en-US', {
                      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
                    })}
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <p className="text-[#20241F]/40">Sleep</p>
                    <p className="font-medium text-[#20241F]/75">{entry.sleep_hours != null ? `${entry.sleep_hours}h` : '—'}</p>
                  </div>
                  <div>
                    <p className="text-[#20241F]/40">Water</p>
                    <p className="font-medium text-[#20241F]/75">{entry.water_intake_liters != null ? `${entry.water_intake_liters}L` : '—'}</p>
                  </div>
                  <div>
                    <p className="text-[#20241F]/40">Stress</p>
                    <p className="font-medium text-[#20241F]/75">{entry.stress_level != null ? stressLabel(entry.stress_level) : '—'}</p>
                  </div>
                  <div>
                    <p className="text-[#20241F]/40">Exercise</p>
                    <p className="font-medium text-[#20241F]/75">{entry.exercise_minutes != null ? `${entry.exercise_minutes}min` : '—'}</p>
                  </div>
                </div>
                {entry.notes && (
                  <p className="text-xs text-[#20241F]/50 mt-2 italic">"{entry.notes}"</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-[#20241F]/45 text-sm">No journal entries yet. Log your first day above.</p>
          </div>
        )}
      </div>

    </div>
  );
}
