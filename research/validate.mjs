import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const read = async file => JSON.parse(await fs.readFile(path.join(root, file), 'utf8'));
const digest = text => crypto.createHash('sha256').update(text).digest('hex');
const ready = verdict => /^(direct|context|reframe)-ready$/.test(verdict);

// Evaluates the keywords used by the two checked-in contracts, not arbitrary
// JSON Schema documents. Factual truth and design quality require human review.
export function schemaErrors(value, schema, at = '$') {
  const errors = [];
  const add = message => errors.push(`${at}: ${message}`);
  const types = [].concat(schema.type || []);
  const isType = t => t === 'null' ? value === null : t === 'array' ? Array.isArray(value) : t === 'object' ? value !== null && typeof value === 'object' && !Array.isArray(value) : t === 'number' ? typeof value === 'number' && Number.isFinite(value) : typeof value === t;
  if (types.length && !types.some(isType)) { add(`expected ${types.join('|')}`); return errors; }
  if ('const' in schema && value !== schema.const) add(`expected ${JSON.stringify(schema.const)}`);
  if (schema.enum && !schema.enum.includes(value)) add('value outside enum');
  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) add(`below ${schema.minimum}`);
    if (schema.maximum !== undefined && value > schema.maximum) add(`above ${schema.maximum}`);
  }
  if (typeof value === 'string') {
    if (schema.minLength && value.length < schema.minLength) add('empty string');
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) add('pattern mismatch');
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) add('too few items');
    if (schema.maxItems !== undefined && value.length > schema.maxItems) add('too many items');
    if (schema.items) value.forEach((v, i) => errors.push(...schemaErrors(v, schema.items, `${at}[${i}]`)));
  } else if (value !== null && typeof value === 'object') {
    for (const key of schema.required || []) if (!(key in value)) add(`missing ${key}`);
    if (schema.minProperties && Object.keys(value).length < schema.minProperties) add('too few properties');
    for (const [key, item] of Object.entries(value)) {
      if (schema.properties?.[key]) errors.push(...schemaErrors(item, schema.properties[key], `${at}.${key}`));
      else if (schema.additionalProperties === false) add(`unexpected ${key}`);
      else if (schema.additionalProperties && typeof schema.additionalProperties === 'object') errors.push(...schemaErrors(item, schema.additionalProperties, `${at}.${key}`));
    }
  }
  for (const part of schema.allOf || []) errors.push(...schemaErrors(value, part, at));
  if (schema.oneOf && schema.oneOf.filter(s => schemaErrors(value, s, at).length === 0).length !== 1) add('must match exactly one alternative');
  if (schema.if && schemaErrors(value, schema.if, at).length === 0 && schema.then) errors.push(...schemaErrors(value, schema.then, at));
  return errors;
}

export function datasetErrors(data) {
  const errors = [];
  const seen = new Set();
  const sources = new Set((data.sources || []).map(s => s.sourceId));
  if (sources.size !== (data.sources || []).length) errors.push('duplicate source IDs');
  for (const row of data.rows || []) {
    if (seen.has(row.id)) errors.push(`duplicate row ${row.id}`);
    seen.add(row.id);
    if (!sources.has(row.sourceId)) errors.push(`${row.id}: unresolved sourceId`);
    if ((row.lat === null) !== (row.lon === null)) errors.push(`${row.id}: incomplete coordinate pair`);
    if (['global', 'categorical'].includes(data.geography?.mode) && (row.lat !== null || row.lon !== null)) errors.push(`${row.id}: nongeographic value has coordinates`);
    const boundedEstimate = Number.isFinite(row.lower) && Number.isFinite(row.upper) && row.lower <= row.upper && ['estimated', 'modelled', 'projected', 'scenario'].includes(row.status);
    if (row.value === null && row.status !== 'missing' && !boundedEstimate) errors.push(`${row.id}: null value must have missing status or a documented bounded estimate`);
    if (row.lower !== undefined && row.upper !== undefined && (!Number.isFinite(row.lower) || !Number.isFinite(row.upper) || row.lower > row.upper)) errors.push(`${row.id}: invalid interval bounds`);
    if (row.status === 'missing' && row.value !== null) errors.push(`${row.id}: missing row has a value`);
  }
  return errors;
}

export async function validatePack({ draft = false } = {}) {
  const errors = [], warnings = [];
  const originals = await read('concepts-132.json');
  const ids = new Set(originals.map(c => c.id));
  if (ids.size !== 132 || originals.length !== 132) errors.push('original inventory must contain exactly 132 distinct concepts');
  const dsSchema = await read('audits/dataset.schema.json');
  const conceptSchema = await read('audits/concept.schema.json');
  const datasets = new Map(), hashes = new Map();
  for (const file of (await fs.readdir(path.join(root, 'datasets'))).filter(f => f.endsWith('.json')).sort()) {
    const text = await fs.readFile(path.join(root, 'datasets', file), 'utf8');
    let data;
    try { data = JSON.parse(text); } catch { errors.push(`${file}: invalid JSON`); continue; }
    for (const e of [...schemaErrors(data, dsSchema), ...datasetErrors(data)]) errors.push(`${file}: ${e}`);
    if (datasets.has(data.datasetId)) errors.push(`${file}: duplicate datasetId ${data.datasetId}`);
    datasets.set(data.datasetId, { file: `research/datasets/${file}`, data });
    hashes.set(data.datasetId, digest(text));
  }
  let reviews = [], designs = [];
  try { const d = await read('designs/design-registry.json'); designs = Array.isArray(d) ? d : d.designs || d.entries || []; } catch { warnings.push('design registry not yet available'); }
  const designMap = new Map(designs.map(d => [d.designId || d.id, d]));
  if (designMap.size !== designs.length) errors.push('duplicate design IDs');
  if (!draft && new Set(designs.map(d => d.conceptId)).size !== 132) errors.push('design registry must cover all 132 concepts');
  try { const r = await read('audits/final-review.json'); reviews = Array.isArray(r) ? r : r.concepts || r.reviews || []; } catch { warnings.push('independent final review not yet available'); }
  if (!draft && reviews.length !== 132) errors.push(`independent review must cover all132; found ${reviews.length}`);
  const reviewed = new Set();
  for (const r of reviews) {
    for (const e of schemaErrors(r, conceptSchema)) errors.push(`concept ${r.conceptId}: ${e}`);
    if (!ids.has(r.conceptId)) errors.push(`unrecognized concept ${r.conceptId}`);
    if (reviewed.has(r.conceptId)) errors.push(`duplicate concept ${r.conceptId}`);
    reviewed.add(r.conceptId);
    for (const id of r.datasetIds || []) if (!datasets.has(id)) errors.push(`concept ${r.conceptId}: missing dataset ${id}`);
    if (ready(r.verdict)) {
      if (!designMap.has(r.designId)) errors.push(`concept ${r.conceptId}: unresolved design ${r.designId}`);
      const design = designMap.get(r.designId);
      if (design && design.conceptId !== r.conceptId) errors.push(`concept ${r.conceptId}: design belongs to another concept`);
      for (const id of r.datasetIds) {
        const binding = design?.datasetBindings?.find(b => b.datasetId === id);
        if (!binding || binding.sha256 !== hashes.get(id)) errors.push(`concept ${r.conceptId}: absent or stale design binding for ${id}`);
        if (binding && binding.rowCount !== datasets.get(id)?.data.rows.length) errors.push(`concept ${r.conceptId}: design row count differs for ${id}`);
        if (binding && datasets.has(id)) {
          const rows = datasets.get(id).data.rows;
          const fields = new Set(rows.flatMap(row => Object.keys(row)));
          const rowIds = new Set(rows.map(row => row.id));
          for (const field of binding.fields || []) if (!fields.has(field)) errors.push(`concept ${r.conceptId}: nonexistent bound field ${id}.${field}`);
          const selected = binding.includedRowIds || [];
          if (!selected.length || new Set(selected).size !== selected.length || selected.some(rowId => !rowIds.has(rowId))) errors.push(`concept ${r.conceptId}: invalid design row selection for ${id}`);
          if (binding.includedRowCount !== selected.length) errors.push(`concept ${r.conceptId}: selected row count differs for ${id}`);
        }
      }
      for (const id of r.datasetIds) if (r.review?.datasetDigests?.[id] !== hashes.get(id)) errors.push(`concept ${r.conceptId}: stale or absent review digest for ${id}`);
      const breakdown = r.review?.scoreBreakdown || [];
      if (!breakdown.length || breakdown.reduce((a, b) => a + b.earned, 0) !== r.review.score || breakdown.reduce((a, b) => a + b.possible, 0) !== 100) errors.push(`concept ${r.conceptId}: invalid score arithmetic`);
      if (breakdown.some(s => s.earned > s.possible)) errors.push(`concept ${r.conceptId}: score exceeds category maximum`);
    }
  }
  if (!draft) for (const id of ids) if (!reviewed.has(id)) errors.push(`missing independent review for ${id}`);
  const allRows = [...datasets.values()].flatMap(d => d.data.rows);
  return { errors, warnings, counts: { concepts: originals.length, datasets: datasets.size, observations: allRows.length, explicitMissingRows: allRows.filter(r => r.status === 'missing').length, intervalOnlyRows: allRows.filter(r => r.value === null && r.status !== 'missing').length, designs: designs.length, reviewed: reviews.length, accepted: reviews.filter(r => ready(r.verdict)).length }, datasets, hashes, reviews, designs };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await validatePack({ draft: process.argv.includes('--draft') });
  console.log(JSON.stringify({ counts: result.counts, errors: result.errors, warnings: result.warnings }, null, 2));
  if (result.errors.length) process.exitCode = 1;
}
