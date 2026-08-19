import React, { useRef, useState } from 'react';
import { Gauge, Headset, KeyRound, LifeBuoy, Route, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getEnterpriseCopy } from '../content/enterpriseCopy';
import { useSite } from '../context/SiteContext';
import { normalizeAppLanguage } from '../i18n/languageUtils';

const SUPPORT_EMAIL = 'support@api-route.com';
const INITIAL_FORM = {
  company: '',
  contact: '',
  email: '',
  volume: '',
  requirements: '',
};
const CAPABILITY_ICONS = [Route, Gauge, KeyRound, LifeBuoy];
const REASON_ICONS = [ShieldCheck, SlidersHorizontal, Headset];

function interpolate(template, values) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{{${key}}}`, value),
    template,
  );
}

export default function Enterprise() {
  const { i18n } = useTranslation();
  const { site } = useSite();
  const copy = getEnterpriseCopy(normalizeAppLanguage(i18n.resolvedLanguage));
  const contactEmail = String(site?.contact_email || SUPPORT_EMAIL).trim();
  const lastSubmissionRef = useRef('');
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
    if (status !== 'submitting') setStatus('idle');
  };

  const validate = () => {
    const nextErrors = {};
    Object.entries(form).forEach(([field, value]) => {
      if (!value.trim()) nextErrors[field] = copy.validation.required;
    });
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = copy.validation.email;
    }
    setErrors(nextErrors);
    const firstInvalid = Object.keys(nextErrors)[0];
    if (firstInvalid) document.getElementById(`enterprise-${firstInvalid}`)?.focus();
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (status === 'submitting' || !validate()) return;

    const normalizedForm = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, value.trim()]),
    );
    const signature = JSON.stringify(normalizedForm);
    if (signature === lastSubmissionRef.current) {
      setStatus('success');
      return;
    }

    setStatus('submitting');
    await new Promise((resolve) => window.requestAnimationFrame(resolve));

    const body = [
      `${copy.fields.company}: ${normalizedForm.company}`,
      `${copy.fields.contact}: ${normalizedForm.contact}`,
      `${copy.fields.email}: ${normalizedForm.email}`,
      `${copy.fields.volume}: ${normalizedForm.volume}`,
      '',
      `${copy.fields.requirements}:`,
      normalizedForm.requirements,
    ].join('\n');

    try {
      const subject = interpolate(copy.emailSubject, { company: normalizedForm.company });
      window.location.assign(`mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
      lastSubmissionRef.current = signature;
      setStatus('success');
    } catch {
      setStatus('failure');
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-x-hidden bg-page-bg text-page">
      <section className="mx-auto grid w-full max-w-7xl flex-1 items-center gap-10 px-5 py-8 md:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(380px,0.82fr)] lg:gap-12 lg:py-10">
        <div className="min-w-0">
          <h1 className="max-w-3xl font-heading text-4xl font-semibold leading-tight tracking-normal text-page sm:text-5xl lg:text-[3.1rem]">
            {copy.title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-page-secondary sm:text-lg">
            {copy.description}
          </p>
          <p className="mt-4 max-w-2xl border-l-2 border-[#D97757] pl-4 text-sm font-medium leading-6 text-page">
            {copy.audience}
          </p>

          <p className="mt-5 text-sm font-semibold text-page">{copy.valueTitle}</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            {copy.reasons.map((reason, index) => {
              const Icon = REASON_ICONS[index];
              return (
                <article key={reason.title} className="border-t border-page-divider pt-3">
                  <div className="flex items-center gap-2">
                    <Icon className="shrink-0 text-page-link" size={17} strokeWidth={1.8} aria-hidden="true" />
                    <h2 className="text-sm font-semibold leading-5 text-page">{reason.title}</h2>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-page-secondary">{reason.body}</p>
                </article>
              );
            })}
          </div>

          <div className="mt-4 grid gap-x-5 gap-y-2 sm:grid-cols-2">
            {copy.capabilities.map((capability, index) => {
              const Icon = CAPABILITY_ICONS[index];
              return (
                <div key={capability} className="flex min-w-0 items-center gap-2 text-xs font-semibold leading-5 text-page-secondary">
                  <Icon className="shrink-0 text-page-link" size={15} strokeWidth={1.8} aria-hidden="true" />
                  <span>{capability}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-5 border-y border-page-divider py-3">
            <p className="text-xs font-semibold text-page-secondary">{copy.comparison.title}</p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2 sm:gap-0">
              <div className="sm:pr-4">
                <h2 className="text-sm font-semibold text-page">{copy.comparison.standardTitle}</h2>
                <p className="mt-1 text-xs leading-5 text-page-secondary">{copy.comparison.standardBody}</p>
              </div>
              <div className="border-page-divider sm:border-l sm:pl-4">
                <h2 className="text-sm font-semibold text-page-link">{copy.comparison.enterpriseTitle}</h2>
                <p className="mt-1 text-xs leading-5 text-page-secondary">{copy.comparison.enterpriseBody}</p>
              </div>
            </div>
          </div>

        </div>

        <aside
          aria-labelledby="enterprise-form-title"
          className="rounded-lg border p-5 sm:p-6"
          style={{
            background: 'var(--page-card-bg)',
            borderColor: 'var(--page-card-border)',
          }}
        >
          <h2 id="enterprise-form-title" className="text-xl font-semibold text-page">{copy.formTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-page-secondary">{copy.formDescription}</p>

          <form className="mt-5 space-y-4" noValidate onSubmit={handleSubmit} aria-busy={status === 'submitting'}>
            <div className="grid gap-4 sm:grid-cols-2">
              {['company', 'contact'].map((field) => (
                <label key={field} className="block min-w-0 text-sm font-medium text-page" htmlFor={`enterprise-${field}`}>
                  {copy.fields[field]}
                  <input
                    id={`enterprise-${field}`}
                    className="input mt-1.5"
                    value={form[field]}
                    onChange={(event) => updateField(field, event.target.value)}
                    placeholder={copy.placeholders[field]}
                    aria-invalid={Boolean(errors[field])}
                    aria-describedby={errors[field] ? `enterprise-${field}-error` : undefined}
                    autoComplete={field === 'company' ? 'organization' : 'name'}
                    maxLength={120}
                  />
                  {errors[field] && <span id={`enterprise-${field}-error`} className="mt-1 block text-xs text-page-danger">{errors[field]}</span>}
                </label>
              ))}
            </div>

            <label className="block text-sm font-medium text-page" htmlFor="enterprise-email">
              {copy.fields.email}
              <input
                id="enterprise-email"
                className="input mt-1.5"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
                placeholder={copy.placeholders.email}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'enterprise-email-error' : undefined}
                maxLength={160}
              />
              {errors.email && <span id="enterprise-email-error" className="mt-1 block text-xs text-page-danger">{errors.email}</span>}
            </label>

            <label className="block text-sm font-medium text-page" htmlFor="enterprise-volume">
              {copy.fields.volume}
              <input
                id="enterprise-volume"
                className="input mt-1.5"
                value={form.volume}
                onChange={(event) => updateField('volume', event.target.value)}
                placeholder={copy.placeholders.volume}
                aria-invalid={Boolean(errors.volume)}
                aria-describedby={errors.volume ? 'enterprise-volume-error' : undefined}
                maxLength={160}
              />
              {errors.volume && <span id="enterprise-volume-error" className="mt-1 block text-xs text-page-danger">{errors.volume}</span>}
            </label>

            <label className="block text-sm font-medium text-page" htmlFor="enterprise-requirements">
              {copy.fields.requirements}
              <textarea
                id="enterprise-requirements"
                className="input mt-1.5 min-h-24 resize-y"
                value={form.requirements}
                onChange={(event) => updateField('requirements', event.target.value)}
                placeholder={copy.placeholders.requirements}
                aria-invalid={Boolean(errors.requirements)}
                aria-describedby={errors.requirements ? 'enterprise-requirements-error' : undefined}
                maxLength={1200}
              />
              {errors.requirements && <span id="enterprise-requirements-error" className="mt-1 block text-xs text-page-danger">{errors.requirements}</span>}
            </label>

            <button type="submit" className="btn-primary w-full py-3" disabled={status === 'submitting' || status === 'success'}>
              {status === 'submitting' ? copy.submitting : copy.submit}
            </button>
            <p className="text-xs leading-5 text-page-muted">{copy.emailNotice}</p>
            <div aria-live="polite" className="min-h-5 text-sm">
              {status === 'success' && <p className="text-page-success">{copy.success}</p>}
              {status === 'failure' && (
                <p className="text-page-danger">
                  {interpolate(copy.failure, { email: contactEmail })}{' '}
                  <a className="font-semibold underline" href={`mailto:${contactEmail}`}>{contactEmail}</a>
                </p>
              )}
            </div>
          </form>

          <p className="mt-4 border-t border-page-divider pt-4 text-sm leading-6 text-page-secondary">
            {copy.responseNote}
          </p>
        </aside>
      </section>

      <div className="border-t border-page-divider">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-4 gap-y-3 px-5 py-4 text-center text-xs font-semibold text-page-secondary md:grid-cols-4 md:px-8 md:text-sm">
          {copy.trust.map((item) => <span key={item}>{item}</span>)}
        </div>
      </div>
    </div>
  );
}
