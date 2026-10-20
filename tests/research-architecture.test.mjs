import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { architectureInstrumentPlan, ARCHITECTURE_CONCEPTS } from "../src/research-architecture.js";
import { createArchitectureScene } from "../dist/assets/research-architecture-scene.js";

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
test("architectural plans preserve distinct gate, spine, ribbon and log-position formulas", async () => {
  for (const id of ARCHITECTURE_CONCEPTS) {
    const plan = architectureInstrumentPlan(await research(id));
    for (const item of plan.items) {
      if (id === "117") {
        assert.equal(item.extent, null);
        assert.equal(item.offset, 0.45 * (Math.log10(item.row.value) - 25) / 2);
      } else assert.equal(item.extent, (id === "284" ? 0.5 : 1) * item.row.value / plan.domain[1]);
    }
  }
  const oil = architectureInstrumentPlan(await research("428"));
  assert.equal(oil.items.find(item => item.row.id === "panama").pattern, "fiscal-diagonal");
});
test("alphabetic market slots and source applicant ranks preserve original row indexing", async () => {
  const data = await research("407"), plan = architectureInstrumentPlan(data);
  const names = plan.items.map(item => item.row.name.toLowerCase());
  assert.deepEqual(names, names.slice().sort());
  const layer = createArchitectureScene(data, { createCanvas: canvas });
  assert.deepEqual(layer.markers.map(marker => marker.row.id), data.rows.map(row => row.id));
  const books = architectureInstrumentPlan(await research("284"));
  assert.deepEqual(books.items.map(item => item.row.rank), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
});
test("log training estimates use equal fixed-size markers at exact radial offsets with confidence categories", async () => {
  const layer = createArchitectureScene(await research("117"), { createCanvas: canvas });
  assert.equal(new Set(layer.dataObjects.map(object => object.geometry.parameters.radius)).size, 1);
  layer.dataObjects.forEach((object, index) => {
    assert.equal(object.position.z, layer.plan.items[index].offset);
    assert.deepEqual(object.scale.toArray(), [1, 1, 1]);
    assert.ok(1 + object.position.z - object.geometry.parameters.radius > layer.shell.children[0].geometry.parameters.radius,
      "the neutral shell must not clip low-value fixed-size source markers");
  });
  assert.deepEqual(new Set(layer.plan.items.map(item => item.pattern)), new Set(["Confident", "Likely", "Speculative"]));
});
test("shared label atlas clips every source cell and fits measured text within its cell", async () => {
  const calls = [], clips = [], stack = [];
  let clip = null, pending = null;
  const context = {
    font: "20px sans-serif", clearRect() {}, beginPath() {},
    save() { stack.push(clip); }, restore() { clip = stack.pop(); },
    rect(x, y, width, height) { pending = { x, y, width, height }; },
    clip() { clip = pending; clips.push(clip); },
    measureText(text) { return { width: [...text].reduce((sum, char) => sum + (char === "W" ? 0.95 : 0.62) * parseFloat(this.font), 0) }; },
    fillText(text, x, y) { calls.push({ text, x, y, clip, width: this.measureText(text).width, size: parseFloat(this.font) }); },
  };
  createArchitectureScene(await research("407"), { createCanvas: () => ({ getContext: () => context }) });
  assert.equal(clips.length, 32);
  for (const call of calls) {
    assert.ok(call.clip, call.text);
    assert.ok(call.x - call.width / 2 >= call.clip.x, call.text);
    assert.ok(call.x + call.width / 2 <= call.clip.x + call.clip.width, call.text);
    assert.ok(call.y <= call.clip.y + call.clip.height && call.y - call.size >= call.clip.y, call.text);
  }
});
test("five architectural scenes keep all source geometry and atlas labels invariant during decorative loops", async () => {
  for (const id of ARCHITECTURE_CONCEPTS) {
    const data = await research(id), layer = createArchitectureScene(data, { createCanvas: canvas });
    assert.equal(layer.markers.length, data.rows.length);
    assert.ok(layer.ambient.children.length <= 2);
    const before = snapshot(layer);
    for (const phase of [0, 0.25, 0.5, 0.75, 1]) {
      layer.animateAmbient(layer.period * phase);
      assert.equal(snapshot(layer), before, id);
    }
  }
});
