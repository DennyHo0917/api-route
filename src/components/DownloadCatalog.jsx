import React from 'react';
import { useTranslation } from 'react-i18next';
import { Code, Download, MonitorDown, PackageCheck, ShieldCheck, Sparkles, SquareTerminal } from 'lucide-react';
import { DOWNLOAD_TOOLS } from '../constants/downloads';

const iconMap = {
  'cc-switch': Sparkles,
  codex: MonitorDown,
  'claude-code': SquareTerminal,
  vscode: Code,
  'cherry-studio': PackageCheck,
  nodejs: Download,
};

export default function DownloadCatalog({ embedded = false }) {
  const { t, i18n } = useTranslation();
  const isZh = i18n.resolvedLanguage?.startsWith('zh');

  return (
    <section className={embedded ? '' : 'space-y-6'}>
      {!embedded && <div className="glass rounded-xl p-6">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-page-link/20 bg-page-link/10 px-3 py-1 text-xs font-semibold text-page-link">
          <ShieldCheck className="h-3.5 w-3.5" />
          {t('downloads.badge')}
        </div>
        <h2 className="text-2xl font-black tracking-tight text-page md:text-3xl">
          {t('downloads.title')}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-page-secondary">
          {t('downloads.subtitle')}
        </p>
      </div>}

      <div className="grid gap-4 lg:grid-cols-2">
        {DOWNLOAD_TOOLS.map((tool) => {
          const Icon = iconMap[tool.id] || Download;

          return (
            <article key={tool.id} className="glass rounded-xl p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-page-link/10 text-page-link">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-page">{tool.title}</h3>
                    {tool.version && (
                      <span className="rounded-full bg-page-inset/70 px-2 py-0.5 text-xs text-page-muted">
                        {tool.version}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm leading-6 text-page-secondary">
                    {isZh ? tool.descZh : tool.descEn}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {tool.groups.map((group) => (
                  <div key={group.title} className="flex items-center gap-3 overflow-x-auto">
                    <p className="shrink-0 text-xs font-semibold uppercase tracking-wide text-page-muted">
                      {group.title === 'Download' ? t('downloads.download') : group.title}
                    </p>
                    <div className="flex shrink-0 gap-2">
                      {group.links.map((link) => (
                        <a
                          key={`${group.title}-${link.label}`}
                          href={link.href}
                          target="_blank"
                          rel="noreferrer"
                          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                            link.recommended
                              ? 'border-page-link/30 bg-page-link/10 text-page-link hover:bg-page-link/15'
                              : 'border-page-divider bg-page-surface/50 text-page-secondary hover:bg-page-surface-hover hover:text-page'
                          }`}
                        >
                          <Download className="h-3.5 w-3.5" />
                          {link.official ? `${tool.title} ${t('downloads.officialDownload')}` : link.label}
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
