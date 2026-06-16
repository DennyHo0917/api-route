import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  Braces,
  Check,
  KeyRound,
  Layers3,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  TicketCheck,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSite, useCurrency } from '../../context/SiteContext';
import { getSiteModels, getSitePackages, Q } from '../../api';
import { calcOfficialEquivList } from '../../utils/officialEquiv';
import { localizePackage } from '../../utils/packageLocalization';
import ApiEndpoints from '../../components/ApiEndpoints';
import { getHomeContent } from '../../utils/siteContent';

function getTotalQuotaDollars(pkg) {
  const quotaDollars = pkg.quota_amount > 0 ? pkg.quota_amount / Q : 0;
  const resetPeriod = pkg.quota_reset_period || 'never';
  if (resetPeriod === 'never' || !pkg.duration || !quotaDollars) return quotaDollars;

  const resetCount = resetPeriod === 'daily'
    ? pkg.duration
    : resetPeriod === 'weekly'
      ? Math.floor(pkg.duration / 7)
      : resetPeriod === 'monthly'
        ? Math.floor(pkg.duration / 30)
        : 1;
  return quotaDollars * Math.max(1, resetCount);
}

const LEGACY_HERO_SUBTITLES = new Set([
  '通过单一 API 端点访问全球最强大的 AI 模型。简单、实惠、可靠。',
]);

export default function ClaudeHome() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { site } = useSite();
  const { fmtCNY } = useCurrency();
  const [models, setModels] = useState([]);
  const [packages, setPackages] = useState([]);

  useEffect(() => {
    getSiteModels()
      .then((res) => { if (res.data.success) setModels(res.data.data || []); })
      .catch(() => {});
    getSitePackages()
      .then((res) => { if (res.data.success) setPackages(res.data.data || []); })
      .catch(() => {});
  }, []);

  const enabledModels = useMemo(
    () => models.filter((model) => model.enabled !== false),
    [models],
  );
  const enabledPackages = useMemo(
    () => packages
      .filter((pkg) => pkg.enabled !== false)
      .map((pkg) => localizePackage(pkg, t, i18n.resolvedLanguage)),
    [i18n.resolvedLanguage, packages, t],
  );
  const previewPackages = enabledPackages.slice(0, 3);
  const recommendedId = previewPackages.find((pkg) => Number(pkg.duration) === 30)?.id
    || previewPackages[1]?.id;
  const homeContent = getHomeContent(site, t, i18n.resolvedLanguage);
  const heroSubtitle = LEGACY_HERO_SUBTITLES.has(homeContent.heroSubtitle)
    ? t('home.heroSubtitle')
    : homeContent.heroSubtitle;

  const workflowSteps = [
    {
      icon: ShoppingBag,
      number: '01',
      title: t('home.stepBuy'),
      description: t('home.stepBuyDesc'),
    },
    {
      icon: TicketCheck,
      number: '02',
      title: t('home.stepRedeem'),
      description: t('home.stepRedeemDesc'),
    },
    {
      icon: KeyRound,
      number: '03',
      title: t('home.stepCreateKey'),
      description: t('home.stepCreateKeyDesc'),
    },
  ];
  const audienceCards = [
    {
      icon: Braces,
      title: t('home.audienceDevelopersTitle'),
      description: t('home.audienceDevelopersDesc'),
      to: '/pricing',
      linkLabel: t('home.audiencePricingLink'),
    },
    {
      icon: Layers3,
      title: t('home.audienceSaasTitle'),
      description: t('home.audienceSaasDesc'),
      to: '/pricing',
      linkLabel: t('home.audiencePricingLink'),
    },
    {
      icon: KeyRound,
      title: t('home.audienceCodingToolsTitle'),
      description: t('home.audienceCodingToolsDesc'),
      to: '/faq',
      linkLabel: t('home.audienceSetupLink'),
    },
    {
      icon: Sparkles,
      title: t('home.audienceCreatorsTitle'),
      description: t('home.audienceCreatorsDesc'),
      to: '/apps',
      linkLabel: t('home.audienceAppsLink'),
    },
    {
      icon: ShieldCheck,
      title: t('home.audienceRelayTitle'),
      description: t('home.audienceRelayDesc'),
      to: '/sub-site',
      linkLabel: t('home.audienceRelayLink'),
    },
  ];

  return (
    <div className="overflow-hidden">
      <section className="route-hero relative border-b border-[#E8DDD0]">
        <div className="route-grid-bg absolute inset-0 opacity-60" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 md:px-8 md:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#E6D6C8] bg-white/75 px-3.5 py-2 text-xs font-semibold text-[#B75F43] shadow-sm">
              <Sparkles size={14} />
              {t('home.heroBadge')}
            </div>
            <h1 className="max-w-3xl text-4xl font-bold leading-[1.08] tracking-[-0.04em] text-[#382B21] sm:text-5xl lg:text-[58px]">
              <span className="block">{t('home.heroTitleLead')}</span>
              <span className="block">{t('home.heroTitleRest')}</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[#756454] md:text-lg">
              {heroSubtitle}
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                to={user ? '/topup' : '/register'}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D97757] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(217,119,87,0.24)] transition-all hover:-translate-y-0.5 hover:bg-[#C4613F]"
              >
                <ShoppingBag size={17} />
                {t('home.buyVoucher')}
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/packages"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#DCCBBD] bg-white/75 px-6 py-3.5 text-sm font-semibold text-[#59483A] transition-all hover:border-[#CBAE98] hover:bg-white"
              >
                <TicketCheck size={17} />
                {t('home.viewPackages')}
              </Link>
              <Link
                to="/sub-site"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#DCCBBD] bg-[#FFF7F0] px-6 py-3.5 text-sm font-semibold text-[#8F4C35] transition-all hover:border-[#CBAE98] hover:bg-white"
              >
                <ShieldCheck size={17} />
                {t('home.deployGateway')}
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-[#756454]">
              {[t('home.openaiCompatible'), t('home.allModelsIncluded'), t('home.instantActivation')].map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#D97757]/10 text-[#D97757]">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-10 top-8 h-32 w-32 rounded-full bg-[#E9B8A4]/35 blur-3xl" />
            <div className="absolute -right-10 bottom-4 h-40 w-40 rounded-full bg-[#E8D7B7]/50 blur-3xl" />
            <div className="relative rounded-[28px] border border-[#DCC8B8] bg-white/80 p-3 shadow-[0_28px_80px_rgba(96,69,48,0.13)]">
              <div className="rounded-[22px] border border-[#E7D7CA] bg-[#FFF9F4] p-6 sm:p-8">
                <div className="flex items-center justify-between border-b border-[#EADCD0] pb-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C56547]">
                      {t('home.workflowEyebrow')}
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-[#3D3024]">{t('home.workflowTitle')}</h2>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#D97757] text-white">
                    <Zap size={20} />
                  </div>
                </div>

                <div className="mt-3">
                  {workflowSteps.map((step, index) => {
                    const Icon = step.icon;
                    return (
                      <div key={step.number} className="relative flex gap-4 py-5">
                        {index < workflowSteps.length - 1 && (
                          <span className="absolute left-[21px] top-[54px] h-8 w-px bg-[#E2CFC0]" />
                        )}
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#E6D4C6] bg-[#F8EAE0] text-[#C56547]">
                          <Icon size={19} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold tracking-[0.18em] text-[#B68D75]">{step.number}</span>
                            <h3 className="text-sm font-semibold text-[#49382C]">{step.title}</h3>
                          </div>
                          <p className="mt-1.5 text-sm leading-6 text-[#806D5D]">{step.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-2 border-t border-[#EADCD0] pt-5">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#D97757]/10 text-[#C56547]">
                      <ShieldCheck size={18} />
                    </span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#B68D75]">
                        {t('home.platformEyebrow')}
                      </p>
                      <h3 className="mt-1 text-sm font-semibold text-[#49382C]">{t('home.platformTitle')}</h3>
                      <p className="mt-1.5 text-sm leading-6 text-[#806D5D]">{t('home.platformDesc')}</p>
                      <Link
                        to="/sub-site"
                        className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#C56547] hover:text-[#A84F34]"
                      >
                        {t('home.platformAction')}
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 rounded-2xl border border-[#EADCD0] bg-[#F6EADF] p-3 text-center">
                  <div>
                    <p className="text-lg font-bold text-[#3D3024]">{enabledModels.length || '--'}+</p>
                    <p className="text-[10px] text-[#8C7867]">{t('home.aiModels')}</p>
                  </div>
                  <div className="border-x border-[#DDC9B9]">
                    <p className="text-lg font-bold text-[#3D3024]">{enabledPackages.length || '--'}</p>
                    <p className="text-[10px] text-[#8C7867]">{t('home.packageChoices')}</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-[#3D3024]">1 API</p>
                    <p className="text-[10px] text-[#8C7867]">{t('home.unifiedAccess')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-20">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="route-kicker">{t('home.audienceEyebrow')}</p>
            <h2 className="route-section-title">{t('home.audienceTitle')}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#7D6B5B] md:text-base">
              {t('home.audienceSubtitle')}
            </p>
          </div>
          <Link to="/faq" className="inline-flex items-center gap-2 text-sm font-semibold text-[#C56547] hover:text-[#A84F34]">
            {t('nav.faq')}
            <ArrowRight size={15} />
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {audienceCards.map(({ icon: Icon, title, description, to, linkLabel }) => (
            <Link
              key={title}
              to={to}
              className="group flex min-h-[210px] flex-col rounded-[22px] border border-[#E5D7CB] bg-white/65 p-5 shadow-[0_14px_40px_rgba(82,61,43,0.04)] transition-all hover:-translate-y-0.5 hover:border-[#D8BBA7] hover:bg-white"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#D97757]/10 text-[#C56547]">
                <Icon size={20} />
              </span>
              <h3 className="mt-5 text-base font-semibold leading-6 text-[#3D3024]">{title}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-[#7D6B5B]">{description}</p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#C56547] group-hover:text-[#A84F34]">
                {linkLabel}
                <ArrowRight size={14} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {previewPackages.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="route-kicker">{t('home.packageSectionEyebrow')}</p>
              <h2 className="route-section-title">{t('home.plansPackages')}</h2>
              <p className="mt-3 max-w-xl text-[#7D6B5B]">{t('home.choosePlan')}</p>
            </div>
            <Link to="/packages" className="inline-flex items-center gap-2 text-sm font-semibold text-[#C56547] hover:text-[#A84F34]">
              {t('home.viewAllPackages')}
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {previewPackages.map((pkg) => {
              const recommended = pkg.id === recommendedId;
              const equiv = calcOfficialEquivList(enabledModels, getTotalQuotaDollars(pkg))[0];
              return (
                <article
                  key={pkg.id}
                  className={`relative flex min-h-[360px] flex-col rounded-[24px] border p-6 transition-all hover:-translate-y-1 ${
                    recommended
                      ? 'border-[#D97757] bg-[#FFF1E7] text-[#3D3024] shadow-[0_20px_50px_rgba(217,119,87,0.14)]'
                      : 'border-[#E5D7CB] bg-white/75 text-[#3D3024] shadow-[0_14px_40px_rgba(82,61,43,0.06)]'
                  }`}
                >
                  {recommended && (
                    <span className="absolute right-5 top-5 rounded-full bg-[#D97757] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
                      {t('packages.recommended')}
                    </span>
                  )}
                  <div className="pr-16">
                    <h3 className="text-xl font-semibold">{pkg.name}</h3>
                    {pkg.description && (
                      <p className="mt-2 text-sm leading-6 text-[#806F60]">
                        {pkg.description}
                      </p>
                    )}
                  </div>
                  <div className="mt-8">
                    <span className="text-4xl font-bold tracking-tight">{fmtCNY(pkg.price)}</span>
                    {pkg.original_price > pkg.price && (
                      <span className="ml-2 text-sm text-[#A89685] line-through">
                        {fmtCNY(pkg.original_price)}
                      </span>
                    )}
                    {pkg.duration > 0 && (
                      <p className="mt-2 text-xs text-[#927E6C]">
                        {t('home.days', { count: pkg.duration })}
                      </p>
                    )}
                  </div>
                  <div className="my-6 h-px bg-[#E8D6C8]" />
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center gap-2">
                      <Check size={15} className="text-[#D97757]" />
                      {t('packages.allModels')}
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={15} className="text-[#D97757]" />
                      {t('packages.openaiApi')}
                    </li>
                    {equiv && (
                      <li className="flex items-center gap-2 text-[#786657]">
                        <Sparkles size={15} className="text-[#D97757]" />
                        {t('packages.officialEquiv', { model: equiv.label, amount: equiv.equivDollars })}
                      </li>
                    )}
                  </ul>
                  <Link
                    to={`/topup?package_id=${pkg.id}`}
                    className={`mt-auto inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-colors ${
                      recommended
                        ? 'bg-[#D97757] text-white hover:bg-[#E38969]'
                        : 'bg-[#F0E5DB] text-[#4B3B30] hover:bg-[#E6D6C8]'
                    }`}
                  >
                    <TicketCheck size={16} />
                    {t('packages.haveVoucher')}
                  </Link>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <section className="border-y border-[#E8DDD0] bg-[#F1E8DE]">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="route-kicker">{t('home.modelSectionEyebrow')}</p>
              <h2 className="route-section-title">{t('home.availableModels')}</h2>
              <p className="mt-3 max-w-md leading-7 text-[#7D6B5B]">
                {t('home.availableModelsDesc', { count: enabledModels.length })}
              </p>
              <Link to="/pricing" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#C56547]">
                {t('home.viewAllModels', { count: enabledModels.length })}
                <ArrowRight size={15} />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {(enabledModels.length ? enabledModels.slice(0, 9) : Array.from({ length: 9 })).map((model, index) => (
                <div
                  key={model?.id || index}
                  className="flex min-h-20 items-center gap-3 rounded-2xl border border-[#E3D4C7] bg-white/70 px-4 py-3 shadow-sm"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#D97757]/10 text-[#C56547]">
                    <Braces size={17} />
                  </span>
                  <span className="min-w-0 truncate font-mono text-xs text-[#5E4D40]">
                    {model?.display_name || model?.model_name || 'AI model'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
        <div className="mb-10 text-center">
          <p className="route-kicker">{t('home.whyChooseUs')}</p>
          <h2 className="route-section-title">{t('home.whyChooseUsDesc')}</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { icon: Zap, title: t('home.lightningFast'), desc: t('home.lightningFastDesc') },
            { icon: ShieldCheck, title: t('home.securePrivate'), desc: t('home.securePrivateDesc') },
            { icon: Layers3, title: t('home.payAsYouGo'), desc: t('home.payAsYouGoDesc') },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-[22px] border border-[#E5D7CB] bg-white/65 p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#D97757]/10 text-[#C56547]">
                <Icon size={20} />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-[#3D3024]">{title}</h3>
              <p className="mt-2 text-sm leading-7 text-[#7D6B5B]">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="pb-10">
        <ApiEndpoints />
      </div>
    </div>
  );
}
