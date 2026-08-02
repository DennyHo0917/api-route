import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  Check,
  Headset,
  KeyRound,
  Layers3,
  Mail,
  ShieldCheck,
  Sparkles,
  WalletCards,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSite, useCurrency } from '../../context/SiteContext';
import { getSiteModels, getSitePackages, subscribePackage, Q } from '../../api';
import { calcOfficialEquivList } from '../../utils/officialEquiv';
import { localizePackage } from '../../utils/packageLocalization';
import { getHomeContent } from '../../utils/siteContent';
import { trackEvent } from '../../utils/analytics';
import FadeContent from '../../components/bits/FadeContent';
import SnapSection, { SnapDeck } from '../../components/bits/SnapSection';
import toast from 'react-hot-toast';

const resetLabelKeys = {
  never: 'packages.resetNever',
  daily: 'packages.resetDaily',
  weekly: 'packages.resetWeekly',
  monthly: 'packages.resetMonthly',
};
const SUPPORT_EMAIL = 'support@api-route.com';

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

function getPackageAnalyticsItem(pkg) {
  const price = Number(pkg?.price || 0);
  return {
    item_id: String(pkg?.id || ''),
    item_name: pkg?.name || 'API package',
    item_category: 'api_package',
    price,
    quantity: 1,
  };
}

const LEGACY_HERO_SUBTITLES = new Set([
  '通过单一 API 端点访问全球最强大的 AI 模型。简单、实惠、可靠。',
]);

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

const providerLogo = (slug) => `https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/${slug}.svg`;
const lobeLogo = (slug) => `https://cdn.jsdelivr.net/npm/@lobehub/icons-static-svg@latest/icons/${slug}.svg`;

const PROVIDER_CATALOG = {
  openai: { name: 'OpenAI', mark: 'OpenAI', logo: providerLogo('openai') },
  anthropic: { name: 'Claude', mark: 'Claude', logo: providerLogo('claude') },
  google: { name: 'Google Gemini', mark: 'Gemini', logo: providerLogo('googlegemini') },
  xai: { name: 'xAI Grok', mark: 'Grok', logo: lobeLogo('grok') },
  deepseek: { name: 'DeepSeek', mark: 'DeepSeek', logo: providerLogo('deepseek') },
  zhipu: { name: 'Zhipu GLM', mark: 'GLM', logo: 'https://stable-learn.com/appicon/zhipu-color.png', logoClass: 'brightness-0 opacity-80' },
  qwen: { name: 'Qwen', mark: 'Qwen', logo: lobeLogo('qwen') },
  kimi: { name: 'Kimi', mark: 'Kimi', logo: lobeLogo('kimi') },
  volcengine: { name: 'Volcengine', mark: 'Volcengine', logo: lobeLogo('volcengine') },
};

const DISPLAY_PROVIDER_KEYS = ['openai', 'anthropic', 'google', 'xai', 'zhipu', 'deepseek', 'qwen', 'kimi', 'volcengine'];

function VendorMark({ vendor }) {
  if (vendor.more) {
    return <span className="text-xl font-black text-[#3D3024]">{vendor.mark}</span>;
  }

  return (
    <>
      {vendor.logo && (
        <img
          src={vendor.logo}
          alt=""
          loading="lazy"
          decoding="async"
          className={`provider-logo mx-auto block h-10 w-10 object-contain opacity-90 transition-opacity duration-300 group-hover:opacity-100 ${vendor.logoClass || ''}`}
          onError={(event) => {
            event.currentTarget.classList.add('hidden');
            event.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
      )}
      <span className={`provider-logo-fallback ${vendor.logo ? 'hidden' : ''} max-w-full truncate px-2 text-center text-lg font-black tracking-normal text-[#5E4D40]`}>
        {vendor.mark}
      </span>
    </>
  );
}

export default function ClaudeHome() {
  const { t, i18n } = useTranslation();
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { site } = useSite();
  const { symbol, rate, fmtCNY, cnyPerUsd, decimals } = useCurrency();
  const [models, setModels] = useState([]);
  const [packages, setPackages] = useState([]);
  const [subscribing, setSubscribing] = useState(null);
  const [confirmPkg, setConfirmPkg] = useState(null);
  const getResetLabel = (period) => t(resetLabelKeys[period] || resetLabelKeys.never);

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
  const modelCount = useMemo(
    () => new Set(enabledModels.map((model) => model.model_name).filter(Boolean)).size,
    [enabledModels],
  );
  const modelProviders = useMemo(() => {
    return DISPLAY_PROVIDER_KEYS.map((key) => PROVIDER_CATALOG[key]);
  }, []);
  const enabledPackages = useMemo(
    () => packages
      .filter((pkg) => pkg.enabled !== false)
      .map((pkg) => localizePackage(pkg, t, i18n.resolvedLanguage)),
    [i18n.resolvedLanguage, packages, t],
  );
  const previewPackages = enabledPackages.slice(0, 6);
  const recommendedId = previewPackages.find((pkg) => Number(pkg.duration) === 30)?.id
    || previewPackages[1]?.id;
  const homeContent = getHomeContent(site, t, i18n.resolvedLanguage);
  const heroSubtitle = LEGACY_HERO_SUBTITLES.has(homeContent.heroSubtitle)
    ? t('home.heroSubtitle')
    : homeContent.heroSubtitle;
  const supportLink = getSupportLink(site);

  const handleSubscribe = (pkg) => {
    const item = getPackageAnalyticsItem(pkg);
    trackEvent('begin_checkout', {
      currency: 'CNY',
      value: item.price,
      login_state: user ? 'logged_in' : 'anonymous',
      placement: 'home_packages',
      items: [item],
    });
    if (!user) {
      navigate('/register');
      return;
    }
    setConfirmPkg(pkg);
  };

  const confirmSubscribe = async () => {
    if (!confirmPkg) return;
    const pkgId = confirmPkg.id;
    setSubscribing(pkgId);
    try {
      const res = await subscribePackage(pkgId);
      if (res.data.success) {
        const item = getPackageAnalyticsItem(confirmPkg);
        trackEvent('purchase', {
          transaction_id: String(res.data.data?.id || res.data.data?.subscription_id || `package_${pkgId}_${Date.now()}`),
          affiliation: 'API-Route package',
          currency: 'CNY',
          value: item.price,
          placement: 'home_packages',
          items: [item],
        });
        toast.success(t('packages.subscribedSuccess'));
        setConfirmPkg(null);
        await refreshUser({ skipErrorHandler: true }).catch(() => null);
      } else {
        toast.error(res.data.message || t('common.requestFailed'));
      }
    } catch {
      // Global interceptor displays request errors.
    }
    setSubscribing(null);
  };

  return (
    <SnapDeck>
      <SnapSection
        id="hero"
        className="route-hero relative border-b border-[#E8DDD0]"
        contentClassName="relative mx-auto flex w-full max-w-7xl items-center px-5 py-16 md:px-8"
        direction="up"
      >
        <div className="route-grid-bg absolute inset-0 opacity-60" />
          <FadeContent direction="up" distance={30} duration={780} delay={80} className="mx-auto w-full max-w-5xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#E6D6C8] bg-white/75 px-3.5 py-2 text-xs font-semibold text-[#B75F43] shadow-sm">
              <Sparkles size={14} />
              {t('home.heroBadge')}
            </div>
            <h1 className="mx-auto max-w-4xl text-4xl font-bold leading-[1.08] tracking-[-0.04em] text-[#382B21] sm:text-5xl lg:text-[64px]">
              <span className="block">{t('home.heroTitleLead')}</span>
              <span className="block">{t('home.heroTitleRest')}</span>
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-[#756454] md:text-lg">
              {heroSubtitle}
            </p>

            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to={user ? '/chats' : '/register'}
                state={user ? undefined : { from: '/chats' }}
                onClick={() => trackEvent('funnel_select', { funnel: 'chat', placement: 'home_hero' })}
                className="route-motion-button route-motion-primary inline-flex items-center justify-center gap-2 rounded-full bg-[#D97757] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(217,119,87,0.24)] transition-all hover:-translate-y-0.5 hover:bg-[#C4613F]"
              >
                <Sparkles size={17} />
                {t('home.openAiChat')}
                <ArrowRight size={16} className="route-motion-arrow" />
              </Link>
              <Link
                to={user ? '/api-keys' : '/register'}
                state={user ? undefined : { from: '/api-keys' }}
                onClick={() => trackEvent('funnel_select', { funnel: 'api', placement: 'home_hero' })}
                className="route-motion-button inline-flex items-center justify-center gap-2 rounded-full border border-[#DCCBBD] bg-white/75 px-6 py-3.5 text-sm font-semibold text-[#59483A] transition-all hover:border-[#CBAE98] hover:bg-white"
              >
                <KeyRound size={17} />
                {t('home.viewApiAccess')}
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm text-[#756454]">
              {[t('home.openaiCompatible'), t('home.allModelsIncluded'), t('home.instantActivation')].map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#D97757]/10 text-[#D97757]">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  {item}
                </span>
              ))}
            </div>
          </FadeContent>
      </SnapSection>

      <SnapSection
        id="features"
        className="bg-[#FAF6F1]"
        contentClassName="mx-auto w-full max-w-7xl px-5 py-10 md:px-8"
        direction="left"
      >
        <div className="grid gap-x-10 gap-y-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(460px,1.1fr)] lg:items-end">
          <FadeContent direction="left" distance={36} duration={750} className="lg:col-start-1 lg:row-start-1">
            <p className="route-kicker">{t('nav.audience')}</p>
            <h2 className="route-section-title">{t('home.featuresTitle')}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#7D6B5B] md:text-base">
              {t('home.featuresSubtitle')}
            </p>

            <div className="mt-6 space-y-3">
              {[
                { icon: KeyRound, title: t('home.featuresUnifiedTitle'), description: t('home.featuresUnifiedDesc') },
                { icon: Layers3, title: t('home.featuresSwitchTitle'), description: t('home.featuresSwitchDesc') },
                { icon: ShieldCheck, title: t('home.featuresFailoverTitle'), description: t('home.featuresFailoverDesc') },
              ].map(({ icon: Icon, title, description }) => (
                <div key={title} className="flex items-start gap-3 rounded-lg border border-[#E5D7CB] bg-white/65 p-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#D97757]/10 text-[#C56547]">
                    <Icon size={18} />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-[#3D3024]">{title}</span>
                    <span className="mt-1 block text-sm leading-6 text-[#7D6B5B]">{description}</span>
                  </span>
                </div>
              ))}
            </div>

          </FadeContent>
          <FadeContent direction="up" distance={24} duration={700} delay={100} className="lg:col-start-1 lg:row-start-2">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to={user ? '/api-keys' : '/register'}
                state={user ? undefined : { from: '/api-keys' }}
                onClick={() => trackEvent('funnel_select', { funnel: 'api', placement: 'home_features' })}
                className="route-motion-button route-motion-primary inline-flex items-center justify-center gap-2 rounded-full bg-[#D97757] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(217,119,87,0.20)] transition-all hover:-translate-y-0.5 hover:bg-[#C4613F]"
              >
                {t('home.featuresPrimaryAction')}
                <ArrowRight size={15} className="route-motion-arrow" />
              </Link>
              <Link
                to="/pricing"
                className="route-motion-button inline-flex items-center justify-center gap-2 rounded-full border border-[#DCCBBD] bg-white/75 px-5 py-3 text-sm font-semibold text-[#59483A] transition-colors hover:bg-white"
              >
                {t('nav.modelMarketplace')}
              </Link>
            </div>
          </FadeContent>
          <FadeContent direction="right" distance={36} duration={750} delay={80} className="lg:col-start-2 lg:row-start-1 lg:self-end">
            <video
              className="aspect-video w-full rounded-lg border border-[#E5D7CB] bg-black shadow-[0_16px_40px_rgba(82,61,43,0.10)]"
              aria-label={t('home.audienceTitle')}
              autoPlay
              controls
              loop
              muted
              playsInline
              preload="metadata"
              src="/videos/api-route-twitter-ad-15s.mp4"
            />
          </FadeContent>
        </div>
      </SnapSection>

      <SnapSection
        id="ecosystem"
        className="border-y border-[#E8DDD0] bg-[#F1E8DE]"
        contentClassName="mx-auto flex w-full max-w-7xl flex-col justify-center px-5 py-10 md:px-8"
        direction="left"
      >
        <FadeContent direction="up" distance={30} duration={760} className="mx-auto max-w-3xl text-center">
          <p className="route-kicker">{t('home.ecosystemEyebrow')}</p>
          <h2 className="route-section-title mt-3">
            {t('home.ecosystemTitle')}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#7D6B5B] md:text-lg">
            {t('home.ecosystemSubtitle')}
          </p>
          <Link to="/pricing" className="route-motion-link mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#C56547] transition-colors hover:text-[#A84F34]">
            {t('home.viewAllModels', { count: enabledModels.length })}
            <ArrowRight size={15} className="route-motion-arrow" />
          </Link>
        </FadeContent>
        <div className="mx-auto mt-10 grid w-full max-w-[640px] grid-cols-3 gap-3 md:gap-4">
          {modelProviders.map((vendor, index) => (
            <FadeContent
              key={`${vendor.name}-${index}`}
              direction={index % 2 === 0 ? 'left' : 'right'}
              distance={24}
              duration={640}
              delay={index * 28}
            >
              <div
                title={vendor.name}
                className={`route-provider-card route-provider-card--${index + 1} route-motion-card group flex h-20 w-full items-center justify-center rounded-2xl border border-[#E3D4C7] bg-white/70 px-3 shadow-[0_12px_30px_rgba(82,61,43,0.05)] transition-all duration-300 hover:-translate-y-1 hover:border-[#D7BBA5] hover:bg-white`}
              >
                <VendorMark vendor={vendor} />
                <span className="sr-only">{vendor.name}</span>
              </div>
            </FadeContent>
          ))}
        </div>
      </SnapSection>

      {previewPackages.length > 0 && (
        <SnapSection
          id="packages"
          className="bg-[#FAF6F1]"
          contentClassName="mx-auto w-full max-w-7xl px-5 py-8 md:px-8"
          direction="right"
        >
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <FadeContent direction="left" distance={36} duration={750}>
              <p className="route-kicker">{t('home.packageSectionEyebrow')}</p>
              <h2 className="route-section-title">{t('home.plansPackages')}</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#7D6B5B]">{t('home.choosePlan')}</p>
            </FadeContent>
            <FadeContent direction="right" distance={36} duration={750} delay={80}>
              <Link to="/packages" className="route-motion-link inline-flex items-center gap-2 text-sm font-semibold text-[#C56547] hover:text-[#A84F34]">
                {t('home.viewAllPackages')}
                <ArrowRight size={15} className="route-motion-arrow" />
              </Link>
            </FadeContent>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {previewPackages.map((pkg, index) => {
              const recommended = pkg.id === recommendedId;
              const equiv = calcOfficialEquivList(enabledModels, getTotalQuotaDollars(pkg))[0];
              return (
                <FadeContent
                  key={pkg.id}
                  direction={index % 2 === 0 ? 'left' : 'right'}
                  distance={36}
                  duration={780}
                  delay={index * 90}
                  className="h-full"
                >
                  <article
                    className={`route-motion-card relative flex h-full min-h-[255px] flex-col rounded-[22px] border p-5 transition-all hover:-translate-y-1 ${
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
                    <div className="pr-14">
                      <h3 className="text-lg font-semibold leading-6">{pkg.name}</h3>
                      {pkg.description && (
                        <p className="mt-1.5 max-h-10 overflow-hidden text-xs leading-5 text-[#806F60]">
                          {pkg.description}
                        </p>
                      )}
                    </div>
                    <div className="mt-4">
                      <span className="text-3xl font-bold tracking-tight">{fmtCNY(pkg.price)}</span>
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
                    <div className="my-4 h-px bg-[#E8D6C8]" />
                    <ul className="space-y-2 text-xs">
                      <li className="flex items-center gap-2">
                        <Check size={15} className="text-[#D97757]" />
                        {t('packages.allModels')}
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={15} className="text-[#D97757]" />
                        {t('packages.openaiApi')}
                      </li>
                      {equiv && (
                        <li className="flex min-w-0 items-center gap-2 text-[#786657]">
                          <Sparkles size={15} className="text-[#D97757]" />
                          <span className="truncate">
                            {t('packages.officialEquiv', { model: equiv.label, amount: equiv.equivDollars })}
                          </span>
                        </li>
                      )}
                    </ul>
                    <button
                      type="button"
                      onClick={() => handleSubscribe(pkg)}
                      disabled={subscribing === pkg.id}
                      className={`route-motion-button mt-auto inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${
                        recommended
                          ? 'bg-[#D97757] text-white hover:bg-[#E38969]'
                          : 'bg-[#F0E5DB] text-[#4B3B30] hover:bg-[#E6D6C8]'
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      <WalletCards size={16} />
                      {subscribing === pkg.id ? t('packages.processing') : t('packages.subscribeNow')}
                    </button>
                  </article>
                </FadeContent>
              );
            })}
          </div>
        </SnapSection>
      )}

      <SnapSection
        id="platform"
        className="relative overflow-hidden border-b border-[#E8DDD0] bg-[#FFF9F4]"
        contentClassName="relative mx-auto grid w-full max-w-7xl items-center gap-10 px-5 py-14 md:px-8 lg:grid-cols-[1.08fr_0.92fr]"
      >
        <div className="absolute -left-20 top-1/4 h-64 w-64 rounded-full bg-[#E9B8A4]/30 blur-3xl" />
        <div className="absolute -right-20 bottom-1/4 h-72 w-72 rounded-full bg-[#E8D7B7]/45 blur-3xl" />

        <FadeContent direction="left" distance={36} duration={780}>
          <p className="route-kicker">{t('home.platformEyebrow')}</p>
          <h2 className="route-section-title max-w-3xl">
            {t('home.platformTitle')}
          </h2>
          <p className="mt-6 max-w-2xl text-lg font-semibold leading-8 text-[#59483A] md:text-xl">
            {modelCount > 0
              ? t('home.platformLead', { count: modelCount })
              : t('home.platformLeadFallback')}
          </p>
          <p className="mt-3 max-w-2xl text-base leading-8 text-[#756454] md:text-lg">
            {t('home.platformDesc')}
          </p>
          <Link
            to="/ai-api-reseller-platform"
            onClick={() => trackEvent('funnel_select', { funnel: 'reseller', placement: 'home_reseller' })}
            className="route-motion-button route-motion-primary mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-[#D97757] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(217,119,87,0.24)] transition-all hover:-translate-y-0.5 hover:bg-[#C4613F]"
          >
            {t('home.platformAction')}
            <ArrowRight size={16} className="route-motion-arrow" />
          </Link>
        </FadeContent>

        <FadeContent direction="right" distance={36} duration={820} delay={120}>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {[
              {
                icon: WalletCards,
                title: t('home.platformPricingTitle'),
                description: t('home.platformPricingDesc'),
              },
              {
                icon: Layers3,
                title: modelCount > 0
                  ? t('home.platformUpstreamTitle', { count: modelCount })
                  : t('home.platformUpstreamTitleFallback'),
                description: t('home.platformUpstreamDesc'),
              },
              {
                icon: ShieldCheck,
                title: t('home.platformManagedTitle'),
                description: t('home.platformManagedDesc'),
              },
            ].map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="flex items-center gap-4 rounded-2xl border border-[#E4D2C4] bg-white/75 p-5 shadow-[0_16px_40px_rgba(96,69,48,0.08)]"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#D97757]/10 text-[#C56547]">
                  <Icon size={21} />
                </span>
                <span>
                  <span className="block text-base font-semibold text-[#49382C]">{title}</span>
                  <span className="mt-1 block text-sm leading-6 text-[#806D5D]">{description}</span>
                </span>
              </div>
            ))}
          </div>
        </FadeContent>
      </SnapSection>

      <SnapSection
        id="contact"
        className="bg-[#FAF6F1]"
        contentClassName="mx-auto w-full max-w-7xl px-5 py-8 md:px-8"
        direction="right"
      >
        <FadeContent direction="left" distance={32} duration={740} className="mb-7 text-center">
          <p className="route-kicker">{t('home.whyChooseUs')}</p>
          <h2 className="route-section-title">{t('home.whyChooseUsDesc')}</h2>
        </FadeContent>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: Zap, title: t('home.lightningFast'), desc: t('home.lightningFastDesc') },
            { icon: ShieldCheck, title: t('home.securePrivate'), desc: t('home.securePrivateDesc') },
            { icon: Layers3, title: t('home.payAsYouGo'), desc: t('home.payAsYouGoDesc') },
          ].map(({ icon: Icon, title, desc }, index) => (
            <FadeContent
              key={title}
              direction={index === 1 ? 'up' : index === 0 ? 'left' : 'right'}
              distance={34}
              duration={760}
              delay={index * 80}
            >
              <div className="route-motion-card rounded-[22px] border border-[#E5D7CB] bg-white/65 p-5">
                <span className="route-motion-icon flex h-11 w-11 items-center justify-center rounded-2xl bg-[#D97757]/10 text-[#C56547]">
                  <Icon size={20} />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-[#3D3024]">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-[#7D6B5B]">{desc}</p>
              </div>
            </FadeContent>
          ))}
        </div>
        <FadeContent direction="up" distance={28} duration={760} delay={180} className="mt-6">
          <div className="rounded-[28px] border border-[#E6C7B3] bg-[#FFF3EB] p-5 shadow-[0_24px_70px_rgba(217,119,87,0.18)] md:p-6">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div className="flex gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#D97757] text-white shadow-lg shadow-[#D97757]/25">
                  <Headset size={20} />
                </span>
                <div className="max-w-2xl">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#C56547]">{t('home.supportEyebrow')}</p>
                  <h2 className="mt-1 text-xl font-semibold text-[#3D3024] md:text-2xl">{t('home.supportTitle')}</h2>
                  <p className="mt-2 text-sm leading-7 text-[#7D6B5B]">{t('home.supportDesc')}</p>
                </div>
              </div>
              <div className={`grid gap-3 ${supportLink?.isTelegram ? 'sm:grid-cols-2 lg:w-[560px]' : 'lg:w-[340px]'} lg:justify-self-end`}>
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="flex min-h-[64px] min-w-0 items-center gap-3 rounded-2xl bg-[#D97757] px-4 py-3 text-white shadow-[0_14px_30px_rgba(217,119,87,0.22)] transition-colors hover:bg-[#C4613F] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D97757]"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
                    <Mail size={18} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-white/75">Email</span>
                    <span className="mt-0.5 block truncate text-sm font-semibold">{SUPPORT_EMAIL}</span>
                  </span>
                </a>
                {supportLink?.isTelegram && (
                  <a
                    href={supportLink.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-[64px] min-w-0 items-center gap-3 rounded-2xl border border-[#E6C7B3] bg-white/70 px-4 py-3 text-[#3D3024] transition-colors hover:bg-white/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D97757]"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D97757]/10 text-[#C56547]">
                      <Headset size={18} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-[#C56547]">Telegram</span>
                      <span className="mt-0.5 block truncate text-sm font-semibold">{t('home.supportTelegramAction')}</span>
                    </span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </FadeContent>
      </SnapSection>

      {confirmPkg && (() => {
        const userBalanceCny = (user?.quota || 0) / Q * cnyPerUsd;
        const pkgPrice = Number(confirmPkg.price);
        const insufficient = userBalanceCny < pkgPrice;
        const resetPeriod = confirmPkg.quota_reset_period || 'never';
        const isSubscription = resetPeriod !== 'never';
        return (
          <div
            className="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
            onClick={() => !subscribing && setConfirmPkg(null)}
          >
            <div className="glass w-full max-w-sm rounded-2xl p-6" onClick={(event) => event.stopPropagation()}>
              <h2 className="text-lg font-semibold text-page">{t('packages.confirmTitle')}</h2>
              <p className="mt-3 text-sm text-page-secondary">
                {t('packages.confirmDesc', { name: confirmPkg.name, price: fmtCNY(pkgPrice) })}
              </p>
              {isSubscription && (
                <div className="mt-3 rounded-xl border border-[#E6D1C1] bg-[#FFF3E9] p-3">
                  <p className="text-xs text-[#9C583F]">
                    {t('packages.subscriptionInfo', {
                      symbol,
                      period: getResetLabel(resetPeriod),
                      days: confirmPkg.duration || 30,
                      amount: (confirmPkg.quota_amount / Q * rate).toFixed(decimals),
                    })}
                  </p>
                </div>
              )}
              <p className="mt-4 text-sm text-page-secondary">
                {t('packages.yourBalance')}{' '}
                <span className={`font-semibold ${insufficient ? 'text-page-danger' : 'text-page-success'}`}>
                  {fmtCNY(userBalanceCny)}
                </span>
              </p>
              {insufficient && (
                <p className="mt-3 rounded-xl bg-red-500/10 p-3 text-sm text-page-danger">
                  {t('packages.insufficientBalance')}
                </p>
              )}
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setConfirmPkg(null)} disabled={subscribing} className="btn-secondary">
                  {t('tokens.cancel')}
                </button>
                {insufficient ? (
                  <button type="button" onClick={() => navigate('/topup')} disabled={subscribing} className="btn-primary">
                    {t('nav.topup')}
                  </button>
                ) : (
                  <button type="button" onClick={confirmSubscribe} disabled={subscribing} className="btn-primary">
                    {subscribing ? t('packages.processing') : t('packages.confirm')}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </SnapDeck>
  );
}
