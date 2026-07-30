const ADVANCED_FIELDS = [
  'include_official_channels',
  'official_key_max_discount',
  'remain_quota',
  'expired_time',
  'unlimited_quota',
  'subrouter_sort_mode',
  'model_limits',
  'allow_ips',
];

const asBoolean = (value, fallback) => (
  value == null ? fallback : value === true || value === 1 || value === '1'
);

const asModels = (value) => (
  Array.isArray(value)
    ? value.filter(Boolean)
    : String(value || '').split(',').map((model) => model.trim()).filter(Boolean)
);

export function timestampToLocalInput(value) {
  const timestamp = Number(value);
  if (!Number.isFinite(timestamp) || timestamp <= 0) return '';
  const date = new Date(timestamp * 1000);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

export function localInputToTimestamp(value) {
  if (!value) return -1;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? Math.floor(timestamp / 1000) : -1;
}

export function createTokenForm(token = {}) {
  const discount = Number(token.official_key_max_discount);
  return {
    name: String(token.name || ''),
    key_group_id: Number(token.key_group_id) || 0,
    include_official_channels: asBoolean(token.include_official_channels, true),
    official_key_max_discount: discount > 0 ? String(discount) : '',
    remain_quota: Math.max(0, Number(token.remain_quota) || 0),
    expired_time: timestampToLocalInput(token.expired_time),
    unlimited_quota: asBoolean(token.unlimited_quota, true),
    subrouter_sort_mode: token.subrouter_sort_mode || 'token_price_first',
    model_limits: asModels(token.model_limits),
    allow_ips: String(token.allow_ips || ''),
  };
}

function serializeField(field, value) {
  if (field === 'expired_time') return localInputToTimestamp(value);
  if (field === 'model_limits') return asModels(value).join(',');
  if (field === 'official_key_max_discount') return Number(value) || 0;
  if (field === 'remain_quota') return Math.max(0, Math.round(Number(value) || 0));
  if (field === 'allow_ips') return String(value || '').trim();
  return value;
}

export function buildTokenPayload(form, initialForm, { includeGroup = false } = {}) {
  const payload = { name: form.name.trim() };
  if (includeGroup && Number(form.key_group_id) > 0) {
    payload.key_group_id = Number(form.key_group_id);
  }

  ADVANCED_FIELDS.forEach((field) => {
    const value = serializeField(field, form[field]);
    if (value !== serializeField(field, initialForm[field])) {
      payload[field] = value;
      if (field === 'model_limits') payload.model_limits_enabled = Boolean(value);
    }
  });

  return payload;
}
