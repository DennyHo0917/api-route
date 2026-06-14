import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import zh from './locales/zh.json';
import {
  APP_LANGUAGE_CODES,
  DIST_SITE_LANGUAGE_STORAGE_KEY,
  getPathLanguage,
  normalizeAppLanguage,
} from './languageUtils';

const pathLanguage = typeof window === 'undefined'
  ? 'zh'
  : getPathLanguage(window.location.pathname);

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    lng: pathLanguage,
    load: 'all',
    supportedLngs: APP_LANGUAGE_CODES,
    nonExplicitSupportedLngs: true,
    resources: { en, ja, ko, zh },
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag', 'querystring'],
      caches: ['localStorage'],
      lookupLocalStorage: DIST_SITE_LANGUAGE_STORAGE_KEY,
      convertDetectedLanguage: normalizeAppLanguage,
    },
  });

export default i18n;
