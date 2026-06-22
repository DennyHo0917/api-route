import { useTranslation } from 'react-i18next';
import {
  DIST_SITE_LANGUAGES,
  DIST_SITE_MANUAL_LANGUAGE_STORAGE_KEY,
  DIST_SITE_LANGUAGE_STORAGE_KEY,
  getLocalizedPath,
  normalizeAppLanguage,
} from '../i18n/languageUtils';

export default function LanguageSwitch({ className = '', iconOnly = false }) {
  const { i18n, t } = useTranslation();
  const currentLanguage = normalizeAppLanguage(i18n.resolvedLanguage || i18n.language);
  const handleLanguageChange = (event) => {
    const nextLanguage = normalizeAppLanguage(event.target.value);
    if (nextLanguage === currentLanguage) return;

    try {
      window.localStorage.setItem(DIST_SITE_MANUAL_LANGUAGE_STORAGE_KEY, nextLanguage);
      window.localStorage.setItem(DIST_SITE_LANGUAGE_STORAGE_KEY, nextLanguage);
    } catch {
      // The language path remains authoritative when storage is unavailable.
    }

    const nextPath = getLocalizedPath(window.location.pathname, nextLanguage);
    window.location.assign(`${nextPath}${window.location.search}${window.location.hash}`);
  };

  return (
    <label
      className={`${iconOnly ? 'relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full' : 'flex items-center gap-1.5 px-2.5 py-1 rounded-md'} text-xs transition-colors ${className}`}
      title={t('common.changeLanguage')}
    >
      <svg className={iconOnly ? 'h-4 w-4' : 'h-3.5 w-3.5'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.6 9h16.8M3.6 15h16.8" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3a15.3 15.3 0 0 1 4 9 15.3 15.3 0 0 1-4 9 15.3 15.3 0 0 1-4-9 15.3 15.3 0 0 1 4-9Z" />
      </svg>
      <select
        value={currentLanguage}
        onChange={handleLanguageChange}
        className={iconOnly ? 'absolute inset-0 h-full w-full cursor-pointer opacity-0' : 'language-select bg-transparent text-current outline-none'}
        aria-label={t('common.changeLanguage')}
      >
        {DIST_SITE_LANGUAGES.map((language) => (
          <option key={language.code} value={language.code}>
            {language.label}
          </option>
        ))}
      </select>
    </label>
  );
}
