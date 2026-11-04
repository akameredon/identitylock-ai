const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const homepage = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const legacy = fs.readFileSync(path.join(root, 'legacy-bundle.html'), 'utf8');
const catalogue = fs.readFileSync(path.join(root, 'catalogue.js'), 'utf8');
const homeScript = fs.readFileSync(path.join(root, 'homepage.js'), 'utf8');
const legacyScript = fs.readFileSync(path.join(root, 'script.js'), 'utf8');

test('primary homepage routes customers to the choose-any-ten catalogue', () => {
  assert.match(homepage, /href="\/catalogue\.html"/);
  assert.match(homepage, /Choose my 10 prompts/);
  assert.doesNotMatch(homepage, /id="checkout"/);
  assert.doesNotMatch(homepage, /src="\/script\.js"/);
});

test('legacy fixed bundle remains separately available and retains its checkout handler', () => {
  assert.match(legacy, /name="robots" content="noindex,nofollow"/);
  assert.match(legacy, /id="checkout"/);
  assert.match(legacy, /src="\/script\.js"/);
  assert.match(legacyScript, /\/api\/checkout/);
  assert.match(homepage, /\/legacy-bundle\.html/);
});

test('catalogue submits the selected ten prompt IDs to the secure checkout API', () => {
  assert.match(catalogue, /LIMIT=10/);
  assert.match(catalogue, /fetch\('\/api\/prompt-set-checkout'/);
  assert.match(catalogue, /prompt_ids:promptIds/);
});

test('homepage list renderer supports a final plus-marked benefit row', () => {
  assert.match(homeScript, /line\.trim\(\)\.startsWith\('\+'\)/);
  assert.match(homeScript, /line\.replace\(/);
});
