const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'admin.html'), 'utf8');
const admin = fs.readFileSync(path.join(root, 'admin.js'), 'utf8');
const catalogue = fs.readFileSync(path.join(root, 'catalogue.js'), 'utf8');

test('Admin Studio exposes a dedicated prompt catalogue tab and editor', () => {
  assert.match(html, /data-tab="catalogue"/);
  assert.match(html, /id="categoryAdminForm"/);
  assert.match(html, /id="promptAdminForm"/);
  assert.match(html, /id="promptAdminText"/);
  assert.match(html, /id="publishPrompt"/);
});

test('Admin Studio loads category, prompt and version data after administrator authentication', () => {
  assert.match(admin, /loadPromptCatalogue\(\)/);
  assert.match(admin, /from\('identitylock_prompt_categories'\)/);
  assert.match(admin, /from\('identitylock_prompts'\)/);
  assert.match(admin, /from\('identitylock_prompt_versions'\)/);
});

test('Prompt text versions are appended, never updated or deleted', () => {
  assert.match(admin, /from\('identitylock_prompt_versions'\)\.insert/);
  assert.doesNotMatch(admin, /from\('identitylock_prompt_versions'\)\.update/);
  assert.doesNotMatch(admin, /from\('identitylock_prompt_versions'\)\.delete/);
  assert.doesNotMatch(admin, /from\('identitylock_prompts'\)\.delete/);
  assert.doesNotMatch(admin, /from\('identitylock_prompt_categories'\)\.delete/);
});

test('Customer catalogue selects only public listing metadata, not full prompt text', () => {
  assert.match(catalogue, /select\('id,slug,title,short_description,category_id,sort_order,tags'\)/);
  assert.doesNotMatch(catalogue, /select\([^)]*prompt_text/);
  assert.doesNotMatch(catalogue, /localStorage|sessionStorage/);
});
