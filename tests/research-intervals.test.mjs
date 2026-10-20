import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { intervalInstrumentPlan } from "../src/research-intervals.js";
import { createInstrumentScene } from "../dist/assets/research-instrument-scene.js";
import { ResearchGlobe, updateAmbientFrame } from "../dist/assets/research-view.js";
import { researchThumbnail } from "../scripts/research-thumbnail.mjs";

const registry = JSON.parse(await fs.readFile(new URL("../dist/assets/registry.json", import.meta.url)));
async function research(id) {
  const entry = registry.entries.find(entry => entry.id === id);
  const bundle = JSON.parse(await fs.readFile(new URL(`../dist${entry.research.release.url}`, import.meta.url)));
  return { ...bundle, rows: bundle.dataset.rows };
}
function canvas() {
  return { getContext: () => ({ clearRect() {}, fillText() {} }) };
}
function snapshot(layer) {
  const objects = [];
  layer.measured.traverse(object => objects.push({
    positions: object.geometry?.attributes.position?.array ? Array.from(object.geometry.attributes.position.array) : null,
    transform: object.matrix.toArray(), position: object.position.toArray(), rotation: object.rotation.toArray(),
    scale: object.scale.toArray(), data: object.userData,
    color: object.material?.color?.getHex(), texture: object.material?.map?.version,
  }));
  return JSON.stringify(objects);
}
test("ocean intervals retain endpoints without midpoint and separate rounded continental denominator", async () => {
  const plan = intervalInstrumentPlan(await research("388"));
  assert.deepEqual(plan.items.slice(0, 2).map(item => [item.lower, item.upper, item.point]),
    [[72, 76, null], [21, 30, null]]);
  assert.equal(plan.items.slice(2).reduce((sum, item) => sum + item.point, 0), 99);
  assert.notEqual(plan.panels[0].subtitle, plan.panels[1].subtitle);
  assert.equal(plan.panels[1].face, Math.PI);
});
test("trial whiskers are one source robust SE and reverse context remains nonquantitative", async () => {
  const data = await research("330"), plan = intervalInstrumentPlan(data);
  for (const item of plan.items) {
    assert.equal(item.lower, item.row.value - item.row.standardError);
    assert.equal(item.upper, item.row.value + item.row.standardError);
    assert.equal(item.row.regressionN, 654);
  }
  assert.deepEqual(plan.panels[1].items, []);
  assert.ok(plan.panels[1].context.join(" ").includes("same six-week intervention"));
  assert.equal(plan.panels[1].face, Math.PI);
});
test("threshold arcs and per-resident inset retain open, inclusive and approximate source semantics", async () => {
  const cooling = intervalInstrumentPlan(await research("406"));
  assert.deepEqual(cooling.items.map(item => item.qualifier), ["<", "<", "approximately", "up to"]);
  cooling.items.forEach(item => {
    assert.equal(item.angle, 2 * Math.PI * item.boundary / 100);
    assert.equal(item.point, null);
  });
  const electricity = intervalInstrumentPlan(await research("193-5"));
  assert.deepEqual(electricity.panels.map(panel => panel.domain), [[0, 600], [0, 5]]);
  assert.equal(electricity.panels[1].items[0], electricity.items[1]);
  assert.equal(electricity.items[1].qualifier, "<");
  assert.equal(electricity.items[1].point, null);
});
test("all interval scenes keep measured geometry, materials and labels invariant at decorative phases", async () => {
  for (const id of ["388", "330", "406", "193-5"]) {
    const data = await research(id), layer = createInstrumentScene(data, { createCanvas: canvas });
    assert.equal(layer.markers.length, data.rows.length);
    assert.ok(layer.ambient.children.length <= 2);
    layer.world.updateMatrixWorld(true);
    const before = snapshot(layer);
    for (const phase of [0, 0.25, 0.5, 0.75, 1]) {
      updateAmbientFrame(layer, layer.period * phase);
      layer.world.updateMatrixWorld(true);
      assert.equal(snapshot(layer), before, id);
    }
    if (id === "193-5") {
      const view = Object.assign(Object.create(ResearchGlobe.prototype), {
        layer, world: layer.world, geographic: false, pause() {}, wake() {}, onSelect() {},
      });
      view.select(1);
      assert.equal(layer.ring.visible, true);
      assert.equal(layer.extraRings[0].visible, true);
      assert.ok(layer.ring.position.z > 0 && layer.extraRings[0].position.z < 0);
      assert.equal(layer.ambient.rotation.y, Math.PI);
      assert.equal(snapshot(layer), before);
    }
  }
});
test("interval previews retain exact source row coverage and native domain separation", async () => {
  for (const id of ["388", "330", "406", "193-5"]) {
    const data = await research(id), svg = researchThumbnail(data);
    for (const row of data.rows) assert.ok(svg.includes(`data-row-id="${row.id}"`));
    if (id === "193-5") {
      assert.ok(svg.includes('data-panel-domain="0,600"'));
      assert.ok(svg.includes('data-panel-domain="0,5"'));
    }
    const changed = structuredClone(data);
    changed.design.scale.domain[1] += 1;
    assert.throws(() => intervalInstrumentPlan(changed), /Unsupported/);
  }
});
