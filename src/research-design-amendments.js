// Explicit independently examined scientific corrections. No arbitrary patches,
// external paths, reviewer inference or original-research overwrites are allowed.
export const DESIGN_AMENDMENT_156 = Object.freeze({
  conceptId: '156-8',
  originalDesignSha256: '783a5aba9f2fde15372cb3c196bd54536cf8e6eee85e715c788e1004825ac4bf',
  effectiveDesignSha256: '0a2ce8e2f00ebef89842538329cc16869c8eb480d09bdc19e4636c3cb0287b05',
  datasetSha256: '1aa6dcfc1acbdfeb681d48ad4598b91cd2e1138a4bc98fa3beeda64cdffecfa3',
  proposalSha256: '1117408097c1011504cf09a0c1dc15e83b8469044d0440b7a98a00f0956ae5a7',
  reviewSha256: 'afe6aabd191c20a81c90c602ac85869b29685e82496521d71621a022dd87a57b',
});
export const DESIGN_AMENDMENT_74 = Object.freeze({
  conceptId: '74',
  originalDesignSha256: '15d189d2d273c17edf1eef416ecb3ad655c4fb45d4fb2f6297483cf016001711',
  effectiveDesignSha256: '93895fdf9388fd75cd1d2df564f3efabe8591456090073676f04ba18f4204b25',
  datasetSha256: '0e336f937febe3f8c5f19b6fd5efdb032c48c18a8c29abbbc7a0a4e52f4bbf2c',
  proposalSha256: '5dbb02da9dfeb8860b1b62f673f242f63e957be45232db99524c433ce07b93a2',
  reviewSha256: 'eb5b60b5ab3f9273971fccb06940635b0df5229ae3708a936b8029036e6854d6',
});
export const DESIGN_AMENDMENTS = Object.freeze({ '156-8': DESIGN_AMENDMENT_156, '74': DESIGN_AMENDMENT_74 });
const twoTaskRegression = 'Bind exactly two selected models on each of MMLU Pro and AIME 2026, preserving all four source row IDs, benchmark labels and configurations. No overall ranking or temporal interpolation.';
export const ROUNDED_53_GEOMETRY = 'Two separated facets each contain their own 0–100% bar. The first observation displays the primary-report-rounded 53% with an explicit rounded-source label and no strict lower-bound arrow. The 90% panel retains its distinct conditional denominator. Do not multiply the two percentages.';
const regression = 'The 53% observation is the rounded primary-report figure, not a strict lower bound. Preserve its qualifier and do not derive a joint percentage from the separate conditional denominator.';
const fail = message => { throw Error(`Research amendment: ${message}`); };
export function applyDesignCorrection(original, proposal) {
  const conceptId = original?.conceptId;
  if (!DESIGN_AMENDMENTS[conceptId] || proposal?.conceptId !== conceptId || proposal.status !== 'proposed-not-accepted') fail('unapproved correction');
  const changes = conceptId === '156-8' ? [
    { path: 'implementation.geometry', value: ROUNDED_53_GEOMETRY },
    { path: 'validationTests', operation: 'append', value: regression },
  ] : [
    { path: 'datasetBindings[0].filter.all[1].values', value: ['MMLU Pro', 'AIME 2026'] },
    { path: 'datasetBindings[0].includedRowIds', value: ['gemma-0-1', 'gemma-0-2', 'gemma-2-1', 'gemma-2-2'] },
    { path: 'datasetBindings[0].includedRowCount', value: 4 },
    { path: 'validationTests', operation: 'append', value: twoTaskRegression },
  ];
  if (JSON.stringify(proposal.proposedChanges) !== JSON.stringify(changes)) fail('unapproved correction');
  const effective = structuredClone(original);
  if (conceptId === '156-8') {
    effective.implementation.geometry = ROUNDED_53_GEOMETRY;
    effective.validationTests.push(regression);
  } else {
    effective.datasetBindings[0].filter.all[1].values = ['MMLU Pro', 'AIME 2026'];
    effective.datasetBindings[0].includedRowIds = ['gemma-0-1', 'gemma-0-2', 'gemma-2-1', 'gemma-2-2'];
    effective.datasetBindings[0].includedRowCount = 4;
    effective.validationTests.push(twoTaskRegression);
  }
  return effective;
}
export async function validateDesignAmendment(record, effectiveDesign, datasetSha256, { sha256, canonical }) {
  const contract = DESIGN_AMENDMENTS[record?.conceptId];
  if (!contract || record?.schemaVersion !== 1 || record.kind !== 'scientific-design-correction' ||
      record.status !== 'scientific-review-supported' || record.authorizesRuntimeActivation !== false ||
      effectiveDesign?.conceptId !== contract.conceptId || datasetSha256 !== contract.datasetSha256) fail('unsupported amendment identity');
  for (const key of ['originalDesignSha256', 'effectiveDesignSha256', 'datasetSha256', 'proposalSha256', 'reviewSha256'])
    if (record[key] !== contract[key]) fail(`changed ${key}`);
  if (typeof record.proposalText !== 'string' || typeof record.reviewText !== 'string' ||
      await sha256(record.proposalText) !== contract.proposalSha256 ||
      await sha256(record.reviewText) !== contract.reviewSha256 ||
      await sha256(canonical(record.originalDesign)) !== contract.originalDesignSha256 ||
      await sha256(canonical(effectiveDesign)) !== contract.effectiveDesignSha256) fail('evidence or design digest mismatch');
  const proposal = JSON.parse(record.proposalText);
  if (proposal.originalDesign?.sha256 !== contract.originalDesignSha256 || proposal.dataset?.sha256 !== contract.datasetSha256) fail('proposal source binding mismatch');
  const reconstructed = applyDesignCorrection(record.originalDesign, proposal);
  if (canonical(reconstructed) !== canonical(effectiveDesign)) fail('effective design differs from exact reviewed correction');
  return record;
}

export function validateAmendmentRuntimeApproval(approval, amendmentSha256, conceptId = approval?.conceptId) {
  const contract = DESIGN_AMENDMENTS[approval?.conceptId];
  if (!contract || approval.conceptId !== conceptId || approval?.schemaVersion !== 1 ||
      approval.decision !== 'approve-runtime-activation' || approval.independent !== true ||
      approval.reviewerKind !== 'independent-agent' || typeof approval.reviewer !== 'string' || !approval.reviewer.trim() ||
      typeof approval.preparedBy !== 'string' || !approval.preparedBy.trim() || approval.reviewer === approval.preparedBy ||
      approval.amendmentSha256 !== amendmentSha256) fail('missing separate runtime approval');
  for (const key of ['originalDesignSha256', 'effectiveDesignSha256', 'datasetSha256', 'proposalSha256', 'reviewSha256'])
    if (approval[key] !== contract[key]) fail(`runtime approval changed ${key}`);
  if (!/^\d{4}-\d\d-\d\dT/.test(approval.reviewedAt || '') || !Number.isFinite(Date.parse(approval.reviewedAt)) ||
      Date.parse(approval.reviewedAt) < Date.parse('2026-10-20T00:00:00Z')) fail('invalid runtime review date');
  for (const check of ['sourceMeaning', 'nativeUnits', 'scene', 'tableParity', 'browser', 'regressions'])
    if (approval.checks?.[check]?.status !== 'pass' || typeof approval.checks[check].evidence !== 'string' || !approval.checks[check].evidence.trim()) fail(`incomplete runtime review ${check}`);
  return approval;
}
