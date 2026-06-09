# SubRouter 分站前端模板

SubRouter 分销商的开源前端模板。基于 React、Vite、Tailwind CSS 和 [react-bits](https://github.com/DavidHDev/react-bits) 动画组件构建。

## 功能特性

- **4 套内置主题模板** — Starter、默认主题、暗色主题（赛博朋克）、极简主题
- **中英双语** — 根据浏览器语言自动切换
- 暗色优先的毛玻璃设计
- 丰富的动画效果：渐变文字、聚光卡片、粒子背景、极光效果
- 用户注册、登录和控制台
- API 密钥管理
- 模型定价表
- 套餐订阅
- 完全响应式
- OpenAI 兼容 API 端点展示

## 快速开始

```bash
# 安装依赖
npm install

# 开发服务器（端口 3001，/api 代理到 localhost:3000）
npm run dev

# 生产构建
npm run build
```

## 主题模板

dist-site 包含 **4 套内置主题模板**，每套有独特的视觉风格。主题由分销商在管理面板中选择，运行时动态加载。

### 可用主题

| 主题 | 值 | 描述 |
|------|-----|------|
| **Starter** | `starter` | 原始毛玻璃设计，渐变文字、聚光卡片、星光边框。靛蓝/紫色配色。 |
| **默认主题** | `default` | 极光动画背景，文字拆分动画、倾斜卡片、旋转特性文字。多彩渐变。 |
| **暗色主题** | `dark` | 赛博朋克/终端风格，粒子背景、解密文字动画、等宽字体。绿色强调色。 |
| **极简主题** | `minimal` | 简洁优雅设计，淡入动画、编号特性列表、极简边框。最大留白。 |

### 如何切换主题

#### 方式一：管理面板（推荐）

1. 登录 SubRouter 主管理面板
2. 进入 **分站设置**
3. 找到 **主题模板** 下拉框
4. 选择你喜欢的主题
5. 点击 **保存** — 立即生效

#### 方式二：API

```bash
# 通过 API 更新主题
curl -X PUT /api/distributor/self \
  -H "Content-Type: application/json" \
  -d '{"theme_template": "dark"}'
```

可选值：`starter`、`default`、`dark`、`minimal`

### 工作原理

所有 4 套主题编译到同一个构建中。dist-site 从 `/api/dist/site/info` 接口读取 `theme_template` 字段，通过 React lazy loading 动态加载对应的 Layout 和 Home 组件。共享页面（登录、注册、控制台、令牌、定价、套餐）在所有主题中保持一致。

## 国际化（i18n）

dist-site 支持 **中文 (zh)** 和 **英文 (en)**，自动检测浏览器语言。

- 翻译文件：`src/i18n/locales/en.json` 和 `src/i18n/locales/zh.json`
- 使用 [i18next](https://www.i18next.com/) + [react-i18next](https://react.i18next.com/)
- 从 `navigator.language` 自动检测语言
- 不支持的语言回退到英文

### 添加新语言

1. 复制 `src/i18n/locales/en.json` 到 `src/i18n/locales/{lang}.json`
2. 翻译所有值
3. 在 `src/i18n/index.js` 中导入：
   ```js
   import fr from './locales/fr.json';
   // 添加到 resources：
   resources: { en, zh, fr },
   ```

## 自定义主题

### 创建自定义主题

1. 创建新目录：`src/themes/my-theme/`
2. 创建 `Layout.jsx` 和 `Home.jsx`（从现有主题复制）
3. 在 `src/context/ThemeContext.jsx` 中注册：
   ```js
   const themeRegistry = {
     // ... 现有主题
     'my-theme': {
       Home: React.lazy(() => import('../themes/my-theme/Home')),
       Layout: React.lazy(() => import('../themes/my-theme/Layout')),
     },
   };
   ```
4. 在管理面板的下拉框 `web/src/pages/Setting/DistributorSettings.jsx` 中添加选项
5. 运行 `npm run build`

## 技术栈

- [React 18](https://react.dev) + [Vite](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [motion/react](https://motion.dev) (Framer Motion)
- [i18next](https://www.i18next.com/) + [react-i18next](https://react.i18next.com/)
- [OGL](https://github.com/oframe/ogl) (WebGL 极光/粒子效果)
- [react-hot-toast](https://react-hot-toast.com)
- [react-bits](https://github.com/DavidHDev/react-bits) 动画组件

## 许可证

MIT
