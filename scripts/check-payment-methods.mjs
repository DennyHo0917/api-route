import assert from 'node:assert/strict';
import {
  filterVisibleTopupMethods,
  formatPaymentMethodName,
  getPaymentMethodLogos,
} from '../src/utils/paymentMethods.js';

assert.equal(formatPaymentMethodName('alipay(平台)', 'zh'), 'alipay');
assert.equal(formatPaymentMethodName('微信支付（平台）', 'zh'), '微信支付');
assert.equal(formatPaymentMethodName('微信支付(平台)', 'en'), 'WeChat Pay');
assert.equal(formatPaymentMethodName('微信支付(平台)', 'ja'), 'WeChat Pay');
const visibleMethods = filterVisibleTopupMethods([
  { type: 'stripe', name: 'alipay' },
  { type: 'epay_alipay', name: 'alipay(平台)' },
  { type: 'epay_alipay', name: '微信支付(平台)' },
]);
assert.deepEqual(visibleMethods.map((method) => method.name), ['alipay(平台)', '微信支付(平台)']);
assert.deepEqual(getPaymentMethodLogos({ type: 'epay_alipay', name: '微信支付' }), ['/payment-logos/wechat.svg']);

const fallbackMethods = filterVisibleTopupMethods([
  { type: 'stripe', name: 'alipay' },
  { type: 'epay_alipay', name: '微信支付(平台)' },
]);
assert.deepEqual(fallbackMethods.map((method) => method.name), ['alipay', '微信支付(平台)']);

console.log('Payment method checks passed.');
