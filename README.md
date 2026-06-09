# SubRouter Dist-Site Template

A beautiful, open-source frontend template for SubRouter distributors. Built with React, Vite, Tailwind CSS, and [react-bits](https://github.com/DavidHDev/react-bits) animation components.

## Features

- **4 Built-in Theme Templates** — Starter, Default, Dark (Cyberpunk), Minimal
- **i18n Dual Language** — Chinese / English, auto-detected from browser
- Dark-mode-first design with glassmorphism UI
- Animated landing pages with gradient text, spotlight cards, particles, aurora effects
- User registration, login, and dashboard
- API key management
- Model pricing table
- Package subscription
- Fully responsive
- OpenAI-compatible API endpoint display

## Quick Start

```bash
# Install dependencies
npm install

# Development server (port 3001, proxies /api to localhost:3000)
npm run dev

# Production build
npm run build
```

## Theme Templates

The dist-site includes **4 built-in theme templates**, each with a distinct visual style. The theme is selected by the distributor in the admin panel and served dynamically at runtime.

### Available Themes

| Theme | Value | Description |
|-------|-------|-------------|
| **Starter** | `starter` | Original glassmorphism design with gradient text, spotlight cards, and star borders. Indigo/purple color scheme. |
| **Default** | `default` | Aurora animated background with split text animation, tilted cards, and rotating feature text. Colorful gradients. |
| **Dark** | `dark` | Cyberpunk/terminal style with particle background, decrypted text animation, and monospace font. Green accent color. |
| **Minimal** | `minimal` | Clean, elegant design with fade-in animations, numbered feature list, and minimal borders. Maximum whitespace. |

### How to Switch Themes

#### Method 1: Admin Panel (Recommended)

1. Log in to the main SubRouter admin panel
2. Go to **Distributor Settings** (分站设置)
3. Find the **Theme Template** (主题模板) dropdown
4. Select your preferred theme
5. Click **Save** — the change takes effect immediately

#### Method 2: API

```bash
# Update theme via API
curl -X PUT /api/distributor/self \
  -H "Content-Type: application/json" \
  -d '{"theme_template": "dark"}'
```

Valid values: `starter`, `default`, `dark`, `minimal`

### How It Works

All 4 themes are compiled into a single build. The dist-site reads the `theme_template` field from the `/api/dist/site/info` endpoint and dynamically loads the corresponding Layout and Home components at runtime via React lazy loading. Shared pages (Login, Register, Dashboard, Tokens, Pricing, Packages) are the same across all themes.

## i18n (Internationalization)

The dist-site supports **Chinese (zh)** and **English (en)** with automatic browser language detection.

- Translation files: `src/i18n/locales/en.json` and `src/i18n/locales/zh.json`
- Uses [i18next](https://www.i18next.com/) + [react-i18next](https://react.i18next.com/)
- Language auto-detected from `navigator.language`
- Falls back to English if browser language is not supported

### Adding a New Language

1. Copy `src/i18n/locales/en.json` to `src/i18n/locales/{lang}.json`
2. Translate all values
3. Import it in `src/i18n/index.js`:
   ```js
   import fr from './locales/fr.json';
   // Add to resources:
   resources: { en, zh, fr },
   ```

## Configuration

The template automatically fetches site configuration from the backend API:

- **Site info**: `GET /api/dist/site/info` — name, logo, favicon, announcement, theme_template
- **Models**: `GET /api/dist/site/models` — available AI models
- **Pricing**: `GET /api/dist/site/pricing` — per-model pricing
- **Packages**: `GET /api/dist/site/packages` — subscription packages

## Customization

### Theme Structure

Each theme lives in `src/themes/{theme_name}/` and contains:
- `Layout.jsx` — Header, footer, and navigation
- `Home.jsx` — Landing page with hero section, features, models, packages, CTA

```
src/themes/
├── starter/    # Glassmorphism + GradientText + SpotlightCard
├── default/    # Aurora background + SplitText + TiltedCard
├── dark/       # Particles + DecryptedText (cyberpunk)
└── minimal/    # Clean + FadeContent (elegant)
```

### react-bits Components

Available in `src/components/bits/`:

| Component | Used By | Description |
|-----------|---------|-------------|
| `GradientText` | Starter | Animated gradient text |
| `BlurText` | Starter | Words blur-in animation |
| `ShinyText` | Starter | Sweeping shine effect |
| `SpotlightCard` | Starter, shared pages | Mouse-following spotlight glow |
| `StarBorder` | Starter | Animated star-light border |
| `CountUp` | All themes | Spring-physics number counter |
| `Aurora` | Default | WebGL aurora borealis background |
| `SplitText` | Default | Per-character reveal animation |
| `RotatingText` | Default | Rotating text carousel |
| `TiltedCard` | Default | 3D tilt card on hover |
| `Particles` | Dark | WebGL particle system |
| `DecryptedText` | Dark | Matrix-style text decrypt |
| `GlitchText` | Dark | CSS glitch text effect |
| `FadeContent` | Minimal | Intersection-based fade in |
| `ScrollFloat` | — | Scroll-triggered float animation |
| `PixelCard` | — | Pixelated card effect |
| `Waves` | — | Canvas wave background |

### Creating a Custom Theme

1. Create a new directory: `src/themes/my-theme/`
2. Create `Layout.jsx` and `Home.jsx` (copy from an existing theme as a starting point)
3. Register it in `src/context/ThemeContext.jsx`:
   ```js
   const themeRegistry = {
     // ... existing themes
     'my-theme': {
       Home: React.lazy(() => import('../themes/my-theme/Home')),
       Layout: React.lazy(() => import('../themes/my-theme/Layout')),
     },
   };
   ```
4. Add the option to the admin panel's dropdown in `web/src/pages/Setting/DistributorSettings.jsx`
5. Run `npm run build`

### Shared Pages

Pages in `src/pages/` are shared across all themes:
- `Login.jsx` / `Register.jsx` — Authentication
- `Dashboard.jsx` — User overview with balance, usage, redeem
- `Tokens.jsx` — API key management
- `Pricing.jsx` — Model pricing table
- `Packages.jsx` — Subscription packages

## Tech Stack

- [React 18](https://react.dev) + [Vite](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [motion/react](https://motion.dev) (Framer Motion)
- [i18next](https://www.i18next.com/) + [react-i18next](https://react.i18next.com/)
- [OGL](https://github.com/oframe/ogl) (WebGL for Aurora/Particles)
- [react-hot-toast](https://react-hot-toast.com)
- [react-bits](https://github.com/DavidHDev/react-bits) animation components

## License

MIT
