import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
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
  primary: '#FA0011',
  primaryLight: '#FFF0F1',
  secondary: '#f1f5f9',
  accent: '#D50010',
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
  primary: '#FA0011',
  primaryLight: '#2D0004',
  secondary: '#1e293b',
  accent: '#FF4D5A',
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
  const [colorScheme, setColorScheme] = useState<ColorScheme>(
    systemColorScheme === 'dark' || systemColorScheme === 'light'
      ? systemColorScheme
      : 'light',
  );

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
