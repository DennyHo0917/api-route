const ATTRIBUTION_STORAGE_KEY = 'api_route_attribution_v1';

const CAMPAIGN_PARAM_NAMES = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
];

const CLICK_ID_SOURCES = [
  ['gclid', 'google', 'cpc', 'paid_search'],
  ['gbraid', 'google', 'cpc', 'paid_search'],
  ['wbraid', 'google', 'cpc', 'paid_search'],
  ['msclkid', 'bing', 'cpc', 'paid_search'],
  ['fbclid', 'facebook', 'paid_social', 'paid_social'],
  ['ttclid', 'tiktok', 'paid_social', 'paid_social'],
];

const ATTRIBUTION_PARAM_NAMES = new Set([
  ...CAMPAIGN_PARAM_NAMES,
  ...CLICK_ID_SOURCES.map(([name]) => name),
]);

const SOCIAL_SOURCES = new Set([
  'x', 'twitter', 'reddit', 'linkedin', 'facebook', 'instagram', 'youtube', 'tiktok',
]);

const SEARCH_SOURCES = new Set([
  'google', 'bing', 'duckduckgo', 'yahoo', 'baidu', 'yandex', 'naver',
]);

const EXCLUDED_REFERRER_DOMAINS = [
  'accounts.google.com',
  'api.z-pay.cn',
  'stripe.com',
  'stripe.network',
  'creem.io',
  'creem.com',
];

const SENSITIVE_PARAM_NAMES = new Set([
  'code',
  'key',
  'token',
  'access_token',
  'refresh_token',
  'id_token',
  'api_key',
  'apikey',
  'password',
  'passwd',
  'secret',
  'credential',
  'authorization',
  'state',
  'session',
  'session_id',
  'session_state',
  'email',
  'username',
  'phone',
  'mobile',
  'redirect',
  'redirect_uri',
  'return_url',
  'next',
]);

const hostMatches = (host, domain) => host === domain || host.endsWith(`.${domain}`);

const matchesSearchDomain = (host, brand, prefixes = ['www']) => {
  const prefixPattern = prefixes.length ? `(?:${prefixes.join('|')})\\.` : '';
  const suffixPattern = '(?:com|[a-z]{2,3}|com\\.[a-z]{2}|co\\.[a-z]{2})';
  return new RegExp(`^(?:${prefixPattern})?${brand}\\.${suffixPattern}$`).test(host);
};

const cleanValue = (value, maxLength = 100) => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9._+\-/ ]+/g, '-')
  .slice(0, maxLength);

const getUrl = (value, base = 'https://www.api-route.com') => {
  try {
    return new URL(value || '/', base);
  } catch {
    return new URL('/', base);
  }
};

const isSameSite = (host, currentHost) => (
  Boolean(host && currentHost)
  && (hostMatches(host, currentHost) || hostMatches(currentHost, host))
);

const getSearchSource = (host) => {
  if (matchesSearchDomain(host, 'google')) return 'google';
  if (/^(?:www\.|cn\.)?bing\.com$/.test(host)) return 'bing';
  if (/^(?:www\.)?duckduckgo\.com$/.test(host)) return 'duckduckgo';
  if (matchesSearchDomain(host, 'yahoo', ['www', 'search', 'r\\.search'])) return 'yahoo';
  if (/^(?:www\.|m\.)?baidu\.com$/.test(host)) return 'baidu';
  if (matchesSearchDomain(host, 'yandex')) return 'yandex';
  if (/^(?:www\.|search\.)?naver\.com$/.test(host)) return 'naver';
  return '';
};

const getSocialSource = (host) => {
  if (host === 't.co' || hostMatches(host, 'x.com') || hostMatches(host, 'twitter.com')) return 'x';
  if (hostMatches(host, 'reddit.com')) return 'reddit';
  if (hostMatches(host, 'linkedin.com') || host === 'lnkd.in') return 'linkedin';
  if (hostMatches(host, 'facebook.com') || hostMatches(host, 'fb.com')) return 'facebook';
  if (hostMatches(host, 'instagram.com')) return 'instagram';
  if (hostMatches(host, 'youtube.com') || host === 'youtu.be') return 'youtube';
  if (hostMatches(host, 'tiktok.com')) return 'tiktok';
  return '';
};

const getCampaignChannel = (source, medium) => {
  const normalizedSource = cleanValue(source);
  const normalizedMedium = cleanValue(medium);
  const isPaid = /(^|[-_])(cpc|ppc|paid|paidsearch|paid-social|paid_social|sem)([-_]|$)/.test(normalizedMedium);
  if (isPaid) return SOCIAL_SOURCES.has(normalizedSource) ? 'paid_social' : 'paid_search';
  if (/social/.test(normalizedMedium) || SOCIAL_SOURCES.has(normalizedSource)) return 'organic_social';
  if (/organic/.test(normalizedMedium) || SEARCH_SOURCES.has(normalizedSource)) return 'organic_search';
  return 'referral';
};

const isSensitiveParamName = (name) => {
  const normalized = String(name || '').trim().toLowerCase();
  return SENSITIVE_PARAM_NAMES.has(normalized)
    || /(^|_)(access|refresh|oauth|auth|verification)?_?token($|_)/.test(normalized)
    || /(^|_)(api_?key|password|passwd|secret|credential|authorization|session(_id|_state)?|email|username|phone|mobile)($|_)/.test(normalized);
};

const isSensitiveValue = (value) => {
  const text = String(value || '');
  return text.length > 200
    || /[\u0000-\u001f]/.test(text)
    || /(^|\s)bearer\s+/i.test(text)
    || /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(text)
    || /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/.test(text)
    || /\bsk-[A-Za-z0-9_-]{12,}\b/i.test(text);
};

const filterQuery = (url, attributionOnly = false) => {
  const filtered = new URLSearchParams();
  url.searchParams.forEach((value, name) => {
    const normalizedName = name.toLowerCase();
    if (attributionOnly && !ATTRIBUTION_PARAM_NAMES.has(normalizedName)) return;
    if (isSensitiveParamName(normalizedName) || isSensitiveValue(value)) return;
    if (!/^[a-z0-9_.-]{1,64}$/i.test(name)) return;
    filtered.append(name, value);
  });
  const query = filtered.toString();
  return query ? `?${query}` : '';
};

const getLandingPage = (url) => `${url.pathname}${filterQuery(url, true)}`.slice(0, 500);

const createTouch = ({ channel, source, medium, campaign = '', referrerHost = '', url, timestamp }) => ({
  channel,
  source,
  medium,
  campaign: cleanValue(campaign),
  referrerHost,
  landingPage: getLandingPage(url),
  timestamp,
});

const getCandidate = ({ url, referrer = '', timestamp }) => {
  if (/\/oauth\//i.test(url.pathname)) return null;

  const utmSource = url.searchParams.get('utm_source') || '';
  const utmMedium = url.searchParams.get('utm_medium') || '';
  const utmCampaign = url.searchParams.get('utm_campaign') || '';
  const hasUtm = CAMPAIGN_PARAM_NAMES.some((name) => url.searchParams.has(name));
  if (hasUtm) {
    const source = cleanValue(utmSource) || '(not set)';
    const medium = cleanValue(utmMedium) || 'campaign';
    return createTouch({
      channel: getCampaignChannel(source, medium),
      source,
      medium,
      campaign: utmCampaign,
      url,
      timestamp,
    });
  }

  const clickSource = CLICK_ID_SOURCES.find(([name]) => url.searchParams.has(name));
  if (clickSource) {
    return createTouch({
      source: clickSource[1],
      medium: clickSource[2],
      channel: clickSource[3],
      url,
      timestamp,
    });
  }

  if (referrer) {
    const referrerUrl = getUrl(referrer);
    const referrerHost = referrerUrl.hostname.toLowerCase();
    const currentHost = url.hostname.toLowerCase();
    if (!referrerHost
      || isSameSite(referrerHost, currentHost)
      || EXCLUDED_REFERRER_DOMAINS.some((domain) => hostMatches(referrerHost, domain))) {
      return null;
    }

    const searchSource = getSearchSource(referrerHost);
    if (searchSource) {
      return createTouch({
        source: searchSource,
        medium: 'organic',
        channel: 'organic_search',
        referrerHost,
        url,
        timestamp,
      });
    }

    const socialSource = getSocialSource(referrerHost);
    if (socialSource) {
      return createTouch({
        source: socialSource,
        medium: 'social',
        channel: 'organic_social',
        referrerHost,
        url,
        timestamp,
      });
    }

    return createTouch({
      source: referrerHost,
      medium: 'referral',
      channel: 'referral',
      referrerHost,
      url,
      timestamp,
    });
  }

  return createTouch({
    source: '(direct)',
    medium: '(none)',
    channel: 'direct',
    url,
    timestamp,
  });
};

const readAttribution = (storage) => {
  try {
    const value = storage?.getItem(ATTRIBUTION_STORAGE_KEY);
    return value ? JSON.parse(value) : {};
  } catch {
    return {};
  }
};

const writeAttribution = (storage, value) => {
  try {
    storage?.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Attribution must never block page loading or product flows.
  }
};

const addTouch = (target, prefix, touch) => {
  target[`${prefix}_channel`] = touch.channel;
  target[`${prefix}_source`] = touch.source;
  target[`${prefix}_medium`] = touch.medium;
  target[`${prefix}_campaign`] = touch.campaign;
  target[`${prefix}_referrer_host`] = touch.referrerHost;
  target[`${prefix}_landing_page`] = touch.landingPage;
  target[`${prefix}_timestamp`] = touch.timestamp;
};

const touchChanged = (stored, touch) => (
  stored.last_touch_channel !== touch.channel
  || stored.last_touch_source !== touch.source
  || stored.last_touch_medium !== touch.medium
  || stored.last_touch_campaign !== touch.campaign
  || stored.last_touch_referrer_host !== touch.referrerHost
);

export function captureAttribution(options = {}) {
  try {
    const browserWindow = typeof window !== 'undefined' ? window : null;
    const storage = options.storage ?? browserWindow?.localStorage;
    const url = getUrl(options.url || browserWindow?.location?.href);
    const referrer = options.referrer ?? (typeof document !== 'undefined' ? document.referrer : '');
    const timestamp = options.now || new Date().toISOString();
    const candidate = getCandidate({ url, referrer, timestamp });
    const stored = readAttribution(storage);
    if (!candidate) return stored;

    const next = { ...stored };
    if (!stored.first_touch_timestamp) addTouch(next, 'first_touch', candidate);
    if (!stored.last_touch_timestamp || (candidate.channel !== 'direct' && touchChanged(stored, candidate))) {
      addTouch(next, 'last_touch', candidate);
    }
    writeAttribution(storage, next);
    return next;
  } catch {
    return {};
  }
}

export function getAttribution(storage) {
  try {
    const browserStorage = typeof window !== 'undefined' ? window.localStorage : null;
    return readAttribution(storage ?? browserStorage);
  } catch {
    return {};
  }
}

export function getAttributionEventParams(storage) {
  const value = getAttribution(storage);
  if (!value.first_touch_timestamp && !value.last_touch_timestamp) return {};
  return {
    first_source: value.first_touch_source || '',
    first_medium: value.first_touch_medium || '',
    first_channel: value.first_touch_channel || '',
    first_campaign: value.first_touch_campaign || '',
    last_source: value.last_touch_source || '',
    last_medium: value.last_touch_medium || '',
    last_channel: value.last_touch_channel || '',
    last_campaign: value.last_touch_campaign || '',
  };
}

export function sanitizeAnalyticsUrl(value, base) {
  const input = String(value || '');
  const absolute = /^[a-z][a-z\d+.-]*:\/\//i.test(input);
  const url = getUrl(input, base || (typeof window !== 'undefined' ? window.location.origin : 'https://www.api-route.com'));
  return `${absolute ? url.origin : ''}${url.pathname}${filterQuery(url)}`;
}

export function getAnalyticsPageLocation(locationValue) {
  const current = locationValue || (typeof window !== 'undefined' ? window.location : null);
  if (!current) return '';
  if (typeof current === 'string') return sanitizeAnalyticsUrl(current);
  const href = current.href || `${current.origin || ''}${current.pathname || '/'}${current.search || ''}`;
  return sanitizeAnalyticsUrl(href, current.origin);
}

export function isSensitiveAnalyticsParam(name, value) {
  return isSensitiveParamName(name) || isSensitiveValue(value);
}
