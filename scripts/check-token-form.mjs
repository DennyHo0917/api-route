import assert from 'node:assert/strict';
import { buildTokenPayload, createTokenForm, localInputToTimestamp } from '../src/utils/tokenForm.js';

const basic = createTokenForm({ name: ' demo ', key_group_id: 3 });
assert.deepEqual(buildTokenPayload(basic, basic, { includeGroup: true }), {
  name: 'demo',
  key_group_id: 3,
});

const advanced = {
  ...basic,
  unlimited_quota: false,
  remain_quota: 500000,
  expired_time: '2030-01-02T03:04',
  model_limits: ['gpt-5', 'claude-sonnet'],
  allow_ips: '127.0.0.1',
};
assert.deepEqual(buildTokenPayload(advanced, basic), {
  name: 'demo',
  remain_quota: 500000,
  expired_time: localInputToTimestamp('2030-01-02T03:04'),
  unlimited_quota: false,
  model_limits: 'gpt-5,claude-sonnet',
  model_limits_enabled: true,
  allow_ips: '127.0.0.1',
});

const existing = createTokenForm({
  name: 'old',
  remain_quota: 500000,
  unlimited_quota: false,
  model_limits: 'gpt-5',
});
assert.deepEqual(buildTokenPayload({ ...existing, name: 'new' }, existing), { name: 'new' });

console.log('token form checks passed');
