import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Coins,
  Download,
  House,
  KeyRound,
  LogOut,
  MessageSquare,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  ReceiptText,
  Settings2,
  UserRound,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'nav.dashboard', icon: BarChart3, end: true },
  { to: '/api-keys', label: 'nav.apiKeys', icon: KeyRound },
  { to: '/api-connect', label: 'nav.apiAccess', icon: Settings2 },
  { to: '/clients', label: 'nav.clients', icon: Download },
  { to: '/chats', label: 'nav.aiChat', icon: MessageSquare },
  { to: '/dashboard/logs', label: 'logs.callLogs', icon: ReceiptText },
  { to: '/dashboard/tasks', label: 'tasks.title', icon: Network },
  { to: '/topup', label: 'nav.topup', icon: Coins },
  { to: '/account', label: 'nav.account', icon: UserRound },
];

export default function ConsoleLayout() {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const sidebar = (
    <>
      <div className={`flex h-12 shrink-0 items-center border-b border-page-divider px-3 ${collapsed ? 'justify-center' : 'justify-end'}`}>
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-page-secondary hover:bg-page-surface-hover hover:text-page"
          aria-label={collapsed ? t('common.expandSidebar', { defaultValue: 'Expand sidebar' }) : t('common.collapseSidebar', { defaultValue: 'Collapse sidebar' })}
          title={collapsed ? t('common.expandSidebar', { defaultValue: 'Expand sidebar' }) : t('common.collapseSidebar', { defaultValue: 'Collapse sidebar' })}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={collapsed ? t(label) : undefined}
            className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              collapsed ? 'justify-center' : ''
            } ${
              isActive
                ? 'bg-page-link/10 text-page-link'
                : 'text-page-secondary hover:bg-page-surface-hover hover:text-page'
            }`}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" />
            <span className={collapsed ? 'sr-only' : ''}>{t(label)}</span>
          </NavLink>
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

  return (
    <div className="theme-light theme-claude min-h-[calc(100dvh-72px)] bg-page-bg text-page">
      <aside className={`fixed inset-y-0 left-0 top-[72px] z-20 hidden flex-col border-r border-page-divider bg-page-card-bg transition-[width] duration-200 lg:flex ${collapsed ? 'w-16' : 'w-60'}`}>
        {sidebar}
      </aside>

      <div className="min-h-[calc(100dvh-72px)] lg:mx-60">
        <main className="min-w-0"><Outlet /></main>
      </div>
    </div>
  );
}
