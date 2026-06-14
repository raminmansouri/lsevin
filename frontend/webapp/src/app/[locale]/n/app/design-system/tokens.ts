// LSevin Design System - Design Tokens
// Production-grade tokens for a premium health-tech marketplace

export const colors = {
  // Brand Colors
  primary: {
    DEFAULT: '#083f30',
    50: '#f0f7f5',
    100: '#d9ebe5',
    200: '#b3d7cb',
    300: '#8cc3b1',
    400: '#66af97',
    500: '#409b7d',
    600: '#338466',
    700: '#266d50',
    800: '#1a5639',
    900: '#083f30',
  },
  accent: {
    DEFAULT: '#eacb7f',
    50: '#fef9f0',
    100: '#fdf3e0',
    200: '#fbe7c1',
    300: '#f9dba2',
    400: '#f7cf83',
    500: '#eacb7f',
    600: '#e0b654',
    700: '#d6a129',
    800: '#a67b1f',
    900: '#765815',
  },
  
  // Semantic Colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  // Neutral Grays
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  
  // UI Colors
  background: {
    primary: '#ffffff',
    secondary: '#f9fafb',
    tertiary: '#f3f4f6',
  },
  
  text: {
    primary: '#111827',
    secondary: '#4b5563',
    tertiary: '#9ca3af',
    inverse: '#ffffff',
  },
  
  border: {
    light: '#e5e7eb',
    DEFAULT: '#d1d5db',
    dark: '#9ca3af',
  },
};

export const spacing = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  7: '28px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
};

export const typography = {
  fontFamily: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Monaco, Consolas, monospace',
  },
  
  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px',
    '5xl': '48px',
  },
  
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  
  lineHeight: {
    none: '1',
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
  
  letterSpacing: {
    tight: '-0.02em',
    normal: '0',
    wide: '0.02em',
  },
};

export const radius = {
  none: '0px',
  sm: '4px',
  DEFAULT: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  full: '9999px',
};

export const shadows = {
  none: 'none',
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  DEFAULT: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  md: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  lg: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  xl: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
};

export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
};
