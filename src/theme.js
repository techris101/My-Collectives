// MyCollectives — design system
// Monochrome, flagship-minimal: true black, crisp white, a couple of greys.
// Hierarchy comes from weight, spacing and contrast — never from colour.

export const colors = {
  // Base surfaces (true black for OLED depth)
  bg: '#000000',
  bgElevated: '#0B0B0B',
  surface: '#131313',
  surfaceHi: '#1C1C1C',
  hairline: 'rgba(255,255,255,0.10)',
  hairlineStrong: 'rgba(255,255,255,0.18)',

  // Text
  text: '#FFFFFF',
  textDim: '#9A9AA0',
  textMuted: '#5C5C63',

  // The single accent is white. `like` stays white too — monochrome throughout.
  accent: '#FFFFFF',
  like: '#FFFFFF',
  white: '#FFFFFF',
  black: '#000000',

  // Overlays
  scrim: 'rgba(0,0,0,0.45)',
  scrimStrong: 'rgba(0,0,0,0.72)',
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
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
  hero: { fontSize: 34, fontWeight: '800', letterSpacing: -0.6, color: colors.text },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.4, color: colors.text },
  section: { fontSize: 12, fontWeight: '700', letterSpacing: 1.6, color: colors.textMuted, textTransform: 'uppercase' },
  body: { fontSize: 15, fontWeight: '500', color: colors.text },
  label: { fontSize: 13, fontWeight: '600', color: colors.textDim },
  caption: { fontSize: 12, fontWeight: '500', color: colors.textMuted },
};

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 8,
  },
};
