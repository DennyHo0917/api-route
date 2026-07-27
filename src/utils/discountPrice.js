export function getDiscountPrice(currentPrice) {
  const current = Number(currentPrice);
  if (!Number.isFinite(current) || current <= 0) return null;

  const step = 10 ** Math.floor(Math.log10(current));
  const original = (Math.floor(current / step) + 1) * step;

  return {
    original,
    discountPercent: Number(((1 - current / original) * 100).toFixed(1)),
  };
}

if (typeof process !== 'undefined' && process.argv[1]?.endsWith('discountPrice.js')) {
  const checks = [
    [3888, 4000, 2.8],
    [555.43, 600, 7.4],
    [85536, 90000, 5],
    [4000, 5000, 20],
  ];

  for (const [current, original, discountPercent] of checks) {
    const result = getDiscountPrice(current);
    if (result.original !== original || result.discountPercent !== discountPercent) {
      throw new Error(`${current}: expected ${original} / ${discountPercent}%, got ${result.original} / ${result.discountPercent}%`);
    }
  }
}
