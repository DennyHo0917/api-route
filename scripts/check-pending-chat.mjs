import assert from 'node:assert/strict';
import {
  consumePendingChatTopup,
  hasNoBalance,
  rememberPendingChatTopup,
} from '../src/utils/pendingChat.js';

const values = new Map();
globalThis.localStorage = {
  getItem: (key) => values.get(key) || null,
  setItem: (key, value) => values.set(key, value),
  removeItem: (key) => values.delete(key),
};

assert.equal(hasNoBalance({ quota: 0 }), true);
assert.equal(hasNoBalance({ quota: 1 }), false);
assert.equal(hasNoBalance({}), false);
assert.equal(rememberPendingChatTopup(7), true);
assert.equal(consumePendingChatTopup(8), false);
assert.equal(consumePendingChatTopup(7), true);
assert.equal(consumePendingChatTopup(7), false);

console.log('Pending chat check passed.');
