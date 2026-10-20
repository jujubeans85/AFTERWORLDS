import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepareResearchRuntime, writeResearchHistory } from '../scripts/research-runtime.mjs';
import { ACTIVE_RESEARCH_CONCEPTS, loadResearchWorld, researchSha256, validateResearchBinding, validateResearchGeography } from '../src/research-data.js';
import { prepareElectricityGeography } from '../scripts/research-geography.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await fs.readFile(path.join(root, 'research/manifest.json')));
const activeDatasetPaths = [...new Set(manifest.implementationQueue.filter(item => ACTIVE_RESEARCH_CONCEPTS.includes(item.conceptId)).flatMap(item => item.datasets.map(dataset => dataset.path)))];
const files = [
  'research/manifest.json', 'research/designs/design-registry.json',
  'research/audits/design-contract-review.json', 'research/audits/final-review.json',
  ...activeDatasetPaths,
  'data/geography/un-m49-world-atlas.json', 'vendor/countries-110m.json',
  'data-updates/design-proposals/156-8-rounded-percentage.json', 'docs/next-version/156-8_FACTUAL_DESIGN_REVIEW.md',
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

test('research build activates the explicit reviewed primitive set and preserves the deterministic 430 release', async t => {
  const { directory, summaries, summary, bytes } = await fixture(t);
  assert.deepEqual(Object.keys(summaries).sort(), ['430', '408', '5-6', '63', '388', '330', '406', '193-5', '372', '276', '409', '369', '324', '385', '232', '333', '63-8', '364', '320', '417', '415', '397', '382', '371', '368', '358', '356', '348', '321', '314', '305', '259', '256', '250', '107', '150-5', '155-17', '170-3', '178', '255', '233-2', '422-2', '138-8', '8-6', '428', '407', '284', '202', '117', '402', '398', '392', '323', '218', '214', '115-2', '211-4'].sort());
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
test('accepted manifest keeps history lazy, immutable, hash-bound and within bounded readers', async t => {
  const { directory, summaries } = await fixture(t);
  const bytes = await fs.readFile(path.join(directory, 'assets/research/accepted-manifest.json'));
  const manifest = JSON.parse(bytes);
  assert.ok(bytes.byteLength < 256_000);
  assert.equal(manifest.versions, undefined);
  assert.equal(Object.keys(manifest.history).length, Object.keys(summaries).length);
  for (const [id, reference] of Object.entries(manifest.history)) {
    const historyBytes = await fs.readFile(path.join(directory, reference.url));
    assert.equal(await researchSha256(historyBytes), reference.sha256);
    const index = JSON.parse(historyBytes);
    assert.equal(index.schemaVersion, 1);
    assert.equal(index.conceptId, id);
    assert.deepEqual(index.versions[summaries[id].revision], summaries[id]);
  }
  await fs.writeFile(path.join(directory, manifest.history['430'].url), 'corrupt');
  await assert.rejects(prepareResearchRuntime(root, directory), /immutable history/);
  await assert.rejects(writeResearchHistory(directory, '430', { oversized: 'x'.repeat(256_000) }), /bounded reader/);
});
test('published percentage geometry preserves raw account counts and clinical denominators', async t => {
  const { directory, summaries } = await fixture(t);
  const load = async id => loadResearchWorld(summaries[id], { fetchImpl: respond(await fs.readFile(path.join(directory, summaries[id].release.url))) });
  const accounts = await load('138-8');
  assert.equal(accounts.rows[0].value, 560);
  assert.equal(accounts.rows[0].denominatorAccounts, 832);
  assert.ok(Math.abs(accounts.marks[0].fraction - 0.673) < 1e-15);
  assert.equal(accounts.marks[0].valueField, 'publishedPercent');
  assert.notEqual(accounts.marks[0].fraction, 560 / 832);
  const clinical = await load('8-6');
  assert.deepEqual(clinical.rows.map(row => [row.value, row.numerator, row.analyzedN, row.randomizedN, row.ci95]), [
    [100, 81, 81, 81, [96, 100]], [22, 18, 82, 83, [14, 32]],
  ]);
  assert.equal(clinical.marks[0].fraction, 1);
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
    [data => { data.conceptId = '999'; }, /unsupported concept/],
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

test('electricity binding preserves all 217 economies, exact 100 percent and explicit nulls', async t => {
  const { directory, summaries } = await fixture(t);
  const summary = summaries['408'];
  const bytes = await fs.readFile(path.join(directory, summary.release.url));
  const world = await loadResearchWorld(summary, { fetchImpl: respond(bytes) });
  assert.equal(world.rows.length, 217);
  assert.deepEqual(world.rows.filter(row => row.value === null).map(row => row.id), ['electricity-ASM', 'electricity-XKX']);
  assert.equal(world.rows.filter(row => row.value === 100).length, 122);
  assert.equal(world.marks.find(mark => mark.row.value === 100).dialAngle, 2 * Math.PI);
  assert.equal(world.marks.find(mark => mark.row.value === 100).fraction, 1);
  assert.equal(world.marks.find(mark => mark.row.value === null).fraction, null);
  assert.equal(world.marks.find(mark => mark.row.value === null).dialAngle, null);
  assert.equal(world.geography.coverage.mapped, 167);
  assert.equal(world.geography.coverage.tableOnly, 50);
  assert.equal(world.geography.backgroundCountries.length, 177);
  assert.equal(world.marks.filter(mark => mark.country).length, 167);
  const bundle = JSON.parse(bytes);
  bundle.dataset.rows[0].value = 0;
  assert.equal(validateResearchBinding(bundle)[0].value, 0);
  bundle.dataset.rows[0].value = 100.1;
  assert.throws(() => validateResearchBinding(bundle), /outside domain/);
  bundle.dataset.rows[0].value = 1;
  bundle.dataset.rows[0].period = '2025';
  assert.throws(() => validateResearchBinding(bundle), /electricity period/);
});

test('geographic joins use approved numeric identities, never unkeyed territories or inherited parent values', async t => {
  const { directory, summaries } = await fixture(t);
  const bundle = JSON.parse(await fs.readFile(path.join(directory, summaries['408'].release.url)));
  const geo = bundle.geography;
  const byId = new Map(geo.countries.map(country => [country.geographicId, country]));
  for (const [id, numeric] of [['AUS','036'], ['USA','840'], ['CHN','156'], ['COD','180'], ['COG','178'], ['PRK','408'], ['KOR','410'], ['FJI','242'], ['PSE','275'], ['SSD','728']]) {
    assert.equal(byId.get(id).geometryId, numeric, id);
  }
  for (const id of ['electricity-XKX', 'electricity-CHI', 'electricity-ASM', 'electricity-CYP', 'electricity-SOM', 'electricity-HKG', 'electricity-MAC']) {
    assert.ok(geo.unsupportedRowIds.includes(id), id);
  }
  assert.equal(new Set(geo.countries.map(country => country.geometryId)).size, geo.countries.length);
  assert.equal(geo.backgroundCountries.filter(country => country.geometryId === null).length, 3);
  const changed = structuredClone(geo);
  changed.countries[0].rowId = changed.countries[1].rowId;
  assert.throws(() => validateResearchGeography(changed, bundle.dataset.rows), /geographic join/);
  const missing = structuredClone(geo);
  missing.unsupported.pop();
  assert.throws(() => validateResearchGeography(missing, bundle.dataset.rows), /coverage mismatch/);
});

test('geography preparation rejects modified boundary and mapping assets', async t => {
  for (const relative of ['vendor/countries-110m.json', 'data/geography/un-m49-world-atlas.json']) {
    const directory = await workspace(t, true);
    await fs.appendFile(path.join(directory, relative), ' ');
    const dataset = JSON.parse(await fs.readFile(path.join(root, 'research/datasets/society-electricity-access.json')));
    await assert.rejects(prepareElectricityGeography(directory, dataset), /digest mismatch/);
  }
});

test('loader verifies geometry bytes independently of the outer bundle digest', async t => {
  const { directory, summaries } = await fixture(t);
  const summary = summaries['408'];
  const bundle = JSON.parse(await fs.readFile(path.join(directory, summary.release.url)));
  bundle.geography.countries[0].geometryId = '999';
  const bytes = JSON.stringify(bundle), hash = await researchSha256(bytes);
  await assert.rejects(loadResearchWorld({ ...summary, release: { url: `/assets/research/${hash}.json`, sha256: hash } }, { fetchImpl: respond(bytes) }), /geography digest mismatch/);
});

test('global pair primitives preserve exact ordered releases, denominators and native arcs', async t => {
  const { directory, summaries } = await fixture(t);
  for (const [conceptId, values, ids] of [
    ['5-6', [27.3, 28.7], ['seabed-2025', 'seabed-2026']],
    ['63', [85, 58], ['internet-urban', 'internet-rural']],
  ]) {
    const summary = summaries[conceptId];
    const bytes = await fs.readFile(path.join(directory, summary.release.url));
    const world = await loadResearchWorld(summary, { fetchImpl: respond(bytes) });
    assert.deepEqual(world.rows.map(row => row.id), ids);
    assert.deepEqual(world.rows.map(row => row.value), values);
    assert.equal(world.geography, null);
    assert.equal(world.design.geographyMode, 'global');
    for (const mark of world.marks) {
      assert.equal(mark.dialAngle, 2 * Math.PI * mark.row.value / 100);
      assert.equal(mark.row.geographicId, null);
    }
    const altered = JSON.parse(bytes);
    altered.design.datasetBindings[0].includedRowIds.reverse();
    assert.throws(() => validateResearchBinding(altered), /changed pair scale/);
    altered.design.datasetBindings[0].includedRowIds.reverse();
    altered.dataset.rows[0].geographicId = 'USA';
    assert.throws(() => validateResearchBinding(altered), /global pair scope/);
  }
});

test('interval, robust-SE and bound primitives preserve distinct native meanings', async t => {
  const { directory, summaries } = await fixture(t);
  const worlds = {}, bundles = {};
  for (const id of ['388', '330', '406', '193-5']) {
    const bytes = await fs.readFile(path.join(directory, summaries[id].release.url));
    worlds[id] = await loadResearchWorld(summaries[id], { fetchImpl: respond(bytes) });
    bundles[id] = JSON.parse(bytes);
  }
  assert.deepEqual(worlds['388'].marks.slice(0, 2).map(mark => [mark.value, mark.lower, mark.upper]), [[null, 72, 76], [null, 21, 30]]);
  assert.equal(worlds['388'].rows.slice(2).reduce((sum, row) => sum + row.value, 0), 99);
  assert.equal(worlds['388'].marks[0].kind, 'interval-only');
  assert.equal(worlds['388'].marks[2].kind, 'continental-share');
  assert.equal(worlds['330'].marks[0].kind, 'one-robust-standard-error');
  assert.equal(worlds['330'].marks[0].lower, 0.31 - 0.068);
  assert.equal(worlds['330'].marks[1].upper, 0.238 + 0.068);
  assert.equal(worlds['330'].rows[0].regressionN, 654);
  assert.deepEqual(worlds['406'].marks.map(mark => mark.kind), ['open-upper-bound', 'open-upper-bound', 'approximate', 'inclusive-upper-bound']);
  assert.deepEqual(worlds['193-5'].marks.map(mark => [mark.kind, mark.threshold]), [['approximate', 540], ['open-upper-bound', 1]]);
  assert.equal(worlds['193-5'].design.scale.domain[1], 600);
  const missingInterval = structuredClone(bundles['388']); delete missingInterval.dataset.rows[0].lower;
  assert.throws(() => validateResearchBinding(missingInterval), /missing field lower/);
  const midpoint = structuredClone(bundles['388']); midpoint.dataset.rows[0].value = 74;
  assert.throws(() => validateResearchBinding(midpoint), /unit|interval-only/);
  const reversed = structuredClone(bundles['388']); reversed.dataset.rows[0].lower = 77;
  assert.throws(() => validateResearchBinding(reversed), /interval-only/);
  const standardError = structuredClone(bundles['330']); standardError.dataset.rows[0].standardError = 0.68;
  assert.throws(() => validateResearchBinding(standardError), /standard-error/);
  const strippedBound = structuredClone(bundles['406']); strippedBound.dataset.rows[0].qualifier = null;
  assert.throws(() => validateResearchBinding(strippedBound), /qualifier/);
  const countryClaim = structuredClone(bundles['193-5']); countryClaim.design.geographyMode = 'geographic';
  assert.throws(() => validateResearchBinding(countryClaim), /qualified primitive/);
});
