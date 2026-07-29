import assert from 'node:assert/strict';
import { collectCustomerEmails } from '../api/customer-emails.js';
import { selectDormantCustomers } from '../api/reactivation-campaign.js';

const pages = [
  { total: 4, customers: [{ email: 'A@example.com' }, { email: '-' }] },
  { total: 4, customers: [{ email: 'a@example.com' }, { email: 'b@example.com' }] },
];
const result = await collectCustomerEmails(async (page) => pages[page - 1]);

assert.deepEqual(result.emails, ['a@example.com', 'b@example.com']);
assert.equal(result.customerCount, 4);
assert.equal(result.customersWithEmail, 3);
console.log('customer email pagination check passed');

const now = 2_000_000_000;
const day = 86400;
const selection = selectDormantCustomers([
  { id: 1, email: 'active@example.com', created_at: now - 60 * day },
  { id: 2, email: 'dormant@example.com', created_at: now - 60 * day },
  { id: 3, email: 'new@example.com', created_at: now - 3 * day },
  { id: 4, email: 'disabled@example.com', created_at: now - 60 * day, status: 0 },
], [
  { user_id: 1, created_at: now - day },
  { user_id: 2, created_at: now - 40 * day },
], 30, now);

assert.deepEqual(selection.dormant, [{ email: 'dormant@example.com' }]);
assert.equal(selection.skipped.recently_active, 1);
assert.equal(selection.skipped.too_new, 1);
assert.equal(selection.skipped.disabled, 1);
console.log('reactivation customer selection check passed');
