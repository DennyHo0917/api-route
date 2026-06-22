import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FAQ_COPY } from '../src/content/faqCopy.js';
import { SEO_COPY } from '../src/content/seoCopy.js';
import { getLocalizedPath } from '../src/i18n/languageUtils.js';

const SITE_URL = 'https://www.api-route.com';
const DEFAULT_LOGO_URL = 'https://img.api-route.com/3.png';
const DEFAULT_OG_IMAGE_URL = `${SITE_URL}/og-image.png`;
const DEFAULT_OG_IMAGE_WIDTH = '1200';
const DEFAULT_OG_IMAGE_HEIGHT = '630';
const STRUCTURED_DATA_TOPICS = [
  'AI API Gateway',
  'OpenAI-compatible API',
  'AI API reseller platform',
];
const DIST_DIR = new URL('../dist/', import.meta.url);
const TEMPLATE_PATH = new URL('index.html', DIST_DIR);

const languages = {
  en: { hrefLang: 'en', htmlLang: 'en', locale: 'en_US' },
  zh: { hrefLang: 'zh-CN', htmlLang: 'zh-CN', locale: 'zh_CN' },
  ja: { hrefLang: 'ja', htmlLang: 'ja', locale: 'ja_JP' },
  ko: { hrefLang: 'ko', htmlLang: 'ko', locale: 'ko_KR' },
};

const pages = [
  { key: 'home', path: '/' },
  { key: 'pricing', path: '/pricing' },
  { key: 'packages', path: '/packages' },
  { key: 'apps', path: '/apps' },
  { key: 'subSite', path: '/ai-api-reseller-platform' },
  { key: 'faq', path: '/faq' },
];

const snapshotLabels = {
  zh: { breadcrumb: '位置', home: '首页', related: '相关页面' },
  en: { breadcrumb: 'Breadcrumb', home: 'Home', related: 'Related pages' },
  ja: { breadcrumb: 'パンくずリスト', home: 'ホーム', related: '関連ページ' },
  ko: { breadcrumb: '이동 경로', home: '홈', related: '관련 페이지' },
};

const relatedPageKeys = {
  home: ['pricing', 'packages', 'faq', 'subSite'],
  pricing: ['packages', 'faq', 'apps'],
  packages: ['pricing', 'faq'],
  apps: ['pricing', 'faq', 'packages'],
  subSite: ['pricing', 'faq', 'packages'],
  faq: ['pricing', 'packages', 'subSite'],
};

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const localizedPath = (path, language) => getLocalizedPath(path, language);
const languageHomeUrl = (language) => `${SITE_URL}${localizedPath('/', language)}`;

function getFaqPage(language) {
  const copy = FAQ_COPY[language] || FAQ_COPY.en;
  return {
    title: copy.title,
    description: copy.subtitle,
    questions: copy.sections.flatMap((section) => (
      section.items.map((item) => [item.question, item.answer])
    )),
  };
}

function getSeoPage(page, language) {
  if (page.key === 'faq') return getFaqPage(language);
  return SEO_COPY[language]?.[page.key] || SEO_COPY.en[page.key];
}

function renderQuestions(questions) {
  if (!questions?.length) return '';
  return `<section><h2>FAQ</h2>${questions.map(([question, answer]) => `<article><h3>${escapeHtml(question)}</h3><p>${escapeHtml(answer)}</p></article>`).join('')}</section>`;
}

function getPageByKey(key) {
  return pages.find((page) => page.key === key);
}

function renderBreadcrumb(page, language, title) {
  if (page.path === '/') return '';
  const labels = snapshotLabels[language] || snapshotLabels.en;
  return `<nav aria-label="${escapeHtml(labels.breadcrumb)}"><a href="${languageHomeUrl(language)}">${escapeHtml(labels.home)}</a> <span>${escapeHtml(title)}</span></nav>`;
}

function renderRelatedPages(page, language) {
  const labels = snapshotLabels[language] || snapshotLabels.en;
  const related = (relatedPageKeys[page.key] || [])
    .map(getPageByKey)
    .filter(Boolean)
    .map((relatedPage) => {
      const copy = getSeoPage(relatedPage, language);
      return `<article><h3><a href="${SITE_URL}${localizedPath(relatedPage.path, language)}">${escapeHtml(copy.title)}</a></h3><p>${escapeHtml(copy.description)}</p></article>`;
    })
    .join('');
  return related ? `<section><h2>${escapeHtml(labels.related)}</h2>${related}</section>` : '';
}

function renderSnapshot(page, language, title, description, questions) {
  const links = [
    ['/pricing', 'Pricing'],
    ['/packages', 'Packages'],
    ['/apps', 'Apps'],
    ['/ai-api-reseller-platform', 'Reseller'],
    ['/faq', 'FAQ'],
  ].map(([path, label]) => `<a href="${SITE_URL}${localizedPath(path, language)}">${label}</a>`).join(' ');

  return `<main data-seo-prerendered="true">${renderBreadcrumb(page, language, title)}<h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p>${renderRelatedPages(page, language)}${renderQuestions(questions)}<nav>${links}</nav></main>`;
}

function replaceMeta(html, language, page) {
  const seoPage = getSeoPage(page, language);
  const title = seoPage.title;
  const description = seoPage.description;
  const metaTitle = seoPage.metaTitle || title;
  const metaDescription = seoPage.metaDescription || description;
  const questions = seoPage.questions || [];
  const keywords = SEO_COPY[language]?.keywords || SEO_COPY.en.keywords;
  const pageTitle = `${metaTitle} | API-Route`;
  const canonicalPath = localizedPath(page.path, language);
  const canonicalUrl = `${SITE_URL}${canonicalPath}`;
  const homeUrl = languageHomeUrl(language);
  const organizationId = `${SITE_URL}/#organization`;
  const websiteId = `${homeUrl}#website`;
  const availableLanguage = Object.values(languages).map((config) => config.htmlLang);
  const alternates = Object.entries(languages)
    .map(([code, config]) => `    <link rel="alternate" hreflang="${config.hrefLang}" href="${SITE_URL}${localizedPath(page.path, code)}" />`)
    .concat(`    <link rel="alternate" hreflang="x-default" href="${SITE_URL}${localizedPath(page.path, 'en')}" />`)
    .join('\n');
  const snapshot = renderSnapshot(page, language, title, description, questions);
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': organizationId,
        name: 'API-Route',
        url: `${SITE_URL}/`,
        logo: DEFAULT_LOGO_URL,
        knowsAbout: STRUCTURED_DATA_TOPICS,
      },
      {
        '@type': 'WebSite',
        '@id': websiteId,
        url: homeUrl,
        name: 'API-Route',
        description: SEO_COPY[language]?.home?.description || SEO_COPY.en.home.description,
        keywords,
        inLanguage: languages[language].htmlLang,
        availableLanguage,
        publisher: { '@id': organizationId },
      },
      {
        '@type': 'WebPage',
        '@id': `${canonicalUrl}#webpage`,
        url: canonicalUrl,
        name: pageTitle,
        description: metaDescription,
        keywords,
        inLanguage: languages[language].htmlLang,
        isPartOf: { '@id': websiteId },
        about: { '@id': organizationId },
      },
    ],
  };

  if (canonicalUrl === homeUrl) {
    structuredData['@graph'].push({
      '@type': 'Service',
      '@id': `${SITE_URL}/#service`,
      name: 'API-Route',
      serviceType: SEO_COPY[language]?.serviceType || SEO_COPY.en.serviceType,
      url: SITE_URL,
      description: metaDescription,
      areaServed: 'Worldwide',
      availableLanguage,
      knowsAbout: STRUCTURED_DATA_TOPICS,
      provider: { '@id': organizationId },
    });
  } else {
    const labels = snapshotLabels[language] || snapshotLabels.en;
    structuredData['@graph'].push({
      '@type': 'BreadcrumbList',
      '@id': `${canonicalUrl}#breadcrumb`,
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: labels.home,
          item: homeUrl,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: title,
          item: canonicalUrl,
        },
      ],
    });
  }

  if (questions.length > 0) {
    structuredData['@graph'].push({
      '@type': 'FAQPage',
      '@id': `${canonicalUrl}#faq`,
      url: canonicalUrl,
      name: pageTitle,
      inLanguage: languages[language].htmlLang,
      isPartOf: { '@id': `${canonicalUrl}#webpage` },
      mainEntity: questions.map(([question, answer]) => ({
        '@type': 'Question',
        name: question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: answer,
        },
      })),
    });
  }

  return html
    .replace(/<html lang="[^"]*">/, `<html lang="${languages[language].htmlLang}">`)
    .replace(/<title>.*?<\/title>/s, `<title>${escapeHtml(pageTitle)}</title>`)
    .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${escapeHtml(metaDescription)}" />`)
    .replace(/<meta name="keywords" content="[^"]*" \/>/, `<meta name="keywords" content="${escapeHtml(keywords)}" />`)
    .replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${canonicalUrl}" />`)
    .replace(/(?:\s*<link rel="alternate" hreflang="[^"]*" href="[^"]*" \/>){5}/, `\n${alternates}`)
    .replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${escapeHtml(pageTitle)}" />`)
    .replace(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${escapeHtml(metaDescription)}" />`)
    .replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${canonicalUrl}" />`)
    .replace(/<meta property="og:locale" content="[^"]*" \/>/, `<meta property="og:locale" content="${languages[language].locale}" />`)
    .replace(/<meta property="og:image" content="[^"]*" \/>/, `<meta property="og:image" content="${DEFAULT_OG_IMAGE_URL}" />`)
    .replace(/<meta property="og:image:secure_url" content="[^"]*" \/>/, `<meta property="og:image:secure_url" content="${DEFAULT_OG_IMAGE_URL}" />`)
    .replace(/<meta property="og:image:type" content="[^"]*" \/>/, '<meta property="og:image:type" content="image/png" />')
    .replace(/<meta property="og:image:width" content="[^"]*" \/>/, `<meta property="og:image:width" content="${DEFAULT_OG_IMAGE_WIDTH}" />`)
    .replace(/<meta property="og:image:height" content="[^"]*" \/>/, `<meta property="og:image:height" content="${DEFAULT_OG_IMAGE_HEIGHT}" />`)
    .replace(/<meta property="og:image:alt" content="[^"]*" \/>/, `<meta property="og:image:alt" content="${escapeHtml(pageTitle)}" />`)
    .replace(/<meta name="twitter:card" content="[^"]*" \/>/, '<meta name="twitter:card" content="summary_large_image" />')
    .replace(/<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${escapeHtml(pageTitle)}" />`)
    .replace(/<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${escapeHtml(metaDescription)}" />`)
    .replace(/<meta name="twitter:image" content="[^"]*" \/>/, `<meta name="twitter:image" content="${DEFAULT_OG_IMAGE_URL}" />`)
    .replace(/<meta name="twitter:image:alt" content="[^"]*" \/>/, `<meta name="twitter:image:alt" content="${escapeHtml(pageTitle)}" />`)
    .replace(/<script id="seo-structured-data" type="application\/ld\+json">.*?<\/script>/s, `<script id="seo-structured-data" type="application/ld+json">${JSON.stringify(structuredData).replaceAll('<', '\\u003c')}</script>`)
    .replace('<div id="root"></div>', `<div id="root">${snapshot}</div>`);
}

const template = await readFile(TEMPLATE_PATH, 'utf8');

for (const [language] of Object.entries(languages)) {
  for (const page of pages) {
    const route = localizedPath(page.path, language);
    const outputPath = route === '/'
      ? new URL('index.html', DIST_DIR)
      : new URL(`.${route}.html`, DIST_DIR);
    await mkdir(dirname(fileURLToPath(outputPath)), { recursive: true });
    await writeFile(outputPath, replaceMeta(template, language, page), 'utf8');
  }
}

const notFound = template
  .replace(/<title>.*?<\/title>/s, '<title>Page Not Found | API-Route</title>')
  .replace(/<meta name="robots" content="[^"]*" \/>/, '<meta name="robots" content="noindex, nofollow, noarchive" />')
  .replace(/<meta name="googlebot" content="[^"]*" \/>/, '<meta name="googlebot" content="noindex, nofollow, noarchive" />')
  .replace(/\s*<link rel="canonical" href="[^"]*" \/>/, '')
  .replace(/(?:\s*<link rel="alternate" hreflang="[^"]*" href="[^"]*" \/>){5}/, '')
  .replace('<div id="root"></div>', '<div id="root"><main><h1>404</h1><p>The requested page could not be found.</p><a href="/">Return home</a></main></div>');
await writeFile(new URL('404.html', DIST_DIR), notFound, 'utf8');
