import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateResearchBinding } from '../src/research-data.js';
import { CATEGORICAL_BINDINGS } from '../src/research-categorical-bindings.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const registry = JSON.parse(await fs.readFile(path.join(root, 'research/designs/design-registry.json')));
async function bundle(id) {
  const design = structuredClone(registry.designs.find(item => item.conceptId === id));
  return { conceptId: id, datasetSha256: design.datasetBindings[0].sha256, design, dataset: JSON.parse(await fs.readFile(path.join(root, design.datasetBindings[0].path))) };
}
test('twenty typed categorical bindings preserve exact row units and metadata', async () => {
  assert.equal(Object.keys(CATEGORICAL_BINDINGS).length, 20);
  for (const id of Object.keys(CATEGORICAL_BINDINGS)) {
    const value = await bundle(id), rows = validateResearchBinding(value);
    assert.deepEqual(rows.map(row => row.id), value.design.datasetBindings[0].includedRowIds);
    for (const mutate of [
      item => { item.dataset.rows[0].unit = 'percent'; },
      item => { item.dataset.rows[0].lat = 0; },
      item => { item.dataset.rows[0].period = 'current'; },
      item => { item.dataset.rows[0].value = typeof item.dataset.rows[0].value === 'number' ? '100' : 100; },
      item => { item.design.scale.type = 'linear'; item.design.scale.domain = [0, 100]; },
    ]) {
      const changed = structuredClone(value); mutate(changed);
      assert.throws(() => validateResearchBinding(changed), /Research data:/);
    }
  }
});
test('planned status, human decisions, shared endpoints and source-specific metadata fail closed', async () => {
  for (const [id, mutate] of [
    ['256', item => { item.dataset.rows[4].value = 'reported onboard at launch'; }],
    ['397', item => { item.dataset.rows[0].finalDecision = 'AI model'; }],
    ['155-17', item => { item.dataset.rows[2].toEntity = 'OpenAI'; }],
    ['415', item => { item.dataset.rows[0].announcementDate = '2025-01-01'; }],
    ['371', item => { item.dataset.rows[1].amountQualifier = 'exact'; }],
    ['382', item => { item.dataset.rows[0].measurement = 'announced floorspace'; }],
    ['356', item => { delete item.dataset.rows[0].laterStatusSourceId; }],
    ['417', item => { item.dataset.rows[0].consortiumCountries = 6; }],
    ['259', item => { item.dataset.rows[0].feedsInto = 'World Parliament'; }],
    ['170-3', item => { delete item.dataset.rows[0].hostStar; }],
  ]) {
    const changed = await bundle(id); mutate(changed);
    assert.throws(() => validateResearchBinding(changed), /Research data:/);
  }
});
