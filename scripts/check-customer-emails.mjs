import assert from 'node:assert/strict';
import { collectCustomerEmails } from '../api/customer-emails.js';

const pages = [
  { total: 4, customers: [{ email: 'A@example.com' }, { email: '-' }] },
  { total: 4, customers: [{ email: 'a@example.com' }, { email: 'b@example.com' }] },
];
const result = await collectCustomerEmails(async (page) => pages[page - 1]);

assert.deepEqual(result.emails, ['a@example.com', 'b@example.com']);
assert.equal(result.customerCount, 4);
assert.equal(result.customersWithEmail, 3);
console.log('customer email pagination check passed');
