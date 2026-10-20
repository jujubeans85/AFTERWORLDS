import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { canonicalReviewedJSON } from '../src/research-data.js';
import { DESIGN_AMENDMENTS, applyDesignCorrection, validateDesignAmendment, validateAmendmentRuntimeApproval } from '../src/research-design-amendments.js';
const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');

export async function prepareDesignAmendment(root, conceptId, originalDesign, datasetSha256, dist) {
  const contract = DESIGN_AMENDMENTS[conceptId];
  if (!contract) return null;
  const proposalName = { '156-8': '156-8-rounded-percentage', '74': '74-two-task-selection' }[conceptId];
  const proposalText = await fs.readFile(path.join(root, `data-updates/design-proposals/${proposalName}.json`), 'utf8');
  const reviewText = await fs.readFile(path.join(root, `docs/next-version/${conceptId}_FACTUAL_DESIGN_REVIEW.md`), 'utf8');
  const design = applyDesignCorrection(originalDesign, JSON.parse(proposalText));
  const record = {
    schemaVersion: 1, kind: 'scientific-design-correction', ...contract,
    status: 'scientific-review-supported', authorizesRuntimeActivation: false,
    reviewScope: 'Independent agent factual review of the scientific correction; not human identity authentication or production approval.',
    originalDesign, proposalText, reviewText,
  };
  await validateDesignAmendment(record, design, datasetSha256, { sha256, canonical: canonicalReviewedJSON });
  const amendmentSha256 = sha256(canonicalReviewedJSON(record));
  const references = {};
  if (dist) {
    const documents = {
      amendment: [canonicalReviewedJSON(record), amendmentSha256, 'json'],
      originalDesign: [canonicalReviewedJSON(originalDesign), record.originalDesignSha256, 'json'],
      proposal: [proposalText, record.proposalSha256, 'json'],
      review: [reviewText, record.reviewSha256, 'md'],
    };
    await fs.mkdir(path.join(dist, 'assets/research/amendments'), { recursive: true });
    for (const [key, [bytes, digest, extension]] of Object.entries(documents)) {
      const url = `/assets/research/amendments/${digest}.${extension}`;
      const file = path.join(dist, url);
      try { await fs.writeFile(file, bytes, { flag: 'wx' }); }
      catch (error) {
        if (error.code !== 'EEXIST') throw error;
        if (sha256(await fs.readFile(file)) !== digest) throw Error('Research amendment: immutable evidence collision');
      }
      references[key] = { url, sha256: digest };
    }
  }
  return {
    design, designSha256: record.effectiveDesignSha256, record, amendmentSha256,
    summary: { sha256: amendmentSha256, url: references.amendment?.url,
      originalDesignSha256: record.originalDesignSha256, effectiveDesignSha256: record.effectiveDesignSha256,
      proposal: references.proposal, review: { ...references.review, scope: record.reviewScope }, originalDesign: references.originalDesign },
  };
}

export async function prepareAmendmentRuntimeApproval(root, amendment, dist) {
  const bytes = await fs.readFile(path.join(root, `data-updates/design-activation/${amendment.record.conceptId}.json`));
  const record = validateAmendmentRuntimeApproval(JSON.parse(bytes), amendment.amendmentSha256, amendment.record.conceptId);
  const digest = sha256(bytes), url = `/assets/research/amendments/${digest}.json`;
  await fs.mkdir(path.join(dist, 'assets/research/amendments'), { recursive: true });
  try { await fs.writeFile(path.join(dist, url), bytes, { flag: 'wx' }); }
  catch (error) {
    if (error.code !== 'EEXIST') throw error;
    if (sha256(await fs.readFile(path.join(dist, url))) !== digest) throw Error('Research amendment: immutable runtime review collision');
  }
  return { record, sha256: digest, text: bytes.toString('utf8'),
    summary: { url, sha256: digest, reviewedAt: record.reviewedAt, reviewer: record.reviewer, reviewerKind: record.reviewerKind } };
}
