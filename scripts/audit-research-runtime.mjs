import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { ACTIVE_RESEARCH_CONCEPTS, canonicalReviewedJSON } from '../src/research-data.js';

const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const standard = new Set(['id', 'entityId', 'name', 'value', 'unit', 'period', 'sourceId', 'sourceLocator', 'status', 'qualifier', 'geographicId', 'lat', 'lon', 'notes']);
const unique = values => [...new Set(values)];
function group(design) {
  if (design.datasetBindings.length > 1) return 'multiple-dataset-panels';
  if (design.conceptId === '138-8') return 'derived-percentage-with-overlap';
  if (design.geographyMode === 'geographic') return 'geographic-join-required';
  const type = design.scale.type;
  if (type === 'none' || type.startsWith('categorical')) return 'categorical-equal-facets';
  if (type.includes('panel') || type === 'mixed') return 'incompatible-unit-panels';
  if (type.includes('switchable')) return 'explicit-denominator-switch';
  if (type.includes('log')) return 'logarithmic-native-values';
  if (['211-4', '330', '388', '406', '193-5'].includes(design.conceptId)) return 'qualified-intervals-and-bounds';
  if (['count', 'integer-count'].includes(type)) return 'integer-counts';
  return 'native-linear-rulers';
}

// Planning evidence only. Neither this report nor its groups activate a scene.
export async function auditResearchRuntime(root) {
  const read = async filename => JSON.parse(await fs.readFile(path.join(root, filename), 'utf8'));
  const [registry, review] = await Promise.all([read('research/designs/design-registry.json'), read('research/audits/design-contract-review.json')]);
  const concepts = [];
  for (const design of registry.designs) {
    if (design.status !== 'accepted-specification') continue;
    const accepted = review.designs.find(item => item.conceptId === design.conceptId);
    const designSha256 = sha(canonicalReviewedJSON(design));
    if (accepted?.status !== 'contract-accepted' || accepted.designRecordSha256 !== designSha256) throw Error(`Unaccepted or stale design ${design.conceptId}`);
    const datasets = [];
    for (const binding of design.datasetBindings) {
      const bytes = await fs.readFile(path.join(root, binding.path));
      if (sha(bytes) !== binding.sha256 || accepted.datasetDigests[binding.datasetId] !== binding.sha256) throw Error(`Stale dataset ${binding.datasetId}`);
      const dataset = JSON.parse(bytes);
      const rowMap = new Map(dataset.rows.map(row => [row.id, row]));
      const rows = binding.includedRowIds.map(id => rowMap.get(id));
      if (rows.some(row => !row) || rows.length !== binding.includedRowCount || dataset.rows.length !== binding.rowCount) throw Error(`Invalid rows ${design.conceptId}`);
      const rowUnits = unique(rows.map(row => row.unit));
      const [minimum, maximum] = Array.isArray(design.scale.domain) ? design.scale.domain : [];
      datasets.push({
        datasetId: dataset.datasetId, sha256: binding.sha256, sourceUnit: dataset.unit,
        rowUnits, scaleUnit: design.scale.unit,
        unitAliasRequired: dataset.unit !== design.scale.unit || rowUnits.some(unit => unit !== design.scale.unit),
        denominator: dataset.denominator, rowCount: binding.rowCount, includedRowCount: binding.includedRowCount,
        filter: binding.filter, includedRowIds: binding.includedRowIds, fields: binding.fields,
        extraFields: unique(rows.flatMap(row => Object.keys(row))).filter(field => !standard.has(field)).sort(),
        missingBoundFields: binding.fields.map(field => ({ field, rowIds: rows.filter(row => !Object.hasOwn(row, field)).map(row => row.id) })).filter(item => item.rowIds.length),
        valueTypes: unique(rows.map(row => row.value === null ? 'null' : typeof row.value)),
        nullRowIds: rows.filter(row => row.value === null).map(row => row.id),
        intervals: rows.filter(row => ['lower', 'upper', 'standardError', 'ciLower', 'ciUpper'].some(key => Object.hasOwn(row, key))).map(row => row.id),
        rawValuesOutsideDeclaredDomain: Number.isFinite(minimum) && Number.isFinite(maximum) ? rows.filter(row => typeof row.value === 'number' && (row.value < minimum || row.value > maximum)).map(row => row.id) : [],
        statuses: unique(rows.map(row => row.status)), periods: unique(rows.map(row => row.period)),
      });
    }
    concepts.push({
      conceptId: design.conceptId, title: design.title, active: ACTIVE_RESEARCH_CONCEPTS.includes(design.conceptId),
      group: group(design), primitive: design.implementation.primitive, designSha256, scale: design.scale,
      geographyMode: design.geographyMode, geometry: design.implementation.geometry, datasets,
      validationTests: design.validationTests,
    });
  }
  return { schemaVersion: 1, purpose: 'Derived implementation planning audit; never an activation registry', acceptedCount: concepts.length, activeCount: concepts.filter(item => item.active).length, groups: Object.fromEntries(unique(concepts.map(item => item.group)).sort().map(key => [key, concepts.filter(item => item.group === key && !item.active).map(item => item.conceptId)])), concepts };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const report = await auditResearchRuntime(root);
  const target = path.join(root, 'docs/next-version/RUNTIME_BINDING_AUDIT.json');
  await fs.writeFile(target, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Audited ${report.acceptedCount} accepted designs; ${report.activeCount} active; ${report.acceptedCount - report.activeCount} pending. ${target}`);
}
