import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePromptSetCheckout, validatePaystackPromptSetTransaction } from '../api/prompt-set-core.mjs';

const ids = Array.from({ length: 10 }, (_, i) => `00000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`);
const reference = 'ILP-1234567890abcdef1234567890abcdef';
const orderId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

test('accepts exactly ten distinct UUIDs and a valid email', () => {
  const result = validatePromptSetCheckout({ email: 'buyer@example.com', prompt_ids: ids });
  assert.equal(result.ok, true);
  assert.equal(result.promptIds.length, 10);
});

test('rejects fewer than ten prompt IDs', () => {
  assert.equal(validatePromptSetCheckout({ email: 'buyer@example.com', prompt_ids: ids.slice(0, 9) }).ok, false);
});

test('rejects more than ten prompt IDs', () => {
  assert.equal(validatePromptSetCheckout({ email: 'buyer@example.com', prompt_ids: [...ids, 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'] }).ok, false);
});

test('rejects duplicate IDs even when array length is ten', () => {
  assert.equal(validatePromptSetCheckout({ email: 'buyer@example.com', prompt_ids: [...ids.slice(0, 9), ids[0]] }).ok, false);
});

test('rejects malformed UUIDs and invalid email addresses', () => {
  assert.equal(validatePromptSetCheckout({ email: 'buyer@example.com', prompt_ids: [...ids.slice(0, 9), 'not-a-uuid'] }).ok, false);
  assert.equal(validatePromptSetCheckout({ email: 'not-an-email', prompt_ids: ids }).ok, false);
});

test('does not accept client-provided price or payment fields as checkout authority', () => {
  const result = validatePromptSetCheckout({ email: 'buyer@example.com', prompt_ids: ids, amount: 1, currency: 'USD', status: 'success' });
  assert.equal(result.ok, true);
  assert.equal(result.amount, undefined);
  assert.equal(result.currency, undefined);
  assert.equal(result.status, undefined);
});

test('accepts a successful Paystack transaction matching reference, price, currency and product', () => {
  const result = validatePaystackPromptSetTransaction({
    id: 123456,
    status: 'success',
    reference,
    amount: 50000,
    currency: 'NGN',
    metadata: { product: 'identitylock-prompt-set', order_id: orderId },
    paid_at: '2026-11-04T12:00:00.000Z'
  }, reference);
  assert.equal(result.ok, true);
  assert.equal(result.orderId, orderId);
});

test('accepts Paystack metadata returned as a JSON string', () => {
  const result = validatePaystackPromptSetTransaction({
    id: 123456, status: 'success', reference, amount: 50000, currency: 'NGN',
    metadata: JSON.stringify({ product: 'identitylock-prompt-set', order_id: orderId })
  }, reference);
  assert.equal(result.ok, true);
});

test('rejects wrong amount, currency, reference, product, order ID and non-success status', () => {
  const base = {
    id: 123456, status: 'success', reference, amount: 50000, currency: 'NGN',
    metadata: { product: 'identitylock-prompt-set', order_id: orderId }
  };
  assert.equal(validatePaystackPromptSetTransaction({ ...base, amount: 49999 }, reference).ok, false);
  assert.equal(validatePaystackPromptSetTransaction({ ...base, currency: 'USD' }, reference).ok, false);
  assert.equal(validatePaystackPromptSetTransaction({ ...base, reference: 'OTHER-REF' }, reference).ok, false);
  assert.equal(validatePaystackPromptSetTransaction({ ...base, metadata: { ...base.metadata, product: 'identitylock-ai' } }, reference).ok, false);
  assert.equal(validatePaystackPromptSetTransaction({ ...base, metadata: { ...base.metadata, order_id: 'bad' } }, reference).ok, false);
  assert.equal(validatePaystackPromptSetTransaction({ ...base, status: 'pending' }, reference).ok, false);
  assert.equal(validatePaystackPromptSetTransaction({ ...base, id: 'not-numeric' }, reference).ok, false);
});
