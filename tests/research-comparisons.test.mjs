import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { COMPARISON_CONCEPTS, comparisonInstrumentPlan } from "../src/research-comparisons.js";
import { createComparisonScene } from "../dist/assets/research-comparison-scene.js";
const designs = JSON.parse(await fs.readFile(new URL("../research/designs/design-registry.json", import.meta.url))).designs;
async function research(id) {
  const design = designs.find(item => item.conceptId === id);
  const dataset = JSON.parse(await fs.readFile(new URL(`../${design.datasetBindings[0].path}`, import.meta.url)));
  const included = design.datasetBindings[0].includedRowIds;
  return { conceptId: id, design, dataset, rows: included ? dataset.rows.filter(row => included.includes(row.id)) : dataset.rows };
}
const canvas = () => ({ getContext: () => ({ clearRect() {}, fillText() {} }) });
function snapshot(group) {
  const state = []; group.traverse(object => state.push({ position: object.position.toArray(), rotation: object.rotation.toArray(),
    scale: object.scale.toArray(), data: object.userData, color: object.material?.color?.getHex(),
    geometry: object.geometry?.attributes.position ? Array.from(object.geometry.attributes.position.array) : null,
    texture: object.material?.map?.version })); return JSON.stringify(state);
}
test("comparison plans preserve native values, source subsets and typed uncertainty", async () => {
  for (const id of COMPARISON_CONCEPTS) {
    const data = await research(id), plan = comparisonInstrumentPlan(data);
    assert.equal(plan.items.length, data.rows.length);
    for (const item of plan.items) {
      assert.equal(item.fraction, item.row.value / plan.domain[1]);
      assert.deepEqual(item.interval, id === "211-4" ? [item.row.ciLower, item.row.ciUpper] : null);
    }
  }
  const subset = await research("218"); assert.equal(subset.dataset.rows.length, 18); assert.equal(subset.rows.length, 12);
  const fuel = comparisonInstrumentPlan(await research("323"));
  assert.equal(fuel.items.find(item => item.row.qualifier === ">").kind, "open-lower-bar");
});
test("218 raw bundles and bound rows use the same exact ordered subset without trimming the source", async () => {
  const data = await research("218");
  const { rows, ...raw } = data;
  const bound = comparisonInstrumentPlan(data), preview = comparisonInstrumentPlan(raw);
  assert.deepEqual(preview, bound);
  assert.equal(raw.dataset.rows.length, 18);
  assert.deepEqual(preview.items.map(item => item.row.id), data.design.datasetBindings[0].includedRowIds);
  const reversedSource = { ...raw, dataset: { ...raw.dataset, rows: [...raw.dataset.rows].reverse() } };
  assert.deepEqual(comparisonInstrumentPlan(reversedSource), bound);
  const duplicate = { ...raw, dataset: { ...raw.dataset, rows: [...raw.dataset.rows, rows[0]] } };
  assert.throws(() => comparisonInstrumentPlan(duplicate), /exactly once/);
  const missing = { ...raw, dataset: { ...raw.dataset, rows: raw.dataset.rows.filter(row => row.id !== rows[0].id) } };
  assert.throws(() => comparisonInstrumentPlan(missing), /exactly once/);
  const changed = structuredClone(raw);
  changed.design.datasetBindings[0].includedRowIds[0] = "gemma-0-1";
  assert.throws(() => comparisonInstrumentPlan(changed), /exact reviewed/);
  assert.throws(() => comparisonInstrumentPlan({ ...data, rows: [...rows].reverse() }), /reviewed order/);
});
test("shipment components retain native stack extents and distinct pointer and selection targets", async () => {
  const layer = createComparisonScene(await research("214"), { createCanvas: canvas });
  const domestic = layer.plan.items.find(item => item.row.id === "jara-dom25");
  const exported = layer.plan.items.find(item => item.row.id === "jara-exp25");
  const total = layer.plan.items.find(item => item.row.id === "jara-total25");
  assert.equal(exported.stackStart, domestic.row.value); assert.equal(total.stackStart, 0);
  assert.equal(domestic.row.value + exported.row.value, total.row.value);
  const a = layer.markers[domestic.index], b = layer.markers[exported.index];
  assert.notDeepEqual(a.base.toArray(), b.base.toArray());
  assert.notDeepEqual(a.hitPoints.map(p => p.toArray()), b.hitPoints.map(p => p.toArray()));
});
test("metric reading frames and decorative phases never change measured values or uncertainty", async () => {
  for (const id of COMPARISON_CONCEPTS) {
    const data = await research(id), layer = createComparisonScene(data, { createCanvas: canvas });
    assert.equal(layer.markers.length, data.rows.length);
    assert.ok(layer.ambient.children.length <= 2);
    const before = snapshot(layer.measured);
    for (const phase of [0, .25, .5, .75, 1]) { layer.animateAmbient(layer.period * phase); assert.equal(snapshot(layer.measured), before, id); }
    for (const metric of layer.metrics) {
      assert.equal(layer.setMetric(metric), true); assert.equal(snapshot(layer.measured), before, id);
      layer.metricFrames.forEach(frame => assert.equal(frame.visible, frame.userData.metric === metric));
    }
    if (id === "392") { assert.ok(layer.hud); assert.equal(layer.hud.parent, null); assert.equal(layer.hud.visible, true); }
    if (id === "211-4") layer.intervals.forEach(whisker => {
      const row = data.rows.find(row => row.id === whisker.userData.rowId);
      assert.equal(whisker.userData.lower, row.ciLower); assert.equal(whisker.userData.upper, row.ciUpper);
    });
  }
});
