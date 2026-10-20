import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { canonicalReviewedJSON } from '../src/research-data.js';
import { MULTIPLE_BINDINGS, multipleDigestInput, validateMultipleBinding } from '../src/research-multiple.js';
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
export async function prepareMultipleResearchRelease({ root, dist, conceptId, queued, design, designSha256, reviewed, accepted, reviewedAt }) {
  const contract = MULTIPLE_BINDINGS[conceptId];
  if (digest(canonicalReviewedJSON(design)) !== designSha256 || reviewed.designRecordSha256 !== designSha256) throw Error('Research multi-source: stale design digest');
  if (!contract || queued.datasets.length !== contract.datasets.length) throw Error('Research multi-source: unsupported queued source count');
  const datasets = [];
  for (const [index, reference] of queued.datasets.entries()) {
    if (reference.datasetId !== contract.datasets[index] || reference.path !== `research/datasets/${reference.datasetId}.json`) throw Error('Research multi-source: source order or path mismatch');
    const bytes = await fs.readFile(path.join(root, reference.path)), datasetSha256 = digest(bytes);
    if (reference.sha256 !== datasetSha256 || reviewed.datasetDigests[reference.datasetId] !== datasetSha256 || accepted.review?.datasetDigests?.[reference.datasetId] !== datasetSha256) throw Error('Research multi-source: stale dataset digest');
    const dataset = JSON.parse(bytes);
    datasets.push({ datasetId: reference.datasetId, datasetSha256, datasetCanonicalSha256: digest(canonicalReviewedJSON(dataset)), dataset });
  }
  validateMultipleBinding({ conceptId, design, datasets }, canonicalReviewedJSON);
  const datasetSha256 = digest(multipleDigestInput(datasets, canonicalReviewedJSON));
  const revision = digest(`${conceptId}:${datasetSha256}:${designSha256}`);
  const bundle = { schemaVersion: 2, conceptId, revision, datasetBindingKind: 'multiple', datasetSha256, designSha256, design, datasets };
  const bytes = JSON.stringify(bundle), sha256 = digest(bytes), url = `/assets/research/${sha256}.json`;
  if (Buffer.byteLength(bytes) > 2_000_000) throw Error('Research multi-source: release exceeds bounded reader size');
  await fs.mkdir(path.join(dist, 'assets/research'), { recursive: true });
  try { await fs.writeFile(path.join(dist, url), bytes, { flag: 'wx' }); }
  catch (error) { if (error.code !== 'EEXIST') throw error; if (digest(await fs.readFile(path.join(dist, url))) !== sha256) throw Error('Research multi-source: immutable release collision'); }
  return {
    conceptId, title: design.title, question: design.question, claim: design.exactClaim, aiRelationship: design.aiRelationship,
    release: { url, sha256 }, datasetBindingKind: 'multiple', datasetSha256, designSha256, revision,
    datasets: datasets.map(entry => ({ datasetId: entry.datasetId, datasetSha256: entry.datasetSha256, observationPeriod: entry.dataset.time })),
    observationPeriod: { ...contract.observationPeriod, publishedAt: 'Separate source releases', retrievedAt: '2026-10-19', updateCadence: 'Recheck each primary source; no live-data claim.' },
    scale: design.scale, geographyMode: design.geographyMode, primitive: design.implementation.primitive,
    acceptance: { kind: 'frozen-research', acceptedAt: reviewedAt, lastCheckedAt: '2026-10-19',
      sourceReleases: datasets.flatMap(entry => entry.dataset.sources.map(source => ({ datasetId: entry.datasetId, sourceId: source.sourceId, version: source.version, publishedAt: source.publishedAt }))) },
  };
}
