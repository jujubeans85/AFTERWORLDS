import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateResearchBinding } from '../src/research-data.js';
import { MIXED_BINDINGS } from '../src/research-mixed-bindings.js';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const registry = JSON.parse(await fs.readFile(path.join(root, 'research/designs/design-registry.json')));
async function fixture(id) {
  const design = structuredClone(registry.designs.find(item => item.conceptId === id));
  return { conceptId: id, design, datasetSha256: design.datasetBindings[0].sha256, dataset: JSON.parse(await fs.readFile(path.join(root, design.datasetBindings[0].path))) };
}
test('seven mixed-unit and switchable contracts preserve independent source-native panels', async () => {
  for (const [id, contract] of Object.entries(MIXED_BINDINGS)) {
    const input = await fixture(id), before = JSON.stringify(input.dataset);
    assert.equal(validateResearchBinding(input).length, contract.ids.length);
    assert.equal(JSON.stringify(input.dataset), before);
    const changed = structuredClone(input); changed.dataset.rows[0].unit = 'normalized score';
    assert.throws(() => validateResearchBinding(changed), /Research data:/);
  }
});
test('qualitative panels, optional fields, CI endpoints and denominators cannot be coerced', async () => {
  for (const [id, mutate] of [
    ['390', value => { value.dataset.rows[4].metric = 'generated'; }],
    ['390', value => { delete value.dataset.rows[0].metric; }],
    ['325', value => { value.dataset.rows[0].qualifier = null; }],
    ['325', value => { value.dataset.rows[1].sampleSizeApprox = 901; }],
    ['266-2', value => { value.dataset.rows[4].geographicId = 'TWN'; }],
    ['8-17', value => { value.dataset.rows[0].lower = 3; }],
    ['8-17', value => { value.dataset.rows[2].randomizedN = 8001; }],
    ['8-17', value => { value.dataset.rows[2].upper = 1.01; }],
    ['30-8', value => { value.dataset.rows[2].unit = 'kt CO2e'; }],
    ['111-3', value => { value.dataset.rows[2].status = 'observed'; }],
    ['365', value => { value.dataset.rows[0].sampleDenominator = 6497; }],
    ['365', value => { value.dataset.rows[0].value = 1; }],
  ]) {
    const input = await fixture(id); mutate(input); assert.throws(() => validateResearchBinding(input), /Research data:/);
  }
});
