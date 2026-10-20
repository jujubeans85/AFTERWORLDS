import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { prepareDesignAmendment, prepareAmendmentRuntimeApproval } from '../scripts/research-design-amendments.mjs';
import { DESIGN_AMENDMENT_156, DESIGN_AMENDMENT_74, validateDesignAmendment, validateAmendmentRuntimeApproval, ROUNDED_53_GEOMETRY } from '../src/research-design-amendments.js';
import { canonicalReviewedJSON, researchSha256, validateResearchBinding } from '../src/research-data.js';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const registry = JSON.parse(await fs.readFile(path.join(root, 'research/designs/design-registry.json')));
const original = registry.designs.find(item => item.conceptId === '156-8');
const dataset = JSON.parse(await fs.readFile(path.join(root, original.datasetBindings[0].path)));
const helpers = { sha256: researchSha256, canonical: canonicalReviewedJSON };
async function workspace(t) {
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'afterworld-design-review-'));
  t.after(() => fs.rm(temporary, { recursive: true, force: true }));
  for (const name of ['data-updates/design-proposals/156-8-rounded-percentage.json', 'docs/next-version/156-8_FACTUAL_DESIGN_REVIEW.md']) {
    await fs.mkdir(path.dirname(path.join(temporary, name)), { recursive: true });
    await fs.copyFile(path.join(root, name), path.join(temporary, name));
  }
  return temporary;
}
test('specific reviewed correction preserves original research and emits immutable provenance', async t => {
  const directory = await workspace(t);
  const before = canonicalReviewedJSON(original);
  const result = await prepareDesignAmendment(directory, '156-8', original, DESIGN_AMENDMENT_156.datasetSha256, path.join(directory, 'dist'));
  assert.equal(canonicalReviewedJSON(original), before);
  assert.equal(result.design.implementation.geometry, ROUNDED_53_GEOMETRY);
  assert.equal(await researchSha256(canonicalReviewedJSON(result.design)), DESIGN_AMENDMENT_156.effectiveDesignSha256);
  for (const reference of [result.summary, result.summary.review, result.summary.proposal, result.summary.originalDesign]) {
    assert.equal(await researchSha256(await fs.readFile(path.join(directory, 'dist', reference.url))), reference.sha256);
  }
  assert.deepEqual(validateResearchBinding({ conceptId: '156-8', datasetSha256: DESIGN_AMENDMENT_156.datasetSha256, dataset, design: result.design }).map(row => [row.value, row.qualifier]), [[53, 'rounded source percentage'], [90, null]]);
  assert.throws(() => validateResearchBinding({ conceptId: '156-8', datasetSha256: DESIGN_AMENDMENT_156.datasetSha256, dataset, design: original }), /corrected geometry/);
  const again = await prepareDesignAmendment(directory, '156-8', original, DESIGN_AMENDMENT_156.datasetSha256, path.join(directory, 'dist'));
  assert.equal(again.amendmentSha256, result.amendmentSha256);
});
test('missing or edited independent review and altered proposals fail closed', async t => {
  for (const variant of ['missing-review', 'changed-review', 'changed-proposal']) {
    const directory = await workspace(t);
    if (variant === 'missing-review') await fs.rm(path.join(directory, 'docs/next-version/156-8_FACTUAL_DESIGN_REVIEW.md'));
    if (variant === 'changed-review') await fs.appendFile(path.join(directory, 'docs/next-version/156-8_FACTUAL_DESIGN_REVIEW.md'), '\nChanged review');
    if (variant === 'changed-proposal') {
      const filename = path.join(directory, 'data-updates/design-proposals/156-8-rounded-percentage.json');
      const proposal = JSON.parse(await fs.readFile(filename));
      proposal.proposedChanges[0].value = 'Use an open bound at 53.';
      await fs.writeFile(filename, JSON.stringify(proposal));
    }
    await assert.rejects(prepareDesignAmendment(directory, '156-8', original, DESIGN_AMENDMENT_156.datasetSha256), /ENOENT|Research amendment:/);
  }
});
test('browser evidence verification rejects tampered original, effective design, review and dataset binding', async () => {
  const result = await prepareDesignAmendment(root, '156-8', original, DESIGN_AMENDMENT_156.datasetSha256);
  for (const mutate of [
    record => { record.originalDesign.title = 'Changed'; },
    record => { record.reviewText += 'Changed'; },
    record => { record.proposalText += ' '; },
    record => { record.reviewSha256 = '0'.repeat(64); },
  ]) {
    const changed = structuredClone(result.record); mutate(changed);
    await assert.rejects(validateDesignAmendment(changed, result.design, DESIGN_AMENDMENT_156.datasetSha256, helpers), /Research amendment:/);
  }
  const design = structuredClone(result.design); design.implementation.geometry = original.implementation.geometry;
  await assert.rejects(validateDesignAmendment(result.record, design, DESIGN_AMENDMENT_156.datasetSha256, helpers), /digest mismatch/);
  await assert.rejects(validateDesignAmendment(result.record, result.design, '0'.repeat(64), helpers), /identity/);
  assert.equal(await prepareDesignAmendment(root, '430', original, DESIGN_AMENDMENT_156.datasetSha256), null);
});
test('factual support cannot substitute for a separately dated runtime review', async t => {
  const directory = await workspace(t), dist = path.join(directory, 'dist');
  const amendment = await prepareDesignAmendment(directory, '156-8', original, DESIGN_AMENDMENT_156.datasetSha256);
  await assert.rejects(prepareAmendmentRuntimeApproval(directory, amendment, dist), /ENOENT/);
  // Fictitious review exists only in this disposable fixture; never repository approval.
  const approval = { schemaVersion: 1, ...DESIGN_AMENDMENT_156, amendmentSha256: amendment.amendmentSha256,
    decision: 'approve-runtime-activation', independent: true, reviewerKind: 'independent-agent',
    reviewer: 'fixture-reviewer', preparedBy: 'fixture-author', reviewedAt: '2026-10-20T07:00:00Z',
    checks: Object.fromEntries(['sourceMeaning', 'nativeUnits', 'scene', 'tableParity', 'browser', 'regressions'].map(key => [key, { status: 'pass', evidence: 'Disposable test evidence only' }])) };
  assert.equal(validateAmendmentRuntimeApproval(approval, amendment.amendmentSha256), approval);
  for (const mutate of [
    value => { value.independent = false; },
    value => { value.reviewer = value.preparedBy; },
    value => { value.checks.scene.status = 'pending'; },
    value => { value.reviewedAt = '2026-10-19T00:00:00Z'; },
    value => { value.amendmentSha256 = '0'.repeat(64); },
  ]) {
    const bad = structuredClone(approval); mutate(bad);
    assert.throws(() => validateAmendmentRuntimeApproval(bad, amendment.amendmentSha256), /Research amendment:/);
  }
  await fs.mkdir(path.join(directory, 'data-updates/design-activation'), { recursive: true });
  await fs.writeFile(path.join(directory, 'data-updates/design-activation/156-8.json'), JSON.stringify(approval));
  const result = await prepareAmendmentRuntimeApproval(directory, amendment, dist);
  assert.equal(result.summary.reviewedAt, approval.reviewedAt);
  assert.equal(await researchSha256(result.text), result.sha256);
});

test('74 exact task-literal correction retains four rows and requires a separate concept-bound runtime review', async t => {
  const source = registry.designs.find(item => item.conceptId === '74');
  const data = JSON.parse(await fs.readFile(path.join(root, source.datasetBindings[0].path)));
  const amendment = await prepareDesignAmendment(root, '74', source, DESIGN_AMENDMENT_74.datasetSha256);
  const rows = validateResearchBinding({ conceptId: '74', datasetSha256: DESIGN_AMENDMENT_74.datasetSha256, design: amendment.design, dataset: data });
  assert.deepEqual(rows.map(row => [row.id, row.value]), [['gemma-0-1', 60], ['gemma-0-2', 67.6], ['gemma-2-1', 37.5], ['gemma-2-2', 20.8]]);
  assert.equal(data.rows.length, 18);
  assert.equal(source.datasetBindings[0].includedRowCount, 2);
  assert.equal(amendment.record.authorizesRuntimeActivation, false);
  assert.equal(await researchSha256(canonicalReviewedJSON(amendment.design)), DESIGN_AMENDMENT_74.effectiveDesignSha256);
  assert.throws(() => validateResearchBinding({ conceptId: '74', datasetSha256: DESIGN_AMENDMENT_74.datasetSha256, design: source, dataset: data }), /row selection/);
  const temporary = await workspace(t);
  await assert.rejects(prepareAmendmentRuntimeApproval(temporary, amendment, path.join(temporary, 'dist')), /ENOENT/);
  for (const mutate of [record => { record.reviewText += ' '; }, record => { record.proposalText += ' '; }, record => { record.conceptId = '156-8'; }]) {
    const changed = structuredClone(amendment.record); mutate(changed);
    await assert.rejects(validateDesignAmendment(changed, amendment.design, DESIGN_AMENDMENT_74.datasetSha256, helpers), /Research amendment:/);
  }
  const changed = structuredClone(amendment.design); changed.datasetBindings[0].filter.all[1].values[1] = 'AIME2026';
  await assert.rejects(validateDesignAmendment(amendment.record, changed, DESIGN_AMENDMENT_74.datasetSha256, helpers), /digest mismatch/);
  assert.throws(() => validateAmendmentRuntimeApproval({ schemaVersion: 1, ...DESIGN_AMENDMENT_74 }, amendment.amendmentSha256, '156-8'), /runtime approval/);
});
