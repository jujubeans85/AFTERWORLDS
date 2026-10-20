import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { prepareElectricityGeography } from '../scripts/research-geography.mjs';
import { accessPaintPlan, accessCountryAt, accessColor, ACCESS_MISSING, ACCESS_OUTSIDE } from '../src/research-geography.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const dataset = JSON.parse(await fs.readFile(new URL('../research/datasets/society-electricity-access.json', import.meta.url), 'utf8'));
const geography = await prepareElectricityGeography(root, dataset);
const research = { design: { conceptId: '408' }, dataset, rows: dataset.rows, geography };
const plan = accessPaintPlan(research);

test('audited coverage preserves every economy without manufacturing geography for omitted codes', () => {
  assert.equal(dataset.rows.length, 217);
  const mapped = new Set(plan.countries.map(country => country.row.id));
  const tableOnly = new Set(plan.unsupportedRowIds);
  assert.equal(mapped.size, 167);
  assert.equal(tableOnly.size, 50);
  for (const row of dataset.rows)
    assert.notEqual(mapped.has(row.id), tableOnly.has(row.id), `${row.id} must be represented exactly once`);
  for (const id of ['electricity-ASM', 'electricity-XKX', 'electricity-CYP', 'electricity-SOM', 'electricity-CHI'])
    assert.ok(tableOnly.has(id), `${id} has no approved complete geometry in this bundle`);
  assert.deepEqual(dataset.rows.filter(row => row.value === null).map(row => row.id), ['electricity-ASM', 'electricity-XKX']);
  assert.equal(dataset.rows.filter(row => row.value === 100).length, 122);
});

test('country picking preserves known interiors, enclave holes and source identity', () => {
  // Geographic checkpoints are independent of projected pixels, texture colors
  // and generated picking samples. Lesotho specifically checks South Africa's hole.
  for (const [id, longitude, latitude] of [
    ['electricity-USA', -98, 39],
    ['electricity-AUS', 134, -25],
    ['electricity-CHN', 104, 35],
    ['electricity-COD', 20, 1],
    ['electricity-JPN', 138, 36],
    ['electricity-FJI', 178.2, -17.8],
    ['electricity-LSO', 28.5, -29.5],
    ['electricity-ZAF', 25, -30],
  ]) {
    const selected = accessCountryAt(plan, longitude, latitude);
    assert.equal(selected?.row.id, id);
    assert.equal(dataset.rows[selected.index].id, id);
  }
});

test('ocean and explicitly unsupported scopes cannot pick invented access values', () => {
  for (const [label, longitude, latitude] of [
    ['historical Fiji seam error in Pacific', -140, -16.4],
    ['historical Fiji seam error in Atlantic', -30, -16.4],
    ['North Atlantic', -30, 25],
    ['South Atlantic', -10, -40],
    ['outside-sample Antarctica', 10, -80],
    ['unkeyed Kosovo', 21, 42.6],
    ['excluded split Somalia scope', 48, 9],
    ['excluded split Cyprus scope', 33.4, 35.2],
  ]) assert.equal(accessCountryAt(plan, longitude, latitude), null, label);
});

test('zero, complete access, missing and outside-sample colors remain distinct', () => {
  assert.equal(new Set([accessColor(0), accessColor(100), accessColor(null), ACCESS_OUTSIDE]).size, 4);
  assert.equal(accessColor(null), ACCESS_MISSING);
  for (const value of [-1, 101, NaN, Infinity, '0', undefined])
    assert.throws(() => accessColor(value), /native percentage/);
});

test('painter contract refuses duplicate joins, wrong economy IDs and incomplete omission coverage', () => {
  const duplicate = structuredClone(research);
  duplicate.geography.countries.push(duplicate.geography.countries[0]);
  assert.throws(() => accessPaintPlan(duplicate), /duplicated/);
  const wrong = structuredClone(research);
  wrong.geography.countries[0].geographicId = 'ZZZ';
  assert.throws(() => accessPaintPlan(wrong), /geometry join/);
  const lost = structuredClone(research);
  lost.geography.unsupportedRowIds.pop();
  assert.throws(() => accessPaintPlan(lost), /coverage/);
});
