const AUTH_RETURN_TO_KEY = 'dist_auth_return_to';
const AUTH_PATHS = new Set(['/login', '/register']);
const isAuthPath = (pathname) => AUTH_PATHS.has(pathname) || pathname.startsWith('/oauth/');

const toPath = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return `${value.pathname || ''}${value.search || ''}${value.hash || ''}`;
};

const getDirectReturnTo = (location) => {
  const params = new URLSearchParams(location?.search || '');
  return params.get('redirect') || params.get('next') || toPath(location?.state?.from);
};

const cleanReturnTo = (path) => {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return '/dashboard';
  const pathname = path.split(/[?#]/)[0];
  return isAuthPath(pathname) ? '/dashboard' : path;
};

const sameOriginReferrerPath = () => {
  if (typeof window === 'undefined' || !document.referrer) return '';
  try {
    const url = new URL(document.referrer);
    if (url.origin !== window.location.origin) return '';
    const path = `${url.pathname}${url.search}${url.hash}`;
    return isAuthPath(url.pathname) ? '' : path;
  } catch {
    return '';
  }
};

const storedReturnTo = () => {
  try {
    return sessionStorage.getItem(AUTH_RETURN_TO_KEY) || '';
  } catch {
    return '';
  }
};

export const rememberAuthReturnTo = (location) => {
  const currentPath = toPath(location);
  const direct = getDirectReturnTo(location);
  const pathname = currentPath.split(/[?#]/)[0];
  if (isAuthPath(pathname) && !direct) return;
  const rawPath = direct || currentPath;
  const path = cleanReturnTo(rawPath);
  try {
    sessionStorage.setItem(AUTH_RETURN_TO_KEY, path);
  } catch {
    // sessionStorage can be unavailable in restricted browser contexts.
  }
};

export const getAuthReturnTo = (location) => {
  const direct = getDirectReturnTo(location);
  return cleanReturnTo(direct || storedReturnTo() || sameOriginReferrerPath());
};
