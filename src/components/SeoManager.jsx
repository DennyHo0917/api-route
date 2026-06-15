import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useSite } from '../context/SiteContext';
import { DIST_SITE_LANGUAGES, getLocalizedPath, normalizeAppLanguage } from '../i18n/languageUtils';

const DEFAULT_SITE_URL = 'https://api-route.com';
const INDEXABLE_PATHS = new Set(['/', '/pricing', '/packages', '/apps', '/sub-site', '/faq']);
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
    subSite: {
      title: 'AI API 中转站搭建',
      description: '开通可独立访问、支持收款、定价和推广的 AI API 中转站，并在支付后自动启用管理权限。',
    },
    faq: {
      title: 'AI API 使用常见问题',
      description: '了解 API-Route 的 OpenAI 兼容 API、Base URL 配置、模型调用、套餐兑换、加密货币支付、客户端接入和中转站搭建问题。',
      questions: [
        ['API-Route 是否兼容 OpenAI API？', '是。常见的 OpenAI-compatible 客户端通常只需要配置本站提供的 Base URL 和你创建的 API Key。'],
        ['在哪里查看 API 调用地址？', '首页会展示可用 API 端点，登录后也可以在 API 密钥页面创建密钥并复制到客户端使用。'],
        ['套餐和兑换码怎么使用？', '购买套餐兑换码后，在账号内输入兑换码即可自动激活对应套餐。'],
        ['如何在 VSCode 中使用 gpt5.5？', '推荐使用 cc switch：模型选择 gpt5.5，工具选择 cursor，导入目标选择 codex，然后导入到 VSCode/Codex 配置中使用。'],
        ['如何给 Codex app 配置 API-Route？', '创建 API Key 后，可用 cc switch 选择模型并把导入目标设为 codex，一键写入 Base URL、模型和密钥配置。'],
        ['Claude Code 如何配置 API-Route？', '在 Claude Code 中配置 API-Route 的 Base URL、API Key 和模型名称，也可以通过 cc switch 生成并导入配置。'],
        ['支持加密货币支付吗？', '如果站点开启了加密货币支付，相关订单页面会展示网络、代币、地址和支付金额。'],
      ],
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
    subSite: {
      title: 'AI API Relay Site Setup',
      description: 'Launch an independent AI API relay site with payments, pricing, promotion, and automatic management access after payment.',
    },
    faq: {
      title: 'AI API FAQ',
      description: 'Learn how API-Route handles OpenAI-compatible API access, Base URL setup, model usage, plans, redeem codes, crypto payments, client integrations, and relay site setup.',
      questions: [
        ['Is API-Route compatible with the OpenAI API?', 'Yes. Most OpenAI-compatible clients only need this site’s Base URL and the API key you create in the dashboard.'],
        ['Where do I find the API endpoint?', 'The homepage shows available API endpoints, and signed-in users can create API keys from the API Keys page.'],
        ['How do plans and redeem codes work?', 'Purchase a matching redeem code, sign in, enter the code, and the system activates the plan automatically.'],
        ['How do I use gpt5.5 in VSCode?', 'Use cc switch: select gpt5.5 as the model, choose cursor as the tool, set the import target to codex, then import the configuration for VSCode/Codex use.'],
        ['How do I configure API-Route for the Codex app?', 'Create an API key, then use cc switch to choose a model and set the import target to codex so the Base URL, model, and key are written into the configuration.'],
        ['How do I configure Claude Code with API-Route?', 'Configure the API-Route Base URL, API key, and model name in Claude Code, or use cc switch to generate and import the configuration.'],
        ['Do you support crypto payments?', 'If crypto payments are enabled, the order page will show the required network, token, address, and amount.'],
      ],
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
  ja: {
    home: {
      title: '複数モデル対応の AI API プラットフォーム',
      description: 'OpenAI 互換 API から主要 AI モデルへまとめてアクセス。統一された利用量管理、わかりやすい料金、安定したルーティングを提供します。',
    },
    pricing: {
      title: 'AI API モデルと料金',
      description: 'API-Route で利用できるモデル、入力・出力料金、課金方式を比較できます。',
    },
    packages: {
      title: 'AI API プランとコード',
      description: 'プランのクォータ、有効期間、利用シーンを確認し、コードを使ってすぐに有効化できます。',
    },
    apps: {
      title: 'AI アプリとクライアント連携',
      description: '統一 API エンドポイントとキーで接続できる AI アプリやクライアントを確認できます。',
    },
    subSite: {
      title: 'AI API 中継サイト構築',
      description: '訪問・決済・価格設定・販売に対応した独立 AI API 中継サイトを立ち上げ、支払い後に管理権限を自動で有効化します。',
    },
    faq: {
      title: 'AI API よくある質問',
      description: 'API-Route の OpenAI 互換 API、Base URL 設定、モデル利用、プラン、コード、暗号資産決済、クライアント連携、中継サイト構築について確認できます。',
      questions: [
        ['API-Route は OpenAI API と互換性がありますか？', 'はい。多くの OpenAI 互換クライアントでは、このサイトの Base URL と作成した API キーを設定するだけで利用できます。'],
        ['API エンドポイントはどこで確認できますか？', 'トップページに利用可能な API エンドポイントが表示され、ログイン後は API キー画面でキーを作成できます。'],
        ['プランとコードはどのように使いますか？', '対応するコードを購入し、ログイン後に入力すると該当プランが自動で有効化されます。'],
        ['VSCode で gpt5.5 を使うには？', 'cc switch でモデルに gpt5.5、ツールに cursor、取り込み先に codex を選び、VSCode/Codex 用の設定として取り込みます。'],
        ['Codex app に API-Route を設定するには？', 'API キーを作成した後、cc switch でモデルを選び、取り込み先を codex にすると Base URL、モデル、キーを設定できます。'],
        ['Claude Code で API-Route を設定するには？', 'Claude Code に API-Route の Base URL、API キー、モデル名を設定します。cc switch で生成した設定を取り込むこともできます。'],
        ['暗号資産で支払えますか？', '暗号資産決済が有効な場合、注文画面にネットワーク、トークン、アドレス、金額が表示されます。'],
      ],
    },
    private: {
      title: 'アカウント',
      description: 'API-Route アカウント管理エリア。',
    },
    keywords: 'AI API,API 集約,OpenAI 互換 API,LLM API,マルチモデル API,API-Route',
    locale: 'ja_JP',
    language: 'ja',
    serviceType: '複数モデル対応 AI API 集約・ルーティングサービス',
  },
  ko: {
    home: {
      title: '멀티 모델 AI API 플랫폼',
      description: 'OpenAI 호환 API 하나로 주요 AI 모델을 연결하고, 통합 사용량 관리와 투명한 요금, 안정적인 라우팅을 제공합니다.',
    },
    pricing: {
      title: 'AI API 모델 및 요금',
      description: 'API-Route에서 지원하는 모델, 입력·출력 요금, 과금 방식을 비교하세요.',
    },
    packages: {
      title: 'AI API 플랜과 코드',
      description: '플랜 쿼터, 유효 기간, 사용 시나리오를 확인하고 코드를 사용해 바로 활성화할 수 있습니다.',
    },
    apps: {
      title: 'AI 앱 및 클라이언트 연동',
      description: '통합 API 엔드포인트와 키로 연결할 수 있는 AI 앱과 클라이언트를 확인하세요.',
    },
    subSite: {
      title: 'AI API 릴레이 사이트 구축',
      description: '방문, 결제, 가격 설정, 판매를 지원하는 독립 AI API 릴레이 사이트를 만들고 결제 후 관리 권한을 자동으로 활성화합니다.',
    },
    faq: {
      title: 'AI API 자주 묻는 질문',
      description: 'API-Route의 OpenAI 호환 API, Base URL 설정, 모델 사용, 플랜, 리딤 코드, 암호화폐 결제, 클라이언트 연동, 릴레이 사이트 구축을 확인하세요.',
      questions: [
        ['API-Route는 OpenAI API와 호환되나요?', '네. 대부분의 OpenAI 호환 클라이언트에서 이 사이트의 Base URL과 생성한 API 키를 설정하면 사용할 수 있습니다.'],
        ['API 엔드포인트는 어디에서 확인하나요?', '홈페이지에서 사용 가능한 API 엔드포인트를 확인할 수 있고, 로그인 후 API 키 페이지에서 키를 만들 수 있습니다.'],
        ['플랜과 리딤 코드는 어떻게 사용하나요?', '해당 리딤 코드를 구매한 뒤 로그인 상태에서 입력하면 맞는 플랜이 자동으로 활성화됩니다.'],
        ['VSCode에서 gpt5.5를 사용하려면 어떻게 하나요?', 'cc switch에서 모델은 gpt5.5, 도구는 cursor, 가져오기 대상은 codex로 선택한 뒤 VSCode/Codex 설정으로 가져오세요.'],
        ['Codex app에 API-Route를 설정하려면 어떻게 하나요?', 'API 키를 만든 뒤 cc switch에서 모델을 선택하고 가져오기 대상을 codex로 설정하면 Base URL, 모델, 키 구성을 가져올 수 있습니다.'],
        ['Claude Code에서 API-Route를 어떻게 설정하나요?', 'Claude Code에 API-Route Base URL, API 키, 모델명을 설정하거나 cc switch로 생성한 설정을 가져오면 됩니다.'],
        ['암호화폐 결제를 지원하나요?', '암호화폐 결제가 활성화된 경우 주문 화면에 네트워크, 토큰, 주소, 금액이 표시됩니다.'],
      ],
    },
    private: {
      title: '계정',
      description: 'API-Route 계정 관리 영역.',
    },
    keywords: 'AI API,API 집약,OpenAI 호환 API,LLM API,멀티 모델 API,API-Route',
    locale: 'ko_KR',
    language: 'ko',
    serviceType: '멀티 모델 AI API 집약 및 라우팅 서비스',
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

function getPageCopy(pathname, copy) {
  if (pathname === '/') return copy.home;
  if (pathname === '/pricing') return copy.pricing;
  if (pathname === '/packages') return copy.packages;
  if (pathname === '/apps') return copy.apps;
  if (pathname === '/sub-site') return copy.subSite;
  if (pathname === '/faq') return copy.faq;
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
      ...(logoUrl ? { logo: logoUrl } : {}),
    },
    {
      '@type': 'WebSite',
      '@id': websiteId,
      url: languageHomeUrl,
      name: siteName,
      description,
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
      provider: { '@id': organizationId },
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

  useEffect(() => {
    const pathname = normalizePath(location.pathname);
    const languageKey = normalizeAppLanguage(i18n.resolvedLanguage);
    const copy = SEO_COPY[languageKey];
    const page = getPageCopy(pathname, copy);
    const siteName = normalizeSiteName(site?.name);
    const siteUrl = getSiteUrl();
    const canonicalPath = getLocalizedPath(pathname, languageKey);
    const canonicalUrl = `${siteUrl}${canonicalPath}`;
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
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: page.description });
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl });
    upsertMeta('meta[property="og:locale"]', { property: 'og:locale', content: copy.locale });
    syncOgLocaleAlternates(languageKey);

    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: logoUrl ? 'summary_large_image' : 'summary' });
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: pageTitle });
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: page.description });

    if (logoUrl) {
      upsertMeta('meta[property="og:image"]', { property: 'og:image', content: logoUrl });
      upsertMeta('meta[property="og:image:alt"]', { property: 'og:image:alt', content: pageTitle });
      upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: logoUrl });
      upsertMeta('meta[name="twitter:image:alt"]', { name: 'twitter:image:alt', content: pageTitle });
    } else {
      removeMeta('meta[property="og:image"]');
      removeMeta('meta[property="og:image:alt"]');
      removeMeta('meta[name="twitter:image"]');
      removeMeta('meta[name="twitter:image:alt"]');
    }

    upsertLink('canonical', canonicalUrl);
    if (indexable) {
      DIST_SITE_LANGUAGES.forEach(({ code }) => {
        const hrefLang = LANGUAGE_HREFLANGS[code] || code;
        upsertAlternateLink(hrefLang, `${siteUrl}${getLocalizedPath(pathname, code)}`);
      });
      upsertAlternateLink('x-default', `${siteUrl}${getLocalizedPath(pathname, 'zh')}`);
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
      page,
      pageTitle,
      serviceType: copy.serviceType,
      siteName,
      siteUrl,
    });
  }, [i18n.resolvedLanguage, location.pathname, site?.favicon, site?.logo, site?.name]);

  return null;
}
