import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import * as THREE from '../dist/assets/vendor/three.module.js';
import { createAccessScene, ResearchGlobe } from '../dist/assets/research-view.js';
import { prepareElectricityGeography } from '../scripts/research-geography.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const dataset = JSON.parse(await fs.readFile(new URL('../research/datasets/society-electricity-access.json', import.meta.url), 'utf8'));
const geography = await prepareElectricityGeography(root, dataset);
const research = { design: { conceptId: '408' }, dataset, rows: dataset.rows, geography };
function canvasPort() {
  const context = Object.fromEntries([
    'fillRect', 'beginPath', 'moveTo', 'lineTo', 'closePath', 'fill',
    'save', 'clip', 'stroke', 'restore',
  ].map(name => [name, () => {}]));
  return { width: 0, height: 0, getContext: kind => kind === '2d' ? context : null };
}
const scene = () => createAccessScene(research, { createCanvas: canvasPort });

test('sphere texture longitudes agree with geographic picking directions, including latitude', () => {
  const layer = scene();
  layer.world.updateMatrixWorld(true);
  const ray = new THREE.Raycaster();
  // Independent Cartesian directions: Greenwich faces +z, east +x, west -x.
  // Texture x maps (longitude +180)/360; flipped image y puts north at its top.
  for (const [label, point, u, v] of [
    ['Greenwich equator', [0, 0, 3], 0.5, 0.5],
    ['90 east equator', [3, 0, 0], 0.75, 0.5],
    ['90 west equator', [-3, 0, 0], 0.25, 0.5],
    ['30 north Greenwich', [0, 1.5, 3 * Math.sqrt(3) / 2], 0.5, 2 / 3],
    ['30 south Greenwich', [0, -1.5, 3 * Math.sqrt(3) / 2], 0.5, 1 / 3],
  ]) {
    const origin = new THREE.Vector3(...point);
    ray.set(origin, origin.clone().normalize().negate());
    const hit = ray.intersectObject(layer.surface)[0];
    assert.ok(hit, label);
    assert.ok(Math.abs(hit.uv.x - u) < 1e-6, `${label}: longitude is mirrored or rotated`);
    assert.ok(Math.abs(hit.uv.y - v) < 1e-6, `${label}: latitude is inverted`);
  }
  assert.equal(layer.texture.flipY, true);
});

test('access scene disposal releases its texture, geometries, materials and callbacks once', () => {
  const layer = scene();
  const parentScene = new THREE.Scene();
  parentScene.add(layer.world);
  const geometryCounts = new Map(), materialCounts = new Map();
  parentScene.traverse(object => {
    if (object.geometry && !geometryCounts.has(object.geometry)) {
      geometryCounts.set(object.geometry, 0);
      object.geometry.addEventListener('dispose', () =>
        geometryCounts.set(object.geometry, geometryCounts.get(object.geometry) + 1));
    }
    if (object.material && !materialCounts.has(object.material)) {
      materialCounts.set(object.material, 0);
      object.material.addEventListener('dispose', () =>
        materialCounts.set(object.material, materialCounts.get(object.material) + 1));
    }
  });
  let textures = 0, renderers = 0, contextLosses = 0, observers = 0, listeners = 0, removals = 0;
  layer.texture.addEventListener('dispose', () => { textures++; });
  const view = Object.assign(Object.create(ResearchGlobe.prototype), {
    layer, scene: parentScene, pointers: new Map([[1, {}]]), cleanup: [() => { listeners++; }],
    observer: { disconnect() { observers++; } }, io: { disconnect() { observers++; } },
    renderer: { dispose() { renderers++; }, forceContextLoss() { contextLosses++; } },
    canvas: { remove() { removals++; } }, raf: 41,
  });
  const previousCancel = globalThis.cancelAnimationFrame;
  const cancelled = [];
  globalThis.cancelAnimationFrame = id => cancelled.push(id);
  try {
    view.dispose();
    view.dispose();
  } finally {
    if (previousCancel === undefined) delete globalThis.cancelAnimationFrame;
    else globalThis.cancelAnimationFrame = previousCancel;
  }
  assert.equal(textures, 1);
  assert.ok([...geometryCounts.values()].every(count => count === 1));
  assert.ok([...materialCounts.values()].every(count => count === 1));
  assert.equal(renderers, 1);
  assert.equal(contextLosses, 1);
  assert.equal(observers, 2);
  assert.equal(listeners, 1);
  assert.equal(removals, 1);
  assert.equal(view.pointers.size, 0);
  assert.deepEqual(cancelled, [41]);
});
