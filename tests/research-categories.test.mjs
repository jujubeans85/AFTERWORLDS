import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import * as THREE from "../dist/assets/vendor/three.module.js";
import { categoryInstrumentPlan, CATEGORY_CONCEPTS } from "../src/research-categories.js";
import { createCategoryScene } from "../dist/assets/research-category-scene.js";

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
test("all twenty categorical plans preserve typed source values without fractions or quantity geometry", async () => {
  assert.equal(CATEGORY_CONCEPTS.length, 20);
  for (const id of CATEGORY_CONCEPTS) {
    const data = await research(id), plan = categoryInstrumentPlan(data);
    assert.deepEqual(plan.items.map(item => item.row.value), data.rows.map(row => row.value));
    assert.ok(plan.items.every(item => !Object.hasOwn(item, "fraction")));
    const changed = structuredClone(data); changed.design.scale.type = "linear";
    assert.throws(() => categoryInstrumentPlan(changed), /Unsupported/);
  }
});
test("source memberships, chronology, app status, schedule hours and equal celestial cases are explicit", async () => {
  const memberships = categoryInstrumentPlan(await research("417"));
  memberships.items.forEach(item => {
    assert.equal(item.members.filter(member => member.host).length, 1);
    assert.equal(item.members.find(member => member.host).name, item.row.hostCountry);
  });
  const dates = categoryInstrumentPlan(await research("415"));
  assert.deepEqual(dates.chronological.map(item => item.row.announcementDate),
    ["2025-04-30", "2025-09-16", "2025-11-13", "2025-11-20", "2026-01-29"]);
  const status = categoryInstrumentPlan(await research("256"));
  assert.deepEqual(status.items.map(item => item.pattern), ["solid", "solid", "solid", "solid", "dotted", "dotted"]);
  const supervision = categoryInstrumentPlan(await research("358"));
  assert.equal(supervision.items[2].pattern, "outline");
  assert.equal(supervision.items[2].color, "#edf4fa");
  const schedule = categoryInstrumentPlan(await research("321"));
  assert.equal(schedule.items.filter(item => item.clock).length, 5);
  schedule.items.filter(item => item.clock).forEach(item =>
    assert.deepEqual(item.clock, { startHour: 17, endHour: 21, denominator: 24 }));
  const celestial = createCategoryScene(await research("170-3"), { createCanvas: canvas });
  const tokens = [];
  celestial.measured.traverse(object => { if (object.userData.physicalRadius === false) tokens.push(object); });
  assert.equal(tokens.length, 2);
  assert.equal(tokens[0].geometry.parameters.radius, tokens[1].geometry.parameters.radius);
});
test("partnership knot has five equal unique entities and three exact undirected source edges", async () => {
  const layer = createCategoryScene(await research("155-17"), { createCanvas: canvas });
  assert.equal(layer.sourceNodes.length, 5);
  assert.equal(layer.sourceNodes.filter(node => node.userData.entity === "Anthropic").length, 1);
  assert.equal(new Set(layer.sourceNodes.map(node => node.geometry.parameters.radius)).size, 1);
  assert.deepEqual(layer.sourceLinks.map(edge => [edge.userData.fromEntity, edge.userData.toEntity, edge.userData.directed]),
    [["Microsoft", "OpenAI", false], ["Amazon", "Anthropic", false], ["Google", "Anthropic", false]]);
});
test("explicit reverse mode turns source backs outward without hiding them behind the opposite facet", async () => {
  for (const id of ["397", "382", "259", "170-3", "178", "107"]) {
    const layer = createCategoryScene(await research(id), { createCanvas: canvas });
    const positions = layer.panels.map(panel => panel.position.toArray());
    layer.setReverseEvidence(true);
    layer.world.updateMatrixWorld(true);
    layer.panels.forEach(panel => {
      const backNormal = new THREE.Vector3(0, 0, -1).applyQuaternion(panel.quaternion);
      assert.ok(backNormal.dot(panel.position.clone().normalize()) > 0.999);
    });
    assert.deepEqual(layer.panels.map(panel => panel.position.toArray()), positions);
    layer.setReverseEvidence(false);
    layer.panels.forEach(panel => assert.equal(panel.rotation.y, panel.userData.sourceFace));
  }
});
test("twenty profile scenes preserve every measured transform and material through all ambient phases", async () => {
  for (const id of CATEGORY_CONCEPTS) {
    const data = await research(id), layer = createCategoryScene(data, { createCanvas: canvas });
    assert.equal(layer.markers.length, data.rows.length);
    assert.ok(layer.ambient.children.length <= 2, id);
    const before = snapshot(layer);
    for (const phase of [0, 0.25, 0.5, 0.75, 1]) {
      layer.animateAmbient(layer.period * phase);
      assert.equal(snapshot(layer), before, id);
    }
  }
});
