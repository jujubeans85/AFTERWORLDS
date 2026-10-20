import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { ACTIVE_RESEARCH_CONCEPTS, canonicalReviewedJSON, validateResearchBinding } from '../src/research-data.js';

const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const fail = message => { throw new Error(`Research build: ${message}`); };
const one = (records, predicate, label) => {
  const matches = records.filter(predicate);
  if (matches.length !== 1) fail(`missing or duplicate ${label}`);
  return matches[0];
};

export async function prepareResearchRuntime(root, dist) {
  const read = async relative => JSON.parse(await fs.readFile(path.join(root, relative), 'utf8'));
  const [manifest, registry, audit, finalReview] = await Promise.all([
    read('research/manifest.json'), read('research/designs/design-registry.json'),
    read('research/audits/design-contract-review.json'), read('research/audits/final-review.json'),
  ]);
  const summaries = {};
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
    validateResearchBinding({ conceptId, datasetSha256, design, dataset });
    const revision = digest(`${conceptId}:${datasetSha256}:${designSha256}`);
    const bundle = { schemaVersion: 1, conceptId, revision, datasetSha256, designSha256, datasetCanonicalSha256: digest(canonicalReviewedJSON(dataset)), design, dataset };
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
    summaries[conceptId] = {
      conceptId, title: design.title, question: design.question, claim: design.exactClaim,
      aiRelationship: design.aiRelationship, datasetId: dataset.datasetId,
      release: { url: `/assets/research/${sha256}.json`, sha256 },
      datasetSha256, designSha256, revision, observationPeriod: dataset.time,
      scale: design.scale, geographyMode: design.geographyMode,
    };
  }
  return summaries;
}
