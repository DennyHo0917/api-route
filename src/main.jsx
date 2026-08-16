import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App, { Loading } from './App';
import { AuthProvider } from './context/AuthContext';
import { SiteProvider } from './context/SiteContext';
import { getAutoLanguageRedirectPath, getPathLanguage, getRouterBasename, normalizeLanguagePath } from './i18n/languageUtils';
import { i18nReady } from './i18n';
import { createChunkRecovery, isChunkLoadError } from './utils/chunkRecovery';
import { captureAttribution } from './utils/attribution.js';
import '@fontsource-variable/inter/wght.css';
import '@fontsource-variable/jetbrains-mono/wght.css';
import './index.css';

captureAttribution();

const LOAD_ERROR_COPY = {
  en: { title: 'Page failed to load', action: 'Reload' },
  zh: { title: '页面加载失败', action: '重新加载' },
  ja: { title: 'ページを読み込めませんでした', action: '再読み込み' },
  ko: { title: '페이지를 불러오지 못했습니다', action: '새로고침' },
};

function LoadError() {
  const copy = LOAD_ERROR_COPY[getPathLanguage(window.location.pathname)] || LOAD_ERROR_COPY.en;
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-page-bg px-6 text-center text-page">
      <p className="text-base font-semibold">{copy.title}</p>
      <button type="button" className="btn-primary px-5 py-2.5" onClick={() => window.location.reload()}>
        {copy.action}
      </button>
    </div>
  );
}

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { status: 'ready' };
  }

  static getDerivedStateFromError(error) {
    return { status: isChunkLoadError(error) ? 'recovering' : 'fatal' };
  }

  componentDidCatch(error) {
    if (!isChunkLoadError(error)) return;
    if (recoverFromChunkLoadError(error) === 'exhausted') {
      this.setState({ status: 'fatal' });
    }
  }

  render() {
    if (this.state.status === 'recovering') return <Loading />;
    if (this.state.status === 'fatal') return <LoadError />;
    return this.props.children;
  }
}

const recoverFromChunkLoadError = createChunkRecovery({
  getStorage: () => window.sessionStorage,
  reload: () => window.location.reload(),
});

window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  recoverFromChunkLoadError(event.payload, { force: true });
});

window.addEventListener('unhandledrejection', (event) => {
  if (!isChunkLoadError(event.reason)) return;
  if (recoverFromChunkLoadError(event.reason) === 'recovering') {
    event.preventDefault();
  }
});

const normalizedLanguagePath = normalizeLanguagePath(
  window.location.pathname,
  window.location.search,
  window.location.hash,
);

if (normalizedLanguagePath) {
  window.history.replaceState(
    window.history.state,
    '',
    normalizedLanguagePath,
  );
}

const autoLanguageRedirectPath = getAutoLanguageRedirectPath(
  window.location.pathname,
  window.location.search,
  window.location.hash,
);

if (autoLanguageRedirectPath) {
  window.location.replace(autoLanguageRedirectPath);
} else {
  const routerBasename = getRouterBasename(window.location.pathname);
  if (getPathLanguage(window.location.pathname) !== 'en') {
    import('@fontsource-variable/noto-sans-sc/wght.css').catch(() => {});
  }

  i18nReady.then(() => {
    ReactDOM.createRoot(document.getElementById('root')).render(
      <React.StrictMode>
        <AppErrorBoundary>
          <BrowserRouter basename={routerBasename}>
            <SiteProvider>
              <AuthProvider>
                <App />
                <Toaster
                  position="top-center"
                  toastOptions={{
                    duration: 3000,
                    style: {
                      background: '#1a1a2e',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '12px',
                      fontSize: '14px',
                    },
                  }}
                />
              </AuthProvider>
            </SiteProvider>
          </BrowserRouter>
        </AppErrorBoundary>
      </React.StrictMode>
    );
  }).catch(() => {
    ReactDOM.createRoot(document.getElementById('root')).render(<LoadError />);
  });
}
