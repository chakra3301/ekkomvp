export const theme = {
  primary: '#0080FF',
  primaryDeep: '#0066CC',
  bg: '#0F1115',
  bgElevated: '#1A1D23',
  surface: 'rgba(255,255,255,0.08)',
  surfaceStrong: 'rgba(255,255,255,0.14)',
  border: 'rgba(255,255,255,0.12)',
  text: '#FFFFFF',
  textMuted: '#9CA3AF',
  like: '#10B981',
  pass: '#EF4444',
} as const;

export const fonts = {
  arches: 'Arches',
  ui: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
} as const;

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

export const scenes = {
  home: {from: 0, duration: 60},
  logoIntro: {from: 60, duration: 90},
  discover: {from: 150, duration: 90},
  profile: {from: 240, duration: 120},
  swipe: {from: 360, duration: 90},
  chat: {from: 450, duration: 120},
  outro: {from: 570, duration: 90},
} as const;

export const TOTAL_FRAMES = 660;
