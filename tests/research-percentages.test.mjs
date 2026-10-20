import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { percentageInstrumentPlan, PERCENTAGE_CONCEPTS } from "../src/research-percentages.js";
import { createPercentageScene } from "../dist/assets/research-percentage-scene.js";

const designs = JSON.parse(await fs.readFile(new URL("../research/designs/design-registry.json", import.meta.url))).designs;
async function research(id) {
  const design = designs.find(item => item.conceptId === id);
  const dataset = JSON.parse(await fs.readFile(new URL(`../${design.datasetBindings[0].path}`, import.meta.url)));
  return { conceptId: id, design, dataset, rows: dataset.rows };
}
const canvas = () => ({ getContext: () => ({ clearRect() {}, fillText() {} }) });
function snapshot(layer) {
  const state = [];
  layer.measured.traverse(object => state.push({
    position: object.position.toArray(), rotation: object.rotation.toArray(), scale: object.scale.toArray(),
    geometry: object.geometry?.attributes.position?.array ? Array.from(object.geometry.attributes.position.array) : null,
    color: object.material?.color?.getHex(), texture: object.material?.map?.version, data: object.userData,
  }));
  return JSON.stringify(state);
}
test("native percentage arcs use exact full or half-circle formulas without renormalisation", async () => {
  for (const id of PERCENTAGE_CONCEPTS) {
    const plan = percentageInstrumentPlan(await research(id));
    for (const item of plan.items)
      assert.equal(item.angle, (id === "422-2" ? Math.PI : 2 * Math.PI) * item.percent / 100);
  }
  const accounts = percentageInstrumentPlan(await research("138-8"));
  assert.deepEqual(accounts.items.map(item => [item.percent, item.row.value, item.row.denominatorAccounts]),
    [[67.3, 560, 832], [6.5, 54, 832]]);
  assert.notEqual(accounts.items[0].percent, 560 / 832 * 100, "published rounded percent remains the arc source");
});
test("screening uses reported percentages and source CI95 separately from analyzed and randomized counts", async () => {
  const data = await research("8-6"), plan = percentageInstrumentPlan(data);
  assert.deepEqual(plan.items.map(item => [item.percent, item.row.numerator, item.row.analyzedN, item.row.randomizedN, item.ci95]),
    [[100, 81, 81, 81, [96, 100]], [22, 18, 82, 83, [14, 32]]]);
  const layer = createPercentageScene(data, { createCanvas: canvas });
  assert.equal(layer.measuredArcs[0].geometry.parameters.thetaLength, 2 * Math.PI);
  assert.deepEqual(layer.whiskers.map(whisker => whisker.userData.ci95), [[96, 100], [14, 32]]);
  assert.deepEqual(layer.whiskers.map(whisker => whisker.userData.domain), [[0, 100], [0, 100]]);
});
test("occupation exposure lanes retain sex, category, subset outline and front/back pairing", async () => {
  const data = await research("422-2"), plan = percentageInstrumentPlan(data);
  assert.deepEqual(plan.items.map(item => item.face), [0, 0, Math.PI, Math.PI]);
  assert.deepEqual(plan.items.map(item => item.color), ["#57d5c4", "#f2ba68", "#57d5c4", "#f2ba68"]);
  const layer = createPercentageScene(data, { createCanvas: canvas });
  assert.deepEqual(layer.measuredArcs.map(arc => arc.userData.pattern), ["solid", "solid", "outline", "outline"]);
});
test("all five percentage scenes keep values, colors and CI endpoints invariant at decorative phases", async () => {
  for (const id of PERCENTAGE_CONCEPTS) {
    const data = await research(id), layer = createPercentageScene(data, { createCanvas: canvas });
    assert.equal(layer.markers.length, data.rows.length);
    assert.ok(layer.ambient.children.length <= 2);
    const before = snapshot(layer);
    for (const phase of [0, 0.25, 0.5, 0.75, 1]) {
      layer.animateAmbient(layer.period * phase);
      assert.equal(snapshot(layer), before, id);
    }
  }
});
