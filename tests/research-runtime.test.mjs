import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepareResearchRuntime } from '../scripts/research-runtime.mjs';
import { loadResearchWorld, researchSha256, validateResearchBinding } from '../src/research-data.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  'research/manifest.json', 'research/designs/design-registry.json',
  'research/audits/design-contract-review.json', 'research/audits/final-review.json',
  'research/datasets/physical-cloud-grid-carbon.json',
];
async function workspace(t, copy = false) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'afterworld-research-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  if (copy) for (const file of files) {
    const destination = path.join(directory, file);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.copyFile(path.join(root, file), destination);
  }
  return directory;
}
async function fixture(t) {
  const directory = await workspace(t);
  const summaries = await prepareResearchRuntime(root, directory);
  const summary = summaries['430'];
  const bytes = await fs.readFile(path.join(directory, summary.release.url));
  return { directory, summaries, summary, bytes, bundle: JSON.parse(bytes) };
}
const respond = bytes => async () => new Response(bytes, { headers: { 'Content-Type': 'application/json' } });

test('research build activates only 430 and produces deterministic immutable native-unit releases', async t => {
  const { directory, summaries, summary, bytes } = await fixture(t);
  assert.deepEqual(Object.keys(summaries), ['430']);
  assert.equal(await researchSha256(bytes), summary.release.sha256);
  assert.deepEqual(await prepareResearchRuntime(root, directory), summaries);
  assert.equal(summary.designSha256, '80c6f80538b3036f9a073be3bba14e6b5944c0b1672ffa574f823da524c35726');
  assert.equal(summary.observationPeriod.observationStart, '2025');
  assert.equal(summary.aiRelationship.class, 'context');
  let request;
  const world = await loadResearchWorld(summary, { fetchImpl: async (...args) => { request = args; return new Response(bytes); } });
  assert.equal(request[0], summary.release.url);
  assert.equal(world.rows.length, 44);
  assert.deepEqual(world.rows.map(row => row.id), world.design.datasetBindings[0].includedRowIds);
  for (const [index, mark] of world.marks.entries()) {
    assert.equal(mark.row, world.rows[index]);
    assert.equal(mark.length, 0.45 * mark.row.value / 700);
    assert.equal(mark.index, index);
  }
  assert.equal(world.marks.find(mark => mark.row.value === 641).length, 0.45 * 641 / 700);
});

test('immutable release paths reject existing corrupt content', async t => {
  const { directory, summary } = await fixture(t);
  await fs.writeFile(path.join(directory, summary.release.url), 'corrupt');
  await assert.rejects(prepareResearchRuntime(root, directory), /immutable release path/);
});

test('build rejects stale dataset, manifest and design bindings without modifying frozen research', async t => {
  const variants = [
    ['research/datasets/physical-cloud-grid-carbon.json', data => { data.rows[0].value += 1; }, /stale dataset digest/],
    ['research/manifest.json', data => { data.implementationQueue.find(row => row.conceptId === '430').datasets[0].sha256 = '0'.repeat(64); }, /stale dataset digest/],
    ['research/designs/design-registry.json', data => { data.designs.find(row => row.conceptId === '430').scale.domain[1] = 800; }, /stale design digest/],
    ['research/manifest.json', data => { data.implementationQueue = data.implementationQueue.filter(row => row.conceptId !== '430'); }, /missing or duplicate implementation queue/],
    ['research/audits/final-review.json', data => { data.concepts.find(row => row.conceptId === '430').review.gates.G1.status = 'unchecked'; }, /research gates are incomplete/],
  ];
  for (const [file, change, expected] of variants) {
    const directory = await workspace(t, true);
    const filename = path.join(directory, file);
    const data = JSON.parse(await fs.readFile(filename, 'utf8'));
    change(data);
    await fs.writeFile(filename, JSON.stringify(data));
    await assert.rejects(prepareResearchRuntime(directory, path.join(directory, 'dist')), expected);
  }
});

test('binding validator rejects row, unit, scale, provenance and unsupported primitive drift', async t => {
  const { bundle } = await fixture(t);
  const variants = [
    [data => { data.dataset.rows[0].id = data.dataset.rows[1].id; }, /duplicate or missing row ID/],
    [data => { data.design.datasetBindings[0].includedRowIds[0] = 'not-a-row'; }, /missing bound row/],
    [data => { delete data.dataset.rows[0].cfePercent; }, /missing field cfePercent/],
    [data => { data.dataset.rows[0].unit = 'score'; }, /row unit/],
    [data => { data.dataset.rows[0].value = 701; }, /outside domain/],
    [data => { data.dataset.rows[0].value = NaN; }, /outside domain/],
    [data => { data.dataset.rows[0].value = '11'; }, /outside domain/],
    [data => { data.dataset.rows[0].sourceId = 'unverified'; }, /provenance/],
    [data => { data.dataset.rows[0].lat = 1; }, /coordinates/],
    [data => { data.dataset.rows[0].cfePercent = 101; }, /CFE badge/],
    [data => { data.design.scale.domain[1] = 800; }, /changed carbon scale/],
    [data => { data.design.implementation.primitive = 'stock-globe'; }, /unsupported primitive/],
    [data => { data.conceptId = '408'; }, /unsupported concept/],
  ];
  for (const [change, expected] of variants) {
    const changed = structuredClone(bundle);
    change(changed);
    assert.throws(() => validateResearchBinding(changed), expected);
  }
});

test('native binding keeps zero, missing and measured values distinct', async t => {
  const { bundle } = await fixture(t);
  bundle.dataset.rows[0].value = 0;
  bundle.dataset.rows[1].value = null;
  bundle.dataset.rows[1].status = 'missing';
  const rows = validateResearchBinding(bundle);
  assert.equal(rows[0].value, 0);
  assert.equal(rows[1].value, null);
  bundle.dataset.rows[1].status = 'observed';
  assert.throws(() => validateResearchBinding(bundle), /missing-value status/);
});

test('loader rejects HTTP failure, tampering, wrong release identity and arbitrary fetch URLs', async t => {
  const { summary, bytes, bundle } = await fixture(t);
  await assert.rejects(loadResearchWorld(summary, { fetchImpl: async () => new Response('', { status: 503 }) }), /HTTP 503/);
  await assert.rejects(loadResearchWorld(summary, { fetchImpl: respond(`${bytes} `) }), /release digest mismatch/);
  await assert.rejects(loadResearchWorld(summary, { fetchImpl: respond('x'.repeat(2_000_001)) }), /size limit/);
  await assert.rejects(loadResearchWorld({ ...summary, release: { ...summary.release, url: 'https://example.org/data' } }, { fetchImpl: () => assert.fail('must not fetch') }), /invalid accepted release/);
  await assert.rejects(loadResearchWorld({ ...summary, revision: '0'.repeat(64) }, { fetchImpl: respond(bytes) }), /release identity mismatch/);
  bundle.design.title = 'Unreviewed title';
  const altered = JSON.stringify(bundle);
  const hash = await researchSha256(altered);
  await assert.rejects(loadResearchWorld({ ...summary, release: { url: `/assets/research/${hash}.json`, sha256: hash } }, { fetchImpl: respond(altered) }), /design digest mismatch/);
});

test('loader catches altered dataset content even with an updated outer release hash', async t => {
  const { summary, bundle } = await fixture(t);
  bundle.dataset.rows[0].value += 1;
  const bytes = JSON.stringify(bundle);
  const hash = await researchSha256(bytes);
  await assert.rejects(loadResearchWorld({ ...summary, release: { url: `/assets/research/${hash}.json`, sha256: hash } }, { fetchImpl: respond(bytes) }), /dataset content digest mismatch/);
});

test('loader propagates abort and never returns data from a cancelled world load', async t => {
  const { summary, bytes } = await fixture(t);
  const controller = new AbortController();
  await assert.rejects(loadResearchWorld(summary, {
    signal: controller.signal,
    fetchImpl: async (_url, options) => {
      assert.equal(options.signal, controller.signal);
      controller.abort();
      return new Response(bytes);
    },
  }), { name: 'AbortError' });
});
