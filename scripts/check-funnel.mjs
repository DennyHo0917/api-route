import assert from 'node:assert/strict';
import {
  DIRECT_TOPUP_AMOUNT,
  FIRST_USE_TOPUP_AMOUNT,
  MIN_TOPUP_AMOUNT,
  getDefaultTopupAmount,
  getPackageReturnPath,
} from '../src/utils/funnel.js';

const presets = [5, 10, 20, 50, 100, 200, 500, 1000];

assert.equal(MIN_TOPUP_AMOUNT, 5);
assert.equal(getDefaultTopupAmount(presets, FIRST_USE_TOPUP_AMOUNT), 5);
assert.equal(getDefaultTopupAmount(presets), DIRECT_TOPUP_AMOUNT);
assert.equal(getDefaultTopupAmount(presets, 999), DIRECT_TOPUP_AMOUNT);
assert.equal(getPackageReturnPath(42), '/packages?plan=42');
assert.equal(getPackageReturnPath('a/b'), '/packages?plan=a%2Fb');
assert.equal(getPackageReturnPath(42, '/packages?plan=42'), '/packages?plan=42');
assert.equal(getPackageReturnPath(42, '/packages?plan=99'), '/packages?plan=42');
assert.equal(getPackageReturnPath(null), '/packages');
assert.equal(getPackageReturnPath(undefined, '/packages?plan=42'), '/packages');

console.log('Funnel checks passed.');
