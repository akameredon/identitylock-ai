const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');

const repoRoot = path.resolve(__dirname, '..');
function loadVercelHandler(relativePath) {
  const filename = path.join(repoRoot, relativePath);
  const source = fs.readFileSync(filename, 'utf8')
    .replace('export default async function handler', 'async function handler')
    + '\nmodule.exports = handler;\n';
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  loaded._compile(source, filename);
  return loaded.exports;
}

const checkout = loadVercelHandler('api/prompt-set-checkout.js');
const verify = loadVercelHandler('api/prompt-set-verify.js');
const orderId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const promptIds = Array.from({ length: 10 }, (_, i) =>
  '00000000-0000-4000-8000-' + String(i + 1).padStart(12, '0')
);
const reference = 'ILP-0123456789abcdef0123456789abcdef';
const originalFetch = global.fetch;
const originalPaystack = process.env.PAYSTACK_SECRET_KEY;
const originalSupabase = process.env.SUPABASE_SECRET_KEY;
let calls;

function setFetchQueue(queue) {
  calls = [];
  global.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), init });
    const next = queue.shift();
    if (!next) throw new Error('Unexpected outbound request: ' + url);
    return {
      ok: next.ok !== false,
      status: next.status || (next.ok === false ? 400 : 200),
      json: async () => next.body
    };
  };
}
function responseRecorder() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    end(body) { this.body = body; return this; }
  };
}
function request(method, body, query) {\n  const params = new URLSearchParams(query || {});\n  return { method, body, query: query || {}, url: '/api/prompt-set-verify' + (params.toString() ? '?' + params.toString() : ''), headers: { host: 'identitylock-ai.vercel.app' } };\n}
function restoreEnvironment() {
  global.fetch = originalFetch;
  if (originalPaystack === undefined) delete process.env.PAYSTACK_SECRET_KEY;
  else process.env.PAYSTACK_SECRET_KEY = originalPaystack;
  if (originalSupabase === undefined) delete process.env.SUPABASE_SECRET_KEY;
  else process.env.SUPABASE_SECRET_KEY = originalSupabase;
}

test.beforeEach(() => {
  process.env.PAYSTACK_SECRET_KEY = 'paystack_test_secret';
  process.env.SUPABASE_SECRET_KEY = 'supabase_test_secret';
});
test.afterEach(restoreEnvironment);

test('checkout creates an immutable order first and initializes fixed ₦500 Paystack checkout', async () => {
  setFetchQueue([
    { body: orderId },
    { body: { status: true, data: { authorization_url: 'https://checkout.paystack.com/test' } } }
  ]);
  const res = responseRecorder();
  await checkout(request('POST', { email: 'buyer@example.com', prompt_ids: promptIds }), res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.authorization_url, 'https://checkout.paystack.com/test');
  assert.equal(res.body.amount_kobo, 50000);
  assert.equal(res.body.currency, 'NGN');
  assert.match(res.body.reference, /^ILP-[A-Za-z0-9]{32}$/);
  assert.equal(calls.length, 2);
  assert.match(calls[0].url, /rpc\/create_identitylock_prompt_order$/);
  assert.equal(calls[0].init.headers.apikey, 'supabase_test_secret');
  assert.equal(calls[0].init.headers.Authorization, undefined);
  const orderPayload = JSON.parse(calls[0].init.body);
  assert.equal(orderPayload.p_email, 'buyer@example.com');
  assert.deepEqual(orderPayload.p_prompt_ids, promptIds);
  const paystackPayload = JSON.parse(calls[1].init.body);
  assert.equal(paystackPayload.amount, 50000);
  assert.equal(paystackPayload.currency, 'NGN');
  assert.equal(paystackPayload.metadata.product, 'identitylock-prompt-set');
  assert.equal(paystackPayload.metadata.order_id, orderId);
});

test('checkout rejects fewer than ten prompts before making outbound requests', async () => {
  setFetchQueue([]);
  const res = responseRecorder();
  await checkout(request('POST', { email: 'buyer@example.com', prompt_ids: promptIds.slice(0, 9) }), res);
  assert.equal(res.statusCode, 400);
  assert.equal(calls.length, 0);
});

test('checkout returns a safe conflict when any selected prompt is not published', async () => {
  setFetchQueue([{ ok: false, body: { message: 'All 10 prompts must be currently published with an active category and current version' } }]);
  const res = responseRecorder();
  await checkout(request('POST', { email: 'buyer@example.com', prompt_ids: promptIds }), res);
  assert.equal(res.statusCode, 409);
  assert.match(res.body.error, /no longer available/i);
  assert.equal(calls.length, 1);
});

test('verification validates Paystack transaction then marks the exact order paid', async () => {
  setFetchQueue([
    { body: { status: true, data: {
      id: 123456789, status: 'success', reference, amount: 50000, currency: 'NGN',
      paid_at: '2026-11-04T17:00:00.000Z',
      metadata: { product: 'identitylock-prompt-set', order_id: orderId }
    } } },
    { body: true }
  ]);
  const res = responseRecorder();
  await verify(request('GET', null, { reference }), res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.paid, true);
  assert.equal(res.body.order_id, orderId);
  assert.equal(res.body.prompt_count, 10);
  assert.equal(calls.length, 2);
  assert.match(calls[0].url, /transaction\/verify\//);
  assert.equal(calls[0].init.headers.Authorization, 'Bearer paystack_test_secret');
  assert.match(calls[1].url, /rpc\/mark_identitylock_prompt_order_paid$/);
  assert.equal(calls[1].init.headers.apikey, 'supabase_test_secret');
  assert.equal(calls[1].init.headers.Authorization, undefined);
  const paidPayload = JSON.parse(calls[1].init.body);
  assert.equal(paidPayload.p_order_id, orderId);
  assert.equal(paidPayload.p_paystack_reference, reference);
  assert.equal(paidPayload.p_transaction_id, '123456789');
  assert.equal(paidPayload.p_amount_kobo, 50000);
  assert.equal(paidPayload.p_currency, 'NGN');
});

test('verification refuses an amount mismatch without marking an order paid', async () => {
  setFetchQueue([{ body: { status: true, data: {
    id: 123456789, status: 'success', reference, amount: 49900, currency: 'NGN',
    metadata: { product: 'identitylock-prompt-set', order_id: orderId }
  } } }]);
  const res = responseRecorder();
  await verify(request('GET', null, { reference }), res);
  assert.equal(res.statusCode, 402);
  assert.equal(res.body.paid, false);
  assert.equal(calls.length, 1);
});

test('verification refuses a failed atomic database transition', async () => {
  setFetchQueue([
    { body: { status: true, data: {
      id: 123456789, status: 'success', reference, amount: 50000, currency: 'NGN',
      metadata: { product: 'identitylock-prompt-set', order_id: orderId }
    } } },
    { body: false }
  ]);
  const res = responseRecorder();
  await verify(request('GET', null, { reference }), res);
  assert.equal(res.statusCode, 409);
  assert.equal(res.body.paid, false);
  assert.equal(calls.length, 2);
});
