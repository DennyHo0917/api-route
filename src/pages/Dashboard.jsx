import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  getUserUsage,
  getUserLogs,
  Q,
} from '../api';
import { useCurrency } from '../context/SiteContext';
import CountUp from '../components/bits/CountUp';

const DASHBOARD_RANGES = [
  { key: '24h', labelKey: 'dashboard.range24h' },
  { key: 'today', labelKey: 'dashboard.rangeToday' },
  { key: '7d', labelKey: 'dashboard.range7d' },
  { key: '14d', labelKey: 'dashboard.range14d' },
  { key: '30d', labelKey: 'dashboard.range30d' },
];
const DASHBOARD_FETCH_RANGE = '30d';
const DASHBOARD_LOG_PAGE_SIZE = 100;
const DASHBOARD_LOG_PAGE_CONCURRENCY = 5;

// ponytail: page-session cache; refresh the browser page to pull fresh dashboard logs.
let dashboardLogsCache = null;

const fetchDashboardLogs = async (baseParams) => {
  const params = {
    ...baseParams,
    type: '2',
    page_size: DASHBOARD_LOG_PAGE_SIZE,
  };
  const first = await getUserLogs({ ...params, p: 1 });
  if (!first.data.success) throw new Error(first.data.message || 'Failed to load dashboard logs');

  const firstData = first.data.data || {};
  const totalPages = Math.ceil(Number(firstData.total || 0) / DASHBOARD_LOG_PAGE_SIZE);
  const logs = [...(firstData.items || [])];

  for (let page = 2; page <= totalPages; page += DASHBOARD_LOG_PAGE_CONCURRENCY) {
    const responses = await Promise.all(
      Array.from({ length: Math.min(DASHBOARD_LOG_PAGE_CONCURRENCY, totalPages - page + 1) }, (_, index) => (
        getUserLogs({ ...params, p: page + index })
      )),
    );
    responses.forEach((res) => {
      if (!res.data.success) throw new Error(res.data.message || 'Failed to load dashboard logs');
      logs.push(...(res.data.data?.items || []));
    });
  }

  return logs;
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
  const { user } = useAuth();
  const { symbol, rate, decimals } = useCurrency();
  const [usage, setUsage] = useState(null);
  const [analyticsRange, setAnalyticsRange] = useState('24h');
  const [analyticsAnimationKey, setAnalyticsAnimationKey] = useState(0);
  const [analytics, setAnalytics] = useState({
    logsLoading: true,
    logs: [],
  });

  const loadData = useCallback(async () => {
    try {
      const usageRes = await getUserUsage();
      if (usageRes.data.success) setUsage(usageRes.data.data);
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
      logs: dashboardLogsCache || current.logs,
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

  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const handleAnalyticsRangeClick = (range) => {
    setAnalyticsRange(range);
    setAnalyticsAnimationKey((current) => current + 1);
  };

  const quota = usage?.quota ?? user?.quota ?? 0;
  const usedQuota = usage?.used_quota ?? user?.used_quota ?? 0;
  const packageUsedQuota = usage?.package_used_quota ?? user?.package_used_quota ?? 0;
  const requestCount = usage?.request_count ?? user?.request_count ?? 0;
  const balanceDollars = (quota / Q) * rate;
  const activeLogs = useMemo(
    () => filterLogsByBounds(analytics.logs, analyticsBounds),
    [analytics.logs, analyticsBounds],
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

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
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
            loadingLabel={t('dashboard.loadingLargeDataset')}
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

function TrendBars({ title, items, symbol, rate, decimals, loading, loadingLabel, animationKey }) {
  const maxQuota = Math.max(1, ...items.map((item) => item.quota));

  return (
    <div className="glass rounded-2xl p-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-page">{title}</h3>
      </div>
      {loading ? (
        <div className="flex h-72 items-center justify-center rounded-xl bg-page-surface">
          <span
            role="status"
            aria-live="polite"
            className="dashboard-loading-text text-base font-semibold"
          >
            {loadingLabel}
          </span>
        </div>
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
