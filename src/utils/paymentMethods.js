export function formatPaymentMethodName(value, language = '') {
  const name = String(value || '').trim().replace(/\s*[（(]\s*平台\s*[）)]\s*$/g, '');
  if (!language.startsWith('zh') && name === '微信支付') return 'WeChat Pay';
  return name.replace(/支付宝|alipay/gi, 'alipay');
}

function isAlipayMethod(method) {
  return /alipay|支付宝/i.test(`${method?.type || ''} ${method?.name || ''}`);
}

export function filterVisibleTopupMethods(methods) {
  const hasPlatformAlipay = methods.some((method) => (
    /alipay|支付宝/i.test(method?.name || '') && /平台/.test(method?.name || '')
  ));
  return methods.filter((method) => (
    method?.type &&
    method.type !== 'crypto' &&
    !(hasPlatformAlipay && isAlipayMethod(method) && !/平台/.test(method?.name || ''))
  ));
}

export function getPaymentMethodLogos(method) {
  const identity = `${method?.type || ''} ${method?.name || ''}`.toLowerCase();
  if (/wxpay|wechat|微信/.test(identity)) return ['/payment-logos/wechat.svg'];
  if (/alipay|支付宝/.test(identity)) return ['/payment-logos/alipay.svg'];
  if (identity.includes('stripe')) return ['/payment-logos/stripe.svg'];
  if (identity.includes('creem')) return ['/payment-logos/creem.svg'];
  if (method?.type === 'crypto') return ['/payment-logos/usdt.svg', '/payment-logos/usdc.svg'];
  return [];
}
