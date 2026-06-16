import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown, HelpCircle, LifeBuoy, ShieldCheck, Sparkles } from 'lucide-react';
import { normalizeAppLanguage } from '../i18n/languageUtils';

const FAQ_COPY = {
  zh: {
    badge: '常见问题',
    title: 'API-Route 使用 FAQ',
    subtitle: '把接入前最常问的问题放在一起：兼容方式、模型调用、套餐兑换、客户端配置、支付和独立平台。',
    sections: [
      {
        title: '接入与模型',
        items: [
          {
            question: 'API-Route 是否兼容 OpenAI API？',
            answer: '是。常见的 OpenAI-compatible 客户端通常只需要把 Base URL 改成本站提供的 API 调用地址，再填入你在控制台创建的 API Key，即可开始调用支持的模型。',
          },
          {
            question: '我应该在哪里查看 API 调用地址？',
            answer: '首页会展示可用的 API 端点。登录后，你也可以在 API 密钥页面创建密钥，并把密钥与调用地址一起复制到 Cherry Studio、LibreChat、Claude Code 等工具中。',
          },
          {
            question: '支持哪些 AI 模型？',
            answer: '模型列表会以站点实际开放为准。你可以在定价页面查看可用模型、输入输出价格、缓存价格以及模型状态，再选择适合聊天、写作、代码、图像或视频任务的模型。',
          },
        ],
      },
      {
        title: '套餐、计费与支付',
        items: [
          {
            question: '套餐和兑换码怎么使用？',
            answer: '先在套餐页面选择适合的额度或有效期，购买后拿到兑换码。登录账号后进入兑换页面输入兑换码，系统会自动匹配并激活对应套餐。',
          },
          {
            question: '调用 API 时如何计费？',
            answer: '不同模型的计费方式可能不同，包括输入、输出、缓存读取、缓存创建或按次计费。最终消耗以调用日志和账户记录为准，建议先在定价页面确认模型费率。',
          },
          {
            question: '支持加密货币支付吗？',
            answer: '如果当前站点开启了加密货币支付，你会在充值、套餐或独立平台开通流程中看到链和代币选项。提交订单后请按页面显示的地址、金额和网络完成转账。',
          },
        ],
      },
      {
        title: '客户端与安全',
        items: [
          {
            question: '可以接入哪些客户端或应用？',
            answer: '应用市场会列出当前推荐的客户端和内置应用。只要客户端支持自定义 OpenAI-compatible Base URL 和 API Key，通常都可以接入本站。',
          },
          {
            question: '如何在 VSCode 中配置 API-Route 并使用 gpt5.5？',
            answer: '推荐使用 cc switch 一键导入配置。以 gpt5.5 为例，在 cc switch 中模型选择 gpt5.5，工具选择 cursor，导入目标选择 codex，然后执行导入。导入后在 VSCode 对应的 AI/Codex 配置中使用该模型和 API-Route 的密钥即可。',
          },
          {
            question: '如何给 Codex app 配置 API-Route？',
            answer: '先在本站创建 API Key，并确认 API 调用地址。然后通过 cc switch 选择要使用的模型，导入目标选择 codex，一键写入配置。完成后在 Codex app 中确认模型名称、Base URL 和密钥对应即可开始调用。',
          },
          {
            question: 'Claude Code 如何配置 API-Route？',
            answer: 'Claude Code 的关键是让客户端使用 API-Route 提供的 Base URL、API Key 和模型名称。你可以手动填入这些信息，也可以用 cc switch 生成并导入配置，减少模型名、密钥和端点填错的概率。',
          },
          {
            question: 'API Key 是否安全？',
            answer: '请只在你信任的客户端中保存 API Key。创建后如果怀疑泄露，可以在 API 密钥页面禁用或删除旧密钥，再创建新的密钥继续使用。',
          },
          {
            question: '为什么调用失败或模型不可用？',
            answer: '常见原因包括密钥填错、余额或套餐不可用、模型名称不匹配、客户端 Base URL 配置错误，或上游模型临时不可用。你可以先查看调用日志定位请求状态。',
          },
        ],
      },
      {
        title: '独立平台',
        items: [
          {
            question: '独立平台适合谁？',
            answer: '它适合想独立运营 AI API 平台的人：可以设置品牌、域名、模型售价、充值方式和推广入口，把本站能力包装成自己的服务。',
          },
          {
            question: '支付后会自动开通吗？',
            answer: '独立平台订单支付完成后，系统会自动为同一账号开通管理权限，并引导你继续完成站点初始化。若支付已完成但状态未更新，请联系支持处理。',
          },
        ],
      },
    ],
    cards: [
      { title: '先看价格', body: '比较模型费率和支持状态。', to: '/pricing' },
      { title: '选择套餐', body: '按天、周、月或额度购买。', to: '/packages' },
      { title: '看应用接入', body: '找到可直接使用的客户端。', to: '/apps' },
    ],
    contactTitle: '还有问题？',
    contactDesc: '如果 FAQ 没有覆盖你的场景，可以通过页面底部的 Telegram 或联系入口找站点支持。',
  },
  en: {
    badge: 'FAQ',
    title: 'API-Route FAQ',
    subtitle: 'Answers to the questions people usually ask before connecting: OpenAI compatibility, model usage, plans, client setup, payments, and branded platform setup.',
    sections: [
      {
        title: 'API Access and Models',
        items: [
          {
            question: 'Is API-Route compatible with the OpenAI API?',
            answer: 'Yes. Most OpenAI-compatible clients only need the Base URL provided by this site and the API key you create in the dashboard. After that, you can call the supported models through the same style of API.',
          },
          {
            question: 'Where do I find the API endpoint?',
            answer: 'The homepage shows the available API endpoints. After signing in, create an API key on the API Keys page, then paste the key and endpoint into tools such as Cherry Studio, LibreChat, or Claude Code.',
          },
          {
            question: 'Which AI models are supported?',
            answer: 'The available models depend on the current site configuration. Check the Pricing page for model names, input and output rates, cache pricing, and model status before choosing one for chat, writing, coding, image, or video tasks.',
          },
        ],
      },
      {
        title: 'Plans, Billing, and Payments',
        items: [
          {
            question: 'How do plans and redeem codes work?',
            answer: 'Choose a plan on the Packages page, purchase the matching redeem code, sign in, and enter the code on the redeem page. The system activates the matching plan automatically.',
          },
          {
            question: 'How is API usage billed?',
            answer: 'Billing varies by model. Some models charge by input and output tokens, cache reads, cache creation, or per call. The final usage is reflected in your usage logs and account records.',
          },
          {
            question: 'Do you support crypto payments?',
            answer: 'If crypto payments are enabled for this site, you will see chain and token options during top-up, package purchase, or branded platform setup. Follow the displayed network, address, and amount carefully.',
          },
        ],
      },
      {
        title: 'Clients and Security',
        items: [
          {
            question: 'Which clients or apps can I use?',
            answer: 'The App Market lists recommended clients and built-in apps. In general, any client that supports a custom OpenAI-compatible Base URL and API key can connect to this site.',
          },
          {
            question: 'How do I configure API-Route in VSCode and use gpt5.5?',
            answer: 'We recommend using cc switch for one-click import. For example, to use gpt5.5 in VSCode, select gpt5.5 as the model in cc switch, choose cursor as the tool, set the import target to codex, then import the configuration. After that, use the imported API-Route profile in your VSCode AI/Codex setup.',
          },
          {
            question: 'How do I configure API-Route for the Codex app?',
            answer: 'Create an API key on this site and confirm the API endpoint first. In cc switch, choose the model you want to use and set the import target to codex. After import, check that the Codex app is using the expected model name, Base URL, and API key.',
          },
          {
            question: 'How do I configure Claude Code with API-Route?',
            answer: 'Claude Code needs the API-Route Base URL, API key, and model name. You can enter them manually, or use cc switch to generate and import the configuration so the endpoint, key, and model are less likely to be mistyped.',
          },
          {
            question: 'How should I protect my API key?',
            answer: 'Store your API key only in clients you trust. If you suspect a leak, disable or delete the old key on the API Keys page and create a new one.',
          },
          {
            question: 'Why did an API request fail?',
            answer: 'Common causes include an incorrect key, inactive balance or plan, mismatched model name, wrong Base URL, or a temporary upstream model issue. Usage logs are the fastest place to debug the request.',
          },
        ],
      },
      {
        title: 'Branded Platform',
        items: [
          {
            question: 'Who is the branded platform for?',
            answer: 'It is for operators who want to run their own AI API platform with custom branding, domain, model pricing, payments, and promotion while using the hosted capabilities behind this platform.',
          },
          {
            question: 'Will the branded platform be activated automatically after payment?',
            answer: 'After the branded platform order is paid, the system grants management access to the same account and guides you through initialization. If payment is complete but the status does not update, contact support.',
          },
        ],
      },
    ],
    cards: [
      { title: 'Compare Pricing', body: 'Review model rates and status.', to: '/pricing' },
      { title: 'Choose a Plan', body: 'Buy by day, week, month, or quota.', to: '/packages' },
      { title: 'Connect Apps', body: 'Find clients that work out of the box.', to: '/apps' },
    ],
    contactTitle: 'Still have questions?',
    contactDesc: 'If your case is not covered here, use the Telegram or contact link in the footer to reach site support.',
  },
  ja: {
    badge: 'FAQ',
    title: 'API-Route よくある質問',
    subtitle: '接続前に迷いやすいポイントをまとめました。OpenAI 互換 API、モデル利用、プラン、クライアント設定、支払い、専用 AI ゲートウェイについて確認できます。',
    sections: [
      {
        title: 'API 接続とモデル',
        items: [
          {
            question: 'API-Route は OpenAI API と互換性がありますか？',
            answer: 'はい。多くの OpenAI 互換クライアントでは、Base URL をこのサイトの API エンドポイントに変更し、ダッシュボードで作成した API キーを入力するだけで利用できます。',
          },
          {
            question: 'API エンドポイントはどこで確認できますか？',
            answer: 'トップページに利用できる API エンドポイントが表示されます。ログイン後は API キー画面でキーを作成し、Cherry Studio、LibreChat、Claude Code などに設定できます。',
          },
          {
            question: 'どの AI モデルを使えますか？',
            answer: '利用可能なモデルはサイトの設定によって変わります。料金ページでモデル名、入力・出力料金、キャッシュ料金、稼働状態を確認してから選ぶのがおすすめです。',
          },
        ],
      },
      {
        title: 'プラン・課金・支払い',
        items: [
          {
            question: 'プランとコードはどのように使いますか？',
            answer: 'プランページで必要な容量や期間を選び、対応するコードを購入します。ログイン後に利用開始ページでコードを入力すると、該当プランが自動で有効化されます。',
          },
          {
            question: 'API の利用料金はどう計算されますか？',
            answer: 'モデルごとに課金方式が異なります。入力・出力トークン、キャッシュ読み取り、キャッシュ作成、またはリクエスト単位で計算される場合があります。最終的な消費は利用ログで確認できます。',
          },
          {
            question: '暗号資産で支払えますか？',
            answer: 'このサイトで暗号資産決済が有効な場合、チャージ、プラン購入、専用 AI ゲートウェイ開通の画面でネットワークとトークンを選べます。表示されたアドレス、金額、ネットワークをよく確認してください。',
          },
        ],
      },
      {
        title: 'クライアントと安全性',
        items: [
          {
            question: 'どのクライアントやアプリで使えますか？',
            answer: 'アプリページには推奨クライアントと連携アプリを掲載しています。カスタムの OpenAI 互換 Base URL と API キーを設定できるクライアントなら、多くの場合そのまま接続できます。',
          },
          {
            question: 'VSCode で API-Route を設定し、gpt5.5 を使うには？',
            answer: 'cc switch のワンクリック取り込みをおすすめします。gpt5.5 を使う場合は、cc switch でモデルに gpt5.5、ツールに cursor、取り込み先に codex を選び、設定を取り込みます。その後、VSCode 側の AI/Codex 設定で取り込まれた API-Route プロファイルを使います。',
          },
          {
            question: 'Codex app に API-Route を設定するには？',
            answer: 'まずこのサイトで API キーを作成し、API エンドポイントを確認します。cc switch で利用したいモデルを選び、取り込み先を codex にして設定を取り込みます。完了後、Codex app 側でモデル名、Base URL、API キーが想定どおりか確認してください。',
          },
          {
            question: 'Claude Code で API-Route を使うには？',
            answer: 'Claude Code では API-Route の Base URL、API キー、モデル名を設定します。手動で入力することもできますが、cc switch で設定を生成して取り込むと、端点・キー・モデル名の入力ミスを減らせます。',
          },
          {
            question: 'API キーはどのように管理すべきですか？',
            answer: 'API キーは信頼できるクライアントにだけ保存してください。漏えいが疑われる場合は、API キー画面で古いキーを無効化または削除し、新しいキーを作成します。',
          },
          {
            question: 'API 呼び出しが失敗する原因は何ですか？',
            answer: 'キーの入力ミス、プランや残高の不足、モデル名の不一致、Base URL の設定ミス、上流モデルの一時的な問題などが考えられます。まずは利用ログを確認してください。',
          },
        ],
      },
      {
        title: '専用 AI ゲートウェイ',
        items: [
          {
            question: '専用 AI ゲートウェイは誰向けですか？',
            answer: '独自ブランド、ドメイン、モデル価格、決済、販売導線を持つ AI API サイトを運営したい方向けです。このプラットフォームのホスト機能を使いながら、自分のサービスとして展開できます。',
          },
          {
            question: '支払い後に自動で有効化されますか？',
            answer: '専用 AI ゲートウェイの注文が支払われると、同じアカウントに管理権限が付与され、初期設定へ進めます。支払い済みなのに状態が変わらない場合はサポートへ連絡してください。',
          },
        ],
      },
    ],
    cards: [
      { title: '料金を見る', body: 'モデル料金と状態を確認。', to: '/pricing' },
      { title: 'プランを選ぶ', body: '日・週・月・容量から選択。', to: '/packages' },
      { title: 'アプリ連携', body: 'すぐ使えるクライアントを確認。', to: '/apps' },
    ],
    contactTitle: 'まだ疑問がありますか？',
    contactDesc: 'ここにない内容は、ページ下部の Telegram またはお問い合わせリンクからサポートへご連絡ください。',
  },
  ko: {
    badge: 'FAQ',
    title: 'API-Route 자주 묻는 질문',
    subtitle: '연동 전에 많이 묻는 내용을 정리했습니다. OpenAI 호환 API, 모델 사용, 플랜, 클라이언트 설정, 결제, 전용 AI 게이트웨이를 확인하세요.',
    sections: [
      {
        title: 'API 연동과 모델',
        items: [
          {
            question: 'API-Route는 OpenAI API와 호환되나요?',
            answer: '네. 대부분의 OpenAI 호환 클라이언트에서는 Base URL을 이 사이트의 API 엔드포인트로 바꾸고, 대시보드에서 만든 API 키를 입력하면 지원 모델을 호출할 수 있습니다.',
          },
          {
            question: 'API 엔드포인트는 어디에서 확인하나요?',
            answer: '홈페이지에서 사용 가능한 API 엔드포인트를 확인할 수 있습니다. 로그인 후 API 키 페이지에서 키를 만들고 Cherry Studio, LibreChat, Claude Code 같은 도구에 입력하세요.',
          },
          {
            question: '어떤 AI 모델을 지원하나요?',
            answer: '지원 모델은 사이트 설정에 따라 달라집니다. 요금 페이지에서 모델명, 입력·출력 요금, 캐시 요금, 모델 상태를 확인한 뒤 채팅, 글쓰기, 코딩, 이미지, 영상 작업에 맞게 선택하세요.',
          },
        ],
      },
      {
        title: '플랜, 과금, 결제',
        items: [
          {
            question: '플랜과 리딤 코드는 어떻게 사용하나요?',
            answer: '패키지 페이지에서 필요한 용량이나 기간을 고르고 해당 리딤 코드를 구매합니다. 로그인 후 사용 시작 페이지에서 코드를 입력하면 맞는 플랜이 자동으로 활성화됩니다.',
          },
          {
            question: 'API 사용량은 어떻게 과금되나요?',
            answer: '모델마다 과금 방식이 다릅니다. 입력·출력 토큰, 캐시 읽기, 캐시 생성, 호출 횟수 기준으로 계산될 수 있습니다. 최종 사용량은 사용 로그와 계정 기록에서 확인하세요.',
          },
          {
            question: '암호화폐 결제를 지원하나요?',
            answer: '현재 사이트에서 암호화폐 결제가 켜져 있다면 충전, 플랜 구매, 전용 AI 게이트웨이 개통 과정에서 네트워크와 토큰 옵션이 표시됩니다. 주소, 금액, 네트워크를 반드시 확인하세요.',
          },
        ],
      },
      {
        title: '클라이언트와 보안',
        items: [
          {
            question: '어떤 클라이언트나 앱을 사용할 수 있나요?',
            answer: '앱 페이지에서 추천 클라이언트와 연동 앱을 확인할 수 있습니다. 사용자 지정 OpenAI 호환 Base URL과 API 키를 지원하는 클라이언트라면 대부분 연결할 수 있습니다.',
          },
          {
            question: 'VSCode에서 API-Route를 설정하고 gpt5.5를 사용하려면 어떻게 하나요?',
            answer: 'cc switch의 원클릭 가져오기를 권장합니다. gpt5.5를 예로 들면 cc switch에서 모델은 gpt5.5, 도구는 cursor, 가져오기 대상은 codex로 선택한 뒤 설정을 가져오세요. 이후 VSCode의 AI/Codex 설정에서 가져온 API-Route 프로필을 사용하면 됩니다.',
          },
          {
            question: 'Codex app에 API-Route를 설정하려면 어떻게 하나요?',
            answer: '먼저 이 사이트에서 API 키를 만들고 API 엔드포인트를 확인하세요. cc switch에서 사용할 모델을 고르고 가져오기 대상을 codex로 선택해 설정을 가져옵니다. 완료 후 Codex app에서 모델명, Base URL, API 키가 맞는지 확인하세요.',
          },
          {
            question: 'Claude Code에서 API-Route를 사용하려면 어떻게 설정하나요?',
            answer: 'Claude Code에는 API-Route의 Base URL, API 키, 모델명을 설정해야 합니다. 직접 입력할 수도 있지만 cc switch로 설정을 생성하고 가져오면 엔드포인트, 키, 모델명을 잘못 입력할 가능성을 줄일 수 있습니다.',
          },
          {
            question: 'API 키는 어떻게 보호해야 하나요?',
            answer: 'API 키는 신뢰하는 클라이언트에만 저장하세요. 유출이 의심되면 API 키 페이지에서 기존 키를 비활성화하거나 삭제하고 새 키를 만들어 사용하세요.',
          },
          {
            question: 'API 요청이 실패하는 이유는 무엇인가요?',
            answer: '키 오류, 잔액 또는 플랜 비활성, 모델명 불일치, 잘못된 Base URL, 상위 모델의 일시 장애가 흔한 원인입니다. 먼저 사용 로그에서 요청 상태를 확인하세요.',
          },
        ],
      },
      {
        title: '전용 AI 게이트웨이',
        items: [
          {
            question: '전용 AI 게이트웨이는 누구에게 적합한가요?',
            answer: '자체 브랜드, 도메인, 모델 가격, 결제, 홍보 동선을 갖춘 AI API 사이트를 운영하고 싶은 분에게 적합합니다. 이 플랫폼의 호스팅 기능을 바탕으로 자신의 서비스처럼 운영할 수 있습니다.',
          },
          {
            question: '결제 후 자동으로 활성화되나요?',
            answer: '전용 AI 게이트웨이 주문 결제가 완료되면 같은 계정에 관리 권한이 부여되고 초기 설정으로 이어집니다. 결제했는데 상태가 바뀌지 않으면 지원팀에 문의하세요.',
          },
        ],
      },
    ],
    cards: [
      { title: '요금 비교', body: '모델 요금과 상태를 확인하세요.', to: '/pricing' },
      { title: '플랜 선택', body: '일, 주, 월, 용량 기준으로 구매.', to: '/packages' },
      { title: '앱 연동', body: '바로 쓸 수 있는 클라이언트 확인.', to: '/apps' },
    ],
    contactTitle: '더 궁금한 점이 있나요?',
    contactDesc: '여기에 없는 내용은 페이지 하단의 Telegram 또는 문의 링크로 사이트 지원팀에 연락하세요.',
  },
};

function FaqItem({ item, defaultOpen }) {
  return (
    <details
      className="group rounded-2xl border border-page-divider bg-page-surface px-5 py-4 shadow-sm transition-colors open:bg-page-inset"
      open={defaultOpen}
    >
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-left">
        <span className="text-base font-semibold leading-6 text-page">{item.question}</span>
        <ChevronDown className="mt-0.5 h-5 w-5 flex-shrink-0 text-page-muted transition-transform group-open:rotate-180" />
      </summary>
      <p className="mt-3 text-sm leading-7 text-page-secondary">{item.answer}</p>
    </details>
  );
}

function getSectionId(index) {
  return `faq-section-${index + 1}`;
}

export default function Faq() {
  const { i18n, t } = useTranslation();
  const language = normalizeAppLanguage(i18n.resolvedLanguage || i18n.language);
  const copy = FAQ_COPY[language] || FAQ_COPY.en;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
        <div className="space-y-5">
          <div className="inline-flex w-fit items-center rounded-full border border-page-divider bg-page-surface px-3 py-1 text-sm font-semibold text-page">
            <HelpCircle className="mr-1.5 h-3.5 w-3.5 text-page-link" />
            {copy.badge}
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-bold tracking-tight text-page sm:text-4xl lg:text-5xl">
              {copy.title}
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-page-secondary sm:text-base">
              {copy.subtitle}
            </p>
          </div>
        </div>

        <div className="glass rounded-2xl p-4 shadow-sm">
          <div className="grid gap-3">
            {copy.cards.map((card) => (
              <Link
                key={card.to}
                to={card.to}
                className="group rounded-xl border border-page-divider bg-page-surface px-4 py-3 transition-colors hover:bg-page-surface-hover"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600">
                    <Sparkles size={16} />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-page group-hover:text-page-link">
                      {card.title}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-page-secondary">
                      {card.body}
                    </span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="space-y-3 lg:sticky lg:top-24 lg:self-start">
          {copy.sections.map((section, index) => (
            <a
              key={section.title}
              href={`#${getSectionId(index)}`}
              className="block rounded-xl border border-page-divider bg-page-surface px-4 py-3 text-sm font-semibold text-page-secondary transition-colors hover:bg-page-surface-hover hover:text-page"
            >
              {section.title}
            </a>
          ))}
        </aside>

        <div className="space-y-8">
          {copy.sections.map((section, sectionIndex) => (
            <section key={section.title} id={getSectionId(sectionIndex)} className="scroll-mt-28">
              <div className="mb-4 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-page-success" />
                <h2 className="text-xl font-semibold tracking-tight text-page">{section.title}</h2>
              </div>
              <div className="grid gap-3">
                {section.items.map((item, itemIndex) => (
                  <FaqItem
                    key={item.question}
                    item={item}
                    defaultOpen={sectionIndex === 0 && itemIndex === 0}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-2xl border border-dashed border-page-divider bg-page-surface px-5 py-6 text-center">
        <LifeBuoy className="mx-auto h-8 w-8 text-page-link" />
        <h2 className="mt-3 text-lg font-semibold text-page">{copy.contactTitle}</h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-page-secondary">
          {copy.contactDesc}
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link to="/pricing" className="btn-secondary">
            {t('nav.pricing')}
          </Link>
          <Link to="/packages" className="btn-primary">
            {t('nav.packages')}
          </Link>
        </div>
      </section>
    </div>
  );
}
