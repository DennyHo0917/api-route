import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  captureAttribution,
  getAnalyticsPageLocation,
  getAttributionEventParams,
} from '../src/utils/attribution.js';
import { trackEvent, trackPageView } from '../src/utils/analytics.js';

const createStorage = () => {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
  };
};

const capture = (url, referrer = '', storage = createStorage()) => ({
  storage,
  value: captureAttribution({ url, referrer, storage, now: '2026-08-15T00:00:00.000Z' }),
});

let result = capture('https://www.api-route.com/', 'https://www.google.com/search?q=ai+api');
assert.equal(result.value.first_touch_source, 'google');
assert.equal(result.value.first_touch_medium, 'organic');
assert.equal(result.value.first_touch_channel, 'organic_search');
assert.equal(JSON.stringify(result.value).includes('search?q='), false);

result = capture('https://www.api-route.com/', 'https://google.evil.com/article');
assert.equal(result.value.first_touch_source, 'google.evil.com');
assert.equal(result.value.first_touch_channel, 'referral');

result = capture('https://www.api-route.com/register', 'https://accounts.google.com/');
assert.equal(result.value.first_touch_timestamp, undefined);

result = capture('https://www.api-route.com/', 'https://www.bing.com/search?q=ai+api');
assert.equal(result.value.first_touch_source, 'bing');
assert.equal(result.value.first_touch_channel, 'organic_search');

result = capture('https://www.api-route.com/', 'https://t.co/example');
assert.equal(result.value.first_touch_source, 'x');
assert.equal(result.value.first_touch_channel, 'organic_social');

result = capture('https://www.api-route.com/', 'https://www.reddit.com/r/LocalLLaMA/');
assert.equal(result.value.first_touch_source, 'reddit');
assert.equal(result.value.first_touch_channel, 'organic_social');

result = capture(
  'https://www.api-route.com/?utm_source=newsletter&utm_medium=referral&utm_campaign=launch',
  'https://www.google.com/search?q=api-route',
);
assert.equal(result.value.first_touch_source, 'newsletter');
assert.equal(result.value.first_touch_medium, 'referral');
assert.equal(result.value.first_touch_campaign, 'launch');

result = capture('https://www.api-route.com/?gclid=test-click');
assert.equal(result.value.first_touch_source, 'google');
assert.equal(result.value.first_touch_medium, 'cpc');
assert.equal(result.value.first_touch_channel, 'paid_search');

result = capture('https://www.api-route.com/');
assert.equal(result.value.first_touch_source, '(direct)');
assert.equal(result.value.first_touch_channel, 'direct');

const persistentStorage = createStorage();
captureAttribution({
  url: 'https://www.api-route.com/?utm_source=x&utm_medium=social&utm_campaign=first',
  storage: persistentStorage,
  now: '2026-08-15T00:00:00.000Z',
});
captureAttribution({
  url: 'https://www.api-route.com/pricing',
  referrer: 'https://www.reddit.com/r/LocalLLaMA/',
  storage: persistentStorage,
  now: '2026-08-15T01:00:00.000Z',
});
let attribution = getAttributionEventParams(persistentStorage);
assert.equal(attribution.first_source, 'x');
assert.equal(attribution.last_source, 'reddit');

captureAttribution({
  url: 'https://www.api-route.com/pricing',
  storage: persistentStorage,
  now: '2026-08-15T02:00:00.000Z',
});
attribution = getAttributionEventParams(persistentStorage);
assert.equal(attribution.last_source, 'reddit');

const redirectStorage = createStorage();
const firstCampaignTouch = captureAttribution({
  url: 'https://www.api-route.com/?utm_source=x&utm_medium=social&utm_campaign=launch',
  storage: redirectStorage,
  now: '2026-08-15T00:00:00.000Z',
});
const redirectedCampaignTouch = captureAttribution({
  url: 'https://www.api-route.com/zh?utm_source=x&utm_medium=social&utm_campaign=launch',
  storage: redirectStorage,
  now: '2026-08-15T00:01:00.000Z',
});
assert.equal(redirectedCampaignTouch.last_touch_landing_page, firstCampaignTouch.last_touch_landing_page);
assert.equal(redirectedCampaignTouch.last_touch_timestamp, firstCampaignTouch.last_touch_timestamp);

captureAttribution({
  url: 'https://www.api-route.com/oauth/google?code=secret',
  referrer: 'https://accounts.google.com/',
  storage: persistentStorage,
  now: '2026-08-15T03:00:00.000Z',
});
captureAttribution({
  url: 'https://www.api-route.com/topup?payment=return',
  referrer: 'https://checkout.stripe.com/',
  storage: persistentStorage,
  now: '2026-08-15T04:00:00.000Z',
});
attribution = getAttributionEventParams(persistentStorage);
assert.equal(attribution.last_source, 'reddit');

const blockedStorage = {
  getItem: () => { throw new Error('blocked'); },
  setItem: () => { throw new Error('blocked'); },
};
assert.doesNotThrow(() => captureAttribution({ url: 'https://www.api-route.com/', storage: blockedStorage }));

const safePageLocation = getAnalyticsPageLocation(
  'https://www.api-route.com/register?utm_source=x&gclid=click&page=2&code=oauth-secret&token=secret&email=user@example.com#access_token=hidden',
);
assert.equal(safePageLocation, 'https://www.api-route.com/register?utm_source=x&gclid=click&page=2');

const calls = [];
globalThis.window = {
  gtag: (...args) => calls.push(args),
  localStorage: persistentStorage,
  location: {
    origin: 'https://www.api-route.com',
    pathname: '/register',
    search: '?utm_source=x',
    href: 'https://www.api-route.com/register?utm_source=x',
  },
};
for (const eventName of ['sign_up', 'auth_complete', 'begin_checkout', 'purchase']) {
  trackEvent(eventName, {
    method: 'email',
    email: 'user@example.com',
    code: 'secret',
    items: [{ item_id: 'plan-1', email: 'nested@example.com' }],
  });
}
assert.equal(calls.length, 4);
for (const [, eventName, params] of calls) {
  assert.ok(['sign_up', 'auth_complete', 'begin_checkout', 'purchase'].includes(eventName));
  assert.equal(params.first_source, 'x');
  assert.equal(params.last_source, 'reddit');
  assert.equal('email' in params, false);
  assert.equal('code' in params, false);
  assert.deepEqual(params.items, [{ item_id: 'plan-1' }]);
}

globalThis.window.location = {
  origin: 'https://www.api-route.com',
  pathname: '/register',
  search: '?utm_source=x&page=2&code=secret&token=secret',
  href: 'https://www.api-route.com/register?utm_source=x&page=2&code=secret&token=secret',
};
assert.equal(trackPageView('Register'), true);
assert.equal(calls[4][1], 'page_view');
assert.equal(calls[4][2].page_location, 'https://www.api-route.com/register?utm_source=x&page=2');

Object.defineProperty(globalThis.window, 'localStorage', {
  configurable: true,
  get: () => { throw new Error('blocked'); },
});
assert.doesNotThrow(() => trackEvent('purchase', { transaction_id: 'safe-id' }));
globalThis.window.gtag = () => { throw new Error('blocked'); };
assert.equal(trackEvent('purchase', { transaction_id: 'safe-id' }), false);

const registerSource = await readFile(new URL('../src/pages/Register.jsx', import.meta.url), 'utf8');
assert.equal((registerSource.match(/trackEvent\('sign_up'/g) || []).length, 1);

console.log('Attribution checks passed.');
