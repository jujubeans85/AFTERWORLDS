import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateResearchBinding } from '../src/research-data.js';
import { LINEAR_BINDINGS } from '../src/research-linear-bindings.js';
import { auditResearchRuntime } from '../scripts/audit-research-runtime.mjs';
import { prepareDesignAmendment } from '../scripts/research-design-amendments.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const registry = JSON.parse(await fs.readFile(path.join(root, 'research/designs/design-registry.json')));
async function bundle(id) {
  const design = structuredClone(registry.designs.find(item => item.conceptId === id));
  const amended = ['156-8', '74'].includes(id) ? await prepareDesignAmendment(root, id, design, design.datasetBindings[0].sha256) : null;
  return { conceptId: id, datasetSha256: design.datasetBindings[0].sha256, design: amended?.design || design, dataset: JSON.parse(await fs.readFile(path.join(root, design.datasetBindings[0].path))) };
}
test('native ruler and count adapters retain exact source scope and reject denominator changes', async () => {
  for (const id of Object.keys(LINEAR_BINDINGS)) {
    const value = await bundle(id);
    assert.equal(validateResearchBinding(value).length, LINEAR_BINDINGS[id].rowIds.length);
    for (const mutate of [
      item => { item.dataset.rows.find(row => row.id === item.design.datasetBindings[0].includedRowIds[0]).unit = 'unsupported converted unit'; },
      item => { item.dataset.rows.find(row => row.id === item.design.datasetBindings[0].includedRowIds[0]).period = '2026'; },
      item => { item.dataset.rows.find(row => row.id === item.design.datasetBindings[0].includedRowIds[0]).value = item.design.scale.domain[1] * 2; },
      item => { item.design.scale.domain[1] *= 2; },
      item => { item.dataset.rows.find(row => row.id === item.design.datasetBindings[0].includedRowIds[0]).lat = 0; },
    ]) {
      const changed = structuredClone(value); mutate(changed);
      assert.throws(() => validateResearchBinding(changed), /Research data:/);
    }
  }
});
test('incompatible accounts, nested capacity and source score definition fail closed', async () => {
  for (const [id, mutate] of [
    ['369', item => { item.dataset.rows.find(row => row.id === item.design.datasetBindings[0].includedRowIds[0]).measureType = 'national GDP'; }],
    ['385', item => { item.dataset.rows.find(row => row.id === item.design.datasetBindings[0].includedRowIds[0]).status = 'observed'; }],
    ['324', item => { item.dataset.rows[2].incrementalMW = 690; }],
    ['409', item => { item.dataset.rows.find(row => row.id === item.design.datasetBindings[0].includedRowIds[0]).territoryCount = 250; }],
    ['372', item => { item.dataset.rows.find(row => row.id === item.design.datasetBindings[0].includedRowIds[0]).value = 2.5; }],
    ['333', item => { item.dataset.rows[1].namedCountries = ['Canada']; }],
    ['63-8', item => { item.dataset.rows.find(row => row.id === item.design.datasetBindings[0].includedRowIds[0]).value = 2; }],
    ['364', item => { item.dataset.rows.find(row => row.id === item.design.datasetBindings[0].includedRowIds[0]).denominator = 10; }],
    ['320', item => { item.dataset.rows.find(row => row.id === item.design.datasetBindings[0].includedRowIds[0]).timeBasis = 'paid hours only'; }],
    ['138-8', item => { item.dataset.rows.find(row => row.id === item.design.datasetBindings[0].includedRowIds[0]).publishedPercent = 100 * 560 / 832; }],
    ['8-6', item => { item.dataset.rows[1].analyzedN = 83; }],
    ['8-6', item => { item.dataset.rows.find(row => row.id === item.design.datasetBindings[0].includedRowIds[0]).ci95 = [90, 100]; }],
    ['422-2', item => { item.dataset.rows[2].exposureCategory = 'any exposure'; }],
    ['233-2', item => { item.dataset.rows.find(row => row.id === item.design.datasetBindings[0].includedRowIds[0]).target = 'forecast accuracy'; }],
    ['428', item => { item.dataset.rows[6].period = '2025-H1'; }],
    ['407', item => { item.dataset.rows[4].sampleScope = 'Adult population within age range'; }],
    ['284', item => { item.dataset.rows.find(row => row.id === item.design.datasetBindings[0].includedRowIds[0]).rank = 2; }],
    ['117', item => { item.design.scale.type = 'linear'; }],
    ['117', item => { item.dataset.rows.find(row => row.id === item.design.datasetBindings[0].includedRowIds[0]).estimateConfidence = 0.9; }],
    ['398', item => { item.dataset.rows.find(row => row.id === item.design.datasetBindings[0].includedRowIds[0]).ci95 = [0, 1]; }],
    ['392', item => { item.dataset.rows.find(row => row.id === item.design.datasetBindings[0].includedRowIds[0]).testSampleN = 13; }],
    ['323', item => { item.dataset.rows.find(row => row.id === item.design.datasetBindings[0].includedRowIds[0]).qualifier = null; }],
    ['218', item => { item.design.datasetBindings[0].includedRowIds[0] = 'gemma-0-1'; }],
    ['218', item => { item.dataset.rows[1].name = 'Gemma4 E4B IT Thinking'; }],
    ['211-4', item => { item.dataset.rows.find(row => row.id === item.design.datasetBindings[0].includedRowIds[0]).ciUpper = 0; }],
    ['211-4', item => { item.dataset.rows[1].waymoCrashCount += 1; }],
    ['211-4', item => { item.dataset.rows.find(row => row.id === item.design.datasetBindings[0].includedRowIds[0]).confidenceLevel = 0.9; }],
    ['74', item => { item.design.datasetBindings[0].filter.all[1].values[1] = 'AIME2026'; }],
    ['115-2', item => { item.dataset.rows.find(row => row.id === item.design.datasetBindings[0].includedRowIds[0]).metric = 'user_accuracy'; }],
  ]) {
    const changed = await bundle(id); mutate(changed);
    assert.throws(() => validateResearchBinding(changed), /Research data:/);
  }
});
test('planning audit keeps derived counts distinct from percentage domains and preserves extras', async () => {
  const report = await auditResearchRuntime(root);
  assert.equal(report.acceptedCount, 73);
  const cyber = report.concepts.find(item => item.conceptId === '138-8');
  assert.equal(cyber.group, 'derived-percentage-with-overlap');
  assert.deepEqual(cyber.datasets[0].rawValuesOutsideDeclaredDomain, ['cyber-malware']);
  assert.ok(report.concepts.find(item => item.conceptId === '324').datasets[0].extraFields.includes('incrementalMW'));
  assert.equal(report.concepts.find(item => item.conceptId === '232').datasets[0].unitAliasRequired, true);
});
test('reviewed subset selects exactly twelve benchmark rows while preserving the full source dataset', async () => {
  const value = await bundle('218');
  const before = JSON.stringify(value.dataset);
  const rows = validateResearchBinding(value);
  assert.equal(rows.length, 12);
  assert.equal(value.dataset.rows.length, 18);
  assert.equal(JSON.stringify(value.dataset), before);
  assert.equal(rows.some(row => row.name === 'Gemma4 E2B IT Thinking'), false);
  assert.equal(rows.filter(row => row.benchmark === 'AIME 2026').length, 2);
  const changed = structuredClone(value);
  changed.design.datasetBindings[0].filter.all[0].values.push('Gemma4 E2B IT Thinking');
  assert.throws(() => validateResearchBinding(changed), /row selection/);
});
