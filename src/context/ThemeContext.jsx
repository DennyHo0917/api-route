import React, { createContext, useContext } from 'react';

const ThemeContext = createContext(null);

const claudeTheme = {
  name: 'claude',
  Home: React.lazy(() => import('../themes/claude/Home')),
  Layout: React.lazy(() => import('../themes/claude/Layout')),
};

export function ThemeProvider({ children }) {
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
