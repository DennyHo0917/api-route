const PENDING_CHAT_TOPUP_KEY = 'dist_pending_chat_topup';

export const hasNoBalance = (user) => (
  user?.quota != null && Number(user.quota) <= 0
);

export function rememberPendingChatTopup(userId) {
  try {
    localStorage.setItem(PENDING_CHAT_TOPUP_KEY, String(userId));
    return true;
  } catch {
    return false;
  }
}

export function consumePendingChatTopup(userId) {
  try {
    if (localStorage.getItem(PENDING_CHAT_TOPUP_KEY) !== String(userId)) return false;
    localStorage.removeItem(PENDING_CHAT_TOPUP_KEY);
    return true;
  } catch {
    return false;
  }
}
