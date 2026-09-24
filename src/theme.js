// MyCollectives — design system
// A restrained, premium dark palette with a violet→pink signature gradient.

export const colors = {
  // Base surfaces
  bg: '#0A0A0F',
  bgElevated: '#121218',
  surface: '#17171F',
  surfaceHi: '#1E1E28',
  hairline: 'rgba(255,255,255,0.08)',
  hairlineStrong: 'rgba(255,255,255,0.14)',

  // Text
  text: '#F5F5F7',
  textDim: '#A1A1AA',
  textMuted: '#6B6B76',

  // Brand
  violet: '#8B5CF6',
  pink: '#EC4899',
  indigo: '#6366F1',
  cyan: '#22D3EE',

  // Feedback
  like: '#FF3B6B',
  white: '#FFFFFF',
  black: '#000000',

  // Overlays
  scrim: 'rgba(0,0,0,0.45)',
  scrimStrong: 'rgba(0,0,0,0.72)',
};

// Signature gradient used across CTAs, active states and accents.
export const brandGradient = ['#8B5CF6', '#D946EF', '#EC4899'];
export const brandGradientSoft = ['rgba(139,92,246,0.22)', 'rgba(236,72,153,0.18)'];

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 30,
  pill: 999,
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 22,
  xl: 30,
  xxl: 44,
};

export const type = {
  hero: { fontSize: 34, fontWeight: '800', letterSpacing: -0.5, color: colors.text },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.3, color: colors.text },
  section: { fontSize: 13, fontWeight: '700', letterSpacing: 1.4, color: colors.textDim, textTransform: 'uppercase' },
  body: { fontSize: 15, fontWeight: '500', color: colors.text },
  label: { fontSize: 13, fontWeight: '600', color: colors.textDim },
  caption: { fontSize: 12, fontWeight: '500', color: colors.textMuted },
};

export const shadow = {
  glow: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 8,
  },
};
