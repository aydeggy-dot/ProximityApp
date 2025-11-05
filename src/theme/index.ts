// Theme configuration for light and dark modes

export const colors = {
  light: {
    primary: '#6366f1', // Indigo
    primaryDark: '#4f46e5',
    primaryLight: '#818cf8',
    secondary: '#ec4899', // Pink
    secondaryDark: '#db2777',
    secondaryLight: '#f472b6',

    background: '#ffffff',
    backgroundSecondary: '#f9fafb',
    surface: '#ffffff',
    surfaceVariant: '#f3f4f6',

    text: '#1f2937',
    textSecondary: '#6b7280',
    textTertiary: '#9ca3af',

    error: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
    info: '#3b82f6',

    border: '#e5e7eb',
    divider: '#e5e7eb',

    // Map markers
    markerDefault: '#6366f1',
    markerNearby: '#ec4899',
    markerActive: '#10b981',

    // Group colors (for different groups on map)
    group1: '#6366f1',
    group2: '#ec4899',
    group3: '#10b981',
    group4: '#f59e0b',
    group5: '#8b5cf6',

    overlay: 'rgba(0, 0, 0, 0.5)',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  dark: {
    primary: '#818cf8',
    primaryDark: '#6366f1',
    primaryLight: '#a5b4fc',
    secondary: '#f472b6',
    secondaryDark: '#ec4899',
    secondaryLight: '#f9a8d4',

    background: '#111827',
    backgroundSecondary: '#1f2937',
    surface: '#1f2937',
    surfaceVariant: '#374151',

    text: '#f9fafb',
    textSecondary: '#d1d5db',
    textTertiary: '#9ca3af',

    error: '#f87171',
    success: '#34d399',
    warning: '#fbbf24',
    info: '#60a5fa',

    border: '#374151',
    divider: '#374151',

    // Map markers
    markerDefault: '#818cf8',
    markerNearby: '#f472b6',
    markerActive: '#34d399',

    // Group colors
    group1: '#818cf8',
    group2: '#f472b6',
    group3: '#34d399',
    group4: '#fbbf24',
    group5: '#a78bfa',

    overlay: 'rgba(0, 0, 0, 0.7)',
    shadow: 'rgba(0, 0, 0, 0.3)',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const layout = {
  screenPadding: spacing.md,
  cardPadding: spacing.md,
  buttonHeight: 48,
  inputHeight: 48,
  iconSize: {
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48,
  },
};

// Create a theme object that combines all theme properties
export const createTheme = (mode: 'light' | 'dark') => ({
  colors: colors[mode],
  spacing,
  borderRadius,
  typography,
  shadows,
  layout,
  mode,
});

export type Theme = ReturnType<typeof createTheme>;

// Default themes
export const lightTheme = createTheme('light');
export const darkTheme = createTheme('dark');
