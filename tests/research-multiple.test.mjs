import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { prepareNarration } from '../scripts/narration-runtime.mjs';
import { prepareMultipleResearchRelease } from '../scripts/research-multiple.mjs';
import { validateMultipleBinding, validateMultipleRelease } from '../src/research-multiple.js';
import { canonicalReviewedJSON, researchSha256 } from '../src/research-data.js';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = name => fs.readFile(path.join(root, name), 'utf8').then(JSON.parse);
const registry = await read('research/designs/design-registry.json'), manifest = await read('research/manifest.json');
const audit = await read('research/audits/design-contract-review.json'), final = await read('research/audits/final-review.json');
const helpers = { canonical: canonicalReviewedJSON, sha256: researchSha256 };
async function fixture(t, conceptId) {
  const dist = await fs.mkdtemp(path.join(os.tmpdir(), 'afterworld-multi-'));
  t.after(() => fs.rm(dist, { recursive: true, force: true }));
  const design = registry.designs.find(item => item.conceptId === conceptId);
  const args = { root, dist, conceptId, design, designSha256: await researchSha256(canonicalReviewedJSON(design)), queued: manifest.implementationQueue.find(item => item.conceptId === conceptId), reviewed: audit.designs.find(item => item.conceptId === conceptId), accepted: final.concepts.find(item => item.conceptId === conceptId), reviewedAt: final.reviewedAt };
  const summary = await prepareMultipleResearchRelease(args), bytes = await fs.readFile(path.join(dist, summary.release.url));
  return { summary, bundle: JSON.parse(bytes), args, bytes };
}
test('three multi-source releases preserve all datasets, exact selected rows and independent units', async t => {
  for (const id of ['394', '217', '56-5']) {
    const { summary, bundle, bytes } = await fixture(t, id);
    assert.equal(await researchSha256(bytes), summary.release.sha256);
    const world = await validateMultipleRelease(bundle, summary, helpers);
    assert.equal(world.datasets.length, 2);
    assert.equal(world.rows.length, id === '217' ? 4 : 14);
    assert.equal(new Set(world.rows.map(row => row.id)).size, world.rows.length);
    assert.ok(world.rows.every(row => world.boundRowsByDataset[row.datasetId].includes(row)));
    assert.equal(summary.datasetBindingKind, 'multiple');
    assert.match(summary.observationPeriod.scope, /Cross-source/);
    if (id === '217') {
      assert.equal(bundle.datasets[0].dataset.rows.length, 5);
      assert.deepEqual(world.boundRowsByDataset['physical-inference-boundaries'].map(row => row.id), ['energychange']);
      assert.deepEqual(world.rows.map(row => row.unit), ['fold reduction', 'TWh/year', '% year-on-year', '% year-on-year']);
    }
    if (id === '56-5') assert.equal(world.rows.find(row => row.id === 'irl-2025').nationalMeteredSharePercent, 23);
  }
});
test('every multi-source identity, hash, subset, native unit and source period is enforced', async t => {
  const { summary, bundle } = await fixture(t, '217');
  for (const mutate of [
    value => { value.datasets.reverse(); },
    value => { value.datasets[1].dataset.rows[0].value += 1; },
    value => { value.datasets[1].datasetSha256 = '0'.repeat(64); },
    value => { value.datasetSha256 = '0'.repeat(64); },
    value => { value.design.datasetBindings[0].includedRowIds.push('fullenergy'); },
    value => { value.datasets[0].datasetCanonicalSha256 = '0'.repeat(64); },
  ]) {
    const changed = structuredClone(bundle); mutate(changed);
    await assert.rejects(validateMultipleRelease(changed, summary, helpers), /Research multi-source:/);
  }
  for (const mutate of [
    value => { value.datasets[0].dataset.rows[4].unit = 'percent'; },
    value => { value.datasets[1].dataset.rows[0].period = '2026'; },
    value => { value.design.datasetBindings[0].filter.all[0].values.push('fullenergy'); },
    value => { value.datasets[0].dataset.rows[4].boundary = 'active-chip'; },
    value => { value.design.scale.type = 'linear'; },
  ]) {
    const changed = structuredClone(bundle); mutate(changed);
    assert.throws(() => validateMultipleBinding(changed, canonicalReviewedJSON), /Research multi-source:/);
  }
});
test('multi-source builder rejects stale review bindings and immutable-file corruption', async t => {
  const { args, summary } = await fixture(t, '394');
  const changed = structuredClone(args); changed.reviewed.datasetDigests['physical-grid-connection-rules'] = '0'.repeat(64);
  await assert.rejects(prepareMultipleResearchRelease(changed), /stale dataset/);
  await fs.writeFile(path.join(args.dist, summary.release.url), 'corrupt');
  await assert.rejects(prepareMultipleResearchRelease(args), /immutable release collision/);
});
test('public loader handles schema2 streaming, hash failures, bounds and cancellation without weakening activation', async t => {
  const { summary, bundle, bytes } = await fixture(t, '217');
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'afterworld-multi-client-'));
  t.after(() => fs.rm(temporary, { recursive: true, force: true }));
  await fs.cp(path.join(root, 'src'), path.join(temporary, 'src'), { recursive: true });
  await fs.writeFile(path.join(temporary, 'package.json'), '{"type":"module"}');
  const modulePath = path.join(temporary, 'src/research-data.js');
  const original = await fs.readFile(modulePath, 'utf8');
  // Development activation exists only in this disposable module copy.
  await fs.writeFile(modulePath, original.replace("Object.freeze(['430'", "Object.freeze(['217', '430'"));
  const { loadResearchWorld } = await import(`file://${modulePath}`);
  const stream = () => new ReadableStream({ start(controller) { controller.enqueue(bytes.subarray(0, 100)); controller.enqueue(bytes.subarray(100)); controller.close(); } });
  const world = await loadResearchWorld(summary, { fetchImpl: async () => new Response(stream()) });
  assert.equal(world.rows.length, 4); assert.equal(world.datasets[0].dataset.rows.length, 5);
  await assert.rejects(loadResearchWorld(summary, { fetchImpl: async () => new Response('changed') }), /release digest/);
  await assert.rejects(loadResearchWorld(summary, { fetchImpl: async () => new Response(new Uint8Array(2_000_001)) }), /size limit/);
  const aborted = new AbortController(); aborted.abort();
  await assert.rejects(loadResearchWorld(summary, { signal: aborted.signal, fetchImpl: async () => { throw Error('must not fetch'); } }), /abort/i);
  const during = new AbortController();
  await assert.rejects(loadResearchWorld(summary, { signal: during.signal, fetchImpl: async () => new Response(new ReadableStream({ start(controller) { controller.enqueue(bytes); during.abort(); controller.close(); } })) }), /abort/i);
  const bad = structuredClone(bundle); bad.datasets[1].dataset.rows[0].value++;
  const serialized = JSON.stringify(bad), digest = await researchSha256(serialized);
  await assert.rejects(loadResearchWorld({ ...summary, release: { sha256: digest, url: `/assets/research/${digest}.json` } }, { fetchImpl: async () => new Response(serialized) }), /dataset digest/);
});

test('multi-source narration binds to the source set and resolves citations across all datasets', async t => {
  for (const id of ['394', '217', '56-5']) {
    const { args, summary, bundle } = await fixture(t, id);
    await prepareNarration(root, args.dist, { [id]: summary }, { [id]: bundle });
    assert.ok(summary.narrationRef);
    const narration = JSON.parse(await fs.readFile(path.join(args.dist, summary.narrationRef.url)));
    assert.equal(narration.datasetSha256, summary.datasetSha256);
    assert.deepEqual(narration.citations, [...new Set(bundle.datasets.flatMap(entry => entry.dataset.sources.map(source => source.sourceId)))]);
    assert.equal(narration.audio, null);
  }
});
