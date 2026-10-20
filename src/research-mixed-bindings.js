// Separate native panels and denominator switches; never one normalized metric.
export const MIXED_BINDINGS = Object.freeze({
  '390': { datasetId: 'planet-ewaste-traceability', primitive: 'waste-generation-collection-ledger', unit: 'mixed mass units and percent', geographyMode: 'global',
    scale: { type: 'panel-specific', domains: { generationCollection: [0, 70] }, units: { generationCollection: 'billionkg', otherPanels: 'source-native units' } },
    ids: ['ewaste-2010-generated', 'ewaste-2010-formally_collected_recycled', 'ewaste-2022-generated', 'ewaste-2022-formally_collected_recycled', 'ewaste-crossborder', 'ewaste-small-it', 'ewaste-small-it-recycled'],
    units: [...Array(4).fill('billion kilograms'), 'million tonnes', 'million tonnes', 'percent'], periods: ['2010', '2010', ...Array(5).fill('2022')], statuses: Array(7).fill('estimated'), geographicIds: Array(7).fill(null), maxima: [70, 70, 70, 70, null, null, 100] },
  '325': { datasetId: 'physical-public-shuttle-pilot', primitive: 'pilot-uptake-feedback-facets', unit: 'mixed, row-specific', geographyMode: 'categorical',
    scale: { type: 'panel-specific', domains: { feedback: [0, 100] }, units: { riders: 'unique riders lower bound', feedback: 'percent of selected survey respondents', routing: 'qualitative request' } },
    ids: ['punggol-riders', 'punggol-feedback', 'punggol-routing'], units: ['unique riders', '% of survey respondents', 'category'], periods: ['2026-07-12', '2026-07', '2026-07-29'], statuses: ['observed', 'observed', 'categorical'], geographicIds: Array(3).fill('SGP-Punggol'), qualifiers: ['>', null, null], maxima: [null, 100, null] },
  '266-2': { datasetId: 'physical-tsmc-manufacturing', primitive: 'manufacturing-milestone-and-revenue-ring', unit: 'mixed, row-specific', geographyMode: 'categorical',
    scale: { type: 'mixed', domain: { revenue: [0, 100], milestones: 'categorical' }, unit: 'milestone status; separate global wafer-revenue percent' },
    ids: ['tsmc-tw', 'tsmc-az', 'tsmc-jp', 'tsmc-de', 'tsmc-advanced'], units: [...Array(4).fill('category'), '% of wafer revenue'], periods: ['2025', '2024-Q4', '2024-end', '2025 report', '2025'], statuses: [...Array(4).fill('categorical'), 'observed'], geographicIds: ['TWN', 'US-AZ', 'JPN-Kumamoto', 'DEU-Dresden', null], maxima: [null, null, null, null, 100] },
  '8-17': { datasetId: 'planet-ecg-mortality-trial', primitive: 'mortality-arms-and-hazard-rail', unit: 'mixed: percent and hazard ratio', geographyMode: 'categorical',
    scale: { type: 'panel-specific', domains: { mortality: [0, 5], hazardRatio: [0, 1.2] }, units: { mortality: 'percent all-cause mortality within90days', hazardRatio: 'hazard ratio' } },
    ids: ['ecg-ai', 'ecg-control', 'ecg-hr'], units: ['percent all-cause mortality within 90 days', 'percent all-cause mortality within 90 days', 'hazard ratio'], periods: Array(3).fill('Enrollment 2021-12-15 to 2022-04-30; 90-day follow-up'), statuses: ['observed', 'observed', 'estimated'], geographicIds: Array(3).fill('TWN'), qualifiers: [null, null, '95% confidence interval'], maxima: [5, 5, 1.2] },
  '30-8': { datasetId: 'physical-lifecycle-disclosures', primitive: 'footprint-boundary-four-panels', unit: 'mixed, row-specific', geographyMode: 'categorical',
    scale: { type: 'panel-specific-no-cross-scale-comparison', unit: 'ktCO2e; m3water; gCO2e/response; mL/response' },
    ids: ['mistralcarbon', 'mistralwater', 'lechatcarbon', 'lechatwater'], units: ['kt CO2e', 'm3 water', 'g CO2e/response', 'mL water/response'], periods: ['2025-01', '2025-01', '2025-07-22 disclosure', '2025-07-22 disclosure'], statuses: Array(4).fill('estimated'), geographicIds: Array(4).fill(null) },
  '111-3': { datasetId: 'physical-waterway-dependencies', primitive: 'water-ledger-and-dependency-facets', unit: 'mixed, row-specific', geographyMode: 'categorical',
    scale: { type: 'panel-specific', domains: { oregonWater: [0, 300] }, units: { oregonWater: 'millionUSgallons/year', links: 'documented infrastructure dependency' } },
    ids: ['oregon2024', 'oregon2025', 'umatilla-intake', 'morrow', 'belgium-canal'], units: ['million U.S.gallons/year', 'million U.S.gallons/year', ...Array(3).fill('category')], periods: ['2024', '2025', '2026-09 disclosure', '2026-09 disclosure', 'Undated site description; retrieved2026-10-19'], statuses: ['estimated', 'estimated', ...Array(3).fill('categorical')], geographicIds: ['US-OR', 'US-OR', 'US-OR-Umatilla', 'US-OR-Morrow', 'BEL-SaintGhislain'], qualifiers: ['approximately', null, null, null, null], maxima: [300, 300, null, null, null] },
  '365': { datasetId: 'planet-wine-quality-distribution', primitive: 'double-wine-histogram-corona', unit: 'samples', geographyMode: 'categorical',
    scale: { type: 'switchable', domains: { count: [0, 2500], share: [0, 100] }, units: { count: 'benchmark samples', share: 'percent within wine-type samples' } },
    ids: ['red', 'white'].flatMap(type => Array.from({ length: 11 }, (_, score) => `wine-${type}-${score}`)), units: Array(22).fill('samples'), periods: Array(22).fill('Collection date not supplied; released 2009'), statuses: Array(22).fill('observed'), geographicIds: Array(22).fill('PRT'), maxima: Array(22).fill(2500) },
});
const categories = {
  '325': { 'punggol-routing': 'Residents requested more direct routes and flexible stops' },
  '266-2': { 'tsmc-tw': '2 nm expansion in Hsinchu and Kaohsiung', 'tsmc-az': 'First fab in volume production', 'tsmc-jp': 'First fab in volume production', 'tsmc-de': 'Specialty fab under construction' },
  '111-3': { 'umatilla-intake': 'Funded shared surface-water project', morrow: 'Columbia River treatment plants funded', 'belgium-canal': 'Industrial canal water cooling' },
};
export function validateMixedBinding({ conceptId, design, dataset, binding, sources }, canonical, fail) {
  const contract = MIXED_BINDINGS[conceptId];
  if (dataset.datasetId !== contract.datasetId || dataset.unit !== contract.unit || design.implementation?.primitive !== contract.primitive ||
      design.geographyMode !== contract.geographyMode || canonical(design.scale) !== canonical(contract.scale) || canonical(binding.includedRowIds) !== canonical(contract.ids) ||
      canonical(dataset.rows.map(row => row.id)) !== canonical(contract.ids) || canonical(binding.observationPeriod) !== canonical(dataset.time)) fail('changed mixed-panel primitive, scale or source rows');
  for (const [index, row] of dataset.rows.entries()) {
    for (const field of binding.fields) {
      const optional = (conceptId === '390' && index >= 4 && field === 'metric') || (conceptId === '8-17' && (index < 2 ? ['lower', 'upper'].includes(field) : field === 'randomizedN'));
      if (optional ? Object.hasOwn(row, field) : !Object.hasOwn(row, field)) fail('mixed-panel optional field contract changed');
    }
    if (!sources.has(row.sourceId) || !row.sourceLocator || row.unit !== contract.units[index] || row.period !== contract.periods[index] || row.status !== contract.statuses[index] ||
        row.geographicId !== contract.geographicIds[index] || row.lat !== null || row.lon !== null || row.qualifier !== (contract.qualifiers?.[index] ?? null)) fail('changed mixed-panel units, period, status or scope');
    if (row.status === 'categorical') { if (row.value !== categories[conceptId]?.[row.id]) fail('changed categorical finding'); }
    else if (!Number.isFinite(row.value) || row.value < 0 || (contract.maxima?.[index] !== null && contract.maxima?.[index] !== undefined && row.value > contract.maxima[index])) fail('mixed-panel value outside native domain');
    if (conceptId === '390' && index < 4 && row.metric !== ['generated', 'formally_collected_recycled'][index % 2]) fail('changed waste measure');
    if (conceptId === '325' && ((index === 0 && !Number.isInteger(row.value)) || (index === 1 && row.sampleSizeApprox !== 900))) fail('changed threshold or approximate respondent sample');
    if (conceptId === '8-17' && (index < 2 ? row.randomizedN !== [8001, 7964][index] : row.lower !== 0.7 || row.upper !== 0.99 || row.lower > row.value || row.upper < row.value)) fail('changed randomized arm or hazard-ratio interval');
    if (conceptId === '365' && (!Number.isInteger(row.value) || row.qualityScore !== index % 11 || row.wineType !== (index < 11 ? 'red' : 'white') || row.sampleDenominator !== (index < 11 ? 1599 : 4898))) fail('changed wine score, type or denominator');
  }
  if (conceptId === '365' && [0, 11].some(start => dataset.rows.slice(start, start + 11).reduce((sum, row) => sum + row.value, 0) !== dataset.rows[start].sampleDenominator)) fail('wine counts do not partition their own sample denominator');
  return dataset.rows;
}
