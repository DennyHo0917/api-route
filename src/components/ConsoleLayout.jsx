import React, { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  BookOpen,
  Coins,
  Download,
  Gift,
  House,
  KeyRound,
  LogOut,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Settings2,
  UserRound,
  WalletCards,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

const navGroups = [
  {
    label: 'nav.groupOverview',
    items: [{ to: '/dashboard', label: 'nav.dashboard', icon: BarChart3 }],
  },
  {
    label: 'nav.groupDevelopment',
    items: [
      { to: '/api-keys', label: 'nav.apiKeys', icon: KeyRound },
      { to: '/api-connect', label: 'nav.apiAccess', icon: Settings2 },
      { to: '/docs/overview', activePrefix: '/docs', label: 'nav.docs', icon: BookOpen },
      { to: '/clients', label: 'nav.clients', icon: Download },
    ],
  },
  {
    label: 'nav.groupActivity',
    items: [{ to: '/chats', label: 'nav.aiChat', icon: MessageSquare }],
  },
  {
    label: 'nav.groupAccount',
    items: [
      { to: '/topup', label: 'nav.topup', icon: Coins },
      { to: '/packages', label: 'nav.packages', icon: WalletCards },
      { to: '/account', label: 'nav.account', icon: UserRound },
      { to: '/referrals', label: 'topup.inviteTitle', icon: Gift },
    ],
  },
];

export function ConsoleSidebar({ collapsed = false, onToggle = () => {} }) {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const sidebar = (
    <>
      <div className={`flex h-12 shrink-0 items-center border-b border-page-divider px-3 ${collapsed ? 'justify-center' : 'justify-end'}`}>
        <button
          type="button"
          onClick={onToggle}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-page-secondary hover:bg-page-surface-hover hover:text-page"
          aria-label={collapsed ? t('common.expandSidebar', { defaultValue: 'Expand sidebar' }) : t('common.collapseSidebar', { defaultValue: 'Collapse sidebar' })}
          title={collapsed ? t('common.expandSidebar', { defaultValue: 'Expand sidebar' }) : t('common.collapseSidebar', { defaultValue: 'Collapse sidebar' })}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto p-3">
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-1" aria-label={t(group.label)}>
            {!collapsed && (
              <p className="flex items-center gap-2 px-3 pb-1 text-[11px] font-bold tracking-wide text-page-link">
                <span>{t(group.label)}</span>
                <span aria-hidden="true" className="h-px flex-1 bg-page-divider" />
              </p>
            )}
            {group.items.map(({ to, activePrefix, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                title={collapsed ? t(label) : undefined}
                className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  collapsed ? 'justify-center' : ''
                } ${
                  isActive || (activePrefix && location.pathname.startsWith(activePrefix))
                    ? 'bg-page-link/10 text-page-link'
                    : 'text-page-secondary hover:bg-page-surface-hover hover:text-page'
                }`}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                <span className={collapsed ? 'sr-only' : ''}>{t(label)}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="space-y-1 border-t border-page-divider p-3">
        <Link to="/" title={collapsed ? t('nav.home') : undefined} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-page-secondary hover:bg-page-surface-hover ${collapsed ? 'justify-center' : ''}`}>
          <House className="h-[18px] w-[18px]" />
          <span className={collapsed ? 'sr-only' : ''}>{t('nav.home')}</span>
        </Link>
        <button type="button" onClick={handleLogout} title={collapsed ? t('nav.logout') : undefined} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-page-secondary hover:bg-red-500/10 hover:text-red-600 ${collapsed ? 'justify-center' : ''}`}>
          <LogOut className="h-[18px] w-[18px]" />
          <span className={collapsed ? 'sr-only' : ''}>{t('nav.logout')}</span>
        </button>
      </div>
    </>
  );

  return sidebar;
}

export default function ConsoleLayout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const isChatRoute = location.pathname === '/chats';

  return (
    <div className="theme-light theme-claude min-h-[calc(100dvh-72px)] bg-page-bg text-page">
      <aside className={`fixed inset-y-0 left-0 top-[72px] z-20 hidden flex-col border-r border-page-divider bg-page-card-bg transition-[width] duration-200 lg:flex ${collapsed ? 'w-16' : 'w-60'}`}>
        <ConsoleSidebar collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />
      </aside>

      <div className={`min-h-[calc(100dvh-72px)] transition-[margin] duration-200 ${
        isChatRoute
          ? (collapsed ? 'lg:ml-16' : 'lg:ml-60')
          : 'lg:mx-60'
      }`}>
        <main className="min-w-0"><Outlet /></main>
      </div>
    </div>
  );
}
