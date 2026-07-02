import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getLegalCopy } from '../content/legalCopy';
import { normalizeAppLanguage } from '../i18n/languageUtils';

export default function Legal({ type = 'privacy' }) {
  const { i18n } = useTranslation();
  const language = normalizeAppLanguage(i18n.resolvedLanguage || i18n.language);
  const { labels, page } = getLegalCopy(language, type);

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-12 sm:px-6 sm:py-16">
      <Link to="/" className="text-sm font-semibold text-page-link hover:opacity-80">
        {labels.backHome}
      </Link>
      <header className="mt-6 border-b border-page-divider pb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-page-link">
          API-Route
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-page sm:text-5xl">
          {page.title}
        </h1>
        <p className="mt-3 text-sm text-page-muted">{labels.lastUpdated}: {page.updated}</p>
        <p className="mt-5 text-base leading-8 text-page-secondary">{page.intro}</p>
      </header>

      <div className="mt-8 space-y-7">
        {page.sections.map((section) => (
          <section key={section.title} className="rounded-xl border border-page-divider bg-page-surface p-5">
            <h2 className="text-xl font-semibold text-page">{section.title}</h2>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-page-secondary">
              {section.body.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
