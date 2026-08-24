import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { SEO_COPY } from '../src/content/seoCopy.js';

const files = {
  zh: 'dist/zh/ai-api-reseller-platform.html',
  en: 'dist/ai-api-reseller-platform.html',
  ja: 'dist/ja/ai-api-reseller-platform.html',
  ko: 'dist/ko/ai-api-reseller-platform.html',
};

for (const [language, file] of Object.entries(files)) {
  const html = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
  const copy = SEO_COPY[language].subSite;
  assert.match(html, /<main data-seo-prerendered="true">/);
  assert.ok(html.includes(`<h1>${copy.snapshotTitle}</h1>`));
  assert.ok(html.includes(`<p>${copy.snapshotDescription}</p>`));
  for (const section of copy.snapshotSections) {
    assert.ok(html.includes(`<h2>${section.title}</h2>`));
    if (section.body) assert.ok(html.includes(`<p>${section.body}</p>`));
    for (const item of section.items || []) assert.ok(html.includes(`<li>${item}</li>`));
  }
  assert.equal(html.match(/<h1>/g)?.length, 1);
  assert.ok(html.includes('<h2>FAQ</h2>'));
}

console.log('Reseller prerender check passed.');
