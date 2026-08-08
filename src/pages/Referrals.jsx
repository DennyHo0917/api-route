import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Award, ChevronDown, ChevronUp } from 'lucide-react';
import {
  getAffCode,
  getAffEarnings,
  getDistKolStatus,
  Q,
  requestAffWithdraw,
  submitDistKolApply,
  transferAffQuota,
} from '../api';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/SiteContext';

// ponytail: keep the displayed campaign tiers local until the backend exposes a public configuration endpoint.
const AFFILIATE_MILESTONES = [
  { invites: 20, rate: 0.07 },
  { invites: 50, rate: 0.10 },
  { invites: 100, rate: 0.15 },
];

export default function Referrals() {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();
  const { symbol, rate, decimals } = useCurrency();
  const [affLink, setAffLink] = useState('');
  const [affEarnings, setAffEarnings] = useState([]);
  const [showAffEarnings, setShowAffEarnings] = useState(false);
  const [affEarningsLoading, setAffEarningsLoading] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('');
  const [withdrawRemark, setWithdrawRemark] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [distKolStatus, setDistKolStatus] = useState(null);
  const [showKolApplyModal, setShowKolApplyModal] = useState(false);
  const [kolApplyLoading, setKolApplyLoading] = useState(false);
  const [socialLink, setSocialLink] = useState('');
  const [followers, setFollowers] = useState('');
  const [promotionPlan, setPromotionPlan] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [showMilestones, setShowMilestones] = useState(true);

  const loadData = useCallback(async () => {
    const [affRes, kolRes] = await Promise.all([
      getAffCode().catch(() => null),
      getDistKolStatus().catch(() => null),
    ]);
    if (affRes?.data?.success && affRes.data.data) {
      setAffLink(`${window.location.origin}/register?aff=${affRes.data.data}`);
    }
    if (kolRes?.data?.success) {
      setDistKolStatus(kolRes.data.data || null);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const availableAffAmount = ((user?.aff_quota || 0) / Q) * rate;
  const defaultCommissionRate = Number(user?.default_commission_rate ?? 0.05);
  const currentCommissionRate = Number(user?.commission_rate ?? defaultCommissionRate);
  const hasCustomCommissionRate = currentCommissionRate > defaultCommissionRate + 1e-8;
  const inviteCount = Math.max(0, Number(user?.aff_count) || 0);
  const completedMilestones = AFFILIATE_MILESTONES.filter(({ invites }) => inviteCount >= invites).length;
  const nextMilestone = AFFILIATE_MILESTONES.find(({ invites }) => inviteCount < invites);

  const loadAffEarnings = async () => {
    setAffEarningsLoading(true);
    try {
      const res = await getAffEarnings({ page: 1, page_size: 20 });
      if (res.data.success && res.data.data) setAffEarnings(res.data.data);
    } catch (e) {
      /* interceptor */
    }
    setAffEarningsLoading(false);
  };

  const handleCopyAffLink = () => {
    if (!affLink) return;
    navigator.clipboard.writeText(affLink).then(() => {
      toast.success(t('topup.copied'));
    }).catch(() => {
      toast.error('Copy failed');
    });
  };

  const handleShareAffLink = () => {
    const text = t('loginNotice.xPost', { link: affLink });
    window.open(`https://x.com/intent/post?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  const handleTransfer = async () => {
    const amount = Number.parseFloat(transferAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error(t('topup.enterAmount'));
      return;
    }
    setTransferring(true);
    try {
      const res = await transferAffQuota({ quota: Math.round((amount / rate) * Q) });
      if (res.data.success) {
        toast.success(res.data.message || t('topup.transferSuccess'));
        setTransferAmount('');
        await Promise.all([loadData(), refreshUser()]);
      }
    } catch (e) {
      /* interceptor */
    }
    setTransferring(false);
  };

  const resetWithdrawForm = () => {
    setWithdrawAmount('');
    setWithdrawMethod('');
    setWithdrawRemark('');
  };

  const handleCloseWithdraw = () => {
    if (withdrawing) return;
    resetWithdrawForm();
    setShowWithdrawModal(false);
  };

  const handleWithdraw = async () => {
    const amount = Number.parseFloat(withdrawAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error(t('topup.invalidWithdrawAmount'));
      return;
    }
    if (amount - availableAffAmount > 1e-8) {
      toast.error(t('topup.withdrawExceedsBalance'));
      return;
    }
    if (!withdrawMethod.trim()) {
      toast.error(t('topup.enterWithdrawMethod'));
      return;
    }

    setWithdrawing(true);
    try {
      const res = await requestAffWithdraw({
        amount: amount / rate,
        payment_method: withdrawMethod.trim(),
        remark: withdrawRemark.trim(),
      });
      if (res.data.success) {
        toast.success(res.data.message || t('topup.withdrawSuccess'));
        setShowWithdrawModal(false);
        resetWithdrawForm();
        await Promise.all([loadData(), refreshUser()]);
      }
    } catch (e) {
      /* interceptor */
    }
    setWithdrawing(false);
  };

  const resetKolApplyForm = () => {
    setSocialLink('');
    setFollowers('');
    setPromotionPlan('');
    setContactInfo('');
  };

  const handleCloseKolApply = () => {
    if (kolApplyLoading) return;
    resetKolApplyForm();
    setShowKolApplyModal(false);
  };

  const handleKolApply = async () => {
    if (!socialLink.trim()) {
      toast.error(t('topup.kolSocialRequired'));
      return;
    }
    setKolApplyLoading(true);
    try {
      const res = await submitDistKolApply({
        social_link: socialLink.trim(),
        followers: followers.trim(),
        promotion_plan: promotionPlan.trim(),
        contact_info: contactInfo.trim(),
      });
      if (res.data.success) {
        toast.success(res.data.message || t('topup.kolApplySuccess'));
        setShowKolApplyModal(false);
        resetKolApplyForm();
        await Promise.all([loadData(), refreshUser()]);
      }
    } catch (e) {
      /* interceptor */
    }
    setKolApplyLoading(false);
  };

  const renderCommissionApplicationPanel = () => {
    if (distKolStatus?.status === 0) {
      return (
        <div className="glass-sm rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-page">{t('topup.kolPendingTitle')}</p>
              <p className="mt-1 text-xs text-page-secondary">{t('topup.kolPendingDesc')}</p>
            </div>
            <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600">
              {t('topup.kolPendingBadge')}
            </span>
          </div>
        </div>
      );
    }

    if (distKolStatus?.status === 1 || hasCustomCommissionRate) {
      return (
        <div className="glass-sm rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-page">{t('topup.kolApprovedTitle')}</p>
              <p className="mt-1 text-xs text-page-secondary">{t('topup.kolApprovedDesc')}</p>
            </div>
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600">
              {(currentCommissionRate * 100).toFixed(1)}%
            </span>
          </div>
          {distKolStatus?.admin_remark && (
            <p className="mt-3 text-xs text-page-muted">
              {t('topup.kolRemarkLabel')}
              {distKolStatus.admin_remark}
            </p>
          )}
        </div>
      );
    }

    return (
      <div className="glass-sm rounded-xl border border-page-link/20 bg-page-link/5 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-page">{t('topup.kolApplyTitle')}</p>
            <p className="mt-1 text-xs text-page-secondary">
              {t('topup.kolApplyDesc', { rate: (defaultCommissionRate * 100).toFixed(1) })}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              resetKolApplyForm();
              setShowKolApplyModal(true);
            }}
            className="btn-primary whitespace-nowrap px-4 py-2 text-sm"
          >
            {t('topup.kolApplyAction')}
          </button>
        </div>
        {distKolStatus?.status === 2 && (
          <p className="mt-3 text-xs text-red-500">
            {t('topup.kolRejectedLabel')}
            {distKolStatus.admin_remark || t('topup.kolRejectedFallback')}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-72px)] max-w-5xl flex-col justify-center px-6 py-10">
      <section className="glass w-full rounded-2xl p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-heading font-semibold text-page">{t('topup.inviteTitle')}</h1>
            <p className="mt-1 text-sm text-page-secondary">{t('topup.inviteSubtitle')}</p>
          </div>
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-page-link/20 bg-page-link/10 px-3 py-1 text-xs font-medium text-page">
            <span className="text-page-secondary">{t('topup.currentCommissionRateLabel')}</span>
            <span className="text-page-link">{(currentCommissionRate * 100).toFixed(1)}%</span>
          </div>
        </div>

        <p className="mb-5 text-xs text-page-muted">
          {t('topup.currentCommissionRateDesc', { rate: (defaultCommissionRate * 100).toFixed(1) })}
        </p>

        <div className="mb-5">{renderCommissionApplicationPanel()}</div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="glass-sm rounded-xl p-4 text-center">
            <p className="mb-1 text-xs text-page-secondary">{t('topup.affAvailable')}</p>
            <p className="text-xl font-bold text-page">
              {symbol}{availableAffAmount.toFixed(decimals)}
            </p>
          </div>
          <div className="glass-sm rounded-xl p-4 text-center">
            <p className="mb-1 text-xs text-page-secondary">{t('topup.affTotal')}</p>
            <p className="text-xl font-bold text-page">
              {symbol}{(((user?.aff_history_quota || 0) / Q) * rate).toFixed(decimals)}
            </p>
          </div>
          <div className="glass-sm rounded-xl p-4 text-center">
            <p className="mb-1 text-xs text-page-secondary">{t('topup.affCount')}</p>
            <p className="text-xl font-bold text-page">{user?.aff_count || 0}</p>
          </div>
        </div>

        <div className="mb-6 border-y border-page-divider">
          <button
            type="button"
            onClick={() => setShowMilestones((value) => !value)}
            aria-expanded={showMilestones}
            className="flex w-full items-center justify-between gap-4 py-4 text-left"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-page-link/10 text-page-link">
                <Award size={20} strokeWidth={1.8} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-page">{t('topup.milestonesTitle')}</p>
                <p className="mt-0.5 truncate text-xs text-page-secondary">
                  {nextMilestone
                    ? t('topup.milestonesNext', { count: nextMilestone.invites - inviteCount })
                    : t('topup.milestonesAllReached')}
                </p>
              </div>
            </div>
            <span className="flex shrink-0 items-center gap-2 text-xs text-page-secondary">
              {t('topup.milestonesProgress', {
                completed: completedMilestones,
                total: AFFILIATE_MILESTONES.length,
              })}
              {showMilestones ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
          </button>

          {showMilestones && (
            <div className="border-t border-page-divider pb-4 pt-4">
              <p className="mb-3 text-xs text-page-muted">{t('topup.milestonesDescription')}</p>
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] text-sm">
                <div className="border-b border-page-divider px-2 pb-2 text-page-secondary">{t('topup.milestonesInviteHeader')}</div>
                <div className="border-b border-page-divider px-2 pb-2 text-page-secondary">{t('topup.milestonesRateHeader')}</div>
                <div className="border-b border-page-divider px-2 pb-2 text-right text-page-secondary">{t('topup.milestonesStatusHeader')}</div>
                {AFFILIATE_MILESTONES.map((milestone) => {
                  const reached = inviteCount >= milestone.invites;
                  const inProgress = !reached && nextMilestone?.invites === milestone.invites;
                  return (
                    <React.Fragment key={milestone.invites}>
                      <div className="border-b border-page-divider px-2 py-3 text-page last:border-0">{milestone.invites} {t('topup.milestonesPeopleSuffix')}</div>
                      <div className="border-b border-page-divider px-2 py-3 text-page-secondary last:border-0">{(milestone.rate * 100).toFixed(0)}%</div>
                      <div className="border-b border-page-divider px-2 py-3 text-right last:border-0">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs ${
                          reached
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : inProgress
                              ? 'bg-page-link/10 text-page-link'
                              : 'bg-page-surface-hover text-page-muted'
                        }`}>
                          {t(`topup.milestonesStatus${reached ? 'Reached' : inProgress ? 'InProgress' : 'NotReached'}`)}
                        </span>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-page-muted">{t('topup.milestonesFootnote')}</p>
            </div>
          )}
        </div>

        {affLink && (
          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-page-label">{t('topup.inviteLink')}</label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input type="text" readOnly value={affLink} className="input min-w-0 text-sm sm:flex-1" />
              <button type="button" onClick={handleCopyAffLink} className="btn-primary whitespace-nowrap px-4 text-sm">
                {t('topup.copy')}
              </button>
              <button type="button" onClick={handleShareAffLink} className="btn-secondary whitespace-nowrap px-4 text-sm">
                {t('loginNotice.shareToX')}
              </button>
            </div>
          </div>
        )}

        {(user?.aff_quota || 0) > 0 && (
          <div className="mb-5">
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className="block text-sm font-medium text-page-label">{t('topup.transferToBalance')}</label>
              <button
                type="button"
                onClick={() => {
                  resetWithdrawForm();
                  setShowWithdrawModal(true);
                }}
                className="btn-secondary whitespace-nowrap px-4 py-2 text-sm"
              >
                {t('topup.withdraw')}
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                value={transferAmount}
                onChange={(event) => setTransferAmount(event.target.value)}
                placeholder={t('topup.transferPlaceholder')}
                className="input flex-1 text-sm"
                min="0"
                step="0.01"
              />
              <button onClick={handleTransfer} disabled={transferring} className="btn-primary whitespace-nowrap px-4 text-sm">
                {transferring ? t('topup.processing') : t('topup.transfer')}
              </button>
            </div>
          </div>
        )}

        <div>
          <button
            type="button"
            onClick={() => {
              setShowAffEarnings((value) => !value);
              if (!showAffEarnings) loadAffEarnings();
            }}
            className="text-sm text-page-secondary transition-colors hover:text-page"
          >
            {showAffEarnings ? t('topup.hideEarnings') : t('topup.viewEarnings')}
          </button>
          {showAffEarnings && (
            <div className="mt-3">
              {affEarningsLoading ? (
                <div className="flex justify-center py-6">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-page-link/30 border-t-page-link" />
                </div>
              ) : affEarnings.length === 0 ? (
                <p className="py-6 text-center text-sm text-page-muted">{t('topup.noEarnings')}</p>
              ) : (
                <div className="space-y-2">
                  {affEarnings.map((item, index) => (
                    <div key={index} className="glass-sm flex items-center justify-between rounded-xl px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm text-page">
                          {item.username || item.display_name || (item.user_id ? `ID ${item.user_id}` : '-')}
                        </p>
                        <p className="truncate text-xs text-page-muted">
                          {item.model_name || '-'} · {new Date(item.created_time * 1000).toLocaleString()} · {(item.commission_rate * 100).toFixed(1)}%
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-medium text-page-success">
                        +{symbol}{((item.commission_quota / Q) * rate).toLocaleString(undefined, {
                          minimumFractionDigits: Math.max(decimals, 2),
                          maximumFractionDigits: Math.max(decimals, 6),
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {showWithdrawModal && (
        <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={handleCloseWithdraw}>
          <div className="glass w-full max-w-md rounded-2xl p-6" onClick={(event) => event.stopPropagation()}>
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-page">{t('topup.withdrawTitle')}</h2>
              <p className="mt-1 text-sm text-page-secondary">{t('topup.withdrawSubtitle')}</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-page-label">{t('topup.withdrawAvailable')}</label>
                <input type="text" readOnly value={`${symbol}${availableAffAmount.toFixed(decimals)}`} className="input bg-page-surface-hover/60 text-page-secondary" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-page-label">{t('topup.withdrawAmount')}</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-page-muted">{symbol}</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={withdrawAmount}
                      onChange={(event) => setWithdrawAmount(event.target.value)}
                      placeholder="0.00"
                      className="input pl-8"
                    />
                  </div>
                  <button type="button" onClick={() => setWithdrawAmount(availableAffAmount.toFixed(decimals))} className="btn-secondary whitespace-nowrap px-4">
                    {t('topup.withdrawAll')}
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-page-label">{t('topup.withdrawMethod')}</label>
                <input type="text" value={withdrawMethod} onChange={(event) => setWithdrawMethod(event.target.value)} placeholder={t('topup.withdrawMethodPlaceholder')} className="input" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-page-label">{t('topup.withdrawRemark')}</label>
                <textarea value={withdrawRemark} onChange={(event) => setWithdrawRemark(event.target.value)} placeholder={t('topup.withdrawRemarkPlaceholder')} className="input min-h-[96px] resize-y" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={handleCloseWithdraw} disabled={withdrawing} className="btn-secondary px-4 py-2">{t('tokens.cancel')}</button>
              <button type="button" onClick={handleWithdraw} disabled={withdrawing} className="btn-primary px-4 py-2">
                {withdrawing ? t('topup.processing') : t('topup.submitWithdraw')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showKolApplyModal && (
        <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={handleCloseKolApply}>
          <div className="glass w-full max-w-md rounded-2xl p-6" onClick={(event) => event.stopPropagation()}>
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-page">{t('topup.kolApplyModalTitle')}</h2>
              <p className="mt-1 text-sm text-page-secondary">{t('topup.kolApplyModalDesc')}</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-page-label">{t('topup.kolSocialLabel')}</label>
                <input type="text" value={socialLink} onChange={(event) => setSocialLink(event.target.value)} placeholder={t('topup.kolSocialPlaceholder')} className="input" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-page-label">{t('topup.kolFollowersLabel')}</label>
                <input type="text" value={followers} onChange={(event) => setFollowers(event.target.value)} placeholder={t('topup.kolFollowersPlaceholder')} className="input" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-page-label">{t('topup.kolPlanLabel')}</label>
                <textarea value={promotionPlan} onChange={(event) => setPromotionPlan(event.target.value)} placeholder={t('topup.kolPlanPlaceholder')} className="input min-h-[96px] resize-y" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-page-label">{t('topup.kolContactLabel')}</label>
                <input type="text" value={contactInfo} onChange={(event) => setContactInfo(event.target.value)} placeholder={t('topup.kolContactPlaceholder')} className="input" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={handleCloseKolApply} disabled={kolApplyLoading} className="btn-secondary px-4 py-2">{t('tokens.cancel')}</button>
              <button type="button" onClick={handleKolApply} disabled={kolApplyLoading} className="btn-primary px-4 py-2">
                {kolApplyLoading ? t('topup.processing') : t('topup.kolApplySubmit')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
