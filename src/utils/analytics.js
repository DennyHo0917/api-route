export const GA_MEASUREMENT_ID = 'G-GZT5KLBKJ8';

const SENSITIVE_QUERY_KEYS = new Set([
  'code',
  'state',
  'token',
  'access_token',
  'id_token',
  'refresh_token',
  'password',
  'email',
]);

export function trackEvent(name, params = {}) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return false;
  window.gtag('event', name, params);
  return true;
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
  const safeUrl = new URL(window.location.href);
  if (safeUrl.pathname.startsWith('/oauth/')) {
    safeUrl.search = '';
  } else {
    for (const key of [...safeUrl.searchParams.keys()]) {
      if (SENSITIVE_QUERY_KEYS.has(key.toLowerCase())) safeUrl.searchParams.delete(key);
    }
  }
  safeUrl.hash = '';
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_title: pageTitle,
    page_path: `${safeUrl.pathname}${safeUrl.search}`,
    page_location: safeUrl.toString(),
  });
  return true;
}
