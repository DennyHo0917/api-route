const AUTH_RETURN_TO_KEY = 'dist_auth_return_to';
const AUTH_PATHS = new Set(['/login', '/register']);

const toPath = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return `${value.pathname || ''}${value.search || ''}${value.hash || ''}`;
};

const cleanReturnTo = (path) => {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return '/dashboard';
  const pathname = path.split(/[?#]/)[0];
  return AUTH_PATHS.has(pathname) ? '/dashboard' : path;
};

const sameOriginReferrerPath = () => {
  if (typeof window === 'undefined' || !document.referrer) return '';
  try {
    const url = new URL(document.referrer);
    if (url.origin !== window.location.origin) return '';
    const path = `${url.pathname}${url.search}${url.hash}`;
    return AUTH_PATHS.has(url.pathname) ? '' : path;
  } catch {
    return '';
  }
};

export const rememberAuthReturnTo = (location) => {
  const rawPath = toPath(location);
  const pathname = rawPath.split(/[?#]/)[0];
  if (AUTH_PATHS.has(pathname)) return;
  const path = cleanReturnTo(rawPath);
  try {
    sessionStorage.setItem(AUTH_RETURN_TO_KEY, path);
  } catch {
    // sessionStorage can be unavailable in restricted browser contexts.
  }
};

export const getAuthReturnTo = (location) => {
  const params = new URLSearchParams(location.search || '');
  const direct = params.get('redirect') || params.get('next') || toPath(location.state?.from);
  if (direct) return cleanReturnTo(direct);
  const referrer = sameOriginReferrerPath();
  if (referrer) return cleanReturnTo(referrer);
  try {
    return cleanReturnTo(sessionStorage.getItem(AUTH_RETURN_TO_KEY));
  } catch {
    return '/dashboard';
  }
};
