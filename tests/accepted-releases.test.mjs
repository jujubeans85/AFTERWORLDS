import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { buildCandidate, writeCandidate, sha256, DATASET_ID, INDICATOR, TITLE, ENDPOINTS } from '../scripts/refresh-wdi.mjs';
import { proposeWdiAcceptance, validateIndependentReview, promoteWdiAcceptance, readAcceptedWdiRelease, rollbackWdiAcceptance } from '../scripts/review-wdi.mjs';
import { prepareResearchRuntime } from '../scripts/research-runtime.mjs';
import { loadResearchWorld, ACTIVE_RESEARCH_CONCEPTS } from '../src/research-data.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const baselineBytes = await fs.readFile(path.join(root, `research/datasets/${DATASET_ID}.json`));
const baseline = JSON.parse(baselineBytes);
const countrySource = JSON.parse(await fs.readFile(path.join(root, 'research/sources/society-wdi-countries.json')));
const observationSource = JSON.parse(await fs.readFile(path.join(root, 'research/sources/society-wdi-electricity.json')));
const manifest = JSON.parse(await fs.readFile(path.join(root, 'research/manifest.json')));
const activeDatasetPaths = [...new Set(manifest.implementationQueue.filter(item => ACTIVE_RESEARCH_CONCEPTS.includes(item.conceptId)).flatMap(item => item.datasets.map(dataset => dataset.path)))];
async function workspace(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'afterworld-acceptance-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  for (const file of [
    'research/manifest.json', 'research/designs/design-registry.json', 'research/audits/design-contract-review.json',
    'research/audits/final-review.json', 'vendor/countries-110m.json', 'data/geography/un-m49-world-atlas.json',
    'data-updates/design-proposals/156-8-rounded-percentage.json', 'docs/next-version/156-8_FACTUAL_DESIGN_REVIEW.md',
    ...activeDatasetPaths,
  ]) {
    await fs.mkdir(path.dirname(path.join(directory, file)), { recursive: true });
    await fs.copyFile(path.join(root, file), path.join(directory, file));
  }
  return directory;
}
async function candidate(root, value = 80, retrievedAt = '2026-10-20T01:00:00Z') {
  const countries = structuredClone(countrySource), observations = structuredClone(observationSource);
  observations[1].find(row => row.countryiso3code === 'AFG').value = value;
  const indicator = [{ page: 1, pages: 1, total: 1 }, [{ id: INDICATOR, name: TITLE, unit: '', source: { id: '2' } }]];
  const rawPages = [countries, observations, indicator].map(document => ({ raw: Buffer.from(JSON.stringify(document)) }));
  const rawSources = ['countries', 'observations', 'indicator'].map((kind, index) => ({ kind, url: ENDPOINTS[kind], path: `raw/${index}.json`, sha256: sha256(rawPages[index].raw), bytes: rawPages[index].raw.length, fetchedAt: retrievedAt }));
  const accepted = await readAcceptedWdiRelease({ root });
  const comparison = accepted ? { versionId: accepted.versionId, normalizedSha256: accepted.normalizedSha256 } : null;
  const record = buildCandidate({
    baseline, baselineBytes, expectedBaselineSha256: sha256(baselineBytes),
    countries: countries[1], observations: observations[1], indicator: indicator[1], rawSources, retrievedAt, comparison,
  });
  const output = await writeCandidate(record, rawPages, path.join(root, 'data-updates/candidates'));
  return { record, candidateDirectory: output.path };
}
// Deliberately fictitious review identities/evidence, used only inside disposable
// test roots. No test review is written into repository acceptance records.
function review(proposal, parent = proposal.proposal.parent.versionId) {
  return {
    schemaVersion: 1, decision: 'accept', independent: true,
    reviewer: 'test-independent-reviewer', preparedBy: 'test-importer-author',
    proposalSha256: proposal.proposalSha256, candidateSha256: proposal.proposal.candidateSha256,
    datasetSha256: proposal.proposal.datasetSha256, designSha256: proposal.proposal.designSha256,
    acceptedAt: '2026-10-20T03:00:00Z', expectedPreviousVersionId: parent,
    checks: Object.fromEntries(['sourceValues', 'sourceTerms', 'definitions', 'semanticDiff', 'coverage', 'designBinding'].map(name => [name, { status: 'pass', evidence: [`test-fixture:${name}`] }])),
  };
}

test('proposal reproduces raw sources but cannot itself create an accepted pointer', async t => {
  const directory = await workspace(t), input = await candidate(directory);
  const proposal = await proposeWdiAcceptance({ root: directory, ...input });
  assert.equal(proposal.proposal.dataset.rows.find(row => row.geographicId === 'AFG').value, 80);
  assert.equal(proposal.proposal.dataset.time.observationStart, '2024');
  assert.equal(proposal.proposal.design.scale.domain[1], 100);
  assert.equal(proposal.proposal.diff.changedRows.length, 1);
  assert.equal(await readAcceptedWdiRelease({ root: directory }), null);
  assert.throws(() => validateIndependentReview(proposal.proposal, null), /acceptance record/);
  const sameAuthor = review(proposal); sameAuthor.reviewer = sameAuthor.preparedBy;
  assert.throws(() => validateIndependentReview(proposal.proposal, sameAuthor), /acceptance record/);
  const unchecked = review(proposal); unchecked.checks.sourceTerms.status = 'unchecked';
  assert.throws(() => validateIndependentReview(proposal.proposal, unchecked), /sourceTerms evidence/);
  const stale = review(proposal); stale.proposalSha256 = '0'.repeat(64);
  assert.throws(() => validateIndependentReview(proposal.proposal, stale), /hash binding/);
});

test('altered normalized content and corrupted raw responses are quarantined', async t => {
  const directory = await workspace(t), input = await candidate(directory);
  const filename = path.join(input.candidateDirectory, 'candidate.json');
  const original = await fs.readFile(filename);
  const changed = JSON.parse(original);
  changed.content.rows[0].value = 42;
  await fs.writeFile(filename, JSON.stringify(changed));
  await assert.rejects(proposeWdiAcceptance({ root: directory, ...input }), /cannot be reproduced/);
  await fs.writeFile(filename, original);
  await fs.appendFile(path.join(input.candidateDirectory, 'raw/0.json'), ' ');
  await assert.rejects(proposeWdiAcceptance({ root: directory, ...input }), /raw source integrity/);
});

test('reviewed promotion changes the accepted build and retains complete frozen and prior releases', async t => {
  const directory = await workspace(t), first = await candidate(directory);
  const originalDataset = await fs.readFile(path.join(directory, `research/datasets/${DATASET_ID}.json`));
  const firstProposal = await proposeWdiAcceptance({ root: directory, ...first });
  const firstPointer = await promoteWdiAcceptance({ root: directory, ...first, review: review(firstProposal) });
  const accepted = await readAcceptedWdiRelease({ root: directory });
  assert.equal(accepted.dataset.rows.find(row => row.geographicId === 'AFG').value, 80);
  assert.equal(accepted.acceptance.kind, 'reviewed-update');
  assert.deepEqual(await fs.readFile(path.join(directory, `research/datasets/${DATASET_ID}.json`)), originalDataset);
  const dist = path.join(directory, 'dist');
  const builtFirst = await prepareResearchRuntime(directory, dist);
  const second = await candidate(directory, 81, '2026-10-20T02:00:00Z');
  const secondProposal = await proposeWdiAcceptance({ root: directory, ...second });
  await assert.rejects(promoteWdiAcceptance({ root: directory, ...second, review: review(secondProposal, `frozen-${sha256(baselineBytes).slice(0, 12)}`) }), /actual release/);
  // Use a distinct candidate timestamp for the actual promotion.
  const next = await candidate(directory, 81, '2026-10-20T02:01:00Z');
  const nextProposal = await proposeWdiAcceptance({ root: directory, ...next });
  const nextPointer = await promoteWdiAcceptance({ root: directory, ...next, review: review(nextProposal, firstPointer.versionId) });
  await fs.rm(dist, { recursive: true, force: true });
  const builtNext = await prepareResearchRuntime(directory, dist);
  assert.notEqual(builtNext['408'].revision, builtFirst['408'].revision);
  const manifest = JSON.parse(await fs.readFile(path.join(dist, 'assets/research/accepted-manifest.json')));
  assert.equal(manifest.versions, undefined);
  const historyBytes = await fs.readFile(path.join(dist, manifest.history['408'].url));
  assert.equal(sha256(historyBytes), manifest.history['408'].sha256);
  const history = JSON.parse(historyBytes);
  assert.equal(history.conceptId, '408');
  assert.equal(Object.keys(history.versions).length, 3);
  const oldBytes = await fs.readFile(path.join(dist, builtFirst['408'].release.url));
  const oldWorld = await loadResearchWorld(builtFirst['408'], { fetchImpl: async () => new Response(oldBytes) });
  assert.equal(oldWorld.rows.find(row => row.geographicId === 'AFG').value, 80);
  await rollbackWdiAcceptance({ root: directory, versionId: firstPointer.versionId, releaseSha256: firstPointer.releaseSha256, expectedCurrentVersionId: nextPointer.versionId });
  assert.equal((await readAcceptedWdiRelease({ root: directory })).versionId, firstPointer.versionId);
  await assert.rejects(rollbackWdiAcceptance({ root: directory, versionId: nextPointer.versionId, releaseSha256: nextPointer.releaseSha256, expectedCurrentVersionId: nextPointer.versionId }), /pointer changed/);
  await rollbackWdiAcceptance({ root: directory, versionId: `frozen-${sha256(baselineBytes).slice(0, 12)}`, expectedCurrentVersionId: firstPointer.versionId });
  assert.equal(await readAcceptedWdiRelease({ root: directory }), null);
});

test('a revision back to frozen values is still a real accepted-parent change', async t => {
  const directory = await workspace(t), first = await candidate(directory, 80);
  const firstProposal = await proposeWdiAcceptance({ root: directory, ...first });
  const firstPointer = await promoteWdiAcceptance({ root: directory, ...first, review: review(firstProposal) });
  const reverting = await candidate(directory, 87.8, '2026-10-20T02:00:00Z');
  assert.equal(reverting.record.status, 'pending-independent-review');
  assert.equal(reverting.record.diff.changedRows.length, 0, 'frozen-source diff is separately empty');
  const proposal = await proposeWdiAcceptance({ root: directory, ...reverting });
  assert.equal(proposal.proposal.parent.versionId, firstPointer.versionId);
  const changed = proposal.proposal.diff.changedRows.find(row => row.id === 'electricity-AFG');
  assert.equal(changed.before.value, 80);
  assert.equal(changed.after.value, 87.8);
  assert.equal(proposal.proposal.baselineDiff.changedRows.length, 0);
});

test('accepted reader rejects a modified review or snapshot instead of silently selecting candidates', async t => {
  const directory = await workspace(t), input = await candidate(directory);
  const proposal = await proposeWdiAcceptance({ root: directory, ...input });
  const selected = await promoteWdiAcceptance({ root: directory, ...input, review: review(proposal) });
  await fs.appendFile(path.join(directory, 'data-updates/accepted', DATASET_ID, selected.versionId, 'release.json'), ' ');
  await assert.rejects(readAcceptedWdiRelease({ root: directory }), /release digest mismatch/);
  await assert.rejects(prepareResearchRuntime(directory, path.join(directory, 'dist')), /release digest mismatch/);
});
