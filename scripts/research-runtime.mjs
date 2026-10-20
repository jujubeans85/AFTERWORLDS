import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { ACTIVE_RESEARCH_CONCEPTS, canonicalReviewedJSON, validateResearchBinding, validateResearchGeography } from '../src/research-data.js';
import { prepareElectricityGeography } from './research-geography.mjs';
import { readAcceptedWdiRelease, acceptedWdiHistory, latestWdiCheck } from './review-wdi.mjs';
import { prepareDesignAmendment, prepareAmendmentRuntimeApproval } from './research-design-amendments.mjs';

const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const fail = message => { throw new Error(`Research build: ${message}`); };
const one = (records, predicate, label) => {
  const matches = records.filter(predicate);
  if (matches.length !== 1) fail(`missing or duplicate ${label}`);
  return matches[0];
};

export async function writeResearchHistory(dist, conceptId, versions) {
  const bytes = JSON.stringify({ schemaVersion: 1, conceptId, versions });
  if (Buffer.byteLength(bytes) > 256_000) fail('history index exceeds bounded reader size');
  const sha256 = digest(bytes), url = `/assets/research/history/${sha256}.json`;
  const filename = path.join(dist, url);
  await fs.mkdir(path.dirname(filename), { recursive: true });
  try { await fs.writeFile(filename, bytes, { flag: 'wx' }); }
  catch (error) {
    if (error.code !== 'EEXIST') throw error;
    if (digest(await fs.readFile(filename)) !== sha256) fail('immutable history path contains different bytes');
  }
  return { url, sha256 };
}

export async function prepareResearchRuntime(root, dist) {
  const read = async relative => JSON.parse(await fs.readFile(path.join(root, relative), 'utf8'));
  const [manifest, registry, audit, finalReview] = await Promise.all([
    read('research/manifest.json'), read('research/designs/design-registry.json'),
    read('research/audits/design-contract-review.json'), read('research/audits/final-review.json'),
  ]);
  const summaries = {};
  const versions = {};
  for (const conceptId of ACTIVE_RESEARCH_CONCEPTS) {
    const queued = one(manifest.implementationQueue, item => item.conceptId === conceptId, 'implementation queue entry');
    const design = one(registry.designs, item => item.conceptId === conceptId && item.designId === queued.designId, 'design');
    const reviewed = one(audit.designs, item => item.conceptId === conceptId, 'design review');
    const accepted = one(finalReview.concepts, item => item.conceptId === conceptId, 'final review');
    if (reviewed.status !== 'contract-accepted' || reviewed.designId !== design.designId || !['direct-ready', 'context-ready', 'reframe-ready'].includes(accepted.verdict) || accepted.verdict !== queued.verdict) fail('concept lacks matching independent acceptance');
    if (!(accepted.review?.score >= 92) || accepted.blockers?.length || Array.from({ length: 10 }, (_, index) => `G${index + 1}`).some(gate => accepted.review?.gates?.[gate]?.status !== 'pass')) fail('independent research gates are incomplete');
    const designSha256 = digest(canonicalReviewedJSON(design));
    if (designSha256 !== reviewed.designRecordSha256) fail('stale design digest');
    if (queued.datasets.length !== 1) fail('unsupported dataset count');
    const reference = queued.datasets[0];
    if (reference.path !== `research/datasets/${reference.datasetId}.json` || !/^[a-z0-9-]+$/.test(reference.datasetId)) fail('invalid dataset path');
    const sourceBytes = await fs.readFile(path.join(root, reference.path));
    const datasetSha256 = digest(sourceBytes);
    if (reference.sha256 !== datasetSha256 || reviewed.datasetDigests[reference.datasetId] !== datasetSha256 || accepted.review?.datasetDigests?.[reference.datasetId] !== datasetSha256) fail('stale dataset digest');
    const dataset = JSON.parse(sourceBytes.toString('utf8'));
    const amendment = await prepareDesignAmendment(root, conceptId, design, datasetSha256, dist);
    const runtimeApproval = amendment ? await prepareAmendmentRuntimeApproval(root, amendment, dist) : null;
    const publish = async (dataset, design, datasetSha256, designSha256, acceptance) => {
    const rows = validateResearchBinding({ conceptId, datasetSha256, design, dataset });
    const geography = conceptId === '408' ? validateResearchGeography(await prepareElectricityGeography(root, dataset), rows) : null;
    const geographySha256 = geography ? digest(canonicalReviewedJSON(geography)) : null;
    const revision = digest(`${conceptId}:${datasetSha256}:${designSha256}${geography ? `:${geographySha256}` : ''}${amendment ? `:${amendment.amendmentSha256}:${runtimeApproval.sha256}` : ''}`);
    const bundle = { schemaVersion: 1, conceptId, revision, datasetSha256, designSha256, datasetCanonicalSha256: digest(canonicalReviewedJSON(dataset)), design, dataset, ...(geography ? {geography, geographySha256} : {}), ...(amendment ? { designAmendment: amendment.record, designAmendmentSha256: amendment.amendmentSha256, runtimeApprovalText: runtimeApproval.text, runtimeApprovalSha256: runtimeApproval.sha256 } : {}) };
    const bytes = JSON.stringify(bundle);
    const sha256 = digest(bytes);
    const directory = path.join(dist, 'assets/research');
    const filename = path.join(directory, `${sha256}.json`);
    await fs.mkdir(directory, { recursive: true });
    try { await fs.writeFile(filename, bytes, { flag: 'wx' }); }
    catch (error) {
      if (error.code !== 'EEXIST') throw error;
      if (digest(await fs.readFile(filename)) !== sha256) fail('immutable release path contains different bytes');
    }
    const summary = {
      conceptId, title: design.title, question: design.question, claim: design.exactClaim,
      aiRelationship: design.aiRelationship, datasetId: dataset.datasetId,
      release: { url: `/assets/research/${sha256}.json`, sha256 },
      datasetSha256, designSha256, revision, observationPeriod: dataset.time,
      scale: design.scale, geographyMode: design.geographyMode,
      primitive: design.implementation.primitive,
      ...(geography ? { geographySha256, mapCoverage: geography.coverage } : {}),
      ...(amendment ? { designAmendment: { ...amendment.summary, runtimeApproval: runtimeApproval.summary,
        originalResearchRevision: { revision: digest(`${conceptId}:${datasetSha256}:${amendment.record.originalDesignSha256}`), scope: 'frozen-specification-only; never activated as runtime', acceptedAt: finalReview.reviewedAt } } } : {}),
      acceptance: amendment ? { ...acceptance, kind: 'design-amended-research', acceptedAt: runtimeApproval.record.reviewedAt,
        originalResearchAcceptedAt: finalReview.reviewedAt, amendmentFactuallyReviewedAt: '2026-10-20',
        runtimeReviewedAt: runtimeApproval.record.reviewedAt, runtimeReviewer: runtimeApproval.record.reviewer,
        runtimeApprovalSha256: runtimeApproval.sha256 } : acceptance,
    };
    (versions[conceptId] ||= {})[revision] = summary;
    return summary;
    };
    summaries[conceptId] = await publish(dataset, amendment?.design || design, datasetSha256, amendment?.designSha256 || designSha256, {
      kind: 'frozen-research', acceptedAt: finalReview.reviewedAt, lastCheckedAt: dataset.time.retrievedAt,
      sourceReleases: dataset.sources.map(source => ({ sourceId: source.sourceId, version: source.version, publishedAt: source.publishedAt })),
    });
    if (conceptId === '408') {
      for (const history of await acceptedWdiHistory(root)) await publish(history.dataset, history.design, history.datasetSha256, history.designSha256, history.acceptance);
      const acceptedUpdate = await readAcceptedWdiRelease({ root });
      if (acceptedUpdate) summaries[conceptId] = await publish(acceptedUpdate.dataset, acceptedUpdate.design, acceptedUpdate.datasetSha256, acceptedUpdate.designSha256, acceptedUpdate.acceptance);
      const check = await latestWdiCheck(root);
      if (check) {
        summaries[conceptId].acceptance.lastCheckedAt = check.sourceCheck.checkedAt;
        summaries[conceptId].acceptance.lastCheckStatus = check.status;
        summaries[conceptId].acceptance.checkedNormalizedSha256 = check.normalizedSha256;
      }
    }
  }
  const history = {};
  for (const [conceptId, records] of Object.entries(versions)) history[conceptId] = await writeResearchHistory(dist, conceptId, records);
  const manifestPath = path.join(dist, 'assets/research/accepted-manifest.json');
  const temporary = `${manifestPath}.${crypto.randomUUID()}.tmp`;
  const manifestBytes = JSON.stringify({ schemaVersion: 1, worlds: summaries, history });
  if (Buffer.byteLength(manifestBytes) > 256_000) fail('accepted manifest exceeds bounded reader size');
  try {
    await fs.writeFile(temporary, manifestBytes, { flag: 'wx' });
    await fs.rename(temporary, manifestPath);
  } finally { await fs.rm(temporary, { force: true }); }
  return summaries;
}
