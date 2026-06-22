import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useSite } from '../context/SiteContext';
import { DIST_SITE_LANGUAGES, getLocalizedPath, normalizeAppLanguage } from '../i18n/languageUtils';
import { FAQ_COPY } from '../content/faqCopy';
import { SEO_COPY } from '../content/seoCopy';

const DEFAULT_SITE_URL = 'https://www.api-route.com';
const DEFAULT_LOGO_URL = 'https://img.api-route.com/3.png';
const DEFAULT_OG_IMAGE_PATH = '/og-image.png';
const DEFAULT_OG_IMAGE_WIDTH = '1200';
const DEFAULT_OG_IMAGE_HEIGHT = '630';
const GA_MEASUREMENT_ID = 'G-GZT5KLBKJ8';
const STRUCTURED_DATA_TOPICS = [
  'AI API Gateway',
  'OpenAI-compatible API',
  'AI API reseller platform',
];
const INDEXABLE_PATHS = new Set(['/', '/pricing', '/packages', '/apps', '/ai-api-reseller-platform', '/faq']);
const PRIVATE_PATHS = new Set(['/login', '/register', '/dashboard', '/tokens', '/logs', '/tasks', '/topup', '/account']);
const LANGUAGE_HREFLANGS = {
  zh: 'zh-CN',
  en: 'en',
  ja: 'ja',
  ko: 'ko',
};
const LANGUAGE_LOCALES = {
  zh: 'zh_CN',
  en: 'en_US',
  ja: 'ja_JP',
  ko: 'ko_KR',
};
const BREADCRUMB_HOME_LABELS = {
  zh: '首页',
  'zh-CN': '首页',
  en: 'Home',
  ja: 'ホーム',
  ko: '홈',
};

function normalizeSiteName(name) {
  const value = String(name || '').trim();
  if (!value || value.toLowerCase() === 'api-route') return 'API-Route';
  return value;
}

function normalizePath(pathname) {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/+$/, '') || '/';
}

function getSiteUrl() {
  const configured = String(import.meta.env.VITE_PUBLIC_SITE_URL || '').trim();
  const candidate = configured || DEFAULT_SITE_URL;
  try {
    const url = new URL(candidate);
    if (url.hostname === 'api-route.com') url.hostname = 'www.api-route.com';
    return url.origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

function resolveUrl(value, origin) {
  if (!value) return '';
  try {
    return new URL(value, origin).href;
  } catch {
    return '';
  }
}

function upsertMeta(selector, attributes) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement('meta');
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
}

function removeMeta(selector) {
  document.head.querySelector(selector)?.remove();
}

function upsertLink(rel, href) {
  let link = document.head.querySelector(`link[rel="${rel}"]`);
  if (!link) {
    link = document.createElement('link');
    link.rel = rel;
    document.head.appendChild(link);
  }
  link.href = href;
}

function upsertAlternateLink(hrefLang, href) {
  let link = document.head.querySelector(`link[rel="alternate"][hreflang="${hrefLang}"]`);
  if (!link) {
    link = document.createElement('link');
    link.rel = 'alternate';
    link.hreflang = hrefLang;
    document.head.appendChild(link);
  }
  link.href = href;
}

function removeAlternateLinks() {
  document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach((link) => link.remove());
}

function syncOgLocaleAlternates(currentLanguage) {
  document.head.querySelectorAll('meta[property="og:locale:alternate"]').forEach((meta) => meta.remove());
  Object.entries(LANGUAGE_LOCALES)
    .filter(([code]) => code !== currentLanguage)
    .forEach(([, locale]) => {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:locale:alternate');
      meta.setAttribute('content', locale);
      document.head.appendChild(meta);
    });
}

function getFaqSeoPage(languageKey) {
  const copy = FAQ_COPY[languageKey] || FAQ_COPY.en;
  return {
    title: copy.title,
    description: copy.subtitle,
    questions: copy.sections.flatMap((section) => (
      section.items.map((item) => [item.question, item.answer])
    )),
  };
}

function getPageCopy(pathname, copy, languageKey) {
  if (pathname === '/') return copy.home;
  if (pathname === '/pricing') return copy.pricing;
  if (pathname === '/packages') return copy.packages;
  if (pathname === '/apps') return copy.apps;
  if (pathname === '/ai-api-reseller-platform') return copy.subSite;
  if (pathname === '/faq') return getFaqSeoPage(languageKey);
  return copy.private;
}

function trackPageView(pageTitle) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_title: pageTitle,
    page_path: `${window.location.pathname}${window.location.search}`,
    page_location: window.location.href,
  });
}

function setStructuredData({
  canonicalUrl,
  description,
  indexable,
  keywords,
  language,
  languageHomeUrl,
  logoUrl,
  pageTitle,
  page,
  serviceType,
  siteName,
  siteUrl,
}) {
  const scriptId = 'seo-structured-data';
  const existing = document.getElementById(scriptId);

  if (!indexable) {
    existing?.remove();
    return;
  }

  const availableLanguage = DIST_SITE_LANGUAGES.map(({ code }) => LANGUAGE_HREFLANGS[code] || code);
  const organizationId = `${siteUrl}/#organization`;
  const websiteId = `${languageHomeUrl}#website`;
  const graph = [
    {
      '@type': 'Organization',
      '@id': organizationId,
      name: siteName,
      url: siteUrl,
      knowsAbout: STRUCTURED_DATA_TOPICS,
      ...(logoUrl ? { logo: logoUrl } : {}),
    },
    {
      '@type': 'WebSite',
      '@id': websiteId,
      url: languageHomeUrl,
      name: siteName,
      description,
      keywords,
      inLanguage: language,
      availableLanguage,
      publisher: { '@id': organizationId },
    },
    {
      '@type': 'WebPage',
      '@id': `${canonicalUrl}#webpage`,
      url: canonicalUrl,
      name: pageTitle,
      description,
      keywords,
      inLanguage: language,
      isPartOf: { '@id': websiteId },
      about: { '@id': organizationId },
    },
  ];

  if (canonicalUrl === languageHomeUrl) {
    graph.push({
      '@type': 'Service',
      '@id': `${siteUrl}/#service`,
      name: siteName,
      serviceType,
      url: siteUrl,
      description,
      areaServed: 'Worldwide',
      availableLanguage,
      knowsAbout: STRUCTURED_DATA_TOPICS,
      provider: { '@id': organizationId },
    });
  } else {
    graph.push({
      '@type': 'BreadcrumbList',
      '@id': `${canonicalUrl}#breadcrumb`,
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: BREADCRUMB_HOME_LABELS[language] || BREADCRUMB_HOME_LABELS.en,
          item: languageHomeUrl,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: page?.title || pageTitle,
          item: canonicalUrl,
        },
      ],
    });
  }

  if (Array.isArray(page?.questions) && page.questions.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${canonicalUrl}#faq`,
      url: canonicalUrl,
      name: pageTitle,
      inLanguage: language,
      isPartOf: { '@id': `${canonicalUrl}#webpage` },
      mainEntity: page.questions.map(([question, answer]) => ({
        '@type': 'Question',
        name: question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: answer,
        },
      })),
    });
  }

  const script = existing || document.createElement('script');
  script.id = scriptId;
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': graph,
  }).replace(/</g, '\\u003c');

  if (!existing) document.head.appendChild(script);
}

export default function SeoManager() {
  const location = useLocation();
  const { i18n } = useTranslation();
  const { site } = useSite();
  const lastTrackedUrlRef = useRef('');

  useEffect(() => {
    const pathname = normalizePath(location.pathname);
    const languageKey = normalizeAppLanguage(i18n.resolvedLanguage);
    const copy = SEO_COPY[languageKey];
    const knownPath = INDEXABLE_PATHS.has(pathname) || PRIVATE_PATHS.has(pathname);
    const page = knownPath ? getPageCopy(pathname, copy, languageKey) : copy.notFound;
    const siteName = normalizeSiteName(site?.name);
    const siteUrl = getSiteUrl();
    const canonicalPath = getLocalizedPath(pathname, languageKey);
    const canonicalUrl = `${siteUrl}${canonicalPath}`;
    const languageHomeUrl = `${siteUrl}${getLocalizedPath('/', languageKey)}`;
    const indexable = INDEXABLE_PATHS.has(pathname);
    const metaTitle = page.metaTitle || page.title;
    const metaDescription = page.metaDescription || page.description;
    const pageTitle = `${metaTitle} | ${siteName}`;
    const logoSource = site?.logo || site?.favicon || DEFAULT_LOGO_URL;
    const logoUrl = resolveUrl(logoSource, siteUrl);
    const ogImageUrl = resolveUrl(DEFAULT_OG_IMAGE_PATH, siteUrl);
    const robots = indexable
      ? 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
      : 'noindex, nofollow, noarchive';

    document.documentElement.lang = copy.language;
    document.title = pageTitle;

    upsertMeta('meta[name="description"]', { name: 'description', content: metaDescription });
    upsertMeta('meta[name="keywords"]', { name: 'keywords', content: copy.keywords });
    upsertMeta('meta[name="language"]', { name: 'language', content: copy.language });
    upsertMeta('meta[name="robots"]', { name: 'robots', content: robots });
    upsertMeta('meta[name="googlebot"]', { name: 'googlebot', content: robots });
    upsertMeta('meta[name="application-name"]', { name: 'application-name', content: siteName });
    const prefersDark = document.documentElement.dataset.colorScheme === 'dark';
    upsertMeta('meta[name="theme-color"]', {
      name: 'theme-color',
      content: prefersDark ? '#15110F' : '#FAF6F1',
    });

    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' });
    upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: siteName });
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: pageTitle });
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: metaDescription });
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl });
    upsertMeta('meta[property="og:locale"]', { property: 'og:locale', content: copy.locale });
    syncOgLocaleAlternates(languageKey);

    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: ogImageUrl ? 'summary_large_image' : 'summary' });
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: pageTitle });
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: metaDescription });

    if (ogImageUrl) {
      upsertMeta('meta[property="og:image"]', { property: 'og:image', content: ogImageUrl });
      upsertMeta('meta[property="og:image:secure_url"]', { property: 'og:image:secure_url', content: ogImageUrl });
      upsertMeta('meta[property="og:image:alt"]', { property: 'og:image:alt', content: pageTitle });
      upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: ogImageUrl });
      upsertMeta('meta[name="twitter:image:alt"]', { name: 'twitter:image:alt', content: pageTitle });
      upsertMeta('meta[property="og:image:type"]', { property: 'og:image:type', content: 'image/png' });
      upsertMeta('meta[property="og:image:width"]', { property: 'og:image:width', content: DEFAULT_OG_IMAGE_WIDTH });
      upsertMeta('meta[property="og:image:height"]', { property: 'og:image:height', content: DEFAULT_OG_IMAGE_HEIGHT });
    } else {
      removeMeta('meta[property="og:image"]');
      removeMeta('meta[property="og:image:secure_url"]');
      removeMeta('meta[property="og:image:alt"]');
      removeMeta('meta[property="og:image:type"]');
      removeMeta('meta[property="og:image:width"]');
      removeMeta('meta[property="og:image:height"]');
      removeMeta('meta[name="twitter:image"]');
      removeMeta('meta[name="twitter:image:alt"]');
    }

    if (knownPath) {
      upsertLink('canonical', canonicalUrl);
    } else {
      document.head.querySelector('link[rel="canonical"]')?.remove();
    }
    if (indexable) {
      DIST_SITE_LANGUAGES.forEach(({ code }) => {
        const hrefLang = LANGUAGE_HREFLANGS[code] || code;
        upsertAlternateLink(hrefLang, `${siteUrl}${getLocalizedPath(pathname, code)}`);
      });
      upsertAlternateLink('x-default', `${siteUrl}${getLocalizedPath(pathname, 'en')}`);
    } else {
      removeAlternateLinks();
    }
    setStructuredData({
      canonicalUrl,
      description: metaDescription,
      indexable,
      keywords: copy.keywords,
      language: copy.language,
      languageHomeUrl,
      logoUrl,
      page,
      pageTitle,
      serviceType: copy.serviceType,
      siteName,
      siteUrl,
    });

    const trackedUrl = `${location.pathname}${location.search}`;
    if (lastTrackedUrlRef.current !== trackedUrl) {
      lastTrackedUrlRef.current = trackedUrl;
      trackPageView(pageTitle);
    }
  }, [i18n.resolvedLanguage, location.pathname, location.search, site?.favicon, site?.logo, site?.name]);

  return null;
}
