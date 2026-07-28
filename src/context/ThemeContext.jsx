import React, { createContext, useContext } from 'react';
import { useSite } from './SiteContext';

const ThemeContext = createContext(null);

const claudeTheme = {
  name: 'claude',
  Home: React.lazy(() => import('../themes/claude/Home')),
  Layout: React.lazy(() => import('../themes/claude/Layout')),
};

function ThemeLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--page-bg)' }}>
      <div className="w-8 h-8 rounded-full animate-spin"
        style={{ border: '2px solid var(--page-spinner-track)', borderTopColor: 'var(--page-spinner)' }} />
    </div>
  );
}

export function ThemeProvider({ children }) {
  const { loading } = useSite();

  if (loading) {
    return <ThemeLoading />;
  }

  return (
    <ThemeContext.Provider value={claudeTheme}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
