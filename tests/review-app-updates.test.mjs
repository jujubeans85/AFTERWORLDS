import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepareAppUpdateReview } from '../scripts/review-app-updates.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
test('actual-app fixture preserves built app code and production pointers while staging isolated synthetic data', async t => {
  const pointer = path.join(root, 'dist/assets/research/accepted-manifest.json');
  const before = await fs.readFile(pointer);
  const { directory, record } = await prepareAppUpdateReview();
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  assert.deepEqual(await fs.readFile(pointer), before);
  for (const module of ['app.js', 'accepted-updates.js', 'research-data.js', 'research-view.js', 'research-ui.js']) {
    assert.deepEqual(await fs.readFile(path.join(directory, 'assets', module)), await fs.readFile(path.join(root, 'dist/assets', module)));
  }
  const registry = JSON.parse(await fs.readFile(path.join(directory, 'assets/registry.json')));
  assert.equal(registry.entries.find(entry => entry.id === '430').research.revision, record.baselineRevision);
  assert.equal(registry.publicOrigin, '');
  const controls = await fs.readFile(path.join(directory, 'fixture-controls.js'), 'utf8');
  assert.ok(controls.includes(record.baselineRevision));
  assert.match(controls, /fixture=preserve-me/);
  assert.doesNotMatch(controls, /__BASELINE_REVISION__/);
  assert.match(await fs.readFile(path.join(directory, 'review.html'), 'utf8'), /SYNTHETIC FIXTURE/);
});
