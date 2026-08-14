import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DOCS_COPY } from '../src/content/docsCopy.js';
import { getLocalizedPath } from '../src/i18n/languageUtils.js';

const SITE_URL = 'https://www.api-route.com';
const languages = {
  en: { hrefLang: 'en', file: 'dist/docs/overview.html' },
  zh: { hrefLang: 'zh-CN', file: 'dist/zh/docs/overview.html' },
  ja: { hrefLang: 'ja', file: 'dist/ja/docs/overview.html' },
  ko: { hrefLang: 'ko', file: 'dist/ko/docs/overview.html' },
};

const [appSource, consoleLayout, overviewSource, quickstartSource, sitemap, vercelSource] = await Promise.all([
  readFile(new URL('../src/App.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/ConsoleLayout.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/pages/DocsOverview.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/pages/DocsQuickstart.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../public/sitemap.xml', import.meta.url), 'utf8'),
  readFile(new URL('../vercel.json', import.meta.url), 'utf8'),
]);

assert.match(appSource, /path="\/docs" element={<Navigate to="\/docs\/overview" replace \/>}/);
assert.match(appSource, /path="\/docs\/overview" element={<DocsOverview \/>}/);
assert.match(appSource, /path="\/docs\/quickstart" element={<DocsQuickstart \/>}/);
assert.match(consoleLayout, /to: '\/docs\/overview', activePrefix: '\/docs'/);
assert.match(quickstartSource, /<DocsPageFrame activeSection={activeSection} directory={copy\.directory}>/);

const redirects = JSON.parse(vercelSource).redirects;
for (const [source, destination] of [
  ['/docs', '/docs/overview'],
  ['/en/docs', '/docs/overview'],
  ['/zh/docs', '/zh/docs/overview'],
  ['/ja/docs', '/ja/docs/overview'],
  ['/ko/docs', '/ko/docs/overview'],
]) {
  assert.ok(redirects.some((redirect) => (
    redirect.source === source
      && redirect.destination === destination
      && redirect.permanent === true
  )));
}

for (const [language, config] of Object.entries(languages)) {
  const html = await readFile(new URL(`../${config.file}`, import.meta.url), 'utf8');
  const canonical = `${SITE_URL}${getLocalizedPath('/docs/overview', language)}`;
  const copy = DOCS_COPY[language].overview;

  assert.equal(copy.directory.length, 6);
  assert.equal(new Set(copy.directory.map(([id]) => id)).size, 6);
  for (const [id] of copy.directory) assert.ok(overviewSource.includes(`id="${id}"`));

  assert.ok(html.includes(`<link rel="canonical" href="${canonical}" />`));
  assert.ok(html.includes(`<h1>${copy.title}</h1>`));
  assert.equal(html.match(/<h1>/g)?.length, 1);
  assert.equal(html.match(/<h2>/g)?.length, 6);
  assert.ok(html.includes(`<h2>${copy.alternatives.title}</h2>`));
  assert.ok(html.includes(`<h3>${copy.alternatives.openRouter.title}</h3>`));
  assert.ok(html.includes(`<h3>${copy.routing.multiRouteTitle}</h3>`));
  assert.ok(html.includes(`<h3>${copy.pricing.lowerTitle}</h3>`));
  assert.ok(html.includes('<main data-seo-prerendered="true">'));
  assert.ok(html.includes('<table><caption>'));
  assert.ok(html.includes('"@type":"BreadcrumbList"'));
  assert.ok(!html.includes('"@type":"FAQPage"'));
  assert.match(copy.workflow.steps[0][1], /Google/);
  assert.match(copy.workflow.steps[0][1], /X/);
  assert.match(copy.workflow.steps[0][1], /GitHub/);

  for (const [alternateLanguage, alternateConfig] of Object.entries(languages)) {
    const alternateUrl = `${SITE_URL}${getLocalizedPath('/docs/overview', alternateLanguage)}`;
    assert.ok(html.includes(`hreflang="${alternateConfig.hrefLang}" href="${alternateUrl}"`));
  }
  assert.ok(html.includes(`hreflang="x-default" href="${SITE_URL}/docs/overview"`));
  assert.ok(sitemap.includes(`<loc>${canonical}</loc>`));
}

for (const phrase of [
  'OpenAI-compatible multi-model API',
  'multi-provider routing',
  'automatic failover',
  'transparent pricing',
  'OpenRouter alternative',
]) {
  assert.ok(DOCS_COPY.en.overview.seoDescription.includes(phrase));
}
