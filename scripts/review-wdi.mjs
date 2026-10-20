// Manual, review-bound promotion. A parser success never creates acceptance.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { DATASET_ID, ENDPOINTS, canonical, sha256, buildCandidate } from './refresh-wdi.mjs';
import { canonicalReviewedJSON, validateResearchBinding } from '../src/research-data.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HASH = /^[a-f0-9]{64}$/;
const VERSION = /^[0-9TZ]+-[a-f0-9]{12}$/;
const CHECKS = ['sourceValues', 'sourceTerms', 'definitions', 'semanticDiff', 'coverage', 'designBinding'];
const fail = message => { throw new Error(`Review: ${message}`); };
const json = async filename => JSON.parse(await fs.readFile(filename, 'utf8'));
const digestObject = value => sha256(canonical(value));

async function immutableJSON(filename, value) {
  const bytes = `${JSON.stringify(value, null, 2)}\n`;
  await fs.mkdir(path.dirname(filename), { recursive: true });
  try { await fs.writeFile(filename, bytes, { flag: 'wx' }); }
  catch (error) {
    if (error.code !== 'EEXIST') throw error;
    if (await fs.readFile(filename, 'utf8') !== bytes) fail('immutable file collision');
  }
  return sha256(bytes);
}

async function baseline(root) {
  const bytes = await fs.readFile(path.join(root, 'research/datasets', `${DATASET_ID}.json`));
  const dataset = JSON.parse(bytes), datasetSha256 = sha256(bytes);
  const manifest = await json(path.join(root, 'research/manifest.json'));
  const entry = manifest.implementationQueue.find(row => row.conceptId === '408');
  if (entry?.datasets?.[0]?.sha256 !== datasetSha256) fail('frozen baseline integrity mismatch');
  const registry = await json(path.join(root, 'research/designs/design-registry.json'));
  const design = registry.designs.find(row => row.conceptId === '408');
  const audit = await json(path.join(root, 'research/audits/design-contract-review.json'));
  const designSha256 = sha256(canonicalReviewedJSON(design));
  if (audit.designs.find(row => row.conceptId === '408')?.designRecordSha256 !== designSha256) fail('frozen design integrity mismatch');
  const review = (await json(path.join(root, 'research/audits/final-review.json'))).concepts.find(row => row.conceptId === '408');
  if (review?.verdict !== 'context-ready' || review.review?.datasetDigests?.[DATASET_ID] !== datasetSha256 || !(review.review?.score >= 92) || Array.from({ length: 10 }, (_, index) => `G${index + 1}`).some(gate => review.review?.gates?.[gate]?.status !== 'pass')) fail('frozen acceptance gates are incomplete');
  return { bytes, dataset, datasetSha256, design, designSha256 };
}

function rawCollections(candidate, rawRecords) {
  const groups = {};
  if (!Array.isArray(candidate.rawSources) || candidate.rawSources.length !== rawRecords.length || !rawRecords.length) fail('missing raw attestations');
  for (let index = 0; index < rawRecords.length; index++) {
    const attestation = candidate.rawSources[index], raw = rawRecords[index];
    if (attestation.path !== `raw/${index}.json` || !['countries', 'observations', 'indicator'].includes(attestation.kind) || sha256(raw) !== attestation.sha256 || raw.length !== attestation.bytes) fail('raw source integrity mismatch');
    const endpoint = new URL(attestation.url);
    if (endpoint.protocol !== 'https:' || endpoint.hostname !== 'api.worldbank.org' || endpoint.port || endpoint.username || endpoint.password || endpoint.pathname !== new URL(ENDPOINTS[attestation.kind]).pathname) fail('raw source endpoint mismatch');
    const document = JSON.parse(raw);
    if (!Array.isArray(document) || document.length !== 2 || !Array.isArray(document[1])) fail('invalid raw envelope');
    (groups[attestation.kind] ||= []).push(document);
  }
  const collections = {};
  for (const kind of ['countries', 'observations', 'indicator']) {
    const pages = groups[kind];
    if (!pages?.length) fail('missing source collection');
    pages.sort((a, b) => Number(a[0].page) - Number(b[0].page));
    if (pages.some(([meta], index) => Number(meta.page) !== index + 1 || Number(meta.pages) !== pages.length || Number(meta.total) !== Number(pages[0][0].total) || meta.lastupdated !== pages[0][0].lastupdated)) fail('inconsistent raw pagination');
    const rows = pages.flatMap(page => page[1]);
    if (rows.length !== Number(pages[0][0].total)) fail('incomplete raw pagination');
    collections[kind] = rows;
  }
  return { collections, databaseLastUpdated: groups.observations[0][0].lastupdated || null };
}

export async function proposeWdiAcceptance({ root = ROOT, candidateDirectory, parentReference, visitedVersions }) {
  const current = await baseline(root);
  const frozenVersionId = `frozen-${current.datasetSha256.slice(0, 12)}`;
  const previousPointer = parentReference || (await pointer(root)).datasets?.[DATASET_ID] || { versionId: frozenVersionId, releaseSha256: null };
  let previousDataset = current.dataset, previousDatasetSha256 = current.datasetSha256, comparison = null;
  if (previousPointer.versionId !== frozenVersionId) {
    const parent = await readAcceptedWdiRelease({ root, versionId: previousPointer.versionId, expectedSha256: previousPointer.releaseSha256, visitedVersions });
    previousDataset = parent.dataset;
    previousDatasetSha256 = parent.datasetSha256;
    comparison = { versionId: parent.versionId, normalizedSha256: parent.normalizedSha256 };
  } else if (previousPointer.releaseSha256 !== null && previousPointer.releaseSha256 !== undefined) fail('frozen parent cannot carry an update digest');
  const parent = { versionId: previousPointer.versionId, releaseSha256: previousPointer.releaseSha256 || null, datasetSha256: previousDatasetSha256 };
  const candidateBytes = await fs.readFile(path.join(candidateDirectory, 'candidate.json'));
  const candidate = JSON.parse(candidateBytes);
  if (candidate.datasetId !== DATASET_ID || !VERSION.test(candidate.versionId) || candidate.status !== 'pending-independent-review' || candidate.baselineSha256 !== current.datasetSha256) fail('candidate is not eligible for review');
  if (candidate.parentVersionId !== parent.versionId) fail('candidate parent differs from current accepted release');
  const rawRecords = await Promise.all(candidate.rawSources.map((_, index) => fs.readFile(path.join(candidateDirectory, 'raw', `${index}.json`))));
  const { collections, databaseLastUpdated } = rawCollections(candidate, rawRecords);
  const reproduced = buildCandidate({
    baseline: current.dataset, baselineBytes: current.bytes, expectedBaselineSha256: current.datasetSha256,
    ...collections, retrievedAt: candidate.retrievedAt, rawSources: candidate.rawSources, comparison,
  });
  for (const field of ['content', 'diff', 'normalizedSha256', 'baselineContentSha256', 'versionId', 'status', 'comparisonContentSha256']) if (canonical(reproduced[field]) !== canonical(candidate[field])) fail(`candidate ${field} cannot be reproduced from raw sources`);
  if (candidate.diff.addedEconomiesNotIncluded.length) fail('new economy universe requires a separate design review');
  const dataset = structuredClone(current.dataset);
  dataset.rows = candidate.content.rows.map(row => {
    const annotation = candidate.content.annotations[row.geographicId];
    return annotation ? { ...row, notes: `${row.notes || ''} Source update annotation: ${annotation.footnote || ''}${annotation.sourceName ? ` Source name: ${annotation.sourceName}.` : ''}`.trim() } : row;
  });
  const source = dataset.sources.find(row => row.sourceId === 'wdi-electricity');
  source.retrievedAt = candidate.retrievedAt;
  source.version = databaseLastUpdated ? `API lastupdated ${databaseLastUpdated}` : 'API revision date not supplied';
  dataset.source = structuredClone(source);
  dataset.time.retrievedAt = candidate.retrievedAt;
  const missing = dataset.rows.filter(row => row.value === null).map(row => row.id);
  dataset.coverage.included = `${dataset.rows.length} records: ${dataset.rows.length - missing.length} populated and ${missing.length} explicit nulls`;
  dataset.coverage.nullEntityIds = missing;
  dataset.coverage.missingness = `${missing.length} null rows; unknown is not zero. No interpolation or imputation.`;
  dataset.verification = { status: 'source-values-reproduced-from-pinned-responses', acceptanceRecord: 'The separate hash-bound independent review governs acceptance.', adapterVersion: candidate.adapterVersion, candidateSha256: sha256(candidateBytes), normalizedSha256: candidate.normalizedSha256 };
  const datasetSha256 = sha256(JSON.stringify(dataset));
  const design = structuredClone(current.design);
  design.datasetBindings[0].sha256 = datasetSha256;
  design.datasetBindings[0].observationPeriod = structuredClone(dataset.time);
  const designSha256 = sha256(canonicalReviewedJSON(design));
  validateResearchBinding({ conceptId: '408', datasetSha256, dataset, design });
  const previousRows = new Map(previousDataset.rows.map(row => [row.id, row]));
  const changedRows = dataset.rows.flatMap(row => {
    const old = previousRows.get(row.id);
    if (!old) fail('parent universe differs from the supported design');
    const fields = [...new Set([...Object.keys(old), ...Object.keys(row)])].filter(field => canonical(old[field] ?? null) !== canonical(row[field] ?? null));
    return fields.length ? [{ id: row.id, geographicId: row.geographicId, fields, before: old, after: row }] : [];
  });
  const proposal = {
    schemaVersion: 1, kind: 'wdi-acceptance-proposal', datasetId: DATASET_ID, versionId: candidate.versionId,
    baselineSha256: current.datasetSha256, baselineDesignSha256: current.designSha256,
    candidateSha256: sha256(candidateBytes), normalizedSha256: candidate.normalizedSha256,
    datasetSha256, designSha256, dataset, design,
    sourceReleases: [{ sourceId: 'wdi-electricity', observationYear: '2024', databaseLastUpdated }],
    parent, lastCheckedAt: candidate.retrievedAt,
    diff: { parentVersionId: parent.versionId, parentDatasetSha256: parent.datasetSha256, changedRows, missingRows: missing },
    baselineDiff: candidate.diff,
    rawSources: candidate.rawSources,
  };
  return { proposal, proposalSha256: digestObject(proposal), candidateBytes, rawRecords };
}

export function validateIndependentReview(proposal, review) {
  if (review?.schemaVersion !== 1 || review.decision !== 'accept' || review.independent !== true || typeof review.reviewer !== 'string' || !review.reviewer.trim() || typeof review.preparedBy !== 'string' || !review.preparedBy.trim() || review.reviewer.trim() === review.preparedBy.trim()) fail('independent acceptance record required');
  if (review.proposalSha256 !== digestObject(proposal) || review.candidateSha256 !== proposal.candidateSha256 || review.datasetSha256 !== proposal.datasetSha256 || review.designSha256 !== proposal.designSha256) fail('review hash binding mismatch');
  if (!/^\d{4}-\d{2}-\d{2}T/.test(review.acceptedAt || '') || !Number.isFinite(Date.parse(review.acceptedAt)) || Date.parse(review.acceptedAt) < Date.parse(proposal.lastCheckedAt)) fail('invalid acceptance date');
  if (review.expectedPreviousVersionId !== proposal.parent.versionId) fail('review must identify the actual release it replaces');
  for (const name of CHECKS) {
    const check = review.checks?.[name];
    if (check?.status !== 'pass' || !Array.isArray(check.evidence) || !check.evidence.length || check.evidence.some(evidence => typeof evidence !== 'string' || !evidence.trim())) fail(`independent ${name} evidence required`);
  }
  return review;
}

async function pointer(root) {
  try { return await json(path.join(root, 'data-updates/accepted-manifest.json')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; return { schemaVersion: 1, datasets: {} }; }
}

async function updatePointer(root, datasetId, next, expectedPreviousVersionId, frozenVersionId) {
  const directory = path.join(root, 'data-updates');
  await fs.mkdir(directory, { recursive: true });
  const lock = path.join(directory, '.accepted-manifest.lock');
  const handle = await fs.open(lock, 'wx');
  let temporary;
  try {
    const manifest = await pointer(root);
    if (manifest.schemaVersion !== 1 || !manifest.datasets || (manifest.datasets[datasetId]?.versionId || frozenVersionId) !== expectedPreviousVersionId) fail('accepted pointer changed; review the current parent before promotion');
    await immutableJSON(path.join(directory, 'manifest-history', `${digestObject(manifest)}.json`), manifest);
    if (next === null) delete manifest.datasets[datasetId];
    else manifest.datasets[datasetId] = next;
    temporary = path.join(directory, `.manifest-${crypto.randomUUID()}.json`);
    await fs.writeFile(temporary, `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx' });
    await fs.rename(temporary, path.join(directory, 'accepted-manifest.json'));
  } finally {
    if (temporary) await fs.rm(temporary, { force: true });
    await handle.close();
    await fs.rm(lock, { force: true });
  }
}

export async function promoteWdiAcceptance({ root = ROOT, candidateDirectory, review }) {
  const { proposal, proposalSha256, candidateBytes, rawRecords } = await proposeWdiAcceptance({ root, candidateDirectory });
  validateIndependentReview(proposal, review);
  const directory = path.join(root, 'data-updates/accepted', DATASET_ID, proposal.versionId);
  const record = { schemaVersion: 1, proposal, proposalSha256, review, reviewSha256: digestObject(review) };
  const releaseSha256 = await immutableJSON(path.join(directory, 'release.json'), record);
  await fs.mkdir(path.join(directory, 'raw'), { recursive: true });
  for (const [index, bytes] of rawRecords.entries()) {
    const filename = path.join(directory, 'raw', `${index}.json`);
    try { await fs.writeFile(filename, bytes, { flag: 'wx' }); }
    catch (error) { if (error.code !== 'EEXIST' || sha256(await fs.readFile(filename)) !== sha256(bytes)) throw error; }
  }
  const candidatePath = path.join(directory, 'candidate.json');
  try { await fs.writeFile(candidatePath, candidateBytes, { flag: 'wx' }); }
  catch (error) { if (error.code !== 'EEXIST' || sha256(await fs.readFile(candidatePath)) !== proposal.candidateSha256) throw error; }
  const next = { versionId: proposal.versionId, releaseSha256, acceptedAt: review.acceptedAt };
  await updatePointer(root, DATASET_ID, next, review.expectedPreviousVersionId, `frozen-${proposal.baselineSha256.slice(0, 12)}`);
  return next;
}

export async function readAcceptedWdiRelease({ root = ROOT, versionId, expectedSha256, visitedVersions = new Set() } = {}) {
  if (!versionId) {
    const manifest = await pointer(root);
    if (manifest.schemaVersion !== 1 || !manifest.datasets) fail('invalid accepted manifest');
    const accepted = manifest.datasets[DATASET_ID];
    if (!accepted) return null;
    versionId = accepted.versionId; expectedSha256 = accepted.releaseSha256;
  }
  if (!VERSION.test(versionId) || !HASH.test(expectedSha256 || '')) fail('invalid accepted release reference');
  if (visitedVersions.has(versionId)) fail('cyclic accepted release history');
  const ancestry = new Set(visitedVersions); ancestry.add(versionId);
  const directory = path.join(root, 'data-updates/accepted', DATASET_ID, versionId);
  const bytes = await fs.readFile(path.join(directory, 'release.json'));
  if (sha256(bytes) !== expectedSha256) fail('accepted release digest mismatch');
  const record = JSON.parse(bytes);
  const reproduced = await proposeWdiAcceptance({ root, candidateDirectory: directory, parentReference: record.proposal?.parent, visitedVersions: ancestry });
  if (record.schemaVersion !== 1 || record.proposal.versionId !== versionId || record.proposalSha256 !== reproduced.proposalSha256 || digestObject(record.proposal) !== reproduced.proposalSha256 || record.reviewSha256 !== digestObject(record.review)) fail('accepted release cannot be reproduced');
  validateIndependentReview(record.proposal, record.review);
  return { ...record.proposal, acceptance: { kind: 'reviewed-update', acceptedAt: record.review.acceptedAt, reviewer: record.review.reviewer, lastCheckedAt: record.proposal.lastCheckedAt, sourceReleases: record.proposal.sourceReleases, versionId } };
}

export async function rollbackWdiAcceptance({ root = ROOT, versionId, expectedCurrentVersionId, releaseSha256 }) {
  const frozen = await baseline(root);
  const frozenVersionId = `frozen-${frozen.datasetSha256.slice(0, 12)}`;
  if (versionId === frozenVersionId) {
    await updatePointer(root, DATASET_ID, null, expectedCurrentVersionId, frozenVersionId);
    return { versionId: frozenVersionId, releaseSha256: null };
  }
  const target = await readAcceptedWdiRelease({ root, versionId, expectedSha256: releaseSha256 });
  const next = { versionId, releaseSha256, acceptedAt: target.acceptance.acceptedAt };
  await updatePointer(root, DATASET_ID, next, expectedCurrentVersionId, `frozen-${target.baselineSha256.slice(0, 12)}`);
  return next;
}

export async function acceptedWdiHistory(root = ROOT) {
  const directory = path.join(root, 'data-updates/manifest-history');
  let names;
  try { names = await fs.readdir(directory); }
  catch (error) { if (error.code === 'ENOENT') return []; throw error; }
  const references = new Map();
  for (const name of names) {
    if (!/^[a-f0-9]{64}\.json$/.test(name)) continue;
    const manifest = await json(path.join(directory, name));
    if (`${digestObject(manifest)}.json` !== name) fail('manifest history digest mismatch');
    const reference = manifest.datasets?.[DATASET_ID];
    if (reference) {
      const previous = references.get(reference.versionId);
      if (previous && previous.releaseSha256 !== reference.releaseSha256) fail('ambiguous immutable history');
      references.set(reference.versionId, reference);
    }
  }
  return Promise.all([...references.values()].map(reference => readAcceptedWdiRelease({ root, versionId: reference.versionId, expectedSha256: reference.releaseSha256 })));
}

export async function latestWdiCheck(root = ROOT) {
  const directory = path.join(root, 'data-updates/checks', DATASET_ID);
  let names;
  try { names = await fs.readdir(directory); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
  let latest = null;
  for (const name of names) {
    if (!/^[a-f0-9]{64}\.json$/.test(name)) continue;
    const bytes = await fs.readFile(path.join(directory, name));
    if (`${sha256(bytes)}.json` !== name) fail('source-check receipt digest mismatch');
    const receipt = JSON.parse(bytes);
    if (receipt.schemaVersion !== 1 || receipt.datasetId !== DATASET_ID || !HASH.test(receipt.normalizedSha256 || '') || !Number.isFinite(Date.parse(receipt.sourceCheck?.checkedAt))) fail('invalid source-check receipt');
    if (!latest || Date.parse(receipt.sourceCheck.checkedAt) > Date.parse(latest.sourceCheck.checkedAt)) latest = receipt;
  }
  return latest;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [command, candidateDirectory, reviewPath, releaseSha256] = process.argv.slice(2);
    if (command === 'propose' && candidateDirectory && !reviewPath) {
      const result = await proposeWdiAcceptance({ candidateDirectory });
      const filename = path.join(ROOT, 'data-updates/proposals', DATASET_ID, `${result.proposalSha256}.json`);
      await immutableJSON(filename, result.proposal);
      console.log(JSON.stringify({ proposalPath: filename, proposalSha256: result.proposalSha256, candidateSha256: result.proposal.candidateSha256, datasetSha256: result.proposal.datasetSha256, designSha256: result.proposal.designSha256, diff: result.proposal.diff }, null, 2));
    } else if (command === 'promote' && candidateDirectory && reviewPath) {
      console.log(JSON.stringify(await promoteWdiAcceptance({ candidateDirectory, review: await json(reviewPath) }), null, 2));
    } else if (command === 'rollback' && candidateDirectory && reviewPath) {
      console.log(JSON.stringify(await rollbackWdiAcceptance({ versionId: candidateDirectory, expectedCurrentVersionId: reviewPath, releaseSha256 }), null, 2));
    } else {
      console.log('node scripts/review-wdi.mjs propose <candidate-directory>\nnode scripts/review-wdi.mjs promote <candidate-directory> <independent-review.json>\nnode scripts/review-wdi.mjs rollback <target-version> <expected-current-version> [target-release-sha256]\nNo unattended acceptance. See docs/next-version/ACCEPTED_RELEASES.md.');
      if (command && command !== '--help') process.exitCode = 1;
    }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
