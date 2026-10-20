// Native-unit research data is deliberately independent of the legacy scoring
// and effect systems. Only primitives implemented and reviewed here may load.
const fail = message => { throw new Error(`Research data: ${message}`); };
const HASH = /^[a-f0-9]{64}$/;
export const ACTIVE_RESEARCH_CONCEPTS = Object.freeze(['430']);

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
  if (!ACTIVE_RESEARCH_CONCEPTS.includes(conceptId)) fail('unsupported concept');
  if (!HASH.test(datasetSha256 || '')) fail('invalid dataset digest');
  if (design?.conceptId !== conceptId || design.designId !== `design-${conceptId}` || design.status !== 'accepted-specification' || design.reviewAcceptancePending !== false) fail('design is not accepted for this concept');
  if (design.scoring?.type !== 'none' || design.forecast?.type !== 'none') fail('unsupported scoring or forecast');
  if (design.datasetBindings?.length !== 1) fail('unsupported dataset binding count');
  const binding = design.datasetBindings[0];
  if (binding.datasetId !== dataset?.datasetId || binding.sha256 !== datasetSha256) fail('stale dataset binding');
  if (binding.path !== `research/datasets/${dataset.datasetId}.json`) fail('invalid binding path');
  if (!Array.isArray(dataset.rows) || dataset.rows.length !== binding.rowCount) fail('dataset row count mismatch');
  if (!Array.isArray(binding.includedRowIds) || binding.includedRowIds.length !== binding.includedRowCount || new Set(binding.includedRowIds).size !== binding.includedRowIds.length) fail('invalid included row IDs');
  if (binding.includedRowCount !== binding.rowCount || binding.filter !== 'all supplied rows; no implicit exclusion') fail('unsupported row selection');
  if (!Array.isArray(binding.fields) || !binding.fields.length) fail('missing field bindings');
  if (!Array.isArray(dataset.sources) || !dataset.sources.length) fail('missing sources');
  const sources = new Set(dataset.sources.map(source => source.sourceId));
  if (sources.size !== dataset.sources.length || sources.has(undefined)) fail('duplicate or missing source IDs');
  const [minimum, maximum] = design.scale?.domain || [];
  if (design.scale?.type !== 'linear' || !Number.isFinite(minimum) || !Number.isFinite(maximum) || minimum !== 0 || maximum <= minimum || dataset.unit !== design.scale.unit) fail('invalid native-unit scale');
  const rowMap = new Map();
  for (const row of dataset.rows) {
    if (typeof row.id !== 'string' || !row.id || rowMap.has(row.id)) fail('duplicate or missing row ID');
    for (const field of binding.fields) if (!Object.hasOwn(row, field)) fail(`missing field ${field}`);
    if (!sources.has(row.sourceId) || typeof row.sourceLocator !== 'string' || !row.sourceLocator) fail('unresolved row provenance');
    if (row.unit !== design.scale.unit) fail('row unit differs from native scale');
    if (row.value === null) {
      if (row.status !== 'missing') fail('unsupported interval-only or missing-value status');
    } else if (typeof row.value !== 'number' || !Number.isFinite(row.value) || row.value < minimum || row.value > maximum || row.status === 'missing') {
      fail('value outside domain or invalid status');
    }
    rowMap.set(row.id, row);
  }
  const rows = binding.includedRowIds.map(id => rowMap.get(id) || fail(`missing bound row ${id}`));
  if (rowMap.size !== rows.length) fail('unbound rows');
  // This first vertical slice has an exact accepted scale and encoding.
  if (design.implementation?.primitive !== 'annual-carbon-region-lantern' || dataset.datasetId !== 'physical-cloud-grid-carbon' || rows.length !== 44 || minimum !== 0 || maximum !== 700 || design.scale.unit !== 'g CO2eq/kWh' || design.geographyMode !== 'categorical') fail('unsupported primitive or changed carbon scale');
  for (const row of rows) {
    if (row.period !== '2025' || row.lat !== null || row.lon !== null || typeof row.cfePercent !== 'number' || !Number.isFinite(row.cfePercent) || row.cfePercent < 0 || row.cfePercent > 100) fail('changed carbon period, coordinates or CFE badge');
  }
  return rows;
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
  if (bundle.schemaVersion !== 1 || bundle.conceptId !== summary.conceptId || bundle.datasetSha256 !== summary.datasetSha256 || bundle.designSha256 !== summary.designSha256 || bundle.revision !== summary.revision) fail('release identity mismatch');
  if (await researchSha256(canonicalReviewedJSON(bundle.design)) !== bundle.designSha256) fail('design digest mismatch');
  if (await researchSha256(canonicalReviewedJSON(bundle.dataset)) !== bundle.datasetCanonicalSha256) fail('dataset content digest mismatch');
  const revision = await researchSha256(`${bundle.conceptId}:${bundle.datasetSha256}:${bundle.designSha256}`);
  if (revision !== bundle.revision) fail('revision digest mismatch');
  const rows = validateResearchBinding(bundle);
  if (signal?.aborted) throw signal.reason || new DOMException('Aborted', 'AbortError');
  return {
    ...summary, dataset: bundle.dataset, design: bundle.design, rows,
    marks: rows.map((row, index) => ({ row, index, length: row.value === null ? null : 0.45 * row.value / 700 })),
  };
}
