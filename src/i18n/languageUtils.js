export const DIST_SITE_LANGUAGE_STORAGE_KEY = 'dist_site_i18nextLng';
export const ENGLISH_PATH_PREFIX = '/en';

export const DIST_SITE_LANGUAGES = [
  { code: 'zh', label: '中文' },
  { code: 'en', label: 'EN' },
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
  return normalizedPath === ENGLISH_PATH_PREFIX || normalizedPath.startsWith(`${ENGLISH_PATH_PREFIX}/`)
    ? 'en'
    : 'zh';
};

export const stripLanguagePrefix = (pathname = '/') => {
  const normalizedPath = String(pathname || '/') || '/';
  if (normalizedPath.toLowerCase() === ENGLISH_PATH_PREFIX) return '/';
  if (normalizedPath.toLowerCase().startsWith(`${ENGLISH_PATH_PREFIX}/`)) {
    return normalizedPath.slice(ENGLISH_PATH_PREFIX.length) || '/';
  }
  return normalizedPath;
};

export const getLocalizedPath = (pathname, language) => {
  const routePath = stripLanguagePrefix(pathname);
  if (normalizeAppLanguage(language) !== 'en') return routePath;
  return routePath === '/' ? `${ENGLISH_PATH_PREFIX}/` : `${ENGLISH_PATH_PREFIX}${routePath}`;
};

export const getRouterBasename = (pathname = '/') => (
  getPathLanguage(pathname) === 'en' ? ENGLISH_PATH_PREFIX : '/'
);

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
