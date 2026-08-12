import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [api, auth, logs, prefetch] = await Promise.all([
  readFile(new URL('../src/api.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/context/AuthContext.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/pages/Logs.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/utils/logPrefetch.js', import.meta.url), 'utf8'),
]);

assert.match(api, /getUserLogs = \(params, config = \{\}\)/);
assert.match(api, /getUserLogsStat = \(params, config = \{\}\)/);
assert.match(auth, /prefetchDefaultLogs\(user\.id\)/);
assert.match(logs, /prefetched\?\.logs/);
assert.match(logs, /prefetched\?\.stat/);
assert.equal(prefetch.match(/skipErrorHandler: true/g)?.length, 2);
assert.match(prefetch, /cache\.expiresAt > Date\.now\(\)/);

console.log('Log prefetch check passed.');
