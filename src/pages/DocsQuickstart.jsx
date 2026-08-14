import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_ENDPOINTS } from '../components/ConfigExporter';
import DocsPageFrame, { useDocsActiveSection } from '../components/DocsLayout';
import { normalizeAppLanguage } from '../i18n/languageUtils';

const COPY = {
  en: {
    eyebrow: 'Getting started',
    title: 'Start using API-Route',
    description: 'Choose AI Chat, API Access, or an independent AI API platform, then follow the shortest path to your first successful use.',
    directoryTitle: 'On this page',
    directory: [
      ['choose', 'Choose a path'],
      ['prepare', 'Before you start'],
      ['chat', 'Use AI Chat'],
      ['api', 'Connect an API'],
      ['basics', 'Basic API calls'],
      ['platform', 'Launch a platform'],
      ['troubleshooting', 'Troubleshooting'],
    ],
    choose: {
      kicker: 'Choose a path',
      title: 'What do you want to do?',
      body: 'The home page has two main entrances for using models. Platform setup is a separate path for operators.',
      successLabel: 'You are done when:',
      items: [
        {
          title: 'Use AI directly',
          description: 'Chat with models, analyze images, or generate images directly in the browser without configuring another tool.',
          success: 'AI Chat returns a reply or generated image.',
          to: '/chats',
          link: 'Open AI Chat',
        },
        {
          title: 'Connect a tool or app',
          description: 'Connect Codex, Claude Code, OpenClaw, Hermes, Gemini CLI, OpenCode, and other supported clients. Configured clients can also run inside Cursor or VS Code.',
          success: 'The client receives a test reply and the request appears in Usage Logs.',
          to: '/api-connect',
          link: 'Open API Access',
        },
        {
          title: 'Launch your own platform',
          description: 'For operators with customers, a community, or an existing sales channel who need a branded AI API site.',
          success: 'Payment is confirmed and the account receives platform management access.',
          to: '/ai-api-reseller-platform',
          link: 'Learn about the platform',
        },
      ],
    },
    prepare: {
      kicker: 'Before you start',
      title: 'Prepare your account and credit',
      body: 'These points apply whether you use AI Chat or connect an API.',
      steps: [
        ['Sign in', 'Create an account or sign in with the account that will use the models.'],
        ['Add credit', 'Top-ups support Alipay, Stripe, and crypto. The methods currently shown on the Top Up page are the available methods.'],
        ['Choose how to pay for usage', 'Calls can consume account balance directly, or you can use balance to buy a plan. Balance does not expire; plans can offer discounted usage but have a validity period and usage limits.'],
      ],
      note: 'If you are unsure, add balance first and use pay-as-you-go. You can buy a plan later when your usage becomes predictable.',
      links: [
        ['/topup', 'Top up balance'],
        ['/topup/packages', 'View plans'],
      ],
    },
    chat: {
      kicker: 'AI Chat',
      title: 'Use AI Chat in the browser',
      body: 'AI Chat is the shortest path when you want to use a model without configuring an external client.',
      steps: [
        ['Open AI Chat', 'Click AI Chat on the home page after signing in.'],
        ['Create a key if prompted', 'AI Chat uses your own API key. If no key exists, follow the prompt to create one and then return.'],
        ['Choose a model', 'Select the model type and a model that is currently available.'],
        ['Send your first request', 'Enter a question or task and send it. A normal model reply means setup is complete.'],
      ],
      abilitiesTitle: 'What you can do',
      abilities: [
        'Chat with currently listed, product-supported text models.',
        'Upload an image for models that support image understanding.',
        'Generate an image with an available text-to-image model.',
      ],
      notesTitle: 'Important notes',
      notes: [
        'Model and attachment availability depends on the model selected on the page.',
        'Conversation history is stored only in the current browser.',
        'If balance is insufficient, top up and return to send the preserved message.',
      ],
      links: [['/chats', 'Open AI Chat']],
    },
    api: {
      kicker: 'API Access',
      title: 'Complete your first API call',
      body: 'You can import with CC Switch or configure the client manually. CC Switch is recommended because it is simpler, but it is not required.',
      downloadCta: 'Download CC Switch and clients',
      steps: [
        ['Check your balance', 'Make sure the account has enough balance for a test request.'],
        ['Open API Access', 'Click API Access on the home page.'],
        ['Create an API key if needed', 'If no enabled key is available, create one and return to API Access.'],
        ['Choose the connection details', 'Select an enabled key, an available model, an endpoint, and the target client.'],
        ['Choose a configuration method', 'Use CC Switch for one-click import, or switch to Manual Configuration and download the generated configuration file.'],
        ['Send a test message', 'Open the target client and send: “Reply with OK and tell me the model you are using.”'],
        ['Verify the result', 'A normal reply plus a successful entry in Usage Logs means the connection works.'],
      ],
      recommendedTitle: 'Recommended: one-click import with CC Switch',
      recommended: [
        'After installing and opening CC Switch, you can import the key, model, and endpoint into the target client with one click.',
        'Supports Codex, Claude Code, Gemini CLI, OpenCode, OpenClaw, and Hermes.',
      ],
      fallbackTitle: 'Alternative: manual configuration',
      fallback: [
        'Choose Manual Configuration in API Access if you prefer not to install CC Switch.',
        'Select the target client, then copy or download the generated configuration file and place it at the path shown on the page.',
      ],
      successTitle: 'Success criteria',
      success: [
        'The target client returns a normal model response.',
        'Usage Logs show the request status and token usage.',
      ],
      links: [
        ['/api-connect', 'Open API Access'],
        ['/api-keys', 'Manage API keys'],
        ['/dashboard/logs', 'View Usage Logs'],
      ],
    },
    basics: {
      kicker: 'Basic API calls',
      title: 'Verify the API with cURL',
      body: 'Use the endpoint selected in API Access, an enabled API key, and an exact model ID returned by the model list. Never expose an API key in frontend code or a public repository.',
      endpointLabel: 'Example endpoint used below',
      modelsTitle: 'List models available to the key',
      modelsBody: 'This request verifies the endpoint and API key, then returns the model IDs the key can call.',
      requestTitle: 'Send a minimal chat request',
      requestBody: 'Replace sk-your-api-key and YOUR_MODEL_ID. Use one complete model ID returned by the previous request.',
    },
    platform: {
      kicker: 'For operators',
      title: 'Launch your own AI API platform',
      body: 'This path is for people who already have customers, a community, or a sales channel and want to provide AI API access under their own brand.',
      steps: [
        ['Review the platform page', 'Open the independent platform page and confirm that the product and operating responsibilities fit your needs.'],
        ['Sign in', 'Use the account that will own and manage the platform.'],
        ['Enter the platform details', 'Provide the platform name and its URL slug.'],
        ['Choose a payment method', 'Use one of the payment methods currently enabled on the page. Crypto payments also require a network and token.'],
        ['Pay the setup fee', 'Complete payment in the opened payment flow.'],
        ['Wait for confirmation', 'After payment is confirmed, the same account receives management access and can continue initialization.'],
      ],
      afterTitle: 'Recommended setup order after activation',
      after: [
        'Set the platform name, logo, brand information, and domain.',
        'Choose which models to list and set customer prices.',
        'Configure top-ups and plans.',
        'Test registration, API keys, balance deduction, and a real model call.',
        'Publish the platform address and start directing your own users to it.',
      ],
      notesTitle: 'Before you open a platform',
      notes: [
        'You do not need to buy a VPS or connect upstream model providers yourself.',
        'The platform supplies the core account, payment, billing, API key, and log flows.',
        'You remain responsible for customer acquisition, pricing, support, and daily operation.',
        'The platform does not provide customers or guarantee revenue.',
      ],
      links: [['/ai-api-reseller-platform', 'Learn about and open a platform']],
    },
    troubleshooting: {
      kicker: 'Troubleshooting',
      title: 'Find the problem by what you see',
      body: 'Start with the visible symptom instead of changing every setting at once.',
      items: [
        ['No API key is available', 'Create and enable a key, then return to AI Chat or API Access.'],
        ['The account has insufficient balance', 'Top up the account, then retry the preserved message or test request.'],
        ['A model is missing', 'Only currently listed models appear. Use the model list shown on the current page.'],
        ['AI Chat cannot upload an image', 'The selected model does not support image attachments. Switch to an image-capable model.'],
        ['The client does not respond', 'Recheck the selected key, model, target client, and generated configuration, then send one new test request.'],
        ['No successful call appears', 'Send a test request first, then open Usage Logs and check the latest status.'],
        ['Platform payment is still pending', 'Refresh using the same account after payment confirmation. If access still does not update, contact site support.'],
      ],
    },
  },
  zh: {
    eyebrow: '使用指南',
    title: '开始使用 API-Route',
    description: '选择 AI Chat、API 接入或独立平台，按照对应步骤完成第一次成功使用。',
    directoryTitle: '本页目录',
    directory: [
      ['choose', '选择使用方式'],
      ['prepare', '开始前准备'],
      ['chat', '使用 AI Chat'],
      ['api', '完成 API 接入'],
      ['basics', '基础 API 操作'],
      ['platform', '开通独立平台'],
      ['troubleshooting', '问题排查'],
    ],
    choose: {
      kicker: '选择使用方式',
      title: '你想用 API-Route 做什么？',
      body: '首页的两个主要入口分别面向网页使用和技术接入；独立平台则面向有运营需求的用户。',
      successLabel: '完成标志：',
      items: [
        {
          title: '直接使用 AI',
          description: '无需配置其他工具，直接在网页中进行模型对话、图片理解或图片生成。',
          success: 'AI Chat 正常返回文字或生成的图片。',
          to: '/chats',
          link: '打开 AI Chat',
        },
        {
          title: '接入工具或应用',
          description: '支持接入 Codex、Claude Code、OpenClaw、Hermes、Gemini CLI、OpenCode 等客户端；配置后的客户端也可以在 Cursor、VS Code 中使用。',
          success: '客户端收到测试回复，并且调用日志出现成功记录。',
          to: '/api-connect',
          link: '进入 API 接入',
        },
        {
          title: '搭建自己的平台',
          description: '适合已经有客户、社群或销售渠道，希望使用自己品牌运营 AI API 的用户。',
          success: '支付确认后，当前账户获得平台管理权限。',
          to: '/ai-api-reseller-platform',
          link: '了解独立平台',
        },
      ],
    },
    prepare: {
      kicker: '开始前准备',
      title: '准备账户和余额',
      body: '无论使用 AI Chat 还是接入 API，都先确认以下内容。',
      steps: [
        ['登录账户', '注册或登录实际使用模型的账户。'],
        ['充值余额', '支持支付宝、Stripe 和加密货币充值，实际可用方式以充值页面当前显示为准。'],
        ['选择扣费方式', '调用可以直接消耗账户余额，也可以使用余额购买套餐。余额不会过期；套餐通常有价格优惠，但存在有效期和额度限制。'],
      ],
      note: '如果暂时不确定怎么选，先充值余额并按量使用即可；使用量稳定后再考虑购买套餐。',
      links: [
        ['/topup', '充值余额'],
        ['/topup/packages', '查看套餐'],
      ],
    },
    chat: {
      kicker: 'AI Chat',
      title: '直接在网页使用 AI Chat',
      body: '不需要配置外部客户端，登录后即可在网页中选择模型并开始使用。',
      steps: [
        ['打开 AI Chat', '登录后，从首页点击“AI Chat”。'],
        ['按提示创建密钥', 'AI Chat 使用你自己的 API Key 调用模型。如果页面提示没有密钥，创建后再返回。'],
        ['选择模型', '选择模型类型和当前可用的具体模型。'],
        ['发送第一次请求', '输入问题或任务并发送；模型正常回复即表示可以使用。'],
      ],
      abilitiesTitle: '可以做什么',
      abilities: [
        '使用当前已上架并允许网页调用的文字模型进行对话。',
        '选择支持识图的模型，上传图片进行理解和分析。',
        '选择当前可用的文生图模型，通过文字生成图片。',
      ],
      notesTitle: '使用提醒',
      notes: [
        '模型和附件能力以页面当前选择的模型为准。',
        '会话记录只保存在当前设备的浏览器中。',
        '余额不足时，完成充值后可以返回并继续发送保留的消息。',
      ],
      links: [['/chats', '打开 AI Chat']],
    },
    api: {
      kicker: 'API 接入',
      title: '完成第一次 API 调用',
      body: '可以通过 CC Switch 一键导入，也可以手动导入配置文件。推荐使用 CC Switch，操作更简单，但并非必须安装。',
      downloadCta: '下载 CC Switch 和客户端',
      steps: [
        ['确认余额', '确保账户余额足够完成一次测试调用。'],
        ['进入 API 接入', '从首页点击“API 接入”。'],
        ['创建 API Key', '如果页面没有可用密钥，先创建并启用一个密钥，然后返回 API 接入。'],
        ['选择接入信息', '选择启用的密钥、当前可用模型、调用节点和目标客户端。'],
        ['选择接入方式', '可以使用 CC Switch 一键导入，也可以切换到“手动配置”并下载对应配置文件。'],
        ['发送测试消息', '打开目标客户端，发送：“请回复 OK，并告诉我你当前使用的模型。”'],
        ['确认调用成功', '客户端正常回复，并且调用日志出现成功记录，即表示接入完成。'],
      ],
      recommendedTitle: '推荐方式：CC Switch 一键导入',
      recommended: [
        '安装并打开 CC Switch 后，可以把密钥、模型和调用节点一键导入目标客户端。',
        '支持 Codex、Claude Code、Gemini CLI、OpenCode、OpenClaw 和 Hermes。',
      ],
      fallbackTitle: '另一种方式：手动导入配置',
      fallback: [
        '如果不想安装 CC Switch，可以在 API 接入页面选择“手动配置”。',
        '选择目标客户端，复制或下载页面生成的配置文件，并放到页面标明的配置路径。',
      ],
      successTitle: '如何判断接入成功',
      success: [
        '目标客户端正常返回模型回复。',
        '调用日志显示对应请求的状态和 Token 消耗。',
      ],
      links: [
        ['/api-connect', '进入 API 接入'],
        ['/api-keys', '管理 API Key'],
        ['/dashboard/logs', '查看调用日志'],
      ],
    },
    basics: {
      kicker: '基础 API 操作',
      title: '使用 cURL 验证 API',
      body: '使用 API 接入页面选择的调用节点、已启用的 API Key，以及模型列表返回的完整模型 ID。不要把 API Key 写入前端代码或公开仓库。',
      endpointLabel: '下方示例使用的调用节点',
      modelsTitle: '查询当前密钥可调用的模型',
      modelsBody: '这个请求会同时验证调用节点和 API Key，并返回当前密钥可以调用的模型 ID。',
      requestTitle: '发送一个最小对话请求',
      requestBody: '替换 sk-your-api-key 和 YOUR_MODEL_ID；模型名称必须完整复制自上一步返回结果。',
    },
    platform: {
      kicker: '平台运营者',
      title: '开通自己的 AI API 平台',
      body: '适合已经有客户、社群或销售渠道，希望使用自己品牌提供 AI API 服务的用户。',
      steps: [
        ['查看独立平台页面', '先确认平台能力、费用和运营责任是否符合你的需求。'],
        ['登录账户', '使用以后负责管理独立平台的账户登录。'],
        ['填写平台信息', '填写平台名称和用于平台地址的访问标识。'],
        ['选择支付方式', '使用页面当前已经开通的支付渠道；选择加密货币时还需要选择网络和币种。'],
        ['支付建站费用', '在打开的支付流程中完成付款。'],
        ['等待系统确认', '支付确认后，同一账户会自动获得管理权限并进入初始化流程。'],
      ],
      afterTitle: '开通后的建议配置顺序',
      after: [
        '设置平台名称、Logo、品牌信息和域名。',
        '选择要上架的模型，并设置面向用户的销售价格。',
        '配置余额充值方式和销售套餐。',
        '完整测试用户注册、API Key、余额扣费和一次真实模型调用。',
        '发布平台地址，并把入口提供给自己的用户。',
      ],
      notesTitle: '开通前需要了解',
      notes: [
        '不需要自己购买 VPS，也不需要自行接入上游模型。',
        '平台提供账户、支付、计费、API Key 和调用日志等基础流程。',
        '获客、定价、客户支持和日常运营仍由你负责。',
        '平台不提供客户，也不承诺收入。',
      ],
      links: [['/ai-api-reseller-platform', '了解并开通独立平台']],
    },
    troubleshooting: {
      kicker: '问题排查',
      title: '根据页面现象找到问题',
      body: '先处理当前看到的问题，不要一次修改所有配置。',
      items: [
        ['没有可用的 API Key', '先创建并启用密钥，然后返回 AI Chat 或 API 接入。'],
        ['账户余额不足', '完成充值后，再重试保留的消息或测试请求。'],
        ['找不到某个模型', '页面只显示当前已上架的模型，请以当前模型列表为准。'],
        ['AI Chat 无法上传图片', '当前模型不支持图片附件，请切换到支持识图的模型。'],
        ['客户端没有响应', '重新检查密钥、模型、目标客户端和页面生成的配置，然后只发送一次新的测试请求。'],
        ['调用日志没有成功记录', '先在客户端发送测试消息，再打开调用日志检查最新请求状态。'],
        ['建站付款后仍在等待', '支付确认后使用同一账户刷新页面；状态仍未更新时联系站点支持。'],
      ],
    },
  },
  ja: {
    eyebrow: '利用ガイド',
    title: 'API-Route を使い始める',
    description: 'AI Chat、API 連携、独立 AI API プラットフォームから目的を選び、最短の手順で初回利用を完了します。',
    directoryTitle: 'このページ',
    directory: [
      ['choose', '利用方法を選ぶ'],
      ['prepare', '事前準備'],
      ['chat', 'AI Chat を使う'],
      ['api', 'API を連携する'],
      ['basics', '基本的な API 操作'],
      ['platform', '独立サイトを開設する'],
      ['troubleshooting', 'トラブル解決'],
    ],
    choose: {
      kicker: '利用方法を選ぶ',
      title: 'API-Route で何をしたいですか？',
      body: 'トップページの主な入口は AI Chat と API 連携です。独立サイトの開設は運営者向けの別ルートです。',
      successLabel: '完了の目安：',
      items: [
        {
          title: 'ブラウザで AI を使う',
          description: '別のツールを設定せず、ブラウザで対話、画像理解、画像生成を直接利用できます。',
          success: 'AI Chat から回答または生成画像が返ります。',
          to: '/chats',
          link: 'AI Chat を開く',
        },
        {
          title: 'ツールやアプリに接続する',
          description: 'Codex、Claude Code、OpenClaw、Hermes、Gemini CLI、OpenCode などに接続できます。設定済みのクライアントは Cursor や VS Code 内でも利用できます。',
          success: 'クライアントにテスト回答が届き、利用ログに成功記録が表示されます。',
          to: '/api-connect',
          link: 'API 連携を開く',
        },
        {
          title: '自分の AI API サイトを開設する',
          description: '既存の顧客、コミュニティ、販売チャネルを持つ運営者向けです。',
          success: '支払い確認後、アカウントにサイト管理権限が付与されます。',
          to: '/ai-api-reseller-platform',
          link: '独立サイトを見る',
        },
      ],
    },
    prepare: {
      kicker: '事前準備',
      title: 'アカウントと残高を準備する',
      body: 'AI Chat と API 連携のどちらを使う場合も、最初に確認してください。',
      steps: [
        ['ログインする', 'モデルを利用するアカウントを作成するか、既存のアカウントでログインします。'],
        ['残高をチャージする', 'Alipay、Stripe、暗号資産に対応しています。実際に利用できる方法はチャージ画面の表示が基準です。'],
        ['支払い方法を選ぶ', '利用料は残高から直接支払うか、残高でプランを購入して利用できます。残高に有効期限はありません。プランは割引がありますが、有効期限と利用枠があります。'],
      ],
      note: '迷う場合は、まず残高をチャージして従量利用してください。利用量が安定してからプランを検討できます。',
      links: [
        ['/topup', '残高をチャージ'],
        ['/topup/packages', 'プランを見る'],
      ],
    },
    chat: {
      kicker: 'AI Chat',
      title: 'ブラウザで AI Chat を使う',
      body: '外部クライアントの設定は不要です。ログイン後、モデルを選んですぐに利用できます。',
      steps: [
        ['AI Chat を開く', 'ログイン後、トップページの「AI Chat」をクリックします。'],
        ['必要なら API キーを作成する', 'AI Chat は自分の API キーを使います。キーがないという案内が出たら、作成してから戻ります。'],
        ['モデルを選ぶ', 'モデルの種類と、現在利用できるモデルを選択します。'],
        ['最初のメッセージを送る', '質問や依頼を入力して送信します。通常の回答が返れば利用準備は完了です。'],
      ],
      abilitiesTitle: 'できること',
      abilities: [
        '公開中かつブラウザ利用が許可されたテキストモデルとの対話。',
        '画像理解に対応するモデルへの画像アップロードと分析。',
        '現在利用可能な画像生成モデルによるテキストからの画像生成。',
      ],
      notesTitle: '利用上の注意',
      notes: [
        'モデルや添付機能は、画面で選択したモデルの対応状況に従います。',
        '会話履歴は現在のブラウザにのみ保存されます。',
        '残高不足の場合は、チャージ後に戻って保存されたメッセージを送信できます。',
      ],
      links: [['/chats', 'AI Chat を開く']],
    },
    api: {
      kicker: 'API 連携',
      title: '最初の API 呼び出しを完了する',
      body: 'CC Switch によるワンクリック導入と、設定ファイルを使う手動設定のどちらも利用できます。CC Switch は操作が簡単な推奨方法ですが、インストールは必須ではありません。',
      downloadCta: 'CC Switch とクライアントをダウンロード',
      steps: [
        ['残高を確認する', 'テスト呼び出しに必要な残高があることを確認します。'],
        ['API 連携を開く', 'トップページの「API 連携」をクリックします。'],
        ['必要なら API キーを作成する', '有効なキーがなければ作成して有効化し、API 連携画面に戻ります。'],
        ['接続情報を選ぶ', '有効なキー、利用可能なモデル、接続先、対象クライアントを選択します。'],
        ['設定方法を選ぶ', 'CC Switch でワンクリック導入するか、「手動設定」に切り替えて設定ファイルをダウンロードします。'],
        ['テストする', '対象クライアントで「OK と、現在使っているモデル名を回答してください」と送信します。'],
        ['結果を確認する', '回答が返り、利用ログに成功記録があれば接続完了です。'],
      ],
      recommendedTitle: '推奨方法：CC Switch でワンクリック導入',
      recommended: [
        'CC Switch をインストールして起動すると、キー、モデル、接続先を対象クライアントへワンクリックで導入できます。',
        'Codex、Claude Code、Gemini CLI、OpenCode、OpenClaw、Hermes に対応しています。',
      ],
      fallbackTitle: '代替手段：手動設定',
      fallback: [
        'CC Switch をインストールしない場合は、API 連携画面で「手動設定」を選びます。',
        '対象クライアントを選び、生成された設定ファイルをコピーまたはダウンロードして、画面に表示されたパスへ配置します。',
      ],
      successTitle: '接続成功の確認',
      success: [
        '対象クライアントから正常なモデル回答が返る。',
        '利用ログにリクエスト状態と Token 使用量が表示される。',
      ],
      links: [
        ['/api-connect', 'API 連携を開く'],
        ['/api-keys', 'API キーを管理'],
        ['/dashboard/logs', '利用ログを見る'],
      ],
    },
    basics: {
      kicker: '基本的な API 操作',
      title: 'cURL で API を確認する',
      body: 'API 連携画面で選択した接続先、有効な API キー、モデル一覧で返された完全なモデル ID を使います。API キーをフロントエンドコードや公開リポジトリに書かないでください。',
      endpointLabel: '以下の例で使用する接続先',
      modelsTitle: 'このキーで利用できるモデルを取得する',
      modelsBody: '接続先と API キーを確認し、このキーで呼び出せるモデル ID を返します。',
      requestTitle: '最小構成の対話リクエストを送る',
      requestBody: 'sk-your-api-key と YOUR_MODEL_ID を置き換えます。モデル名は直前の結果から完全な ID をコピーしてください。',
    },
    platform: {
      kicker: '運営者向け',
      title: '自分の AI API プラットフォームを開設する',
      body: '既存の顧客、コミュニティ、販売チャネルがあり、自分のブランドで AI API を提供したい方向けです。',
      steps: [
        ['独立サイトの案内を確認する', '機能、費用、運営上の責任が自分の用途に合うか確認します。'],
        ['ログインする', '今後サイトを所有・管理するアカウントを使います。'],
        ['サイト情報を入力する', 'サイト名と URL に使う識別子を入力します。'],
        ['支払い方法を選ぶ', '画面で現在有効な方法を選びます。暗号資産の場合はネットワークと通貨も選択します。'],
        ['開設費用を支払う', '表示された決済フローで支払いを完了します。'],
        ['確認を待つ', '支払い確認後、同じアカウントに管理権限が付与され、初期設定へ進めます。'],
      ],
      afterTitle: '開設後の推奨設定順',
      after: [
        'サイト名、ロゴ、ブランド情報、ドメインを設定する。',
        '公開するモデルを選び、顧客向け価格を設定する。',
        'チャージ方法と販売プランを設定する。',
        'ユーザー登録、API キー、残高消費、実際のモデル呼び出しを一通りテストする。',
        'サイト URL を公開し、自分のユーザーへ案内する。',
      ],
      notesTitle: '開設前に確認すること',
      notes: [
        'VPS の購入や上流モデルの接続を自分で行う必要はありません。',
        'アカウント、決済、課金、API キー、利用ログの基本フローが用意されています。',
        '集客、価格設定、顧客対応、日々の運営は自分で行います。',
        '顧客の提供や収益の保証はありません。',
      ],
      links: [['/ai-api-reseller-platform', '独立サイトを確認して開設する']],
    },
    troubleshooting: {
      kicker: 'トラブル解決',
      title: '画面に表示された症状から確認する',
      body: 'すべての設定を一度に変更せず、現在の症状から順番に確認してください。',
      items: [
        ['利用できる API キーがない', 'キーを作成して有効化し、AI Chat または API 連携に戻ります。'],
        ['残高が不足している', 'チャージ後、保存されたメッセージまたはテストを再実行します。'],
        ['目的のモデルが見つからない', '画面には現在公開中のモデルだけが表示されます。現在の一覧から選んでください。'],
        ['AI Chat に画像を添付できない', '選択したモデルが画像添付に対応していません。画像理解対応モデルへ切り替えます。'],
        ['クライアントから応答がない', 'キー、モデル、対象クライアント、生成された設定を確認してから、新しいテストを一度送信します。'],
        ['成功した呼び出しが表示されない', '先にテストを送信し、その後で利用ログの最新状態を確認します。'],
        ['サイト開設の支払いが保留中', '支払い確認後、同じアカウントでページを更新します。反映されない場合はサイトサポートへ連絡してください。'],
      ],
    },
  },
  ko: {
    eyebrow: '사용 가이드',
    title: 'API-Route 시작하기',
    description: 'AI Chat, API 연결, 독립 AI API 플랫폼 중 목적에 맞는 경로를 선택하고 첫 사용을 완료하세요.',
    directoryTitle: '이 페이지',
    directory: [
      ['choose', '사용 방식 선택'],
      ['prepare', '시작 전 준비'],
      ['chat', 'AI Chat 사용'],
      ['api', 'API 연결'],
      ['basics', '기본 API 호출'],
      ['platform', '독립 플랫폼 개설'],
      ['troubleshooting', '문제 해결'],
    ],
    choose: {
      kicker: '사용 방식 선택',
      title: 'API-Route로 무엇을 하시나요?',
      body: '홈의 두 주요 입구는 AI Chat과 API 연결입니다. 독립 플랫폼 개설은 운영자를 위한 별도 경로입니다.',
      successLabel: '완료 기준:',
      items: [
        {
          title: '웹에서 AI 바로 사용',
          description: '다른 도구를 설정하지 않고 브라우저에서 대화, 이미지 이해, 이미지 생성을 바로 사용할 수 있습니다.',
          success: 'AI Chat에서 답변이나 생성 이미지가 정상적으로 표시됩니다.',
          to: '/chats',
          link: 'AI Chat 열기',
        },
        {
          title: '도구 또는 앱 연결',
          description: 'Codex, Claude Code, OpenClaw, Hermes, Gemini CLI, OpenCode 등에 연결할 수 있습니다. 설정된 클라이언트는 Cursor나 VS Code 안에서도 사용할 수 있습니다.',
          success: '클라이언트가 테스트 답변을 받고 사용 로그에 성공 기록이 표시됩니다.',
          to: '/api-connect',
          link: 'API 연결 열기',
        },
        {
          title: '내 AI API 플랫폼 개설',
          description: '기존 고객, 커뮤니티, 판매 채널을 보유하고 자체 브랜드로 운영하려는 분에게 적합합니다.',
          success: '결제가 확인되고 현재 계정에 플랫폼 관리 권한이 부여됩니다.',
          to: '/ai-api-reseller-platform',
          link: '독립 플랫폼 알아보기',
        },
      ],
    },
    prepare: {
      kicker: '시작 전 준비',
      title: '계정과 잔액 준비',
      body: 'AI Chat과 API 연결 모두 먼저 아래 내용을 확인하세요.',
      steps: [
        ['로그인', '모델을 실제로 사용할 계정을 만들거나 기존 계정으로 로그인합니다.'],
        ['잔액 충전', 'Alipay, Stripe, 암호화폐를 지원합니다. 실제 사용 가능한 방식은 충전 페이지에 현재 표시된 항목을 기준으로 합니다.'],
        ['사용 금액 결제 방식 선택', '호출 금액을 잔액에서 바로 차감하거나, 잔액으로 플랜을 구매해 사용할 수 있습니다. 잔액은 만료되지 않으며, 플랜은 할인 혜택이 있지만 유효 기간과 사용 한도가 있습니다.'],
      ],
      note: '선택이 어렵다면 먼저 잔액을 충전해 사용량만큼 결제하세요. 사용량이 일정해진 뒤 플랜을 구매해도 됩니다.',
      links: [
        ['/topup', '잔액 충전'],
        ['/topup/packages', '플랜 보기'],
      ],
    },
    chat: {
      kicker: 'AI Chat',
      title: '브라우저에서 AI Chat 사용',
      body: '외부 클라이언트를 설정할 필요 없이 로그인 후 모델을 선택해 바로 사용할 수 있습니다.',
      steps: [
        ['AI Chat 열기', '로그인 후 홈에서 “AI Chat”을 클릭합니다.'],
        ['필요하면 API 키 생성', 'AI Chat은 자신의 API 키를 사용합니다. 키가 없다는 안내가 나오면 생성한 뒤 돌아옵니다.'],
        ['모델 선택', '모델 유형과 현재 사용 가능한 모델을 선택합니다.'],
        ['첫 요청 전송', '질문이나 작업을 입력해 전송합니다. 모델이 정상적으로 답하면 준비가 끝난 것입니다.'],
      ],
      abilitiesTitle: '할 수 있는 작업',
      abilities: [
        '현재 등록되어 있고 웹 사용이 허용된 텍스트 모델과 대화합니다.',
        '이미지 이해를 지원하는 모델에 이미지를 업로드해 분석합니다.',
        '현재 사용 가능한 이미지 생성 모델로 텍스트에서 이미지를 만듭니다.',
      ],
      notesTitle: '사용 시 참고사항',
      notes: [
        '모델과 첨부 기능은 화면에서 선택한 모델의 지원 범위를 따릅니다.',
        '대화 기록은 현재 브라우저에만 저장됩니다.',
        '잔액이 부족하면 충전 후 돌아와 보관된 메시지를 다시 전송할 수 있습니다.',
      ],
      links: [['/chats', 'AI Chat 열기']],
    },
    api: {
      kicker: 'API 연결',
      title: '첫 API 호출 완료',
      body: 'CC Switch로 한 번에 가져오거나 설정 파일을 직접 적용할 수 있습니다. CC Switch가 더 간편한 권장 방식이지만 반드시 설치해야 하는 것은 아닙니다.',
      downloadCta: 'CC Switch 및 클라이언트 다운로드',
      steps: [
        ['잔액 확인', '테스트 호출을 실행할 수 있는 잔액이 있는지 확인합니다.'],
        ['API 연결 열기', '홈에서 “API 연결”을 클릭합니다.'],
        ['필요하면 API 키 생성', '활성화된 키가 없다면 키를 만들고 활성화한 뒤 API 연결로 돌아옵니다.'],
        ['연결 정보 선택', '활성 키, 사용 가능한 모델, 엔드포인트, 대상 클라이언트를 선택합니다.'],
        ['설정 방식 선택', 'CC Switch로 한 번에 가져오거나 “수동 설정”으로 전환해 설정 파일을 다운로드합니다.'],
        ['테스트 메시지 전송', '대상 클라이언트에서 “OK라고 답하고 현재 사용 중인 모델을 알려 주세요.”라고 전송합니다.'],
        ['결과 확인', '정상 답변이 오고 사용 로그에 성공 기록이 나타나면 연결이 완료된 것입니다.'],
      ],
      recommendedTitle: '권장 방식: CC Switch로 한 번에 가져오기',
      recommended: [
        'CC Switch를 설치하고 실행하면 키, 모델, 엔드포인트를 대상 클라이언트로 한 번에 가져올 수 있습니다.',
        'Codex, Claude Code, Gemini CLI, OpenCode, OpenClaw, Hermes를 지원합니다.',
      ],
      fallbackTitle: '대체 방식: 수동 설정',
      fallback: [
        'CC Switch를 설치하지 않으려면 API 연결 화면에서 “수동 설정”을 선택합니다.',
        '대상 클라이언트를 선택하고 생성된 설정 파일을 복사하거나 다운로드한 뒤 화면에 표시된 경로에 배치합니다.',
      ],
      successTitle: '연결 성공 기준',
      success: [
        '대상 클라이언트에서 정상적인 모델 답변을 받습니다.',
        '사용 로그에 요청 상태와 Token 사용량이 표시됩니다.',
      ],
      links: [
        ['/api-connect', 'API 연결 열기'],
        ['/api-keys', 'API 키 관리'],
        ['/dashboard/logs', '사용 로그 보기'],
      ],
    },
    basics: {
      kicker: '기본 API 호출',
      title: 'cURL로 API 확인',
      body: 'API 연결 화면에서 선택한 엔드포인트, 활성화된 API 키, 모델 목록에서 반환된 정확한 모델 ID를 사용합니다. API 키를 프런트엔드 코드나 공개 저장소에 노출하지 마세요.',
      endpointLabel: '아래 예시에서 사용하는 엔드포인트',
      modelsTitle: '현재 키로 호출 가능한 모델 조회',
      modelsBody: '엔드포인트와 API 키를 확인하고 이 키로 호출할 수 있는 모델 ID를 반환합니다.',
      requestTitle: '최소 대화 요청 전송',
      requestBody: 'sk-your-api-key와 YOUR_MODEL_ID를 바꿉니다. 모델 이름은 이전 결과에서 전체 ID를 그대로 복사하세요.',
    },
    platform: {
      kicker: '운영자',
      title: '내 AI API 플랫폼 개설',
      body: '기존 고객, 커뮤니티, 판매 채널이 있고 자체 브랜드로 AI API 서비스를 제공하려는 분에게 적합합니다.',
      steps: [
        ['독립 플랫폼 페이지 확인', '기능, 비용, 운영 책임이 자신의 요구와 맞는지 먼저 확인합니다.'],
        ['로그인', '앞으로 플랫폼을 소유하고 관리할 계정을 사용합니다.'],
        ['플랫폼 정보 입력', '플랫폼 이름과 URL에 사용할 식별자를 입력합니다.'],
        ['결제 방식 선택', '페이지에서 현재 활성화된 결제 방식을 사용합니다. 암호화폐는 네트워크와 토큰도 선택해야 합니다.'],
        ['개설 비용 결제', '열린 결제 절차에서 결제를 완료합니다.'],
        ['확인 대기', '결제가 확인되면 같은 계정에 관리 권한이 부여되고 초기 설정을 계속할 수 있습니다.'],
      ],
      afterTitle: '개설 후 권장 설정 순서',
      after: [
        '플랫폼 이름, 로고, 브랜드 정보, 도메인을 설정합니다.',
        '판매할 모델을 선택하고 고객 가격을 설정합니다.',
        '잔액 충전 방식과 판매 플랜을 설정합니다.',
        '회원가입, API 키, 잔액 차감, 실제 모델 호출을 전체 테스트합니다.',
        '플랫폼 주소를 공개하고 자신의 사용자에게 안내합니다.',
      ],
      notesTitle: '개설 전에 알아둘 점',
      notes: [
        '직접 VPS를 구매하거나 상위 모델 공급자를 연결할 필요가 없습니다.',
        '계정, 결제, 과금, API 키, 사용 로그의 기본 흐름이 제공됩니다.',
        '고객 확보, 가격 설정, 고객 지원, 일상 운영은 직접 담당합니다.',
        '플랫폼은 고객이나 수익을 보장하지 않습니다.',
      ],
      links: [['/ai-api-reseller-platform', '독립 플랫폼 확인 및 개설']],
    },
    troubleshooting: {
      kicker: '문제 해결',
      title: '화면에 보이는 증상부터 확인',
      body: '모든 설정을 한꺼번에 바꾸지 말고 현재 보이는 문제부터 처리하세요.',
      items: [
        ['사용 가능한 API 키가 없음', '키를 만들고 활성화한 뒤 AI Chat 또는 API 연결로 돌아갑니다.'],
        ['계정 잔액 부족', '충전 후 보관된 메시지나 테스트 요청을 다시 전송합니다.'],
        ['원하는 모델이 보이지 않음', '현재 등록된 모델만 표시됩니다. 화면의 현재 모델 목록에서 선택하세요.'],
        ['AI Chat에 이미지를 올릴 수 없음', '선택한 모델이 이미지 첨부를 지원하지 않습니다. 이미지 이해 모델로 전환하세요.'],
        ['클라이언트가 응답하지 않음', '키, 모델, 대상 클라이언트, 생성된 설정을 다시 확인한 뒤 새 테스트를 한 번 전송합니다.'],
        ['성공한 호출 기록이 없음', '먼저 테스트 요청을 전송한 다음 사용 로그에서 최신 상태를 확인합니다.'],
        ['플랫폼 결제가 계속 대기 중', '결제 확인 후 같은 계정으로 페이지를 새로 고칩니다. 계속 반영되지 않으면 사이트 지원팀에 문의하세요.'],
      ],
    },
  },
};

function SectionHeading({ kicker, title, body }) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-page-link">{kicker}</p>
      <h2 className="mt-3 text-2xl font-bold tracking-[-0.03em] text-page sm:text-3xl">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-page-secondary sm:text-base">{body}</p>
    </div>
  );
}

function StepList({ items }) {
  return (
    <ol className="mt-7 list-decimal space-y-4 border-y border-page-divider py-5 pl-6 marker:font-bold marker:text-page-link">
      {items.map(([title, body]) => (
        <li key={title} className="pl-2">
          <p className="text-sm font-bold text-page">{title}</p>
          <p className="mt-1 text-sm leading-6 text-page-secondary">{body}</p>
        </li>
      ))}
    </ol>
  );
}

function BulletSection({ title, items }) {
  return (
    <div className="mt-7">
      <h3 className="text-base font-bold text-page">{title}</h3>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-page-secondary marker:text-page-link">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}

function PageLinks({ items }) {
  return (
    <p className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm">
      {items.map(([to, label]) => (
        <Link key={to} to={to} className="font-bold text-page-link hover:underline">{label}</Link>
      ))}
    </p>
  );
}

function CodeExample({ title, body, code }) {
  return (
    <div className="mt-7">
      <h3 className="text-base font-bold text-page">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-page-secondary">{body}</p>
      <pre className="mt-3 overflow-x-auto rounded-md border border-[#4A342A] bg-[#211814] p-4 text-xs leading-6 text-[#F5EDE7] sm:text-sm">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function DocsQuickstart() {
  const { i18n } = useTranslation();
  const language = normalizeAppLanguage(i18n.resolvedLanguage || i18n.language);
  const copy = COPY[language] || COPY.en;
  const baseUrl = (API_ENDPOINTS[0]?.url || 'https://your-api-endpoint.example').replace(/\/+$/, '');
  const activeSection = useDocsActiveSection(copy.directory);

  const modelsSnippet = `curl "${baseUrl}/v1/models" \\
  -H "Authorization: Bearer sk-your-api-key"`;

  const requestSnippet = `curl "${baseUrl}/v1/chat/completions" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer sk-your-api-key" \\
  -d '{
    "model": "YOUR_MODEL_ID",
    "messages": [
      {"role": "user", "content": "Reply with OK and the model name."}
    ]
  }'`;

  return (
    <DocsPageFrame activeSection={activeSection} directory={copy.directory}>
              <header className="border-b border-page-divider pb-8">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-page-link">{copy.eyebrow}</p>
                <h1 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-page sm:text-4xl">{copy.title}</h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-page-secondary sm:text-base">{copy.description}</p>
              </header>

              <section id="choose" className="scroll-mt-28">
                <SectionHeading {...copy.choose} />
                <div className="mt-7 divide-y divide-page-divider border-y border-page-divider">
                  {copy.choose.items.map((item) => (
                    <div key={item.title} className="grid gap-3 py-5 sm:grid-cols-[180px_1fr] sm:gap-6">
                      <p className="text-sm font-bold text-page">{item.title}</p>
                      <div>
                        <p className="text-sm leading-6 text-page-secondary">{item.description}</p>
                        <p className="mt-1 text-sm leading-6 text-page-secondary">
                          <span className="font-semibold text-page">{copy.choose.successLabel}</span> {item.success}
                        </p>
                        <Link to={item.to} className="mt-2 inline-block text-sm font-bold text-page-link hover:underline">{item.link}</Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section id="prepare" className="scroll-mt-28">
                <SectionHeading {...copy.prepare} />
                <StepList items={copy.prepare.steps} />
                <p className="mt-5 border-l-2 border-page-divider pl-4 text-sm leading-6 text-page-secondary">{copy.prepare.note}</p>
                <PageLinks items={copy.prepare.links} />
              </section>

              <section id="chat" className="scroll-mt-28">
                <SectionHeading {...copy.chat} />
                <StepList items={copy.chat.steps} />
                <BulletSection title={copy.chat.abilitiesTitle} items={copy.chat.abilities} />
                <BulletSection title={copy.chat.notesTitle} items={copy.chat.notes} />
                <PageLinks items={copy.chat.links} />
              </section>

              <section id="api" className="scroll-mt-28">
                <SectionHeading {...copy.api} />
                <StepList items={copy.api.steps} />
                <BulletSection title={copy.api.recommendedTitle} items={copy.api.recommended} />
                <Link to="/clients" className="mt-5 inline-block text-sm font-bold text-page-link hover:underline">
                  {copy.api.downloadCta}
                </Link>
                <BulletSection title={copy.api.fallbackTitle} items={copy.api.fallback} />
                <BulletSection title={copy.api.successTitle} items={copy.api.success} />
                <PageLinks items={copy.api.links} />
              </section>

              <section id="basics" className="scroll-mt-28">
                <SectionHeading {...copy.basics} />
                <div className="mt-6 border-l-2 border-page-divider pl-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-page-secondary">{copy.basics.endpointLabel}</p>
                  <code className="mt-2 block break-all text-sm text-page-link">{baseUrl}</code>
                </div>
                <CodeExample title={copy.basics.modelsTitle} body={copy.basics.modelsBody} code={modelsSnippet} />
                <CodeExample title={copy.basics.requestTitle} body={copy.basics.requestBody} code={requestSnippet} />
              </section>

              <section id="platform" className="scroll-mt-28">
                <SectionHeading {...copy.platform} />
                <StepList items={copy.platform.steps} />
                <BulletSection title={copy.platform.afterTitle} items={copy.platform.after} />
                <BulletSection title={copy.platform.notesTitle} items={copy.platform.notes} />
                <PageLinks items={copy.platform.links} />
              </section>

              <section id="troubleshooting" className="scroll-mt-28">
                <SectionHeading {...copy.troubleshooting} />
                <div className="mt-7 divide-y divide-page-divider border-y border-page-divider">
                  {copy.troubleshooting.items.map(([title, body]) => (
                    <div key={title} className="grid gap-2 py-4 sm:grid-cols-[200px_1fr] sm:gap-6">
                      <p className="text-sm font-bold text-page">{title}</p>
                      <p className="text-sm leading-6 text-page-secondary">{body}</p>
                    </div>
                  ))}
                </div>
              </section>
    </DocsPageFrame>
  );
}
