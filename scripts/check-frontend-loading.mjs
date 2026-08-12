import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [indexHtml, siteContext, themeContext, vercelJson] = await Promise.all([
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../src/context/SiteContext.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/context/ThemeContext.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../vercel.json', import.meta.url), 'utf8'),
]);
const vercel = JSON.parse(vercelJson);
const rewrites = new Set(vercel.rewrites.map(({ source }) => source));
const redirects = new Map(vercel.redirects.map(({ source, destination }) => [source, destination]));

assert.match(indexHtml, /html\.app-booting \[data-seo-prerendered="true"\]/);
assert.doesNotMatch(indexHtml, /classList\.add\(['"]js['"]\)/);
assert.doesNotMatch(siteContext, /setLoading/);
assert.doesNotMatch(themeContext, /if \(loading\)/);
assert(rewrites.has('/referrals'));
assert(rewrites.has('/:lang/referrals'));
assert.equal(redirects.get('/pricing/packages'), '/packages');
assert.equal(redirects.get('/zh/pricing/packages'), '/zh/packages');

console.log('Frontend loading check passed.');
