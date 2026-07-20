import React, { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Headset, LogOut, Menu, Moon, Sun, UserRound, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { COLOR_SCHEME_STORAGE_KEY, useSite } from '../../context/SiteContext';
import LanguageSwitch from '../../components/LanguageSwitch';
import {
  getSiteNavItems,
  getVisibleNavItems,
  isSiteNavActive,
} from '../../utils/navigation';
import { getLegalCopy } from '../../content/legalCopy';
import { normalizeAppLanguage } from '../../i18n/languageUtils';

const SUPPORT_EMAIL = 'support@api-route.com';

function getSupportLink(site) {
  const announcement = String(site?.announcement || '');
  const telegramMatch = announcement.match(/https?:\/\/(?:www\.)?(?:t\.me|telegram\.me)\/[^\s<>"']+/i);
  if (telegramMatch) {
    return {
      href: 'https://t.me/cryptocrc_revolution',
      isTelegram: true,
    };
  }

  if (site?.contact_email) {
    return {
      href: `mailto:${site.contact_email}`,
      isTelegram: false,
    };
  }

  return null;
}

export default function ClaudeLayout() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { site } = useSite();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [snapDeckAtEnd, setSnapDeckAtEnd] = useState(false);
  const [colorScheme, setColorScheme] = useState(() => (
    document.documentElement.dataset.colorScheme === 'dark' ? 'dark' : 'light'
  ));

  const rawSiteName = site?.name || 'API-Route';
  const siteName = rawSiteName.toLowerCase() === 'api-route' ? 'API-Route' : rawSiteName;
  const visibleNavItems = getVisibleNavItems(getSiteNavItems({ t, site }), user);
  const desktopNavItems = visibleNavItems;
  const isNavActive = (to) => isSiteNavActive(location.pathname, to);
  const getNavLabel = (item) => {
    if (item.to === '/ai-api-reseller-platform') return t('subDist.navShort');
    if (item.to === '/logs') return t('nav.logsShort');
    return item.label;
  };
  const supportLink = getSupportLink(site);
  const supportLabel = supportLink?.isTelegram
    ? t('nav.telegramSupport')
    : t('nav.contactSupport');
  const legalLabels = getLegalCopy(
    normalizeAppLanguage(i18n.resolvedLanguage || i18n.language),
    'privacy',
  ).labels;
  const isSnapDeckPage = location.pathname === '/' || location.pathname === '/ai-api-reseller-platform';

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    setSnapDeckAtEnd(false);
    if (!isSnapDeckPage) return undefined;

    const onSnapDeckState = (event) => {
      setSnapDeckAtEnd(Boolean(event.detail?.atEnd));
    };

    window.addEventListener('api-route:snap-deck-state', onSnapDeckState);
    return () => window.removeEventListener('api-route:snap-deck-state', onSnapDeckState);
  }, [isSnapDeckPage, location.pathname]);

  const setDocumentColorScheme = (nextScheme) => {
    setColorScheme(nextScheme);
    document.documentElement.dataset.colorScheme = nextScheme;
    try {
      window.localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, nextScheme);
    } catch {
      // Theme still changes for this page view.
    }
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.content = nextScheme === 'dark' ? '#15110F' : '#FAF6F1';
  };

  const toggleColorScheme = (event) => {
    const nextScheme = colorScheme === 'dark' ? 'light' : 'dark';
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!document.startViewTransition || reduceMotion) {
      setDocumentColorScheme(nextScheme);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    const transition = document.startViewTransition(() => {
      setDocumentColorScheme(nextScheme);
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${radius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 760,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          pseudoElement: '::view-transition-new(root)',
        },
      );
    }).catch(() => {});
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const footerClassName = isSnapDeckPage
    ? `fixed inset-x-0 bottom-0 z-40 border-t border-[#E8DDD0] bg-[#F1E8DE] shadow-[0_-18px_48px_rgba(84,57,36,0.08)] transition-all duration-500 ease-out ${
      snapDeckAtEnd ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-full opacity-0'
    }`
    : 'mt-auto border-t border-[#E8DDD0] bg-[#F1E8DE]';

  return (
    <div className="theme-light theme-claude min-h-screen flex flex-col bg-[#FAF6F1] text-[#3D3024]">
      <header className="sticky top-0 z-50 border-b border-[#E8DDD0] bg-[#FAF6F1]/92 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-5 px-5 md:px-8">
          <Link to="/" className="flex shrink-0 items-center gap-3 group">
            {site?.logo ? (
              <img src={site.logo} alt={siteName} className="h-9 w-9 rounded-xl object-contain" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#D97757] text-sm font-bold text-white shadow-sm">
                {siteName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <span className="block text-[17px] font-bold leading-none text-[#3D3024] transition-colors group-hover:text-[#D97757]">
                {siteName}
              </span>
              <span className="mt-1 hidden text-[10px] font-medium uppercase tracking-[0.18em] text-[#9B8876] sm:block">
                Unified AI API
              </span>
            </div>
          </Link>

          <nav className="hidden min-w-0 items-center gap-1 lg:flex">
            {desktopNavItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`whitespace-nowrap rounded-full px-3 py-2 text-sm transition-all ${
                  isNavActive(item.to)
                    ? 'bg-white text-[#3D3024] shadow-sm ring-1 ring-[#E8DDD0] font-semibold'
                    : 'text-[#766657] hover:bg-white/60 hover:text-[#3D3024]'
                }`}
              >
                {getNavLabel(item)}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-1.5">
            {supportLink && (
              <a
                href={supportLink.href}
                target={supportLink.isTelegram ? '_blank' : undefined}
                rel={supportLink.isTelegram ? 'noopener noreferrer' : undefined}
                className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#E5D4C6] bg-white/65 text-[#8F5D48] transition-colors hover:border-[#D8BBA7] hover:bg-[#FFF9F4] hover:text-[#C4613F] lg:inline-flex"
                title={supportLabel}
                aria-label={supportLabel}
              >
                <Headset size={17} />
              </a>
            )}
            <LanguageSwitch
              iconOnly
              className="border border-[#E5D4C6] bg-white/65 text-[#8F5D48] hover:border-[#D8BBA7] hover:bg-[#FFF9F4] hover:text-[#C4613F]"
            />
            <button
              type="button"
              onClick={toggleColorScheme}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#E5D4C6] bg-white/65 text-[#8F5D48] transition-colors hover:border-[#D8BBA7] hover:bg-[#FFF9F4] hover:text-[#C4613F]"
              title={colorScheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label={colorScheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {colorScheme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {user ? (
              <>
                <Link
                  to="/account"
                  className="hidden items-center gap-2 rounded-full border border-[#E8DDD0] bg-white/70 px-3 py-2 text-sm font-medium text-[#5E4E40] transition-colors hover:border-[#D9C5B2] hover:bg-white sm:flex"
                >
                  <UserRound size={15} />
                  <span className="max-w-24 truncate">{user.display_name || user.username}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="hidden rounded-full p-2.5 text-[#8B7D6E] transition-colors hover:bg-white hover:text-[#D97757] sm:block"
                  title={t('nav.logout')}
                >
                  <LogOut size={17} />
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden px-3 py-2 text-sm font-medium text-[#6B5D4F] transition-colors hover:text-[#3D3024] sm:block"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  className="hidden rounded-full bg-[#D97757] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#C4613F] sm:block"
                >
                  {t('nav.signUp')}
                </Link>
              </>
            )}

            <button
              className="rounded-full p-2.5 text-[#6B5D4F] transition-colors hover:bg-white lg:hidden"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-[#E8DDD0] bg-[#FAF6F1] lg:hidden">
            <nav className="mx-auto grid max-w-7xl gap-1 px-5 py-4 md:grid-cols-2 md:px-8">
              {visibleNavItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`rounded-xl px-4 py-3 text-sm transition-colors ${
                    isNavActive(item.to)
                      ? 'bg-white font-semibold text-[#D97757] shadow-sm'
                      : 'text-[#6B5D4F] hover:bg-white/70 hover:text-[#3D3024]'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              {supportLink && (
                <a
                  href={supportLink.href}
                  target={supportLink.isTelegram ? '_blank' : undefined}
                  rel={supportLink.isTelegram ? 'noopener noreferrer' : undefined}
                  className="flex items-center gap-2 rounded-xl border border-[#E5D4C6] bg-white/65 px-4 py-3 text-sm font-semibold text-[#8F5D48] transition-colors hover:bg-[#FFF9F4] hover:text-[#C4613F]"
                >
                  <Headset size={17} />
                  {supportLabel}
                </a>
              )}
              {!user && (
                <>
                  <Link to="/login" className="rounded-xl px-4 py-3 text-sm text-[#6B5D4F] hover:bg-white/70">
                    {t('nav.login')}
                  </Link>
                  <Link to="/register" className="mt-2 rounded-xl bg-[#D97757] px-4 py-3 text-center text-sm font-semibold text-white md:mt-0">
                    {t('nav.signUp')}
                  </Link>
                </>
              )}
              {user && (
                <button
                  onClick={handleLogout}
                  className="mt-2 flex items-center gap-2 rounded-xl px-4 py-3 text-left text-sm text-[#D97757] hover:bg-white/70"
                >
                  <LogOut size={16} />
                  {t('nav.logout')}
                </button>
              )}
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1"><Outlet /></main>

      <footer className={footerClassName}>
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-10 md:flex-row md:items-center md:justify-between md:px-8">
          <div>
            <p className="font-semibold text-[#3D3024]">{siteName}</p>
            <p className="mt-1 text-sm text-[#8B7D6E]">One API for the models you use.</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#766657]">
            <Link to="/apps" className="hover:text-[#D97757]">{t('nav.apps')}</Link>
            <Link to="/faq" className="hover:text-[#D97757]">{t('nav.faq')}</Link>
            <Link to="/privacy-policy" className="hover:text-[#D97757]">{legalLabels.privacy}</Link>
            <Link to="/terms-of-service" className="hover:text-[#D97757]">{legalLabels.terms}</Link>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-[#D97757]">
              {SUPPORT_EMAIL}
            </a>
            {supportLink?.isTelegram && (
              <a
                href={supportLink.href}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#D97757]"
              >
                {supportLabel}
              </a>
            )}
            <span className="text-[#A89685]">&copy; {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
