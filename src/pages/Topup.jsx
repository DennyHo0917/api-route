import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useSite } from '../context/SiteContext';
import {
  ArrowRight,
  CircleAlert,
  CheckCircle2,
  ExternalLink,
  KeyRound,
  ShoppingBag,
  TicketCheck,
  TicketPercent,
  WalletCards,
} from 'lucide-react';
import {
  getUserUsage, redeemCode, getTopupInfo, getSitePackages, subscribePackage,
  createEpayOrder, createStripeOrder, createCreemOrder,
  createCryptoOrder, getCryptoOrderStatus, getTopupHistory,
  Q,
} from '../api';
import { useCurrency } from '../context/SiteContext';
import CountUp from '../components/bits/CountUp';
import { getLocalizedPackageName } from '../utils/packageLocalization';
import toast from 'react-hot-toast';

const PENDING_PACKAGE_KEY = 'dist_pending_package_activation';

function normalizeExternalUrl(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) && !/^https?:\/\//i.test(trimmed)) {
    return '';
  }
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(withProtocol);
    if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname) return '';
    if (parsed.host.includes(':') && !parsed.port && !parsed.host.startsWith('[')) return '';
    return parsed.href;
  } catch {
    return '';
  }
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

export default function Topup() {
  const { t, i18n } = useTranslation();
  const { user, refreshUser } = useAuth();
  const { site } = useSite();
  const { symbol, rate } = useCurrency();
  const currentLanguage = (i18n.resolvedLanguage || i18n.language || '').toLowerCase();
  const showVoucherFlow = currentLanguage.startsWith('zh');

  const [usage, setUsage] = useState(null);
  const [topupInfo, setTopupInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Redeem code
  const [redeemInput, setRedeemInput] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [redeemMode, setRedeemMode] = useState('package');
  const [packages, setPackages] = useState([]);
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [pendingPackage, setPendingPackage] = useState(null);

  // Online topup
  const [amount, setAmount] = useState('');
  const [displayAmount, setDisplayAmount] = useState('');
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [payingMethod, setPayingMethod] = useState('');

  // Crypto modal
  const [cryptoOrder, setCryptoOrder] = useState(null);
  const [cryptoPolling, setCryptoPolling] = useState(false);
  const [selectedChain, setSelectedChain] = useState('');
  const [selectedToken, setSelectedToken] = useState('usdt');

  // History
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const enableTopup = site?.enable_topup && topupInfo;
  const topupConfig = site?.topup_config;
  const presetAmounts = topupInfo?.amount_options || [1, 5, 10, 20, 50, 100];
  const minTopup = topupInfo?.min_topup || 1;
  const payMethods = topupInfo?.pay_methods || [];
  const enableOnline = topupInfo?.enable_online_topup;
  const enableStripe = topupInfo?.enable_stripe_topup;
  const enableCreem = topupInfo?.enable_creem_topup;
  const enableCrypto = topupInfo?.enable_crypto_topup;
  const hasAnyPayment = enableOnline || enableStripe || enableCreem || enableCrypto;
  const redeemCodeShopUrl = useMemo(
    () => normalizeExternalUrl(site?.top_up_link || topupConfig?.top_up_link || topupInfo?.top_up_link),
    [site?.top_up_link, topupConfig?.top_up_link, topupInfo?.top_up_link],
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [usageRes, topupRes] = await Promise.all([
        getUserUsage(),
        site?.enable_topup ? getTopupInfo().catch(() => null) : Promise.resolve(null),
      ]);
      if (usageRes.data.success) setUsage(usageRes.data.data);
      if (topupRes?.data?.data) setTopupInfo(topupRes.data.data);
    } catch (e) { /* interceptor */ }
    setLoading(false);
  }, [site?.enable_topup]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const queryPackageId = searchParams.get('package_id');
    if (searchParams.get('mode') === 'balance') {
      setRedeemMode('balance');
    }
    if (queryPackageId && /^\d+$/.test(queryPackageId)) {
      setRedeemMode('package');
      setSelectedPackageId(queryPackageId);
    }

    try {
      const pending = JSON.parse(localStorage.getItem(PENDING_PACKAGE_KEY) || 'null');
      if (pending?.id) setPendingPackage(pending);
    } catch {
      localStorage.removeItem(PENDING_PACKAGE_KEY);
    }

    getSitePackages()
      .then((res) => {
        if (res.data.success) {
          setPackages((res.data.data || []).filter((pkg) => pkg.enabled !== false));
        }
      })
      .catch(() => {});
  }, []);

  const quota = usage?.quota ?? user?.quota ?? 0;
  const usedQuota = usage?.used_quota ?? user?.used_quota ?? 0;
  const packageUsedQuota = usage?.package_used_quota ?? user?.package_used_quota ?? 0;
  const requestCount = usage?.request_count ?? user?.request_count ?? 0;
  const balanceDollars = quota / Q * rate;

  const formatCurrencyAmount = useCallback((value) => {
    if (value === '' || value == null || Number.isNaN(Number(value))) return '';
    return Number(value).toFixed(2).replace(/\.?0+$/, '');
  }, []);

  const toDisplayAmount = useCallback((quotaAmount) => {
    if (quotaAmount === '' || quotaAmount == null) return '';
    return formatCurrencyAmount(Number(quotaAmount) * rate);
  }, [formatCurrencyAmount, rate]);

  const toQuotaAmount = useCallback((currencyAmount) => {
    const numeric = Number.parseFloat(currencyAmount);
    if (!Number.isFinite(numeric) || numeric <= 0) return '';
    return Math.max(minTopup, Math.round(numeric / rate));
  }, [minTopup, rate]);

  const savePendingPackage = useCallback((pkg) => {
    const pending = {
      id: Number(pkg.id),
      name: pkg.name,
      price: Number(pkg.price),
    };
    localStorage.setItem(PENDING_PACKAGE_KEY, JSON.stringify(pending));
    setPendingPackage(pending);
    return pending;
  }, []);

  const clearPendingPackage = useCallback(() => {
    localStorage.removeItem(PENDING_PACKAGE_KEY);
    setPendingPackage(null);
  }, []);

  const activatePackage = useCallback(async (pkg) => {
    savePendingPackage(pkg);
    try {
      const res = await subscribePackage(pkg.id, { skipErrorHandler: true });
      if (!res.data.success) {
        throw new Error(res.data.message || t('topup.packageActivationFailed'));
      }

      clearPendingPackage();
      toast.success(t('topup.packageActivated', {
        name: getLocalizedPackageName(pkg, t, i18n.resolvedLanguage),
      }));
      await Promise.all([
        loadData(),
        refreshUser({ skipErrorHandler: true }),
      ]);
      return true;
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message || t('topup.packageActivationFailed'));
      await Promise.all([
        loadData().catch(() => null),
        refreshUser({ skipErrorHandler: true }).catch(() => null),
      ]);
      return false;
    }
  }, [clearPendingPackage, i18n.resolvedLanguage, loadData, refreshUser, savePendingPackage, t]);

  const selectedPackage = useMemo(
    () => packages.find((pkg) => String(pkg.id) === String(selectedPackageId)) || null,
    [packages, selectedPackageId],
  );

  // Balance mode stops after crediting; package mode immediately subscribes.
  const handleRedeem = async (e) => {
    e.preventDefault();
    if (!redeemInput.trim()) return;
    if (redeemMode === 'package' && !selectedPackage) {
      toast.error(t('topup.choosePackage'));
      return;
    }

    setRedeeming(true);
    try {
      const beforeUser = await refreshUser({ skipErrorHandler: true }).catch(() => null);
      const res = await redeemCode(redeemInput.trim());
      if (res.data.success) {
        setRedeemInput('');
        if (redeemMode === 'balance') {
          await Promise.all([
            loadData(),
            refreshUser({ skipErrorHandler: true }),
          ]);
          toast.success(t('topup.balanceRedeemed'));
          setRedeeming(false);
          return;
        }

        const afterUser = await refreshUser({ skipErrorHandler: true }).catch(() => null);
        const beforeQuota = Number(beforeUser?.quota);
        const afterQuota = Number(afterUser?.quota);

        let packageToActivate = selectedPackage;
        if (Number.isFinite(beforeQuota) && Number.isFinite(afterQuota) && afterQuota > beforeQuota) {
          const creditedAmount = ((afterQuota - beforeQuota) / Q) * rate;
          const matchingPackages = packages.filter(
            (pkg) => Math.abs(Number(pkg.price) - creditedAmount) <= 0.02,
          );

          if (matchingPackages.length === 1) {
            packageToActivate = matchingPackages[0];
            setSelectedPackageId(String(packageToActivate.id));
          } else if (
            Math.abs(Number(selectedPackage.price) - creditedAmount) > 0.02
          ) {
            toast.error(t('topup.codeAmountMismatch'));
            await loadData();
            setRedeeming(false);
            return;
          }
        }

        await activatePackage(packageToActivate);
      }
    } catch (err) { /* interceptor */ }
    setRedeeming(false);
  };

  const retryPendingActivation = async () => {
    if (!pendingPackage) return;
    setRedeeming(true);
    await activatePackage(pendingPackage);
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
    return payMethod?.name || (method === 'creem' ? 'Creem' : 'Stripe');
  };

  const showGatewayMinTopupError = (method, minAmount) => {
    toast.error(t('topup.gatewayMinimumAmount', {
      channel: getMethodDisplayName(method),
      amount: formatCurrencyAmount(minAmount),
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
      toast.error(t('topup.minimumAmount', { min: formatCurrencyAmount(minTopup * rate) }));
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
        setCryptoOrder(res.data.data);
        startCryptoPolling(res.data.data.trade_no);
      } else if (res.data.message !== 'success') {
        const errMsg = typeof res.data.data === 'string' ? res.data.data : res.data.message;
        toast.error(errMsg || t('common.requestFailed'));
      }
    } catch (e) { /* interceptor */ }
    setPaymentLoading(false);
    setPayingMethod('');
  };

  const startCryptoPolling = (tradeNo) => {
    setCryptoPolling(true);
    const interval = setInterval(async () => {
      try {
        const res = await getCryptoOrderStatus(tradeNo);
        if (res.data.data?.status === 'success') {
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

  // History
  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await getTopupHistory({ page: 1, page_size: 20 });
      if (res.data.data?.items) {
        setHistory(res.data.data.items);
      }
    } catch (e) { /* interceptor */ }
    setHistoryLoading(false);
  };

  const topupPayMethods = useMemo(() => {
    const methods = (payMethods || [])
      .filter((m) => m?.type && m.type !== 'crypto')
      .map((method) => {
        if (isStripePayment(method.type) && (!method.min_topup || Number(method.min_topup) <= 0)) {
          const stripeMin = Number(topupInfo?.stripe_min_topup);
          if (Number.isFinite(stripeMin) && stripeMin > 0) {
            return { ...method, min_topup: stripeMin };
          }
        }
        if (method.type === 'creem' && (!method.min_topup || Number(method.min_topup) <= 0)) {
          return { ...method, min_topup: creemMinTopup };
        }
        return method;
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

  const redeemSteps = redeemMode === 'balance'
    ? [
      {
        icon: ShoppingBag,
        title: t('topup.balanceStepBuyTitle'),
        description: t('topup.balanceStepBuyDesc'),
      },
      {
        icon: TicketCheck,
        title: t('topup.balanceStepRedeemTitle'),
        description: t('topup.balanceStepRedeemDesc'),
      },
      {
        icon: WalletCards,
        title: t('topup.balanceStepCreditTitle'),
        description: t('topup.balanceStepCreditDesc'),
      },
    ]
    : [
      {
        icon: ShoppingBag,
        title: t('topup.stepBuyTitle'),
        description: t('topup.stepBuyDesc'),
      },
      {
        icon: TicketCheck,
        title: t('topup.stepRedeemTitle'),
        description: t('topup.stepRedeemDesc'),
      },
      {
        icon: KeyRound,
        title: t('topup.stepActivateTitle'),
        description: t('topup.stepActivateDesc'),
      },
    ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col px-5 py-10 md:px-8 md:py-14">
      <div className="order-1 mb-8">
        <p className="route-kicker">{t('topup.eyebrow')}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] text-page md:text-4xl">{t('topup.title')}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-page-secondary md:text-base">{t('topup.subtitle')}</p>

        {showVoucherFlow && (
          <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-red-500/25 bg-red-500/10 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-red-600">
                <CircleAlert size={20} />
              </span>
              <div>
                <p className="font-semibold text-page">{t('topup.mainlandBalanceNoticeTitle')}</p>
                <p className="mt-1 text-sm leading-6 text-page-secondary">
                  {t('topup.mainlandBalanceNoticeDesc')}
                </p>
              </div>
            </div>
            {redeemCodeShopUrl && (
              <a
                href={redeemCodeShopUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#D97757] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#C4613F]"
              >
                <ShoppingBag size={16} />
                {t('topup.mainlandBalanceNoticeAction')}
                <ExternalLink size={14} />
              </a>
            )}
          </div>
        )}
      </div>

      {/* Balance Stats */}
      <div className="order-3 mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="glass rounded-2xl p-4">
          <p className="mb-1 text-xs text-page-secondary">{t('dashboard.balance')}</p>
          <div className="text-xl font-bold text-page">
            {symbol}<CountUp from={0} to={balanceDollars} duration={1.5} decimals={2} />
          </div>
        </div>

        <div className="glass rounded-2xl p-4">
          <p className="mb-1 text-xs text-page-secondary">{t('dashboard.used')}</p>
          <div className="text-xl font-bold text-page">
            {symbol}<CountUp from={0} to={usedQuota / Q * rate} duration={1.5} decimals={2} />
          </div>
        </div>

        <div className="glass rounded-2xl p-4">
          <p className="mb-1 text-xs text-page-secondary">{t('dashboard.packageUsed')}</p>
          <div className="text-xl font-bold text-page">
            {symbol}<CountUp from={0} to={packageUsedQuota / Q * rate} duration={1.5} decimals={2} />
          </div>
        </div>

        <div className="glass rounded-2xl p-4">
          <p className="mb-1 text-xs text-page-secondary">{t('dashboard.totalRequests')}</p>
          <div className="text-xl font-bold text-page">
            <CountUp from={0} to={requestCount} duration={1.5} />
          </div>
        </div>
      </div>

      {/* Online Topup */}
      {site?.enable_topup && (enableOnline || enableStripe || enableCreem || enableCrypto) && (topupPayMethods.length > 0 || enableCrypto) && (
        <div className={`${showVoucherFlow ? 'order-4' : 'order-2'} mb-6 rounded-2xl border border-[#E6D8CC] bg-white/65 p-6`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-page">{t('topup.onlineTopup')}</h2>
            <button
              onClick={() => { setShowHistory(!showHistory); if (!showHistory) loadHistory(); }}
              className="text-sm text-page-secondary hover:text-page transition-colors"
            >
              {showHistory ? t('topup.hideHistory') : t('topup.viewHistory')}
            </button>
          </div>

          {/* Preset Amounts */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-page-label mb-3">{t('topup.selectAmount')}</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {presetAmounts.map((val) => (
                <button
                  key={val}
                  onClick={() => handlePreset(val)}
                  className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
                    selectedPreset === val
                      ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25'
                      : 'glass-sm text-page-label hover:text-page hover:bg-page-surface-hover'
                  }`}
                >
                  {symbol}{formatCurrencyAmount(val * rate)}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-page-label mb-2">{t('topup.customAmount')}</label>
            <div className="flex gap-3">
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
                placeholder={t('topup.amountPlaceholder', { min: formatCurrencyAmount(minTopup * rate) })}
                className="input flex-1"
              />
            </div>
            <p className="text-xs text-page-muted mt-2">
              {t('topup.customAmountHint')}
            </p>
            {amount ? (
              <p className="text-xs text-page-muted mt-2">
                {t('topup.rechargeAmountLabel')}: {symbol}{displayAmount || toDisplayAmount(amount)}
              </p>
            ) : null}
          </div>

          {/* Payment Methods */}
          <div>
            <label className="block text-sm font-medium text-page-label mb-3">{t('topup.paymentMethod')}</label>
            <div className="flex flex-wrap gap-2">
              {topupPayMethods.map((method) => {
                const isCurrentLoading = paymentLoading && payingMethod === method.type;
                const isMethodStripe = isStripePayment(method.type);
                const isMethodCreem = isCreemPayment(method.type);
                const minForMethod = Number(method.min_topup) || 0;
                const belowGatewayMin =
                  (isMethodStripe || isMethodCreem) &&
                  minForMethod > Number(amount || 0);
                const disabled =
                  paymentLoading ||
                  !amount ||
                  (!enableOnline && !isMethodStripe && !isMethodCreem) ||
                  (!enableStripe && isMethodStripe) ||
                  (!enableCreem && isMethodCreem);
                return (
                  <button
                    key={method.type}
                    onClick={() => handlePay(method.type)}
                    disabled={disabled}
                    title={
                      belowGatewayMin
                        ? t('topup.gatewayMinimumAmount', {
                            channel: method.name,
                            amount: formatCurrencyAmount(minForMethod),
                          })
                        : undefined
                    }
                    className="px-4 py-2.5 rounded-xl text-sm font-medium glass-sm text-page-label hover:text-page hover:bg-page-surface-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    {isCurrentLoading ? t('topup.processing') : method.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Crypto Payment (inline) */}
          {enableCrypto && availableChains.length > 0 && (
            <div className="mt-6 pt-6 border-t border-page-divider">
              <label className="block text-sm font-medium text-page-label mb-3">{t('topup.cryptoPayment')}</label>
              <div className="rounded-xl border border-page-divider bg-page-surface/50 p-4 space-y-4">
                <p className="text-xs text-page-muted">
                  {t('topup.cryptoSelectionHint')}
                </p>

                <div>
                  <p className="text-xs font-medium text-page-label mb-2">
                    {t('topup.cryptoStepChain')}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {availableChains.map((chain) => (
                      <button
                        key={chain.key}
                        onClick={() => setSelectedChain(chain.key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          selectedChain === chain.key
                            ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25'
                            : 'glass-sm text-page-label hover:text-page hover:bg-page-surface-hover'
                        }`}
                      >
                        {chain.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-page-label mb-2">
                    {t('topup.cryptoStepToken')}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {['usdt', 'usdc'].map((token) => (
                      <button
                        key={token}
                        onClick={() => setSelectedToken(token)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          selectedToken === token
                            ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25'
                            : 'glass-sm text-page-label hover:text-page hover:bg-page-surface-hover'
                        }`}
                      >
                        {token.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg bg-page-inset/60 px-3 py-3">
                  <p className="text-[11px] text-page-muted mb-1">
                    {t('topup.cryptoSelectedSummary')}
                  </p>
                  <p className="text-sm font-medium text-page">
                    {selectedCryptoLabel}
                  </p>
                </div>

                <button
                  onClick={handleCryptoPay}
                  disabled={paymentLoading || !amount}
                  className="btn-primary w-full justify-center flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {paymentLoading && payingMethod === 'crypto' ? (
                    t('topup.processing')
                  ) : (
                    t('topup.generateCryptoAddress', { method: selectedCryptoLabel })
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Crypto Payment Modal */}
      {cryptoOrder && (
        <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setCryptoOrder(null)}>
          <div className="glass rounded-2xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-page mb-4">{t('topup.cryptoPayment')}</h3>
            <div className="space-y-4">
              <div className="glass-sm rounded-xl p-4">
                <p className="text-xs text-page-secondary mb-1">{t('topup.walletAddress')}</p>
                <p className="text-sm text-page font-mono break-all">{cryptoOrder.wallet}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="glass-sm rounded-xl p-3">
                  <p className="text-xs text-page-secondary mb-1">{t('topup.amount')}</p>
                  <p className="text-sm text-page font-medium">{cryptoOrder.amount} {cryptoOrder.token}</p>
                </div>
                <div className="glass-sm rounded-xl p-3">
                  <p className="text-xs text-page-secondary mb-1">{t('topup.chain')}</p>
                  <p className="text-sm text-page font-medium">{selectedChainLabel || cryptoOrder.chain}</p>
                </div>
              </div>
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
      {showHistory && (
        <div className="order-5 mb-6 glass rounded-2xl p-6">
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
                <div key={i} className="flex items-center justify-between glass-sm rounded-xl px-4 py-3">
                  <div>
                    <p className="text-sm text-page">{symbol}{(Number(item.amount) * rate).toFixed(2)}</p>
                    <p className="text-xs text-page-muted">
                      {new Date(item.create_time * 1000).toLocaleString()} · {item.payment_method || t('topup.redeemCode')}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
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
        </div>
      )}

      {/* Redeem Code */}
      <div className={`${showVoucherFlow ? 'order-2' : 'hidden'} mb-8 overflow-hidden rounded-[28px] border border-[#DDCCBE] bg-white/80 shadow-[0_24px_65px_rgba(96,69,48,0.1)]`}>
        <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#F8EAE0] px-3 py-1.5 text-xs font-semibold text-[#C56547]">
                  <TicketCheck size={14} />
                  {t('topup.redeemTitle')}
                </span>
                <h2 className="mt-4 text-2xl font-semibold tracking-tight text-[#3D3024]">
                  {redeemMode === 'balance'
                    ? t('topup.redeemBalanceHeading')
                    : t('topup.redeemHeading')}
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-[#806D5D]">
                  {redeemCodeShopUrl ? t('topup.redeemShopHint') : t('topup.redeemHint')}
                </p>
              </div>
              {redeemCodeShopUrl && (
                <a
                  href={redeemCodeShopUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#D97757] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#E38969]"
                >
                  <ShoppingBag size={16} />
                  {t('topup.buyRedeemCode')}
                  <ExternalLink size={14} />
                </a>
              )}
            </div>

            {redeemMode === 'package' && pendingPackage && (
              <div className="mt-5 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4">
                <p className="text-sm text-page-warning">
                  {t('topup.pendingPackageActivation', {
                    name: getLocalizedPackageName(pendingPackage, t, i18n.resolvedLanguage),
                  })}
                </p>
                <button
                  type="button"
                  onClick={retryPendingActivation}
                  disabled={redeeming}
                  className="mt-3 rounded-full border border-[#D9C5B2] px-4 py-2 text-xs font-semibold text-[#6B5D4F] hover:bg-white"
                >
                  {redeeming ? t('topup.activatingPackage') : t('topup.retryPackageActivation')}
                </button>
              </div>
            )}

            <div className="mt-6">
              <p className="mb-2 text-xs font-medium text-[#766657]">
                {t('topup.redeemModeLabel')}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setRedeemMode('package')}
                  disabled={redeeming}
                  className={`rounded-2xl border p-4 text-left transition-colors ${
                    redeemMode === 'package'
                      ? 'border-[#D97757] bg-[#FFF3EB]'
                      : 'border-[#E5D4C6] bg-white/70 hover:border-[#D8BBA7]'
                  }`}
                >
                  <span className="flex items-center gap-2 text-sm font-semibold text-[#3D3024]">
                    <TicketCheck size={17} className="text-[#C56547]" />
                    {t('topup.packageMode')}
                  </span>
                  <span className="mt-2 block text-xs leading-5 text-[#806D5D]">
                    {t('topup.packageModeDesc')}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setRedeemMode('balance')}
                  disabled={redeeming}
                  className={`rounded-2xl border p-4 text-left transition-colors ${
                    redeemMode === 'balance'
                      ? 'border-[#D97757] bg-[#FFF3EB]'
                      : 'border-[#E5D4C6] bg-white/70 hover:border-[#D8BBA7]'
                  }`}
                >
                  <span className="flex items-center gap-2 text-sm font-semibold text-[#3D3024]">
                    <WalletCards size={17} className="text-[#C56547]" />
                    {t('topup.balanceMode')}
                  </span>
                  <span className="mt-2 block text-xs leading-5 text-[#806D5D]">
                    {t('topup.balanceModeDesc')}
                  </span>
                </button>
              </div>
            </div>

            {redeemMode === 'package' && selectedPackage && (
              <div className="mt-6 flex items-center justify-between rounded-2xl border border-[#E5D4C6] bg-[#FFF7F1] px-4 py-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#A9826B]">
                    {t('topup.currentPackage')}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#3D3024]">
                    {getLocalizedPackageName(selectedPackage, t, i18n.resolvedLanguage)}
                  </p>
                </div>
                <p className="text-xl font-bold text-[#C56547]">
                  {symbol}{Number(selectedPackage.price).toFixed(2)}
                </p>
              </div>
            )}

            <form onSubmit={handleRedeem} className="mt-6 space-y-3">
              {redeemMode === 'package' && (
                <label className="block">
                  <span className="mb-2 block text-xs font-medium text-[#766657]">
                    {t('topup.choosePackage')}
                  </span>
                  <select
                    value={selectedPackageId}
                    onChange={(e) => setSelectedPackageId(e.target.value)}
                    className="package-redeem-select input h-12"
                    disabled={redeeming}
                  >
                    <option value="">{t('topup.choosePackage')}</option>
                    {packages.map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>
                        {getLocalizedPackageName(pkg, t, i18n.resolvedLanguage)} - {symbol}{Number(pkg.price).toFixed(2)}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label className="block">
                <span className="mb-2 block text-xs font-medium text-[#766657]">
                  {t('topup.enterRedeemCode')}
                </span>
                <input
                  type="text"
                  value={redeemInput}
                  onChange={(e) => setRedeemInput(e.target.value)}
                  className="input h-12 font-mono"
                  placeholder={t('topup.enterRedeemCode')}
                />
              </label>
              <button
                type="submit"
                disabled={redeeming}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#D97757] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#E38969] disabled:opacity-50"
              >
                <TicketPercent size={17} />
                {redeeming
                  ? t('topup.redeeming')
                  : redeemMode === 'balance'
                    ? t('topup.redeemBalance')
                    : t('topup.redeemPackage')}
                {!redeeming && <ArrowRight size={16} />}
              </button>
            </form>
          </div>

          <aside className="border-t border-[#E6D7CA] bg-[#FBF2EA] p-6 sm:p-8 lg:border-l lg:border-t-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#C56547]">
              {t('topup.stepsTitle')}
            </p>
            <div className="mt-6 space-y-6">
              {redeemSteps.map(({ icon: Icon, title, description }, index) => (
                <div key={title} className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#E4CFC0] bg-white/70 text-[#C56547]">
                    <Icon size={18} />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-[#A9826B]">0{index + 1}</span>
                      <h3 className="text-sm font-semibold text-[#3D3024]">{title}</h3>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-[#806D5D]">{description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-[#E2CDBE] bg-white/65 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#3D3024]">
                <CheckCircle2 size={17} className="text-[#C56547]" />
                {redeemMode === 'balance'
                  ? t('topup.balanceDirectCredit')
                  : t('topup.automaticActivation')}
              </div>
              <p className="mt-2 text-xs leading-5 text-[#806D5D]">
                {redeemMode === 'balance'
                  ? t('topup.balanceDirectCreditDesc')
                  : t('topup.automaticActivationDesc')}
              </p>
            </div>

            {hasAnyPayment && (
              <div className="mt-5 flex items-start gap-3 text-xs leading-5 text-[#8D7867]">
                <WalletCards size={16} className="mt-0.5 shrink-0" />
                <span>{t('topup.balanceOptionHint')}</span>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
