export const FIRST_USE_TOPUP_AMOUNT = 1;
export const DIRECT_TOPUP_AMOUNT = 10;

export function getDefaultTopupAmount(presets, suggestedAmount) {
  const suggested = Number(suggestedAmount);
  return presets.includes(suggested) ? suggested : DIRECT_TOPUP_AMOUNT;
}
