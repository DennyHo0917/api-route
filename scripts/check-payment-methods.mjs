import assert from 'node:assert/strict';
import { formatPaymentMethodName, isVisibleTopupMethod } from '../src/utils/paymentMethods.js';

assert.equal(formatPaymentMethodName('alipay(平台)', 'zh'), 'alipay');
assert.equal(formatPaymentMethodName('微信支付（平台）', 'zh'), '微信支付');
assert.equal(formatPaymentMethodName('微信支付(平台)', 'en'), 'WeChat Pay');
assert.equal(formatPaymentMethodName('微信支付(平台)', 'ja'), 'WeChat Pay');
assert.equal(isVisibleTopupMethod({ type: 'alipay' }), false);
assert.equal(isVisibleTopupMethod({ type: 'epay_alipay' }), true);

console.log('Payment method checks passed.');
