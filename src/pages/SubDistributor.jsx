import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  AppWindow,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Store,
  Zap,
} from 'lucide-react';
import { createSubDistributorOrder, getSiteModels, getSubDistributorInfo } from '../api';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/SiteContext';
import { getLocalizedPath, normalizeAppLanguage } from '../i18n/languageUtils';
import { trackEvent } from '../utils/analytics';
import FadeContent from '../components/bits/FadeContent';
import SnapSection, { SnapDeck } from '../components/bits/SnapSection';
import providerMarketScreenshot from '../../images/上游商家市场，提供73个上游商家.png';
import providerManagementScreenshot from '../../images/上游商家管理界面.png';
import customerManagementScreenshot from '../../images/后台用户管理界面.png';
import usageLogsScreenshot from '../../images/调用日志.png';

function formatPaymentMethodName(value) {
  return String(value || '').trim().replace(/支付宝|alipay/gi, 'alipay');
}

function getPaymentMethodLabel(method, t) {
  if (!method) return '';
  const type = String(method.type || '').toLowerCase();
  if (type === 'crypto') return t('subDist.paymentCrypto');
  if (type === 'stripe') return 'Stripe';
  if (type === 'creem') return 'Creem';
  return formatPaymentMethodName(method.name || method.type);
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

const SUB_DISTRIBUTOR_ITEM_ID = 'sub_distributor_setup';
const SHOWCASE_IMAGES = [
  { src: providerMarketScreenshot, width: 1845, height: 3197 },
  { src: providerManagementScreenshot, width: 1560, height: 1058 },
  { src: customerManagementScreenshot, width: 1565, height: 1295 },
  { src: usageLogsScreenshot, width: 1559, height: 1253 },
];
const INBOUND_ROUTE = {
  id: 'app',
  d: 'M70 160 C140 160 220 160 302 160',
  color: '#2F855A',
  duration: '4.2s',
  begin: '-1.8s',
  secondBegin: '-3.7s',
};
const MODEL_ROUTES = [
  { id: 'openai', d: 'M302 160 C418 150 468 52 646 48', color: '#2F855A', duration: '5.8s', begin: '-1.1s', secondBegin: '-4.0s' },
  { id: 'claude', d: 'M302 160 C420 150 485 104 646 98', color: '#D97757', duration: '5.2s', begin: '-2.4s', secondBegin: '-4.8s' },
  { id: 'gemini', d: 'M302 160 C430 158 500 160 646 160', color: '#D6A23F', duration: '4.8s', begin: '-0.4s', secondBegin: '-2.9s' },
  { id: 'deepseek', d: 'M302 160 C424 174 488 220 646 226', color: '#2F855A', duration: '5.5s', begin: '-3.1s', secondBegin: '-5.4s' },
  { id: 'grok', d: 'M302 160 C412 184 458 274 646 282', color: '#D97757', duration: '6.1s', begin: '-1.7s', secondBegin: '-4.6s' },
];
const providerLogo = (slug) => `https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/${slug}.svg`;
const grokLogo = 'https://cdn.jsdelivr.net/npm/@lobehub/icons-static-svg@latest/icons/grok.svg';
const MODEL_NODES = [
  { id: 'openai', mark: 'O', label: 'OpenAI', logo: providerLogo('openai'), top: '15%' },
  { id: 'claude', mark: 'C', label: 'Claude', logo: providerLogo('claude'), top: '31%' },
  { id: 'gemini', mark: 'G', label: 'Gemini', logo: providerLogo('googlegemini'), top: '50%' },
  { id: 'deepseek', mark: 'D', label: 'DeepSeek', logo: providerLogo('deepseek'), top: '69%' },
  { id: 'grok', mark: 'X', label: 'Grok', logo: grokLogo, top: '85%' },
];
const ROUTER_MAP_COPY = {
  en: { customer: 'Your customers', site: 'Your site', relay: 'AI API site', label: 'Customers connect to your AI API site, then your site routes to model providers' },
  zh: { customer: '你的客户', site: '你的站点', relay: 'AI API 分站', label: '客户连接你的 AI API 分站，再由分站连接各个大模型' },
  ja: { customer: 'あなたの顧客', site: 'あなたのサイト', relay: 'AI API サイト', label: '顧客があなたの AI API サイトに接続し、サイトが各モデルへ中継します' },
  ko: { customer: '고객', site: '내 사이트', relay: 'AI API 사이트', label: '고객이 내 AI API 사이트에 연결되고, 사이트가 각 모델로 중계합니다' },
};
const SHOWCASE_COPY = {
  zh: {
    title: '真实后台，一套管理完整业务',
    description: '供应商、模型、客户和调用记录都在同一个后台完成管理。',
    items: [
      ['可选模型实时更新', '平台已完成模型与上游接入，可按业务需要选择已上架模型。'],
      ['按实际情况随时上下架', '根据价格、稳定性和业务需要，随时启用或停用供应商及其模型。'],
      ['管理客户账户', '查看客户余额、消耗、返佣和账号状态，日常运营更清楚。'],
      ['核对每次调用', '按用户、模型、密钥和费用追踪调用记录与实际消耗。'],
    ],
  },
  en: {
    title: 'One real dashboard for the whole operation',
    description: 'Manage providers, models, customers, and usage records from one place.',
    items: [
      ['Available models update automatically', 'The platform handles model and upstream integration so you can choose from currently listed models.'],
      ['List or unlist providers anytime', 'Enable or disable providers and their models as pricing, stability, and demand change.'],
      ['Manage customer accounts', 'Review balances, usage, commissions, and account status in one view.'],
      ['Audit every API call', 'Trace usage by customer, model, key, cost, and response time.'],
    ],
  },
  ja: {
    title: '実際の管理画面で運営を一元化',
    description: 'プロバイダー、モデル、顧客、利用履歴を一つの管理画面で扱えます。',
    items: [
      ['利用可能なモデル数を自動更新', 'モデルと上流プロバイダーの接続はプラットフォームが担当し、公開中のモデルから選択できます。'],
      ['状況に応じていつでも公開・停止', '価格、安定性、需要に合わせてプロバイダーとモデルをいつでも有効化・停止できます。'],
      ['顧客アカウントを管理', '残高、利用量、紹介料率、アカウント状態をまとめて確認できます。'],
      ['API 利用履歴を確認', '顧客、モデル、キー、費用、応答時間ごとに呼び出しを追跡できます。'],
    ],
  },
  ko: {
    title: '실제 관리 화면에서 운영을 한 번에',
    description: '공급자, 모델, 고객, 사용 기록을 하나의 관리자 화면에서 관리합니다.',
    items: [
      ['사용 가능한 모델 수 자동 업데이트', '모델과 상위 공급자 연동은 플랫폼이 처리하며 현재 등록된 모델 중에서 선택할 수 있습니다.'],
      ['상황에 따라 언제든 노출 전환', '가격, 안정성, 수요 변화에 맞춰 공급자와 모델을 즉시 활성화하거나 중지할 수 있습니다.'],
      ['고객 계정 관리', '잔액, 사용량, 커미션, 계정 상태를 한 화면에서 확인할 수 있습니다.'],
      ['모든 API 호출 확인', '고객, 모델, 키, 비용, 응답 시간별로 사용 기록을 추적할 수 있습니다.'],
    ],
  },
};
const MODEL_COUNT_LABEL = {
  zh: (count) => `${count} 个模型可选`,
  en: (count) => `${count} models available`,
  ja: (count) => `${count} モデルから選択`,
  ko: (count) => `${count}개 모델 선택`,
};
function ModelRouteAnimation({ language }) {
  const copy = ROUTER_MAP_COPY[language] || ROUTER_MAP_COPY.en;
  const routes = [INBOUND_ROUTE, ...MODEL_ROUTES];

  return (
    <div className="sub-dist-router-map hidden lg:block" aria-label={copy.label}>
      <svg className="sub-dist-router-map__lines" viewBox="0 0 760 320" preserveAspectRatio="none" aria-hidden="true">
        <path className="sub-dist-router-map__route sub-dist-router-map__route--in" d={INBOUND_ROUTE.d} stroke={INBOUND_ROUTE.color} />
        {MODEL_ROUTES.map((route) => (
          <path key={route.id} className="sub-dist-router-map__route" d={route.d} stroke={route.color} />
        ))}
        {routes.map((route) => (
          [route.begin, route.secondBegin].map((begin) => (
            <circle key={`${route.id}-${begin}`} className="sub-dist-router-map__dot" r="5" fill={route.color}>
              <animateMotion dur={route.duration} begin={begin} repeatCount="indefinite" path={route.d} />
            </circle>
          ))
        ))}
      </svg>

      <span className="sub-dist-router-map__ring" />
      <span className="sub-dist-router-map__ring sub-dist-router-map__ring--slow" />

      <div className="sub-dist-router-map__node sub-dist-router-map__node--app">
        <span className="sub-dist-router-map__node-icon">
          <AppWindow className="h-4 w-4" />
        </span>
        <span>{copy.customer}</span>
      </div>

      <div className="sub-dist-router-map__node sub-dist-router-map__node--center">
        <span className="sub-dist-router-map__center-icon">
          <Store className="h-6 w-6" />
        </span>
        <strong>{copy.site}</strong>
        <span>{copy.relay}</span>
      </div>

      {MODEL_NODES.map((node) => (
        <div key={node.id} className="sub-dist-router-map__node sub-dist-router-map__node--model" style={{ top: node.top }}>
          <span className="sub-dist-router-map__model-mark">
            <img
              src={node.logo}
              alt=""
              loading="lazy"
              decoding="async"
              className="sub-dist-router-map__model-logo"
              onError={(event) => {
                event.currentTarget.classList.add('hidden');
                event.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <span className="hidden">{node.mark}</span>
          </span>
          <span>{node.label}</span>
        </div>
      ))}
    </div>
  );
}

const MARKETING_COPY = {
  zh: {
    eyebrow: 'AI API 分站转售平台',
    heroTitle: '搭建和运营自己的 AI API 平台',
    heroDesc: '把 API-Route 的多模型能力包装成你的白标 AI API 平台：自定义品牌、域名、模型售价、充值和套餐。上游接入、VPS 部署、支付和管理后台都已准备好，你可以用自己的入口服务现有客户。',
    primaryCta: '开通我的 AI API 分站',
    secondaryCta: '先看适合谁',
    proof: ['白标分站', 'OpenAI 兼容 API', '可转售 API 套餐'],
      audienceTitle: '谁适合运营 AI API 分站',
    audienceDesc: '适合已经有用户、社群、客户或模型渠道，希望把 AI API 能力包装成自己品牌服务的人。',
    notForTitle: '不适合谁',
    notForDesc: '不适合没有现成用户或获客渠道、期待被动收入的人。平台提供模型接入、计费、支付和客户管理能力，但不提供客户，也不承诺任何收入或利润。你仍需负责获客、定价、客户支持和日常运营。',
    audience: [
      ['AI 工具社群运营者', '给社群成员提供统一 API、套餐和客户端接入，降低反复答疑和手动开通成本。'],
      ['开发者和 SaaS 团队', '为内部工具、客户项目或自动化流程提供统一模型入口，并用清晰价格控制成本。'],
      ['模型渠道和 API 代理', '把多模型能力做成自己的 AI API 转售平台，配置售价、套餐、充值方式和推广入口。'],
      ['已有客户渠道的技术服务商', '不用从零开发用户、支付、计费和日志系统，把现有客户迁移到统一的平台中管理。'],
    ],
    revenueTitle: '利润从哪里来？',
    revenueDesc: '你以平台成本价获得上游模型，再按自己的价格转售给用户，售价与成本之间的差额就是利润。用户可以充值余额，按实际 API 用量扣费；你也可以把额度做成套餐，价格、周期和额度都由你决定。',
    operationsTitle: '平台运维由谁负责？',
    operationsDesc: '日常部署、监控和故障处理由我们的专业运维团队负责，你无需自己维护服务器。上游商家发生故障时，系统会自动把请求切换到其他正常商家，运维团队也会持续跟进处理；如果 OpenAI、Anthropic 等官方服务本身发生故障，则超出我们的控制范围，恢复时间取决于官方。',
    calculatorTitle: '模拟利润计算器',
    calculatorDesc: '输入预计每月销售额度和平均加价比例，快速估算毛利润。',
    calculatorSales: '预计每月销售额度',
    calculatorMarkup: '平均加价比例',
    calculatorMonthly: '预计月利润',
    calculatorYearly: '预计年利润',
    calculatorNote: '仅为毛利润估算，未计支付手续费、退款及其他运营成本，实际收益以结算为准。',
    revenue: [
      ['设置模型销售价格', '按模型、渠道或套餐设置售价，用清晰费率覆盖服务成本。'],
      ['销售 AI API 套餐', '按天、周、月或额度售卖套餐，并支持用户持续充值余额。'],
      ['余额充值带来复购', '用户通过余额调用 API，适合长期使用和多模型混合消耗。'],
      ['推广自己的分站入口', '把入口放到社群、教程、工具文档或客户项目里，形成持续转化。'],
      ['面向团队提供统一入口', '给团队或客户一个统一 Base URL 和密钥体系，减少迁移和管理成本。'],
    ],
    savingsTitle: '开 AI API 代理平台不用从零开发',
    savingsDesc: '自己做 AI API 代理平台通常要找上游、买 VPS、部署服务、接支付、做账号、计费和日志。这里把这些基础能力打包好，你可以把精力放在品牌、价格和获客上。',
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
      '白标 AI API 分站和品牌展示',
      '上游模型接入与部署基础',
      '站点名称、Logo、主题和域名配置',
      '用户注册登录与账号管理',
      '模型转售、售价和套餐管理',
      '充值、套餐与支付流程',
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
      ['平台的收入模式是什么？', '你可以为现有客户设置模型售价和套餐，收入取决于客户的实际充值与使用情况；平台不提供客户，也不承诺收入或利润。'],
      ['可以作为 AI API 代理平台使用吗？', '可以。它适合想用自己品牌销售 AI API 套餐、统一管理用户、余额、API Key 和调用记录的人。'],
      ['可以销售自己的 AI API 套餐吗？', '可以。你可以按天、周、月或额度包装套餐，并根据自己的渠道和客户设置销售策略。'],
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
    panelPriceNote: '1 年订阅费 · 次年起续费价格接近基础服务成本',
    panelDesc: '填写名称和标识，支付首年订阅费后自动获得管理权限。',
  },
  en: {
    eyebrow: 'AI API Reseller Platform',
    heroTitle: 'Build and operate your own AI API reseller platform',
    heroDesc: 'Give your existing customers a branded AI API platform powered by API-Route. Upstream model access, VPS hosting, payments, balance top-ups, plans, and core administration are already handled.',
    primaryCta: 'Launch My AI API Reseller Platform',
    secondaryCta: 'See Who It Fits',
    proof: ['White-label brand', 'OpenAI-compatible API', 'Sell AI API plans'],
      audienceTitle: 'Who Should Operate an AI API Platform',
    audienceDesc: 'Built for AI API resellers, communities, SaaS teams, and model channels that already have users and want to package AI API access as their own business.',
    notForTitle: 'Who This Is Not For',
    notForDesc: 'This is not a passive-income product and it is not designed for people without an existing audience or customer-acquisition channel. The platform provides model access, billing, payments, and customer management, but it does not provide customers or guarantee revenue. You remain responsible for sales, pricing, support, and day-to-day operations.',
    audience: [
      ['AI tool community operators', 'Offer one API, plans, and client setup to members while reducing manual onboarding.'],
      ['Developers and SaaS teams', 'Give internal tools, customer projects, and automation workflows one model endpoint with clear pricing.'],
      ['AI API resellers and model channels', 'Turn multi-model access into a white-label platform where you can sell AI API access with pricing, packages, payments, and promotion.'],
      ['Technology providers with existing customers', 'Move existing customers onto one managed platform without rebuilding accounts, payments, billing, logs, and model routing.'],
    ],
    revenueTitle: 'Where Your Margin Comes From',
    revenueDesc: 'You get upstream model access at the platform cost, set your own customer prices, and keep the difference. Customers can top up a balance and pay as they use the API, or buy plans with quotas, billing periods, and prices that you define.',
    operationsTitle: 'Who Keeps the Platform Running?',
    operationsDesc: 'Deployment, monitoring, and incident response are handled by our operations team, so you do not need to maintain servers yourself. If an upstream supplier has an outage, requests are automatically routed to another healthy supplier while our team follows up on the fault. If the official service itself, such as OpenAI or Anthropic, is down, recovery is outside our control and depends on the provider.',
    calculatorTitle: 'Profit Estimator',
    calculatorDesc: 'Enter your expected monthly sales and average markup to estimate gross profit.',
    calculatorSales: 'Expected monthly sales',
    calculatorMarkup: 'Average markup',
    calculatorMonthly: 'Estimated monthly profit',
    calculatorYearly: 'Estimated annual profit',
    calculatorNote: 'Gross-profit estimate only. Payment fees, refunds, and other operating costs are not included. Actual earnings depend on settlement.',
    revenue: [
      ['Set customer-facing model prices', 'Configure prices by model, channel, or plan with clear rates that cover service costs.'],
      ['Sell AI API plans', 'Package model access into day, week, month, or quota-based plans, plus balance top-ups.'],
      ['Drive repeat top-ups', 'Users consume balance through API calls, which fits ongoing multi-model usage.'],
      ['Promote a branded entry point', 'Place the link in communities, tutorials, docs, and customer projects to keep converting users.'],
      ['Serve teams with one endpoint', 'Give teams or clients one Base URL and key system instead of scattered provider accounts.'],
    ],
    savingsTitle: 'Start Without Building Infrastructure',
    savingsDesc: 'Building an AI API reseller platform yourself usually means finding upstream providers, renting VPS hosting, deploying services, integrating payments, and maintaining accounts, billing, and logs. This setup packages that foundation.',
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
      'White-label AI API reseller entry point',
      'Upstream model connections and deployment foundation',
      'Site name, logo, theme, and domain configuration',
      'User registration, login, and account management',
      'Model resale, pricing, and plan management',
      'Top-ups, plans, and payment flows',
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
      ['How does the platform generate revenue?', 'You can set model prices and plans for your existing customers. Revenue depends on actual customer top-ups and usage; the platform does not provide customers or guarantee revenue.'],
      ['Can I start an AI API business without building infrastructure?', 'Yes. Upstream access, hosting, payments, user accounts, API keys, balance, and usage logs are already packaged so you can focus on branding, pricing, and customers.'],
      ['Can I sell my own AI API plans?', 'Yes. You can package access by day, week, month, or quota and sell plans under your own brand.'],
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
    panelPriceNote: 'One-year subscription · Renewals are priced close to the basic service cost',
    panelDesc: 'Fill in the name and slug. Management access is enabled automatically after the first-year subscription is paid.',
  },
  ja: {
    eyebrow: 'AI API リセラープラットフォーム',
    heroTitle: '自社ブランドの AI API プラットフォームを構築・運営',
    heroDesc: '既存の顧客に、自社ブランドの AI API プラットフォームを提供できます。上流接続、VPS、デプロイ、決済、残高チャージ、プラン管理は API-Route 側で用意されています。',
    primaryCta: 'AI API リセラープラットフォームを開設',
    secondaryCta: '対象ユーザーを見る',
    proof: ['ホワイトラベル入口', 'OpenAI 互換 API', 'API プラン販売'],
      audienceTitle: 'AI API プラットフォームの運営に向いている人',
    audienceDesc: 'ユーザー、コミュニティ、顧客、モデル供給を持ち、AI API アクセスを自分のサービスとして提供したい方向けです。',
    notForTitle: 'このサービスが向いていない方',
    notForDesc: '既存のユーザーや集客経路がなく、不労所得を期待する方には向いていません。モデル接続、課金、決済、顧客管理の基盤は提供しますが、顧客の獲得や収益を保証するものではありません。営業、価格設定、サポート、日々の運営はご自身で行う必要があります。',
    audience: [
      ['AI ツールコミュニティ運営者', 'メンバー向けに API、プラン、クライアント設定をまとめて提供できます。'],
      ['開発者・SaaS チーム', '社内ツール、顧客案件、自動化に統一モデル入口と明確な価格を提供します。'],
      ['モデルチャネル・API リセラー', '複数モデルのアクセスを自分のブランド、価格、決済、販売導線で展開できます。'],
      ['既存顧客を持つ IT サービス事業者', 'アカウント、決済、課金、ログをゼロから作らず、既存顧客を一つの基盤で管理できます。'],
    ],
    revenueTitle: '利益はどこから生まれるのか',
    revenueDesc: '上流プロバイダーのモデルをプラットフォームの原価で仕入れ、販売価格を自分で決めます。原価と販売価格の差額が利益です。利用者は残高をチャージして API の利用分だけ支払うことも、容量・期間・価格を独自に設定したプランを購入することもできます。',
    operationsTitle: '運用・保守は誰が担当するのか',
    operationsDesc: '日々のデプロイ、監視、障害対応は専門の運用チームが担当するため、サーバーを自分で管理する必要はありません。上流事業者で障害が起きた場合は、リクエストを正常な別事業者へ自動で切り替え、運用チームも対応を続けます。一方、OpenAI や Anthropic など公式サービス自体の障害は当社では制御できず、復旧時期は各社の対応に左右されます。',
    calculatorTitle: '利益シミュレーター',
    calculatorDesc: '月間の販売額と平均上乗せ率を入力すると、粗利益の目安を確認できます。',
    calculatorSales: '月間販売額（見込み）',
    calculatorMarkup: '平均上乗せ率',
    calculatorMonthly: '月間利益（見込み）',
    calculatorYearly: '年間利益（見込み）',
    calculatorNote: '粗利益の概算です。決済手数料、返金、その他の運営費用は含まれていません。実際の収益は精算結果をご確認ください。',
    revenue: [
      ['モデルの販売価格を設定', 'モデルやチャネルごとに、サービス原価を踏まえた価格を設定できます。'],
      ['AI API プラン販売', '日、週、月、容量単位で販売でき、コミュニティやチーム利用に向いています。'],
      ['残高チャージで継続利用', 'ユーザーは残高で API を呼び出し、継続利用と複数モデル消費につながります。'],
      ['ブランド入口で集客', 'コミュニティ、チュートリアル、ドキュメント、顧客案件から導線を作れます。'],
      ['チーム向け統一入口', 'チームや顧客に Base URL とキー体系をまとめて提供できます。'],
    ],
    savingsTitle: 'インフラ構築なしで AI API 販売を開始',
    savingsDesc: '自作では上流 API プロバイダー探し、VPS の用意、サービスのデプロイ、決済、アカウント、課金、ログ管理が大きな負担になります。ここではその基盤をまとめて提供します。',
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
      'ホワイトラベルの AI API 販売入口',
      '上流モデル接続とデプロイ基盤',
      'サイト名、ロゴ、テーマ、ドメイン設定',
      'ユーザー登録、ログイン、アカウント管理',
      'モデル再販、価格、プラン管理',
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
      ['収益の仕組みはどうなっていますか？', '既存顧客向けにモデル価格やプランを設定できます。収益は実際のチャージと利用状況によって決まり、顧客獲得や収益を保証するものではありません。'],
      ['インフラを作らず AI API ビジネスを始められますか？', 'はい。上流接続、ホスティング、決済、アカウント、API キー、残高、利用ログの基盤が用意されています。'],
      ['自分の AI API プランを販売できますか？', 'はい。日、週、月、容量単位でプランを作り、自分のブランドで販売できます。'],
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
    panelPriceNote: '1 年間の利用料 · 2 年目以降は基本サービス費用に近い更新料金',
    panelDesc: '名称と slug を入力し、初年度の利用料を支払うと管理権限が自動で有効になります。',
  },
  ko: {
    eyebrow: 'AI API 리셀러 플랫폼',
    heroTitle: '자체 브랜드의 AI API 플랫폼을 구축하고 운영하세요',
    heroDesc: '기존 고객에게 자체 브랜드의 AI API 플랫폼을 제공할 수 있습니다. 상위 모델 연동, VPS, 배포, 결제, 잔액 충전, 플랜 관리는 API-Route에서 제공합니다.',
    primaryCta: '내 AI API 리셀러 플랫폼 구축',
    secondaryCta: '대상 확인하기',
    proof: ['화이트라벨 진입점', 'OpenAI 호환 API', 'API 플랜 판매'],
      audienceTitle: 'AI API 플랫폼 운영에 적합한 사람',
    audienceDesc: '사용자, 커뮤니티, 고객, 모델 공급을 가지고 AI API 접근을 자신의 서비스로 제공하려는 사람에게 적합합니다.',
    notForTitle: '이런 경우에는 적합하지 않습니다',
    notForDesc: '기존 사용자나 고객 확보 채널이 없거나 수동적인 부수입을 기대한다면 적합하지 않습니다. 플랫폼은 모델 연동, 과금, 결제, 고객 관리 기능을 제공하지만 고객이나 수익을 보장하지 않습니다. 영업, 가격 책정, 고객 지원, 일상 운영은 직접 담당해야 합니다.',
    audience: [
      ['AI 도구 커뮤니티 운영자', '회원에게 API, 플랜, 클라이언트 설정을 한 번에 제공하고 수동 안내를 줄입니다.'],
      ['개발자와 SaaS 팀', '내부 도구, 고객 프로젝트, 자동화에 하나의 모델 엔드포인트와 명확한 가격을 제공합니다.'],
      ['모델 채널과 API 리셀러', '멀티 모델 접근을 자신의 브랜드, 가격, 결제, 홍보 동선으로 판매합니다.'],
      ['기존 고객을 보유한 IT 서비스 사업자', '계정, 결제, 과금, 로그를 처음부터 만들지 않고 기존 고객을 하나의 플랫폼에서 관리합니다.'],
    ],
    revenueTitle: '수익은 어디에서 생기나요?',
    revenueDesc: '플랫폼 원가로 상위 공급사의 모델을 확보한 뒤 판매 가격을 직접 정합니다. 원가와 판매가의 차이가 수익이 됩니다. 사용자는 잔액을 충전해 API 사용량만큼 결제할 수 있고, 운영자는 용량·기간·가격을 정한 자체 요금제를 판매할 수도 있습니다.',
    operationsTitle: '플랫폼 운영은 누가 맡나요?',
    operationsDesc: '배포, 모니터링, 장애 대응은 전문 운영팀이 맡으므로 서버를 직접 관리할 필요가 없습니다. 상위 공급사에 장애가 발생하면 요청을 정상적인 다른 공급사로 자동 전환하고 운영팀도 계속 대응합니다. 반면 OpenAI, Anthropic 등 공식 서비스 자체에 장애가 발생한 경우는 당사가 통제할 수 없으며 복구 시점은 해당 업체에 달려 있습니다.',
    calculatorTitle: '수익 시뮬레이터',
    calculatorDesc: '예상 월 판매액과 평균 가격 인상률을 입력하면 대략적인 매출총이익을 확인할 수 있습니다.',
    calculatorSales: '예상 월 판매액',
    calculatorMarkup: '평균 가격 인상률',
    calculatorMonthly: '예상 월 수익',
    calculatorYearly: '예상 연간 수익',
    calculatorNote: '매출총이익 추정치이며 결제 수수료, 환불 및 기타 운영비는 포함되지 않습니다. 실제 수익은 정산 결과를 기준으로 합니다.',
    revenue: [
      ['모델 판매 가격 설정', '모델이나 채널별로 서비스 비용을 반영한 가격을 설정합니다.'],
      ['AI API 플랜 판매', '일, 주, 월, 용량 기준 판매가 가능해 커뮤니티와 팀에 적합합니다.'],
      ['지속적인 충전 유도', '사용자는 잔액으로 API를 호출하고 멀티 모델 사용이 반복됩니다.'],
      ['브랜드 진입점 홍보', '커뮤니티, 튜토리얼, 문서, 고객 프로젝트에 링크를 배치해 전환을 만듭니다.'],
      ['팀용 통합 엔드포인트 제공', '팀이나 고객에게 하나의 Base URL과 키 체계를 제공합니다.'],
    ],
    savingsTitle: '인프라 구축 없이 AI API 사업 시작',
    savingsDesc: '직접 만들면 상위 API 공급처를 찾고, VPS를 준비하고, 서비스를 배포하며, 결제와 계정, 과금, 로그를 운영해야 합니다. 여기서는 그 기반을 패키지로 제공합니다.',
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
      '화이트라벨 AI API 판매 진입점',
      '상위 모델 연동과 배포 기반',
      '사이트명, 로고, 테마, 도메인 설정',
      '사용자 가입, 로그인, 계정 관리',
      '모델 재판매, 가격, 플랜 관리',
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
      ['수익 구조는 어떻게 되나요?', '기존 고객을 대상으로 모델 가격과 플랜을 설정할 수 있습니다. 수익은 실제 충전과 사용량에 따라 달라지며, 플랫폼은 고객이나 수익을 보장하지 않습니다.'],
      ['인프라를 만들지 않고 AI API 사업을 시작할 수 있나요?', '네. 상위 연동, 호스팅, 결제, 계정, API 키, 잔액, 사용 로그 기반이 이미 패키지로 제공됩니다.'],
      ['내 AI API 플랜을 판매할 수 있나요?', '네. 일, 주, 월, 용량 기준 플랜을 만들고 자신의 브랜드로 판매할 수 있습니다.'],
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
    panelPriceNote: '1년 구독료 · 다음 해부터는 기본 서비스 비용에 가까운 갱신 요금',
    panelDesc: '이름과 slug를 입력하고 첫해 구독료를 결제하면 관리 권한이 자동으로 활성화됩니다.',
  },
};

export default function SubDistributor() {
  const { t, i18n } = useTranslation();
  const { user, refreshUser, loading: authLoading } = useAuth();
  const { fmtCNY, cnyRate, code: currencyCode } = useCurrency();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [subInfo, setSubInfo] = useState(null);
  const [modelCount, setModelCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [cryptoOrder, setCryptoOrder] = useState(null);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    payment_method: '',
    chain: 'tron',
    token: 'usdt',
  });
  const [profitInputs, setProfitInputs] = useState({
    sales: '0',
    markup: '0',
  });
  const pricingPanelRef = useRef(null);
  const pricingTrackedRef = useRef(false);
  const formStartedRef = useRef(false);
  const funnelViewTrackedRef = useRef(false);

  useEffect(() => {
    if (authLoading || funnelViewTrackedRef.current) return;
    funnelViewTrackedRef.current = true;
    trackEvent('reseller_funnel_view', { logged_in: Boolean(user) });
  }, [authLoading, user]);

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
    getSiteModels()
      .then((res) => {
        if (!res.data.success) return;
        setModelCount(new Set(
          (res.data.data || [])
            .filter((model) => model.enabled !== false)
            .map((model) => model.model_name)
            .filter(Boolean),
        ).size);
      })
      .catch(() => {});
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
  const language = normalizeAppLanguage(i18n.resolvedLanguage || i18n.language);
  const copy = MARKETING_COPY[language] || MARKETING_COPY.en;
  const showcaseCopy = SHOWCASE_COPY[language] || SHOWCASE_COPY.en;
  const showcaseItems = useMemo(() => {
    if (modelCount <= 0) return showcaseCopy.items;
    return [
      [MODEL_COUNT_LABEL[language]?.(modelCount) || MODEL_COUNT_LABEL.en(modelCount), showcaseCopy.items[0][1]],
      ...showcaseCopy.items.slice(1),
    ];
  }, [language, modelCount, showcaseCopy]);
  const parsedSales = Number(profitInputs.sales);
  const parsedMarkup = Number(profitInputs.markup);
  const salesAmount = Number.isFinite(parsedSales) ? Math.max(0, parsedSales) : 0;
  const markupPercent = Number.isFinite(parsedMarkup) ? Math.max(0, parsedMarkup) : 0;
  const estimatedMonthlyProfit = salesAmount * markupPercent / (100 + markupPercent);
  const estimatedYearlyProfit = estimatedMonthlyProfit * 12;

  useEffect(() => {
    if (loading || authLoading || pricingTrackedRef.current || !pricingPanelRef.current) return undefined;

    const panel = pricingPanelRef.current;
    const trackPricingView = () => {
      if (pricingTrackedRef.current) return;
      pricingTrackedRef.current = true;
      const value = Number((Number(subInfo?.price || 0) * cnyRate).toFixed(2));
      trackEvent('reseller_pricing_view', {
        currency: 'CNY',
        ...(value > 0 ? { value } : {}),
        available: Boolean(subInfo?.enabled),
        logged_in: Boolean(user),
      });
      if (!user) {
        trackEvent('reseller_login_required', { source: 'pricing_view' });
      }
    };

    if (typeof IntersectionObserver === 'undefined') {
      trackPricingView();
      return undefined;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      trackPricingView();
      observer.disconnect();
    }, { threshold: 0.25 });
    observer.observe(panel);
    return () => observer.disconnect();
  }, [authLoading, cnyRate, loading, subInfo?.enabled, subInfo?.price, user]);

  useEffect(() => {
    if (!paymentReturned || authLoading) return;

    let cancelled = false;
    const toastId = 'sub-dist-payment-return';

    const checkPaymentResult = async () => {
      if (!user) {
        toast(t('subDist.paymentPending'), { id: toastId });
        navigate('/ai-api-reseller-platform', { replace: true });
        return;
      }

      toast.loading(t('subDist.confirmingPayment'), { id: toastId });
      const refreshed = await refreshUser({ skipErrorHandler: true });
      if (cancelled) return;

      if (refreshed?.has_distributor) {
        const value = Number((Number(subInfo?.price || 0) * cnyRate).toFixed(2));
        const trackingKey = `sub_dist_purchase_tracked_${refreshed.id || user.id || 'user'}`;
        if (!sessionStorage.getItem(trackingKey)) {
          trackEvent('purchase', {
            transaction_id: `sub_distributor_${refreshed.id || user.id || Date.now()}`,
            affiliation: 'API-Route reseller platform',
            currency: 'CNY',
            ...(value > 0 ? { value } : {}),
            items: [{
              item_id: SUB_DISTRIBUTOR_ITEM_ID,
              item_name: 'AI API reseller platform setup',
              item_category: 'sub_distributor',
              ...(value > 0 ? { price: value } : {}),
              quantity: 1,
            }],
          });
          sessionStorage.setItem(trackingKey, '1');
        }
        toast.success(t('subDist.openedSuccess'), { id: toastId });
      } else {
        toast(t('subDist.paymentPending'), { id: toastId });
      }
      navigate('/ai-api-reseller-platform', { replace: true });
    };

    checkPaymentResult();
    return () => {
      cancelled = true;
    };
  }, [authLoading, navigate, paymentReturned, refreshUser, t, user]);

  const trackFormStart = () => {
    if (formStartedRef.current) return;
    formStartedRef.current = true;
    trackEvent('reseller_form_start', {
      payment_method: form.payment_method || 'unset',
    });
  };

  const trackCheckoutError = (reason, stage) => {
    trackEvent('reseller_checkout_error', {
      error_reason: reason,
      error_stage: stage,
      payment_method: form.payment_method || 'unset',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      trackEvent('reseller_login_required', { source: 'checkout_submit' });
      trackCheckoutError('login_required', 'validation');
      toast.error(t('subDist.loginRequired'));
      return;
    }
    if (!form.name.trim() || !form.slug.trim()) {
      trackCheckoutError('missing_required_fields', 'validation');
      toast.error(t('subDist.fillRequired'));
      return;
    }
    if (!form.payment_method) {
      trackCheckoutError('missing_payment_method', 'validation');
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
        return_url: `${window.location.origin}${getLocalizedPath('/ai-api-reseller-platform', i18n.resolvedLanguage)}?payment=return`,
      };
      if (form.payment_method === 'crypto') {
        payload.chain = form.chain;
        payload.token = form.token;
      }
      const value = Number((Number(subInfo?.price || 0) * cnyRate).toFixed(2));
      trackEvent('begin_checkout', {
        currency: 'CNY',
        ...(value > 0 ? { value } : {}),
        payment_method: form.payment_method,
        items: [{
          item_id: SUB_DISTRIBUTOR_ITEM_ID,
          item_name: 'AI API reseller platform setup',
          item_category: 'sub_distributor',
          ...(value > 0 ? { price: value } : {}),
          quantity: 1,
        }],
      });
      const res = await createSubDistributorOrder(payload);
      if (res.data.message === 'success') {
        if (res.data.payment_type === 'stripe' && res.data.data?.pay_link) {
          const opened = window.open(res.data.data.pay_link, '_blank');
          if (opened) {
            toast.success(t('subDist.paymentPageOpened'));
          } else {
            trackCheckoutError('popup_blocked', 'payment_redirect');
            toast.error(t('subDist.popupBlocked'));
          }
        } else if (res.data.payment_type === 'crypto') {
          setCryptoOrder(res.data.data);
          toast.success(t('subDist.cryptoOrderCreated'));
        } else {
          if (submitEpayForm(res.data)) {
            toast.success(t('subDist.paymentPageOpened'));
          } else {
            trackCheckoutError('payment_page_failed', 'payment_redirect');
            toast.error(t('subDist.paymentPageFailed'));
          }
        }
      } else if (res.data.data) {
        trackCheckoutError('create_order_rejected', 'create_order');
        toast.error(typeof res.data.data === 'string' ? res.data.data : t('subDist.createFailed'));
      } else {
        trackCheckoutError('create_order_failed', 'create_order');
        toast.error(t('subDist.createFailed'));
      }
    } catch (e) {
      trackCheckoutError('create_order_exception', 'create_order');
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
        <Link
          to="/login"
          className="btn-primary"
          onClick={() => trackEvent('reseller_cta_click', { placement: 'pricing_login' })}
        >
          {t('subDist.goLogin')}
        </Link>
        <Link
          to="/register"
          className="btn-secondary"
          onClick={() => trackEvent('reseller_cta_click', { placement: 'pricing_register' })}
        >
          {t('subDist.goRegister')}
        </Link>
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
    <form onSubmit={handleSubmit} onFocusCapture={trackFormStart} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-page-label">{t('subDist.siteName')}</label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="input"
          placeholder={t('subDist.siteNamePlaceholder')}
          required
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-page-label">{t('subDist.siteSlug')}</label>
        <input
          value={form.slug}
          onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })}
          className="input"
          placeholder="my-sub-site"
          required
        />
        <p className="mt-1.5 text-xs text-page-muted">{t('subDist.siteSlugHelp')}</p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-page-label">{t('subDist.paymentMethod')}</label>
        <div className="grid gap-3 sm:grid-cols-2">
          {paymentMethods.map((method) => (
            <label
              key={method.type}
              className={`cursor-pointer rounded-2xl border px-4 py-2.5 transition-colors ${
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
            <label className="mb-1.5 block text-sm font-medium text-page-label">{t('subDist.chain')}</label>
            <select value={form.chain} onChange={(e) => setForm({ ...form, chain: e.target.value })} className="input">
              <option value="tron">TRON (TRC20)</option>
              <option value="eth">Ethereum (ERC20)</option>
              <option value="bsc">BSC (BEP20)</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-page-label">{t('subDist.token')}</label>
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

      <p className="text-xs leading-4 text-page-muted">
        {t('subDist.currentUserHint', { user: user.display_name || user.username || 'User', method: currentPayMethodLabel })}
      </p>
      <p className="text-xs leading-4 text-page-muted">
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
    <SnapDeck enabled={false}>
      <SnapSection
        contentClassName="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-stretch"
        direction="up"
      >
        <FadeContent direction="left" distance={38} duration={780} className="space-y-8">
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
              <a
                href="#open-platform"
                className="btn-primary inline-flex items-center justify-center gap-2"
                onClick={() => trackEvent('reseller_cta_click', { placement: 'hero_primary' })}
              >
                {copy.primaryCta}
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#audience"
                className="btn-secondary inline-flex items-center justify-center gap-2"
                onClick={() => trackEvent('reseller_cta_click', { placement: 'hero_audience' })}
              >
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
          <ModelRouteAnimation language={language} />
        </FadeContent>

        <FadeContent direction="right" distance={38} duration={780} delay={120} className="lg:self-stretch">
          <aside ref={pricingPanelRef} id="open-platform" className="h-full scroll-mt-24">
            <div className="glass h-full rounded-3xl p-5 shadow-sm">
            <div className="mb-4">
              <p className="text-sm font-semibold text-page-link">{copy.panelTitle}</p>
              <div className="mt-2 flex flex-wrap items-baseline gap-2">
                <h2 className="text-2xl font-bold text-page">{fmtCNY(subInfo?.price || 0)}</h2>
              </div>
              <p className="mt-1.5 text-xs font-medium text-page-link">{copy.panelPriceNote}</p>
              <p className="mt-2 text-sm leading-6 text-page-secondary">{copy.panelDesc}</p>
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
        </FadeContent>
      </SnapSection>

      <SnapSection
        className="bg-[var(--page-bg)]"
        contentClassName="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6"
        direction="left"
      >
        <section className="space-y-6">
          <FadeContent direction="left" distance={36} duration={760} className="max-w-3xl">
            <h2 className="text-2xl font-semibold tracking-tight text-page">{showcaseCopy.title}</h2>
            <p className="mt-2 text-sm leading-7 text-page-secondary">{showcaseCopy.description}</p>
          </FadeContent>
          <div className="grid gap-5 lg:grid-cols-2">
            {SHOWCASE_IMAGES.map((image, index) => {
              const [title, description] = showcaseItems[index];
              return (
                <FadeContent
                  key={image.src}
                  direction={index % 2 === 0 ? 'left' : 'right'}
                  distance={32}
                  duration={720}
                  delay={(index % 2) * 80}
                >
                  <article className="overflow-hidden rounded-3xl border border-page-divider bg-page-surface shadow-sm">
                    <a
                      href={image.src}
                      target="_blank"
                      rel="noreferrer"
                      className="block overflow-hidden bg-white"
                      onClick={() => trackEvent('reseller_demo_click', {
                        demo_index: index + 1,
                        demo_name: title,
                      })}
                    >
                      <img
                        src={image.src}
                        width={image.width}
                        height={image.height}
                        alt={`${title}：${description}`}
                        loading="lazy"
                        decoding="async"
                        className="h-72 w-full object-cover object-top transition-transform duration-300 hover:scale-[1.01] sm:h-80"
                      />
                    </a>
                    <div className="p-5">
                      <h3 className="text-base font-semibold text-page">{title}</h3>
                      <p className="mt-1.5 text-sm leading-6 text-page-secondary">{description}</p>
                    </div>
                  </article>
                </FadeContent>
              );
            })}
          </div>
        </section>
      </SnapSection>

      <SnapSection
        className="bg-[var(--page-bg)]"
        contentClassName="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6"
        direction="right"
      >
        <section id="audience" className="grid gap-8 scroll-mt-24 border-b border-page-divider pb-10 lg:grid-cols-2">
          <FadeContent direction="left" distance={34} duration={720}>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-page">{copy.audienceTitle}</h2>
              <p className="mt-2 text-sm leading-7 text-page-secondary">{copy.audienceDesc}</p>
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
                {[0, 1, 3].map((index) => (
                  <span key={copy.audience[index][0]} className="rounded-full bg-page-inset px-3 py-2 text-sm font-medium text-page">
                    {copy.audience[index][0]}
                  </span>
                ))}
              </div>
            </div>
          </FadeContent>
          <FadeContent direction="right" distance={34} duration={720} delay={80}>
            <aside>
              <h3 className="text-lg font-semibold text-page">{copy.notForTitle}</h3>
              <p className="mt-2 text-sm leading-7 text-page-secondary">{copy.notForDesc}</p>
            </aside>
          </FadeContent>
        </section>
      </SnapSection>

      <SnapSection
        className="bg-[var(--page-bg)]"
        contentClassName="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6"
        direction="left"
      >
        <section className="border-b border-page-divider pb-10">
          <div className="mb-5">
            <h2 className="text-2xl font-semibold tracking-tight text-page">{copy.savingsTitle}</h2>
            <p className="mt-2 text-sm leading-7 text-page-secondary">{copy.savingsDesc}</p>
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
                {copy.comparison.slice(0, 4).map(([capability, selfBuild, apiRoute]) => (
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
      </SnapSection>

      <SnapSection
        className="bg-[var(--page-bg)]"
        contentClassName="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6"
        direction="up"
      >
        <section className="pb-10">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            <FadeContent direction="left" distance={28} duration={700}>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-page">{copy.revenueTitle}</h2>
                <p className="mt-3 text-sm leading-7 text-page-secondary">{copy.revenueDesc}</p>
              </div>
            </FadeContent>
            <FadeContent direction="right" distance={28} duration={700} delay={80}>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-page">{copy.operationsTitle}</h2>
                <p className="mt-3 text-sm leading-7 text-page-secondary">{copy.operationsDesc}</p>
              </div>
            </FadeContent>
          </div>

          <FadeContent direction="up" distance={24} duration={680} className="mt-10 border-t border-page-divider pt-10">
            <div>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-page">{copy.calculatorTitle}</h2>
                <p className="mt-3 text-sm leading-7 text-page-secondary">{copy.calculatorDesc}</p>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-page-label">
                    {copy.calculatorSales} ({currencyCode})
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={profitInputs.sales}
                    onChange={(event) => setProfitInputs((current) => ({ ...current, sales: event.target.value }))}
                    className="input"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-page-label">{copy.calculatorMarkup}</span>
                  <span className="relative block">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      inputMode="decimal"
                      value={profitInputs.markup}
                      onChange={(event) => setProfitInputs((current) => ({ ...current, markup: event.target.value }))}
                      className="input pr-12"
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-page-muted">%</span>
                  </span>
                </label>
              </div>
            </div>
            <div className="mt-7 grid border-y border-page-divider sm:grid-cols-2 sm:divide-x sm:divide-page-divider">
              <div className="py-5 sm:pr-8">
                <p className="text-sm text-page-secondary">{copy.calculatorMonthly}</p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-page">
                  {fmtCNY(estimatedMonthlyProfit / (cnyRate || 1), 2)}
                </p>
              </div>
              <div className="border-t border-page-divider py-5 sm:border-t-0 sm:pl-8">
                <p className="text-sm text-page-secondary">{copy.calculatorYearly}</p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-page">
                  {fmtCNY(estimatedYearlyProfit / (cnyRate || 1), 2)}
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs leading-6 text-page-muted">{copy.calculatorNote}</p>
          </FadeContent>
        </section>
      </SnapSection>

      <SnapSection
        className="bg-[var(--page-bg)]"
        contentClassName="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6"
        direction="left"
      >
      <section>
        <FadeContent direction="left" distance={32} duration={720} className="mb-5 flex items-center gap-2">
          <Zap className="h-5 w-5 text-page-link" />
          <h2 className="text-2xl font-semibold tracking-tight text-page">{copy.faqTitle}</h2>
        </FadeContent>
        <div className="grid gap-3 lg:grid-cols-2">
          {copy.faq.slice(0, 4).map(([question, answer], index) => (
            <FadeContent
              key={question}
              direction={index % 2 === 0 ? 'left' : 'right'}
              distance={28}
              duration={680}
              delay={(index % 4) * 45}
            >
              <details
                className="group rounded-2xl border border-page-divider bg-page-surface px-5 py-4 shadow-sm open:bg-page-inset"
                open={index === 0}
              >
                <summary
                  className="flex cursor-pointer list-none items-start justify-between gap-4 text-left"
                  onClick={(event) => {
                    if (!event.currentTarget.parentElement?.open) {
                      trackEvent('reseller_faq_open', { faq_index: index + 1 });
                    }
                  }}
                >
                  <span className="text-sm font-semibold leading-6 text-page">{question}</span>
                  <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-page-muted transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-3 text-sm leading-7 text-page-secondary">{answer}</p>
              </details>
            </FadeContent>
          ))}
        </div>
        <div className="mt-8 flex justify-center">
          <a
            href="#open-platform"
            className="btn-primary inline-flex items-center justify-center gap-2"
            onClick={() => trackEvent('reseller_cta_click', { placement: 'faq_primary' })}
          >
            {copy.primaryCta}
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>
      </SnapSection>
    </SnapDeck>
  );
}
