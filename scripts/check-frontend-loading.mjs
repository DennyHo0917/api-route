import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const [indexHtml, mainJs, siteContext, themeContext, vercelJson] = await Promise.all([
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../src/main.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/context/SiteContext.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/context/ThemeContext.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../vercel.json', import.meta.url), 'utf8'),
]);
const vercel = JSON.parse(vercelJson);
const rewrites = new Set(vercel.rewrites.map(({ source }) => source));
const redirects = new Map(vercel.redirects.map(({ source, destination }) => [source, destination]));

assert.match(indexHtml, /\[data-seo-prerendered="true"\]\s*\{\s*display:\s*none;/);
assert.doesNotMatch(indexHtml, /app-booting/);
assert.match(indexHtml, /<link rel="icon" type="image\/png" sizes="48x48" href="\/favicon-48x48\.png" \/>/);
assert.match(indexHtml, /<link rel="icon" href="\/favicon\.ico" sizes="any" \/>/);
assert.match(indexHtml, /<link rel="apple-touch-icon" sizes="180x180" href="\/apple-touch-icon\.png" \/>/);
assert.doesNotMatch(indexHtml, /rel="(?:shortcut )?icon"[^>]*images\/logo\.png/);
assert.doesNotMatch(mainJs, /app-booting|Promise\.all\(\[i18nReady/);
assert.match(mainJs, /i18nReady\.then/);
assert.doesNotMatch(siteContext, /setLoading/);
assert.doesNotMatch(siteContext, /upsertLink\(['"](?:icon|shortcut icon|apple-touch-icon)['"]/);
assert.doesNotMatch(themeContext, /if \(loading\)/);
assert(rewrites.has('/referrals'));
assert(rewrites.has('/:lang/referrals'));
assert.equal(redirects.get('/pricing/packages'), '/packages');
assert.equal(redirects.get('/zh/pricing/packages'), '/zh/packages');

const analyticsScript = indexHtml.match(/<script>\s*([\s\S]*?G-GZT5KLBKJ8[\s\S]*?)<\/script>/)?.[1];
assert.ok(analyticsScript);

const runAnalyticsBootstrap = (hostname) => {
  const scripts = [];
  const listeners = [];
  const document = {
    createElement: (tagName) => ({ tagName }),
    getElementById: (id) => scripts.find((script) => script.id === id) || null,
    head: { appendChild: (script) => scripts.push(script) },
  };
  const window = {
    location: { hostname },
    addEventListener: (eventName, listener, options) => listeners.push({ eventName, listener, options }),
  };
  vm.runInNewContext(analyticsScript, { document, window });
  return { listeners, scripts, window };
};

for (const hostname of ['www.api-route.com', 'api-route.com']) {
  const analytics = runAnalyticsBootstrap(hostname);
  assert.equal(typeof analytics.window.gtag, 'function');
  assert.equal(analytics.window.dataLayer.length, 2);
  assert.equal(analytics.window.dataLayer[0][0], 'js');
  assert.equal(analytics.window.dataLayer[1][0], 'config');
  assert.equal(analytics.window.dataLayer[1][2].send_page_view, false);
  assert.equal(analytics.listeners.length, 4);
  analytics.listeners.forEach(({ listener }) => listener());
  assert.equal(analytics.scripts.length, 1);
  assert.equal(analytics.scripts[0].src, 'https://www.googletagmanager.com/gtag/js?id=G-GZT5KLBKJ8');
}

for (const hostname of ['api-route-git-test.vercel.app', 'localhost', '127.0.0.1', 'staging.api-route.com']) {
  const analytics = runAnalyticsBootstrap(hostname);
  assert.equal(analytics.window.dataLayer, undefined);
  assert.equal(analytics.window.gtag, undefined);
  assert.equal(analytics.listeners.length, 0);
  assert.equal(analytics.scripts.length, 0);
}

console.log('Frontend loading check passed.');
