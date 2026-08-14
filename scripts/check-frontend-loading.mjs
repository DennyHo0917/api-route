import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

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

console.log('Frontend loading check passed.');
