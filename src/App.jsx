import React, { lazy, Suspense, useEffect } from 'react';
import { Navigate, NavLink, Outlet, Routes, Route, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AuthGuard from './components/AuthGuard';
import NotificationBell from './components/NotificationBell';
import ConsoleLayout from './components/ConsoleLayout';
import SeoManager from './components/SeoManager';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { rememberAuthReturnTo } from './utils/authReturn';

const Login = lazy(() => import('./pages/Login'));
const OAuthCallback = lazy(() => import('./pages/OAuthCallback'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const QuickStart = lazy(() => import('./pages/QuickStart'));
const Tokens = lazy(() => import('./pages/Tokens'));
const ApiConnect = lazy(() => import('./pages/ApiConnect'));
const Clients = lazy(() => import('./pages/Clients'));
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
const Legal = lazy(() => import('./pages/Legal'));

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

function AuthReturnTracker() {
  const location = useLocation();

  useEffect(() => {
    rememberAuthReturnTo(location);
  }, [location]);

  return null;
}

function MergedPageLayout({ labelKey, tabs }) {
  const { t } = useTranslation();

  return (
    <>
      <div className="mx-auto flex max-w-7xl justify-center px-6 pt-8">
        <nav
          aria-label={t(labelKey)}
          className="inline-flex max-w-full gap-1 overflow-x-auto rounded-full border border-page-divider bg-page-surface p-1.5 shadow-sm"
        >
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-page-link text-white shadow-sm'
                    : 'text-page-secondary hover:bg-page-surface-hover hover:text-page'
                }`
              }
            >
              {t(tab.labelKey)}
            </NavLink>
          ))}
        </nav>
      </div>
      <Outlet />
    </>
  );
}

const TOPUP_TABS = [
  { to: '/topup', labelKey: 'nav.topup', end: true },
  { to: '/topup/packages', labelKey: 'nav.packages' },
];

const DASHBOARD_TABS = [
  { to: '/dashboard', labelKey: 'dashboard.analyticsTitle', end: true },
  { to: '/dashboard/logs', labelKey: 'logs.callLogs' },
  { to: '/dashboard/tasks', labelKey: 'tasks.title' },
];

function ThemedRoutes() {
  const { Home, Layout } = useTheme();

  return (
    <Suspense fallback={<Loading />}>
      <AuthReturnTracker />
      <Routes>
        {/* Public pages with themed layout */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/pricing/packages" element={<Navigate to="/packages" replace />} />
          <Route path="/packages" element={<Packages />} />
          <Route path="/apps" element={<AppMarket />} />
          <Route path="/ai-api-reseller-platform" element={<SubDistributor />} />
          <Route path="/sub-site" element={<LegacySubSiteRedirect />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/privacy-policy" element={<Legal type="privacy" />} />
          <Route path="/terms-of-service" element={<Legal type="terms" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/oauth/:provider" element={<OAuthCallback />} />
          <Route path="/register" element={<Register />} />

        </Route>

        {/* Signed-in workspace */}
        <Route element={<AuthGuard />}>
          <Route element={<Layout />}>
            <Route element={<ConsoleLayout />}>
              <Route
                path="/dashboard"
                element={<MergedPageLayout labelKey="nav.dashboard" tabs={DASHBOARD_TABS} />}
              >
                <Route index element={<Dashboard />} />
                <Route path="logs" element={<Logs />} />
                <Route path="tasks" element={<Tasks />} />
              </Route>
              <Route path="/api-keys" element={<Tokens />} />
              <Route path="/chats" element={<QuickStart />} />
              <Route
                path="/topup"
                element={<MergedPageLayout labelKey="nav.topup" tabs={TOPUP_TABS} />}
              >
                <Route index element={<Topup />} />
                <Route path="packages" element={<Packages />} />
              </Route>
              <Route path="/api-connect" element={<ApiConnect />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/logs" element={<Navigate to="/dashboard/logs" replace />} />
              <Route path="/tasks" element={<Navigate to="/dashboard/tasks" replace />} />
              <Route path="/account" element={<Account />} />
            </Route>
            <Route path="/tokens" element={<Navigate to="/chats" replace />} />
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
