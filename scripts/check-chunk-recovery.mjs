import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  CHUNK_RECOVERY_WINDOW_MS,
  CHUNK_RELOAD_KEY,
  createChunkRecovery,
  isChunkLoadError,
} from '../src/utils/chunkRecovery.js';

const chunkErrors = [
  'Failed to fetch dynamically imported module',
  'Importing a module script failed',
  'ChunkLoadError',
  'Loading chunk 42 failed',
  'error loading dynamically imported module',
];
chunkErrors.forEach((message) => assert.equal(isChunkLoadError(new Error(message)), true));
assert.equal(isChunkLoadError(new Error('Ordinary React render error')), false);

const values = new Map();
const storage = {
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, value),
};
let reloads = 0;
let currentTime = 100_000;
const firstPageRecovery = createChunkRecovery({
  getStorage: () => storage,
  reload: () => { reloads += 1; },
  now: () => currentTime,
});

assert.equal(firstPageRecovery(new Error(chunkErrors[0])), 'recovering');
assert.equal(reloads, 1);
assert.equal(values.get(CHUNK_RELOAD_KEY), String(currentTime));
assert.equal(firstPageRecovery(new Error(chunkErrors[2])), 'recovering');
assert.equal(reloads, 1);

const reloadedPageRecovery = createChunkRecovery({
  getStorage: () => storage,
  reload: () => { reloads += 1; },
  now: () => currentTime + 1_000,
});
assert.equal(reloadedPageRecovery(new Error(chunkErrors[1])), 'exhausted');
assert.equal(reloads, 1);
assert.equal(reloadedPageRecovery(new Error('Ordinary React render error')), 'ignored');

currentTime += CHUNK_RECOVERY_WINDOW_MS + 1;
const laterRecovery = createChunkRecovery({
  getStorage: () => storage,
  reload: () => { reloads += 1; },
  now: () => currentTime,
});
assert.equal(laterRecovery(new Error(chunkErrors[4])), 'recovering');
assert.equal(reloads, 2);

const blockedStorageRecovery = createChunkRecovery({
  getStorage: () => { throw new Error('Storage blocked'); },
  reload: () => { reloads += 1; },
});
assert.equal(blockedStorageRecovery(new Error(chunkErrors[3])), 'exhausted');
assert.equal(reloads, 2);

const [mainSource, vercelSource] = await Promise.all([
  readFile(new URL('../src/main.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../vercel.json', import.meta.url), 'utf8'),
]);
assert.match(mainSource, /addEventListener\('vite:preloadError'/);
assert.match(mainSource, /addEventListener\('unhandledrejection'/);
assert.match(mainSource, /event\.preventDefault\(\)/);
assert.match(mainSource, /status:\s*isChunkLoadError\(error\)\s*\?\s*'recovering'\s*:\s*'fatal'/);
assert.doesNotMatch(mainSource, /getDerivedStateFromError\(\)\s*\{\s*return\s*\{\s*failed:\s*true/);
assert(mainSource.indexOf("addEventListener('vite:preloadError'") < mainSource.indexOf('ReactDOM.createRoot'));
['en', 'zh', 'ja', 'ko'].forEach((language) => {
  assert.match(mainSource, new RegExp(`\\b${language}: \\{ title:`));
});

const vercel = JSON.parse(vercelSource);
const cacheHeaders = new Map(vercel.headers.map(({ source, headers }) => [
  source,
  headers.find(({ key }) => key.toLowerCase() === 'cache-control')?.value,
]));
assert.equal(cacheHeaders.get('/'), 'no-cache, must-revalidate');
assert.equal(
  cacheHeaders.get('/:path((?!assets/|api/|v1/|.*\\.[^/]+$).*)'),
  'no-cache, must-revalidate',
);
assert.equal(cacheHeaders.get('/assets/:path*'), 'public, max-age=31536000, immutable');

console.log('Chunk recovery checks passed.');
