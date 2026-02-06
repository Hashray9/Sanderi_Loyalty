import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from '@/locales/en.json';
import gu from '@/locales/gu.json';

const LANGUAGE_KEY = 'app_language';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    gu: { translation: gu },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

// Load saved language
AsyncStorage.getItem(LANGUAGE_KEY).then((lang) => {
  if (lang) {
    i18n.changeLanguage(lang);
  }
});

// Save language changes
i18n.on('languageChanged', async (lng) => {
  await AsyncStorage.setItem(LANGUAGE_KEY, lng);
});

export default i18n;
