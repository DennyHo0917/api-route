import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSiteInfo } from '../api';
import i18n from '../i18n';
import { normalizeAppLanguage } from '../i18n/languageUtils';

const SiteContext = createContext(null);
const SITE_STORAGE_KEY = 'dist_site_info_v1';
const FX_STORAGE_KEY = 'dist_cny_fx_rates_v1';
export const COLOR_SCHEME_STORAGE_KEY = 'dist_color_scheme';

const currencyByLanguage = {
  zh: { code: 'CNY', symbol: '\u00a5', decimals: 2 },
  en: { code: 'USD', symbol: '$', decimals: 2 },
  ja: { code: 'JPY', symbol: '\u00a5', decimals: 0 },
  ko: { code: 'KRW', symbol: '\u20a9', decimals: 0 },
};

const fallbackCnyRates = {
  CNY: 1,
  USD: 1 / 7,
  JPY: 22,
  KRW: 190,
};

function normalizeRate(value) {
  const rate = Number(value);
  return Number.isFinite(rate) && rate > 0 ? rate : 0;
}

function parseCnyRates(payload) {
  const next = { CNY: 1 };
  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.value)
      ? payload.value
      : null;

  if (rows) {
    rows.forEach((row) => {
      const code = String(row?.quote || row?.symbol || '').toUpperCase();
      const rate = normalizeRate(row?.rate);
      if (code && rate) next[code] = rate;
    });
  } else if (payload?.rates && typeof payload.rates === 'object') {
    Object.entries(payload.rates).forEach(([code, value]) => {
      const rate = normalizeRate(value);
      if (rate) next[String(code).toUpperCase()] = rate;
    });
  }

  return next.USD && next.JPY && next.KRW ? next : null;
}

function loadStoredRates() {
  if (typeof window === 'undefined') return null;
  try {
    const stored = JSON.parse(window.localStorage.getItem(FX_STORAGE_KEY) || 'null');
    if (stored?.rates && Number(stored?.expiresAt) > Date.now()) {
      return stored.rates;
    }
  } catch {
    window.localStorage.removeItem(FX_STORAGE_KEY);
  }
  return null;
}

function loadStoredSite() {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(window.localStorage.getItem(SITE_STORAGE_KEY) || 'null')?.site || null;
  } catch {
    window.localStorage.removeItem(SITE_STORAGE_KEY);
    return null;
  }
}

function storeSite(site) {
  try {
    window.localStorage.setItem(SITE_STORAGE_KEY, JSON.stringify({ site }));
  } catch {
    // Cached site config only avoids local loading flashes.
  }
}

function formatCurrencyNumber(value, decimals) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '-';
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// Map theme template name → CSS class(es) to apply on <body>
const themeClassMap = {
  starter: 'theme-light theme-starter',
  default: 'theme-light theme-starter',
  dark: 'theme-dark',
  minimal: 'theme-minimal',
  clean: 'theme-light',
  corporate: 'theme-light',
  claude: 'theme-light theme-claude',
  aurora: 'theme-light theme-aurora',
  terminal: 'theme-terminal',
  market: 'theme-light theme-market',
  maoqiu: 'theme-light theme-maoqiu',
};

function applyThemeClass(themeName) {
  const cls = themeClassMap[themeName] || '';
  document.body.className = cls + (cls ? ' ' : '') + 'antialiased';
  try { localStorage.setItem('dist-theme-class', cls); } catch(e) {}
}

function getDevPreviewTheme() {
  if (!import.meta.env.DEV || typeof window === 'undefined') return '';
  return new URLSearchParams(window.location.search).get('preview_theme') || '';
}

function getDevPreviewColorScheme() {
  if (!import.meta.env.DEV || typeof window === 'undefined') return '';
  const value = new URLSearchParams(window.location.search).get('preview_color_scheme');
  return value === 'dark' || value === 'light' ? value : '';
}

function getStoredColorScheme() {
  try {
    const value = window.localStorage.getItem(COLOR_SCHEME_STORAGE_KEY);
    return value === 'dark' || value === 'light' ? value : '';
  } catch {
    return '';
  }
}

function upsertMeta(name, content) {
  if (!content) return;
  let meta = document.querySelector(`meta[name="${name}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = name;
    document.head.appendChild(meta);
  }
  meta.content = content;
}

function upsertLink(rel, href, attrs = {}) {
  if (!href) return;
  const sizesSelector = attrs.sizes ? `[sizes="${attrs.sizes}"]` : ':not([sizes])';
  let link = document.querySelector(`link[rel="${rel}"]${sizesSelector}`);
  if (!link) {
    link = document.createElement('link');
    document.head.appendChild(link);
  }
  link.rel = rel;
  link.href = href;
  Object.entries(attrs).forEach(([key, value]) => {
    if (value) link.setAttribute(key, value);
  });
}

function applySiteDocumentMeta(site) {
  const siteName = site?.name;
  const iconUrl = site?.favicon || site?.logo;

  if (siteName) {
    upsertMeta('application-name', siteName);
    upsertMeta('apple-mobile-web-app-title', siteName);
  }

  if (iconUrl) {
    upsertLink('icon', iconUrl);
    upsertLink('shortcut icon', iconUrl);
    upsertLink('apple-touch-icon', iconUrl);
    upsertLink('apple-touch-icon', iconUrl, { sizes: '180x180' });
  }

  upsertLink('manifest', '/site.webmanifest');
}

export function SiteProvider({ children }) {
  const [site, setSite] = useState(() => loadStoredSite());
  const [loading, setLoading] = useState(() => !loadStoredSite());
  const [cnyRates, setCnyRates] = useState(() => loadStoredRates());

  useEffect(() => {
    let cancelled = false;
    fetch('https://api.frankfurter.dev/v2/rates?base=CNY&quotes=USD,JPY,KRW', {
      cache: 'no-store',
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        const rates = parseCnyRates(payload);
        if (!rates || cancelled) return;
        setCnyRates(rates);
        try {
          window.localStorage.setItem(FX_STORAGE_KEY, JSON.stringify({
            rates,
            expiresAt: Date.now() + 6 * 60 * 60 * 1000,
          }));
        } catch {
          // Live rates only affect display; fallback rates remain available.
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const previewColorScheme = getDevPreviewColorScheme();
    const applyColorScheme = () => {
      const colorScheme = previewColorScheme || getStoredColorScheme() || (media.matches ? 'dark' : 'light');
      document.documentElement.dataset.colorScheme = colorScheme;
      const themeColor = document.querySelector('meta[name="theme-color"]');
      if (themeColor) {
        themeColor.content = colorScheme === 'dark' ? '#15110F' : '#FAF6F1';
      }
    };

    applyColorScheme();
    if (!previewColorScheme) {
      media.addEventListener?.('change', applyColorScheme);
      media.addListener?.(applyColorScheme);
    }

    return () => {
      media.removeEventListener?.('change', applyColorScheme);
      media.removeListener?.(applyColorScheme);
    };
  }, []);

  useEffect(() => {
    const previewTheme = getDevPreviewTheme();
    if (previewTheme) {
      const previewSite = {
        name: 'SubRouter Preview',
        theme_template: previewTheme,
        enable_topup: true,
        allow_sub_dist: true,
        currency: {
          code: 'CNY',
          symbol: '¥',
          exchange_rate: 7,
          usd_exchange_rate: 7,
        },
      };
      setSite(previewSite);
      applyThemeClass(previewTheme);
      applySiteDocumentMeta({ ...previewSite, name: `${previewSite.name} · ${previewTheme}` });
      setLoading(false);
      return;
    }

    getSiteInfo()
      .then((res) => {
        if (res.data.success) {
          setSite(res.data.data);
          storeSite(res.data.data);
          // Apply theme class to body immediately
          applyThemeClass(res.data.data?.theme_template);
          applySiteDocumentMeta(res.data.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <SiteContext.Provider value={{ site, loading, cnyRates }}>
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error('useSite must be used within SiteProvider');
  return ctx;
}

/**
 * useCurrency - 获取分站货币配置
 * 返回 { symbol, rate, code, fmt(usdValue) }
 * fmt() 将 USD 值转换为显示货币并格式化
 */
export function useCurrency() {
  const { site, cnyRates } = useSite();
  const currency = site?.currency;
  const cnyPerUsd = normalizeRate(currency?.usd_exchange_rate)
    || normalizeRate(currency?.exchange_rate)
    || 7;
  const language = normalizeAppLanguage(i18n.resolvedLanguage || i18n.language);
  const displayCurrency = currencyByLanguage[language] || currencyByLanguage.en;
  const code = displayCurrency.code;
  const symbol = displayCurrency.symbol;
  const decimals = displayCurrency.decimals;
  const rates = {
    ...fallbackCnyRates,
    USD: 1 / cnyPerUsd,
    ...(cnyRates || {}),
    CNY: 1,
  };
  const cnyRate = normalizeRate(rates[code]) || fallbackCnyRates[code] || 1;
  const usdToDisplayRate = code === 'CNY'
    ? cnyPerUsd
    : code === 'USD'
      ? 1
      : cnyRate / (normalizeRate(rates.USD) || (1 / cnyPerUsd));

  const fmt = (usdValue, overrideDecimals = decimals) => {
    if (usdValue == null || isNaN(usdValue)) return '-';
    const converted = Number(usdValue) * usdToDisplayRate;
    return symbol + formatCurrencyNumber(converted, overrideDecimals);
  };

  const fmtCNY = (cnyValue, overrideDecimals = decimals) => {
    if (cnyValue == null || isNaN(cnyValue)) return '-';
    const converted = Number(cnyValue) * cnyRate;
    return symbol + formatCurrencyNumber(converted, overrideDecimals);
  };

  return {
    symbol,
    rate: usdToDisplayRate,
    code,
    fmt,
    fmtCNY,
    cnyRate,
    cnyPerUsd,
    usdRate: cnyPerUsd,
    decimals,
  };
}
