import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { railInstrumentPlan, RAIL_CONCEPTS } from "../src/research-rails.js";
import { createRailScene } from "../dist/assets/research-rail-scene.js";
import { ResearchGlobe } from "../dist/assets/research-view.js";
import { researchThumbnail } from "../scripts/research-thumbnail.mjs";

const registry = JSON.parse(await fs.readFile(new URL("../dist/assets/registry.json", import.meta.url)));
async function research(id) {
  const entry = registry.entries.find(entry => entry.id === id);
  const bundle = JSON.parse(await fs.readFile(new URL(`../dist${entry.research.release.url}`, import.meta.url)));
  return { ...bundle, rows: bundle.dataset.rows };
}
const canvas = () => ({ getContext: () => ({ clearRect() {}, fillText() {} }) });
function snapshot(layer) {
  const result = [];
  layer.measured.traverse(object => result.push({
    geometry: object.geometry?.attributes.position?.array ? Array.from(object.geometry.attributes.position.array) : null,
    position: object.position.toArray(), rotation: object.rotation.toArray(), scale: object.scale.toArray(),
    color: object.material?.color?.getHex(), map: object.material?.map?.version, data: object.userData,
  }));
  return JSON.stringify(result);
}
test("seven explicit rulers preserve native units and exact unnormalised source fractions", async () => {
  for (const id of RAIL_CONCEPTS) {
    const data = await research(id), plan = railInstrumentPlan(data);
    assert.deepEqual(plan.items.map(item => item.row.id), data.rows.map(row => row.id));
    plan.items.forEach(item => assert.equal(item.fraction, item.row.value / data.design.scale.domain[1]));
    const changed = structuredClone(data); changed.design.scale.domain[1] += 1;
    assert.throws(() => railInstrumentPlan(changed), /Unsupported/);
  }
});
test("accounting shelves never combine corporate sales, annual GDP or a multi-year intention", async () => {
  const accounts = railInstrumentPlan(await research("369"));
  assert.equal(accounts.panels[0].items.length, 2);
  assert.ok(accounts.panels[0].items.every(item => item.row.measureType === "corporate revenue"));
  assert.ok(accounts.panels[1].items.every(item => item.row.measureType === "national GDP"));
  assert.equal(accounts.panels[1].face, Math.PI);
  const intention = railInstrumentPlan(await research("385"));
  assert.equal(intention.items[0].kind, "outline");
  assert.equal(intention.items[0].row.value, 500000000000);
  assert.ok(intention.items.slice(1).every(item => item.kind === "bar"));
  assert.ok(intention.panels[0].subtitle.includes("next four years"));
});
test("cost calipers, consistency markers, capacity facets and ancestry inset retain separate meanings", async () => {
  const cost = railInstrumentPlan(await research("276"));
  assert.deepEqual(cost.domain, [0, 3]);
  assert.ok(cost.items.every(item => item.kind === "caliper"));
  assert.deepEqual(cost.items.map(item => item.color), ["#57d5c4", "#f2ba68"]);
  const models = railInstrumentPlan(await research("409"));
  assert.ok(models.items.every(item => item.kind === "marker" && item.color === "#88bdf4"));
  assert.equal(models.panels.length, 6);
  const capacity = railInstrumentPlan(await research("324"));
  assert.equal(capacity.panels.length, 5);
  const mixed = capacity.items.find(item => item.row.incrementalMW);
  assert.equal(mixed.row.value, 690); assert.equal(mixed.row.incrementalMW, 190);
  assert.equal(capacity.items.length, 5, "increment is not an extra bar");
  const ancestry = railInstrumentPlan(await research("232"));
  assert.equal(ancestry.panels.length, 7);
  assert.deepEqual(ancestry.panels.at(-1).domain, [0, 10]);
  assert.equal(ancestry.panels.at(-1).items.length, 5);
  assert.deepEqual(ancestry.items.map(item => item.row.value), [88.4, 6.05, 0.28, 2.7, 1.26, 1.31]);
});
test("seven real scenes preserve source geometry and materials at all ambient phases and selection", async () => {
  for (const id of RAIL_CONCEPTS) {
    const data = await research(id), layer = createRailScene(data, { createCanvas: canvas });
    assert.equal(layer.markers.length, data.rows.length);
    assert.ok(layer.ambient.children.length <= 2);
    const before = snapshot(layer);
    for (const phase of [0, 0.25, 0.5, 0.75, 1]) {
      layer.animateAmbient(phase * layer.period);
      assert.equal(snapshot(layer), before);
    }
    const view = Object.assign(Object.create(ResearchGlobe.prototype), {
      layer, world: layer.world, geographic: false, hasDetailInset: Boolean(layer.setDetailInset),
      detailInset: false, pause() {}, wake() {}, onSelect() {},
    });
    for (let index = 0; index < data.rows.length; index++) {
      view.select(index, true);
      assert.ok(layer.ring.visible);
      assert.equal(snapshot(layer), before);
    }
    if (id === "232") {
      assert.equal(layer.insetPanel.visible, false);
      assert.ok(layer.mainPanels.every(panel => panel.visible));
      view.setDetailInset(true);
      assert.equal(layer.insetPanel.visible, true);
      assert.ok(layer.mainPanels.every(panel => !panel.visible));
      view.select(1);
      assert.ok(layer.ring.visible);
      assert.equal(view.canFocus(0), false, "European main share is outside the separate inset");
      view.focusSelection();
      assert.equal(view.detailInset, true, "focus preserves explicit inset mode");
      assert.equal(layer.markers[1].selectionTargets.length, 2);
      view.setDetailInset(false);
      assert.ok(layer.mainPanels.every(panel => panel.visible));
    }
  }
});
test("native rail previews retain full source rows and metadata, not legacy rescaled scores", async () => {
  for (const id of RAIL_CONCEPTS) {
    const data = await research(id), svg = researchThumbnail(data);
    for (const row of data.rows) {
      assert.ok(svg.includes(`data-row-id="${row.id}"`));
      assert.ok(svg.includes(`data-native-fraction="${row.value / data.design.scale.domain[1]}"`));
    }
    if (id === "232") assert.equal((svg.match(/data-inset-row-id=/g) || []).length, 5);
    if (id === "385") assert.ok(svg.includes('data-kind="outline"'));
  }
});
