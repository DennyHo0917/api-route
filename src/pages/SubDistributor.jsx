import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  ArrowRight,
  Braces,
  CheckCircle2,
  KeyRound,
  Layers3,
  ShieldCheck,
  Sparkles,
  Tags,
  TicketCheck,
  WalletCards,
  Zap,
} from 'lucide-react';
import { createSubDistributorOrder, getSubDistributorInfo } from '../api';
import { useAuth } from '../context/AuthContext';
import { useSite, useCurrency } from '../context/SiteContext';
import { getLocalizedPath, normalizeAppLanguage } from '../i18n/languageUtils';

function normalizeHost(value) {
  if (!value) return '';
  return String(value).replace(/^https?:\/\//, '').replace(/\/+$/, '');
}

function getPaymentMethodLabel(method, t) {
  if (!method) return '';
  const type = String(method.type || '').toLowerCase();
  if (type === 'crypto') return t('subDist.paymentCrypto');
  if (type === 'stripe') return 'Stripe';
  if (type === 'creem') return 'Creem';
  return method.name || method.type;
}

function submitEpayForm(resData) {
  const params = resData.data;
  const url = resData.url;
  if (!params || !url) return false;
  const form = document.createElement('form');
  form.action = url;
  form.method = 'POST';
  const isSafari = navigator.userAgent.indexOf('Safari') > -1 && navigator.userAgent.indexOf('Chrome') < 1;
  if (!isSafari) {
    form.target = '_blank';
  }
  Object.keys(params).forEach((key) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = params[key];
    form.appendChild(input);
  });
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
  return true;
}

const AUDIENCE_ICONS = [Sparkles, Braces, Layers3, ShieldCheck];
const REVENUE_ICONS = [Tags, TicketCheck, WalletCards, Sparkles, Layers3];
const INCLUDED_ICONS = [ShieldCheck, Sparkles, KeyRound, Tags, TicketCheck, WalletCards, Layers3];

const MARKETING_COPY = {
  zh: {
    eyebrow: '独立 AI API 平台',
    heroTitle: '开通自己的 AI API 平台，销售模型、套餐和充值服务',
    heroDesc: '上游模型接入、VPS 部署、支付和管理后台都已经准备好。你只需要支付一笔建站费用，就能快速拥有一个可独立访问、可收款、可定价、可推广的 AI API 管理平台。',
    primaryCta: '开通我的 AI API 平台',
    secondaryCta: '先看适合谁',
    proof: ['独立品牌入口', 'OpenAI 兼容 API', '支付后自动开通'],
    audienceTitle: '谁适合开通',
    audienceDesc: '适合已经有用户、社群、客户或模型渠道，希望把 AI API 能力包装成自己服务的人。',
    audience: [
      ['AI 工具社群运营者', '给社群成员提供统一 API、套餐和客户端接入，降低反复答疑和手动开通成本。'],
      ['开发者和 SaaS 团队', '为内部工具、客户项目或自动化流程提供统一模型入口，并用清晰价格控制成本。'],
      ['模型渠道和 API 代理', '把多模型能力做成自己的品牌站，配置售价、套餐、充值方式和推广入口。'],
      ['想做 AI API 副业的人', '不用从零开发用户、支付、计费和日志系统，先验证市场和复购。'],
    ],
    revenueTitle: '怎么赚钱',
    revenueDesc: '页面不只卖一个后台账号，而是把“可销售的 AI API 服务”直接交给你运营。',
    revenue: [
      ['设置模型售价差价', '按模型、渠道或套餐设置售价，用清晰费率覆盖成本并保留利润空间。'],
      ['售卖套餐和兑换码', '按天、周、月或额度售卖，适合社群、团队和短期高频用户。'],
      ['充值余额持续复购', '用户通过余额调用 API，适合长期使用和多模型混合消耗。'],
      ['推广入口承接新用户', '把入口放到社群、教程、工具文档或客户项目里，形成持续转化。'],
      ['面向团队提供统一入口', '给团队或客户一个统一 Base URL 和密钥体系，减少迁移和管理成本。'],
    ],
    savingsTitle: '比自己开发省什么',
    savingsDesc: '自己建站通常要找上游、买 VPS、部署服务、接支付、做账号和日志。这里把这些基础能力打包好，你不用把精力耗在底层搭建上。',
    comparisonHeaders: ['能力', '自己开发', 'API-Route 开通'],
    comparison: [
      ['用户与登录', '设计账号、权限和安全逻辑', '开通后直接使用现成账号体系'],
      ['上游与部署', '自己找上游、买 VPS、部署并维护服务', '上游接入和部署基础已做好，支付建站费后进入初始化'],
      ['支付与订单', '接入支付、回调、异常处理', '使用已有支付流程和订单状态'],
      ['模型价格管理', '维护模型、渠道和计费规则', '在后台配置模型售价和套餐'],
      ['API Key 与日志', '开发密钥、额度、日志和查询', '内置密钥管理、余额和调用记录'],
      ['上线时间', '数周到数月', '支付后进入初始化流程'],
    ],
    includedTitle: '开通后得到什么',
    included: [
      '独立访问入口和品牌展示',
      '上游模型接入与部署基础',
      '站点名称、Logo、主题和域名配置',
      '用户注册登录与账号管理',
      '模型销售、售价和套餐管理',
      '充值、兑换码与支付流程',
      'API Key、余额、调用日志和用户管理',
      '支付完成后自动启用管理权限',
    ],
    flowTitle: '开通流程',
    flow: [
      ['填写平台名称和标识', '确认你的品牌名称、slug 和当前支付账号。'],
      ['选择支付方式并付款', '支持站点开启的支付渠道，包含加密货币时会展示链和代币。'],
      ['自动获得管理权限', '支付完成后使用同一账号进入初始化和管理流程。'],
    ],
    faqTitle: '开通前常见问题',
    faq: [
      ['开通后多久能使用？', '支付确认后系统会自动授予管理权限，并引导你继续完成站点初始化。'],
      ['可以绑定自己的域名吗？', '可以。独立平台适合配置自己的品牌、域名和展示入口。'],
      ['可以自己设置模型价格吗？', '可以。开通后可以按模型、套餐和销售策略配置价格。'],
      ['用户付款后怎么管理？', '订单、充值、余额、套餐和调用记录会进入平台管理流程。'],
      ['还需要自己找上游或买 VPS 吗？', '不需要。上游接入和部署基础已经做好，你只需要支付建站费用并完成初始化配置。'],
      ['我需要自己维护服务器吗？', '不需要从零维护完整平台基础设施，重点放在品牌、价格和用户运营。'],
      ['支付后没有自动开通怎么办？', '使用同一账号刷新状态；如果仍未更新，可以联系站点支持处理。'],
      ['适合没有技术背景的人吗？', '适合有明确用户或渠道的人；技术配置会被尽量收敛到站点初始化和后台管理。'],
    ],
    panelTitle: '开通你的平台',
    panelDesc: '填写名称和标识，支付一笔建站费用后自动获得管理权限。',
  },
  en: {
    eyebrow: 'White-label AI API Platform',
    heroTitle: 'Launch a white-label AI API platform and sell AI API access',
    heroDesc: 'Upstream model access, VPS hosting, payments, and admin basics are already handled. Pay one setup fee to launch a white-label AI API platform with its own entry point, pricing, promotion, and payments, so you can sell AI API access under your own brand.',
    primaryCta: 'Launch My White-label Platform',
    secondaryCta: 'See Who It Fits',
    proof: ['White-label brand', 'OpenAI-compatible API', 'Built for AI API resellers'],
    audienceTitle: 'Who It Fits',
    audienceDesc: 'Built for AI API resellers, communities, SaaS teams, and model channels that already have users and want to package AI API access as their own service.',
    audience: [
      ['AI tool community operators', 'Offer one API, plans, and client setup to members while reducing manual onboarding.'],
      ['Developers and SaaS teams', 'Give internal tools, customer projects, and automation workflows one model endpoint with clear pricing.'],
      ['AI API resellers and model channels', 'Turn multi-model access into a white-label platform where you can sell AI API access with pricing, packages, payments, and promotion.'],
      ['AI API side-project builders', 'Validate demand without rebuilding accounts, payments, billing, logs, and model routing from scratch.'],
    ],
    revenueTitle: 'How It Makes Money',
    revenueDesc: 'This is not just an admin account. It gives you a sellable AI API service that can run under your own brand.',
    revenue: [
      ['Set model price margins', 'Configure prices by model, channel, or plan so usage can cover cost and leave margin.'],
      ['Sell AI API access', 'Package model access into day, week, month, or quota-based plans, redeem codes, and balance top-ups.'],
      ['Drive repeat top-ups', 'Users consume balance through API calls, which fits ongoing multi-model usage.'],
      ['Promote a branded entry point', 'Place the link in communities, tutorials, docs, and customer projects to keep converting users.'],
      ['Serve teams with one endpoint', 'Give teams or clients one Base URL and key system instead of scattered provider accounts.'],
    ],
    savingsTitle: 'What White-label Setup Saves',
    savingsDesc: 'Building this yourself usually means finding upstream providers, renting VPS hosting, deploying services, integrating payments, and maintaining accounts and logs. This setup packages that foundation.',
    comparisonHeaders: ['Capability', 'Build Yourself', 'API-Route Setup'],
    comparison: [
      ['Users and login', 'Design accounts, permissions, and security', 'Use an existing account system after setup'],
      ['Upstream and deployment', 'Find upstream providers, rent VPS hosting, deploy and maintain services', 'Upstream connections and deployment are ready after the setup fee'],
      ['Payments and orders', 'Integrate payments, callbacks, and edge cases', 'Use existing payment and order flows'],
      ['Model pricing', 'Maintain models, channels, and billing rules', 'Configure model prices and plans in admin'],
      ['API keys and logs', 'Build keys, quota, logs, and search', 'Use built-in keys, balance, and usage records'],
      ['Time to launch', 'Weeks to months', 'Enter initialization after payment'],
    ],
    includedTitle: 'What You Get',
    included: [
      'White-label entry point and branded presentation',
      'Upstream model connections and deployment foundation',
      'Site name, logo, theme, and domain configuration',
      'User registration, login, and account management',
      'Model sales, pricing, and plan management',
      'Top-ups, redeem codes, and payment flows',
      'API keys, balance, usage logs, and user management',
      'Automatic management access after payment',
    ],
    flowTitle: 'Setup Flow',
    flow: [
      ['Name the platform', 'Confirm the brand name, slug, and current payment account.'],
      ['Choose payment and pay', 'Use the enabled payment method; crypto orders show network and token details.'],
      ['Get management access', 'After payment, continue initialization with the same account.'],
    ],
    faqTitle: 'Questions Before Launch',
    faq: [
      ['How soon can I use it?', 'After payment is confirmed, the system grants management access and guides initialization.'],
      ['Can I use my own domain?', 'Yes. The platform is designed for your own brand, domain, and entry point.'],
      ['Can I use it as an AI API reseller platform?', 'Yes. It is designed for white-label AI API resellers who want to set prices, sell AI API access, and keep users on a branded entry point.'],
      ['Can I set model prices myself?', 'Yes. After launch, you can configure model pricing, plans, and sales strategy.'],
      ['How are customer payments managed?', 'Orders, top-ups, balance, plans, and usage records are handled through the platform flow.'],
      ['Do I need to find upstream providers or rent a VPS?', 'No. Upstream connections and deployment are already handled. Pay the setup fee and finish initialization.'],
      ['Do I need to maintain servers?', 'You do not need to rebuild the core platform infrastructure; focus on brand, pricing, and users.'],
      ['What if payment does not activate access?', 'Refresh with the same account. If it still does not update, contact site support.'],
      ['Is it suitable without a technical background?', 'Yes if you have clear users or channels; technical setup is narrowed to initialization and admin settings.'],
    ],
    panelTitle: 'Launch Your Platform',
    panelDesc: 'Fill in the name and slug. Pay one setup fee and management access is enabled automatically.',
  },
  ja: {
    eyebrow: '専用 AI API プラットフォーム',
    heroTitle: '自分の AI API プラットフォームを立ち上げ、モデル・プラン・残高チャージを販売',
    heroDesc: '上流モデル接続、VPS 環境、サービスのデプロイ、決済、管理基盤はすでに用意されています。構築費用を一度支払うだけで、独自の入口、価格設定、販売導線を備えた AI API 管理プラットフォームを立ち上げられます。',
    primaryCta: 'AI API プラットフォームを開設',
    secondaryCta: '対象ユーザーを見る',
    proof: ['独自ブランド入口', 'OpenAI 互換 API', '支払い後に自動付与'],
    audienceTitle: '誰に向いているか',
    audienceDesc: 'ユーザー、コミュニティ、顧客、モデル供給を持ち、AI API アクセスを自分のサービスとして提供したい方向けです。',
    audience: [
      ['AI ツールコミュニティ運営者', 'メンバー向けに API、プラン、クライアント設定をまとめて提供できます。'],
      ['開発者・SaaS チーム', '社内ツール、顧客案件、自動化に統一モデル入口と明確な価格を提供します。'],
      ['モデルチャネル・API 代理運営者', '複数モデルのアクセスを自分のブランド、価格、決済、販売導線で展開できます。'],
      ['AI API 副業を検証したい人', 'アカウント、決済、課金、ログをゼロから作らず需要を検証できます。'],
    ],
    revenueTitle: '収益化の方法',
    revenueDesc: '単なる管理アカウントではなく、販売できる AI API サービスとして運営できます。',
    revenue: [
      ['モデル価格の差益', 'モデルやチャネルごとに販売価格を設定し、原価と利益を管理します。'],
      ['プランとコード販売', '日、週、月、容量単位で販売でき、コミュニティやチーム利用に向いています。'],
      ['残高チャージで継続利用', 'ユーザーは残高で API を呼び出し、継続利用と複数モデル消費につながります。'],
      ['ブランド入口で集客', 'コミュニティ、チュートリアル、ドキュメント、顧客案件から導線を作れます。'],
      ['チーム向け統一入口', 'チームや顧客に Base URL とキー体系をまとめて提供できます。'],
    ],
    savingsTitle: '自作と比べて省けること',
    savingsDesc: '自作では上流 API プロバイダー探し、VPS の用意、サービスのデプロイ、決済、アカウント、ログ管理が大きな負担になります。ここではその基盤をまとめて提供します。',
    comparisonHeaders: ['機能', '自作する場合', 'API-Route で開設'],
    comparison: [
      ['ユーザーとログイン', 'アカウント、権限、安全性を設計', '既存のアカウント体系を利用'],
      ['上流とデプロイ', '上流 API プロバイダーを探し、VPS を用意し、サービスをデプロイ・保守', '上流接続とデプロイ基盤は準備済み'],
      ['決済と注文', '決済、コールバック、例外処理を実装', '既存の決済・注文フローを利用'],
      ['モデル価格管理', 'モデル、チャネル、課金ルールを保守', '管理画面で価格とプランを設定'],
      ['API キーとログ', 'キー、容量、ログ、検索を開発', 'キー、残高、利用記録を内蔵'],
      ['立ち上げ時間', '数週間から数か月', '支払い後に初期化へ進む'],
    ],
    includedTitle: '開設後に得られるもの',
    included: [
      '独立した入口とブランド表示',
      '上流モデル接続とデプロイ基盤',
      'サイト名、ロゴ、テーマ、ドメイン設定',
      'ユーザー登録、ログイン、アカウント管理',
      'モデル販売、価格、プラン管理',
      '残高チャージ、コード、決済フロー',
      'API キー、残高、利用ログ、ユーザー管理',
      '支払い後の管理権限自動付与',
    ],
    flowTitle: '開設フロー',
    flow: [
      ['名称と識別子を入力', 'ブランド名、slug、支払いアカウントを確認します。'],
      ['支払い方法を選択', '有効な決済方法を使い、暗号資産の場合はネットワークとトークンを確認します。'],
      ['管理権限を取得', '支払い後、同じアカウントで初期化と管理へ進みます。'],
    ],
    faqTitle: '開設前のよくある質問',
    faq: [
      ['いつ使い始められますか？', '支払い確認後、管理権限が付与され初期化へ進めます。'],
      ['自分のドメインを使えますか？', 'はい。独自ブランド、ドメイン、入口のための機能です。'],
      ['モデル価格を自分で設定できますか？', 'はい。モデル価格、プラン、販売方針を設定できます。'],
      ['顧客の支払いはどう管理されますか？', '注文、チャージ、残高、プラン、利用記録はプラットフォーム内で管理されます。'],
      ['上流 API プロバイダーを探したり VPS を用意したりする必要はありますか？', 'いいえ。上流接続とデプロイ基盤は用意済みです。構築費用を支払い、初期設定を進めるだけです。'],
      ['サーバー保守は必要ですか？', 'コア基盤をゼロから保守する必要はなく、ブランド、価格、ユーザー運営に集中できます。'],
      ['支払い後に開設されない場合は？', '同じアカウントで状態を更新し、それでも反映されなければサポートへ連絡してください。'],
      ['技術に詳しくなくても使えますか？', '明確なユーザーや販売チャネルがあれば使いやすいよう、初期化と管理画面に集約しています。'],
    ],
    panelTitle: 'プラットフォームを開設',
    panelDesc: '名称と slug を入力し、構築費用を支払うと管理権限が自動で有効になります。',
  },
  ko: {
    eyebrow: '전용 AI API 플랫폼',
    heroTitle: '나만의 AI API 플랫폼을 구축하고 모델, 플랜, 잔액 충전을 판매하세요',
    heroDesc: '상위 모델 연동, VPS 환경, 서비스 배포, 결제, 관리 기반은 이미 준비되어 있습니다. 한 번의 구축 비용만 지불하면 독립 진입점, 가격 설정, 홍보, 결제를 갖춘 AI API 관리 플랫폼을 시작할 수 있습니다.',
    primaryCta: '내 AI API 플랫폼 구축하기',
    secondaryCta: '대상 확인하기',
    proof: ['브랜드 진입점', 'OpenAI 호환 API', '결제 후 자동 권한'],
    audienceTitle: '누구에게 적합한가',
    audienceDesc: '사용자, 커뮤니티, 고객, 모델 공급을 가지고 AI API 접근을 자신의 서비스로 제공하려는 사람에게 적합합니다.',
    audience: [
      ['AI 도구 커뮤니티 운영자', '회원에게 API, 플랜, 클라이언트 설정을 한 번에 제공하고 수동 안내를 줄입니다.'],
      ['개발자와 SaaS 팀', '내부 도구, 고객 프로젝트, 자동화에 하나의 모델 엔드포인트와 명확한 가격을 제공합니다.'],
      ['모델 채널과 API 리셀러', '멀티 모델 접근을 자신의 브랜드, 가격, 결제, 홍보 동선으로 운영합니다.'],
      ['AI API 부업 준비자', '계정, 결제, 과금, 로그를 처음부터 만들지 않고 수요를 검증합니다.'],
    ],
    revenueTitle: '수익을 만드는 방식',
    revenueDesc: '단순한 관리자 계정이 아니라 판매 가능한 AI API 서비스를 운영하는 형태입니다.',
    revenue: [
      ['모델 가격 마진 설정', '모델이나 채널별 판매가를 설정해 비용을 덮고 마진을 남깁니다.'],
      ['플랜과 리딤 코드 판매', '일, 주, 월, 용량 기준 판매가 가능해 커뮤니티와 팀에 적합합니다.'],
      ['지속적인 충전 유도', '사용자는 잔액으로 API를 호출하고 멀티 모델 사용이 반복됩니다.'],
      ['브랜드 진입점 홍보', '커뮤니티, 튜토리얼, 문서, 고객 프로젝트에 링크를 배치해 전환을 만듭니다.'],
      ['팀용 통합 엔드포인트 제공', '팀이나 고객에게 하나의 Base URL과 키 체계를 제공합니다.'],
    ],
    savingsTitle: '직접 개발 대비 줄어드는 일',
    savingsDesc: '직접 만들면 상위 API 공급처를 찾고, VPS를 준비하고, 서비스를 배포하며, 결제와 계정 및 로그를 운영해야 합니다. 여기서는 그 기반을 패키지로 제공합니다.',
    comparisonHeaders: ['기능', '직접 개발', 'API-Route 구축'],
    comparison: [
      ['사용자와 로그인', '계정, 권한, 보안을 설계', '기존 계정 체계를 사용'],
      ['상위 API 연동과 배포', '상위 API 공급처를 찾고 VPS를 준비해 배포 및 유지', '상위 API 연동과 배포 기반이 이미 준비됨'],
      ['결제와 주문', '결제, 콜백, 예외 처리 구현', '기존 결제와 주문 흐름 사용'],
      ['모델 가격 관리', '모델, 채널, 과금 규칙 유지', '관리 화면에서 가격과 플랜 설정'],
      ['API 키와 로그', '키, 한도, 로그, 검색 개발', '키, 잔액, 사용 기록 내장'],
      ['출시 시간', '수주에서 수개월', '결제 후 초기화 진행'],
    ],
    includedTitle: '구축 후 제공되는 것',
    included: [
      '독립 진입점과 브랜드 표시',
      '상위 모델 연동과 배포 기반',
      '사이트명, 로고, 테마, 도메인 설정',
      '사용자 가입, 로그인, 계정 관리',
      '모델 판매, 가격, 플랜 관리',
      '충전, 리딤 코드, 결제 흐름',
      'API 키, 잔액, 사용 로그, 사용자 관리',
      '결제 후 관리 권한 자동 활성화',
    ],
    flowTitle: '구축 절차',
    flow: [
      ['플랫폼 이름과 식별자 입력', '브랜드명, slug, 현재 결제 계정을 확인합니다.'],
      ['결제 수단 선택 후 결제', '활성화된 결제 수단을 사용하며 암호화폐는 네트워크와 토큰을 확인합니다.'],
      ['관리 권한 획득', '결제 후 같은 계정으로 초기화와 관리 절차를 이어갑니다.'],
    ],
    faqTitle: '구축 전 자주 묻는 질문',
    faq: [
      ['언제부터 사용할 수 있나요?', '결제 확인 후 관리 권한이 부여되고 초기화로 안내됩니다.'],
      ['내 도메인을 사용할 수 있나요?', '네. 자체 브랜드, 도메인, 진입점을 위한 플랫폼입니다.'],
      ['모델 가격을 직접 설정할 수 있나요?', '네. 모델 가격, 플랜, 판매 전략을 설정할 수 있습니다.'],
      ['고객 결제는 어떻게 관리되나요?', '주문, 충전, 잔액, 플랜, 사용 기록이 플랫폼 흐름에서 관리됩니다.'],
      ['상위 API 공급처를 찾거나 VPS를 준비해야 하나요?', '아니요. 상위 API 연동과 배포 기반은 이미 준비되어 있으며, 구축 비용을 지불하고 초기 설정만 진행하면 됩니다.'],
      ['서버를 직접 유지해야 하나요?', '핵심 플랫폼 인프라를 처음부터 운영할 필요 없이 브랜드, 가격, 사용자 운영에 집중할 수 있습니다.'],
      ['결제 후 권한이 활성화되지 않으면요?', '같은 계정으로 상태를 새로고침하고, 그래도 반영되지 않으면 지원팀에 문의하세요.'],
      ['기술 배경이 없어도 적합한가요?', '명확한 사용자나 채널이 있다면 초기화와 관리 화면 중심으로 운영할 수 있습니다.'],
    ],
    panelTitle: '플랫폼 구축',
    panelDesc: '이름과 slug를 입력하고 구축 비용을 지불하면 관리 권한이 자동으로 활성화됩니다.',
  },
};

export default function SubDistributor() {
  const { t, i18n } = useTranslation();
  const { user, refreshUser, loading: authLoading } = useAuth();
  const { site } = useSite();
  const { fmtCNY } = useCurrency();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [subInfo, setSubInfo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [cryptoOrder, setCryptoOrder] = useState(null);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    payment_method: '',
    chain: 'tron',
    token: 'usdt',
  });

  useEffect(() => {
    getSubDistributorInfo()
      .then((res) => {
        if (res.data.success) {
          const info = res.data.data;
          setSubInfo(info);
          if (info.pay_methods?.length > 0) {
            setForm((prev) => ({ ...prev, payment_method: info.pay_methods[0].type }));
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const paymentMethods = subInfo?.pay_methods || [];
  const currentPayMethod = useMemo(
    () => paymentMethods.find((item) => item.type === form.payment_method),
    [paymentMethods, form.payment_method]
  );
  const currentPayMethodLabel = getPaymentMethodLabel(currentPayMethod, t) || form.payment_method;
  const paymentReturned = useMemo(
    () => new URLSearchParams(location.search).get('payment') === 'return',
    [location.search]
  );
  const currentSiteName = site?.name || t('subDist.defaultSiteName');
  const currentSiteDomain = useMemo(() => {
    const configuredDomain = normalizeHost(site?.domain);
    if (configuredDomain) return configuredDomain;
    if (typeof window !== 'undefined') return window.location.host;
    return '';
  }, [site?.domain]);
  const language = normalizeAppLanguage(i18n.resolvedLanguage || i18n.language);
  const copy = MARKETING_COPY[language] || MARKETING_COPY.en;

  useEffect(() => {
    if (!paymentReturned || authLoading) return;

    let cancelled = false;
    const toastId = 'sub-dist-payment-return';

    const checkPaymentResult = async () => {
      if (!user) {
        toast(t('subDist.paymentPending'), { id: toastId });
        navigate('/sub-site', { replace: true });
        return;
      }

      toast.loading(t('subDist.confirmingPayment'), { id: toastId });
      const refreshed = await refreshUser({ skipErrorHandler: true });
      if (cancelled) return;

      if (refreshed?.has_distributor) {
        toast.success(t('subDist.openedSuccess'), { id: toastId });
      } else {
        toast(t('subDist.paymentPending'), { id: toastId });
      }
      navigate('/sub-site', { replace: true });
    };

    checkPaymentResult();
    return () => {
      cancelled = true;
    };
  }, [authLoading, navigate, paymentReturned, refreshUser, t, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error(t('subDist.loginRequired'));
      return;
    }
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error(t('subDist.fillRequired'));
      return;
    }
    if (!form.payment_method) {
      toast.error(t('subDist.selectPayment'));
      return;
    }

    setSubmitting(true);
    setCryptoOrder(null);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim().toLowerCase(),
        payment_method: form.payment_method,
        return_url: `${window.location.origin}${getLocalizedPath('/sub-site', i18n.resolvedLanguage)}?payment=return`,
      };
      if (form.payment_method === 'crypto') {
        payload.chain = form.chain;
        payload.token = form.token;
      }
      const res = await createSubDistributorOrder(payload);
      if (res.data.message === 'success') {
        if (res.data.payment_type === 'stripe' && res.data.data?.pay_link) {
          const opened = window.open(res.data.data.pay_link, '_blank');
          if (opened) {
            toast.success(t('subDist.paymentPageOpened'));
          } else {
            toast.error(t('subDist.popupBlocked'));
          }
        } else if (res.data.payment_type === 'crypto') {
          setCryptoOrder(res.data.data);
          toast.success(t('subDist.cryptoOrderCreated'));
        } else {
          if (submitEpayForm(res.data)) {
            toast.success(t('subDist.paymentPageOpened'));
          } else {
            toast.error(t('subDist.paymentPageFailed'));
          }
        }
      } else if (res.data.data) {
        toast.error(typeof res.data.data === 'string' ? res.data.data : t('subDist.createFailed'));
      } else {
        toast.error(t('subDist.createFailed'));
      }
    } catch (e) {
      // handled by interceptor
    }
    setSubmitting(false);
  };

  const orderPanel = !subInfo?.enabled ? (
    <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
      <p className="mb-2 text-sm font-medium text-page">{t('subDist.notAvailable')}</p>
      <p className="text-sm text-page-secondary">{subInfo?.disabled_reason || t('subDist.disabledFallback')}</p>
    </div>
  ) : !user ? (
    <div className="space-y-4 rounded-2xl border border-page-divider bg-page-surface p-5">
      <p className="text-sm leading-6 text-page-secondary">{t('subDist.loginHint')}</p>
      <div className="flex flex-wrap gap-3">
        <Link to="/login" className="btn-primary">{t('subDist.goLogin')}</Link>
        <Link to="/register" className="btn-secondary">{t('subDist.goRegister')}</Link>
      </div>
    </div>
  ) : user?.has_distributor ? (
    <div className="space-y-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
      <p className="text-sm font-medium text-page">{t('subDist.alreadyOpenTitle')}</p>
      <p className="text-sm leading-6 text-page-secondary">
        {t('subDist.alreadyOpenDesc', {
          name: user.distributor_name || user.distributor_slug || t('subDist.defaultSiteName'),
        })}
      </p>
    </div>
  ) : (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-medium text-page-label">{t('subDist.siteName')}</label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="input"
          placeholder={t('subDist.siteNamePlaceholder')}
          required
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-page-label">{t('subDist.siteSlug')}</label>
        <input
          value={form.slug}
          onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })}
          className="input"
          placeholder="my-sub-site"
          required
        />
        <p className="mt-2 text-xs text-page-muted">{t('subDist.siteSlugHelp')}</p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-page-label">{t('subDist.paymentMethod')}</label>
        <div className="grid gap-3 sm:grid-cols-2">
          {paymentMethods.map((method) => (
            <label
              key={method.type}
              className={`cursor-pointer rounded-2xl border px-4 py-3 transition-colors ${
                form.payment_method === method.type
                  ? 'border-page-link bg-page-link/10'
                  : 'border-page-divider bg-page-surface hover:bg-page-surface-hover'
              }`}
            >
              <input
                type="radio"
                className="sr-only"
                checked={form.payment_method === method.type}
                onChange={() => setForm({ ...form, payment_method: method.type })}
              />
              <div className="text-sm font-medium text-page">{getPaymentMethodLabel(method, t)}</div>
            </label>
          ))}
        </div>
      </div>

      {form.payment_method === 'crypto' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-page-label">{t('subDist.chain')}</label>
            <select value={form.chain} onChange={(e) => setForm({ ...form, chain: e.target.value })} className="input">
              <option value="tron">TRON (TRC20)</option>
              <option value="eth">Ethereum (ERC20)</option>
              <option value="bsc">BSC (BEP20)</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-page-label">{t('subDist.token')}</label>
            <select value={form.token} onChange={(e) => setForm({ ...form, token: e.target.value })} className="input">
              <option value="usdt">USDT</option>
              <option value="usdc">USDC</option>
            </select>
          </div>
        </div>
      )}

      <button type="submit" disabled={submitting} className="btn-primary flex w-full items-center justify-center gap-2">
        {submitting && <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
        {t('subDist.payAndOpen', { price: fmtCNY(subInfo?.price || 0) })}
      </button>

      <p className="text-xs leading-5 text-page-muted">
        {t('subDist.currentUserHint', { user: user.display_name || user.username || 'User', method: currentPayMethodLabel })}
      </p>
      <p className="text-xs leading-5 text-page-muted">
        {t('subDist.postPayHint')}
      </p>
    </form>
  );

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-start">
        <div className="space-y-8">
          <div className="space-y-6">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-page-divider bg-page-surface px-3 py-1 text-sm font-semibold text-page">
              <Sparkles className="h-3.5 w-3.5 text-page-link" />
              {copy.eyebrow}
            </div>
            <div className="space-y-5">
              <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-page sm:text-5xl">
                {copy.heroTitle}
              </h1>
              <p className="max-w-3xl text-base leading-8 text-page-secondary">
                {copy.heroDesc}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a href="#open-platform" className="btn-primary inline-flex items-center justify-center gap-2">
                {copy.primaryCta}
                <ArrowRight className="h-4 w-4" />
              </a>
              <a href="#audience" className="btn-secondary inline-flex items-center justify-center gap-2">
                {copy.secondaryCta}
              </a>
            </div>
            <div className="flex flex-wrap gap-2">
              {copy.proof.map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5 rounded-full border border-page-divider bg-page-surface px-3 py-1.5 text-xs font-medium text-page-secondary">
                  <CheckCircle2 className="h-3.5 w-3.5 text-page-success" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <section id="audience" className="space-y-4 scroll-mt-24">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-page">{copy.audienceTitle}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-page-secondary">{copy.audienceDesc}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {copy.audience.map(([title, description], index) => {
                const Icon = AUDIENCE_ICONS[index] || Sparkles;
                return (
                  <article key={title} className="rounded-2xl border border-page-divider bg-page-surface p-5 shadow-sm">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-page-link">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-4 text-base font-semibold text-page">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-page-secondary">{description}</p>
                  </article>
                );
              })}
            </div>
          </section>
        </div>

        <aside id="open-platform" className="scroll-mt-24 lg:sticky lg:top-24">
          <div className="glass rounded-3xl p-6 shadow-sm">
            <div className="mb-5">
              <p className="text-sm font-semibold text-page-link">{copy.panelTitle}</p>
              <h2 className="mt-2 text-2xl font-bold text-page">{fmtCNY(subInfo?.price || 0)}</h2>
              <p className="mt-2 text-sm leading-6 text-page-secondary">{copy.panelDesc}</p>
            </div>
            <div className="mb-5 rounded-2xl border border-page-divider bg-page-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-page">{currentSiteDomain || currentSiteName}</p>
                  <p className="mt-1 text-xs text-page-muted">{t('subDist.exampleCategory', { name: currentSiteName })}</p>
                </div>
                <span className="shrink-0 rounded-full bg-brand-500/10 px-2.5 py-1 text-[11px] font-medium text-page-link">
                  {t('subDist.exampleStatus')}
                </span>
              </div>
            </div>
            {orderPanel}
            {cryptoOrder && (
              <div className="mt-5 space-y-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                <p className="text-sm font-medium text-page">{t('subDist.cryptoTitle')}</p>
                <p className="text-sm leading-6 text-page-secondary">{t('subDist.cryptoHint')}</p>
                <div className="space-y-1 text-sm text-page">
                  <div>{t('subDist.wallet')}: <span className="font-mono break-all">{cryptoOrder.wallet}</span></div>
                  <div>{t('subDist.amount')}: <span className="font-mono">{cryptoOrder.amount} {cryptoOrder.token}</span></div>
                  <div>{t('subDist.tradeNo')}: <span className="font-mono break-all">{cryptoOrder.trade_no}</span></div>
                </div>
              </div>
            )}
          </div>
        </aside>
      </section>

      <section className="mt-12 space-y-5">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight text-page">{copy.revenueTitle}</h2>
          <p className="mt-2 text-sm leading-7 text-page-secondary">{copy.revenueDesc}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {copy.revenue.map(([title, description], index) => {
            const Icon = REVENUE_ICONS[index] || Sparkles;
            return (
              <article key={title} className="rounded-2xl border border-page-divider bg-page-surface p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-page-link">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-page">{title}</h3>
                    <p className="mt-1.5 text-sm leading-6 text-page-secondary">{description}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mt-12 rounded-3xl border border-page-divider bg-page-surface p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <h2 className="text-2xl font-semibold tracking-tight text-page">{copy.savingsTitle}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-page-secondary">{copy.savingsDesc}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-page-divider text-left text-page-secondary">
                {copy.comparisonHeaders.map((header) => (
                  <th key={header} className="px-4 py-3 font-semibold">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {copy.comparison.map(([capability, selfBuild, apiRoute]) => (
                <tr key={capability} className="border-b border-page-divider last:border-0">
                  <td className="px-4 py-4 font-semibold text-page">{capability}</td>
                  <td className="px-4 py-4 text-page-secondary">{selfBuild}</td>
                  <td className="px-4 py-4 text-page">{apiRoute}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12 grid gap-8 lg:grid-cols-[1fr_0.9fr]">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-page">{copy.includedTitle}</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {copy.included.map((item, index) => {
              const Icon = INCLUDED_ICONS[index] || CheckCircle2;
              return (
                <div key={item} className="flex min-h-16 items-start gap-3 rounded-2xl border border-page-divider bg-page-surface p-4">
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-page-link/10 text-page-link">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-sm leading-6 text-page">{item}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-page">{copy.flowTitle}</h2>
          <div className="mt-5 space-y-4">
            {copy.flow.map(([title, description], index) => (
              <div key={title} className="flex gap-4 rounded-2xl border border-page-divider bg-page-surface p-4">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-500 text-sm font-bold text-white">
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-page">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-page-secondary">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-12">
        <div className="mb-5 flex items-center gap-2">
          <Zap className="h-5 w-5 text-page-link" />
          <h2 className="text-2xl font-semibold tracking-tight text-page">{copy.faqTitle}</h2>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {copy.faq.map(([question, answer], index) => (
            <details
              key={question}
              className="group rounded-2xl border border-page-divider bg-page-surface px-5 py-4 shadow-sm open:bg-page-inset"
              open={index === 0}
            >
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-left">
                <span className="text-sm font-semibold leading-6 text-page">{question}</span>
                <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-page-muted transition-transform group-open:rotate-90" />
              </summary>
              <p className="mt-3 text-sm leading-7 text-page-secondary">{answer}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
