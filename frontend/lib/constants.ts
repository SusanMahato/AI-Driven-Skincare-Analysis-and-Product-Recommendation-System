export const SKIN_CONDITIONS = [
  { label: 'Acne', key: 'acne_score' },
  { label: 'Redness', key: 'redness_score' },
  { label: 'Wrinkles', key: 'wrinkles_score' },
  { label: 'Dark Spots', key: 'dark_spots_score' },
  { label: 'Pores', key: 'pores_score' },
  { label: 'Dark Circles', key: 'dark_circles_score' },
] as const;

export const CHART_LINE_COLORS: Record<string, string> = {
  Acne: '#ef4444',
  Redness: '#f97316',
  Wrinkles: '#8b5cf6',
  'Dark Spots': '#BD7B54',
  Pores: '#06b6d4',
  'Dark Circles': '#64748b',
};

export const DESIGN_TOKENS = {
  ink: '#20241F',
  inkDark: '#182019',
  terracotta: '#BD7B54',
  sage: '#93A899',
  sand: '#C9A47E',
  cream: '#F5F2EA',
} as const;
