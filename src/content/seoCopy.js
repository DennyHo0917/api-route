export const SEO_COPY = {
  zh: {
    home: {
      title: '一个 API，连接全球主流 AI 模型',
      description: 'API-Route 是一个 OpenAI 兼容的多模型 AI API 网关，通过同一个 Base URL 和 API Key 调用 GPT、Claude、Gemini、Kimi、千问等主流模型。',
      questions: [
        ['API-Route 是什么？', 'API-Route 是一个兼容 OpenAI 格式的多模型 AI API 网关，可用统一 Base URL 和 API Key 调用多个主流模型。'],
        ['可以用一个 API 调用 GPT、Claude、Gemini、Kimi 和千问吗？', '可以。你可以通过 API-Route 的 OpenAI 兼容接口接入 GPT、Claude、Gemini、Kimi、千问等模型，并统一管理价格、余额、套餐和调用记录。'],
        ['适合哪些场景？', '适合 AI 产品开发、SaaS 集成、Claude Code、VSCode、LibreChat、自动化工作流，以及需要多模型统一路由的团队。'],
      ],
    },
    pricing: {
      title: 'AI API 价格对比、模型费率与 Token 成本',
      description: '比较 GPT、Claude、Gemini 等模型在 API-Route 的输入价格、输出价格、缓存费用、按次计费和官方参考价，快速估算 AI API token 成本与不同模型费用。',
      questions: [
        ['如何比较 OpenAI、Claude 和 Gemini 的 API 价格？', '先看输入和输出 token 单价，再结合缓存、按次计费、上下文长度和你的调用量估算总成本。'],
        ['AI API token 成本怎么估算？', '文本调用成本约等于输入 token 成本加输出 token 成本，再加缓存相关费用；图片、音频、视频按页面表格的规格或按次价格计算。'],
        ['为什么要看官方参考价？', '官方参考价用于对照公开价格，实际扣费以 API-Route 页面价格、账户记录和调用日志为准。'],
      ],
    },
    packages: {
      title: '套餐与余额充值',
      description: '先充值账户余额，再按需购买天卡、周卡、月卡等 AI API 套餐；查看套餐额度、有效期与适用场景。',
    },
    apps: {
      title: 'OpenAI 兼容客户端与 AI 应用接入',
      description: '查看可接入 API-Route 的 AI 应用、OpenAI 兼容客户端、LibreChat、Claude Code、VSCode 和工作流工具，通过统一 Base URL、API Key 和模型名快速开始使用。',
      questions: [
        ['哪些客户端可以使用 OpenAI compatible Base URL？', '支持自定义 OpenAI 兼容 Base URL、API Key 和模型名的客户端通常都可以接入 API-Route。'],
        ['LibreChat 如何接入 API-Route？', '在 LibreChat 的自定义 OpenAI endpoint 中填写 API-Route 的 Base URL、API Key 和模型名，即可通过统一账户调用可用模型。'],
        ['Claude Code 或 VSCode 如何接入？', '在客户端里填写 API-Route 的 Base URL、API Key 和定价页显示的模型名，也可以用 cc switch 导入配置。'],
      ],
    },
    docs: {
      title: 'Codex、Claude Code、Cursor、VS Code、OpenClaw 与 Hermes API 接入',
      description: '推荐使用 CC Switch 一键把 API-Route 接入 Codex、Claude Code、OpenClaw、Hermes、Gemini CLI 或 OpenCode，也可手动配置，并在 Cursor、VS Code 中使用。',
      questions: [
        ['如何给 Codex 配置第三方 API？', '在 API 接入工作台选择已验证的密钥、可用模型和节点，目标应用选择 Codex，再通过 CC Switch 一键导入；手动配置可使用生成的 config.toml 和 auth.json。'],
        ['Claude Code 如何接入 API-Route？', '在 API 接入工作台选择 Claude Code 并导入配置。Claude Code 使用不带 /v1 的 Anthropic 格式根地址，不要直接套用 OpenAI SDK Base URL。'],
        ['CC Switch 如何导入 API-Route？', '先安装并打开 CC Switch，再从 API 接入工作台选择密钥、模型、节点和目标应用，点击一键导入并确认 Provider 已启用。'],
        ['OpenClaw 或 Hermes 如何接入 API-Route？', '在 API 接入工作台选择 OpenClaw 或 Hermes，通过 CC Switch 一键导入；无法使用 CC Switch 时，可下载页面生成的手动配置文件。'],
        ['VSCode 如何使用 API-Route？', 'VSCode 本身是编辑器。应配置在 VSCode 中实际运行的 Codex、Claude Code 或相应扩展，再从编辑器或集成终端调用。'],
        ['Cursor 如何使用 API-Route？', '当前可在 Cursor 集成终端中运行已经接入 API-Route 的 Codex 或 Claude Code；本站暂不声称可以替换 Cursor 内置模型供应商。'],
      ],
    },
    subSite: {
      title: 'AI API 分站与白标转售平台',
      description: '为已有用户或客户搭建白标 AI API 分站，统一管理品牌、模型售价、套餐、充值、API Key 和调用记录，无需自己寻找上游、购买 VPS 或部署服务。',
      metaTitle: '如何搭建 AI API 网关？开通独立 AI API 平台',
      metaDescription: '想搭建自己的 AI API 网关或 API 分发平台？API-Route 已打包上游接入、计费、充值、套餐、用户和日志能力；无需从零部署传统 API 中转站，直接开通独立平台。',
      questions: [
        ['平台的收入模式是什么？', '你可以为现有客户设置模型售价和套餐，收入取决于客户的实际充值与使用情况；平台不提供客户，也不承诺收入或利润。'],
        ['可以作为 AI API 代理平台使用吗？', '可以。它适合想用自己品牌销售 AI API 套餐、统一管理用户、余额、API Key 和调用记录的人。'],
        ['可以销售自己的 AI API 套餐吗？', '可以。你可以按天、周、月或额度包装套餐，并根据自己的渠道和客户设置销售策略。'],
        ['开通后多久能使用？', '支付确认后系统会自动授予管理权限，并引导你继续完成站点初始化。'],
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
    keywords: 'AI API,AI API 中转站,API 中转站,OpenAI 中转站,ChatGPT API 中转站,Claude API 中转站,AI API Gateway,AI API GATEWAY,LLM API Gateway,OpenAI API Gateway,API 聚合,OpenAI 兼容接口,OpenAI compatible Base URL,Codex API,Claude Code API,CC Switch,VSCode API,Cursor API,LibreChat API,AI API 价格对比,AI API token 成本,大模型 API,多模型 API,独立 AI API 平台,API-Route',
    locale: 'zh_CN',
    language: 'zh-CN',
    serviceType: '多模型 AI API 聚合与统一调用服务',
  },
  en: {
    home: {
      title: "One API for the World's Leading AI Models",
      description: 'API-Route is an OpenAI-compatible multi-model AI API gateway. Use one Base URL and API key to call GPT, Claude, Gemini, Kimi, Qwen, and other leading models.',
      questions: [
        ['What is API-Route?', 'API-Route is an OpenAI-compatible multi-model AI API gateway that lets you call multiple leading models with one Base URL and API key.'],
        ['Can I call GPT, Claude, Gemini, Kimi, and Qwen with one API?', 'Yes. API-Route provides an OpenAI-compatible API for GPT, Claude, Gemini, Kimi, Qwen, and other models with unified pricing, balance, plans, and usage logs.'],
        ['What is it for?', 'It fits AI product development, SaaS integrations, Claude Code, VS Code, LibreChat, automation workflows, and teams that need unified multi-model routing.'],
      ],
    },
    pricing: {
      title: 'AI API Pricing Comparison and Token Cost',
      description: 'Compare GPT, Claude, Gemini, and other AI model rates on API-Route to estimate token and per-call costs.',
      questions: [
        ['How do I compare OpenAI, Claude, and Gemini API pricing?', 'Start with input and output token rates, then include cache pricing, per-call models, context length, and expected request volume.'],
        ['How do I estimate AI API token cost?', 'For text models, estimate input tokens times input rate plus output tokens times output rate plus cache-related costs. Image, audio, and video models follow the displayed spec or per-call price.'],
        ['Why include official reference pricing?', 'Official references help compare public provider prices. Actual billing follows API-Route rates, account records, and usage logs.'],
      ],
    },
    packages: {
      title: 'AI API Plans and Packages',
      description: 'Compare daily, weekly, monthly, and quota-based AI API plans for one OpenAI-compatible API. Choose a package by quota, validity period, model access, and use case.',
    },
    apps: {
      title: 'OpenAI-Compatible Clients and AI App Integrations',
      description: 'Find AI apps, OpenAI-compatible clients, LibreChat, Claude Code, VS Code, and workflow tools that connect to API-Route with one Base URL, API key, and model name.',
      questions: [
        ['Which clients can use an OpenAI-compatible Base URL?', 'Any client that lets you set a custom OpenAI-compatible Base URL, API key, and model name can usually connect to API-Route.'],
        ['How do I connect LibreChat to API-Route?', 'Add API-Route as a custom OpenAI endpoint in LibreChat, then use the Base URL, API key, and model name shown by this site.'],
        ['How do Claude Code or VS Code connect?', 'Set API-Route as the Base URL, use your API key, and choose a supported model name from the Pricing page, or import the profile with cc switch.'],
      ],
    },
    docs: {
      title: 'Connect Codex, Claude Code, Cursor, VS Code, OpenClaw, and Hermes',
      description: 'Use the recommended CC Switch one-click import or manual configuration to connect API-Route to Codex, Claude Code, OpenClaw, Hermes, Gemini CLI, OpenCode, Cursor, or VS Code.',
      questions: [
        ['How do I configure a third-party API in Codex?', 'Choose a verified key, available model, and endpoint in API Access, select Codex as the target, and import through CC Switch. Manual setup uses the generated config.toml and auth.json values.'],
        ['How do I connect Claude Code to API-Route?', 'Generate and import the Claude Code profile in API Access. Claude Code uses the Anthropic-style root endpoint without /v1, not the OpenAI SDK Base URL.'],
        ['How do I import API-Route with CC Switch?', 'Install and open CC Switch, then choose the key, model, endpoint, and target app in API Access. Run the one-click import and confirm the provider is enabled.'],
        ['How do I connect OpenClaw or Hermes to API-Route?', 'Choose OpenClaw or Hermes in API Access and import with CC Switch. If CC Switch is unavailable, download the generated manual configuration file.'],
        ['How does VS Code use API-Route?', 'VS Code is the editor. Configure the Codex, Claude Code, or other supported AI client that actually runs inside VS Code, then use it from the editor or integrated terminal.'],
        ['How does Cursor use API-Route?', 'The currently supported path is to run a configured Codex or Claude Code client in Cursor’s integrated terminal. This guide does not claim to replace Cursor’s built-in model provider.'],
      ],
    },
    subSite: {
      title: 'AI API Reseller Platform',
      description: 'Start an AI API reseller business with your own white-label platform. Set model pricing, sell plans, accept top-ups, and route traffic automatically.',
      questions: [
        ['How does the platform generate revenue?', 'You can set model prices and plans for your existing customers. Revenue depends on actual customer top-ups and usage; the platform does not provide customers or guarantee revenue.'],
        ['Can I start an AI API business without building infrastructure?', 'Yes. Upstream access, hosting, payments, user accounts, API keys, balance, and usage logs are already packaged so you can focus on branding, pricing, and customers.'],
        ['Can I sell my own AI API plans?', 'Yes. You can package access by day, week, month, or quota and sell plans under your own brand.'],
        ['How soon can I use it?', 'After payment is confirmed, the system grants management access and guides initialization.'],
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
    keywords: 'AI API,AI API Gateway,AI API GATEWAY,LLM API Gateway,OpenAI API Gateway,API gateway,API proxy,AI API proxy,API aggregation,OpenAI compatible API,OpenAI compatible Base URL,custom OpenAI base URL,Codex API,Claude Code API,CC Switch,VS Code API,Cursor API,LibreChat API,AI API pricing comparison,AI API token cost,LLM API,multi-model API,white-label AI API platform,AI API reseller,sell AI API access,API-Route',
    locale: 'en_US',
    language: 'en',
    serviceType: 'Multi-model AI API aggregation and routing service',
  },
  ja: {
    home: {
      title: '主要 AI モデルをひとつの API で',
      description: 'API-Route は OpenAI 互換のマルチモデル AI API ゲートウェイです。ひとつの Base URL と API キーで GPT、Claude、Gemini、Kimi、Qwen などを呼び出せます。',
      questions: [
        ['API-Route とは何ですか？', 'API-Route は OpenAI 互換のマルチモデル AI API ゲートウェイで、ひとつの Base URL と API キーで複数の主要モデルを呼び出せます。'],
        ['GPT、Claude、Gemini、Kimi、Qwen をひとつの API で使えますか？', 'はい。API-Route の OpenAI 互換 API で GPT、Claude、Gemini、Kimi、Qwen などを利用し、料金、残高、プラン、利用ログをまとめて管理できます。'],
        ['どんな用途に向いていますか？', 'AI プロダクト開発、SaaS 連携、Claude Code、VSCode、LibreChat、自動化ワークフロー、複数モデルの統一ルーティングに向いています。'],
      ],
    },
    pricing: {
      title: 'AI API 料金比較・モデル単価・トークンコスト',
      description: 'API-Route で利用できる GPT、Claude、Gemini、Kimi、Qwen などの入力料金、出力料金、キャッシュ料金、回数課金、公式参考価格を比較し、AI API のトークンコストを見積もれます。',
      questions: [
        ['OpenAI、Claude、Gemini の API 料金はどう比較しますか？', '入力と出力のトークン単価に加えて、キャッシュ料金、回数課金、コンテキスト長、想定呼び出し回数を合わせて見ます。'],
        ['AI API のトークンコストはどう見積もりますか？', 'テキストモデルでは、入力トークン数と入力単価、出力トークン数と出力単価、キャッシュ関連費用を合計します。画像、音声、動画は表の仕様や回数単価に従います。'],
        ['公式参考価格は何に使いますか？', '公開されている公式価格との比較に使います。実際の課金は API-Route の料金、アカウント記録、利用ログに従います。'],
      ],
    },
    packages: {
      title: 'AI API プランと残高チャージ',
      description: 'アカウント残高をチャージしてから、日次、週次、月次、容量ベースの AI API プランを必要に応じて申し込めます。クォータ、有効期間、利用シーンも確認できます。',
    },
    apps: {
      title: 'OpenAI 互換クライアントと AI アプリ連携',
      description: 'API-Route に接続できる AI アプリ、OpenAI 互換クライアント、LibreChat、Claude Code、VSCode、ワークフローツールを確認できます。',
      questions: [
        ['OpenAI 互換 Base URL を使えるクライアントは？', 'カスタムの OpenAI 互換 Base URL、API キー、モデル名を設定できるクライアントなら、多くの場合 API-Route に接続できます。'],
        ['LibreChat は API-Route に接続できますか？', 'LibreChat のカスタム OpenAI endpoint に API-Route の Base URL、API キー、モデル名を設定します。'],
        ['Claude Code や VSCode で使うには？', 'API-Route の Base URL、API キー、料金ページのモデル名を設定するか、cc switch でプロファイルを取り込みます。'],
      ],
    },
    docs: {
      title: 'Codex・Claude Code・Cursor・VS Code・OpenClaw・Hermes API 接続',
      description: '推奨の CC Switch ワンクリック導入または手動設定で、Codex、Claude Code、OpenClaw、Hermes、Gemini CLI、OpenCode、Cursor、VS Code から API-Route を利用できます。',
      questions: [
        ['Codex に外部 API を設定するには？', 'API 接続ワークベンチで確認済みキー、利用可能なモデル、接続先を選び、対象アプリを Codex にして CC Switch から取り込みます。手動設定では生成された config.toml と auth.json を使います。'],
        ['Claude Code を API-Route に接続するには？', 'Claude Code 用プロファイルを生成して取り込みます。Claude Code は OpenAI SDK 用の /v1 URL ではなく、Anthropic 形式のルート URL を使います。'],
        ['CC Switch で API-Route を取り込むには？', 'CC Switch を起動し、API 接続ワークベンチでキー、モデル、接続先、対象アプリを選び、ワンクリック取り込みを実行します。'],
        ['OpenClaw または Hermes を API-Route に接続するには？', 'API 接続ワークベンチで OpenClaw または Hermes を選び、CC Switch から取り込みます。利用できない場合は生成された手動設定ファイルを使います。'],
        ['VSCode から API-Route を使うには？', 'VSCode 本体ではなく、VSCode 内で実際に動かす Codex、Claude Code、または対応拡張機能を設定します。'],
        ['Cursor から API-Route を使うには？', '現在は Cursor の統合ターミナルで設定済みの Codex または Claude Code を実行する方法に対応しています。Cursor 内蔵 Provider の置き換えを案内するものではありません。'],
      ],
    },
    subSite: {
      title: 'AI API リセラープラットフォーム',
      description: '既存顧客向けにホワイトラベルの AI API プラットフォームを構築できます。ブランド、モデル価格、プラン、残高、API キー、利用履歴を一元管理し、上流接続や VPS 運用は不要です。',
      questions: [
        ['収益の仕組みはどうなっていますか？', '既存顧客向けにモデル価格やプランを設定できます。収益は実際のチャージと利用状況によって決まり、顧客獲得や収益を保証するものではありません。'],
        ['インフラを作らず AI API ビジネスを始められますか？', 'はい。上流接続、ホスティング、決済、アカウント、API キー、残高、利用ログの基盤が用意されています。'],
        ['自分の AI API プランを販売できますか？', 'はい。日、週、月、容量単位でプランを作り、自分のブランドで販売できます。'],
        ['いつ使い始められますか？', '支払い確認後、管理権限が付与され初期化へ進めます。'],
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
    keywords: 'AI API,AI API Gateway,AI API GATEWAY,LLM API Gateway,OpenAI API Gateway,API 集約,OpenAI 互換 API,OpenAI 互換 Base URL,Codex API,Claude Code API,CC Switch,VSCode API,Cursor API,LibreChat API,AI API 料金比較,AI API トークンコスト,LLM API,マルチモデル API,API-Route',
    locale: 'ja_JP',
    language: 'ja',
    serviceType: '複数モデル対応 AI API 集約・ルーティングサービス',
  },
  ko: {
    home: {
      title: '주요 AI 모델을 하나의 API로',
      description: 'API-Route는 OpenAI 호환 멀티 모델 AI API 게이트웨이입니다. 하나의 Base URL과 API 키로 GPT, Claude, Gemini, Kimi, Qwen 등 주요 모델을 호출하세요.',
      questions: [
        ['API-Route는 무엇인가요?', 'API-Route는 하나의 Base URL과 API 키로 여러 주요 모델을 호출할 수 있는 OpenAI 호환 멀티 모델 AI API 게이트웨이입니다.'],
        ['하나의 API로 GPT, Claude, Gemini, Kimi, Qwen을 호출할 수 있나요?', '네. API-Route의 OpenAI 호환 API로 GPT, Claude, Gemini, Kimi, Qwen 등을 호출하고 요금, 잔액, 플랜, 사용 로그를 통합 관리할 수 있습니다.'],
        ['어떤 용도에 적합한가요?', 'AI 제품 개발, SaaS 연동, Claude Code, VSCode, LibreChat, 자동화 워크플로, 멀티 모델 통합 라우팅에 적합합니다.'],
      ],
    },
    pricing: {
      title: 'AI API 요금 비교, 모델 단가 및 토큰 비용',
      description: 'API-Route에서 지원하는 GPT, Claude, Gemini, Kimi, Qwen 등 모델의 입력 요금, 출력 요금, 캐시 요금, 호출당 과금, 공식 참고가를 비교하고 AI API 토큰 비용을 빠르게 추정하세요.',
      questions: [
        ['OpenAI, Claude, Gemini API 요금은 어떻게 비교하나요?', '입력/출력 토큰 단가를 먼저 보고 캐시 요금, 호출당 과금, 문맥 길이, 예상 호출량을 함께 계산합니다.'],
        ['AI API 토큰 비용은 어떻게 추정하나요?', '텍스트 모델은 입력 토큰 비용, 출력 토큰 비용, 캐시 관련 비용을 더해 계산합니다. 이미지, 오디오, 영상 모델은 표의 사양이나 호출당 가격을 따릅니다.'],
        ['공식 참고가는 왜 보나요?', '공개된 공식 가격과 비교하기 위한 값입니다. 실제 과금은 API-Route 요금, 계정 기록, 사용 로그를 기준으로 합니다.'],
      ],
    },
    packages: {
      title: 'AI API 플랜과 잔액 충전',
      description: '계정 잔액을 먼저 충전한 뒤 일간, 주간, 월간, 용량 기반 AI API 플랜을 필요에 맞게 구독하세요. 쿼터, 유효 기간, 사용 시나리오도 확인할 수 있습니다.',
    },
    apps: {
      title: 'OpenAI 호환 클라이언트와 AI 앱 연동',
      description: 'API-Route에 연결할 수 있는 AI 앱, OpenAI 호환 클라이언트, LibreChat, Claude Code, VSCode, 워크플로 도구를 확인하세요.',
      questions: [
        ['OpenAI 호환 Base URL을 사용할 수 있는 클라이언트는 무엇인가요?', '사용자 지정 OpenAI 호환 Base URL, API 키, 모델명을 설정할 수 있는 클라이언트라면 대부분 API-Route에 연결할 수 있습니다.'],
        ['LibreChat은 API-Route에 연결할 수 있나요?', 'LibreChat의 사용자 지정 OpenAI endpoint에 API-Route Base URL, API 키, 모델명을 입력하면 됩니다.'],
        ['Claude Code나 VSCode에서는 어떻게 사용하나요?', 'API-Route Base URL, API 키, 요금 페이지의 모델명을 설정하거나 cc switch로 프로필을 가져오면 됩니다.'],
      ],
    },
    docs: {
      title: 'Codex, Claude Code, Cursor, VS Code, OpenClaw, Hermes API 연결',
      description: '권장 방식인 CC Switch 원클릭 가져오기 또는 수동 설정으로 Codex, Claude Code, OpenClaw, Hermes, Gemini CLI, OpenCode, Cursor, VS Code에서 API-Route를 사용할 수 있습니다.',
      questions: [
        ['Codex에 타사 API를 설정하려면 어떻게 하나요?', 'API 연결 워크벤치에서 검증한 키, 사용 가능한 모델, 엔드포인트를 선택하고 대상 앱을 Codex로 지정해 CC Switch로 가져옵니다. 수동 설정은 생성된 config.toml과 auth.json을 사용합니다.'],
        ['Claude Code를 API-Route에 연결하려면 어떻게 하나요?', 'Claude Code 프로필을 생성해 가져오세요. Claude Code는 OpenAI SDK의 /v1 주소가 아니라 Anthropic 형식의 루트 주소를 사용합니다.'],
        ['CC Switch로 API-Route를 가져오려면 어떻게 하나요?', 'CC Switch를 실행하고 API 연결 워크벤치에서 키, 모델, 엔드포인트, 대상 앱을 선택한 뒤 원클릭 가져오기를 실행합니다.'],
        ['OpenClaw 또는 Hermes를 API-Route에 연결하려면 어떻게 하나요?', 'API 연결 워크벤치에서 OpenClaw 또는 Hermes를 선택해 CC Switch로 가져옵니다. CC Switch를 사용할 수 없다면 생성된 수동 설정 파일을 사용하세요.'],
        ['VS Code에서 API-Route를 사용하려면 어떻게 하나요?', 'VS Code 자체가 아니라 VS Code 안에서 실제로 실행하는 Codex, Claude Code 또는 지원 확장을 설정합니다.'],
        ['Cursor에서 API-Route를 사용하려면 어떻게 하나요?', '현재는 Cursor 통합 터미널에서 설정된 Codex 또는 Claude Code를 실행하는 방식을 지원합니다. Cursor 내장 Provider를 교체한다고 안내하지 않습니다.'],
      ],
    },
    subSite: {
      title: 'AI API 리셀러 플랫폼',
      description: '기존 고객을 위한 화이트라벨 AI API 플랫폼을 구축할 수 있습니다. 브랜드, 모델 가격, 플랜, 충전, API 키, 사용 기록을 통합 관리하며 상위 연동이나 VPS 운영은 필요하지 않습니다.',
      questions: [
        ['수익 구조는 어떻게 되나요?', '기존 고객을 대상으로 모델 가격과 플랜을 설정할 수 있습니다. 수익은 실제 충전과 사용량에 따라 달라지며, 플랫폼은 고객이나 수익을 보장하지 않습니다.'],
        ['인프라를 만들지 않고 AI API 사업을 시작할 수 있나요?', '네. 상위 연동, 호스팅, 결제, 계정, API 키, 잔액, 사용 로그 기반이 이미 패키지로 제공됩니다.'],
        ['내 AI API 플랜을 판매할 수 있나요?', '네. 일, 주, 월, 용량 기준 플랜을 만들고 자신의 브랜드로 판매할 수 있습니다.'],
        ['언제부터 사용할 수 있나요?', '결제 확인 후 관리 권한이 부여되고 초기화로 안내됩니다.'],
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
    keywords: 'AI API,AI API Gateway,AI API GATEWAY,LLM API Gateway,OpenAI API Gateway,API 집약,OpenAI 호환 API,OpenAI 호환 Base URL,Codex API,Claude Code API,CC Switch,VS Code API,Cursor API,LibreChat API,AI API 요금 비교,AI API 토큰 비용,LLM API,멀티 모델 API,API-Route',
    locale: 'ko_KR',
    language: 'ko',
    serviceType: '멀티 모델 AI API 집약 및 라우팅 서비스',
  },
};
