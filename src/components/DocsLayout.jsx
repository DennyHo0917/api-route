import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DOCS_NAVIGATION_COPY } from '../content/docsSeoCopy';
import { useAuth } from '../context/AuthContext';
import { normalizeAppLanguage } from '../i18n/languageUtils';
import { ConsoleSidebar } from './ConsoleLayout';

const DOC_PAGES = [
  ['/docs/overview', 'overview'],
  ['/docs/quickstart', 'quickstart'],
];

export function useDocsActiveSection(directory) {
  const [activeSection, setActiveSection] = useState(directory[0]?.[0] || '');

  useEffect(() => {
    const firstSection = directory[0]?.[0] || '';
    const updateActiveSection = () => {
      const lastSection = directory.at(-1)?.[0];
      const atPageBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      const currentSection = atPageBottom
        ? lastSection
        : directory.reduce((active, [id]) => {
          const section = document.getElementById(id);
          return section && section.getBoundingClientRect().top <= 140 ? id : active;
        }, firstSection);
      setActiveSection(currentSection || firstSection);
    };

    setActiveSection(firstSection);
    updateActiveSection();
    window.addEventListener('scroll', updateActiveSection, { passive: true });
    return () => window.removeEventListener('scroll', updateActiveSection);
  }, [directory]);

  return activeSection;
}

function SectionLinks({ activeSection, directory }) {
  const handleClick = (event, id) => {
    const section = document.getElementById(id);
    if (!section) return;
    event.preventDefault();
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${id}`);
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav className="mt-3 space-y-1">
      {directory.map(([id, label], index) => (
        <a
          key={id}
          href={`#${id}`}
          onClick={(event) => handleClick(event, id)}
          aria-current={activeSection === id ? 'location' : undefined}
          className={`flex items-start gap-2 py-1.5 text-sm transition-colors hover:text-page-link focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-page-link/40 ${
            activeSection === id ? 'font-bold text-page-link' : 'text-page-secondary'
          }`}
        >
          <span className="w-6 shrink-0 pt-0.5 text-xs tabular-nums">{String(index + 1).padStart(2, '0')}</span>
          <span>{label}</span>
        </a>
      ))}
    </nav>
  );
}

function DocsNavigation({ activeSection, directory, navigation }) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentDocumentPath = location.pathname.endsWith('/quickstart')
    ? '/docs/quickstart'
    : '/docs/overview';

  return (
    <>
      <aside className="hidden self-start lg:sticky lg:top-24 lg:block" aria-label={navigation.title}>
        <div className="border-r border-page-divider pr-4">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-page-secondary">{navigation.title}</p>
          <nav className="mt-3 space-y-1">
            {DOC_PAGES.map(([to, key]) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `block border-l-2 py-1.5 pl-3 text-sm transition-colors hover:text-page-link ${
                  isActive
                    ? 'border-page-link font-semibold text-page-link'
                    : 'border-transparent text-page-secondary'
                }`}
              >
                {navigation[key]}
              </NavLink>
            ))}
          </nav>

          <div className="my-5 border-t border-page-divider" />
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-page-secondary">{navigation.onThisPage}</p>
          <SectionLinks activeSection={activeSection} directory={directory} />
        </div>
      </aside>

      <div className="min-w-0 space-y-3 lg:hidden">
        <label className="block text-xs font-bold uppercase tracking-[0.14em] text-page-secondary" htmlFor="docs-page-select">
          {navigation.selectLabel}
        </label>
        <select
          id="docs-page-select"
          value={currentDocumentPath}
          onChange={(event) => navigate(event.target.value)}
          className="h-10 w-full rounded-md border border-page-divider bg-page-card-bg px-3 text-sm text-page outline-none focus:border-page-link focus:ring-2 focus:ring-page-link/20"
        >
          {DOC_PAGES.map(([to, key]) => <option key={to} value={to}>{navigation[key]}</option>)}
        </select>
        <details className="rounded-md border border-page-divider bg-page-card-bg px-3 py-2">
          <summary className="cursor-pointer text-sm font-semibold text-page focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-page-link/40">
            {navigation.onThisPage}
          </summary>
          <SectionLinks activeSection={activeSection} directory={directory} />
        </details>
      </div>
    </>
  );
}

export default function DocsPageFrame({ activeSection, children, directory }) {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const language = normalizeAppLanguage(i18n.resolvedLanguage || i18n.language);
  const navigation = DOCS_NAVIGATION_COPY[language] || DOCS_NAVIGATION_COPY.en;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="theme-light theme-claude min-h-[calc(100dvh-72px)] bg-page-bg text-page">
      {user && (
        <aside className={`fixed inset-y-0 left-0 top-[72px] z-20 hidden flex-col border-r border-page-divider bg-page-card-bg transition-[width] duration-200 lg:flex ${sidebarCollapsed ? 'w-16' : 'w-60'}`}>
          <ConsoleSidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed((value) => !value)}
          />
        </aside>
      )}

      <div className={`min-h-[calc(100dvh-72px)] ${user ? 'lg:mx-60' : ''}`}>
        <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 lg:py-16">
          <div className="grid gap-6 lg:grid-cols-[170px_minmax(0,1fr)] lg:items-start lg:gap-10">
            <DocsNavigation
              activeSection={activeSection}
              directory={directory}
              navigation={navigation}
            />
            <main className="min-w-0 max-w-4xl space-y-16">{children}</main>
          </div>
        </div>
      </div>
    </div>
  );
}
