import {
  getAnalyticsPageLocation,
  getAttributionEventParams,
  isSensitiveAnalyticsParam,
  sanitizeAnalyticsUrl,
} from './attribution.js';

export const GA_MEASUREMENT_ID = 'G-GZT5KLBKJ8';

const ATTRIBUTED_EVENTS = new Set(['sign_up', 'auth_complete', 'begin_checkout', 'purchase']);

const sanitizeEventValue = (name, value) => {
  if (typeof value === 'string') {
    if (isSensitiveAnalyticsParam(name, value)) return undefined;
    if (name === 'return_to' || name.endsWith('_url') || name.endsWith('_location')) {
      return sanitizeAnalyticsUrl(value);
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => (item && typeof item === 'object' ? sanitizeEventParams(item) : sanitizeEventValue(name, item)))
      .filter((item) => item !== undefined);
  }
  if (value && typeof value === 'object') return sanitizeEventParams(value);
  return value;
};

const sanitizeEventParams = (params) => Object.fromEntries(
  Object.entries(params || {}).flatMap(([name, value]) => {
    const sanitizedValue = sanitizeEventValue(name, value);
    return sanitizedValue === undefined ? [] : [[name, sanitizedValue]];
  }),
);

export function trackEvent(name, params = {}) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return false;
  try {
    const attribution = ATTRIBUTED_EVENTS.has(name) ? getAttributionEventParams() : {};
    window.gtag('event', name, sanitizeEventParams({ ...params, ...attribution }));
    return true;
  } catch {
    return false;
  }
}

export function trackEventOnce(storageKey, name, params = {}) {
  if (typeof window === 'undefined') return false;
  try {
    if (window.localStorage.getItem(storageKey)) return true;
  } catch {
    // Analytics must never block the product flow.
  }
  const sent = trackEvent(name, params);
  if (sent) {
    try {
      window.localStorage.setItem(storageKey, '1');
    } catch {
      // Best-effort de-duplication only.
    }
  }
  return sent;
}

export function trackPageView(pageTitle) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return false;
  try {
    window.gtag('event', 'page_view', {
      page_title: pageTitle,
      page_location: getAnalyticsPageLocation(),
      send_to: GA_MEASUREMENT_ID,
    });
    return true;
  } catch {
    return false;
  }
}
