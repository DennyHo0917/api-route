export const DIST_SITE_LANGUAGE_STORAGE_KEY = 'dist_site_i18nextLng';

export const LANGUAGE_PATH_PREFIXES = {
  zh: '/zh',
  ja: '/ja',
  ko: '/ko',
};

export const DIST_SITE_LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'zh', label: '中文' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
];

export const APP_LANGUAGE_CODES = DIST_SITE_LANGUAGES.map(({ code }) => code);

export const normalizeAppLanguage = (language) => {
  const normalized = String(language || '')
    .trim()
    .replace(/_/g, '-')
    .toLowerCase();

  if (!normalized) return 'en';

  if (normalized === 'zh' || normalized.startsWith('zh-')) {
    return 'zh';
  }

  const baseLanguage = normalized.split('-')[0];
  return APP_LANGUAGE_CODES.includes(baseLanguage) ? baseLanguage : 'en';
};

export const getPathLanguage = (pathname = '/') => {
  const normalizedPath = String(pathname || '/').toLowerCase();
  const match = Object.entries(LANGUAGE_PATH_PREFIXES)
    .find(([, prefix]) => normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`));
  return match ? match[0] : 'en';
};

export const hasLanguagePrefix = (pathname = '/') => {
  const normalizedPath = String(pathname || '/').toLowerCase();
  return Object.values(LANGUAGE_PATH_PREFIXES)
    .some((prefix) => normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`));
};

export const stripLanguagePrefix = (pathname = '/') => {
  const normalizedPath = String(pathname || '/') || '/';
  const lowerPath = normalizedPath.toLowerCase();
  const match = Object.values(LANGUAGE_PATH_PREFIXES)
    .find((prefix) => lowerPath === prefix || lowerPath.startsWith(`${prefix}/`));
  if (match) {
    return normalizedPath.slice(match.length) || '/';
  }
  return normalizedPath;
};

export const getLocalizedPath = (pathname, language) => {
  const routePath = stripLanguagePrefix(pathname);
  const prefix = LANGUAGE_PATH_PREFIXES[normalizeAppLanguage(language)];
  if (!prefix) return routePath;
  return routePath === '/' ? `${prefix}/` : `${prefix}${routePath}`;
};

export const getRouterBasename = (pathname = '/') => (
  LANGUAGE_PATH_PREFIXES[getPathLanguage(pathname)] || '/'
);

export const normalizeLanguagePath = (pathname = '/', search = '', hash = '') => {
  const language = getPathLanguage(pathname);
  const prefix = LANGUAGE_PATH_PREFIXES[language];
  if (!prefix || pathname.toLowerCase() !== prefix) return '';
  return `${prefix}/${search}${hash}`;
};

export const getAutoLanguageRedirectPath = (pathname = '/', search = '', hash = '') => {
  if (typeof window === 'undefined' || hasLanguagePrefix(pathname)) return '';
  if (/bot|crawler|spider|slurp|duckduckbot|baiduspider|yandex/i.test(window.navigator.userAgent || '')) return '';

  let storedLanguage = '';
  try {
    storedLanguage = window.localStorage.getItem(DIST_SITE_LANGUAGE_STORAGE_KEY) || '';
  } catch {
    storedLanguage = '';
  }

  const browserLanguage = window.navigator.languages?.find(Boolean) || window.navigator.language;
  const language = normalizeAppLanguage(storedLanguage || browserLanguage);
  const targetPath = getLocalizedPath(pathname, language);
  return targetPath === pathname ? '' : `${targetPath}${search}${hash}`;
};

export const getStoredAppLanguage = () => {
  if (typeof window === 'undefined') return '';
  const pathLanguage = getPathLanguage(window.location.pathname);
  try {
    window.localStorage.setItem(DIST_SITE_LANGUAGE_STORAGE_KEY, pathLanguage);
  } catch {
    // The URL remains the source of truth when storage is unavailable.
  }
  return pathLanguage;
};
