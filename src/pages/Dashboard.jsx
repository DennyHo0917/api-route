import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  getUserUsage,
  getUserLogs,
  getAffCode,
  transferAffQuota,
  getAffEarnings,
  requestAffWithdraw,
  getDistKolStatus,
  submitDistKolApply,
  Q,
} from '../api';
import { useCurrency } from '../context/SiteContext';
import CountUp from '../components/bits/CountUp';
import toast from 'react-hot-toast';

const DASHBOARD_RANGES = [
  { key: '24h', labelKey: 'dashboard.range24h' },
  { key: 'today', labelKey: 'dashboard.rangeToday' },
  { key: '7d', labelKey: 'dashboard.range7d' },
  { key: '14d', labelKey: 'dashboard.range14d' },
  { key: '30d', labelKey: 'dashboard.range30d' },
];
const DASHBOARD_FETCH_RANGE = '30d';
const DASHBOARD_LOG_PAGE_SIZE = 1000;

// ponytail: page-session cache; refresh the browser page to pull fresh dashboard logs.
let dashboardLogsCache = null;
let dashboardErrorsCache = null;

const fetchDashboardLogs = async (baseParams) => {
  const logs = [];
  for (let page = 1; ; page += 1) {
    const res = await getUserLogs({
      ...baseParams,
      type: '2',
      p: page,
      page_size: DASHBOARD_LOG_PAGE_SIZE,
    });
    if (!res.data.success) throw new Error(res.data.message || 'Failed to load dashboard logs');

    const data = res.data.data || {};
    const items = data.items || [];
    logs.push(...items);
    if (items.length === 0 || logs.length >= Number(data.total || 0)) return logs;
  }
};

const getRangeBounds = (range) => {
  const now = new Date();
  const end = Math.floor(now.getTime() / 1000);
  const start = new Date(now);
  if (range === 'today') {
    start.setHours(0, 0, 0, 0);
  } else {
    const hours = range === '24h' ? 24 : Number.parseInt(range, 10) * 24;
    start.setTime(now.getTime() - hours * 60 * 60 * 1000);
  }
  return { start: Math.floor(start.getTime() / 1000), end };
};

const formatNumber = (value) => Number(value || 0).toLocaleString();

const toDisplayMoney = (quota, symbol, rate, decimals) => {
  const amount = (Number(quota || 0) / Q) * rate;
  return `${symbol}${amount.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: Math.max(decimals, 4),
  })}`;
};

const getLogTokens = (log) => Number(log.prompt_tokens || 0) + Number(log.completion_tokens || 0);

const filterLogsByBounds = (logs, { start, end }) => logs.filter((log) => {
  const createdAt = Number(log.created_at || 0);
  return createdAt && createdAt >= start && createdAt <= end;
});

const summarizeLogs = (logs, start, end) => {
  const quota = logs.reduce((sum, log) => sum + Number(log.quota || 0), 0);
  const token = logs.reduce((sum, log) => sum + getLogTokens(log), 0);
  const minutes = Math.max(1, (end - start) / 60);
  return {
    quota,
    token,
    rpm: logs.length / minutes,
    tpm: token / minutes,
  };
};

const groupLogs = (logs, field) => {
  const map = new Map();
  logs.forEach((log) => {
    const name = log[field] || '-';
    const row = map.get(name) || { name, quota: 0, requests: 0, tokens: 0 };
    row.quota += Number(log.quota || 0);
    row.requests += 1;
    row.tokens += getLogTokens(log);
    map.set(name, row);
  });
  return [...map.values()].sort((a, b) => b.quota - a.quota).slice(0, 6);
};

const buildCostSeries = (logs, start, end, locale) => {
  const bucketCount = 12;
  const span = Math.max(1, end - start);
  const bucketSize = Math.max(1, Math.ceil(span / bucketCount));
  const formatter = new Intl.DateTimeFormat(locale, span <= 36 * 3600
    ? { hour: '2-digit', minute: '2-digit' }
    : { month: '2-digit', day: '2-digit' });
  const buckets = Array.from({ length: bucketCount }, (_, index) => {
    const bucketStart = start + index * bucketSize;
    return {
      label: formatter.format(new Date(bucketStart * 1000)),
      quota: 0,
      requests: 0,
    };
  });

  logs.forEach((log) => {
    const createdAt = Number(log.created_at || 0);
    if (!createdAt || createdAt < start || createdAt > end) return;
    const index = Math.min(bucketCount - 1, Math.floor((createdAt - start) / bucketSize));
    buckets[index].quota += Number(log.quota || 0);
    buckets[index].requests += 1;
  });
  return buckets;
};

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage || i18n.language || 'en';
  const { user, refreshUser } = useAuth();
  const { symbol, rate, decimals } = useCurrency();
  const [usage, setUsage] = useState(null);
  const [analyticsRange, setAnalyticsRange] = useState('24h');
  const [analyticsAnimationKey, setAnalyticsAnimationKey] = useState(0);
  const [analytics, setAnalytics] = useState({
    logsLoading: true,
    errorsLoading: true,
    logs: [],
    errors: [],
  });

  // Invitation / Aff
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

  const loadData = useCallback(async () => {
    try {
      const [usageRes, affRes, kolRes] = await Promise.all([
        getUserUsage(),
        getAffCode().catch(() => null),
        getDistKolStatus().catch(() => null),
      ]);
      if (usageRes.data.success) setUsage(usageRes.data.data);
      if (affRes?.data?.success && affRes.data.data) {
        setAffLink(`${window.location.origin}/register?aff=${affRes.data.data}`);
      }
      if (kolRes?.data?.success) {
        setDistKolStatus(kolRes.data.data || null);
      }
    } catch (e) {
      /* interceptor */
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const analyticsBounds = useMemo(() => getRangeBounds(analyticsRange), [analyticsRange]);
  const analyticsRangeIndex = Math.max(0, DASHBOARD_RANGES.findIndex((item) => item.key === analyticsRange));
  const chartAnimationKey = `${analyticsRange}-${analyticsAnimationKey}`;

  const loadAnalytics = useCallback(() => {
    const fetchBounds = getRangeBounds(DASHBOARD_FETCH_RANGE);
    const baseParams = {
      start_timestamp: fetchBounds.start,
      end_timestamp: fetchBounds.end,
    };

    setAnalytics((current) => ({
      ...current,
      logsLoading: !dashboardLogsCache,
      errorsLoading: !dashboardErrorsCache,
      logs: dashboardLogsCache || current.logs,
      errors: dashboardErrorsCache || current.errors,
    }));

    if (!dashboardLogsCache) {
      fetchDashboardLogs(baseParams)
        .then((logs) => {
          dashboardLogsCache = logs;
          setAnalytics((current) => ({
            ...current,
            logsLoading: false,
            logs: dashboardLogsCache,
          }));
        })
        .catch(() => {
          setAnalytics((current) => ({ ...current, logsLoading: false }));
        });
    }

    if (!dashboardErrorsCache) {
      getUserLogs({ ...baseParams, type: '5', p: 1, page_size: 3 })
        .then((res) => {
          dashboardErrorsCache = res.data.success ? res.data.data?.items || [] : [];
          setAnalytics((current) => ({
            ...current,
            errorsLoading: false,
            errors: dashboardErrorsCache,
          }));
        })
        .catch(() => {
          setAnalytics((current) => ({ ...current, errorsLoading: false }));
        });
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const loadAffEarnings = async () => {
    setAffEarningsLoading(true);
    try {
      const res = await getAffEarnings({ page: 1, page_size: 20 });
      if (res.data.success && res.data.data) {
        setAffEarnings(res.data.data);
      }
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

  const handleAnalyticsRangeClick = (range) => {
    setAnalyticsRange(range);
    setAnalyticsAnimationKey((current) => current + 1);
  };

  const getAffEarningUsername = (item) => item.username || item.display_name || (item.user_id ? `ID ${item.user_id}` : '-');

  const handleTransfer = async () => {
    const amount = Number.parseFloat(transferAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error(t('topup.enterAmount'));
      return;
    }
    const quotaValue = Math.round((amount / rate) * Q);
    setTransferring(true);
    try {
      const res = await transferAffQuota({ quota: quotaValue });
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

  const handleOpenWithdraw = () => {
    resetWithdrawForm();
    setShowWithdrawModal(true);
  };

  const handleCloseWithdraw = () => {
    if (withdrawing) return;
    resetWithdrawForm();
    setShowWithdrawModal(false);
  };

  const resetKolApplyForm = () => {
    setSocialLink('');
    setFollowers('');
    setPromotionPlan('');
    setContactInfo('');
  };

  const handleOpenKolApply = () => {
    resetKolApplyForm();
    setShowKolApplyModal(true);
  };

  const handleCloseKolApply = () => {
    if (kolApplyLoading) return;
    resetKolApplyForm();
    setShowKolApplyModal(false);
  };

  const quota = usage?.quota ?? user?.quota ?? 0;
  const usedQuota = usage?.used_quota ?? user?.used_quota ?? 0;
  const packageUsedQuota = usage?.package_used_quota ?? user?.package_used_quota ?? 0;
  const requestCount = usage?.request_count ?? user?.request_count ?? 0;
  const balanceDollars = (quota / Q) * rate;
  const availableAffAmount = ((user?.aff_quota || 0) / Q) * rate;
  const activeLogs = useMemo(
    () => filterLogsByBounds(analytics.logs, analyticsBounds),
    [analytics.logs, analyticsBounds],
  );
  const activeErrors = useMemo(
    () => filterLogsByBounds(analytics.errors, analyticsBounds),
    [analytics.errors, analyticsBounds],
  );
  const analyticsStat = useMemo(
    () => summarizeLogs(activeLogs, analyticsBounds.start, analyticsBounds.end),
    [activeLogs, analyticsBounds.end, analyticsBounds.start],
  );
  const modelBreakdown = useMemo(() => groupLogs(activeLogs, 'model_name'), [activeLogs]);
  const keyBreakdown = useMemo(() => groupLogs(activeLogs, 'token_name'), [activeLogs]);
  const costSeries = useMemo(
    () => buildCostSeries(activeLogs, analyticsBounds.start, analyticsBounds.end, locale),
    [activeLogs, analyticsBounds.end, analyticsBounds.start, locale],
  );
  const defaultCommissionRate = Number(user?.default_commission_rate ?? 0.05);
  const currentCommissionRate = Number(
    user?.commission_rate ?? defaultCommissionRate,
  );
  const hasCustomCommissionRate =
    currentCommissionRate > defaultCommissionRate + 1e-8;

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
    } catch (err) {
      /* interceptor */
    }
    setWithdrawing(false);
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
    } catch (err) {
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
              {t('topup.kolApplyDesc', {
                rate: (defaultCommissionRate * 100).toFixed(1),
              })}
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenKolApply}
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
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-bold text-page mb-1">
          {t('dashboard.welcome')} {user?.display_name || user?.username || 'User'}
        </h1>
        <p className="text-sm text-page-secondary">{t('dashboard.manageDesc')}</p>
      </div>

      <section className="mb-10">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-heading font-semibold text-page">{t('dashboard.analyticsTitle')}</h2>
            <p className="mt-1 text-sm text-page-secondary">{t('dashboard.analyticsSubtitle')}</p>
          </div>
          <div
            className="relative grid w-full overflow-hidden rounded-xl border border-page-divider bg-page-surface p-1 md:w-auto"
            style={{ gridTemplateColumns: `repeat(${DASHBOARD_RANGES.length}, minmax(0, 1fr))` }}
          >
            <span
              className="pointer-events-none absolute bottom-1 top-1 rounded-lg bg-page-link transition-transform duration-500 ease-out"
              style={{
                left: '0.25rem',
                width: `calc((100% - 0.5rem) / ${DASHBOARD_RANGES.length})`,
                transform: `translateX(${analyticsRangeIndex * 100}%)`,
              }}
            />
            {DASHBOARD_RANGES.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => handleAnalyticsRangeClick(item.key)}
                className={`relative z-10 rounded-lg px-3 py-2 text-xs font-semibold transition-colors duration-300 md:min-w-[72px] ${
                  analyticsRange === item.key
                    ? 'text-white'
                    : 'text-page-secondary hover:text-page'
                }`}
              >
                {t(item.labelKey)}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            label={t('dashboard.rangeCost')}
            value={(analyticsStat.quota / Q) * rate}
            prefix={symbol}
            decimals={Math.max(decimals, 4)}
            loading={analytics.logsLoading}
            animationKey={chartAnimationKey}
          />
          <MetricCard
            label={t('dashboard.rangeRequests')}
            value={activeLogs.length}
            loading={analytics.logsLoading}
            animationKey={chartAnimationKey}
          />
          <MetricCard
            label={t('logs.totalTokens')}
            value={analyticsStat.token}
            loading={analytics.logsLoading}
            animationKey={chartAnimationKey}
          />
          <MetricCard
            label={t('dashboard.avgRpm')}
            value={analyticsStat.rpm}
            decimals={3}
            loading={analytics.logsLoading}
            animationKey={chartAnimationKey}
          />
          <MetricCard
            label={t('dashboard.avgTpm')}
            value={analyticsStat.tpm}
            loading={analytics.logsLoading}
            animationKey={chartAnimationKey}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <TrendBars
            title={t('dashboard.costTrend')}
            items={costSeries}
            symbol={symbol}
            rate={rate}
            decimals={decimals}
            loading={analytics.logsLoading}
            animationKey={chartAnimationKey}
          />
          <div className="grid grid-cols-1 gap-6">
            <BreakdownList
              title={t('dashboard.modelBreakdown')}
              items={modelBreakdown}
              symbol={symbol}
              rate={rate}
              decimals={decimals}
              requestLabel={t('dashboard.requestsUnit')}
              tokenLabel={t('dashboard.tokensUnit')}
              loading={analytics.logsLoading}
              animationKey={`${chartAnimationKey}-model`}
            />
            <BreakdownList
              title={t('dashboard.keyBreakdown')}
              items={keyBreakdown}
              symbol={symbol}
              rate={rate}
              decimals={decimals}
              requestLabel={t('dashboard.requestsUnit')}
              tokenLabel={t('dashboard.tokensUnit')}
              loading={analytics.logsLoading}
              animationKey={`${chartAnimationKey}-key`}
            />
          </div>
        </div>

        <RecentErrors
          title={t('dashboard.recentErrors')}
          emptyText={t('dashboard.noRecentErrors')}
          items={activeErrors}
          loading={analytics.errorsLoading}
        />
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        <div className="glass rounded-2xl p-6">
          <p className="text-sm text-page-secondary mb-2">{t('dashboard.balance')}</p>
          <div className="text-3xl font-bold text-page">
            {symbol}
            <CountUp from={0} to={balanceDollars} duration={1.5} decimals={decimals} />
          </div>
          <p className="text-xs text-page-muted mt-1">{t('dashboard.quotaUnits', { count: quota.toLocaleString() })}</p>
        </div>

        <div className="glass rounded-2xl p-6">
          <p className="text-sm text-page-secondary mb-2">{t('dashboard.used')}</p>
          <div className="text-3xl font-bold text-page">
            {symbol}
            <CountUp from={0} to={(usedQuota / Q) * rate} duration={1.5} decimals={decimals} />
          </div>
          <p className="text-xs text-page-muted mt-1">{t('dashboard.quotaUnits', { count: usedQuota.toLocaleString() })}</p>
        </div>

        <div className="glass rounded-2xl p-6">
          <p className="text-sm text-page-secondary mb-2">{t('dashboard.packageUsed')}</p>
          <div className="text-3xl font-bold text-page">
            {symbol}
            <CountUp from={0} to={(packageUsedQuota / Q) * rate} duration={1.5} decimals={decimals} />
          </div>
          <p className="text-xs text-page-muted mt-1">{t('dashboard.quotaUnits', { count: packageUsedQuota.toLocaleString() })}</p>
        </div>

        <div className="glass rounded-2xl p-6">
          <p className="text-sm text-page-secondary mb-2">{t('dashboard.totalRequests')}</p>
          <div className="text-3xl font-bold text-page">
            <CountUp from={0} to={requestCount} duration={1.5} />
          </div>
        </div>
      </div>

      {affLink && (
        <div className="glass rounded-2xl p-6 mt-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-page mb-1">{t('topup.inviteTitle')}</h2>
              <p className="text-sm text-page-secondary">{t('topup.inviteSubtitle')}</p>
            </div>
            <div className="inline-flex items-center gap-2 self-start rounded-full border border-page-link/20 bg-page-link/10 px-3 py-1 text-xs font-medium text-page">
              <span className="text-page-secondary">{t('topup.currentCommissionRateLabel')}</span>
              <span className="text-page-link">{(currentCommissionRate * 100).toFixed(1)}%</span>
            </div>
          </div>

          <p className="mb-5 text-xs text-page-muted">
            {t('topup.currentCommissionRateDesc', {
              rate: (defaultCommissionRate * 100).toFixed(1),
            })}
          </p>

          <div className="mb-5">
            {renderCommissionApplicationPanel()}
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="glass-sm rounded-xl p-4 text-center">
              <p className="text-xs text-page-secondary mb-1">{t('topup.affAvailable')}</p>
              <p className="text-xl font-bold text-page">
                {symbol}{(((user?.aff_quota || 0) / Q) * rate).toFixed(decimals)}
              </p>
            </div>
            <div className="glass-sm rounded-xl p-4 text-center">
              <p className="text-xs text-page-secondary mb-1">{t('topup.affTotal')}</p>
              <p className="text-xl font-bold text-page">
                {symbol}{(((user?.aff_history_quota || 0) / Q) * rate).toFixed(decimals)}
              </p>
            </div>
            <div className="glass-sm rounded-xl p-4 text-center">
              <p className="text-xs text-page-secondary mb-1">{t('topup.affCount')}</p>
              <p className="text-xl font-bold text-page">{user?.aff_count || 0}</p>
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-page-label mb-2">{t('topup.inviteLink')}</label>
            <div className="flex gap-2">
              <input type="text" readOnly value={affLink} className="input flex-1 text-sm" />
              <button onClick={handleCopyAffLink} className="btn-primary whitespace-nowrap text-sm px-4">
                {t('topup.copy')}
              </button>
            </div>
          </div>

          {(user?.aff_quota || 0) > 0 && (
            <div className="mb-5">
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="block text-sm font-medium text-page-label">{t('topup.transferToBalance')}</label>
                <button type="button" onClick={handleOpenWithdraw} className="btn-secondary whitespace-nowrap px-4 py-2 text-sm">
                  {t('topup.withdraw')}
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder={t('topup.transferPlaceholder')}
                  className="input flex-1 text-sm"
                  min="0"
                  step="0.01"
                />
                <button onClick={handleTransfer} disabled={transferring} className="btn-primary whitespace-nowrap text-sm px-4">
                  {transferring ? t('topup.processing') : t('topup.transfer')}
                </button>
              </div>
            </div>
          )}

          <div>
            <button
              onClick={() => {
                setShowAffEarnings(!showAffEarnings);
                if (!showAffEarnings) loadAffEarnings();
              }}
              className="text-sm text-page-secondary hover:text-page transition-colors"
            >
              {showAffEarnings ? t('topup.hideEarnings') : t('topup.viewEarnings')}
            </button>
            {showAffEarnings && (
              <div className="mt-3">
                {affEarningsLoading ? (
                  <div className="flex justify-center py-6">
                    <div className="w-6 h-6 border-2 border-page-link/30 border-t-page-link rounded-full animate-spin" />
                  </div>
                ) : affEarnings.length === 0 ? (
                  <p className="text-sm text-page-muted text-center py-6">{t('topup.noEarnings')}</p>
                ) : (
                  <div className="space-y-2">
                    {affEarnings.map((item, i) => (
                      <div key={i} className="flex items-center justify-between glass-sm rounded-xl px-4 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm text-page">{getAffEarningUsername(item)}</p>
                          <p className="truncate text-xs text-page-muted">
                            {item.model_name || '-'} · {new Date(item.created_time * 1000).toLocaleString()} · {(item.commission_rate * 100).toFixed(1)}%
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-medium text-page-success">
                          +{symbol}{((item.commission_quota / Q) * rate).toFixed(Math.max(decimals, 2))}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {showWithdrawModal && (
        <div
          className="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={handleCloseWithdraw}
        >
          <div className="glass w-full max-w-md rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-page mb-1">{t('topup.withdrawTitle')}</h3>
              <p className="text-sm text-page-secondary">{t('topup.withdrawSubtitle')}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-page-label">{t('topup.withdrawAvailable')}</label>
                <input
                  type="text"
                  readOnly
                  value={`${symbol}${availableAffAmount.toFixed(decimals)}`}
                  className="input bg-page-surface-hover/60 text-page-secondary"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-page-label">{t('topup.withdrawAmount')}</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-page-muted">
                      {symbol}
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
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
                <input
                  type="text"
                  value={withdrawMethod}
                  onChange={(e) => setWithdrawMethod(e.target.value)}
                  placeholder={t('topup.withdrawMethodPlaceholder')}
                  className="input"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-page-label">{t('topup.withdrawRemark')}</label>
                <textarea
                  value={withdrawRemark}
                  onChange={(e) => setWithdrawRemark(e.target.value)}
                  placeholder={t('topup.withdrawRemarkPlaceholder')}
                  className="input min-h-[96px] resize-y"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={handleCloseWithdraw} disabled={withdrawing} className="btn-secondary px-4 py-2">
                {t('tokens.cancel')}
              </button>
              <button type="button" onClick={handleWithdraw} disabled={withdrawing} className="btn-primary px-4 py-2">
                {withdrawing ? t('topup.processing') : t('topup.submitWithdraw')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showKolApplyModal && (
        <div
          className="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={handleCloseKolApply}
        >
          <div className="glass w-full max-w-md rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-page mb-1">{t('topup.kolApplyModalTitle')}</h3>
              <p className="text-sm text-page-secondary">{t('topup.kolApplyModalDesc')}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-page-label">{t('topup.kolSocialLabel')}</label>
                <input
                  type="text"
                  value={socialLink}
                  onChange={(e) => setSocialLink(e.target.value)}
                  placeholder={t('topup.kolSocialPlaceholder')}
                  className="input"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-page-label">{t('topup.kolFollowersLabel')}</label>
                <input
                  type="text"
                  value={followers}
                  onChange={(e) => setFollowers(e.target.value)}
                  placeholder={t('topup.kolFollowersPlaceholder')}
                  className="input"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-page-label">{t('topup.kolPlanLabel')}</label>
                <textarea
                  value={promotionPlan}
                  onChange={(e) => setPromotionPlan(e.target.value)}
                  placeholder={t('topup.kolPlanPlaceholder')}
                  className="input min-h-[96px] resize-y"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-page-label">{t('topup.kolContactLabel')}</label>
                <input
                  type="text"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  placeholder={t('topup.kolContactPlaceholder')}
                  className="input"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={handleCloseKolApply} disabled={kolApplyLoading} className="btn-secondary px-4 py-2">
                {t('tokens.cancel')}
              </button>
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

function MetricCard({ label, value, loading, prefix = '', decimals = 0, animationKey }) {
  return (
    <div className="glass rounded-2xl p-5">
      <p className="text-sm text-page-secondary">{label}</p>
      {loading ? (
        <div className="mt-3 h-8 w-28 animate-pulse rounded-lg bg-page-surface" />
      ) : (
        <p className="mt-2 text-2xl font-bold text-page">
          {prefix}
          <CountUp
            key={animationKey}
            from={0}
            to={Number(value || 0)}
            duration={0.9}
            separator=","
            decimals={decimals}
          />
        </p>
      )}
    </div>
  );
}

function TrendBars({ title, items, symbol, rate, decimals, loading, animationKey }) {
  const maxQuota = Math.max(1, ...items.map((item) => item.quota));

  return (
    <div className="glass rounded-2xl p-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-page">{title}</h3>
      </div>
      {loading ? (
        <div className="h-72 animate-pulse rounded-xl bg-page-surface" />
      ) : (
        <div className="h-72">
          <div className="flex h-56 items-end gap-2 border-b border-page-divider">
            {items.map((item, index) => (
              <div key={`${item.label}-${index}`} className="flex h-full min-w-0 flex-1 flex-col justify-end">
                <AnimatedBarFill
                  key={`${animationKey}-${item.label}-${index}`}
                  targetHeight={`${Math.max(2, (item.quota / maxQuota) * 100)}%`}
                  title={`${item.label}: ${toDisplayMoney(item.quota, symbol, rate, decimals)} / ${formatNumber(item.requests)}`}
                />
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2 text-xs text-page-muted">
            {items.filter((_, index) => index % 3 === 0).map((item, index) => (
              <span key={`${item.label}-${index}`} className="truncate">{item.label}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BreakdownList({ title, items, symbol, rate, decimals, requestLabel, tokenLabel, loading, animationKey }) {
  const maxQuota = Math.max(1, ...items.map((item) => item.quota));

  return (
    <div className="glass rounded-2xl p-6">
      <h3 className="mb-4 text-lg font-semibold text-page">{title}</h3>
      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((item) => <div key={item} className="h-12 animate-pulse rounded-xl bg-page-surface" />)}
        </div>
      ) : items.length === 0 ? (
        <p className="py-6 text-center text-sm text-page-muted">-</p>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.name}>
              <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate font-medium text-page">{item.name}</span>
                <span className="shrink-0 font-mono text-xs text-page-secondary">
                  {toDisplayMoney(item.quota, symbol, rate, decimals)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-page-inset">
                <AnimatedProgressFill
                  key={`${animationKey}-${item.name}`}
                  targetWidth={`${Math.max(3, (item.quota / maxQuota) * 100)}%`}
                />
              </div>
              <div className="mt-1 text-xs text-page-muted">
                {formatNumber(item.requests)} {requestLabel} / {formatNumber(item.tokens)} {tokenLabel}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AnimatedBarFill({ targetHeight, title }) {
  const [height, setHeight] = useState('0%');

  useEffect(() => {
    let secondFrame;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => setHeight(targetHeight));
    });
    return () => {
      cancelAnimationFrame(firstFrame);
      if (secondFrame) cancelAnimationFrame(secondFrame);
    };
  }, [targetHeight]);

  return (
    <div
      className="rounded-t-md bg-page-link/80 transition-[height,background-color] duration-700 ease-out hover:bg-page-link"
      title={title}
      style={{ height }}
    />
  );
}

function AnimatedProgressFill({ targetWidth }) {
  const [width, setWidth] = useState('0%');

  useEffect(() => {
    let secondFrame;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => setWidth(targetWidth));
    });
    return () => {
      cancelAnimationFrame(firstFrame);
      if (secondFrame) cancelAnimationFrame(secondFrame);
    };
  }, [targetWidth]);

  return (
    <div
      className="h-full rounded-full bg-page-link transition-[width] duration-700 ease-out"
      style={{ width }}
    />
  );
}

function RecentErrors({ title, emptyText, items, loading }) {
  return (
    <div className="glass mt-6 rounded-2xl p-6">
      <h3 className="mb-4 text-lg font-semibold text-page">{title}</h3>
      {loading ? (
        <div className="h-20 animate-pulse rounded-xl bg-page-surface" />
      ) : items.length === 0 ? (
        <p className="text-sm text-page-muted">{emptyText}</p>
      ) : (
        <div className="divide-y divide-page">
          {items.map((item) => (
            <div key={item.id || item.request_id || item.created_at} className="grid gap-2 py-3 text-sm md:grid-cols-[160px_1fr_160px]">
              <span className="text-page-secondary">{item.created_at ? new Date(item.created_at * 1000).toLocaleString() : '-'}</span>
              <span className="min-w-0 truncate text-page">{item.content || item.model_name || '-'}</span>
              <span className="min-w-0 truncate font-mono text-xs text-page-muted">{item.request_id || item.token_name || '-'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
