import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { pairRingPlan } from "../src/research-pairs.js";
import { createPairScene, updateAmbientFrame, ResearchGlobe } from "../dist/assets/research-view.js";
import { researchThumbnail } from "../scripts/research-thumbnail.mjs";

const registry = JSON.parse(await fs.readFile(new URL("../dist/assets/registry.json", import.meta.url)));
async function research(id) {
  const entry = registry.entries.find(entry => entry.id === id);
  const bundle = JSON.parse(await fs.readFile(new URL(`../dist${entry.research.release.url}`, import.meta.url)));
  return { ...bundle, rows: bundle.dataset.rows };
}
function canvas() {
  const texts = [];
  return {
    texts, getContext: () => ({ clearRect() {}, fillText(text) { texts.push(text); } }),
  };
}
const snapshot = layer => JSON.stringify(layer.measured.children.map(object => ({
  positions: object.geometry?.attributes.position?.array ? Array.from(object.geometry.attributes.position.array) : null,
  transform: object.position.toArray(), angle: object.userData.nativeAngle,
  color: object.material.color.getHex(), textureVersion: object.material.map?.version,
})));

test("pair releases retain source values, equal denominators and distinct sparse-year/category meanings", async () => {
  const seabed = pairRingPlan(await research("5-6"));
  assert.deepEqual(seabed.rings.map(ring => ring.row.value), [27.3, 28.7]);
  assert.deepEqual(seabed.rings.map(ring => ring.row.period), ["GEBCO_2025 release", "GEBCO_2026 release"]);
  assert.equal(seabed.rings[1].foreground, true);
  assert.ok(seabed.rings[1].center[2] > seabed.rings[0].center[2], "latest release is spatially foregrounded");
  assert.deepEqual(seabed.rings.map(ring => ring.color), ["#88bdf4", "#57d5c4"]);
  const internet = pairRingPlan(await research("63"));
  assert.deepEqual(internet.rings.map(ring => ring.row.value), [85, 58]);
  assert.ok(internet.rings.every(ring => ring.remainderLabel === "Not using Internet"));
  assert.deepEqual(internet.rings.map(ring => ring.color), ["#88bdf4", "#57d5c4"]);
  for (const plan of [seabed, internet])
    for (const ring of plan.rings) assert.equal(ring.angle, 2 * Math.PI * ring.row.value / 100);
});

test("two real Three ring arcs have identical radii and keep values/labels unchanged through ambient loops", async () => {
  for (const id of ["5-6", "63"]) {
    const data = await research(id);
    const layer = createPairScene(data, { createCanvas: canvas });
    assert.equal(layer.markers.length, 2);
    assert.equal(layer.ambient.children.length, 2);
    const [a, b] = layer.markers.map(mark => mark.arc.geometry.parameters);
    assert.equal(a.innerRadius, b.innerRadius);
    assert.equal(a.outerRadius, b.outerRadius);
    assert.equal(a.thetaLength, Math.PI * 2 * data.rows[0].value / 100);
    assert.equal(b.thetaLength, Math.PI * 2 * data.rows[1].value / 100);
    const before = snapshot(layer);
    for (const phase of [0, 0.25, 0.5, 0.75, 1]) {
      updateAmbientFrame(layer, layer.period * phase);
      assert.equal(snapshot(layer), before);
      assert.equal(layer.ring.visible, false);
    }
  }
});

test("pair selection highlights a separate reference outline without changing either measured ring", async () => {
  const data = await research("5-6");
  const layer = createPairScene(data, { createCanvas: canvas });
  const selected = [];
  const view = Object.assign(Object.create(ResearchGlobe.prototype), {
    layer, world: layer.world, paired: true, geographic: false, selected: -1,
    pause() {}, wake() {}, onSelect: (...args) => selected.push(args),
  });
  const before = snapshot(layer);
  view.select(1, true);
  assert.equal(selected[0][0].id, "seabed-2026");
  assert.equal(layer.ring.visible, true);
  assert.equal(snapshot(layer), before);
  assert.ok(view.world.rotation.toArray().slice(0, 3).every(Number.isFinite));
});

test("pair thumbnails preserve exact native angles and reject changed shape/row bindings", async () => {
  for (const id of ["5-6", "63"]) {
    const data = await research(id);
    const svg = researchThumbnail(data);
    for (const row of data.rows) {
      assert.ok(svg.includes(`data-row-id="${row.id}"`));
      assert.ok(svg.includes(`data-native-angle="${2 * Math.PI * row.value / 100}"`));
    }
    assert.ok(svg.includes("EQUAL 100% REFERENCE RINGS"));
    const changed = structuredClone(data);
    changed.rows[0].value = 101;
    assert.throws(() => pairRingPlan(changed), /Unsupported or changed/);
  }
});
