import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown, HelpCircle, LifeBuoy, ShieldCheck, Sparkles } from 'lucide-react';
import { normalizeAppLanguage } from '../i18n/languageUtils';
import { FAQ_COPY } from '../content/faqCopy';

function FaqItem({ item, defaultOpen }) {
  return (
    <details
      className="group rounded-xl border border-page-divider bg-page-surface px-5 py-4 shadow-sm transition-colors open:bg-page-inset"
      open={defaultOpen}
    >
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-left">
        <span className="text-base font-semibold leading-6 text-page">{item.question}</span>
        <ChevronDown className="mt-0.5 h-5 w-5 flex-shrink-0 text-page-muted transition-transform group-open:rotate-180" />
      </summary>
      <p className="mt-3 text-sm leading-7 text-page-secondary">{item.answer}</p>
    </details>
  );
}

function getSectionId(index) {
  return `faq-section-${index + 1}`;
}

export default function Faq() {
  const { i18n, t } = useTranslation();
  const language = normalizeAppLanguage(i18n.resolvedLanguage || i18n.language);
  const copy = FAQ_COPY[language] || FAQ_COPY.en;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-stretch">
        <div className="flex h-full flex-col justify-start gap-5">
          <div className="inline-flex w-fit items-center rounded-full border border-page-divider bg-page-surface px-3 py-1 text-sm font-semibold text-page">
            <HelpCircle className="mr-1.5 h-3.5 w-3.5 text-page-link" />
            {copy.badge}
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-bold tracking-tight text-page sm:text-4xl lg:text-5xl">
              {copy.title}
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-page-secondary sm:text-base">
              {copy.subtitle}
            </p>
          </div>
        </div>

        <div className="glass h-full rounded-xl p-4 shadow-sm">
          <div className="grid gap-3">
            {copy.cards.map((card) => (
              <Link
                key={card.to}
                to={card.to}
                className="group rounded-xl border border-page-divider bg-page-surface px-4 py-3 transition-colors hover:bg-page-surface-hover"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600">
                    <Sparkles size={16} />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-page group-hover:text-page-link">
                      {card.title}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-page-secondary">
                      {card.body}
                    </span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="space-y-3 lg:sticky lg:top-24 lg:self-start">
          {copy.sections.map((section, index) => (
            <a
              key={section.title}
              href={`#${getSectionId(index)}`}
              className="block rounded-xl border border-page-divider bg-page-surface px-4 py-3 text-sm font-semibold text-page-secondary transition-colors hover:bg-page-surface-hover hover:text-page"
            >
              {section.title}
            </a>
          ))}
        </aside>

        <div className="space-y-8">
          {copy.sections.map((section, sectionIndex) => (
            <section key={section.title} id={getSectionId(sectionIndex)} className="scroll-mt-28">
              <div className="mb-4 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-page-success" />
                <h2 className="text-xl font-semibold tracking-tight text-page">{section.title}</h2>
              </div>
              <div className="grid gap-3">
                {section.items.map((item, itemIndex) => (
                  <FaqItem
                    key={item.question}
                    item={item}
                    defaultOpen={sectionIndex === 0 && itemIndex === 0}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-xl border border-dashed border-page-divider bg-page-surface px-5 py-6 text-center">
        <LifeBuoy className="mx-auto h-8 w-8 text-page-link" />
        <h2 className="mt-3 text-lg font-semibold text-page">{copy.contactTitle}</h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-page-secondary">
          {copy.contactDesc}
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link to="/pricing" className="btn-secondary">
            {t('nav.pricing')}
          </Link>
          <Link to="/packages" className="btn-primary">
            {t('nav.packages')}
          </Link>
        </div>
      </section>
    </div>
  );
}
