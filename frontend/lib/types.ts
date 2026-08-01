export interface CvScores {
  acne_score: number;
  redness_score: number;
  wrinkles_score: number;
  dark_spots_score: number;
  pores_score: number;
  dark_circles_score: number;
  photo_confidence: number;
}

export interface Scan {
  id: number;
  user_id: number;
  scan_type: string;
  photo_url: string | null;
  acne_score: number;
  redness_score: number;
  wrinkles_score: number;
  dark_spots_score: number;
  pores_score: number;
  dark_circles_score: number;
  photo_confidence: number | null;
  uv_index: number | null;
  humidity: number | null;
  temperature: number | null;
  weather_condition: string | null;
  created_at: string;
}

export interface Recommendation {
  ingredients: string[];
  recommended_spf: number;
  morning_routine: string[];
  night_routine: string[];
  skin_report: string;
}

export interface ComparisonEntry {
  condition: string;
  older_score: number | null;
  newer_score: number | null;
  delta: number | null;
  status: 'improved' | 'worsened' | 'no_significant_change' | 'no_data';
}

export interface ComparisonResult {
  older_scan: { id: number; created_at: string; photo_url: string | null };
  newer_scan: { id: number; created_at: string; photo_url: string | null };
  comparisons: ComparisonEntry[];
  summary: {
    improved: number;
    worsened: number;
    no_significant_change: number;
    threshold_used: number;
  };
}

export interface JournalEntry {
  id: number;
  user_id: number;
  date: string;
  sleep_hours: number | null;
  water_intake_liters: number | null;
  stress_level: number | null;
  exercise_minutes: number | null;
  notes: string | null;
}
