export const GA_MEASUREMENT_ID = 'G-GZT5KLBKJ8';

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
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_title: pageTitle,
    page_path: `${window.location.pathname}${window.location.search}`,
    page_location: window.location.href,
  });
  return true;
}
