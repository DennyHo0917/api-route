import assert from 'node:assert/strict';
import {
  DIRECT_TOPUP_AMOUNT,
  FIRST_USE_TOPUP_AMOUNT,
  getDefaultTopupAmount,
} from '../src/utils/funnel.js';

const presets = [1, 2, 5, 10, 20];

assert.equal(getDefaultTopupAmount(presets, FIRST_USE_TOPUP_AMOUNT), 1);
assert.equal(getDefaultTopupAmount(presets), DIRECT_TOPUP_AMOUNT);
assert.equal(getDefaultTopupAmount(presets, 999), DIRECT_TOPUP_AMOUNT);

console.log('Funnel checks passed.');
