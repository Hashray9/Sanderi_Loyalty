import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ColorScheme = 'light' | 'dark';

interface Colors {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  primary: string;
  primaryLight: string;
  secondary: string;
  accent: string;
  success: string;
  error: string;
  warning: string;
  border: string;
  inputBackground: string;
}

const lightColors: Colors = {
  background: '#f5f5f5',
  card: '#ffffff',
  text: '#1a1a1a',
  textSecondary: '#666666',
  primary: '#2563eb',
  primaryLight: '#eff6ff',
  secondary: '#f1f5f9',
  accent: '#1d4ed8',
  success: '#16a34a',
  error: '#dc2626',
  warning: '#d97706',
  border: '#e5e5e5',
  inputBackground: '#ffffff',
};

const darkColors: Colors = {
  background: '#0a0a0a',
  card: '#1a1a1a',
  text: '#ffffff',
  textSecondary: '#a0a0a0',
  primary: '#3b82f6',
  primaryLight: '#1e3a5f',
  secondary: '#1e293b',
  accent: '#60a5fa',
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',
  border: '#333333',
  inputBackground: '#262626',
};

interface ThemeContextType {
  colorScheme: ColorScheme;
  colors: Colors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_KEY = 'app_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useSystemColorScheme();
  const [colorScheme, setColorScheme] = useState<ColorScheme>(systemColorScheme || 'light');

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_KEY);
      if (saved) {
        setColorScheme(saved as ColorScheme);
      }
    } catch {
      // Use default
    }
  };

  const toggleTheme = useCallback(async () => {
    const newScheme = colorScheme === 'light' ? 'dark' : 'light';
    setColorScheme(newScheme);
    await AsyncStorage.setItem(THEME_KEY, newScheme);
  }, [colorScheme]);

  const colors = colorScheme === 'dark' ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ colorScheme, colors, toggleTheme }}>
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
