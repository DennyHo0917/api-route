import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import zh from './locales/zh.json';
import {
  APP_LANGUAGE_CODES,
  getPathLanguage,
} from './languageUtils';

const pathLanguage = typeof window === 'undefined'
  ? 'en'
  : getPathLanguage(window.location.pathname);

i18n
  .use(initReactI18next)
  .init({
    lng: pathLanguage,
    load: 'all',
    supportedLngs: APP_LANGUAGE_CODES,
    nonExplicitSupportedLngs: true,
    resources: { en, ja, ko, zh },
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

export default i18n;
