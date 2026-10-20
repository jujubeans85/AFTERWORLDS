import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import * as THREE from "../dist/assets/vendor/three.module.js";
import { createLanternScene, updateAmbientFrame, selectScreenTarget, ResearchGlobe } from "../dist/assets/research-view.js";

const dataset = JSON.parse(await readFile(new URL("../research/datasets/physical-cloud-grid-carbon.json", import.meta.url)));
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
