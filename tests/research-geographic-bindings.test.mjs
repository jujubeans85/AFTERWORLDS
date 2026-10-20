import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepareCountryGeography } from '../scripts/research-geography.mjs';
import { validateResearchBinding, validateResearchGeography } from '../src/research-data.js';
import { validDisplayAnchor } from '../src/research-geographic-anchors.js';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const registry = JSON.parse(await fs.readFile(path.join(root, 'research/designs/design-registry.json')));
export async function geographicFixture(id) {
  const design = registry.designs.find(item => item.conceptId === id), dataset = JSON.parse(await fs.readFile(path.join(root, design.datasetBindings[0].path)));
  const input = { conceptId: id, design, dataset, datasetSha256: design.datasetBindings[0].sha256 };
  const rows = validateResearchBinding(input);
  const geography = id === '378' ? null : await prepareCountryGeography(root, dataset, { anchors: ['375', '78-4'].includes(id) });
  return { ...input, rows, geography };
}
test('geographic contracts preserve exact source points, membership, ranks and same-year paired inputs', async () => {
  for (const [id, count] of [['378', 1587], ['375', 5], ['247', 14], ['78-4', 217]]) {
    const input = await geographicFixture(id); assert.equal(input.rows.length, count);
    if (input.geography) {
      validateResearchGeography(input.geography, input.rows, input.dataset.datasetId, id);
      assert.equal(input.geography.coverage.mapped, id === '78-4' ? 167 : count);
      for (const country of input.geography.countries) if (id !== '247') assert.ok(validDisplayAnchor(country.displayAnchor, country.polygons));
    }
    if (id === '378') {
      assert.equal(input.rows.filter(row => row.value === null).length, 780);
      assert.equal(new Set(input.rows.map(row => row.name)).size, 27);
      assert.equal(input.geography, null);
    }
    if (id === '78-4') { assert.equal(input.rows.filter(row => row.value === null).length, 35); assert.equal(Math.max(...input.rows.map(row => row.value || 0)), 1296257000); }
  }
});
test('geographic scope, point coordinates, binary effort and native input corruption fail closed', async () => {
  for (const [id, mutate] of [
    ['378', value => { value.dataset.rows[0].lat += .1; }],
    ['378', value => { value.dataset.rows[0].value = 0; }],
    ['378', value => { value.dataset.rows[81].uptimeFraction = 99; }],
    ['375', value => { value.dataset.rows[0].lat = 40; }],
    ['375', value => { value.dataset.rows[0].rank = 2; }],
    ['247', value => { value.dataset.rows[0].value = 1; }],
    ['78-4', value => { value.dataset.rows[1].value += 1; }],
    ['78-4', value => { value.dataset.rows[0].value = 0; }],
    ['78-4', value => { value.dataset.rows[1].populationSourceId = 'unknown'; }],
  ]) {
    const value = await geographicFixture(id); mutate(value);
    assert.throws(() => validateResearchBinding(value), /Research data:/);
  }
  const input = await geographicFixture('375'); input.geography.countries[0].displayAnchor = {lat:0,lon:0,meaning:'polygon-interior display anchor; country summary, not observed location'};
  assert.throws(() => validateResearchGeography(input.geography, input.rows, input.dataset.datasetId, '375'), /display anchor/);
});
