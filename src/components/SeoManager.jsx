import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useSite } from '../context/SiteContext';
import { getLocalizedPath } from '../i18n/languageUtils';

const DEFAULT_SITE_URL = 'https://api-route.com';
const INDEXABLE_PATHS = new Set(['/', '/pricing', '/packages', '/apps']);

const SEO_COPY = {
  zh: {
    home: {
      title: '多模型 AI API 聚合与统一调用平台',
      description: '通过一个兼容 OpenAI 格式的 API 接入多种主流大模型，提供统一调用、清晰计费、套餐管理与稳定路由。',
    },
    pricing: {
      title: 'AI API 模型价格与费率',
      description: '查看 API-Route 支持的模型、输入输出费率与计费方式，按实际需求选择适合的 AI API。',
    },
    packages: {
      title: 'AI API 套餐与兑换码',
      description: '查看 API-Route 套餐额度、有效期与适用场景，购买兑换码后可在站内自动激活对应套餐。',
    },
    apps: {
      title: 'AI 应用与客户端接入',
      description: '查看可接入 API-Route 的 AI 应用与客户端，通过统一 API 地址和密钥快速开始使用。',
    },
    private: {
      title: '用户中心',
      description: 'API-Route 用户中心。',
    },
    keywords: 'AI API,API 聚合,OpenAI 兼容接口,大模型 API,多模型 API,模型中转,API-Route',
    locale: 'zh_CN',
    language: 'zh-CN',
    serviceType: '多模型 AI API 聚合与统一调用服务',
  },
  en: {
    home: {
      title: 'Unified Multi-Model AI API Platform',
      description: 'Access multiple leading AI models through one OpenAI-compatible API with unified usage, transparent pricing, packages, and reliable routing.',
    },
    pricing: {
      title: 'AI API Models and Pricing',
      description: 'Compare supported AI models, input and output rates, and billing methods available through API-Route.',
    },
    packages: {
      title: 'AI API Plans and Redeem Codes',
      description: 'Explore API-Route plans, quotas, validity periods, and activate a matching plan with a redeem code.',
    },
    apps: {
      title: 'AI Apps and Client Integrations',
      description: 'Connect supported AI apps and clients to API-Route with one API endpoint and access key.',
    },
    private: {
      title: 'Account',
      description: 'API-Route account area.',
    },
    keywords: 'AI API,API aggregation,OpenAI compatible API,LLM API,multi-model API,API-Route',
    locale: 'en_US',
    language: 'en',
    serviceType: 'Multi-model AI API aggregation and routing service',
  },
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
    return new URL(candidate).origin;
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

function getPageCopy(pathname, copy) {
  if (pathname === '/') return copy.home;
  if (pathname === '/pricing') return copy.pricing;
  if (pathname === '/packages') return copy.packages;
  if (pathname === '/apps') return copy.apps;
  return copy.private;
}

function setStructuredData({
  canonicalUrl,
  description,
  indexable,
  language,
  languageHomeUrl,
  logoUrl,
  pageTitle,
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

  const organizationId = `${siteUrl}/#organization`;
  const websiteId = `${languageHomeUrl}#website`;
  const graph = [
    {
      '@type': 'Organization',
      '@id': organizationId,
      name: siteName,
      url: siteUrl,
      ...(logoUrl ? { logo: logoUrl } : {}),
    },
    {
      '@type': 'WebSite',
      '@id': websiteId,
      url: languageHomeUrl,
      name: siteName,
      description,
      inLanguage: language,
      publisher: { '@id': organizationId },
    },
    {
      '@type': 'WebPage',
      '@id': `${canonicalUrl}#webpage`,
      url: canonicalUrl,
      name: pageTitle,
      description,
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
      provider: { '@id': organizationId },
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

  useEffect(() => {
    const pathname = normalizePath(location.pathname);
    const languageKey = i18n.resolvedLanguage?.startsWith('zh') ? 'zh' : 'en';
    const copy = SEO_COPY[languageKey];
    const page = getPageCopy(pathname, copy);
    const siteName = normalizeSiteName(site?.name);
    const siteUrl = getSiteUrl();
    const canonicalPath = getLocalizedPath(pathname, languageKey);
    const canonicalUrl = `${siteUrl}${canonicalPath}`;
    const chineseUrl = `${siteUrl}${getLocalizedPath(pathname, 'zh')}`;
    const englishUrl = `${siteUrl}${getLocalizedPath(pathname, 'en')}`;
    const languageHomeUrl = `${siteUrl}${getLocalizedPath('/', languageKey)}`;
    const indexable = INDEXABLE_PATHS.has(pathname);
    const pageTitle = `${page.title} | ${siteName}`;
    const logoUrl = resolveUrl(site?.logo || site?.favicon, siteUrl);
    const robots = indexable
      ? 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
      : 'noindex, nofollow, noarchive';

    document.documentElement.lang = copy.language;
    document.title = pageTitle;

    upsertMeta('meta[name="description"]', { name: 'description', content: page.description });
    upsertMeta('meta[name="keywords"]', { name: 'keywords', content: copy.keywords });
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
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: page.description });
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl });
    upsertMeta('meta[property="og:locale"]', { property: 'og:locale', content: copy.locale });

    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: logoUrl ? 'summary_large_image' : 'summary' });
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: pageTitle });
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: page.description });

    if (logoUrl) {
      upsertMeta('meta[property="og:image"]', { property: 'og:image', content: logoUrl });
      upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: logoUrl });
    } else {
      removeMeta('meta[property="og:image"]');
      removeMeta('meta[name="twitter:image"]');
    }

    upsertLink('canonical', canonicalUrl);
    if (indexable) {
      upsertAlternateLink('zh-CN', chineseUrl);
      upsertAlternateLink('en', englishUrl);
      upsertAlternateLink('x-default', chineseUrl);
    } else {
      removeAlternateLinks();
    }
    setStructuredData({
      canonicalUrl,
      description: page.description,
      indexable,
      language: copy.language,
      languageHomeUrl,
      logoUrl,
      pageTitle,
      serviceType: copy.serviceType,
      siteName,
      siteUrl,
    });
  }, [i18n.resolvedLanguage, location.pathname, site?.favicon, site?.logo, site?.name]);

  return null;
}
