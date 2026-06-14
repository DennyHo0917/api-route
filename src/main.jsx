import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { SiteProvider } from './context/SiteContext';
import { getRouterBasename, normalizeLanguagePath } from './i18n/languageUtils';
import './i18n';
import './index.css';

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

const routerBasename = getRouterBasename(window.location.pathname);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
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
  </React.StrictMode>
);
