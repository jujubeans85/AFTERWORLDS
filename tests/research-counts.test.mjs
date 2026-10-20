import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { countInstrumentPlan, COUNT_CONCEPTS } from "../src/research-counts.js";
import { createCountScene } from "../dist/assets/research-count-scene.js";
import { ResearchGlobe } from "../dist/assets/research-view.js";

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
    instances: object.instanceMatrix ? Array.from(object.instanceMatrix.array) : null,
    color: object.material?.color?.getHex(), wireframe: object.material?.wireframe, data: object.userData,
  }));
  return JSON.stringify(state);
}
test("count plans bind exact complete counts and anonymous nine-slot comparisons", async () => {
  const votes = countInstrumentPlan(await research("333"));
  assert.deepEqual(votes.items.map(item => item.slots), [117, 2, 2]);
  const versions = countInstrumentPlan(await research("63-8"));
  assert.deepEqual(versions.items.map(item => item.slots), [1, 14, 11, 16]);
  const years = countInstrumentPlan(await research("364"));
  assert.deepEqual(years.items.map(item => [item.row.value, item.slots]), [[7, 9], [8, 9]]);
});
test("mosaic units have equal physical size within a world and exact source count, not named identities", async () => {
  for (const id of ["333", "63-8"]) {
    const layer = createCountScene(await research(id), { createCanvas: canvas });
    assert.equal(new Set(layer.countMeshes.map(mesh => mesh.geometry.parameters.width)).size, 1);
    assert.equal(layer.countMeshes.reduce((sum, mesh) => sum + mesh.count, 0), id === "333" ? 121 : 42);
    assert.ok(layer.countMeshes.every(mesh => !mesh.userData.country && !mesh.userData.language));
  }
});
test("nine-slot counters preserve filled and open positions with no winning-year identities", async () => {
  const layer = createCountScene(await research("364"), { createCanvas: canvas });
  assert.equal(layer.countMeshes.length, 18);
  assert.deepEqual(layer.plan.items.map(item => layer.countMeshes.filter(mesh =>
    mesh.userData.rowId === item.row.id && mesh.userData.filled).length), [7, 8]);
});
test("explicit time-basis switch changes foreground and outline only, preserving source heights and plate sizes", async () => {
  const layer = createCountScene(await research("320"), { createCanvas: canvas });
  const shape = layer.countMeshes.map(mesh => [mesh.position.y, mesh.geometry.parameters.width, mesh.geometry.parameters.height]);
  for (const basis of ["paid hours only", "paid and unpaid hours"]) {
    assert.equal(layer.setTimeBasis(basis), true);
    assert.deepEqual(layer.countMeshes.map(mesh => [mesh.position.y, mesh.geometry.parameters.width, mesh.geometry.parameters.height]), shape);
    layer.timeGroups.forEach(group => {
      assert.equal(group.group.position.z, group.timeBasis === basis ? 0.3 : -0.3);
      group.plates.forEach(plate => assert.equal(plate.material.wireframe, group.timeBasis !== basis));
    });
  }
  assert.equal(layer.setTimeBasis("invented"), false);
  layer.plan.items.forEach((item, index) =>
    assert.ok(Math.abs(layer.countMeshes[index].position.y - (-0.55 + 1.2 * item.row.value / 10)) < 1e-12));
});
test("all count and counterweight measurements remain invariant through ambient loop and selection", async () => {
  for (const id of COUNT_CONCEPTS) {
    const data = await research(id), layer = createCountScene(data, { createCanvas: canvas });
    assert.ok(layer.ambient.children.length <= 2);
    const before = snapshot(layer);
    for (const phase of [0, 0.25, 0.5, 0.75, 1]) {
      layer.animateAmbient(layer.period * phase);
      assert.equal(snapshot(layer), before);
    }
    const view = Object.assign(Object.create(ResearchGlobe.prototype), {
      layer, world: layer.world, pause() {}, wake() {}, onSelect() {},
    });
    for (let index = 0; index < data.rows.length; index++) {
      view.select(index);
      assert.equal(snapshot(layer), before);
    }
  }
});
