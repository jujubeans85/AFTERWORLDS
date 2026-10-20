import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import * as RealThree from "../vendor/three.module.js";

// Load the current source directly. Only the renderer/browser ports are fake;
// geometry, materials, effects, transforms and their disposal events are real Three.
const url = path => new URL(path, import.meta.url).href;
const dataURL = source => `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
const shim = dataURL(`import * as Real from ${JSON.stringify(url("../vendor/three.module.js"))};
export * from ${JSON.stringify(url("../vendor/three.module.js"))};
export class WebGLRenderer { constructor() { return globalThis.__afterworldLegacyLifecyclePort.renderer(); } }
export class Scene extends Real.Scene { constructor() { super(); globalThis.__afterworldLegacyLifecyclePort.scenes.push(this); } }`);
const effectSource = (await fs.readFile(new URL("../src/effects.js", import.meta.url), "utf8"))
  .replace("'./vendor/three.module.js'", JSON.stringify(shim))
  .replace("'./math.js'", JSON.stringify(url("../src/math.js")))
  .replace("'./scoring.js'", JSON.stringify(url("../src/scoring.js")));
const globeSource = (await fs.readFile(new URL("../src/globe.js", import.meta.url), "utf8"))
  .replace('"./effects.js"', JSON.stringify(dataURL(effectSource)))
  .replace('"./vendor/three.module.js"', JSON.stringify(shim))
  .replace('"./math.js"', JSON.stringify(url("../src/math.js")));
const { Globe } = await import(dataURL(globeSource));

class Events {
  constructor() { this.listeners = new Map(); }
  addEventListener(type, listener) { if (!this.listeners.has(type)) this.listeners.set(type, new Set()); this.listeners.get(type).add(listener); }
  removeEventListener(type, listener) { this.listeners.get(type)?.delete(listener); }
  dispatchEvent(event) { for (const listener of this.listeners.get(event.type) || []) listener(event); }
  listenerCount() { return [...this.listeners.values()].reduce((sum, set) => sum + set.size, 0); }
}
function watchResources(scene) {
  const counts = new Map();
  scene?.traverse(object => {
    for (const resource of [object.geometry, ...(object.material ? Array.isArray(object.material) ? object.material : [object.material] : []), ...(object.isInstancedMesh ? [object] : [])]) {
      if (!resource || counts.has(resource)) continue;
      counts.set(resource, 0); resource.addEventListener("dispose", () => counts.set(resource, counts.get(resource) + 1));
    }
  });
  return counts;
}
function environment(t, { reduced = false, hidden = false, failure = null } = {}) {
  const old = new Map(), pending = new Map(), cancelled = [], scenes = [], renderers = [], observers = [], views = [];
  const document = new Events(), media = new Events(), host = new Events();
  document.hidden = hidden; media.matches = reduced;
  host.clientWidth = 480; host.clientHeight = 400; host.children = []; host.classList = { add() {} };
  host.append = canvas => { host.children.push(canvas); canvas.parent = host; };
  const makeCanvas = () => Object.assign(new Events(), { style: {}, captures: new Set(), removals: 0,
    setAttribute() {}, setPointerCapture(id) { this.captures.add(id); }, hasPointerCapture(id) { return this.captures.has(id); }, releasePointerCapture(id) { this.captures.delete(id); },
    remove() { this.removals++; if (this.parent) this.parent.children = this.parent.children.filter(child => child !== this); },
    getContext() { return { fillStyle: "", beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, fill() {}, getImageData() { return { data: new Uint8ClampedArray(1024 * 512 * 4) }; } }; },
  });
  document.createElement = () => makeCanvas();
  let nextId = 1, time = 0, failedResources;
  const port = { scenes, renderer() {
    const renderer = { domElement: makeCanvas(), rendered: 0, disposals: 0, losses: 0,
      setPixelRatio() { if (failure === "renderer-setup") throw Error("renderer setup failed"); }, setClearColor() {}, setSize() {},
      render() { this.rendered++; }, dispose() { this.disposals++; }, forceContextLoss() { this.losses++; },
    }; renderers.push(renderer); return renderer;
  } };
  const globals = {
    document, devicePixelRatio: 1, matchMedia: () => media,
    requestAnimationFrame: fn => { const id = nextId++; pending.set(id, fn); return id; },
    cancelAnimationFrame: id => { cancelled.push(id); pending.delete(id); },
    ResizeObserver: class { constructor(callback) { if (failure === "observer-setup") { failedResources = watchResources(scenes.at(-1)); throw Error("observer setup failed"); } this.callback = callback; this.disconnections = 0; observers.push(this); } observe() {} disconnect() { this.disconnections++; } },
    IntersectionObserver: class { constructor(callback) { this.callback = callback; this.disconnections = 0; observers.push(this); } observe() {} disconnect() { this.disconnections++; } },
    CustomEvent: class { constructor(type, detail) { this.type = type; Object.assign(this, detail); } },
    __afterworldLegacyLifecyclePort: port,
  };
  for (const [key, value] of Object.entries(globals)) { old.set(key, Object.getOwnPropertyDescriptor(globalThis, key)); Object.defineProperty(globalThis, key, { configurable: true, writable: true, value }); }
  t.after(() => { views.forEach(view => view.dispose()); for (const [key, descriptor] of old) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; } });
  return { document, media, host, pending, cancelled, scenes, renderers, observers, get failedResources() { return failedResources; },
    step() { time += 16; const scheduled = [...pending]; for (const [id, fn] of scheduled) { if (!pending.delete(id)) continue; fn(time); } },
    create(options = {}) { const view = new Globe(host, { countries: [], entry: { id: "lifecycle", lens: "work", newTitle: "Lifecycle fixture" }, ...options }); views.push(view); return view; },
  };
}

test("legacy Play respects reduced motion, hidden tabs and offscreen state until explicitly resumed", t => {
  const env = environment(t, { reduced: true }), states = [];
  const view = env.create({ onMotion: paused => states.push(paused) }); t.after(() => view.dispose());
  env.step(); assert.equal(env.pending.size, 0);
  view.pause(false); assert.equal(view.paused, true); env.step(); assert.equal(env.pending.size, 0);
  env.media.dispatchEvent({ type: "change", matches: false }); assert.equal(view.paused, true);
  view.pause(false); assert.equal(view.paused, false); env.step(); assert.equal(env.pending.size, 1);
  env.document.hidden = true; env.document.dispatchEvent({ type: "visibilitychange" }); assert.equal(view.paused, true); assert.equal(env.pending.size, 0);
  view.pause(false); assert.equal(view.paused, true);
  env.document.hidden = false; env.document.dispatchEvent({ type: "visibilitychange" }); env.step(); assert.equal(view.paused, true); assert.equal(env.pending.size, 0);
  view.pause(false); view.io.callback([{ isIntersecting: false }]); assert.equal(view.paused, true); assert.equal(env.pending.size, 0);
  view.pause(false); assert.equal(view.paused, true); view.io.callback([{ isIntersecting: true }]); env.step(); assert.equal(view.paused, true); assert.equal(env.pending.size, 0);
  view.pause(false); env.media.dispatchEvent({ type: "change", matches: true }); assert.equal(view.paused, true); env.step(); assert.equal(env.pending.size, 0);
  env.media.dispatchEvent({ type: "change", matches: false }); assert.equal(view.paused, true);
  view.pause(true); env.media.dispatchEvent({ type: "change", matches: false }); assert.equal(view.paused, true);
  assert.equal(states.at(-1), true);
});

test("pausing settles a fly-to and table selection focuses directly without a paused animation loop", t => {
  const env = environment(t), selected = [], view = env.create({ onSelect: (...args) => selected.push(args) }); t.after(() => view.dispose());
  view.target = { x: .6, y: -.7 }; view.pause(true);
  assert.equal(view.target, null); assert.deepEqual(view.world.rotation.toArray().slice(0, 3), [.6, -.7, 0]);
  env.step(); assert.equal(env.pending.size, 0);
  const before = view.world.rotation.toArray(); view.target = { x: 1, y: 1 }; view.dirty = true; view.frame(100);
  assert.deepEqual(view.world.rotation.toArray(), before); assert.equal(env.pending.size, 0);
  view.target = null;
  const point = { name: "Selected source row", lat: 24, lon: 60 };
  view.markers = [{ point, ring: { material: { opacity: .4 } } }]; view.select(0);
  assert.deepEqual(selected, [[point, 0]]); assert.equal(view.markers[0].ring.material.opacity, 1); assert.equal(view.target, null); assert.equal(view.paused, true);
  assert.equal(view.world.rotation.x, 24 * Math.PI / 180); assert.equal(view.world.rotation.y, -60 * Math.PI / 180);
  env.step(); assert.equal(env.pending.size, 0);
});

test("pointer and keyboard interactions render dirty paused frames without persistent RAF while held", t => {
  const env = environment(t), view = env.create(); t.after(() => view.dispose());
  view.canvas.dispatchEvent({ type: "pointerdown", pointerId: 4, clientX: 10, clientY: 10 });
  assert.equal(view.paused, true); assert.equal(view.dragging, true); env.step(); assert.equal(env.pending.size, 0);
  view.canvas.dispatchEvent({ type: "pointermove", pointerId: 4, clientX: 30, clientY: 20 }); assert.equal(env.pending.size, 1); env.step(); assert.equal(env.pending.size, 0);
  const x = view.world.rotation.x; view.canvas.dispatchEvent({ type: "keydown", key: "ArrowDown", preventDefault() {} }); assert.ok(view.world.rotation.x > x); assert.equal(view.paused, true);
  env.step(); view.wake(); assert.equal(env.pending.size, 0);
  view.pause(false); view.zoom(.2); assert.equal(view.paused, true);
  view.pause(false); view.reset(); assert.equal(view.paused, true); env.step(); assert.equal(env.pending.size, 0);
});

test("legacy disposal releases shared resources, instance allocations, capture, listeners and canvas exactly once", t => {
  const env = environment(t), view = env.create(), counts = watchResources(view.scene);
  const texture = new RealThree.Texture(); let textureDisposals = 0; texture.addEventListener("dispose", () => textureDisposals++);
  const materials = [...counts.keys()].filter(resource => resource.isMaterial);
  materials[0].map = texture; materials[1].map = texture;
  view.canvas.setPointerCapture(9); view.pointers.set(9, { x: 1, y: 1 });
  view.dispose(); view.dispose();
  assert.ok([...counts.values()].every(count => count === 1)); assert.equal(textureDisposals, 1);
  assert.equal(env.renderers[0].disposals, 1); assert.equal(env.renderers[0].losses, 1); assert.equal(view.canvas.removals, 1);
  assert.equal(view.canvas.captures.size, 0); assert.equal(view.pointers.size, 0); assert.equal(env.pending.size, 0); assert.equal(env.host.children.length, 0);
  assert.ok(env.observers.every(observer => observer.disconnections === 1)); assert.equal(view.canvas.listenerCount(), 0); assert.equal(env.document.listenerCount(), 0); assert.equal(env.media.listenerCount(), 0);
});

test("partial legacy constructor failures release early renderer and later scene allocations", async t => {
  for (const failure of ["renderer-setup", "observer-setup"]) await t.test(failure, t => {
    const env = environment(t, { failure }); assert.throws(() => env.create(), /setup failed/);
    assert.equal(env.renderers[0].disposals, 1); assert.equal(env.renderers[0].losses, 1); assert.equal(env.renderers[0].domElement.removals, 1);
    assert.equal(env.host.children.length, 0); assert.equal(env.pending.size, 0); assert.equal(env.document.listenerCount(), 0); assert.equal(env.media.listenerCount(), 0);
    if (env.failedResources) assert.ok([...env.failedResources.values()].every(count => count === 1));
  });
});

test("context loss pauses permanently until teardown and cannot schedule rendering through Play", t => {
  const env = environment(t), view = env.create(); t.after(() => view.dispose());
  let prevented = false; view.canvas.dispatchEvent({ type: "webglcontextlost", preventDefault() { prevented = true; } });
  assert.equal(prevented, true); assert.equal(view.paused, true); assert.equal(env.pending.size, 0);
  view.pause(false); view.wake(); assert.equal(view.paused, true); assert.equal(env.pending.size, 0);
});
