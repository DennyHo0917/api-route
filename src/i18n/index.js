import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import {
  APP_LANGUAGE_CODES,
  getPathLanguage,
} from './languageUtils';

const localeLoaders = {
  en: () => import('./locales/en.json'),
  ja: () => import('./locales/ja.json'),
  ko: () => import('./locales/ko.json'),
  zh: () => import('./locales/zh.json'),
};

const pathLanguage = typeof window === 'undefined'
  ? 'en'
  : getPathLanguage(window.location.pathname);

const languagesToLoad = pathLanguage === 'en' ? ['en'] : ['en', pathLanguage];

export const i18nReady = Promise.all(
  languagesToLoad.map(async (language) => [language, (await localeLoaders[language]()).default]),
).then((resources) => i18n
  .use(initReactI18next)
  .init({
    lng: pathLanguage,
    load: 'all',
    supportedLngs: APP_LANGUAGE_CODES,
    nonExplicitSupportedLngs: true,
    resources: Object.fromEntries(resources),
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  }));

export default i18n;
