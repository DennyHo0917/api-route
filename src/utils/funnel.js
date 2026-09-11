export const MIN_TOPUP_AMOUNT = 5;
export const FIRST_USE_TOPUP_AMOUNT = MIN_TOPUP_AMOUNT;
export const DIRECT_TOPUP_AMOUNT = 10;

export function getDefaultTopupAmount(presets, suggestedAmount) {
  const suggested = Number(suggestedAmount);
  return presets.includes(suggested) ? suggested : DIRECT_TOPUP_AMOUNT;
}

export function getPackageReturnPath(packageId, returnTo) {
  if (packageId == null || String(packageId).trim() === '') return '/packages';
  const normalizedId = String(packageId);
  if (typeof returnTo === 'string' && returnTo.startsWith('/packages?plan=')) {
    const returnedId = new URLSearchParams(returnTo.slice('/packages?'.length)).get('plan');
    if (returnedId === normalizedId) return returnTo;
  }
  return `/packages?plan=${encodeURIComponent(normalizedId)}`;
}
