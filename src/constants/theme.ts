export const Colors = {
  background: '#0D0D0D', // Deep black
  surface: '#1A1A1A', // Slightly lighter surface
  card: '#242424',
  primary: '#00F2FF', // Electric Cyan
  secondary: '#FF007A', // Neon Pink
  accent: '#A020F0', // Vibrant Purple
  text: '#FFFFFF',
  textSecondary: '#A0A0A0',
  textTertiary: '#606060',
  success: '#00FF94',
  warning: '#FFB800',
  error: '#FF4D4D',
  border: '#333333',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    color: Colors.text,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: Colors.text,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  body: {
    fontSize: 16,
    color: Colors.text,
  },
  bodySecondary: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  caption: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  timer: {
    fontSize: 64,
    fontWeight: '800' as const,
    color: Colors.primary,
    fontVariant: ['tabular-nums'] as any,
  },
};

export const Shadows = {
  default: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
};
