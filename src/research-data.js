import { MIXED_BINDINGS, validateMixedBinding } from './research-mixed-bindings.js';
import { GEOGRAPHIC_BINDINGS, COUNTRY_JOIN_CONCEPTS, validateGeographicBinding } from './research-geographic-bindings.js';
import { validDisplayAnchor } from './research-geographic-anchors.js';
import { validateMultipleRelease } from './research-multiple.js';
// Native-unit research data is deliberately independent of the legacy scoring
// and effect systems. Only primitives implemented and reviewed here may load.
import { LINEAR_BINDINGS, validateLinearScope } from './research-linear-bindings.js';
import { CATEGORICAL_BINDINGS, validateCategoricalScope } from './research-categorical-bindings.js';
import { DESIGN_AMENDMENTS, ROUNDED_53_GEOMETRY, validateDesignAmendment, validateAmendmentRuntimeApproval } from './research-design-amendments.js';
const fail = message => { throw new Error(`Research data: ${message}`); };
const HASH = /^[a-f0-9]{64}$/;
export const ACTIVE_RESEARCH_CONCEPTS = Object.freeze(['430', '408', '5-6', '63', '388', '330', '406', '193-5', '372', '276', '409', '369', '324', '385', '232', '333', '63-8', '364', '320',
  '417', '415', '397', '382', '371', '368', '358', '356', '348', '321', '314', '305', '259', '256', '250', '107', '150-5', '155-17', '170-3', '178',
  '255', '233-2', '422-2', '138-8', '8-6', '428', '407', '284', '202', '117', '402', '398', '392', '323', '218', '214', '115-2', '211-4', '378', '375', '247', '78-4', '390', '325', '266-2', '8-17', '30-8', '111-3', '365', '394', '217', '56-5', '74', '156-8']);
const PAIR_BINDINGS = {
  '5-6': { datasetId: 'planet-seabed-coverage', primitive: 'mapped-fraction-year-duet', unit: 'percent of global ocean floor', rowIds: ['seabed-2025', 'seabed-2026'], periods: ['GEBCO_2025 release', 'GEBCO_2026 release'] },
  '63': { datasetId: 'society-rural-internet', primitive: 'urban-rural-open-rings', unit: 'percent of residents', rowIds: ['internet-urban', 'internet-rural'], periods: ['2025', '2025'] },
};
const QUALIFIED_BINDINGS = {
  '388': { datasetId: 'planet-dark-vessels', primitive: 'range-first-ocean-observatory', unit: 'percent under source-specific activity denominator', datasetUnit: 'mixed percentages, each row explicit', maximum: 100, geographyMode: 'categorical', rowIds: ['gfw-fishing-untracked', 'gfw-other-untracked', 'gfw-asia', 'gfw-europe', 'gfw-north-america', 'gfw-africa', 'gfw-south-america', 'gfw-australia'], period: '2017–2021' },
  '330': { datasetId: 'society-nigeria-tutoring', primitive: 'trial-outcome-meridian-gauges', unit: 'standard deviations', datasetUnit: 'standard deviations', maximum: 0.4, geographyMode: 'categorical', rowIds: ['nigeria-composite', 'nigeria-english'], period: 'June–July2024 intervention' },
  '406': { datasetId: 'physical-weather-cooling', primitive: 'qualified-cooling-time-arcs', unit: 'percent of year', datasetUnit: '% of year', maximum: 100, geographyMode: 'categorical', rowIds: ['dublin', 'amsterdam', 'virginia', 'phoenix'], period: '2026-06', qualifiers: ['<', '<', 'approximately', 'up to'] },
  '193-5': { datasetId: 'physical-per-capita-demand', primitive: 'per-resident-bound-contrast', unit: 'kWh/person/year', datasetUnit: 'kWh/person/year', maximum: 600, geographyMode: 'global', rowIds: ['us-percap', 'africa-percap'], period: '2024', qualifiers: ['approximately', '<'] },
};

export function canonicalReviewedJSON(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalReviewedJSON).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(key => `${canonicalReviewedJSON(key)}:${canonicalReviewedJSON(value[key])}`).join(',')}}`;
  if (value === undefined || (typeof value === 'number' && !Number.isFinite(value))) fail('invalid canonical value');
  return JSON.stringify(value).replace(/[\u0080-\uffff]/g, char => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`);
}

export async function researchSha256(bytes) {
  const data = typeof bytes === 'string' ? new TextEncoder().encode(bytes) : bytes;
  if (!globalThis.crypto?.subtle) fail('integrity verification unavailable');
  return [...new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', data))].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export function validateResearchBinding({ conceptId, datasetSha256, design, dataset }) {
  if (!ACTIVE_RESEARCH_CONCEPTS.includes(conceptId) && !LINEAR_BINDINGS[conceptId] && !CATEGORICAL_BINDINGS[conceptId] && !GEOGRAPHIC_BINDINGS[conceptId] && !MIXED_BINDINGS[conceptId]) fail('unsupported concept');
  if (!HASH.test(datasetSha256 || '')) fail('invalid dataset digest');
  if (design?.conceptId !== conceptId || design.designId !== `design-${conceptId}` || design.status !== 'accepted-specification' || design.reviewAcceptancePending !== false) fail('design is not accepted for this concept');
  if (design.scoring?.type !== 'none' || design.forecast?.type !== 'none') fail('unsupported scoring or forecast');
  if (design.datasetBindings?.length !== 1) fail('unsupported dataset binding count');
  const binding = design.datasetBindings[0];
  if (binding.datasetId !== dataset?.datasetId || binding.sha256 !== datasetSha256) fail('stale dataset binding');
  if (binding.path !== `research/datasets/${dataset.datasetId}.json`) fail('invalid binding path');
  if (!Array.isArray(dataset.rows) || dataset.rows.length !== binding.rowCount) fail('dataset row count mismatch');
  if (!Array.isArray(binding.includedRowIds) || binding.includedRowIds.length !== binding.includedRowCount || new Set(binding.includedRowIds).size !== binding.includedRowIds.length) fail('invalid included row IDs');
  const selection = LINEAR_BINDINGS[conceptId]?.selection;
  if (selection ? binding.rowCount !== selection.total || canonicalReviewedJSON(binding.filter) !== canonicalReviewedJSON(selection.filter) :
      binding.includedRowCount !== binding.rowCount || binding.filter !== 'all supplied rows; no implicit exclusion') fail('unsupported row selection');
  if (!Array.isArray(binding.fields) || !binding.fields.length) fail('missing field bindings');
  if (!Array.isArray(dataset.sources) || !dataset.sources.length) fail('missing sources');
  const sources = new Set(dataset.sources.map(source => source.sourceId));
  if (sources.size !== dataset.sources.length || sources.has(undefined)) fail('duplicate or missing source IDs');
  if (MIXED_BINDINGS[conceptId]) return validateMixedBinding({ conceptId, design, dataset, binding, sources }, canonicalReviewedJSON, fail);
  if (GEOGRAPHIC_BINDINGS[conceptId]) return validateGeographicBinding({ conceptId, design, dataset, binding, sources, datasetSha256 }, canonicalReviewedJSON, fail);
  if (CATEGORICAL_BINDINGS[conceptId]) return validateCategoricalScope({ conceptId, design, dataset, binding, sources }, fail);
  const [minimum, maximum] = design.scale?.domain || [];
  // The reviewed seabed package uses "percent" at dataset level and the more
  // explicit denominator on every row/design. This exact binding is an alias,
  // not a unit conversion or permission to accept arbitrary mismatches.
  const qualified = QUALIFIED_BINDINGS[conceptId];
  const linear = LINEAR_BINDINGS[conceptId];
  const native = qualified || linear;
  const matchingUnit = dataset.unit === design.scale?.unit || (conceptId === '5-6' && dataset.datasetId === 'planet-seabed-coverage' && dataset.unit === 'percent' && design.scale?.unit === 'percent of global ocean floor') || (native && dataset.datasetId === native.datasetId && dataset.unit === native.datasetUnit && design.scale?.unit === native.unit);
  if (design.scale?.type !== (linear?.scaleType || 'linear') || !Number.isFinite(minimum) || !Number.isFinite(maximum) || minimum !== (linear?.minimum || 0) || maximum <= minimum || !matchingUnit) fail('invalid native-unit scale');
  const rowMap = new Map();
  for (const row of dataset.rows) {
    if (typeof row.id !== 'string' || !row.id || rowMap.has(row.id)) fail('duplicate or missing row ID');
    for (const field of binding.fields) {
      const optionalInterval = conceptId === '388' && ['lower', 'upper'].includes(field) && typeof row.value === 'number';
      if (!Object.hasOwn(row, field) && !optionalInterval) fail(`missing field ${field}`);
    }
    if (!sources.has(row.sourceId) || typeof row.sourceLocator !== 'string' || !row.sourceLocator) fail('unresolved row provenance');
    const linearIndex = linear?.rowIds.indexOf(row.id);
    const rowUnit = linear ? (linear.rowUnits?.[linearIndex] ?? linear.rowUnit ?? linear.unit) : conceptId === '388' ? (row.value === null ? 'percent' : 'percent of detected vessel activity') : conceptId === '406' ? '% of year' : design.scale.unit;
    if (row.unit !== rowUnit) fail('row unit differs from native scale');
    const visualValue = linear?.valueField ? row[linear.valueField] : row.value;
    if (visualValue === null) {
      const interval = conceptId === '388' && row.status === 'estimated' && Number.isFinite(row.lower) && Number.isFinite(row.upper) && row.lower >= minimum && row.lower <= row.upper && row.upper <= maximum;
      if (row.status !== 'missing' && !interval) fail('unsupported interval-only or missing-value status');
    } else if (typeof visualValue !== 'number' || !Number.isFinite(visualValue) || visualValue < minimum || visualValue > maximum || row.status === 'missing') {
      fail('value outside domain or invalid status');
    }
    rowMap.set(row.id, row);
  }
  const rows = binding.includedRowIds.map(id => rowMap.get(id) || fail(`missing bound row ${id}`));
  if (rowMap.size !== (selection?.total || rows.length)) fail('unbound rows');
  if (selection) {
    const filtered = dataset.rows.filter(row => selection.filter.all.every(rule => rule.values.includes(row[rule.field]))).map(row => row.id);
    if (JSON.stringify(filtered) !== JSON.stringify(binding.includedRowIds)) fail('explicit filter and included row identities disagree');
  }
  // Each supported primitive retains its own exact accepted scale and scope.
  if (conceptId === '430') {
    if (design.implementation?.primitive !== 'annual-carbon-region-lantern' || dataset.datasetId !== 'physical-cloud-grid-carbon' || rows.length !== 44 || minimum !== 0 || maximum !== 700 || design.scale.unit !== 'g CO2eq/kWh' || design.geographyMode !== 'categorical') fail('unsupported primitive or changed carbon scale');
    for (const row of rows) {
      if (row.period !== '2025' || row.lat !== null || row.lon !== null || typeof row.cfePercent !== 'number' || !Number.isFinite(row.cfePercent) || row.cfePercent < 0 || row.cfePercent > 100) fail('changed carbon period, coordinates or CFE badge');
    }
  } else if (conceptId === '408') {
    if (design.implementation?.primitive !== 'country-access-surface-and-dial' || dataset.datasetId !== 'society-electricity-access' || rows.length !== 217 || maximum !== 100 || design.scale.unit !== 'percent of population' || design.geographyMode !== 'geographic') fail('unsupported primitive or changed electricity scale');
    const geographyIds = new Set();
    for (const row of rows) {
      if (!/^[A-Z]{3}$/.test(row.geographicId) || row.id !== `electricity-${row.geographicId}` || geographyIds.has(row.geographicId) || row.period !== '2024' || row.lat !== null || row.lon !== null || !['estimated', 'missing'].includes(row.status)) fail('changed electricity period, geography or status');
      geographyIds.add(row.geographicId);
    }
  } else if (PAIR_BINDINGS[conceptId]) {
    const contract = PAIR_BINDINGS[conceptId];
    if (!contract || design.implementation?.primitive !== contract.primitive || dataset.datasetId !== contract.datasetId || rows.length !== 2 || maximum !== 100 || design.scale.unit !== contract.unit || design.geographyMode !== 'global' || JSON.stringify(rows.map(row => row.id)) !== JSON.stringify(contract.rowIds)) fail('unsupported primitive or changed pair scale');
    for (const [index, row] of rows.entries()) {
      if (row.period !== contract.periods[index] || row.lat !== null || row.lon !== null || row.geographicId !== null || row.status !== 'estimated' || row.value === null || (conceptId === '63' && row.settlement !== ['urban', 'rural'][index])) fail('changed global pair scope, period or status');
    }
  } else if (linear) {
    if (design.implementation?.primitive !== linear.primitive || dataset.datasetId !== linear.datasetId || maximum !== linear.maximum || design.scale.unit !== linear.unit || dataset.unit !== linear.datasetUnit || design.geographyMode !== linear.geographyMode || JSON.stringify(rows.map(row => row.id)) !== JSON.stringify(linear.rowIds)) fail('unsupported native ruler primitive or changed scale');
    validateLinearScope(conceptId, rows, fail);
    if (conceptId === '156-8' && design.implementation.geometry !== ROUNDED_53_GEOMETRY) fail('rounded source value requires reviewed corrected geometry');
    if (conceptId === '117' && JSON.stringify(design.scale.ticks) !== JSON.stringify([1e25, 1e26, 1e27])) fail('changed logarithmic reference ticks');
  } else {
    if (!qualified || design.implementation?.primitive !== qualified.primitive || dataset.datasetId !== qualified.datasetId || maximum !== qualified.maximum || design.scale.unit !== qualified.unit || dataset.unit !== qualified.datasetUnit || design.geographyMode !== qualified.geographyMode || JSON.stringify(rows.map(row => row.id)) !== JSON.stringify(qualified.rowIds)) fail('unsupported qualified primitive or changed scale');
    for (const [index, row] of rows.entries()) {
      if (row.period !== qualified.period || row.lat !== null || row.lon !== null || row.status !== 'estimated') fail('changed qualified scope, period or status');
      if (qualified.qualifiers && row.qualifier !== qualified.qualifiers[index]) fail('source bound qualifier changed');
      if (conceptId === '388') {
        if (row.geographicId !== null || (index < 2 ? row.value !== null || row.qualifier !== 'published range; no point estimate supplied' : row.value === null || Object.hasOwn(row, 'lower') || Object.hasOwn(row, 'upper'))) fail('interval-only and continental-share populations must remain distinct');
      } else if (conceptId === '330') {
        if (row.value === null || row.geographicId !== null || row.trialLocation !== 'Edo State, Nigeria' || !Number.isFinite(row.standardError) || row.standardError < 0 || row.value - row.standardError < 0 || row.value + row.standardError > maximum || row.regressionN !== 654 || row.outcome !== ['composite', 'English'][index]) fail('changed trial or robust standard-error contract');
      } else if (row.value === null) fail('missing source bound');
    }
  }
  return rows;
}

export function validateResearchGeography(geography, rows, datasetId = 'society-electricity-access', conceptId = '408') {
  if (geography?.schemaVersion !== 1 || !COUNTRY_JOIN_CONCEPTS.includes(conceptId) || geography.datasetId !== datasetId || !HASH.test(geography.auditSha256 || '') || !HASH.test(geography.boundarySha256 || '') || !Array.isArray(geography.countries) || !Array.isArray(geography.backgroundCountries) || !Array.isArray(geography.unsupported)) fail('invalid geography contract');
  const rowMap = new Map(rows.map(row => [row.id, row])), seen = new Set(), geometryIds = new Set();
  for (const country of geography.countries) {
    if (!rowMap.has(country.rowId) || seen.has(country.rowId) || rowMap.get(country.rowId).geographicId !== country.geographicId || !/^\d{3}$/.test(country.geometryId) || geometryIds.has(country.geometryId)) fail('invalid geographic join');
    seen.add(country.rowId); geometryIds.add(country.geometryId);
  }
  for (const row of geography.unsupported) {
    if (!rowMap.has(row.rowId) || seen.has(row.rowId) || rowMap.get(row.rowId).geographicId !== row.geographicId || !row.reason) fail('invalid geographic omission');
    seen.add(row.rowId);
  }
  if (seen.size !== rows.length || geography.coverage.total !== rows.length || geography.coverage.mapped !== geography.countries.length || geography.coverage.tableOnly !== geography.unsupported.length || JSON.stringify(geography.unsupportedRowIds) !== JSON.stringify(geography.unsupported.map(row => row.rowId))) fail('geographic coverage mismatch');
  for (const country of [...geography.countries, ...geography.backgroundCountries]) {
    if (!Array.isArray(country.polygons) || !country.polygons.length) fail('missing country polygons');
    for (const polygon of country.polygons) {
      if (!Array.isArray(polygon) || !polygon.length) fail('missing polygon rings');
      for (const ring of polygon) {
        if (!Array.isArray(ring) || ring.length < 4 || ring.some(point => !Array.isArray(point) || point.length !== 2 || !point.every(Number.isFinite) || Math.abs(point[0]) > 180.001 || Math.abs(point[1]) > 90.001)) fail('invalid polygon coordinates');
      }
    }
  }
  if (['375', '78-4'].includes(conceptId) && geography.countries.some(country => !validDisplayAnchor(country.displayAnchor, country.polygons))) fail('invalid country-summary display anchor');
  return geography;
}

export async function loadResearchWorld(summary, { fetchImpl = globalThis.fetch, signal } = {}) {
  if (!summary || !ACTIVE_RESEARCH_CONCEPTS.includes(summary.conceptId) || !HASH.test(summary.release?.sha256 || '') || summary.release.url !== `/assets/research/${summary.release.sha256}.json`) fail('invalid accepted release reference');
  if (signal?.aborted) throw signal.reason || new DOMException('Aborted', 'AbortError');
  const response = await fetchImpl(summary.release.url, { signal, credentials: 'same-origin', redirect: 'error', headers: { Accept: 'application/json' } });
  if (!response.ok) fail(`release HTTP ${response.status}`);
  if (!response.body) fail('empty release body');
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    for (;;) {
      if (signal?.aborted) {
        await reader.cancel();
        throw signal.reason || new DOMException('Aborted', 'AbortError');
      }
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 2_000_000) {
        await reader.cancel();
        fail('release exceeds size limit');
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  if (signal?.aborted) throw signal.reason || new DOMException('Aborted', 'AbortError');
  if (await researchSha256(bytes) !== summary.release.sha256) fail('release digest mismatch');
  const bundle = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  if (bundle.schemaVersion === 2) {
    const world = await validateMultipleRelease(bundle, summary, { canonical: canonicalReviewedJSON, sha256: researchSha256 });
    if (signal?.aborted) throw signal.reason || new DOMException('Aborted', 'AbortError');
    return world;
  }
  if (bundle.schemaVersion !== 1 || bundle.conceptId !== summary.conceptId || bundle.datasetSha256 !== summary.datasetSha256 || bundle.designSha256 !== summary.designSha256 || bundle.revision !== summary.revision) fail('release identity mismatch');
  if (await researchSha256(canonicalReviewedJSON(bundle.design)) !== bundle.designSha256) fail('design digest mismatch');
  if (await researchSha256(canonicalReviewedJSON(bundle.dataset)) !== bundle.datasetCanonicalSha256) fail('dataset content digest mismatch');
  if (DESIGN_AMENDMENTS[bundle.conceptId]) {
    if (!summary.designAmendment || summary.designAmendment.sha256 !== bundle.designAmendmentSha256 ||
        await researchSha256(canonicalReviewedJSON(bundle.designAmendment)) !== bundle.designAmendmentSha256) fail('design amendment digest mismatch');
    await validateDesignAmendment(bundle.designAmendment, bundle.design, bundle.datasetSha256, { sha256: researchSha256, canonical: canonicalReviewedJSON });
    if (typeof bundle.runtimeApprovalText !== 'string' || !HASH.test(bundle.runtimeApprovalSha256 || '') ||
        summary.designAmendment.runtimeApproval?.sha256 !== bundle.runtimeApprovalSha256 ||
        await researchSha256(bundle.runtimeApprovalText) !== bundle.runtimeApprovalSha256) fail('runtime approval digest mismatch');
    validateAmendmentRuntimeApproval(JSON.parse(bundle.runtimeApprovalText), bundle.designAmendmentSha256, bundle.conceptId);
  } else if (bundle.designAmendment || bundle.designAmendmentSha256 || summary.designAmendment || bundle.runtimeApprovalText || bundle.runtimeApprovalSha256) fail('unsupported design amendment');
  if (COUNTRY_JOIN_CONCEPTS.includes(bundle.conceptId) && (bundle.geographySha256 !== summary.geographySha256 || await researchSha256(canonicalReviewedJSON(bundle.geography)) !== bundle.geographySha256)) fail('geography digest mismatch');
  const revision = await researchSha256(`${bundle.conceptId}:${bundle.datasetSha256}:${bundle.designSha256}${COUNTRY_JOIN_CONCEPTS.includes(bundle.conceptId) ? `:${bundle.geographySha256}` : ''}${DESIGN_AMENDMENTS[bundle.conceptId] ? `:${bundle.designAmendmentSha256}:${bundle.runtimeApprovalSha256}` : ''}`);
  if (revision !== bundle.revision) fail('revision digest mismatch');
  const rows = validateResearchBinding(bundle);
  if (signal?.aborted) throw signal.reason || new DOMException('Aborted', 'AbortError');
  const geography = COUNTRY_JOIN_CONCEPTS.includes(bundle.conceptId) ? validateResearchGeography(bundle.geography, rows, bundle.dataset.datasetId, bundle.conceptId) : null;
  const countryMap = new Map(geography?.countries.map(country => [country.rowId, country]) || []);
  return {
    ...summary, dataset: bundle.dataset, design: bundle.design, datasetCanonicalSha256: bundle.datasetCanonicalSha256, rows, geography,
    ...(bundle.designAmendment ? { designAmendmentEvidence: bundle.designAmendment, designAmendmentSha256: bundle.designAmendmentSha256, runtimeApprovalText: bundle.runtimeApprovalText, runtimeApprovalSha256: bundle.runtimeApprovalSha256 } : {}),
    marks: rows.map((row, index) => {
      if (bundle.conceptId === '430') return { row, index, length: row.value === null ? null : 0.45 * row.value / 700 };
      if (bundle.conceptId === '388') return { row, index, kind: row.value === null ? 'interval-only' : 'continental-share', lower: row.lower ?? null, upper: row.upper ?? null, value: row.value };
      if (bundle.conceptId === '330') return { row, index, kind: 'one-robust-standard-error', value: row.value, lower: row.value - row.standardError, upper: row.value + row.standardError };
      if (['406', '193-5'].includes(bundle.conceptId)) return { row, index, kind: row.qualifier === '<' ? 'open-upper-bound' : row.qualifier === 'up to' ? 'inclusive-upper-bound' : 'approximate', threshold: row.value, qualifier: row.qualifier };
      if (MIXED_BINDINGS[bundle.conceptId]) return { row, index, kind: 'native-separate-panel' };
      if (GEOGRAPHIC_BINDINGS[bundle.conceptId]) return { row, index, kind: bundle.conceptId === '378' ? 'published-recorder-observation' : 'country-summary', country: countryMap.get(row.id) || null };
      if (CATEGORICAL_BINDINGS[bundle.conceptId]) return { row, index, kind: CATEGORICAL_BINDINGS[bundle.conceptId].type === 'none' ? 'native-text' : 'categorical' };
      if (LINEAR_BINDINGS[bundle.conceptId]) {
        const contract = LINEAR_BINDINGS[bundle.conceptId], visualValue = contract.valueField ? row[contract.valueField] : row.value;
        if (bundle.conceptId === '117') return { row, index, kind: 'logarithmic-position', positionOffset: 0.45 * (Math.log10(row.value) - 25) / 2, value: row.value };
        return { row, index, kind: 'native-ruler', fraction: visualValue / contract.maximum, value: row.value, ...(contract.valueField ? { visualValue, valueField: contract.valueField } : {}) };
      }
      return { row, index, fraction: row.value === null ? null : row.value / 100, dialAngle: row.value === null ? null : 2 * Math.PI * row.value / 100, ...(COUNTRY_JOIN_CONCEPTS.includes(bundle.conceptId) ? {country: countryMap.get(row.id) || null} : {}) };
    }),
  };
}
