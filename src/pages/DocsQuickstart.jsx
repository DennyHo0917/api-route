import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { API_ENDPOINTS } from '../components/ConfigExporter';
import { ConsoleSidebar } from '../components/ConsoleLayout';
import { DOWNLOAD_TOOLS } from '../constants/downloads';
import { useAuth } from '../context/AuthContext';
import { normalizeAppLanguage } from '../i18n/languageUtils';

const CC_SWITCH_DOWNLOADS = DOWNLOAD_TOOLS
  .find((tool) => tool.id === 'cc-switch')
  ?.groups.flatMap((group) => group.links) || [];

const COPY = {
  en: {
    eyebrow: 'Developer docs · Quickstart',
    title: 'Connect Codex, Claude Code, CC Switch, VS Code, and Cursor',
    description: 'Prepare and verify one API-Route key once, then follow the final branch for the coding client you actually use.',
    copy: 'Copy code',
    copied: 'Copied',
    before: {
      kicker: '01 · Before you start',
      title: 'Prepare the account that will send the request',
      body: 'API requests use real account credit or plan quota. Confirm these three items before debugging code or client settings.',
      items: [
        ['Signed-in account', 'API keys, the connection workbench, and usage logs are available after sign-in.'],
        ['Available balance or plan', 'Actual charges follow account records and usage logs; the browser does not calculate billing.'],
        ['Active API key', 'Create and enable a key on the API Keys page. Disable or delete it immediately if it may be exposed.'],
      ],
      keyCta: 'Create or manage API keys',
      topupCta: 'Check balance and plans',
    },
    values: {
      kicker: '02 · Use exact values',
      title: 'Get the API key, Base URL, and model ID from the account',
      body: 'Most failed first requests come from mixing values from different keys, endpoints, or client protocols.',
      items: [
        ['API key', 'Use an enabled key from API Keys. Keep it in a server-side secret or local environment variable, never frontend code or a public repository.'],
        ['Base URL', 'OpenAI-compatible SDKs use the selected endpoint with /v1. Raw HTTP requests use the complete resource path.'],
        ['Model ID', 'Use Supported Models for the current key or the result from /v1/models. Pricing shows listed models and rates, not guaranteed access for every key.'],
      ],
      example: 'Example endpoint used on this page',
      openai: 'OpenAI-compatible SDK Base URL',
      anthropic: 'Anthropic / Claude Base URL',
      anthropicNote: 'Claude and Anthropic clients use the root endpoint without /v1. The API Access workbench generates the correct format for each client.',
      pricingCta: 'Compare listed model prices',
    },
    models: {
      kicker: '03 · Verify the key',
      title: 'List the models available to this API key',
      body: 'Call /v1/models before choosing a model. This checks the Base URL and authorization, and returns the model IDs this key can use.',
      label: 'List available models',
      resultTitle: 'What to copy from the result',
      resultBody: 'Copy one complete model ID from the returned data list. Use that exact value in the next request; do not guess or shorten it.',
    },
    request: {
      kicker: '04 · First request',
      title: 'Send one minimal chat request with cURL',
      body: 'Replace the API key and YOUR_MODEL_ID. Keep this first test small so authentication, model access, and request formatting are easy to isolate.',
      label: 'POST /v1/chat/completions',
      successTitle: 'Success means two things',
      successBody: 'The terminal returns a model reply, and a new request appears in Usage Logs. Verify both before moving the settings into an SDK or client.',
    },
    sdk: {
      kicker: '05 · SDKs',
      title: 'Move the verified values into your application',
      body: 'Only switch to an SDK after the cURL request succeeds. Reuse the same API key, Base URL, and exact model ID.',
      tabs: { python: 'Python', javascript: 'JavaScript' },
    },
    clients: {
      kicker: '06 · Clients',
      title: 'Choose the client you want to connect',
      body: 'The account, balance, API key, Base URL, model check, and test request above are shared. Only this last configuration step changes by client.',
      selectLabel: 'Client guide',
      recommended: 'Recommended',
      guides: {
        codex: {
          label: 'Codex',
          title: 'Use API-Route with Codex',
          intro: 'The shortest path is to generate a Codex profile in API Access and import it through CC Switch. Manual files remain available when you want to inspect every field.',
          steps: [
            ['Generate the profile', 'Open API Access and select the verified key, an available model, and the endpoint that works on your network.'],
            ['Import into Codex', 'Keep CC Switch mode selected, choose Codex as the target app, then run the one-click import.'],
            ['Restart the session', 'Open a new Codex session so it reads the imported provider, model, Base URL, and API key.'],
            ['Verify the request', 'Send a small task and confirm that the expected model and key appear in API-Route Usage Logs.'],
          ],
          note: 'For manual setup, choose Codex under Manual Configuration and place the generated values in ~/.codex/config.toml and ~/.codex/auth.json.',
        },
        claudeCode: {
          label: 'Claude Code',
          title: 'Use API-Route with Claude Code',
          intro: 'Claude Code uses the Anthropic-style root endpoint without /v1. Let API Access generate that format instead of adapting an OpenAI URL by hand.',
          steps: [
            ['Generate the profile', 'Open API Access and select the verified key, model, and endpoint.'],
            ['Import into Claude Code', 'In CC Switch mode choose Claude Code as the target app, then run the one-click import.'],
            ['Restart Claude Code', 'Start a new terminal session so Claude Code reloads the imported environment settings.'],
            ['Verify the request', 'Send a short prompt and confirm the request in API-Route Usage Logs.'],
          ],
          note: 'For manual setup, choose Claude Code and use the generated ~/.claude/settings.json. Its Base URL is the root endpoint, not the OpenAI-compatible /v1 address.',
        },
        ccSwitch: {
          label: 'CC Switch',
          title: 'Import an API-Route provider with CC Switch',
          intro: 'CC Switch is the configuration manager in this workflow. It writes the selected API-Route provider into Codex, Claude Code, or another supported target client.',
          steps: [
            ['Install CC Switch', 'Download and open CC Switch before starting the import.'],
            ['Prepare the provider', 'In API Access select the verified key, model, endpoint, and the target app that will use them.'],
            ['Run one-click import', 'Choose “Import to CC Switch” and allow the browser to open the ccswitch link.'],
            ['Check the target app', 'Confirm the new API-Route provider is enabled, then start a fresh session in the target client.'],
          ],
          note: 'CC Switch does not send model requests itself. Usage and billing appear only after the target client makes a real API call.',
          showDownload: true,
        },
        vscode: {
          label: 'VS Code',
          title: 'Use API-Route from VS Code',
          intro: 'VS Code is the editor, not the API client. Connect the Codex or Claude Code workflow you run inside VS Code, then use that client from the editor or integrated terminal.',
          steps: [
            ['Choose the actual AI client', 'Decide whether your VS Code workflow uses Codex or Claude Code.'],
            ['Configure that client', 'In API Access import the Codex or Claude Code profile with CC Switch, or use its manual configuration.'],
            ['Return to VS Code', 'Restart the relevant extension, terminal, or client session so it reloads the provider settings.'],
            ['Verify the request', 'Run a small task and check API-Route Usage Logs for the request.'],
          ],
          note: 'Do not look for an API-Route field in VS Code core settings. The Base URL, API key, and model belong to the AI client or extension you use inside VS Code.',
        },
        cursor: {
          label: 'Cursor',
          title: 'Use API-Route from Cursor',
          intro: 'For the current supported workflow, run Codex or Claude Code from Cursor’s integrated terminal and configure that client with API-Route.',
          steps: [
            ['Choose Codex or Claude Code', 'Pick the command-line client you want to run inside Cursor.'],
            ['Configure that target', 'Use API Access and CC Switch to import the matching Codex or Claude Code profile.'],
            ['Open a fresh terminal', 'Restart Cursor’s integrated terminal and launch the configured client there.'],
            ['Verify the request', 'Send a small task and confirm it appears in API-Route Usage Logs.'],
          ],
          note: 'Cursor itself is not currently listed as a one-click target in the API Access workbench. This guide does not claim that Cursor’s built-in model provider has been replaced.',
        },
      },
      cta: 'Open API Access',
      ccSwitchDownload: 'Download CC Switch',
      downloadsCta: 'Other client downloads',
    },
    troubleshooting: {
      kicker: '07 · Verify and troubleshoot',
      title: 'Start with the real request record',
      body: 'Usage Logs are the fastest way to separate a client-side configuration error from a request that reached the API.',
      successTitle: 'A completed first call',
      successItems: [
        'The terminal, SDK, or client received a normal model reply.',
        'Usage Logs show a new record with the expected key and model.',
        'Usage and billing follow the account record, not a browser-side estimate.',
      ],
      items: [
        ['No log record', 'The request probably did not reach the API. Check the selected endpoint and whether the client actually sent the request.'],
        ['Authentication failed', 'Confirm the key is enabled and sent as Authorization: Bearer <API_KEY>.'],
        ['Model unavailable', 'Copy a model returned for this key by /v1/models or shown under Supported Models.'],
        ['Wrong path', 'Do not append /v1 twice. Anthropic and Claude clients use the root endpoint instead of the OpenAI SDK Base URL.'],
        ['Insufficient balance or plan', 'Add credit or activate a plan, then retry the same minimal request.'],
      ],
      logsCta: 'Open Usage Logs',
    },
  },
  zh: {
    eyebrow: '开发者文档 · 快速开始',
    title: '接入 Codex、Claude Code、CC Switch、VSCode 与 Cursor',
    description: '账号、余额、API Key、Base URL、模型验证和第一次请求只准备一次，最后再按你实际使用的客户端完成配置。',
    copy: '复制代码',
    copied: '已复制',
    before: {
      kicker: '01 · 开始前检查',
      title: '先准备实际发送请求的账号',
      body: 'API 请求会消耗真实余额或套餐额度。开始排查代码和客户端配置前，先确认下面三项。',
      items: [
        ['已登录账号', 'API 密钥、API 接入工作台和调用日志都需要登录后使用。'],
        ['可用余额或套餐', '实际扣费以账户记录和调用日志为准，浏览器端不会自行计算费用。'],
        ['已启用的 API Key', '在“API 密钥”页面创建并保持启用；如果怀疑泄露，立即禁用或删除。'],
      ],
      keyCta: '创建或管理 API Key',
      topupCta: '检查余额与套餐',
    },
    values: {
      kicker: '02 · 使用准确参数',
      title: '从当前账号取得 API Key、Base URL 和模型 ID',
      body: '第一次调用失败，通常不是代码复杂，而是混用了不同密钥、节点或客户端协议的参数。',
      items: [
        ['API Key', '使用“API 密钥”页面中已启用的密钥。只保存在服务端密钥或本地环境变量中，不要写入前端代码和公开仓库。'],
        ['Base URL', 'OpenAI 兼容 SDK 使用所选节点加 /v1；直接发送 HTTP 请求时使用完整接口路径。'],
        ['模型 ID', '以当前密钥的“支持模型”或 /v1/models 返回结果为准。价格页用于查看上架状态与价格，不代表每个密钥都能调用。'],
      ],
      example: '本页示例使用的节点',
      openai: 'OpenAI 兼容 SDK Base URL',
      anthropic: 'Anthropic / Claude Base URL',
      anthropicNote: 'Claude 和 Anthropic 客户端使用不带 /v1 的根地址。API 接入工作台会按照不同客户端生成正确格式。',
      pricingCta: '比较已上架模型价格',
    },
    models: {
      kicker: '03 · 验证密钥',
      title: '查询这个 API Key 当前可调用的模型',
      body: '选择模型前先请求 /v1/models。这一步会同时验证 Base URL 和鉴权，并返回该密钥可用的模型 ID。',
      label: '获取可用模型',
      resultTitle: '从结果中复制什么',
      resultBody: '从返回的 data 列表中复制一个完整模型 ID，并原样用于下一次请求。不要猜测、缩写或自行拼接模型名。',
    },
    request: {
      kicker: '04 · 第一次请求',
      title: '先用 cURL 发送一个最小聊天请求',
      body: '替换 API Key 和 YOUR_MODEL_ID。第一次测试保持最小，才能快速区分鉴权、模型权限和请求格式问题。',
      label: 'POST /v1/chat/completions',
      successTitle: '成功需要同时满足两件事',
      successBody: '终端收到模型的正常回复，并且“调用日志”新增了一条请求记录。确认这两项后，再把参数迁移到 SDK 或客户端。',
    },
    sdk: {
      kicker: '05 · SDK 接入',
      title: '把已经验证过的参数放进应用代码',
      body: '只有 cURL 请求成功后再切换 SDK。继续使用同一个 API Key、Base URL 和完整模型 ID。',
      tabs: { python: 'Python', javascript: 'JavaScript' },
    },
    clients: {
      kicker: '06 · 客户端接入',
      title: '选择你要接入的客户端',
      body: '前面的账号、余额、API Key、Base URL、模型查询和测试请求都相同。只有最后一步需要根据客户端选择不同配置方式。',
      selectLabel: '客户端指南',
      recommended: '推荐',
      guides: {
        codex: {
          label: 'Codex',
          title: '在 Codex 中使用 API-Route',
          intro: '最省事的方式是在 API 接入工作台生成 Codex 配置，再通过 CC Switch 一键导入；需要逐项核对时也可以手动配置。',
          steps: [
            ['生成配置', '打开 API 接入工作台，选择已经验证的密钥、该密钥可用的模型和当前网络可用的节点。'],
            ['导入 Codex', '保持 CC Switch 接入方式，目标应用选择 Codex，然后执行一键导入。'],
            ['重启会话', '新建 Codex 会话，让客户端重新读取 Provider、模型、Base URL 和 API Key。'],
            ['验证调用', '发送一个小任务，并在 API-Route 调用日志中确认密钥和模型是否符合预期。'],
          ],
          note: '手动配置时，在工作台选择 Codex，把生成内容分别放入 ~/.codex/config.toml 和 ~/.codex/auth.json。',
        },
        claudeCode: {
          label: 'Claude Code',
          title: '在 Claude Code 中使用 API-Route',
          intro: 'Claude Code 使用 Anthropic 格式的根地址，不带 /v1。直接让 API 接入工作台生成对应格式，不要手动改写 OpenAI 地址。',
          steps: [
            ['生成配置', '打开 API 接入工作台，选择已经验证的密钥、模型和调用节点。'],
            ['导入 Claude Code', '在 CC Switch 模式中把目标应用设为 Claude Code，然后执行一键导入。'],
            ['重启 Claude Code', '新开一个终端或会话，让 Claude Code 重新读取导入的环境配置。'],
            ['验证调用', '发送一个短提示词，并在 API-Route 调用日志中确认请求。'],
          ],
          note: '手动配置时选择 Claude Code，使用工作台生成的 ~/.claude/settings.json。Base URL 应为根地址，不是带 /v1 的 OpenAI 兼容地址。',
        },
        ccSwitch: {
          label: 'CC Switch',
          title: '使用 CC Switch 导入 API-Route Provider',
          intro: 'CC Switch 在这里负责管理和写入配置。它会把 API-Route Provider 导入 Codex、Claude Code 或其他受支持的目标客户端。',
          steps: [
            ['安装 CC Switch', '先下载并打开 CC Switch，再开始导入。'],
            ['准备 Provider', '在 API 接入工作台选择已验证的密钥、模型、节点和最终要使用的目标应用。'],
            ['执行一键导入', '点击“一键导入到 CC Switch”，并允许浏览器打开 ccswitch 链接。'],
            ['检查目标应用', '确认新的 API-Route Provider 已启用，然后在目标客户端新建会话。'],
          ],
          note: 'CC Switch 本身不发送模型请求。只有目标客户端真实调用后，API-Route 才会产生用量和扣费记录。',
          showDownload: true,
        },
        vscode: {
          label: 'VS Code',
          title: '在 VS Code 中使用 API-Route',
          intro: 'VS Code 是编辑器，不是直接发送模型请求的 API 客户端。你需要配置在 VS Code 中运行的 Codex 或 Claude Code，再从编辑器或集成终端使用它。',
          steps: [
            ['确认实际客户端', '先确定你的 VS Code 工作流使用的是 Codex 还是 Claude Code。'],
            ['配置对应客户端', '在 API 接入工作台中，通过 CC Switch 导入 Codex 或 Claude Code 配置；也可以选择对应的手动配置。'],
            ['回到 VS Code', '重启相关扩展、终端或客户端会话，让它重新读取 Provider 配置。'],
            ['验证调用', '执行一个小任务，并在 API-Route 调用日志中检查请求。'],
          ],
          note: '不要在 VS Code 核心设置里寻找 API-Route 输入框。Base URL、API Key 和模型应配置在你实际使用的 AI 客户端或扩展中。',
        },
        cursor: {
          label: 'Cursor',
          title: '在 Cursor 中使用 API-Route',
          intro: '当前受支持的方式是在 Cursor 集成终端中运行 Codex 或 Claude Code，并为这个实际客户端配置 API-Route。',
          steps: [
            ['选择 Codex 或 Claude Code', '确定你准备在 Cursor 集成终端里运行的命令行客户端。'],
            ['配置对应目标', '通过 API 接入工作台和 CC Switch 导入匹配的 Codex 或 Claude Code 配置。'],
            ['新开集成终端', '重启 Cursor 的集成终端，再启动已经配置好的客户端。'],
            ['验证调用', '发送一个小任务，并在 API-Route 调用日志中确认请求。'],
          ],
          note: '当前 API 接入工作台没有把 Cursor 本身列为一键导入目标。本指南不会声称已经替换 Cursor 内置的模型供应商。',
        },
      },
      cta: '打开 API 接入工作台',
      ccSwitchDownload: '下载 CC Switch',
      downloadsCta: '下载其他客户端',
    },
    troubleshooting: {
      kicker: '07 · 验证与排错',
      title: '先查看真实请求记录',
      body: '调用日志能最快区分“客户端配置错误”和“请求已经到达 API 但调用失败”。',
      successTitle: '第一次调用完成的标准',
      successItems: [
        '终端、SDK 或客户端收到了正常的模型回复。',
        '调用日志出现了使用预期密钥和模型的新记录。',
        '用量和扣费以账户记录为准，不使用浏览器端估算结果。',
      ],
      items: [
        ['日志里没有请求', '请求可能没有到达 API。检查所选节点，以及客户端是否真的发送了请求。'],
        ['鉴权失败', '确认密钥仍处于启用状态，并通过 Authorization: Bearer <API_KEY> 发送。'],
        ['模型不可用', '只使用当前密钥“支持模型”或 /v1/models 返回的完整模型 ID。'],
        ['接口路径错误', '不要重复拼接 /v1；Anthropic 和 Claude 客户端使用根地址，不使用 OpenAI SDK Base URL。'],
        ['余额或套餐不足', '充值或开通套餐后，重新发送同一个最小请求。'],
      ],
      logsCta: '打开调用日志',
    },
  },
  ja: {
    eyebrow: '開発者ドキュメント · クイックスタート',
    title: 'Codex、Claude Code、CC Switch、VSCode、Cursor を接続する',
    description: 'アカウント、残高、API キー、Base URL、モデル確認、最初のテストは一度だけ行い、最後に利用するクライアント別の設定へ進みます。',
    copy: 'コードをコピー',
    copied: 'コピー済み',
    before: {
      kicker: '01 · 事前確認',
      title: '実際にリクエストを送るアカウントを準備する',
      body: 'API リクエストでは残高またはプランの利用枠を消費します。コードやクライアント設定を確認する前に、次の 3 点を揃えてください。',
      items: [
        ['ログイン済みアカウント', 'API キー、接続ワークベンチ、利用ログはログイン後に使用できます。'],
        ['利用可能な残高またはプラン', '実際の請求はアカウント記録と利用ログに従い、ブラウザ側では計算しません。'],
        ['有効な API キー', 'API キーページで作成して有効にします。漏えいの可能性があれば、すぐに無効化または削除してください。'],
      ],
      keyCta: 'API キーを作成・管理',
      topupCta: '残高とプランを確認',
    },
    values: {
      kicker: '02 · 正確な値を使う',
      title: 'アカウントから API キー、Base URL、モデル ID を取得する',
      body: '最初の失敗は、別のキー、接続先、クライアント方式の値を混ぜたときに起こりやすくなります。',
      items: [
        ['API キー', 'API キーページの有効なキーを使用します。サーバー側のシークレットまたはローカル環境変数に保存し、フロントエンドや公開リポジトリには置かないでください。'],
        ['Base URL', 'OpenAI 互換 SDK は選択した接続先に /v1 を付けます。HTTP を直接送る場合は完全なリソースパスを使います。'],
        ['モデル ID', '現在のキーの「対応モデル」または /v1/models の結果を使用します。料金ページは掲載状況と料金の確認用で、すべてのキーの利用可否を保証しません。'],
      ],
      example: 'このページで使う接続先',
      openai: 'OpenAI 互換 SDK Base URL',
      anthropic: 'Anthropic / Claude Base URL',
      anthropicNote: 'Claude と Anthropic クライアントでは /v1 を付けないルート URL を使います。API 接続ワークベンチがクライアント別の形式を生成します。',
      pricingCta: '掲載モデルの料金を比較',
    },
    models: {
      kicker: '03 · キーを確認',
      title: 'この API キーで利用できるモデルを取得する',
      body: 'モデルを選ぶ前に /v1/models を呼び出します。Base URL と認証を同時に確認し、このキーで利用できるモデル ID を取得できます。',
      label: '利用可能なモデルを取得',
      resultTitle: '結果からコピーする値',
      resultBody: '返された data 一覧から完全なモデル ID を 1 つコピーし、次のリクエストでそのまま使用します。省略や推測はしないでください。',
    },
    request: {
      kicker: '04 · 最初のリクエスト',
      title: 'まず cURL で最小のチャットリクエストを送る',
      body: 'API キーと YOUR_MODEL_ID を置き換えます。最初のテストを小さく保つと、認証、モデル権限、形式の問題を切り分けやすくなります。',
      label: 'POST /v1/chat/completions',
      successTitle: '成功は 2 か所で確認します',
      successBody: 'ターミナルにモデルの応答が表示され、利用ログに新しいリクエストが追加されます。両方を確認してから SDK やクライアントへ移してください。',
    },
    sdk: {
      kicker: '05 · SDK',
      title: '確認済みの値をアプリケーションに移す',
      body: 'cURL が成功してから SDK に切り替えます。同じ API キー、Base URL、完全なモデル ID を使用してください。',
      tabs: { python: 'Python', javascript: 'JavaScript' },
    },
    clients: {
      kicker: '06 · クライアント',
      title: '接続するクライアントを選ぶ',
      body: '上記のアカウント、残高、API キー、Base URL、モデル確認、テストリクエストは共通です。最後の設定だけがクライアントごとに異なります。',
      selectLabel: 'クライアントガイド',
      recommended: '推奨',
      guides: {
        codex: {
          label: 'Codex',
          title: 'Codex で API-Route を使う',
          intro: '最短の方法は、API 接続ワークベンチで Codex 用プロファイルを生成し、CC Switch から取り込むことです。項目を確認したい場合は手動設定も利用できます。',
          steps: [
            ['プロファイルを生成', 'API 接続ワークベンチで確認済みのキー、利用可能なモデル、ネットワークに合う接続先を選びます。'],
            ['Codex に取り込む', 'CC Switch 方式のまま対象アプリに Codex を選び、ワンクリック取り込みを実行します。'],
            ['セッションを再起動', '新しい Codex セッションを開き、Provider、モデル、Base URL、API キーを読み直します。'],
            ['リクエストを確認', '小さなタスクを実行し、API-Route の利用ログでキーとモデルを確認します。'],
          ],
          note: '手動設定では Codex を選び、生成内容を ~/.codex/config.toml と ~/.codex/auth.json に配置します。',
        },
        claudeCode: {
          label: 'Claude Code',
          title: 'Claude Code で API-Route を使う',
          intro: 'Claude Code は /v1 なしの Anthropic 形式ルート URL を使います。OpenAI 用 URL を手で直さず、ワークベンチに正しい形式を生成させてください。',
          steps: [
            ['プロファイルを生成', 'API 接続ワークベンチで確認済みのキー、モデル、接続先を選びます。'],
            ['Claude Code に取り込む', 'CC Switch 方式で対象アプリに Claude Code を選び、ワンクリック取り込みを実行します。'],
            ['Claude Code を再起動', '新しいターミナルまたはセッションを開き、環境設定を読み直します。'],
            ['リクエストを確認', '短いプロンプトを送り、API-Route の利用ログを確認します。'],
          ],
          note: '手動設定では Claude Code を選び、生成された ~/.claude/settings.json を使います。Base URL は /v1 付きではなくルート URL です。',
        },
        ccSwitch: {
          label: 'CC Switch',
          title: 'CC Switch で API-Route Provider を取り込む',
          intro: 'CC Switch はこの手順で設定を管理し、Codex、Claude Code、その他の対応クライアントへ API-Route Provider を書き込みます。',
          steps: [
            ['CC Switch をインストール', '取り込み前に CC Switch をダウンロードして起動します。'],
            ['Provider を準備', 'API 接続ワークベンチで確認済みのキー、モデル、接続先、対象アプリを選びます。'],
            ['ワンクリック取り込み', '「CC Switch に取り込む」を押し、ブラウザから ccswitch リンクを開くことを許可します。'],
            ['対象アプリを確認', 'API-Route Provider が有効になっていることを確認し、対象クライアントで新しいセッションを開始します。'],
          ],
          note: 'CC Switch 自体はモデルへリクエストを送りません。対象クライアントが実際に呼び出した後に、利用量と請求が記録されます。',
          showDownload: true,
        },
        vscode: {
          label: 'VS Code',
          title: 'VS Code から API-Route を使う',
          intro: 'VS Code はエディターであり、API クライアントそのものではありません。VS Code 内で使う Codex または Claude Code を設定します。',
          steps: [
            ['実際の AI クライアントを確認', 'VS Code のワークフローが Codex と Claude Code のどちらを使うか確認します。'],
            ['そのクライアントを設定', 'API 接続ワークベンチから、対応する Codex または Claude Code 設定を取り込みます。'],
            ['VS Code に戻る', '関連する拡張機能、ターミナル、クライアントセッションを再起動します。'],
            ['リクエストを確認', '小さなタスクを実行し、API-Route の利用ログを確認します。'],
          ],
          note: 'VS Code 本体の設定に API-Route の入力欄があるわけではありません。Base URL、API キー、モデルは実際に使う AI クライアントまたは拡張機能側へ設定します。',
        },
        cursor: {
          label: 'Cursor',
          title: 'Cursor から API-Route を使う',
          intro: '現在対応している方法は、Cursor の統合ターミナルで Codex または Claude Code を動かし、そのクライアントへ API-Route を設定することです。',
          steps: [
            ['Codex または Claude Code を選ぶ', 'Cursor の統合ターミナルで使うコマンドラインクライアントを決めます。'],
            ['対象クライアントを設定', 'API 接続ワークベンチと CC Switch で、対応する設定を取り込みます。'],
            ['新しいターミナルを開く', 'Cursor の統合ターミナルを再起動し、設定済みクライアントを起動します。'],
            ['リクエストを確認', '小さなタスクを送り、API-Route の利用ログを確認します。'],
          ],
          note: '現在、API 接続ワークベンチでは Cursor 自体をワンクリック取り込み先として扱っていません。このガイドは Cursor 内蔵 Provider の置き換えを案内するものではありません。',
        },
      },
      cta: 'API 接続ワークベンチを開く',
      ccSwitchDownload: 'CC Switch をダウンロード',
      downloadsCta: 'その他のクライアントをダウンロード',
    },
    troubleshooting: {
      kicker: '07 · 確認とトラブルシューティング',
      title: '実際のリクエスト記録から確認する',
      body: '利用ログを見ると、クライアント側の設定ミスか、API 到達後の失敗かを最短で切り分けられます。',
      successTitle: '最初の呼び出しが完了した状態',
      successItems: [
        'ターミナル、SDK、またはクライアントで正常なモデル応答を受信した。',
        '利用ログに想定したキーとモデルの新しい記録がある。',
        '利用量と請求はブラウザの推定ではなくアカウント記録に従う。',
      ],
      items: [
        ['ログに記録がない', 'API に到達していない可能性があります。接続先と、クライアントが実際に送信したかを確認してください。'],
        ['認証に失敗する', 'キーが有効で、Authorization: Bearer <API_KEY> として送信されているか確認します。'],
        ['モデルを利用できない', 'このキーの「対応モデル」または /v1/models が返した完全なモデル ID を使います。'],
        ['パスが正しくない', '/v1 を重複させないでください。Anthropic と Claude は OpenAI SDK 用 Base URL ではなくルート URL を使います。'],
        ['残高またはプラン不足', 'チャージまたはプランを有効化し、同じ最小リクエストを再実行します。'],
      ],
      logsCta: '利用ログを開く',
    },
  },
  ko: {
    eyebrow: '개발자 문서 · 빠른 시작',
    title: 'Codex, Claude Code, CC Switch, VS Code, Cursor 연결하기',
    description: '계정, 잔액, API 키, Base URL, 모델 확인, 첫 테스트는 한 번만 준비하고 마지막 단계에서 실제 사용하는 클라이언트별 설정을 진행합니다.',
    copy: '코드 복사',
    copied: '복사됨',
    before: {
      kicker: '01 · 시작 전 확인',
      title: '실제로 요청을 보낼 계정을 준비하세요',
      body: 'API 요청은 실제 잔액 또는 플랜 한도를 사용합니다. 코드나 클라이언트 설정을 점검하기 전에 다음 세 가지를 확인하세요.',
      items: [
        ['로그인된 계정', 'API 키, 연결 워크벤치, 사용 로그는 로그인 후 사용할 수 있습니다.'],
        ['사용 가능한 잔액 또는 플랜', '실제 과금은 계정 기록과 사용 로그를 따르며 브라우저에서 임의로 계산하지 않습니다.'],
        ['활성화된 API 키', 'API 키 페이지에서 키를 만들고 활성 상태로 유지하세요. 노출이 의심되면 즉시 비활성화하거나 삭제하세요.'],
      ],
      keyCta: 'API 키 만들기 또는 관리',
      topupCta: '잔액과 플랜 확인',
    },
    values: {
      kicker: '02 · 정확한 값 사용',
      title: '계정에서 API 키, Base URL, 모델 ID를 가져오세요',
      body: '첫 요청 실패는 서로 다른 키, 엔드포인트, 클라이언트 방식의 값을 섞을 때 가장 자주 발생합니다.',
      items: [
        ['API 키', 'API 키 페이지의 활성 키를 사용하세요. 서버 비밀값이나 로컬 환경 변수에만 보관하고 프런트엔드 코드나 공개 저장소에 넣지 마세요.'],
        ['Base URL', 'OpenAI 호환 SDK는 선택한 엔드포인트에 /v1을 붙여 사용합니다. HTTP 요청은 전체 리소스 경로로 전송합니다.'],
        ['모델 ID', '현재 키의 지원 모델 또는 /v1/models 결과를 사용하세요. 요금 페이지는 등록 상태와 가격을 보여 주지만 모든 키의 접근 권한을 보장하지 않습니다.'],
      ],
      example: '이 페이지에서 사용하는 예시 엔드포인트',
      openai: 'OpenAI 호환 SDK Base URL',
      anthropic: 'Anthropic / Claude Base URL',
      anthropicNote: 'Claude와 Anthropic 클라이언트는 /v1이 없는 루트 주소를 사용합니다. API 연결 워크벤치가 클라이언트별 형식을 생성합니다.',
      pricingCta: '등록된 모델 가격 비교',
    },
    models: {
      kicker: '03 · 키 확인',
      title: '이 API 키로 사용할 수 있는 모델 조회',
      body: '모델을 선택하기 전에 /v1/models를 호출하세요. Base URL과 인증을 함께 확인하고 이 키에서 사용할 수 있는 모델 ID를 받을 수 있습니다.',
      label: '사용 가능한 모델 조회',
      resultTitle: '결과에서 복사할 값',
      resultBody: '반환된 data 목록에서 완전한 모델 ID 하나를 복사해 다음 요청에 그대로 사용하세요. 모델명을 추측하거나 줄이지 마세요.',
    },
    request: {
      kicker: '04 · 첫 요청',
      title: '먼저 cURL로 최소 채팅 요청을 보내세요',
      body: 'API 키와 YOUR_MODEL_ID를 바꾸세요. 첫 테스트를 작게 유지하면 인증, 모델 권한, 요청 형식 문제를 쉽게 구분할 수 있습니다.',
      label: 'POST /v1/chat/completions',
      successTitle: '두 곳에서 성공을 확인하세요',
      successBody: '터미널에 정상적인 모델 응답이 표시되고 사용 로그에 새 요청이 추가되어야 합니다. 두 항목을 확인한 뒤 SDK나 클라이언트로 옮기세요.',
    },
    sdk: {
      kicker: '05 · SDK',
      title: '검증한 값을 애플리케이션 코드로 옮기세요',
      body: 'cURL 요청이 성공한 뒤 SDK로 전환하세요. 같은 API 키, Base URL, 완전한 모델 ID를 사용합니다.',
      tabs: { python: 'Python', javascript: 'JavaScript' },
    },
    clients: {
      kicker: '06 · 클라이언트',
      title: '연결할 클라이언트를 선택하세요',
      body: '위의 계정, 잔액, API 키, Base URL, 모델 확인, 테스트 요청은 모두 같습니다. 마지막 설정 단계만 클라이언트별로 달라집니다.',
      selectLabel: '클라이언트 가이드',
      recommended: '권장',
      guides: {
        codex: {
          label: 'Codex',
          title: 'Codex에서 API-Route 사용하기',
          intro: '가장 빠른 방법은 API 연결 워크벤치에서 Codex 프로필을 만든 뒤 CC Switch로 가져오는 것입니다. 각 항목을 확인해야 한다면 수동 설정도 사용할 수 있습니다.',
          steps: [
            ['프로필 생성', 'API 연결 워크벤치에서 검증한 키, 사용 가능한 모델, 현재 네트워크에 맞는 엔드포인트를 선택합니다.'],
            ['Codex로 가져오기', 'CC Switch 방식을 유지하고 대상 앱으로 Codex를 선택한 뒤 원클릭 가져오기를 실행합니다.'],
            ['세션 다시 시작', '새 Codex 세션을 열어 Provider, 모델, Base URL, API 키를 다시 읽습니다.'],
            ['요청 확인', '작은 작업을 실행하고 API-Route 사용 로그에서 키와 모델을 확인합니다.'],
          ],
          note: '수동 설정에서는 Codex를 선택하고 생성된 내용을 ~/.codex/config.toml과 ~/.codex/auth.json에 배치하세요.',
        },
        claudeCode: {
          label: 'Claude Code',
          title: 'Claude Code에서 API-Route 사용하기',
          intro: 'Claude Code는 /v1이 없는 Anthropic 형식의 루트 주소를 사용합니다. OpenAI 주소를 직접 고치지 말고 워크벤치에서 올바른 형식을 생성하세요.',
          steps: [
            ['프로필 생성', 'API 연결 워크벤치에서 검증한 키, 모델, 엔드포인트를 선택합니다.'],
            ['Claude Code로 가져오기', 'CC Switch 방식에서 대상 앱을 Claude Code로 선택한 뒤 원클릭 가져오기를 실행합니다.'],
            ['Claude Code 다시 시작', '새 터미널이나 세션을 열어 가져온 환경 설정을 다시 읽습니다.'],
            ['요청 확인', '짧은 프롬프트를 보내고 API-Route 사용 로그를 확인합니다.'],
          ],
          note: '수동 설정에서는 Claude Code를 선택하고 생성된 ~/.claude/settings.json을 사용하세요. Base URL은 /v1 주소가 아니라 루트 주소입니다.',
        },
        ccSwitch: {
          label: 'CC Switch',
          title: 'CC Switch로 API-Route Provider 가져오기',
          intro: 'CC Switch는 이 과정에서 설정을 관리하고 API-Route Provider를 Codex, Claude Code 또는 다른 지원 대상에 기록합니다.',
          steps: [
            ['CC Switch 설치', '가져오기를 시작하기 전에 CC Switch를 다운로드하고 실행합니다.'],
            ['Provider 준비', 'API 연결 워크벤치에서 검증한 키, 모델, 엔드포인트, 최종 대상 앱을 선택합니다.'],
            ['원클릭 가져오기', '“CC Switch로 가져오기”를 누르고 브라우저가 ccswitch 링크를 열도록 허용합니다.'],
            ['대상 앱 확인', '새 API-Route Provider가 활성화되었는지 확인한 뒤 대상 클라이언트에서 새 세션을 시작합니다.'],
          ],
          note: 'CC Switch 자체는 모델 요청을 보내지 않습니다. 대상 클라이언트가 실제 호출한 뒤에만 사용량과 과금 기록이 생성됩니다.',
          showDownload: true,
        },
        vscode: {
          label: 'VS Code',
          title: 'VS Code에서 API-Route 사용하기',
          intro: 'VS Code는 편집기이며 API 클라이언트가 아닙니다. VS Code 안에서 사용하는 Codex 또는 Claude Code를 설정해야 합니다.',
          steps: [
            ['실제 AI 클라이언트 확인', 'VS Code 워크플로가 Codex와 Claude Code 중 무엇을 사용하는지 확인합니다.'],
            ['해당 클라이언트 설정', 'API 연결 워크벤치에서 Codex 또는 Claude Code 설정을 가져오거나 수동 설정을 사용합니다.'],
            ['VS Code로 돌아가기', '관련 확장, 터미널 또는 클라이언트 세션을 다시 시작합니다.'],
            ['요청 확인', '작은 작업을 실행하고 API-Route 사용 로그를 확인합니다.'],
          ],
          note: 'VS Code 기본 설정에서 API-Route 입력란을 찾을 필요가 없습니다. Base URL, API 키, 모델은 실제로 사용하는 AI 클라이언트나 확장에 설정합니다.',
        },
        cursor: {
          label: 'Cursor',
          title: 'Cursor에서 API-Route 사용하기',
          intro: '현재 지원되는 방식은 Cursor 통합 터미널에서 Codex 또는 Claude Code를 실행하고 그 클라이언트에 API-Route를 설정하는 것입니다.',
          steps: [
            ['Codex 또는 Claude Code 선택', 'Cursor 통합 터미널에서 실행할 명령줄 클라이언트를 정합니다.'],
            ['대상 클라이언트 설정', 'API 연결 워크벤치와 CC Switch로 일치하는 설정을 가져옵니다.'],
            ['새 통합 터미널 열기', 'Cursor 통합 터미널을 다시 시작하고 설정한 클라이언트를 실행합니다.'],
            ['요청 확인', '작은 작업을 보내고 API-Route 사용 로그를 확인합니다.'],
          ],
          note: '현재 API 연결 워크벤치는 Cursor 자체를 원클릭 대상으로 제공하지 않습니다. 이 가이드는 Cursor 내장 모델 Provider를 교체한다고 주장하지 않습니다.',
        },
      },
      cta: 'API 연결 워크벤치 열기',
      ccSwitchDownload: 'CC Switch 다운로드',
      downloadsCta: '기타 클라이언트 다운로드',
    },
    troubleshooting: {
      kicker: '07 · 확인과 문제 해결',
      title: '실제 요청 기록부터 확인하세요',
      body: '사용 로그를 보면 클라이언트 설정 문제인지, API에 도달한 뒤 실패한 것인지 가장 빠르게 구분할 수 있습니다.',
      successTitle: '첫 호출이 완료된 상태',
      successItems: [
        '터미널, SDK 또는 클라이언트에서 정상적인 모델 응답을 받았습니다.',
        '사용 로그에 예상한 키와 모델의 새 기록이 있습니다.',
        '사용량과 과금은 브라우저 추정값이 아닌 계정 기록을 따릅니다.',
      ],
      items: [
        ['로그에 요청이 없음', '요청이 API에 도달하지 않았을 수 있습니다. 엔드포인트와 클라이언트가 실제로 요청을 보냈는지 확인하세요.'],
        ['인증 실패', '키가 활성 상태이며 Authorization: Bearer <API_KEY>로 전송되는지 확인하세요.'],
        ['모델을 사용할 수 없음', '현재 키의 지원 모델 또는 /v1/models가 반환한 완전한 모델 ID만 사용하세요.'],
        ['잘못된 경로', '/v1을 두 번 붙이지 마세요. Anthropic과 Claude는 OpenAI SDK Base URL이 아닌 루트 주소를 사용합니다.'],
        ['잔액 또는 플랜 부족', '충전하거나 플랜을 활성화한 뒤 같은 최소 요청을 다시 보내세요.'],
      ],
      logsCta: '사용 로그 열기',
    },
  },
};

const DIRECTORY_COPY = {
  en: {
    title: 'On this page',
    items: [
      ['before', 'Before you start'],
      ['values', 'Exact values'],
      ['models', 'List models'],
      ['request', 'First request'],
      ['sdk', 'SDKs'],
      ['clients', 'Clients'],
    ],
  },
  zh: {
    title: '本页目录',
    items: [
      ['before', '开始前检查'],
      ['values', '准确参数'],
      ['models', '查询模型'],
      ['request', '第一次请求'],
      ['sdk', 'SDK 接入'],
      ['clients', '客户端接入'],
    ],
  },
  ja: {
    title: 'このページ',
    items: [
      ['before', '事前確認'],
      ['values', '正確な値'],
      ['models', 'モデル一覧'],
      ['request', '最初のリクエスト'],
      ['sdk', 'SDK'],
      ['clients', 'クライアント'],
    ],
  },
  ko: {
    title: '이 페이지',
    items: [
      ['before', '시작 전 확인'],
      ['values', '정확한 값'],
      ['models', '모델 조회'],
      ['request', '첫 요청'],
      ['sdk', 'SDK'],
      ['clients', '클라이언트'],
    ],
  },
};

function CodeBlock({ code, label, copied, copyLabel, copiedLabel, onCopy }) {
  return (
    <div className="overflow-hidden rounded-lg border border-[#493A31] bg-[#211914]">
      <div className="flex items-center justify-between gap-3 border-b border-[#493A31] px-4 py-3 text-xs text-[#BDA999]">
        <span className="font-mono uppercase tracking-[0.14em]">{label}</span>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-1.5 rounded-md border border-[#685043] px-2.5 py-1.5 font-semibold text-[#E8B29A] transition-colors hover:bg-[#3A2820]"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? copiedLabel : copyLabel}
        </button>
      </div>
      <pre className="max-h-[440px] overflow-x-auto p-4 text-[12px] leading-6 text-[#F5EDE7] sm:p-5 sm:text-[13px]"><code>{code}</code></pre>
    </div>
  );
}

function SectionHeading({ kicker, title, body }) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-page-link">{kicker}</p>
      <h2 className="mt-3 text-2xl font-bold tracking-[-0.03em] text-page sm:text-3xl">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-page-secondary sm:text-base">{body}</p>
    </div>
  );
}

export default function DocsQuickstart() {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const language = normalizeAppLanguage(i18n.resolvedLanguage || i18n.language);
  const copy = COPY[language] || COPY.en;
  const directory = DIRECTORY_COPY[language] || DIRECTORY_COPY.en;
  const [activeSnippet, setActiveSnippet] = useState('python');
  const [activeClientGuide, setActiveClientGuide] = useState('codex');
  const [activeSection, setActiveSection] = useState('before');
  const [copiedId, setCopiedId] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const baseUrl = (API_ENDPOINTS[0]?.url || 'https://your-api-endpoint.example').replace(/\/+$/, '');
  const clientGuide = copy.clients.guides[activeClientGuide] || copy.clients.guides.codex;

  const snippets = useMemo(() => ({
    python: `# pip install openai
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["API_ROUTE_API_KEY"],
    base_url="${baseUrl}/v1",
)

response = client.chat.completions.create(
    model="YOUR_MODEL_ID",
    messages=[
        {"role": "user", "content": "Reply with OK and the model name."}
    ],
)

print(response.choices[0].message.content)`,
    javascript: `// npm install openai
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.API_ROUTE_API_KEY,
  baseURL: "${baseUrl}/v1",
});

const response = await client.chat.completions.create({
  model: "YOUR_MODEL_ID",
  messages: [
    { role: "user", content: "Reply with OK and the model name." },
  ],
});

console.log(response.choices[0].message.content);`,
  }), [baseUrl]);

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

  useEffect(() => {
    const updateActiveSection = () => {
      const current = directory.items.reduce((active, [id]) => {
        const section = document.getElementById(id);
        return section && section.getBoundingClientRect().top <= 140 ? id : active;
      }, directory.items[0]?.[0] || '');
      setActiveSection(current);
    };

    updateActiveSection();
    window.addEventListener('scroll', updateActiveSection, { passive: true });
    return () => window.removeEventListener('scroll', updateActiveSection);
  }, [directory.items]);

  const handleCopy = async (id, value) => {
    if (!navigator.clipboard?.writeText) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(''), 1600);
    } catch {
      // Clipboard permissions vary by browser and local preview context.
    }
  };

  return (
    <div className="theme-light theme-claude min-h-[calc(100dvh-72px)] bg-page-bg text-page">
      {user && (
        <aside className={`fixed inset-y-0 left-0 top-[72px] z-20 hidden flex-col border-r border-page-divider bg-page-card-bg transition-[width] duration-200 lg:flex ${sidebarCollapsed ? 'w-16' : 'w-60'}`}>
          <ConsoleSidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed((value) => !value)}
          />
        </aside>
      )}

      <div className={`min-h-[calc(100dvh-72px)] ${user ? 'lg:mx-60' : ''}`}>
        <div className="min-h-full bg-page-bg text-page">
          <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 lg:py-16">
            <div className="grid gap-10 lg:grid-cols-[170px_minmax(0,1fr)] lg:items-start">
              <aside className="self-start lg:sticky lg:top-24" aria-label={directory.title}>
                <div className="border-r border-page-divider pr-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-page-secondary">{directory.title}</p>
                  <nav className="mt-3 space-y-1">
                    {directory.items.map(([id, label]) => (
                      <a
                        key={id}
                        href={`#${id}`}
                        aria-current={activeSection === id ? 'location' : undefined}
                        className={`block py-1.5 text-sm transition-colors hover:text-page-link ${
                          activeSection === id ? 'font-bold text-page-link' : 'text-page-secondary'
                        }`}
                      >
                        {label}
                      </a>
                    ))}
                  </nav>
                </div>
              </aside>

              <main className="min-w-0 max-w-4xl space-y-16">
                <header className="border-b border-page-divider pb-8">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-page-link">{copy.eyebrow}</p>
                  <h1 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-page sm:text-4xl">{copy.title}</h1>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-page-secondary sm:text-base">{copy.description}</p>
                </header>

                <section id="before" className="scroll-mt-28">
                  <SectionHeading {...copy.before} />
                  <div className="mt-7 divide-y divide-page-divider border-y border-page-divider">
                    {copy.before.items.map(([title, body]) => (
                      <div key={title} className="grid gap-2 py-4 sm:grid-cols-[180px_1fr] sm:gap-6">
                        <p className="text-sm font-bold text-page">{title}</p>
                        <p className="text-sm leading-6 text-page-secondary">{body}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 flex flex-wrap gap-4">
                    <Link to="/api-keys" className="inline-flex items-center gap-2 text-sm font-bold text-page-link hover:underline">
                      {copy.before.keyCta}
                      <ExternalLink size={15} />
                    </Link>
                    <Link to="/topup" className="inline-flex items-center gap-2 text-sm font-bold text-page-link hover:underline">
                      {copy.before.topupCta}
                      <ArrowRight size={15} />
                    </Link>
                  </div>
                </section>

                <section id="values" className="scroll-mt-28">
                  <SectionHeading {...copy.values} />
                  <div className="mt-7 divide-y divide-page-divider border-y border-page-divider">
                    {copy.values.items.map(([title, body]) => (
                      <div key={title} className="grid gap-2 py-4 sm:grid-cols-[180px_1fr] sm:gap-6">
                        <p className="text-sm font-bold text-page-link">{title}</p>
                        <p className="text-sm leading-6 text-page-secondary">{body}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-7 border-l-2 border-page-divider pl-5">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-page-secondary">{copy.values.example}</p>
                    <code className="mt-2 block break-all text-sm text-page">{baseUrl}</code>
                    <div className="mt-5 divide-y divide-page-divider border-y border-page-divider">
                      <div className="grid gap-2 py-3 sm:grid-cols-[210px_1fr] sm:gap-5">
                        <p className="text-xs font-semibold text-page-secondary">{copy.values.openai}</p>
                        <code className="block break-all text-xs text-page-link">{baseUrl}/v1</code>
                      </div>
                      <div className="grid gap-2 py-3 sm:grid-cols-[210px_1fr] sm:gap-5">
                        <p className="text-xs font-semibold text-page-secondary">{copy.values.anthropic}</p>
                        <code className="block break-all text-xs text-page-link">{baseUrl}</code>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-page-secondary">{copy.values.anthropicNote}</p>
                  </div>
                  <Link to="/pricing" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-page-link hover:underline">
                    {copy.values.pricingCta}
                    <ArrowRight size={15} />
                  </Link>
                </section>

                <section id="models" className="scroll-mt-28">
                  <SectionHeading {...copy.models} />
                  <div className="mt-7">
                    <CodeBlock
                      code={modelsSnippet}
                      label={copy.models.label}
                      copied={copiedId === 'models'}
                      copyLabel={copy.copy}
                      copiedLabel={copy.copied}
                      onCopy={() => handleCopy('models', modelsSnippet)}
                    />
                  </div>
                  <div className="mt-6 border-l-2 border-page-link pl-5">
                    <p className="font-bold text-page">{copy.models.resultTitle}</p>
                    <p className="mt-2 text-sm leading-7 text-page-secondary">{copy.models.resultBody}</p>
                  </div>
                </section>

                <section id="request" className="scroll-mt-28">
                  <SectionHeading {...copy.request} />
                  <div className="mt-7">
                    <CodeBlock
                      code={requestSnippet}
                      label={copy.request.label}
                      copied={copiedId === 'request'}
                      copyLabel={copy.copy}
                      copiedLabel={copy.copied}
                      onCopy={() => handleCopy('request', requestSnippet)}
                    />
                  </div>
                  <div className="mt-6 border-l-2 border-emerald-600 pl-5">
                    <p className="flex items-center gap-2 font-bold text-page">
                      <Check size={17} className="text-emerald-600" />
                      {copy.request.successTitle}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-page-secondary">{copy.request.successBody}</p>
                  </div>
                </section>

                <section id="sdk" className="scroll-mt-28">
                  <SectionHeading {...copy.sdk} />
                  <div className="mt-7 border-b border-page-divider">
                    <div className="flex gap-6 overflow-x-auto">
                      {Object.entries(copy.sdk.tabs).map(([id, label]) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setActiveSnippet(id)}
                          className={`shrink-0 border-b-2 px-0 pb-2.5 text-sm font-bold transition-colors ${
                            activeSnippet === id
                              ? 'border-page-link text-page-link'
                              : 'border-transparent text-page-secondary hover:text-page'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-3">
                    <CodeBlock
                      code={snippets[activeSnippet]}
                      label={copy.sdk.tabs[activeSnippet]}
                      copied={copiedId === activeSnippet}
                      copyLabel={copy.copy}
                      copiedLabel={copy.copied}
                      onCopy={() => handleCopy(activeSnippet, snippets[activeSnippet])}
                    />
                  </div>
                </section>

                <section id="clients" className="scroll-mt-28">
                  <SectionHeading {...copy.clients} />
                  <div className="mt-7">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-page-secondary">{copy.clients.selectLabel}</p>
                    <div className="mt-3 flex gap-2 overflow-x-auto border-b border-page-divider pb-3" role="tablist" aria-label={copy.clients.selectLabel}>
                      {Object.entries(copy.clients.guides).map(([id, guide]) => (
                        <button
                          key={id}
                          type="button"
                          role="tab"
                          aria-selected={activeClientGuide === id}
                          onClick={() => setActiveClientGuide(id)}
                          className={`shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
                            activeClientGuide === id
                              ? 'border-page-link bg-page-link text-white'
                              : 'border-page-divider text-page-secondary hover:bg-page-surface-hover hover:text-page'
                          }`}
                        >
                          {guide.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 rounded-2xl border border-page-divider bg-page-card-bg p-5 sm:p-7" role="tabpanel">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-xl font-bold tracking-[-0.02em] text-page sm:text-2xl">{clientGuide.title}</h3>
                      {(activeClientGuide === 'codex' || activeClientGuide === 'claudeCode') && (
                        <span className="rounded-full bg-page-link/10 px-2.5 py-1 text-xs font-bold text-page-link">{copy.clients.recommended}</span>
                      )}
                    </div>
                    <p className="mt-3 text-sm leading-7 text-page-secondary">{clientGuide.intro}</p>

                    <ol className="mt-6 divide-y divide-page-divider border-y border-page-divider">
                      {clientGuide.steps.map(([title, body], index) => (
                        <li key={title} className="grid gap-3 py-4 sm:grid-cols-[36px_170px_1fr] sm:gap-5">
                          <span className="font-mono text-xs text-page-muted">{String(index + 1).padStart(2, '0')}</span>
                          <p className="font-bold text-page">{title}</p>
                          <p className="text-sm leading-6 text-page-secondary">{body}</p>
                        </li>
                      ))}
                    </ol>

                    {clientGuide.showDownload && (
                      <div className="mt-5 grid gap-3 border-b border-page-divider pb-5 sm:grid-cols-[170px_1fr] sm:gap-5">
                        <p className="text-sm font-bold text-page">{copy.clients.ccSwitchDownload}</p>
                        <div className="flex flex-wrap gap-x-5 gap-y-2">
                          {CC_SWITCH_DOWNLOADS.map((download) => (
                            <a
                              key={download.href}
                              href={download.href}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-sm font-bold text-page-link hover:underline"
                            >
                              {download.label}
                              <ExternalLink size={14} />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-5 border-l-2 border-page-link pl-5">
                      <p className="text-sm leading-7 text-page-secondary">{clientGuide.note}</p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-4">
                    <Link to="/api-connect" className="inline-flex items-center gap-2 text-sm font-bold text-page-link hover:underline">
                      {copy.clients.cta}
                      <ExternalLink size={15} />
                    </Link>
                    <Link to="/clients" className="inline-flex items-center gap-2 text-sm font-bold text-page-link hover:underline">
                      {copy.clients.downloadsCta}
                      <ArrowRight size={15} />
                    </Link>
                  </div>
                </section>

                <section id="troubleshooting" className="scroll-mt-28">
                  <SectionHeading {...copy.troubleshooting} />
                  <div className="mt-7 border-y border-page-divider py-5">
                    <p className="font-bold text-page">{copy.troubleshooting.successTitle}</p>
                    <ul className="mt-3 space-y-2">
                      {copy.troubleshooting.successItems.map((item) => (
                        <li key={item} className="flex gap-2 text-sm leading-6 text-page-secondary">
                          <Check size={16} className="mt-1 shrink-0 text-emerald-600" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-6 divide-y divide-page-divider border-y border-page-divider">
                    {copy.troubleshooting.items.map(([title, body]) => (
                      <div key={title} className="grid gap-2 py-4 sm:grid-cols-[190px_1fr] sm:gap-6">
                        <p className="text-sm font-bold text-page-link">{title}</p>
                        <p className="text-sm leading-6 text-page-secondary">{body}</p>
                      </div>
                    ))}
                  </div>
                  <Link to="/dashboard/logs" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-page-link hover:underline">
                    {copy.troubleshooting.logsCta}
                    <ExternalLink size={15} />
                  </Link>
                </section>
              </main>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
