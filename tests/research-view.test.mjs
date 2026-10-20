import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import * as THREE from "../dist/assets/vendor/three.module.js";
import { createLanternScene, createAccessScene, setAccessDial, updateAmbientFrame, selectScreenTarget, ResearchGlobe } from "../dist/assets/research-view.js";
import { accessPaintPlan, accessCountryAt, accessColor } from "../src/research-geography.js";
import { researchThumbnail } from "../scripts/research-thumbnail.mjs";

const dataset = JSON.parse(await readFile(new URL("../research/datasets/physical-cloud-grid-carbon.json", import.meta.url)));
const registry = JSON.parse(await readFile(new URL("../dist/assets/registry.json", import.meta.url)));
const accessSummary = registry.entries.find(entry => entry.id === "408").research;
const accessBundle = JSON.parse(await readFile(new URL(`../dist${accessSummary.release.url}`, import.meta.url)));
const accessResearch = { ...accessBundle, rows: accessBundle.dataset.rows };
function fakeCanvas() {
  const fills = [];
  const context = {
    beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, fillRect() {},
    save() {}, restore() {}, clip() {}, stroke() {}, fill() { fills.push(this.fillStyle); },
  };
  return { width: 0, height: 0, getContext: () => context, fills };
}
function fixture() {
  return {
    dataset, design: { conceptId: "430" }, rows: dataset.rows,
    marks: dataset.rows.map((row, index) => ({ row, index, length: 0.45 * row.value / 700 })),
  };
}

test("all 44 native columns preserve the reviewed lengths, ordering and source identity", () => {
  const layer = createLanternScene(fixture());
  assert.equal(layer.columns.count, 44);
  assert.equal(layer.measured.parent, layer.ambient.parent);
  const bySlot = [...layer.markers].sort((a, b) => a.slot - b.slot);
  const names = bySlot.map(mark => mark.row.name.toLowerCase());
  assert.deepEqual(names, [...names].sort());
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3(), scale = new THREE.Vector3(), quaternion = new THREE.Quaternion();
  for (const mark of layer.markers) {
    assert.equal(mark.row.id, dataset.rows[mark.index].id);
    layer.columns.getMatrixAt(mark.slot, matrix);
    matrix.decompose(position, quaternion, scale);
    assert.ok(Math.abs(scale.y - 0.45 * mark.row.value / 700) < 1e-7);
    assert.ok(Math.abs(scale.x - 0.035) < 1e-7);
    assert.ok(Math.abs(position.length() - (1 + mark.length / 2)) < 1e-7);
  }
});

test("ambient quarter phases never alter measured geometry, material, selection or camera frame", () => {
  const layer = createLanternScene(fixture());
  const bytes = Buffer.from(layer.columns.instanceMatrix.array.buffer).toString("hex");
  const geometry = Buffer.from(layer.columns.geometry.attributes.position.array.buffer).toString("hex");
  const color = layer.columns.material.color.getHex();
  for (const seconds of [0, 15.5, 31, 46.5, 62]) {
    updateAmbientFrame(layer, seconds);
    assert.equal(Buffer.from(layer.columns.instanceMatrix.array.buffer).toString("hex"), bytes);
    assert.equal(Buffer.from(layer.columns.geometry.attributes.position.array.buffer).toString("hex"), geometry);
    assert.equal(layer.columns.material.color.getHex(), color);
    assert.deepEqual(layer.world.rotation.toArray(), [0, 0, 0, "XYZ"]);
    assert.equal(layer.ring.visible, false);
  }
});

test("bad native encodings, missing and duplicated observations fail closed", () => {
  const changed = fixture();
  changed.marks[0].length = 0.5;
  assert.throws(() => createLanternScene(changed), /Invalid native-unit/);
  const duplicate = fixture();
  duplicate.marks[1] = duplicate.marks[0];
  assert.throws(() => createLanternScene(duplicate), /unique source IDs/);
  const missing = fixture();
  missing.marks.pop();
  assert.throws(() => createLanternScene(missing), /all 44/);
});

test("zero has zero native length; a null observation gets a separate missing hatch", () => {
  const research = structuredClone(fixture());
  research.rows[0].value = 0;
  research.marks[0].row.value = 0;
  research.marks[0].length = 0;
  research.rows[1].value = null;
  research.rows[1].status = "missing";
  research.marks[1].row.value = null;
  research.marks[1].row.status = "missing";
  research.marks[1].length = null;
  const layer = createLanternScene(research);
  assert.equal(layer.markers[0].length, 0);
  assert.equal(layer.markers[1].length, null);
  assert.equal(layer.measured.children[1].type, "LineSegments");
  assert.equal(layer.measured.children[1].geometry.attributes.position.count, 6);
  assert.equal(layer.columns.count, 44);
});

test("screen targets accept a 44px diameter independently of mark size and reject hidden marks", () => {
  const targets = [
    { index: 0, x: 100, y: 100, visible: true },
    { index: 1, x: 120, y: 100, visible: false },
  ];
  assert.equal(selectScreenTarget(targets, 121.9, 100), 0);
  assert.equal(selectScreenTarget(targets, 122.1, 100), null);
  assert.equal(selectScreenTarget([...targets, { index: 2, x: 121, y: 100, visible: true }], 121, 100), 2);
});

test("selection leaves data and orientation unchanged; explicit focus and clear remain separate", () => {
  const layer = createLanternScene(fixture());
  const calls = [];
  const view = Object.assign(Object.create(ResearchGlobe.prototype), {
    layer, world: layer.world, selected: -1,
    pause() {}, wake() {}, onSelect: (...args) => calls.push(args),
  });
  view.world.rotation.set(0.2, 0.5, 0);
  const original = view.world.rotation.toArray();
  const bytes = Buffer.from(layer.columns.instanceMatrix.array.buffer).toString("hex");
  view.select(3);
  assert.deepEqual(view.world.rotation.toArray(), original);
  assert.equal(calls[0][0].id, dataset.rows[3].id);
  assert.equal(calls[0][1], 3);
  assert.equal(Buffer.from(layer.columns.instanceMatrix.array.buffer).toString("hex"), bytes);
  view.focusSelection();
  assert.equal(view.world.rotation.y, -layer.markers[3].angle);
  view.clearSelection();
  assert.deepEqual(calls.at(-1), [null, -1]);
  assert.equal(layer.ring.visible, false);
});

test("Play cannot override reduced motion, a hidden tab or an offscreen canvas", () => {
  const oldDocument = globalThis.document;
  globalThis.document = { hidden: false };
  try {
    const states = [];
    const view = Object.assign(Object.create(ResearchGlobe.prototype), {
      reduced: false, visible: true, raf: 0, wake() {},
      onMotion: paused => states.push(paused),
    });
    view.pause(false);
    assert.equal(view.paused, false);
    view.reduced = true;
    view.pause(false);
    assert.equal(view.paused, true);
    view.reduced = false;
    document.hidden = true;
    view.pause(false);
    assert.equal(view.paused, true);
    document.hidden = false;
    view.visible = false;
    view.pause(false);
    assert.equal(view.paused, true);
    assert.deepEqual(states, [false, true, true, true]);
  } finally {
    if (oldDocument === undefined) delete globalThis.document;
    else globalThis.document = oldDocument;
  }
});

test("408 uses only audited country joins, separates missing/table-only, and preserves the dateline", () => {
  const plan = accessPaintPlan(accessResearch);
  assert.deepEqual(plan.coverage, { total: 217, mapped: 167, tableOnly: 50 });
  assert.equal(plan.background.length, 177);
  assert.equal(accessCountryAt(plan, 2, 46)?.row.geographicId, "FRA");
  assert.equal(accessCountryAt(plan, 20, 0)?.row.geographicId, "COD");
  assert.equal(accessCountryAt(plan, -140, -16.4), null);
  assert.equal(accessCountryAt(plan, -30, -16.4), null);
  assert.equal(plan.countries.some(country => country.rowId === "electricity-XKX"), false);
  assert.equal(plan.countries.some(country => country.rowId === "electricity-CYP"), false);
  assert.equal(accessColor(0), "hsl(174 50% 12%)");
  assert.equal(accessColor(100), "hsl(174 50% 74%)");
  assert.notEqual(accessColor(null), accessColor(0));
  for (const country of plan.countries) assert.equal(country.fill, accessColor(country.row.value));
});

test("408 surface and selected native dial stay byte-identical through all ambient phases", () => {
  const canvas = fakeCanvas();
  const layer = createAccessScene(accessResearch, { createCanvas: () => canvas });
  const positions = Buffer.from(layer.surface.geometry.attributes.position.array.buffer).toString("hex");
  const textureVersion = layer.texture.version;
  setAccessDial(layer, 25);
  const arc = Buffer.from(layer.dial.arc.geometry.attributes.position.array.buffer).toString("hex");
  assert.equal(layer.dial.angle, Math.PI / 2);
  assert.equal(layer.surface.material.type, "MeshBasicMaterial");
  assert.equal(layer.measured.parent, layer.ambient.parent);
  assert.equal(layer.markers.length, 217);
  assert.equal(layer.markers.filter(mark => mark.country).length, 167);
  for (const time of [0, 15, 30, 45, 60]) {
    updateAmbientFrame(layer, time);
    assert.equal(Buffer.from(layer.surface.geometry.attributes.position.array.buffer).toString("hex"), positions);
    assert.equal(layer.texture.version, textureVersion);
    assert.equal(Buffer.from(layer.dial.arc.geometry.attributes.position.array.buffer).toString("hex"), arc);
    assert.equal(layer.dial.angle, Math.PI / 2);
  }
  assert.ok(canvas.fills.includes(accessColor(100)));
  setAccessDial(layer, 0);
  assert.equal(layer.dial.arc.visible, false);
  assert.equal(layer.dial.missing.visible, false);
  setAccessDial(layer, null);
  assert.equal(layer.dial.arc.visible, false);
  assert.equal(layer.dial.missing.visible, true);
  setAccessDial(layer, 100);
  assert.equal(layer.dial.angle, Math.PI * 2);
  assert.equal(layer.dial.arc.visible, true);
});

test("408 table-only selection retains exact row and dial without inventing a focus location", () => {
  const layer = createAccessScene(accessResearch, { createCanvas: fakeCanvas });
  const calls = [];
  const view = Object.assign(Object.create(ResearchGlobe.prototype), {
    layer, world: layer.world, geographic: true, selected: -1,
    pause() {}, wake() {}, onSelect: (...args) => calls.push(args),
  });
  const index = accessResearch.rows.findIndex(row => row.id === "electricity-XKX");
  view.world.rotation.set(0.2, 0.5, 0);
  const before = view.world.rotation.toArray();
  view.select(index, true);
  assert.equal(view.canFocus(index), false);
  assert.equal(calls[0][0].id, "electricity-XKX");
  assert.deepEqual(view.world.rotation.toArray(), before);
  assert.equal(layer.dial.missing.visible, true);
});

test("native map thumbnail carries every joined row and explicitly declares coverage", () => {
  const svg = researchThumbnail(accessBundle);
  assert.equal((svg.match(/data-row-id=/g) || []).length, 167);
  assert.ok(svg.includes("167 MAPPED · 50 TABLE-ONLY ECONOMIES"));
  assert.ok(!svg.includes('data-row-id="electricity-XKX"'));
  assert.ok(svg.includes(accessColor(100)));
  assert.equal(svg, researchThumbnail(accessBundle));
});

test("camera snapshots restore viewpoint and bounded zoom without restoring ambient autoplay", () => {
  let paused = false;
  const view = Object.assign(Object.create(ResearchGlobe.prototype), {
    world: new THREE.Group(), camera: new THREE.PerspectiveCamera(), baseDistance: 4,
    pause(value) { paused = value; }, wake() {},
  });
  view.world.rotation.set(0.25, -0.8, 0);
  view.camera.position.z = 5;
  const state = view.snapshotCamera();
  view.world.rotation.set(0, 0, 0);
  view.camera.position.z = 4;
  assert.equal(view.restoreCamera(state), true);
  assert.deepEqual(view.world.rotation.toArray().slice(0, 3), state.rotation);
  assert.equal(view.camera.position.z, 5);
  assert.equal(paused, true);
  assert.equal(view.restoreCamera({ rotation: [0, NaN, 0], zoomRatio: 1 }), false);
});
