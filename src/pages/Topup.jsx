import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useSite } from '../context/SiteContext';
import {
  TicketCheck,
  TicketPercent,
  WalletCards,
} from 'lucide-react';
import {
  getUserUsage, redeemCode, getTopupInfo,
  createEpayOrder, createStripeOrder, createCreemOrder,
  createCryptoOrder, getCryptoOrderStatus, getTopupHistory,
  Q,
} from '../api';
import { useCurrency } from '../context/SiteContext';
import { trackEvent } from '../utils/analytics';
import CountUp from '../components/bits/CountUp';
import toast from 'react-hot-toast';

function formatPaymentMethodName(value) {
  return String(value || '').trim().replace(/支付宝|alipay/gi, 'alipay');
}

function normalizeCreemProducts(value) {
  if (!value) return [];
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return Array.isArray(parsed)
      ? parsed.filter((product) => product?.productId && Number(product?.quota) > 0)
      : [];
  } catch {
    return [];
  }
}

function getCreemMinTopup(products) {
  const quotas = products
    .map((product) => Number(product?.quota))
    .filter((quota) => Number.isFinite(quota) && quota > 0);
  return quotas.length > 0 ? Math.min(...quotas) : 1;
}

function findCompatibleCreemProduct(products, amount) {
  const payAmount = Number(amount);
  if (!Number.isFinite(payAmount) || payAmount <= 0) return null;
  return products.find((product) => {
    const quota = Number(product?.quota);
    return quota > 0 && payAmount % quota === 0;
  }) || null;
}

const paymentWindowPlaceholderHtml =
  '<!doctype html><title>Opening payment...</title><body style="font-family: system-ui, sans-serif; padding: 24px;">Opening payment...</body>';
const QUIET_REQUEST_CONFIG = {
  skipErrorHandler: true,
  ...(import.meta.env.DEV ? { timeout: 8000 } : {}),
};
const DEFAULT_TOPUP_AMOUNTS = [1, 2, 5, 10, 20, 50, 100, 200];
const PENDING_TOPUP_ANALYTICS_KEY = 'ga_pending_topup';

function shouldUseSameTabPaymentRedirect() {
  if (typeof window === 'undefined') return false;
  const userAgent = navigator.userAgent || '';
  return (
    /Android|iPhone|iPad|iPod|Mobile|MicroMessenger|FBAN|FBAV|Instagram/i.test(userAgent) ||
    (navigator.maxTouchPoints > 1 && window.matchMedia?.('(max-width: 768px)').matches)
  );
}

function openPendingPaymentWindow() {
  if (shouldUseSameTabPaymentRedirect()) return null;
  try {
    const paymentWindow = window.open('', '_blank');
    if (paymentWindow) {
      paymentWindow.document.write(paymentWindowPlaceholderHtml);
      paymentWindow.document.close();
    }
    return paymentWindow;
  } catch {
    return null;
  }
}

function redirectPaymentWindow(paymentWindow, url) {
  if (!url) return false;
  if (paymentWindow && !paymentWindow.closed) {
    paymentWindow.location.href = url;
    paymentWindow.focus?.();
    return true;
  }
  window.location.assign(url);
  return true;
}

function closePendingPaymentWindow(paymentWindow) {
  if (paymentWindow && !paymentWindow.closed) {
    paymentWindow.close();
  }
}

function getTopupAnalyticsItem(value) {
  return {
    item_id: 'balance_topup',
    item_name: 'Balance top-up',
    item_category: 'balance_topup',
    price: value,
    quantity: 1,
  };
}

function getTopupHistoryTransactionId(item) {
  return String(
    item?.trade_no ||
    item?.out_trade_no ||
    item?.order_id ||
    item?.id ||
    `${item?.payment_method || 'topup'}_${item?.create_time || 'unknown'}_${item?.amount || 0}`
  );
}

function trackTopupPurchaseOnce(item, currency, exchangeRate, precision) {
  if (!item || item.status !== 'success' || !item.payment_method) return false;
  const transactionId = getTopupHistoryTransactionId(item);
  const storageKey = `ga_purchase_topup_${transactionId}`;
  try {
    if (localStorage.getItem(storageKey)) return true;
  } catch {
    // Ignore storage failures; the event can still be sent.
  }

  const value = Number((Number(item.amount || 0) * exchangeRate).toFixed(precision));
  if (!Number.isFinite(value) || value <= 0) return false;

  const sent = trackEvent('purchase', {
    transaction_id: transactionId,
    affiliation: 'API-Route balance top-up',
    currency,
    value,
    payment_method: item.payment_method,
    items: [getTopupAnalyticsItem(value)],
  });

  if (sent) {
    try {
      localStorage.setItem(storageKey, '1');
    } catch {
      // Best-effort de-dupe only.
    }
  }
  return sent;
}

export default function Topup() {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();
  const { site } = useSite();
  const { symbol, rate, code, decimals } = useCurrency();

  const [usage, setUsage] = useState(null);
  const [topupInfo, setTopupInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  // Redeem code
  const [redeemInput, setRedeemInput] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);

  // Online topup
  const [amount, setAmount] = useState('');
  const [displayAmount, setDisplayAmount] = useState('');
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [payingMethod, setPayingMethod] = useState('');
  const initializedAmount = useRef(false);
  const returnPurchaseCheckStarted = useRef(false);

  // Crypto modal
  const [cryptoOrder, setCryptoOrder] = useState(null);
  const [cryptoPolling, setCryptoPolling] = useState(false);
  const [selectedChain, setSelectedChain] = useState('');
  const [selectedToken, setSelectedToken] = useState('usdt');

  // History
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const presetAmounts = DEFAULT_TOPUP_AMOUNTS;
  const minTopup = topupInfo?.min_topup || 1;
  const payMethods = topupInfo?.pay_methods || [];
  const enableOnline = topupInfo?.enable_online_topup;
  const enableStripe = topupInfo?.enable_stripe_topup;
  const enableCreem = topupInfo?.enable_creem_topup;
  const enableCrypto = topupInfo?.enable_crypto_topup;
  const loadData = useCallback(async () => {
    let historyItems = [];
    if (site?.enable_topup) setHistoryLoading(true);
    try {
      const [usageRes, topupRes, historyRes] = await Promise.all([
        getUserUsage(QUIET_REQUEST_CONFIG).catch(() => null),
        site?.enable_topup ? getTopupInfo(QUIET_REQUEST_CONFIG).catch(() => null) : Promise.resolve(null),
        site?.enable_topup
          ? getTopupHistory({ page: 1, page_size: 20 }).catch(() => null)
          : Promise.resolve(null),
      ]);
      if (usageRes?.data?.success) setUsage(usageRes.data.data);
      if (topupRes?.data?.data) setTopupInfo(topupRes.data.data);
      historyItems = historyRes?.data?.data?.items || [];
      if (historyRes?.data?.data?.items) setHistory(historyItems);
    } catch (e) { /* interceptor */ }
    setHistoryLoading(false);
    setLoading(false);
    return historyItems;
  }, [site?.enable_topup]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!site?.enable_topup || returnPurchaseCheckStarted.current) return;
    if (new URLSearchParams(window.location.search).get('payment') !== 'return') return;

    returnPurchaseCheckStarted.current = true;
    let cancelled = false;
    let timeoutId;
    let attempts = 0;

    const checkLatestTopup = async () => {
      attempts += 1;
      const items = await loadData();
      let pendingTopup = null;
      try {
        pendingTopup = JSON.parse(localStorage.getItem(PENDING_TOPUP_ANALYTICS_KEY) || 'null');
      } catch {
        pendingTopup = null;
      }
      const latestSuccess = items
        .filter((item) => item?.status === 'success' && item?.payment_method)
        .filter((item) => !pendingTopup || (
          Number(item.amount) === Number(pendingTopup.amount) &&
          Number(item.create_time || 0) >= Number(pendingTopup.started_at || 0)
        ))
        .sort((a, b) => Number(b.create_time || 0) - Number(a.create_time || 0))[0];

      if (!cancelled && trackTopupPurchaseOnce(latestSuccess, code || 'CNY', rate, decimals)) {
        try {
          localStorage.removeItem(PENDING_TOPUP_ANALYTICS_KEY);
        } catch {
          // Best-effort cleanup only.
        }
        return;
      }
      if (!cancelled && attempts < 5) {
        timeoutId = window.setTimeout(checkLatestTopup, 3000);
      }
    };

    checkLatestTopup();
    return () => {
      cancelled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [code, decimals, loadData, rate, site?.enable_topup]);

  const quota = usage?.quota ?? user?.quota ?? 0;
  const usedQuota = usage?.used_quota ?? user?.used_quota ?? 0;
  const packageUsedQuota = usage?.package_used_quota ?? user?.package_used_quota ?? 0;
  const requestCount = usage?.request_count ?? user?.request_count ?? 0;
  const balanceDollars = quota / Q * rate;

  const formatCurrencyAmount = useCallback((value) => {
    if (value === '' || value == null || Number.isNaN(Number(value))) return '';
    return Number(value).toFixed(decimals).replace(/\.?0+$/, '');
  }, [decimals]);

  const toDisplayAmount = useCallback((quotaAmount) => {
    if (quotaAmount === '' || quotaAmount == null) return '';
    return formatCurrencyAmount(Number(quotaAmount) * rate);
  }, [formatCurrencyAmount, rate]);

  const toQuotaAmount = useCallback((currencyAmount) => {
    const numeric = Number.parseFloat(currencyAmount);
    if (!Number.isFinite(numeric) || numeric <= 0) return '';
    return Math.max(minTopup, Math.round(numeric / rate));
  }, [minTopup, rate]);

  useEffect(() => {
    if (initializedAmount.current || !topupInfo || presetAmounts.length === 0) return;
    initializedAmount.current = true;
    const defaultAmount = 10;
    setSelectedPreset(defaultAmount);
    setAmount(String(defaultAmount));
    setDisplayAmount(toDisplayAmount(defaultAmount));
  }, [topupInfo, presetAmounts, toDisplayAmount]);

  const handleRedeem = async (e) => {
    e.preventDefault();
    if (!redeemInput.trim()) return;

    setRedeeming(true);
    try {
      const res = await redeemCode(redeemInput.trim());
      if (res.data.success) {
        setRedeemInput('');
        setShowRedeemModal(false);
        await Promise.all([
          loadData(),
          refreshUser({ skipErrorHandler: true }),
        ]);
        toast.success(t('topup.balanceRedeemed'));
      }
    } catch (err) { /* interceptor */ }
    setRedeeming(false);
  };

  // Select preset
  const handlePreset = (val) => {
    setSelectedPreset(val);
    setAmount(String(val));
    setDisplayAmount(toDisplayAmount(val));
  };

  // Determine if a payment method is Stripe-based
  const isStripePayment = (method) =>
    ['stripe', 'alipay', 'wxpay'].includes(method) && !method.startsWith('epay_');

  const isCreemPayment = (method) => method === 'creem';

  const getMethodMinTopup = (method) => {
    const payMethod = (payMethods || []).find((item) => item.type === method);
    const methodMinTopup = Number(payMethod?.min_topup);
    if (Number.isFinite(methodMinTopup) && methodMinTopup > 0) return methodMinTopup;
    if (isCreemPayment(method)) {
      const configuredMin = Number(topupInfo?.creem_min_topup);
      return Number.isFinite(configuredMin) && configuredMin > 0
        ? configuredMin
        : getCreemMinTopup(normalizeCreemProducts(topupInfo?.creem_products));
    }
    if (isStripePayment(method)) {
      const stripeMin = Number(topupInfo?.stripe_min_topup);
      if (Number.isFinite(stripeMin) && stripeMin > 0) return stripeMin;
    }
    return minTopup;
  };

  const getMethodDisplayName = (method) => {
    const payMethod = (payMethods || []).find((item) => item.type === method);
    return formatPaymentMethodName(payMethod?.name || (method === 'creem' ? 'Creem' : 'Stripe'));
  };

  const showGatewayMinTopupError = (method, minAmount) => {
    toast.error(t('topup.gatewayMinimumAmount', {
      channel: getMethodDisplayName(method),
      amount: `${symbol}${formatCurrencyAmount(minAmount * rate)}`,
    }));
  };

  // Pay handler for EPay, Stripe and Creem methods
  const handlePay = async (method) => {
    const payAmount = parseInt(amount);
    if (!payAmount || payAmount <= 0) {
      toast.error(t('topup.enterAmount'));
      return;
    }
    const isGatewayPayment = isStripePayment(method) || isCreemPayment(method);
    if (isGatewayPayment && payAmount < getMethodMinTopup(method)) {
      showGatewayMinTopupError(method, getMethodMinTopup(method));
      return;
    }
    if (!isGatewayPayment && payAmount < minTopup) {
      toast.error(t('topup.minimumAmount', { min: `${symbol}${formatCurrencyAmount(minTopup * rate)}` }));
      return;
    }
    const creemProduct = isCreemPayment(method)
      ? findCompatibleCreemProduct(creemProducts, payAmount)
      : null;
    if (isCreemPayment(method) && !creemProduct) {
      toast.error(t('topup.creemUnsupportedAmount') || 'Current amount is not supported by Creem');
      return;
    }
    const paymentWindow = isCreemPayment(method) ? openPendingPaymentWindow() : null;
    setPaymentLoading(true);
    setPayingMethod(method);
    try {
      const returnUrl = window.location.origin + '/topup?payment=return';
      const data = { amount: payAmount, payment_method: method, return_url: returnUrl };
      const analyticsValue = Number((payAmount * rate).toFixed(decimals));
      trackEvent('begin_checkout', {
        currency: code || 'CNY',
        value: analyticsValue,
        payment_method: method,
        items: [getTopupAnalyticsItem(analyticsValue)],
      });
      try {
        localStorage.setItem(PENDING_TOPUP_ANALYTICS_KEY, JSON.stringify({
          amount: payAmount,
          started_at: Math.floor(Date.now() / 1000) - 60,
        }));
      } catch {
        // Purchase tracking can still fall back to latest successful top-up.
      }

      if (isCreemPayment(method)) {
        const res = await createCreemOrder({
          product_id: creemProduct.productId,
          payment_method: 'creem',
          amount: payAmount,
          return_url: returnUrl,
        });
        if (res.data.message === 'success' && res.data.data?.checkout_url) {
          redirectPaymentWindow(paymentWindow, res.data.data.checkout_url);
        } else if (res.data.message === 'success') {
          closePendingPaymentWindow(paymentWindow);
          toast.error(t('common.requestFailed'));
        } else if (res.data.message !== 'success') {
          closePendingPaymentWindow(paymentWindow);
          const errMsg = typeof res.data.data === 'string' ? res.data.data : res.data.message;
          toast.error(errMsg || t('common.requestFailed'));
        }
      } else if (isStripePayment(method)) {
        // Stripe payment
        const res = await createStripeOrder(data);
        if (res.data.message === 'success' && res.data.data?.pay_link) {
          window.open(res.data.data.pay_link, '_blank');
        } else if (res.data.message !== 'success') {
          const errMsg = typeof res.data.data === 'string' ? res.data.data : res.data.message;
          toast.error(errMsg || t('common.requestFailed'));
        }
      } else {
        // EPay payment - submit via hidden form (same as main site)
        const res = await createEpayOrder(data);
        if (res.data.message === 'success') {
          const params = res.data.data; // EPay form params
          const url = res.data.url;     // EPay gateway URL
          if (url && params) {
            const form = document.createElement('form');
            form.action = url;
            form.method = 'POST';
            // Open in new tab (except Safari)
            const isSafari = navigator.userAgent.indexOf('Safari') > -1
              && navigator.userAgent.indexOf('Chrome') < 1;
            if (!isSafari) {
              form.target = '_blank';
            }
            for (const key in params) {
              const input = document.createElement('input');
              input.type = 'hidden';
              input.name = key;
              input.value = params[key];
              form.appendChild(input);
            }
            document.body.appendChild(form);
            form.submit();
            document.body.removeChild(form);
          }
        } else {
          const errMsg = typeof res.data.data === 'string' ? res.data.data : res.data.message;
          toast.error(errMsg || t('common.requestFailed'));
        }
      }
    } catch (e) {
      closePendingPaymentWindow(paymentWindow);
      /* interceptor */
    }
    setPaymentLoading(false);
    setPayingMethod('');
  };

  // Crypto pay - needs chain + token
  const handleCryptoPay = async () => {
    const payAmountVal = parseInt(amount);
    if (!payAmountVal || payAmountVal <= 0) {
      toast.error(t('topup.enterAmount'));
      return;
    }
    if (!selectedChain) {
      toast.error(t('topup.selectChain'));
      return;
    }
    if (!selectedToken) {
      toast.error(t('topup.selectToken'));
      return;
    }
    setPaymentLoading(true);
    setPayingMethod('crypto');
    try {
      const res = await createCryptoOrder({
        amount: payAmountVal,
        chain: selectedChain,
        token: selectedToken,
      });
      if (res.data.message === 'success' && res.data.data) {
        const analyticsValue = Number((payAmountVal * rate).toFixed(decimals));
        trackEvent('begin_checkout', {
          currency: code || 'CNY',
          value: analyticsValue,
          payment_method: 'crypto',
          items: [getTopupAnalyticsItem(analyticsValue)],
        });
        setCryptoOrder(res.data.data);
        startCryptoPolling(res.data.data.trade_no, analyticsValue);
      } else if (res.data.message !== 'success') {
        const errMsg = typeof res.data.data === 'string' ? res.data.data : res.data.message;
        toast.error(errMsg || t('common.requestFailed'));
      }
    } catch (e) { /* interceptor */ }
    setPaymentLoading(false);
    setPayingMethod('');
  };

  const startCryptoPolling = (tradeNo, analyticsValue) => {
    setCryptoPolling(true);
    const interval = setInterval(async () => {
      try {
        const res = await getCryptoOrderStatus(tradeNo);
        if (res.data.data?.status === 'success') {
          trackEvent('purchase', {
            transaction_id: String(tradeNo || `crypto_topup_${Date.now()}`),
            affiliation: 'API-Route balance top-up',
            currency: code || 'CNY',
            value: analyticsValue,
            payment_method: 'crypto',
            items: [getTopupAnalyticsItem(analyticsValue)],
          });
          clearInterval(interval);
          setCryptoPolling(false);
          setCryptoOrder(null);
          toast.success(t('topup.paymentSuccess'));
          await Promise.all([loadData(), refreshUser()]);
        } else if (res.data.data?.status === 'expired') {
          clearInterval(interval);
          setCryptoPolling(false);
          toast.error(t('topup.orderExpired'));
        }
      } catch (e) {
        clearInterval(interval);
        setCryptoPolling(false);
      }
    }, 5000);
    // Auto-stop after expiry time
    const expiryMs = (topupInfo?.crypto_expiry_minutes || 30) * 60 * 1000;
    setTimeout(() => { clearInterval(interval); setCryptoPolling(false); }, expiryMs);
  };

  // Available crypto chains from config
  const cryptoWallets = topupInfo?.crypto_wallets || {};
  const availableChains = useMemo(() => {
    const chains = [];
    if (cryptoWallets.tron) chains.push({ key: 'tron', label: 'TRON (TRC20)' });
    if (cryptoWallets.eth) chains.push({ key: 'eth', label: 'Ethereum (ERC20)' });
    if (cryptoWallets.bsc) chains.push({ key: 'bsc', label: 'BSC (BEP20)' });
    return chains;
  }, [cryptoWallets.tron, cryptoWallets.eth, cryptoWallets.bsc]);
  const selectedChainMeta = useMemo(
    () => availableChains.find((chain) => chain.key === selectedChain) || null,
    [availableChains, selectedChain],
  );
  const selectedChainLabel = selectedChainMeta?.label || '';
  const selectedTokenLabel = selectedToken.toUpperCase();
  const selectedCryptoLabel = selectedChainLabel
    ? `${selectedTokenLabel} (${selectedChainLabel})`
    : selectedTokenLabel;

  // Set default chain when available
  useEffect(() => {
    if (availableChains.length > 0 && !selectedChain) {
      setSelectedChain(availableChains[0].key);
    }
  }, [availableChains, selectedChain]);

  // Parse Creem products
  const creemProducts = useMemo(() => {
    return normalizeCreemProducts(topupInfo?.creem_products);
  }, [topupInfo?.creem_products]);

  const creemMinTopup = useMemo(() => {
    const configuredMin = Number(topupInfo?.creem_min_topup);
    return Number.isFinite(configuredMin) && configuredMin > 0
      ? configuredMin
      : getCreemMinTopup(creemProducts);
  }, [topupInfo?.creem_min_topup, creemProducts]);

  const topupPayMethods = useMemo(() => {
    const methods = (payMethods || [])
      .filter((m) => m?.type && m.type !== 'crypto')
      .map((method) => {
        if (isStripePayment(method.type) && (!method.min_topup || Number(method.min_topup) <= 0)) {
          const stripeMin = Number(topupInfo?.stripe_min_topup);
          if (Number.isFinite(stripeMin) && stripeMin > 0) {
            return { ...method, name: formatPaymentMethodName(method.name || method.type), min_topup: stripeMin };
          }
        }
        if (method.type === 'creem' && (!method.min_topup || Number(method.min_topup) <= 0)) {
          return { ...method, name: formatPaymentMethodName(method.name || method.type), min_topup: creemMinTopup };
        }
        return { ...method, name: formatPaymentMethodName(method.name || method.type) };
      });

    if (enableCreem && creemProducts.length > 0 && !methods.some((method) => method.type === 'creem')) {
      methods.push({
        name: 'Creem',
        type: 'creem',
        min_topup: creemMinTopup,
      });
    }
    return methods;
  }, [payMethods, enableCreem, creemProducts, creemMinTopup]);

  const paymentOptions = useMemo(() => {
    const methods = topupPayMethods.filter((method) => {
      if (isCreemPayment(method.type)) return enableCreem;
      if (isStripePayment(method.type)) return enableStripe;
      return enableOnline;
    });
    if (enableCrypto && availableChains.length > 0) {
      methods.push({ name: t('topup.cryptoPayment'), type: 'crypto' });
    }
    return methods;
  }, [topupPayMethods, enableOnline, enableStripe, enableCreem, enableCrypto, availableChains.length, t]);

  useEffect(() => {
    if (paymentOptions.some((method) => method.type === selectedPaymentMethod)) return;
    setSelectedPaymentMethod(paymentOptions[0]?.type || '');
  }, [paymentOptions, selectedPaymentMethod]);

  const selectedMethod = paymentOptions.find((method) => method.type === selectedPaymentMethod);
  const confirmedDisplayAmount = amount ? toDisplayAmount(amount) : formatCurrencyAmount(0);
  const handleConfirmPayment = () => {
    if (selectedPaymentMethod === 'crypto') {
      handleCryptoPay();
    } else if (selectedPaymentMethod) {
      handlePay(selectedPaymentMethod);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col px-4 py-6 sm:px-5 sm:py-10 md:px-8 md:py-14">
      <div className="order-1 mb-6 sm:mb-8">
        <p className="route-kicker">{t('topup.eyebrow')}</p>
        <h1 className="mt-2 text-2xl font-bold tracking-[-0.035em] text-page sm:text-3xl md:text-4xl">{t('topup.title')}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-page-secondary sm:mt-3 sm:leading-7 md:text-base">{t('topup.subtitle')}</p>
      </div>

      {/* Balance Stats */}
      <div className="order-2 mb-6 grid grid-cols-2 gap-2 sm:mb-8 sm:gap-3 lg:grid-cols-4">
        <div className="glass min-w-0 rounded-xl p-3 sm:rounded-2xl sm:p-4">
          <p className="mb-1 text-xs text-page-secondary">{t('dashboard.balance')}</p>
          <div className="break-all text-lg font-bold leading-tight text-page sm:text-xl">
            {symbol}<CountUp from={0} to={balanceDollars} duration={1.5} decimals={decimals} />
          </div>
        </div>

        <div className="glass min-w-0 rounded-xl p-3 sm:rounded-2xl sm:p-4">
          <p className="mb-1 text-xs text-page-secondary">{t('dashboard.used')}</p>
          <div className="break-all text-lg font-bold leading-tight text-page sm:text-xl">
            {symbol}<CountUp from={0} to={usedQuota / Q * rate} duration={1.5} decimals={decimals} />
          </div>
        </div>

        <div className="glass min-w-0 rounded-xl p-3 sm:rounded-2xl sm:p-4">
          <p className="mb-1 text-xs text-page-secondary">{t('dashboard.packageUsed')}</p>
          <div className="break-all text-lg font-bold leading-tight text-page sm:text-xl">
            {symbol}<CountUp from={0} to={packageUsedQuota / Q * rate} duration={1.5} decimals={decimals} />
          </div>
        </div>

        <div className="glass min-w-0 rounded-xl p-3 sm:rounded-2xl sm:p-4">
          <p className="mb-1 text-xs text-page-secondary">{t('dashboard.totalRequests')}</p>
          <div className="break-all text-lg font-bold leading-tight text-page sm:text-xl">
            <CountUp from={0} to={requestCount} duration={1.5} />
          </div>
        </div>
      </div>

      {/* Online Topup */}
      {site?.enable_topup && paymentOptions.length > 0 && (
        <div className="order-3 mb-6 grid gap-3 sm:mb-8 sm:gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
          <div className="space-y-3 sm:space-y-4">
            <section className="glass p-4 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-page">{t('topup.selectAmount')}</h2>
                <span className="rounded-full border border-page-divider px-3 py-1 text-xs font-medium text-page-secondary">
                  {code}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                {presetAmounts.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handlePreset(val)}
                    className={`min-h-14 rounded-lg px-1 text-sm font-semibold transition-all sm:min-h-20 sm:rounded-xl sm:px-3 sm:text-lg ${
                      selectedPreset === val
                        ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25'
                        : 'glass-sm text-page hover:bg-page-surface-hover'
                    }`}
                  >
                    {symbol}{formatCurrencyAmount(val * rate)}
                  </button>
                ))}
              </div>

              <div className="mt-5">
                <label className="mb-2 block text-sm font-medium text-page-label">{t('topup.customAmount')}</label>
                <div className="grid gap-3 sm:grid-cols-4">
                  <input
                    type="number"
                    value={displayAmount}
                    onChange={(e) => {
                      const currentValue = e.target.value;
                      setDisplayAmount(currentValue);
                      setSelectedPreset(null);
                      const quotaAmount = toQuotaAmount(currentValue);
                      setAmount(quotaAmount === '' ? '' : String(quotaAmount));
                    }}
                    onBlur={(e) => {
                      const quotaAmount = toQuotaAmount(e.target.value);
                      if (quotaAmount === '') {
                        setDisplayAmount('');
                        setAmount('');
                        return;
                      }
                      setAmount(String(quotaAmount));
                      setDisplayAmount(toDisplayAmount(quotaAmount));
                    }}
                    min={minTopup * rate}
                    step="0.01"
                    placeholder={t('topup.amountPlaceholder', { min: `${symbol}${formatCurrencyAmount(minTopup * rate)}` })}
                    className="input h-12 min-w-0 sm:col-span-2"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRedeemModal(true)}
                    className="btn-secondary flex h-12 min-w-0 items-center justify-center gap-1.5 whitespace-nowrap px-2 text-xs sm:col-span-1 lg:gap-2 lg:px-3 lg:text-sm"
                  >
                    <TicketCheck size={17} />
                    {t('topup.redeemTitle')}
                  </button>
                </div>
                <p className="mt-2 text-xs text-page-muted">{t('topup.customAmountHint')}</p>
              </div>
            </section>

            <section className="glass p-4 sm:p-6">
              <h2 className="mb-4 text-lg font-semibold text-page">{t('topup.paymentMethod')}</h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
                {paymentOptions.map((method) => {
                  const minForMethod = Number(method.min_topup) || 0;
                  return (
                    <button
                      key={method.type}
                      type="button"
                      onClick={() => setSelectedPaymentMethod(method.type)}
                      title={minForMethod > 0
                        ? t('topup.gatewayMinimumAmount', {
                            channel: method.name,
                            amount: `${symbol}${formatCurrencyAmount(minForMethod * rate)}`,
                          })
                        : undefined}
                      className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-2 text-sm font-semibold transition-all sm:min-h-14 sm:px-3 ${
                        selectedPaymentMethod === method.type
                          ? 'topup-payment-method--selected border text-page shadow-sm'
                          : 'glass-sm text-page-label hover:bg-page-surface-hover hover:text-page'
                      }`}
                    >
                      <WalletCards size={18} className={selectedPaymentMethod === method.type ? 'topup-payment-method-icon--selected' : 'text-page-secondary'} />
                      <span className="truncate">{method.name}</span>
                    </button>
                  );
                })}
              </div>

              {selectedPaymentMethod === 'crypto' && (
                <div className="mt-4 grid gap-4 rounded-xl border border-page-divider bg-page-surface/50 p-4 sm:grid-cols-2">
                  <div>
                    <p className="mb-2 text-xs font-medium text-page-label">{t('topup.cryptoStepChain')}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {availableChains.map((chain) => (
                        <button
                          key={chain.key}
                          type="button"
                          onClick={() => setSelectedChain(chain.key)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                            selectedChain === chain.key
                              ? 'bg-brand-500 text-white'
                              : 'glass-sm text-page-label hover:bg-page-surface-hover'
                          }`}
                        >
                          {chain.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-medium text-page-label">{t('topup.cryptoStepToken')}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {['usdt', 'usdc'].map((token) => (
                        <button
                          key={token}
                          type="button"
                          onClick={() => setSelectedToken(token)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                            selectedToken === token
                              ? 'bg-brand-500 text-white'
                              : 'glass-sm text-page-label hover:bg-page-surface-hover'
                          }`}
                        >
                          {token.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>

          <aside className="glass flex min-h-0 flex-col p-4 sm:p-6 lg:min-h-[320px]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-page">{t('topup.rechargeAmountLabel')}</h2>
              <span className="rounded-full border border-page-divider px-3 py-1 text-xs font-medium text-page-secondary">
                {code}
              </span>
            </div>

            <div className="flex flex-1 flex-col items-center justify-center py-5 text-center sm:py-8 lg:py-10">
              <p className="break-all text-3xl font-bold tracking-tight text-page sm:text-5xl">
                {symbol}{confirmedDisplayAmount}
              </p>
              {selectedMethod && (
                <p className="mt-2 text-sm text-page-secondary sm:mt-4">
                  {t('topup.paymentMethod')}: {selectedMethod.name}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleConfirmPayment}
              disabled={paymentLoading || !amount || !selectedPaymentMethod}
              className="btn-primary flex min-h-12 w-full items-center justify-center"
            >
              {paymentLoading
                ? t('topup.processing')
                : t('topup.confirmPayment', { amount: `${symbol}${confirmedDisplayAmount}` })}
            </button>
          </aside>
        </div>
      )}

      {/* Crypto Payment Modal */}
      {cryptoOrder && (
        <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm" onClick={() => setCryptoOrder(null)}>
          <div className="glass max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl p-4 sm:p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-page mb-4">{t('topup.cryptoPayment')}</h3>
            <div className="space-y-4">
              <div className="glass-sm rounded-xl p-4">
                <p className="text-xs text-page-secondary mb-1">{t('topup.walletAddress')}</p>
                <p className="text-sm text-page font-mono break-all">{cryptoOrder.wallet}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="glass-sm rounded-xl p-3">
                  <p className="text-xs text-page-secondary mb-1">{t('topup.amount')}</p>
                  <p className="text-sm text-page font-medium">{cryptoOrder.amount} {cryptoOrder.token}</p>
                </div>
                <div className="glass-sm rounded-xl p-3">
                  <p className="text-xs text-page-secondary mb-1">{t('topup.chain')}</p>
                  <p className="text-sm text-page font-medium">{selectedChainLabel || cryptoOrder.chain}</p>
                </div>
              </div>
              <p className="rounded-xl border border-orange-500/25 bg-orange-500/10 px-4 py-3 text-sm leading-6 text-page-secondary">
                {t('topup.cryptoExactAmountPrefix')}
                <strong className="text-base font-bold text-orange-500">{cryptoOrder.amount}</strong>
                {' '}
                {cryptoOrder.token}
                {t('topup.cryptoExactAmountSuffix')}
              </p>
              {cryptoPolling && (
                <div className="flex items-center gap-2 text-sm text-page-secondary">
                  <div className="w-4 h-4 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
                  {t('topup.waitingPayment')}
                </div>
              )}
              <button
                onClick={() => { setCryptoOrder(null); setCryptoPolling(false); }}
                className="w-full py-2 rounded-xl text-sm glass-sm text-page-secondary hover:text-page transition-colors"
              >
                {t('topup.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History */}
      <section className="order-4 mb-6 glass rounded-2xl p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-page mb-4">{t('topup.history')}</h2>
          {historyLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <p className="text-sm text-page-muted text-center py-8">{t('topup.noHistory')}</p>
          ) : (
            <div className="space-y-2">
              {history.map((item, i) => (
                <div key={i} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl px-3 py-3 glass-sm sm:px-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-page">{symbol}{(Number(item.amount) * rate).toFixed(decimals)}</p>
                    <p className="mt-0.5 text-xs leading-5 text-page-muted">
                      <span className="block sm:inline">{new Date(item.create_time * 1000).toLocaleString()}</span>
                      <span className="hidden sm:inline"> · </span>
                      <span className="block break-all sm:inline">{formatPaymentMethodName(item.payment_method) || t('topup.redeemCode')}</span>
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-xs ${
                    item.status === 'success'
                      ? 'bg-green-500/10 text-page-success'
                      : item.status === 'pending'
                        ? 'bg-yellow-500/10 text-page-warning'
                        : 'bg-red-500/10 text-page-danger'
                  }`}>
                    {item.status === 'success' ? t('topup.statusSuccess') : item.status === 'pending' ? t('topup.statusPending') : t('topup.statusFailed')}
                  </span>
                </div>
              ))}
            </div>
          )}
      </section>

      {showRedeemModal && (
        <div
          className="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
          onClick={() => setShowRedeemModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="redeem-dialog-title"
        >
          <div className="glass max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto p-4 sm:p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="redeem-dialog-title" className="text-lg font-semibold text-page">
                  {t('topup.redeemTitle')}
                </h2>
                <p className="mt-1 text-sm text-page-secondary">{t('topup.redeemBalanceHeading')}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowRedeemModal(false)}
                className="text-sm text-page-secondary transition-colors hover:text-page"
              >
                {t('topup.close')}
              </button>
            </div>

            <form onSubmit={handleRedeem} className="mt-5 space-y-3">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-page-label">{t('topup.enterRedeemCode')}</span>
                <input
                  autoFocus
                  type="text"
                  value={redeemInput}
                  onChange={(e) => setRedeemInput(e.target.value)}
                  className="input h-12 font-mono"
                  placeholder={t('topup.enterRedeemCode')}
                />
              </label>
              <button
                type="submit"
                disabled={redeeming || !redeemInput.trim()}
                className="btn-primary flex h-12 w-full items-center justify-center gap-2"
              >
                <TicketPercent size={17} />
                {redeeming ? t('topup.redeeming') : t('topup.redeemBalance')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
