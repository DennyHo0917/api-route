import assert from 'node:assert/strict';
import { getAuthReturnTo, rememberAuthReturnTo } from '../src/utils/authReturn.js';

const values = new Map();
globalThis.sessionStorage = {
  getItem: (key) => values.get(key) || null,
  setItem: (key, value) => values.set(key, value),
};
globalThis.window = { location: { origin: 'https://www.api-route.com' } };
globalThis.document = { referrer: '' };

rememberAuthReturnTo({ pathname: '/', search: '', hash: '' });
rememberAuthReturnTo({
  pathname: '/register',
  search: '',
  hash: '',
  state: { from: '/topup' },
});

assert.equal(
  getAuthReturnTo({ pathname: '/oauth/google', search: '', hash: '' }),
  '/topup',
);

rememberAuthReturnTo({ pathname: '/login', search: '', hash: '' });
assert.equal(
  getAuthReturnTo({ pathname: '/oauth/github', search: '', hash: '' }),
  '/topup',
);

console.log('Auth return check passed.');
