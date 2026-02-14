import React, { createContext, useContext } from 'react';

// ─── Color Tokens ────────────────────────────────────────────────────────────

interface Colors {
  // Core
  background: string;
  card: string;
  cardDark: string;

  // Text hierarchy
  text: string;
  textHigh: string;
  textMedium: string;
  textLow: string;
  textSecondary: string;
  textTertiary: string;
  textMuted: string;
  textSubtle: string;
  textLight: string;
  textWarm: string;

  // Brand
  primary: string;
  primaryLight: string;
  accent: string;

  // Status
  success: string;
  successBg: string;
  error: string;
  errorBg: string;
  errorBorder: string;
  errorLight: string;
  warning: string;
  info: string;
  infoBg: string;

  // Glass surfaces (white overlays at increasing opacity)
  surface1: string;
  surface2: string;
  surface3: string;
  surface4: string;
  surface5: string;
  surface6: string;

  // Borders (glass edges at increasing visibility)
  border: string;
  borderMedium: string;
  borderStrong: string;
  borderProminent: string;
  borderActive: string;

  // Inputs
  inputBackground: string;
  inputBorder: string;
  placeholder: string;
  placeholderFaint: string;

  // Buttons
  buttonPrimary: string;
  buttonPrimaryText: string;
  buttonArrowLine: string;

  // Misc
  secondary: string;
  avatarBg: string;
  scanLine: string;
}

const colors: Colors = {
  // Core
  background: '#000000',
  card: '#1a1a1a',
  cardDark: '#050505',

  // Text hierarchy (white at decreasing opacity)
  text: '#ffffff',
  textHigh: 'rgba(255,255,255,0.9)',
  textMedium: 'rgba(255,255,255,0.6)',
  textLow: 'rgba(255,255,255,0.4)',
  textSecondary: '#fafbff',
  textTertiary: '#4b5563',
  textMuted: '#374151',
  textSubtle: '#9ca3af',
  textLight: '#e5e5e5',
  textWarm: '#d1d5db',

  // Brand
  primary: '#FA0011',
  primaryLight: 'rgba(250,0,17,0.15)',
  accent: '#FF4D5A',

  // Status
  success: '#10b981',
  successBg: 'rgba(16,185,129,0.08)',
  error: '#ef4444',
  errorBg: 'rgba(239,68,68,0.08)',
  errorBorder: 'rgba(239,68,68,0.3)',
  errorLight: 'rgba(239,68,68,0.05)',
  warning: '#f59e0b',
  info: '#3b82f6',
  infoBg: 'rgba(59,130,246,0.08)',

  // Glass surfaces (white overlays at increasing opacity)
  surface1: 'rgba(255,255,255,0.02)',
  surface2: 'rgba(255,255,255,0.03)',
  surface3: 'rgba(255, 255, 255, 0.16)',
  surface4: 'rgba(255,255,255,0.06)',
  surface5: 'rgba(255,255,255,0.08)',
  surface6: 'rgba(190, 218, 212, 0.2)',

  // Borders (glass edges at increasing visibility)
  border: 'rgba(255, 255, 255, 0.3)',
  borderMedium: 'rgba(255, 255, 255, 0.23)',
  borderStrong: 'rgba(255,255,255,0.15)',
  borderProminent: 'rgba(255,255,255,0.2)',
  borderActive: 'rgba(255,255,255,0.5)',

  // Inputs
  inputBackground: 'rgba(255,255,255,0.05)',
  inputBorder: 'rgba(255,255,255,0.2)',
  placeholder: 'rgba(255, 0, 0, 0.1)',
  placeholderFaint: 'rgba(255, 255, 255, 0.17)',

  // Buttons
  buttonPrimary: '#ffffff',
  buttonPrimaryText: '#000000',
  buttonArrowLine: 'rgba(0,0,0,0.4)',

  // Misc
  secondary: '#1e293b',
  avatarBg: 'rgba(31,41,55,0.8)',
  scanLine: 'rgba(255,255,255,0.8)',
};

// ─── Typography Tokens ───────────────────────────────────────────────────────

interface Typography {
  fontSize: {
    nano: number; // 8  — credentials label, status label, footer label, points label
    xs: number; // 9  — header subtitle, meta date, type badge, points unit, member label
    sm: number; // 10 — input label, section title, mode button, version text
    label: number; // 11 — action button, error text, search button, subtitle, block text
    body: number; // 12 — staff phone, equivalent text, logout text, status value
    md: number; // 13 — process button, enroll button, transaction title, member name
    lg: number; // 14 — header title, category name, setting label
    xl: number; // 16 — not found text, result points, invite code value
    '2xl': number; // 18 — scanning title, member name, chip ID, enroll input
    '3xl': number; // 20 — welcome text, staff name, points display, avatar text
    '4xl': number; // 24 — phone input (login/lookup)
    '5xl': number; // 28 — enroll title
    '6xl': number; // 34 — main title (Sanderi loyalty)
    amount: number; // 48 — amount input
  };
  fontFamily: {
    serif: string;
    mono: string;
    sans: string;
  };
  letterSpacing: {
    tight: number; // -0.5  — enroll title
    normal: number; //  0
    wide: number; //  1.2  — member name, not found message
    wider: number; //  2.4  — mode button, member label, monospace text
    button: number; //  3.2  — action buttons, input labels, section titles
    heading: number; //  4.8  — section titles, header titles, logout
    subtitle: number; // 6.4 — header subtitle
    phone: number; //  8   — phone input
  };
  fontWeight: {
    light: '300';
    normal: '400';
    medium: '500';
    semibold: '600';
    bold: '700';
  };
}

const typography: Typography = {
  fontSize: {
    nano: 8,
    xs: 9,
    sm: 10,
    label: 11,
    body: 12,
    md: 13,
    lg: 14,
    xl: 16,
    '2xl': 18,
    '3xl': 20,
    '4xl': 24,
    '5xl': 28,
    '6xl': 34,
    amount: 48,
  },
  fontFamily: {
    serif: 'serif',
    mono: 'monospace',
    sans: 'sans-serif',
  },
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 1.2,
    wider: 2.4,
    button: 3.2,
    heading: 4.8,
    subtitle: 6.4,
    phone: 8,
  },
  fontWeight: {
    light: '300' as const,
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

// ─── Spacing Tokens ──────────────────────────────────────────────────────────

interface Spacing {
  xs: number; // 4
  sm: number; // 8
  md: number; // 12
  lg: number; // 16
  xl: number; // 20
  '2xl': number; // 24
  '3xl': number; // 28
  '4xl': number; // 32
  '5xl': number; // 40
  '6xl': number; // 48
  '7xl': number; // 64
}

const spacing: Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 40,
  '6xl': 48,
  '7xl': 64,
};

// ─── Border Radius Tokens ────────────────────────────────────────────────────

interface BorderRadius {
  none: number; // 0   — CTA buttons (sharp)
  sm: number; // 8   — chip container, small buttons
  md: number; // 12  — action buttons, mode buttons
  lg: number; // 16  — member cards, transaction cards, result cards, avatars
  xl: number; // 20  — enroll card, toggle switch
  '2xl': number; // 24  — category cards, glass card, lookup card
  '3xl': number; // 28  — scan card
  '4xl': number; // 32  — profile card
  full: number; // 999 — pill badges, bg blobs
}

const borderRadius: BorderRadius = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  full: 999,
};

// ─── Button Tokens ───────────────────────────────────────────────────────────

interface Buttons {
  primaryHeight: number;
  primaryBorderRadius: number;
  ghostBorderWidth: number;
}

const buttons: Buttons = {
  primaryHeight: 56,
  primaryBorderRadius: 0,
  ghostBorderWidth: 1,
};

// ─── Theme Context ───────────────────────────────────────────────────────────

interface ThemeContextType {
  colorScheme: 'dark';
  colors: Colors;
  typography: Typography;
  spacing: Spacing;
  borderRadius: BorderRadius;
  buttons: Buttons;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeContext.Provider
      value={{
        colorScheme: 'dark',
        colors,
        typography,
        spacing,
        borderRadius,
        buttons,
        toggleTheme: () => {},
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
