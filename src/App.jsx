import React, { lazy, Suspense } from 'react';
import { Navigate, Routes, Route, useLocation } from 'react-router-dom';
import AuthGuard from './components/AuthGuard';
import NotificationBell from './components/NotificationBell';
import SeoManager from './components/SeoManager';
import { ThemeProvider, useTheme } from './context/ThemeContext';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Tokens = lazy(() => import('./pages/Tokens'));
const Packages = lazy(() => import('./pages/Packages'));
const Pricing = lazy(() => import('./pages/Pricing'));
const AppMarket = lazy(() => import('./pages/AppMarket'));
const Faq = lazy(() => import('./pages/Faq'));
const Topup = lazy(() => import('./pages/Topup'));
const Logs = lazy(() => import('./pages/Logs'));
const Tasks = lazy(() => import('./pages/Tasks'));
const SubDistributor = lazy(() => import('./pages/SubDistributor'));
const Account = lazy(() => import('./pages/Account'));
const NotFound = lazy(() => import('./pages/NotFound'));

const Loading = () => (
  <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--page-bg)' }}>
    <div className="w-8 h-8 rounded-full animate-spin"
      style={{ border: '2px solid var(--page-spinner-track)', borderTopColor: 'var(--page-spinner)' }} />
  </div>
);

function LegacySubSiteRedirect() {
  const location = useLocation();
  return (
    <Navigate
      to={{
        pathname: '/ai-api-reseller-platform',
        search: location.search,
        hash: location.hash,
      }}
      replace
    />
  );
}

function ThemedRoutes() {
  const { Home, Layout } = useTheme();

  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* Public pages with themed layout */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/packages" element={<Packages />} />
          <Route path="/apps" element={<AppMarket />} />
          <Route path="/ai-api-reseller-platform" element={<SubDistributor />} />
          <Route path="/sub-site" element={<LegacySubSiteRedirect />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected pages */}
          <Route element={<AuthGuard />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tokens" element={<Tokens />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/topup" element={<Topup />} />
            <Route path="/account" element={<Account />} />
          </Route>
        </Route>

        <Route element={<Layout />}>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <NotificationBell />
    </Suspense>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <SeoManager />
      <ThemedRoutes />
    </ThemeProvider>
  );
}
