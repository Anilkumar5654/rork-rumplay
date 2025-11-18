export const theme = {
  colors: {
    primary: '#FF2D95',
    background: '#0B0C10',
    surface: '#1F2833',
    surfaceLight: '#2A3442',
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    textMuted: '#666C7E',
    border: '#2A3442',
    success: '#4CAF50',
    error: '#F44336',
    warning: '#FF9800',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  radii: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  fontSizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
};

export type Theme = typeof theme;
