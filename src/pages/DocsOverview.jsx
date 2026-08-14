import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DocsPageFrame, { useDocsActiveSection } from '../components/DocsLayout';
import { getDocsCopy } from '../content/docsCopy';
import { normalizeAppLanguage } from '../i18n/languageUtils';

function SectionHeading({ body, kicker, title }) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-page-link">{kicker}</p>
      <h2 className="mt-3 text-2xl font-bold tracking-[-0.03em] text-page sm:text-3xl">{title}</h2>
      {body && <p className="mt-3 text-sm leading-7 text-page-secondary sm:text-base">{body}</p>}
    </div>
  );
}

function SubsectionHeading({ body, title }) {
  return (
    <div>
      <h3 className="text-lg font-bold tracking-[-0.02em] text-page sm:text-xl">{title}</h3>
      {body && <p className="mt-3 text-sm leading-7 text-page-secondary sm:text-base">{body}</p>}
    </div>
  );
}

function StepList({ items }) {
  return (
    <ol className="mt-7 list-decimal space-y-4 border-y border-page-divider py-5 pl-6 marker:font-bold marker:text-page-link">
      {items.map(([title, body]) => (
        <li key={title} className="pl-2">
          <p className="text-sm font-bold text-page">{title}</p>
          <p className="mt-1 text-sm leading-6 text-page-secondary">{body}</p>
        </li>
      ))}
    </ol>
  );
}

function DetailList({ items }) {
  return (
    <dl className="mt-7 divide-y divide-page-divider border-y border-page-divider">
      {items.map(([title, body]) => (
        <div key={title} className="grid gap-2 py-4 sm:grid-cols-[190px_1fr] sm:gap-6">
          <dt className="text-sm font-bold text-page">{title}</dt>
          <dd className="text-sm leading-6 text-page-secondary">{body}</dd>
        </div>
      ))}
    </dl>
  );
}

function BulletList({ items }) {
  return (
    <ul className="mt-5 list-disc space-y-2 pl-5 text-sm leading-6 text-page-secondary marker:text-page-link">
      {items.map((item) => <li key={item}>{item}</li>)}
    </ul>
  );
}

function ComparisonTable({ headers, rows, title }) {
  return (
    <div className="mt-7 max-w-full overflow-x-auto rounded-md border border-page-divider">
      <table className="w-full min-w-[660px] border-collapse text-left text-sm">
        <caption className="sr-only">{title}</caption>
        <thead className="bg-page-surface">
          <tr>
            {headers.map((header) => (
              <th key={header} scope="col" className="border-b border-page-divider px-4 py-3 font-bold text-page">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-page-divider">
          {rows.map(([label, ...values]) => (
            <tr key={label}>
              <th scope="row" className="w-44 px-4 py-3 align-top font-semibold text-page">{label}</th>
              {values.map((value, index) => (
                <td key={`${label}-${index}`} className="px-4 py-3 align-top leading-6 text-page-secondary">{value}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PageLinks({ items }) {
  return (
    <p className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm">
      {items.map(([to, label]) => (
        <Link key={to} to={to} className="font-bold text-page-link hover:underline">{label}</Link>
      ))}
    </p>
  );
}

export default function DocsOverview() {
  const { i18n } = useTranslation();
  const language = normalizeAppLanguage(i18n.resolvedLanguage || i18n.language);
  const copy = getDocsCopy(language).overview;
  const activeSection = useDocsActiveSection(copy.directory);

  return (
    <DocsPageFrame activeSection={activeSection} directory={copy.directory}>
      <header className="border-b border-page-divider pb-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-page-link">{copy.eyebrow}</p>
        <h1 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-page sm:text-4xl">{copy.title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-page-secondary sm:text-base">{copy.description}</p>
      </header>

      <section id="what-is" className="scroll-mt-28">
        <SectionHeading {...copy.whatIs} />
        <div className="mt-7">
          <SubsectionHeading title={copy.whatIs.positionTitle} />
          <div className="mt-4 space-y-3 text-sm leading-7 text-page-secondary sm:text-base">
            {copy.whatIs.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
          <BulletList items={copy.whatIs.points} />
        </div>
        <div className="mt-10">
          <SubsectionHeading title={copy.whatIs.audienceTitle} body={copy.whatIs.audienceBody} />
          <DetailList items={copy.whatIs.audienceItems} />
          <PageLinks items={copy.whatIs.links} />
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-28">
        <SectionHeading {...copy.workflow} />
        <div className="mt-7">
          <SubsectionHeading title={copy.workflow.stepsTitle} body={copy.workflow.body} />
          <StepList items={copy.workflow.steps} />
        </div>
        <div className="mt-10">
          <SubsectionHeading title={copy.workflow.interfaceTitle} body={copy.workflow.interfaceBody} />
          <DetailList items={copy.workflow.interfaceItems} />
        </div>
        <p className="mt-5 text-sm"><Link to="/docs/quickstart" className="font-bold text-page-link hover:underline">{copy.workflow.link}</Link></p>
      </section>

      <section id="routing-failover" className="scroll-mt-28">
        <SectionHeading {...copy.routing} />
        <div className="mt-7">
          <SubsectionHeading title={copy.routing.multiRouteTitle} body={copy.routing.multiRouteBody} />
          <BulletList items={copy.routing.multiRouteItems} />
        </div>
        <div className="mt-10">
          <SubsectionHeading title={copy.routing.failoverTitle} body={copy.routing.failoverBody} />
          <BulletList items={copy.routing.failoverItems} />
          <p className="mt-6 overflow-x-auto rounded-md border border-page-divider bg-page-surface px-4 py-4 text-center text-sm font-semibold leading-7 text-page">
            {copy.routing.flow.join(' → ')}
          </p>
        </div>
      </section>

      <section id="pricing-cost" className="scroll-mt-28">
        <SectionHeading {...copy.pricing} />
        <div className="mt-7">
          <SubsectionHeading title={copy.pricing.billingTitle} body={copy.pricing.billingBody} />
          <DetailList items={copy.pricing.billingItems} />
          <PageLinks items={copy.pricing.links} />
        </div>
        <div className="mt-10">
          <SubsectionHeading title={copy.pricing.lowerTitle} body={copy.pricing.lowerBody} />
          <DetailList items={copy.pricing.lowerItems} />
        </div>
      </section>

      <section id="alternatives" className="scroll-mt-28">
        <SectionHeading {...copy.alternatives} />
        <div className="mt-7">
          <SubsectionHeading title={copy.alternatives.officialApis.title} body={copy.alternatives.officialApis.body} />
          <ComparisonTable {...copy.alternatives.officialApis} />
        </div>
        <div className="mt-10">
          <SubsectionHeading title={copy.alternatives.openRouter.title} body={copy.alternatives.openRouter.body} />
          <ComparisonTable {...copy.alternatives.openRouter} />
          <p className="mt-5 border-l-2 border-page-divider pl-4 text-sm leading-6 text-page-secondary">{copy.alternatives.openRouter.conclusion}</p>
        </div>
      </section>

      <section id="start" className="scroll-mt-28">
        <SectionHeading {...copy.start} />
        <div className="mt-7">
          <SubsectionHeading title={copy.start.modesTitle} />
          <DetailList items={copy.start.modes} />
        </div>
        <div className="mt-10">
          <SubsectionHeading title={copy.start.nextTitle} body={copy.start.body} />
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {copy.start.actions.map(([to, label, variant]) => (
              <Link
                key={to}
                to={to}
                className={`${variant === 'primary' ? 'btn-primary' : 'btn-secondary'} inline-flex min-h-11 items-center justify-center text-center`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </DocsPageFrame>
  );
}
