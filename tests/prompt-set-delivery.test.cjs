const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');

const root = path.resolve(__dirname, '..');
const filename = path.join(root, 'api/prompt-set-delivery.js');
const source = fs.readFileSync(filename, 'utf8')
  .replace('export default async function handler', 'async function handler')
  + '\nmodule.exports = handler;\n';
const loaded = new Module(filename, module);
loaded.filename = filename;
loaded.paths = Module._nodeModulePaths(path.dirname(filename));
loaded._compile(source, filename);
const handler = loaded.exports;

const reference = 'ILP-0123456789abcdef0123456789abcdef';
const items = Array.from({ length: 10 }, (_, i) => ({
  position: i + 1,
  title: 'Prompt ' + (i + 1),
  slug: 'prompt-' + (i + 1),
  prompt_text: 'Exact immutable prompt text ' + (i + 1)
}));
const oldFetch = global.fetch;
const oldSecret = process.env.SUPABASE_SECRET_KEY;
let calls;

function mockFetch(body, ok = true) {
  calls = [];
  global.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), init });
    return { ok, status: ok ? 200 : 400, json: async () => body };
  };
}
function responseRecorder() {
  return {
    statusCode: 200, body: undefined, headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
}
function req(method, ref = reference) { return { method, query: { reference: ref } }; }

test.beforeEach(() => { process.env.SUPABASE_SECRET_KEY = 'supabase_test_secret'; });
test.afterEach(() => {
  global.fetch = oldFetch;
  if (oldSecret === undefined) delete process.env.SUPABASE_SECRET_KEY;
  else process.env.SUPABASE_SECRET_KEY = oldSecret;
});

test('delivers exactly ten paid prompt snapshots without cacheable responses', async () => {
  mockFetch({ order_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', paid_at: '2026-11-04T17:00:00Z', items });
  const res = responseRecorder();
  await handler(req('GET'), res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.delivered, true);
  assert.equal(res.body.prompt_count, 10);
  assert.equal(res.body.items.length, 10);
  assert.equal(res.body.items[9].prompt_text, 'Exact immutable prompt text 10');
  assert.equal(res.headers['Cache-Control'], 'private, no-store, max-age=0');
  assert.equal(res.headers['X-Content-Type-Options'], 'nosniff');
  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /rpc\/get_identitylock_prompt_order_delivery$/);
  assert.equal(calls[0].init.headers.apikey, 'supabase_test_secret');
  assert.equal(calls[0].init.headers.Authorization, undefined);
  assert.deepEqual(JSON.parse(calls[0].init.body), { p_paystack_reference: reference });
});

test('does not deliver when the order is not paid or has no exact ten snapshots', async () => {
  mockFetch(null);
  const res = responseRecorder();
  await handler(req('GET'), res);
  assert.equal(res.statusCode, 404);
  assert.equal(res.body.delivered, undefined);
});

test('rejects malformed references before calling Supabase', async () => {
  mockFetch(null);
  const res = responseRecorder();
  await handler(req('GET', 'not-a-reference'), res);
  assert.equal(res.statusCode, 400);
  assert.equal(calls.length, 0);
});

test('rejects a delivery response with fewer than ten prompts', async () => {
  mockFetch({ paid_at: '2026-11-04T17:00:00Z', items: items.slice(0, 9) });
  const res = responseRecorder();
  await handler(req('GET'), res);
  assert.equal(res.statusCode, 404);
});

test('rejects non-GET requests', async () => {
  mockFetch(null);
  const res = responseRecorder();
  await handler(req('POST'), res);
  assert.equal(res.statusCode, 405);
  assert.equal(calls.length, 0);
});
