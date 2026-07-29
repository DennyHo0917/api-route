import assert from 'node:assert/strict';
import { collectCustomerEmails } from '../api/customer-emails.js';
import { buildDistributorHeaders, selectDormantCustomers } from '../api/reactivation-campaign.js';

const pages = [
  { total: 4, customers: [{ email: 'A@example.com' }, { email: '-' }] },
  { total: 4, customers: [{ email: 'a@example.com' }, { email: 'b@example.com' }] },
];
const result = await collectCustomerEmails(async (page) => pages[page - 1]);

assert.deepEqual(result.emails, ['a@example.com', 'b@example.com']);
assert.equal(result.customerCount, 4);
assert.equal(result.customersWithEmail, 3);
console.log('customer email pagination check passed');

const selection = selectDormantCustomers([
  { email: 'dormant@example.com', quota: 0, used_quota: 0 },
  { email: 'funded@example.com', quota: 100, used_quota: 0 },
  { email: 'used@example.com', quota: 0, used_quota: 50 },
  { email: 'disabled@example.com', quota: 0, used_quota: 0, status: 0 },
]);

assert.deepEqual(selection.dormant, [{ email: 'dormant@example.com' }]);
assert.equal(selection.skipped.non_zero_balance, 1);
assert.equal(selection.skipped.non_zero_usage, 1);
assert.equal(selection.skipped.disabled, 1);
console.log('reactivation customer selection check passed');

const fundedUnused = selectDormantCustomers([
  { email: 'funded@example.com', quota: 100, used_quota: 0 },
  { email: 'empty@example.com', quota: 0, used_quota: 0 },
  { email: 'used@example.com', quota: 100, used_quota: 50 },
], 'funded_unused');

assert.deepEqual(fundedUnused.dormant, [{ email: 'funded@example.com' }]);
assert.equal(fundedUnused.skipped.non_positive_balance, 1);
assert.equal(fundedUnused.skipped.non_zero_usage, 1);
console.log('funded unused customer selection check passed');

assert.deepEqual(
  buildDistributorHeaders({ sessionCookie: 'cookie-value', userId: 4870 }),
  { Cookie: 'session=cookie-value', 'New-Api-User': '4870' },
);
assert.deepEqual(
  buildDistributorHeaders({ accessToken: 'token-value', userId: 4870 }),
  { Authorization: 'Bearer token-value', 'New-Api-User': '4870' },
);
console.log('distributor authentication header check passed');
