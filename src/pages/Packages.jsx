import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  Check,
  ExternalLink,
  ShoppingBag,
  Sparkles,
  TicketCheck,
  WalletCards,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCurrency, useSite } from '../context/SiteContext';
import {
  getSitePackages,
  getSiteModels,
  subscribePackage,
  getActiveSubscriptions,
  Q,
} from '../api';
import { calcOfficialEquivList } from '../utils/officialEquiv';
import { localizePackage } from '../utils/packageLocalization';
import toast from 'react-hot-toast';

const resetLabelKeys = {
  never: 'packages.resetNever',
  daily: 'packages.resetDaily',
  weekly: 'packages.resetWeekly',
  monthly: 'packages.resetMonthly',
};

function formatDate(unix) {
  if (!unix) return '';
  return new Date(unix * 1000).toLocaleDateString();
}

function normalizeExternalUrl(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function getPackageQuota(pkg) {
  const resetPeriod = pkg.quota_reset_period || 'never';
  const singleQuotaDollars = pkg.quota_amount > 0 ? pkg.quota_amount / Q : 0;
  if (resetPeriod === 'never' || !pkg.duration || !singleQuotaDollars) {
    return singleQuotaDollars;
  }

  const resetCount = resetPeriod === 'daily'
    ? pkg.duration
    : resetPeriod === 'weekly'
      ? Math.floor(pkg.duration / 7)
      : resetPeriod === 'monthly'
        ? Math.floor(pkg.duration / 30)
        : 1;
  return singleQuotaDollars * Math.max(1, resetCount);
}

export default function Packages() {
  const { t, i18n } = useTranslation();
  const { user, refreshUser } = useAuth();
  const { site } = useSite();
  const navigate = useNavigate();
  const { symbol, rate, fmtCNY } = useCurrency();
  const [packages, setPackages] = useState([]);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(null);
  const [activeSubs, setActiveSubs] = useState([]);
  const [confirmPkg, setConfirmPkg] = useState(null);

  const shopUrl = normalizeExternalUrl(site?.top_up_link);
  const getResetLabel = (period) => t(resetLabelKeys[period] || resetLabelKeys.never);

  useEffect(() => {
    Promise.all([
      getSitePackages()
        .then((res) => { if (res.data.success) setPackages(res.data.data || []); })
        .catch(() => {}),
      getSiteModels()
        .then((res) => { if (res.data.success) setModels(res.data.data || []); })
        .catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    getActiveSubscriptions()
      .then((res) => { if (res.data.success) setActiveSubs(res.data.data || []); })
      .catch(() => {});
  }, [user]);

  const enabledModels = useMemo(
    () => models.filter((model) => model.enabled !== false),
    [models],
  );
  const enabled = useMemo(
    () => packages
      .filter((pkg) => pkg.enabled !== false)
      .map((pkg) => localizePackage(pkg, t, i18n.resolvedLanguage)),
    [i18n.resolvedLanguage, packages, t],
  );
  const recommendedId = enabled.find((pkg) => Number(pkg.duration) === 30)?.id
    || enabled[1]?.id;

  const handleSubscribe = (pkg) => {
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
        toast.success(t('packages.subscribedSuccess'));
        setConfirmPkg(null);
        await refreshUser({ skipErrorHandler: true }).catch(() => null);
        const subsRes = await getActiveSubscriptions({ skipErrorHandler: true }).catch(() => null);
        if (subsRes?.data?.success) setActiveSubs(subsRes.data.data || []);
      } else {
        toast.error(res.data.message || t('common.requestFailed'));
      }
    } catch {
      // Global interceptor displays request errors.
    }
    setSubscribing(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500/30 border-t-brand-500" />
      </div>
    );
  }

  return (
    <div className="pb-20">
      <section className="route-hero border-b border-[#E8DDD0]">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 md:px-8 md:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <p className="route-kicker">{t('packages.eyebrow')}</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-[-0.04em] text-[#3D3024] md:text-5xl">
              {t('packages.title')}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[#756454]">
              {t('packages.subtitle')}
            </p>
          </div>
          <div className="rounded-[22px] border border-[#E1D1C3] bg-white/70 p-5 shadow-sm">
            <p className="text-sm font-semibold text-[#3D3024]">{t('packages.purchaseFlow')}</p>
            <div className="mt-4 flex items-center gap-2 text-xs text-[#766657] sm:text-sm">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#D97757] font-bold text-white">1</span>
              <span>{t('home.stepBuy')}</span>
              <ArrowRight size={14} className="text-[#B6A391]" />
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F0E5DB] font-bold text-[#B75F43]">2</span>
              <span>{t('home.stepRedeem')}</span>
              <ArrowRight size={14} className="text-[#B6A391]" />
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F0E5DB] font-bold text-[#B75F43]">3</span>
              <span>{t('home.stepCreateKey')}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 pt-12 md:px-8">
        {activeSubs.length > 0 && (
          <section className="mb-12">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#D97757]/10 text-[#C56547]">
                <TicketCheck size={18} />
              </span>
              <h2 className="text-lg font-semibold text-[#3D3024]">{t('packages.mySubscriptions')}</h2>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {activeSubs.map((sub) => {
                const total = sub.amount_total || 0;
                const used = sub.amount_used || 0;
                const remain = Math.max(0, total - used);
                const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
                return (
                  <div key={sub.id} className="rounded-[20px] border border-[#E5D7CB] bg-white/75 p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#3D3024]">
                        {t('packages.subscriptionId', { id: sub.id })}
                      </span>
                      <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700">
                        {t('packages.active')}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#897665]">
                      <span>{t('packages.expires')}: {formatDate(sub.end_time)}</span>
                      {sub.next_reset_time > 0 && (
                        <span>{t('packages.nextReset')}: {formatDate(sub.next_reset_time)}</span>
                      )}
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#F0E5DB]">
                        <div className="h-full rounded-full bg-[#D97757]" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="whitespace-nowrap text-xs text-[#766657]">
                        {symbol}{(remain / Q * rate).toFixed(2)} / {symbol}{(total / Q * rate).toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {enabled.length === 0 ? (
          <div className="py-16 text-center text-page-secondary">
            <p>{t('packages.noPackages')}</p>
            <Link to="/pricing" className="mt-3 inline-flex items-center gap-2 text-page-link">
              {t('packages.checkPricing')}
              <ArrowRight size={15} />
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-3">
            {enabled.map((pkg) => {
              const resetPeriod = pkg.quota_reset_period || 'never';
              const isSubscription = resetPeriod !== 'never';
              const equiv = calcOfficialEquivList(enabledModels, getPackageQuota(pkg))[0];
              const recommended = pkg.id === recommendedId;

              return (
                <article
                  key={pkg.id}
                  className={`relative flex flex-col rounded-[26px] border p-6 transition-all hover:-translate-y-1 ${
                    recommended
                      ? 'border-[#D97757] bg-[#FFF1E7] text-[#3D3024] shadow-[0_24px_60px_rgba(217,119,87,0.14)]'
                      : 'border-[#E5D7CB] bg-white/75 text-[#3D3024] shadow-[0_14px_40px_rgba(82,61,43,0.06)]'
                  }`}
                >
                  {recommended && (
                    <span className="absolute right-5 top-5 rounded-full bg-[#D97757] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em]">
                      {t('packages.recommended')}
                    </span>
                  )}

                  <div className="pr-20">
                    <h2 className="text-xl font-semibold">{pkg.name}</h2>
                    {pkg.description && (
                      <p className="mt-2 min-h-12 text-sm leading-6 text-[#806F60]">
                        {pkg.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-7">
                    <span className="text-4xl font-bold tracking-tight">{fmtCNY(pkg.price)}</span>
                    {pkg.original_price > pkg.price && (
                      <span className="ml-2 text-sm text-[#A89685] line-through">
                        {fmtCNY(pkg.original_price)}
                      </span>
                    )}
                    {pkg.duration > 0 && (
                      <p className="mt-2 text-xs text-[#927E6C]">
                        {t('packages.daysAccess', { count: pkg.duration })}
                      </p>
                    )}
                  </div>

                  {equiv && (
                    <div className={`mt-5 rounded-2xl border p-3 text-xs ${
                      recommended
                        ? 'border-[#E6C7B3] bg-white/55 text-[#9C583F]'
                        : 'border-[#EAD7C8] bg-[#FFF5EC] text-[#9C583F]'
                    }`}>
                      <span className="flex items-start gap-2">
                        <Sparkles size={14} className="mt-0.5 shrink-0 text-[#D97757]" />
                        {t('packages.officialEquiv', { model: equiv.label, amount: equiv.equivDollars })}
                      </span>
                    </div>
                  )}

                  <ul className="my-6 space-y-3 border-y border-[#E8D6C8] py-6 text-sm text-[#665548]">
                    {pkg.quota_amount > 0 && (
                      <li className="flex items-center gap-2">
                        <Check size={15} className="shrink-0 text-[#D97757]" />
                        {isSubscription
                          ? t('packages.periodicQuota', {
                            symbol,
                            amount: (pkg.quota_amount / Q * rate).toFixed(2),
                            period: getResetLabel(resetPeriod),
                          })
                          : t('packages.creditIncluded', {
                            symbol,
                            amount: (pkg.quota_amount / Q * rate).toFixed(2),
                          })}
                      </li>
                    )}
                    <li className="flex items-center gap-2">
                      <Check size={15} className="shrink-0 text-[#D97757]" />
                      {t('packages.allModels')}
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={15} className="shrink-0 text-[#D97757]" />
                      {t('packages.openaiApi')}
                    </li>
                  </ul>

                  <div className="mt-auto space-y-2.5">
                    {shopUrl ? (
                      <a
                        href={shopUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex w-full items-center justify-center gap-2 rounded-full bg-[#D97757] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#C4613F]"
                      >
                        <ShoppingBag size={16} />
                        {t('packages.buyVoucher')}
                        <ExternalLink size={14} />
                      </a>
                    ) : (
                      <Link
                        to={user ? `/topup?package_id=${pkg.id}` : '/register'}
                        className="flex w-full items-center justify-center gap-2 rounded-full bg-[#D97757] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#C4613F]"
                      >
                        {t('packages.haveVoucher')}
                        <ArrowRight size={15} />
                      </Link>
                    )}
                    <Link
                      to={user ? `/topup?package_id=${pkg.id}` : '/register'}
                      className={`flex w-full items-center justify-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold transition-colors ${
                        recommended
                          ? 'border-[#D9BBA6] bg-white/60 text-[#57463A] hover:bg-white'
                          : 'border-[#DDCCBE] bg-[#FAF5F0] text-[#57463A] hover:bg-[#F0E5DB]'
                      }`}
                    >
                      <TicketCheck size={16} />
                      {t('packages.haveVoucher')}
                    </Link>
                    {user && (
                      <button
                        onClick={() => handleSubscribe(pkg)}
                        disabled={subscribing === pkg.id}
                        className="flex w-full items-center justify-center gap-2 py-2 text-xs text-[#947F6D] transition-colors hover:text-[#D97757]"
                      >
                        <WalletCards size={14} />
                        {subscribing === pkg.id ? t('packages.processing') : t('packages.balanceSubscribe')}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {confirmPkg && (() => {
        const userBalance = (user?.quota || 0) / Q * rate;
        const pkgPrice = Number(confirmPkg.price);
        const insufficient = userBalance < pkgPrice;
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
                      amount: (confirmPkg.quota_amount / Q * rate).toFixed(2),
                    })}
                  </p>
                </div>
              )}
              <p className="mt-4 text-sm text-page-secondary">
                {t('packages.yourBalance')}{' '}
                <span className={`font-semibold ${insufficient ? 'text-page-danger' : 'text-page-success'}`}>
                  {symbol}{userBalance.toFixed(2)}
                </span>
              </p>
              {insufficient && (
                <p className="mt-3 rounded-xl bg-red-500/10 p-3 text-sm text-page-danger">
                  {t('packages.insufficientBalance')}
                </p>
              )}
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setConfirmPkg(null)} disabled={subscribing} className="btn-secondary">
                  {t('tokens.cancel')}
                </button>
                <button onClick={confirmSubscribe} disabled={insufficient || subscribing} className="btn-primary">
                  {subscribing ? t('packages.processing') : t('packages.confirm')}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
