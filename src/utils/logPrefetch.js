import { getUserLogs, getUserLogsStat } from '../api';

const DEFAULT_LOG_PARAMS = { type: '0', p: 1, page_size: 20 };
const CACHE_TTL = 2 * 60 * 1000;
let cache = null;

export function prefetchDefaultLogs(userId) {
  const key = String(userId || '');
  if (!key) return Promise.resolve(null);
  if (cache?.key === key && cache.expiresAt > Date.now()) return cache.promise;

  const promise = Promise.all([
    getUserLogs(DEFAULT_LOG_PARAMS, { skipErrorHandler: true }),
    getUserLogsStat({ type: '0' }, { skipErrorHandler: true }),
  ]).then(([logs, stat]) => {
    if (!logs.data.success || !stat.data.success) throw new Error('Log prefetch failed');
    return { logs, stat };
  });
  cache = { key, promise, expiresAt: Date.now() + CACHE_TTL };
  promise.catch(() => {
    if (cache?.promise === promise) cache = null;
  });
  return promise;
}

export function clearDefaultLogsPrefetch() {
  cache = null;
}
