export function formatPaymentMethodName(value, language = '') {
  const name = String(value || '').trim().replace(/\s*[（(]\s*平台\s*[）)]\s*$/g, '');
  if (!language.startsWith('zh') && name === '微信支付') return 'WeChat Pay';
  return name.replace(/支付宝|alipay/gi, 'alipay');
}

export function isVisibleTopupMethod(method) {
  return Boolean(method?.type && method.type !== 'crypto' && method.type !== 'alipay');
}
