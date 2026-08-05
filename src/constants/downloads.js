const OFFICIAL_DOWNLOADS = {
  ccSwitch: 'https://ccswitch.io/download',
  codex: 'https://openai.com/zh-Hans-CN/codex/',
  claudeCode: 'https://claude.com/download',
  vscode: 'https://code.visualstudio.com/',
  cursor: 'https://cursor.com/',
  cherryStudio: 'https://github.com/CherryHQ/cherry-studio/releases/latest',
  nodejs: 'https://nodejs.org/en/download',
};

export const DOWNLOAD_TOOLS = [
  {
    id: 'cc-switch',
    title: 'CC Switch',
    logo: 'https://ccswitch.io/favicon.png',
    recommended: true,
    descZh: '统一管理 Claude Code、Codex、Gemini CLI、OpenCode、OpenClaw、Hermes 等客户端，支持一键导入 Provider。',
    descEn: 'Manage Claude Code, Codex, Gemini CLI, OpenCode, OpenClaw, Hermes and more in one place, with one-click provider import.',
    groups: [
      {
        title: 'Download',
        links: [
          { label: 'CC Switch', href: OFFICIAL_DOWNLOADS.ccSwitch, recommended: true, official: true },
        ],
      },
    ],
  },
  {
    id: 'codex',
    title: 'Codex',
    logo: 'https://cdn.oaistatic.com/assets/favicon-o20kmmos.svg',
    descZh: 'OpenAI 官方 Codex 客户端，请前往官网下载最新版本。',
    descEn: 'Official Codex client from OpenAI. Visit the official website to get the latest version.',
    groups: [
      {
        title: 'Download',
        links: [
          { label: 'Codex Official Download', href: OFFICIAL_DOWNLOADS.codex, recommended: true, official: true },
          {
            label: 'One-click deployment',
            labelZh: '一键部署',
            href: 'https://pub-152ae4d5931a4aa2b1f8a5cb02f80fda.r2.dev/install-codex-windows.cmd',
            recommended: true,
            recommendedBadge: true,
          },
        ],
      },
    ],
  },
  {
    id: 'claude-code',
    title: 'Claude Code',
    logo: 'https://cdn.prod.website-files.com/6889473510b50328dbb70ae6/689f4a9aff1f63fde75cf733_favicon.png',
    descZh: 'Anthropic 官方 Claude Code 下载入口，用于在终端和开发工作流中使用 Claude。',
    descEn: 'Official Claude Code download from Anthropic for using Claude in terminal and development workflows.',
    groups: [
      {
        title: 'Download',
        links: [
          { label: 'Claude Code Official Download', href: OFFICIAL_DOWNLOADS.claudeCode, recommended: true, official: true },
        ],
      },
    ],
  },
  {
    id: 'vscode',
    title: 'VS Code',
    logo: 'https://code.visualstudio.com/assets/favicon.ico',
    descZh: '微软官方 Visual Studio Code 编辑器，可配合 Codex 等 AI 编程扩展使用。',
    descEn: 'Official Visual Studio Code editor from Microsoft for use with Codex and other AI coding extensions.',
    groups: [
      {
        title: 'Download',
        links: [
          { label: 'VS Code Official Download', href: OFFICIAL_DOWNLOADS.vscode, recommended: true, official: true },
        ],
      },
    ],
  },
  {
    id: 'cursor',
    title: 'Cursor',
    logo: 'https://cursor.com/marketing-static/favicon-light.svg',
    descZh: 'AI 代码编辑器，适合 AI 辅助编程和日常开发。',
    descEn: 'AI code editor for AI-assisted coding and everyday development.',
    groups: [
      {
        title: 'Download',
        links: [
          { label: 'Cursor Official Download', href: OFFICIAL_DOWNLOADS.cursor, recommended: true, official: true },
        ],
      },
    ],
  },
  {
    id: 'cherry-studio',
    title: 'Cherry Studio',
    logo: 'https://www.cherry-ai.com/assets/favicon-BmbgeFTf.png',
    descZh: '支持接入 OpenAI / Anthropic / Gemini 服务商，可配合本站生成参数使用。',
    descEn: 'Connects to OpenAI, Anthropic and Gemini providers and works well with generated settings from this site.',
    groups: [
      {
        title: 'Download',
        links: [
          { label: 'Cherry Studio Official Download', href: OFFICIAL_DOWNLOADS.cherryStudio, recommended: true, official: true },
        ],
      },
    ],
  },
  {
    id: 'nodejs',
    title: 'Node.js',
    logo: 'https://nodejs.org/static/images/favicons/favicon.png',
    descZh: '运行 Codex CLI、Claude Code 相关工具和常见前端开发工具所需的 Node.js LTS 环境。',
    descEn: 'Node.js LTS runtime for Codex CLI, Claude Code related tools and common frontend tooling.',
    groups: [
      {
        title: 'Download',
        links: [
          { label: 'Node.js Official Download', href: OFFICIAL_DOWNLOADS.nodejs, recommended: true, official: true },
        ],
      },
    ],
  },
];

export const CCSWITCH_PRIMARY_DOWNLOAD = OFFICIAL_DOWNLOADS.ccSwitch;
export const CCSWITCH_REPO_URL = 'https://github.com/farion1231/cc-switch';
