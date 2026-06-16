import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useSite } from '../context/SiteContext';
import { DIST_SITE_LANGUAGES, getLocalizedPath, normalizeAppLanguage } from '../i18n/languageUtils';
import { FAQ_COPY } from '../content/faqCopy';

const DEFAULT_SITE_URL = 'https://www.api-route.com';
const DEFAULT_LOGO_URL = 'https://img.api-route.com/3.png';
const DEFAULT_OG_IMAGE_PATH = '/og-image.png';
const DEFAULT_OG_IMAGE_WIDTH = '1200';
const DEFAULT_OG_IMAGE_HEIGHT = '630';
const GA_MEASUREMENT_ID = 'G-GZT5KLBKJ8';
const INDEXABLE_PATHS = new Set(['/', '/pricing', '/packages', '/apps', '/sub-site', '/faq']);
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

const SEO_COPY = {
  zh: {
    home: {
      title: '多模型 AI API 聚合与统一调用平台',
      description: '通过一个兼容 OpenAI 格式的 API 接入多种主流大模型，提供统一调用、清晰计费、套餐管理与稳定路由。',
    },
    pricing: {
      title: 'AI API 模型价格与费率',
      description: '比较 API-Route 支持模型的输入价格、输出价格、缓存费用、按次计费和官方参考价，按聊天、代码、长文本、图片或视频场景选择 AI API。',
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
      title: '独立 AI API 平台搭建',
      description: '无需自己找上游、购买 VPS 或部署服务，支付一笔建站费用即可开通可收款、可定价、可推广的独立 AI API 管理平台。',
      questions: [
        ['开通后多久能使用？', '支付确认后系统会自动授予管理权限，并引导你继续完成站点初始化。'],
        ['可以绑定自己的域名吗？', '可以。独立平台适合配置自己的品牌、域名和展示入口。'],
        ['可以自己设置模型价格吗？', '可以。开通后可以按模型、套餐和销售策略配置价格。'],
        ['用户付款后怎么管理？', '订单、充值、余额、套餐和调用记录会进入平台管理流程。'],
        ['还需要自己找上游或买 VPS 吗？', '不需要。上游接入和部署基础已经做好，你只需要支付建站费用并完成初始化配置。'],
        ['我需要自己维护服务器吗？', '不需要从零维护完整平台基础设施，重点放在品牌、价格和用户运营。'],
        ['支付后没有自动开通怎么办？', '使用同一账号刷新状态；如果仍未更新，可以联系站点支持处理。'],
        ['适合没有技术背景的人吗？', '适合有明确用户或渠道的人；技术配置会被尽量收敛到站点初始化和后台管理。'],
      ],
    },
    private: {
      title: '用户中心',
      description: 'API-Route 用户中心。',
    },
    notFound: {
      title: '页面不存在',
      description: '你访问的页面不存在、已被移动或地址有误。',
    },
    keywords: 'AI API,API 聚合,OpenAI 兼容接口,大模型 API,多模型 API,独立 AI API 平台,API-Route',
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
      title: 'AI API Pricing, Model Rates and Token Costs',
      description: 'Compare API-Route model rates for input tokens, output tokens, cache reads, cache creation, per-call pricing, and official reference prices across chat, coding, long-context, image, and video workloads.',
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
      title: 'Branded AI API Platform Setup',
      description: 'Launch a branded AI API platform without finding upstream providers, renting a VPS, or deploying services yourself. Pay one setup fee and launch from a ready-made foundation.',
      questions: [
        ['How soon can I use it?', 'After payment is confirmed, the system grants management access and guides initialization.'],
        ['Can I use my own domain?', 'Yes. The platform is designed for your own brand, domain, and entry point.'],
        ['Can I set model prices myself?', 'Yes. After launch, you can configure model pricing, plans, and sales strategy.'],
        ['How are customer payments managed?', 'Orders, top-ups, balance, plans, and usage records are handled through the platform flow.'],
        ['Do I need to find upstream providers or rent a VPS?', 'No. Upstream connections and deployment are already handled. Pay the setup fee and finish initialization.'],
        ['Do I need to maintain servers?', 'You do not need to rebuild the core platform infrastructure; focus on brand, pricing, and users.'],
        ['What if payment does not activate access?', 'Refresh with the same account. If it still does not update, contact site support.'],
        ['Is it suitable without a technical background?', 'Yes if you have clear users or channels; technical setup is narrowed to initialization and admin settings.'],
      ],
    },
    private: {
      title: 'Account',
      description: 'API-Route account area.',
    },
    notFound: {
      title: 'Page Not Found',
      description: 'The requested page does not exist, has moved, or the address is incorrect.',
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
      description: 'API-Route で利用できるモデルの入力料金、出力料金、キャッシュ料金、回数課金、公式参考価格を比較し、チャット、コード、長文、画像、動画に合う AI API を選べます。',
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
      title: '専用 AI API プラットフォーム構築',
      description: '上流 API プロバイダー探し、VPS の用意、サービスのデプロイを自分で行わず、構築費用だけで決済・価格設定・販売に対応した専用 AI API プラットフォームを開設できます。',
      questions: [
        ['いつ使い始められますか？', '支払い確認後、管理権限が付与され初期化へ進めます。'],
        ['自分のドメインを使えますか？', 'はい。独自ブランド、ドメイン、入口のための機能です。'],
        ['モデル価格を自分で設定できますか？', 'はい。モデル価格、プラン、販売方針を設定できます。'],
        ['顧客の支払いはどう管理されますか？', '注文、チャージ、残高、プラン、利用記録はプラットフォーム内で管理されます。'],
        ['上流 API プロバイダーを探したり VPS を用意したりする必要はありますか？', 'いいえ。上流接続とデプロイ基盤は用意済みです。構築費用を支払い、初期設定を進めるだけです。'],
        ['サーバー保守は必要ですか？', 'コア基盤をゼロから保守する必要はなく、ブランド、価格、ユーザー運営に集中できます。'],
        ['支払い後に開設されない場合は？', '同じアカウントで状態を更新し、それでも反映されなければサポートへ連絡してください。'],
        ['技術に詳しくなくても使えますか？', '明確なユーザーや販売チャネルがあれば使いやすいよう、初期化と管理画面に集約しています。'],
      ],
    },
    private: {
      title: 'アカウント',
      description: 'API-Route アカウント管理エリア。',
    },
    notFound: {
      title: 'ページが見つかりません',
      description: '指定されたページは存在しないか、移動された可能性があります。',
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
      description: 'API-Route에서 지원하는 모델의 입력 요금, 출력 요금, 캐시 요금, 호출당 과금, 공식 참고가를 비교하고 채팅, 코딩, 긴 문서, 이미지, 영상 작업에 맞는 AI API를 선택하세요.',
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
      title: '전용 AI API 플랫폼 구축',
      description: '상위 API 공급처 탐색, VPS 준비, 서비스 배포를 직접 하지 않아도 한 번의 구축 비용으로 결제, 가격 설정, 판매를 지원하는 전용 AI API 플랫폼을 시작할 수 있습니다.',
      questions: [
        ['언제부터 사용할 수 있나요?', '결제 확인 후 관리 권한이 부여되고 초기화로 안내됩니다.'],
        ['내 도메인을 사용할 수 있나요?', '네. 자체 브랜드, 도메인, 진입점을 위한 플랫폼입니다.'],
        ['모델 가격을 직접 설정할 수 있나요?', '네. 모델 가격, 플랜, 판매 전략을 설정할 수 있습니다.'],
        ['고객 결제는 어떻게 관리되나요?', '주문, 충전, 잔액, 플랜, 사용 기록이 플랫폼 흐름에서 관리됩니다.'],
        ['상위 API 공급처를 찾거나 VPS를 준비해야 하나요?', '아니요. 상위 API 연동과 배포 기반은 이미 준비되어 있으며, 구축 비용을 지불하고 초기 설정만 진행하면 됩니다.'],
        ['서버를 직접 유지해야 하나요?', '핵심 플랫폼 인프라를 처음부터 운영할 필요 없이 브랜드, 가격, 사용자 운영에 집중할 수 있습니다.'],
        ['결제 후 권한이 활성화되지 않으면요?', '같은 계정으로 상태를 새로고침하고, 그래도 반영되지 않으면 지원팀에 문의하세요.'],
        ['기술 배경이 없어도 적합한가요?', '명확한 사용자나 채널이 있다면 초기화와 관리 화면 중심으로 운영할 수 있습니다.'],
      ],
    },
    private: {
      title: '계정',
      description: 'API-Route 계정 관리 영역.',
    },
    notFound: {
      title: '페이지를 찾을 수 없습니다',
      description: '요청한 페이지가 없거나 이동되었거나 주소가 잘못되었습니다.',
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
  if (pathname === '/sub-site') return copy.subSite;
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
    const pageTitle = `${page.title} | ${siteName}`;
    const logoSource = site?.logo || site?.favicon || DEFAULT_LOGO_URL;
    const logoUrl = resolveUrl(logoSource, siteUrl);
    const ogImageUrl = resolveUrl(DEFAULT_OG_IMAGE_PATH, siteUrl);
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

    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: ogImageUrl ? 'summary_large_image' : 'summary' });
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: pageTitle });
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: page.description });

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

    const trackedUrl = `${location.pathname}${location.search}`;
    if (lastTrackedUrlRef.current !== trackedUrl) {
      lastTrackedUrlRef.current = trackedUrl;
      trackPageView(pageTitle);
    }
  }, [i18n.resolvedLanguage, location.pathname, location.search, site?.favicon, site?.logo, site?.name]);

  return null;
}
