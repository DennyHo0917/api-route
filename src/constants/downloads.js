const OFFICIAL_DOWNLOADS = {
  ccSwitch: 'https://ccswitch.io/en/',
  codex: 'https://openai.com/zh-Hans-CN/codex/',
  claudeCode: 'https://claude.com/download',
  vscode: 'https://code.visualstudio.com/',
  cherryStudio: 'https://github.com/CherryHQ/cherry-studio/releases/latest',
  nodejs: 'https://nodejs.org/en/download',
};

export const DOWNLOAD_TOOLS = [
  {
    id: 'cc-switch',
    title: 'CC Switch',
    version: 'v3.18.0',
    descZh: '统一管理 Claude Code、Codex、Gemini CLI、OpenCode、OpenClaw、Hermes 等客户端，支持一键导入 Provider。',
    descEn: 'Manage Claude Code, Codex, Gemini CLI, OpenCode, OpenClaw, Hermes and more in one place, with one-click provider import.',
    groups: [
      {
        title: 'Download',
        links: [
          { label: 'Windows', href: 'https://github.com/farion1231/cc-switch/releases/download/v3.18.0/CC-Switch-v3.18.0-Windows-arm64.msi', recommended: true },
          { label: 'macOS', href: 'https://github.com/farion1231/cc-switch/releases/download/v3.18.0/CC-Switch-v3.18.0-macOS.dmg' },
        ],
      },
    ],
  },
  {
    id: 'codex',
    title: 'Codex',
    version: '0.128.0',
    descZh: 'OpenAI 官方 Codex 客户端，请前往官网下载最新版本。',
    descEn: 'Official Codex client from OpenAI. Visit the official website to get the latest version.',
    groups: [
      {
        title: 'Download',
        links: [
          { label: 'Codex Official Download', href: OFFICIAL_DOWNLOADS.codex, recommended: true, official: true },
        ],
      },
    ],
  },
  {
    id: 'claude-code',
    title: 'Claude Code',
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
    id: 'cherry-studio',
    title: 'Cherry Studio',
    version: 'v1.9.2',
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
    version: 'v24.15.0',
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
