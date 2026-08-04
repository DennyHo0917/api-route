import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import {
  APP_LANGUAGE_CODES,
  getPathLanguage,
} from './languageUtils';

const localeLoaders = {
  ja: () => import('./locales/ja.json'),
  ko: () => import('./locales/ko.json'),
  zh: () => import('./locales/zh.json'),
};

const pathLanguage = typeof window === 'undefined'
  ? 'en'
  : getPathLanguage(window.location.pathname);

// ponytail: English is bundled so a failed locale chunk falls back instead of blocking the app.
const localeReady = pathLanguage === 'en'
  ? Promise.resolve([])
  : localeLoaders[pathLanguage]()
    .then((module) => [[pathLanguage, module.default]])
    .catch(() => []);

export const i18nReady = localeReady.then((resources) => i18n
  .use(initReactI18next)
  .init({
    lng: pathLanguage,
    load: 'all',
    supportedLngs: APP_LANGUAGE_CODES,
    nonExplicitSupportedLngs: true,
    resources: Object.fromEntries([['en', en], ...resources]),
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  }));

export default i18n;
