import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE_URL = 'https://www.api-route.com';
const DIST_DIR = new URL('../dist/', import.meta.url);
const TEMPLATE_PATH = new URL('index.html', DIST_DIR);

const languages = {
  zh: { prefix: '', hrefLang: 'zh-CN', htmlLang: 'zh-CN', locale: 'zh_CN' },
  en: { prefix: '/en', hrefLang: 'en', htmlLang: 'en', locale: 'en_US' },
  ja: { prefix: '/ja', hrefLang: 'ja', htmlLang: 'ja', locale: 'ja_JP' },
  ko: { prefix: '/ko', hrefLang: 'ko', htmlLang: 'ko', locale: 'ko_KR' },
};

const pages = {
  home: {
    path: '/',
    copy: {
      zh: ['多模型 AI API 聚合与统一调用平台', '通过一个兼容 OpenAI 格式的 API 接入多种主流大模型，提供统一调用、清晰计费、套餐管理与稳定路由。'],
      en: ['Unified Multi-Model AI API Platform', 'Access multiple leading AI models through one OpenAI-compatible API with unified usage, transparent pricing, packages, and reliable routing.'],
      ja: ['複数モデル対応の AI API プラットフォーム', 'OpenAI 互換 API から主要 AI モデルへまとめてアクセス。統一された利用量管理、わかりやすい料金、安定したルーティングを提供します。'],
      ko: ['멀티 모델 AI API 플랫폼', 'OpenAI 호환 API 하나로 주요 AI 모델을 연결하고, 통합 사용량 관리와 투명한 요금, 안정적인 라우팅을 제공합니다.'],
    },
  },
  pricing: {
    path: '/pricing',
    copy: {
      zh: ['AI API 模型价格与费率', '查看 API-Route 支持的模型、输入输出费率与计费方式，按实际需求选择适合的 AI API。'],
      en: ['AI API Models and Pricing', 'Compare supported AI models, input and output rates, and billing methods available through API-Route.'],
      ja: ['AI API モデルと料金', 'API-Route で利用できるモデル、入力・出力料金、課金方式を比較できます。'],
      ko: ['AI API 모델 및 요금', 'API-Route에서 지원하는 모델, 입력·출력 요금, 과금 방식을 비교하세요.'],
    },
  },
  packages: {
    path: '/packages',
    copy: {
      zh: ['AI API 套餐与兑换码', '查看 API-Route 套餐额度、有效期与适用场景，购买兑换码后可在站内自动激活对应套餐。'],
      en: ['AI API Plans and Redeem Codes', 'Explore API-Route plans, quotas, validity periods, and activate a matching plan with a redeem code.'],
      ja: ['AI API プランとコード', 'プランのクォータ、有効期間、利用シーンを確認し、コードを使ってすぐに有効化できます。'],
      ko: ['AI API 플랜과 코드', '플랜 쿼터, 유효 기간, 사용 시나리오를 확인하고 코드를 사용해 바로 활성화할 수 있습니다.'],
    },
  },
  apps: {
    path: '/apps',
    copy: {
      zh: ['AI 应用与客户端接入', '查看可接入 API-Route 的 AI 应用与客户端，通过统一 API 地址和密钥快速开始使用。'],
      en: ['AI Apps and Client Integrations', 'Connect supported AI apps and clients to API-Route with one API endpoint and access key.'],
      ja: ['AI アプリとクライアント連携', '統一 API エンドポイントとキーで接続できる AI アプリやクライアントを確認できます。'],
      ko: ['AI 앱 및 클라이언트 연동', '통합 API 엔드포인트와 키로 연결할 수 있는 AI 앱과 클라이언트를 확인하세요.'],
    },
  },
  subSite: {
    path: '/sub-site',
    copy: {
      zh: ['AI API 中转站搭建', '开通可独立访问、支持收款、定价和推广的 AI API 中转站，并在支付后自动启用管理权限。'],
      en: ['AI API Relay Site Setup', 'Launch an independent AI API relay site with payments, pricing, promotion, and automatic management access after payment.'],
      ja: ['AI API 中継サイト構築', '訪問・決済・価格設定・販売に対応した独立 AI API 中継サイトを立ち上げ、支払い後に管理権限を自動で有効化します。'],
      ko: ['AI API 릴레이 사이트 구축', '방문, 결제, 가격 설정, 판매를 지원하는 독립 AI API 릴레이 사이트를 만들고 결제 후 관리 권한을 자동으로 활성화합니다.'],
    },
  },
  faq: {
    path: '/faq',
    copy: {
      zh: ['AI API 使用常见问题', '了解 API-Route 的 OpenAI 兼容 API、Base URL 配置、模型调用、套餐兑换、客户端接入和中转站搭建问题。'],
      en: ['AI API FAQ', 'Learn how API-Route handles OpenAI-compatible API access, Base URL setup, model usage, plans, redeem codes, client integrations, and relay site setup.'],
      ja: ['AI API よくある質問', 'API-Route の OpenAI 互換 API、Base URL 設定、モデル利用、プラン、コード、クライアント連携、中継サイト構築について確認できます。'],
      ko: ['AI API 자주 묻는 질문', 'API-Route의 OpenAI 호환 API, Base URL 설정, 모델 사용, 플랜, 리딤 코드, 클라이언트 연동, 릴레이 사이트 구축을 확인하세요.'],
    },
  },
};

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const localizedPath = (path, language) => {
  const prefix = languages[language].prefix;
  if (!prefix) return path;
  return path === '/' ? `${prefix}/` : `${prefix}${path}`;
};

const replaceMeta = (html, language, page) => {
  const [title, description] = page.copy[language];
  const pageTitle = `${title} | API-Route`;
  const canonicalPath = localizedPath(page.path, language);
  const canonicalUrl = `${SITE_URL}${canonicalPath}`;
  const alternates = Object.entries(languages)
    .map(([code, config]) => `    <link rel="alternate" hreflang="${config.hrefLang}" href="${SITE_URL}${localizedPath(page.path, code)}" />`)
    .concat(`    <link rel="alternate" hreflang="x-default" href="${SITE_URL}${page.path}" />`)
    .join('\n');
  const snapshot = `<main data-seo-prerendered="true"><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p><nav><a href="${SITE_URL}/pricing">Pricing</a> <a href="${SITE_URL}/packages">Packages</a> <a href="${SITE_URL}/apps">Apps</a> <a href="${SITE_URL}/faq">FAQ</a></nav></main>`;
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: 'API-Route',
        url: `${SITE_URL}/`,
      },
      {
        '@type': 'WebPage',
        '@id': `${canonicalUrl}#webpage`,
        url: canonicalUrl,
        name: pageTitle,
        description,
        inLanguage: languages[language].htmlLang,
      },
    ],
  };

  return html
    .replace(/<html lang="[^"]*">/, `<html lang="${languages[language].htmlLang}">`)
    .replace(/<title>.*?<\/title>/s, `<title>${escapeHtml(pageTitle)}</title>`)
    .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${escapeHtml(description)}" />`)
    .replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${canonicalUrl}" />`)
    .replace(/(?:\s*<link rel="alternate" hreflang="[^"]*" href="[^"]*" \/>){5}/, `\n${alternates}`)
    .replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${escapeHtml(pageTitle)}" />`)
    .replace(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${escapeHtml(description)}" />`)
    .replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${canonicalUrl}" />`)
    .replace(/<meta property="og:locale" content="[^"]*" \/>/, `<meta property="og:locale" content="${languages[language].locale}" />`)
    .replace(/<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${escapeHtml(pageTitle)}" />`)
    .replace(/<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${escapeHtml(description)}" />`)
    .replace(/<script id="seo-structured-data" type="application\/ld\+json">.*?<\/script>/s, `<script id="seo-structured-data" type="application/ld+json">${JSON.stringify(structuredData).replaceAll('<', '\\u003c')}</script>`)
    .replace('<div id="root"></div>', `<div id="root">${snapshot}</div>`);
};

const template = await readFile(TEMPLATE_PATH, 'utf8');

for (const [language] of Object.entries(languages)) {
  for (const page of Object.values(pages)) {
    const route = localizedPath(page.path, language);
    const outputPath = route === '/'
      ? new URL('index.html', DIST_DIR)
      : route.endsWith('/')
        ? new URL(`.${route}index.html`, DIST_DIR)
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
