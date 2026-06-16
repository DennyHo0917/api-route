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
      zh: ['独立 AI API 平台搭建', '无需自己找上游、购买 VPS 或部署服务，支付一笔建站费用即可开通可收款、可定价、可推广的独立 AI API 管理平台。'],
      en: ['Branded AI API Platform Setup', 'Launch a branded AI API platform without finding upstream providers, renting a VPS, or deploying services yourself. Pay one setup fee and launch from a ready-made foundation.'],
      ja: ['専用 AI API プラットフォーム構築', '上流 API プロバイダー探し、VPS の用意、サービスのデプロイを自分で行わず、構築費用だけで決済・価格設定・販売に対応した専用 AI API プラットフォームを開設できます。'],
      ko: ['전용 AI API 플랫폼 구축', '상위 API 공급처 탐색, VPS 준비, 서비스 배포를 직접 하지 않아도 한 번의 구축 비용으로 결제, 가격 설정, 판매를 지원하는 전용 AI API 플랫폼을 시작할 수 있습니다.'],
    },
    sections: {
      zh: [
        ['谁适合开通', ['AI 工具社群运营者', '开发者和 SaaS 团队', '模型渠道和 API 代理', '想做 AI API 副业的人']],
        ['怎么赚钱', ['设置模型售价差价', '售卖套餐和兑换码', '充值余额持续复购', '推广入口承接新用户']],
        ['开通后得到什么', ['独立访问入口和品牌展示', '上游模型接入与部署基础', '模型销售、售价和套餐管理', '充值、兑换码与支付流程', 'API Key、余额、调用日志和用户管理']],
      ],
      en: [
        ['Who it fits', ['AI tool community operators', 'Developers and SaaS teams', 'Model channels and API resellers', 'AI API side-project builders']],
        ['How it makes money', ['Set model price margins', 'Sell plans and redeem codes', 'Drive repeat top-ups', 'Promote a branded entry point']],
        ['What you get', ['Independent entry point and branded presentation', 'Upstream model access and deployment foundation', 'Model sales, pricing, and plan management', 'Top-ups, redeem codes, and payment flows', 'API keys, balance, usage logs, and user management']],
      ],
      ja: [
        ['誰に向いているか', ['AI ツールコミュニティ運営者', '開発者・SaaS チーム', 'モデルチャネル・API 代理運営者', 'AI API 副業を検証したい人']],
        ['収益化の方法', ['モデル価格の差益', 'プランとコード販売', '残高チャージで継続利用', 'ブランド入口で集客']],
        ['開設後に得られるもの', ['独立した入口とブランド表示', '上流モデル接続とデプロイ基盤', 'モデル販売、価格、プラン管理', '残高チャージ、コード、決済フロー', 'API キー、残高、利用ログ、ユーザー管理']],
      ],
      ko: [
        ['누구에게 적합한가', ['AI 도구 커뮤니티 운영자', '개발자와 SaaS 팀', '모델 채널과 API 리셀러', 'AI API 부업 준비자']],
        ['수익을 만드는 방식', ['모델 가격 마진 설정', '플랜과 리딤 코드 판매', '지속적인 충전 유도', '브랜드 진입점 홍보']],
        ['구축 후 제공되는 것', ['독립 진입점과 브랜드 표시', '상위 모델 연동과 배포 기반', '모델 판매, 가격, 플랜 관리', '충전, 리딤 코드, 결제 흐름', 'API 키, 잔액, 사용 로그, 사용자 관리']],
      ],
    },
    questions: {
      zh: [
        ['开通后多久能使用？', '支付确认后系统会自动授予管理权限，并引导你继续完成站点初始化。'],
        ['可以绑定自己的域名吗？', '可以。独立平台适合配置自己的品牌、域名和展示入口。'],
        ['可以自己设置模型价格吗？', '可以。开通后可以按模型、套餐和销售策略配置价格。'],
        ['还需要自己找上游或买 VPS 吗？', '不需要。上游接入和部署基础已经做好，你只需要支付建站费用并完成初始化配置。'],
        ['我需要自己维护服务器吗？', '不需要从零维护完整平台基础设施，重点放在品牌、价格和用户运营。'],
      ],
      en: [
        ['How soon can I use it?', 'After payment is confirmed, the system grants management access and guides initialization.'],
        ['Can I use my own domain?', 'Yes. The platform is designed for your own brand, domain, and entry point.'],
        ['Can I set model prices myself?', 'Yes. After launch, you can configure model pricing, plans, and sales strategy.'],
        ['Do I need to find upstream providers or rent a VPS?', 'No. Upstream connections and deployment are already handled. Pay the setup fee and finish initialization.'],
        ['Do I need to maintain servers?', 'You do not need to rebuild the core platform infrastructure; focus on brand, pricing, and users.'],
      ],
      ja: [
        ['いつ使い始められますか？', '支払い確認後、管理権限が付与され初期化へ進めます。'],
        ['自分のドメインを使えますか？', 'はい。独自ブランド、ドメイン、入口のための機能です。'],
        ['モデル価格を自分で設定できますか？', 'はい。モデル価格、プラン、販売方針を設定できます。'],
        ['上流 API プロバイダーを探したり VPS を用意したりする必要はありますか？', 'いいえ。上流接続とデプロイ基盤は用意済みです。構築費用を支払い、初期設定を進めるだけです。'],
        ['サーバー保守は必要ですか？', 'コア基盤をゼロから保守する必要はなく、ブランド、価格、ユーザー運営に集中できます。'],
      ],
      ko: [
        ['언제부터 사용할 수 있나요?', '결제 확인 후 관리 권한이 부여되고 초기화로 안내됩니다.'],
        ['내 도메인을 사용할 수 있나요?', '네. 자체 브랜드, 도메인, 진입점을 위한 플랫폼입니다.'],
        ['모델 가격을 직접 설정할 수 있나요?', '네. 모델 가격, 플랜, 판매 전략을 설정할 수 있습니다.'],
        ['상위 API 공급처를 찾거나 VPS를 준비해야 하나요?', '아니요. 상위 API 연동과 배포 기반은 이미 준비되어 있으며, 구축 비용을 지불하고 초기 설정만 진행하면 됩니다.'],
        ['서버를 직접 유지해야 하나요?', '핵심 플랫폼 인프라를 처음부터 운영할 필요 없이 브랜드, 가격, 사용자 운영에 집중할 수 있습니다.'],
      ],
    },
  },
  faq: {
    path: '/faq',
    copy: {
      zh: ['AI API 使用常见问题', '了解 API-Route 的 OpenAI 兼容 API、Base URL 配置、模型调用、套餐兑换、加密货币支付、客户端接入和独立平台问题。'],
      en: ['AI API FAQ', 'Learn how API-Route handles OpenAI-compatible API access, Base URL setup, model usage, plans, redeem codes, crypto payments, client integrations, and branded platform setup.'],
      ja: ['AI API よくある質問', 'API-Route の OpenAI 互換 API、Base URL 設定、モデル利用、プラン、コード、暗号資産決済、クライアント連携、専用 AI API プラットフォームについて確認できます。'],
      ko: ['AI API 자주 묻는 질문', 'API-Route의 OpenAI 호환 API, Base URL 설정, 모델 사용, 플랜, 리딤 코드, 암호화폐 결제, 클라이언트 연동, 전용 AI API 플랫폼을 확인하세요.'],
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

const renderSnapshotDetails = (page, language) => {
  const sections = page.sections?.[language] || [];
  const questions = page.questions?.[language] || [];
  const sectionHtml = sections
    .map(([heading, items]) => `<section><h2>${escapeHtml(heading)}</h2><ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></section>`)
    .join('');
  const faqHtml = questions.length
    ? `<section><h2>FAQ</h2>${questions.map(([question, answer]) => `<article><h3>${escapeHtml(question)}</h3><p>${escapeHtml(answer)}</p></article>`).join('')}</section>`
    : '';
  return `${sectionHtml}${faqHtml}`;
};

const replaceMeta = (html, language, page) => {
  const [title, description] = page.copy[language];
  const pageTitle = `${title} | API-Route`;
  const canonicalPath = localizedPath(page.path, language);
  const canonicalUrl = `${SITE_URL}${canonicalPath}`;
  const questions = page.questions?.[language] || [];
  const alternates = Object.entries(languages)
    .map(([code, config]) => `    <link rel="alternate" hreflang="${config.hrefLang}" href="${SITE_URL}${localizedPath(page.path, code)}" />`)
    .concat(`    <link rel="alternate" hreflang="x-default" href="${SITE_URL}${page.path}" />`)
    .join('\n');
  const snapshot = `<main data-seo-prerendered="true"><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p>${renderSnapshotDetails(page, language)}<nav><a href="${SITE_URL}/pricing">Pricing</a> <a href="${SITE_URL}/packages">Packages</a> <a href="${SITE_URL}/apps">Apps</a> <a href="${SITE_URL}/faq">FAQ</a></nav></main>`;
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
