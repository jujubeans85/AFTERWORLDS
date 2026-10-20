// Three exact source combinations. Their unlike units never acquire a shared scale.
const all = 'all supplied rows; no implicit exclusion';
const select = values => ({ all: [{ field: 'id', op: 'in', values }] });
const IRISH = 'physical-irish-electricity-series', RULES = 'physical-grid-connection-rules';
const INFERENCE = 'physical-inference-boundaries', DEMAND = 'physical-electricity-demand';
export const MULTIPLE_BINDINGS = Object.freeze({
  '394': { primitive: 'metered-history-and-policy-hinge', datasets: [IRISH, RULES], filters: [all, all],
    scale: { type: 'panel-specific', domains: { history: [0, 8000], rules: 'categorical' }, units: { history: 'GWh/year', rules: 'dated connection conditions' } },
    observationPeriod: { observationStart: '2015', observationEnd: '2026-05-20 policy', scope: 'Cross-source context; annual history and policy date are separate observations.' } },
  '217': { primitive: 'incompatible-scale-reading-panels', datasets: [INFERENCE, DEMAND], filters: [select(['energychange']), select(['dcgrowth', 'aigrowth', 'dc2025'])],
    scale: { type: 'panel-specific', units: { efficiency: 'fold reduction', growth: 'percent year-on-year', energy: 'TWh/year' } },
    observationPeriod: { observationStart: '2024-05', observationEnd: '2025', scope: 'Cross-source context; per-prompt change and aggregate electricity observations have different periods and populations.' } },
  '56-5': { primitive: 'national-share-history-with-global-context', datasets: [DEMAND, IRISH], filters: [all, all],
    scale: { type: 'panel-specific', domains: { irishShare: [0, 100] }, units: { irishShare: 'percent of national metered electricity', globalDemand: 'TWh/year', globalGrowth: 'percent year-on-year' } },
    observationPeriod: { observationStart: '2015', observationEnd: '2025', scope: 'Cross-source context; national annual history and global 2025 estimates remain separate.' } },
});
const SOURCE_CONTRACTS = {
  [IRISH]: { sha256: 'da5471b2309e19053e6a6acf944b933fb221b0118dee0afa1e88150558d6de3e', unit: 'GWh/year',
    ids: Array.from({ length: 11 }, (_, i) => `irl-${2015 + i}`), units: Array(11).fill('GWh/year'), status: 'observed',
    periods: Array.from({ length: 11 }, (_, i) => String(2015 + i)), geography: 'IRL' },
  [RULES]: { sha256: '10ba6b71f0aaf33a171d8d568376672d6c98e73ffcc70f7efe282a659530c36c', unit: 'category',
    ids: ['generation', 'renewables', 'dependent'], units: Array(3).fill('category'), status: 'categorical', periods: Array(3).fill('2026-05-20 policy'), geography: 'IRL' },
  [INFERENCE]: { sha256: '76f36914d69f666af3acc69d9706aa2e7ee155574e4a30fc8598e9e7b618c1c0', unit: 'mixed, row-specific',
    ids: ['fullenergy', 'chipenergy', 'fullcarbon', 'fullwater', 'energychange'], units: ['Wh/prompt', 'Wh/prompt', 'g CO2e/prompt', 'mL/prompt', 'fold reduction'],
    status: 'estimated', periods: [...Array(4).fill('2025-05'), '2024-05/2025-05'], geography: null },
  [DEMAND]: { sha256: 'aa577c85b31ea2d9747940563928a6f51ae9ae56aea23eddc39314b988b99589', unit: 'mixed, row-specific',
    ids: ['dc2025', 'dcgrowth', 'aigrowth'], units: ['TWh/year', '% year-on-year', '% year-on-year'], status: 'estimated', periods: Array(3).fill('2025'), geography: null },
};
const fail = message => { throw Error(`Research multi-source: ${message}`); };
export function multipleDigestInput(entries, canonical) {
  return canonical(entries.map(({ datasetId, datasetSha256 }) => ({ datasetId, datasetSha256 })));
}
export function validateMultipleBinding({ conceptId, design, datasets }, canonical) {
  const contract = MULTIPLE_BINDINGS[conceptId];
  if (!contract || design?.conceptId !== conceptId || design.designId !== `design-${conceptId}` || design.status !== 'accepted-specification' || design.reviewAcceptancePending !== false ||
      design.scoring?.type !== 'none' || design.forecast?.type !== 'none' || design.implementation?.primitive !== contract.primitive || design.geographyMode !== (conceptId === '394' ? 'categorical' : 'global') || canonical(design.scale) !== canonical(contract.scale) ||
      !Array.isArray(datasets) || datasets.length !== contract.datasets.length || design.datasetBindings?.length !== contract.datasets.length) fail('unsupported identity, primitive or source count');
  const boundRowsByDataset = {}, rows = [], identities = new Set();
  for (const [index, entry] of datasets.entries()) {
    const datasetId = contract.datasets[index], source = SOURCE_CONTRACTS[datasetId], dataset = entry.dataset, binding = design.datasetBindings[index];
    if (entry.datasetId !== datasetId || entry.datasetSha256 !== source.sha256 || dataset?.datasetId !== datasetId || dataset.unit !== source.unit ||
        binding.datasetId !== datasetId || binding.sha256 !== source.sha256 || binding.path !== `research/datasets/${datasetId}.json` || binding.rowCount !== source.ids.length ||
        canonical(binding.filter) !== canonical(contract.filters[index]) || canonical(dataset.rows?.map(row => row.id)) !== canonical(source.ids) ||
        canonical(binding.observationPeriod) !== canonical(dataset.time) || !Array.isArray(binding.fields) || !binding.fields.length) fail('changed dataset identity, scope, period or selection');
    const sources = new Set(dataset.sources?.map(item => item.sourceId));
    if (!sources.size || sources.has(undefined) || sources.size !== dataset.sources.length) fail('invalid source provenance');
    for (const [rowIndex, row] of dataset.rows.entries()) {
      if (binding.fields.some(field => !Object.hasOwn(row, field)) || !sources.has(row.sourceId) || typeof row.sourceLocator !== 'string' || !row.sourceLocator ||
          row.unit !== source.units[rowIndex] || row.period !== source.periods[rowIndex] || row.status !== source.status || row.qualifier !== null ||
          row.lat !== null || row.lon !== null || row.geographicId !== source.geography) fail('changed row units, scope or provenance');
      if (datasetId === RULES) {
        if (row.value !== ['Dispatchable generation or storage nomination required', 'Renewable supply pathway required', 'Offer processing depends on associated generation'][rowIndex]) fail('changed policy finding');
      } else if (!Number.isFinite(row.value) || row.value < 0) fail('invalid native quantity');
      if (datasetId === IRISH && (row.value > 8000 || !Number.isInteger(row.value) || !Number.isFinite(row.nationalMeteredSharePercent) || row.nationalMeteredSharePercent < 0 || row.nationalMeteredSharePercent > 100)) fail('invalid Irish metered value or share');
      if (datasetId === INFERENCE && row.boundary !== (row.id === 'chipenergy' ? 'active-chip' : 'comprehensive')) fail('changed inference boundary');
      if (datasetId === DEMAND && row.id !== 'dc2025' && row.value > 100) fail('invalid source growth percentage');
    }
    const expected = conceptId === '217' && datasetId === INFERENCE ? ['energychange'] : source.ids;
    if (binding.includedRowCount !== expected.length || canonical(binding.includedRowIds) !== canonical(expected)) fail('changed included row IDs');
    const selected = expected.map(id => ({ ...dataset.rows.find(row => row.id === id), datasetId }));
    for (const row of selected) {
      if (identities.has(row.id)) fail('cross-dataset row ID collision');
      identities.add(row.id); rows.push(row);
    }
    boundRowsByDataset[datasetId] = selected;
  }
  return { rows, boundRowsByDataset };
}
export async function validateMultipleRelease(bundle, summary, { canonical, sha256 }) {
  if (bundle.schemaVersion !== 2 || summary.datasetBindingKind !== 'multiple' || bundle.datasetBindingKind !== 'multiple' ||
      bundle.conceptId !== summary.conceptId || bundle.revision !== summary.revision || bundle.designSha256 !== summary.designSha256 || bundle.datasetSha256 !== summary.datasetSha256 ||
      bundle.dataset || bundle.designAmendment || bundle.geography || !Array.isArray(summary.datasets)) fail('release identity mismatch');
  if (await sha256(canonical(bundle.design)) !== bundle.designSha256 || await sha256(multipleDigestInput(bundle.datasets, canonical)) !== bundle.datasetSha256) fail('design or binding-set digest mismatch');
  for (const [index, entry] of bundle.datasets.entries()) {
    const reference = summary.datasets[index];
    if (!reference || reference.datasetId !== entry.datasetId || reference.datasetSha256 !== entry.datasetSha256 ||
        await sha256(canonical(entry.dataset)) !== entry.datasetCanonicalSha256) fail('dataset digest mismatch');
  }
  if (summary.datasets.length !== bundle.datasets.length || await sha256(`${bundle.conceptId}:${bundle.datasetSha256}:${bundle.designSha256}`) !== bundle.revision) fail('revision mismatch');
  const selected = validateMultipleBinding(bundle, canonical);
  return { ...summary, ...selected, design: bundle.design, datasets: bundle.datasets, dataset: bundle.datasets[0].dataset,
    schemaVersion: 2, geography: null, marks: selected.rows.map((row, index) => ({ row, index, kind: 'source-specific-panel' })) };
}
