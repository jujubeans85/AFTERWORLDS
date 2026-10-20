import * as THREE from "./vendor/three.module.js";
import { clamp, fitDistance } from "./math.js";
import { accessPaintPlan, accessCountryAt, paintAccessTexture } from "./research-geography.js";
import { PAIR_CONCEPTS, pairRingPlan } from "./research-pairs.js";
import { INTERVAL_CONCEPTS } from "./research-intervals.js";
import { createInstrumentScene } from "./research-instrument-scene.js";
import { RAIL_CONCEPTS } from "./research-rails.js";
import { createRailScene } from "./research-rail-scene.js";
import { COUNT_CONCEPTS } from "./research-counts.js";
import { createCountScene } from "./research-count-scene.js";
import { CATEGORY_CONCEPTS } from "./research-categories.js";
import { createCategoryScene } from "./research-category-scene.js";
import { PERCENTAGE_CONCEPTS } from "./research-percentages.js";
import { createPercentageScene } from "./research-percentage-scene.js";
import { COMPARISON_CONCEPTS } from "./research-comparisons.js";
import { createComparisonScene } from "./research-comparison-scene.js";
import { ARCHITECTURE_CONCEPTS } from "./research-architecture.js";
import { createArchitectureScene } from "./research-architecture-scene.js";

const TAU = Math.PI * 2;
const RADIUS = 1;
const FRAME_RADIUS = 1.55;
const COLUMN_WIDTH = 0.035;
const compareText = (a, b) => a < b ? -1 : a > b ? 1 : 0;

/** Exact native-unit geometry; returned data marks are never animated. */
export function createLanternScene(research) {
  if (String(research.design?.conceptId) !== "430")
    throw Error("This renderer supports accepted concept 430 only.");
  if (research.rows.length !== 44 || research.marks.length !== 44)
    throw Error("The lantern requires all 44 accepted observations.");
  const rows = research.rows;
  const ordered = research.marks.map((mark, index) => {
    const rowIndex = rows.findIndex(row => row.id === mark.row.id);
    const missing = mark.row.value === null && mark.length === null && mark.row.status === "missing";
    if (rowIndex < 0 || (!missing && (!Number.isFinite(mark.row.value) || !Number.isFinite(mark.length) ||
      mark.row.value < 0 || mark.row.value > 700 ||
      Math.abs(mark.length - 0.45 * mark.row.value / 700) > 1e-12)))
      throw Error(`Invalid native-unit lantern mark ${index}.`);
    return { ...mark, index: rowIndex };
  }).sort((a, b) =>
    compareText(a.row.name.toLowerCase(), b.row.name.toLowerCase()) ||
    compareText(a.row.id, b.row.id));
  if (new Set(ordered.map(mark => mark.row.id)).size !== 44)
    throw Error("Lantern observations must have unique source IDs.");

  const world = new THREE.Group();
  const measured = new THREE.Group();
  measured.name = "measured-native-unit-columns";
  const ambient = new THREE.Group();
  ambient.name = "ambient-frame-not-measured-change";
  const shell = new THREE.Group();
  shell.name = "neutral-abstract-shell";
  const selection = new THREE.Group();
  selection.name = "selection-decoration";
  world.add(measured, ambient, shell, selection);
  shell.add(new THREE.Mesh(
    new THREE.SphereGeometry(RADIUS, 32, 24),
    new THREE.MeshStandardMaterial({ color: 0x101a22, roughness: 0.9, metalness: 0 }),
  ));
  const columns = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ color: 0xf2ba68 }),
    ordered.length,
  );
  const transform = new THREE.Object3D();
  const markers = new Array(rows.length);
  const up = new THREE.Vector3(0, 1, 0);
  const missingHatches = [];
  ordered.forEach((mark, slot) => {
    const angle = slot * TAU / ordered.length;
    const normal = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));
    // Null has no quantitative column. A separate static hatch distinguishes it from zero.
    const length = mark.length ?? 0;
    transform.position.copy(normal).multiplyScalar(RADIUS + length / 2);
    transform.quaternion.setFromUnitVectors(up, normal);
    transform.scale.set(COLUMN_WIDTH, length, COLUMN_WIDTH);
    transform.updateMatrix();
    columns.setMatrixAt(slot, transform.matrix);
    markers[mark.index] = {
      row: mark.row, index: mark.index, slot, angle, length: mark.length,
      normal,
      center: normal.clone().multiplyScalar(RADIUS + length / 2),
      base: normal.clone().multiplyScalar(RADIUS + 0.007),
    };
    if (mark.length === null) {
      const tangent = new THREE.Vector3(Math.cos(angle), 0, -Math.sin(angle));
      const base = normal.clone().multiplyScalar(RADIUS + 0.008);
      for (const offset of [-0.016, 0, 0.016]) {
        missingHatches.push(base.clone().addScaledVector(tangent, offset - 0.01).addScaledVector(up, -0.02),
          base.clone().addScaledVector(tangent, offset + 0.01).addScaledVector(up, 0.02));
      }
    }
  });
  columns.instanceMatrix.needsUpdate = true;
  measured.add(columns);
  if (missingHatches.length) measured.add(new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(missingHatches),
    new THREE.LineBasicMaterial({ color: 0x66717e }),
  ));

  const hoopPoints = Array.from({ length: 129 }, (_, i) =>
    new THREE.Vector3(Math.cos(i * TAU / 128) * FRAME_RADIUS,
      Math.sin(i * TAU / 128) * FRAME_RADIUS, 0));
  ambient.add(new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(hoopPoints),
    new THREE.LineBasicMaterial({
      color: 0xb5c3d0, transparent: true, opacity: 0.26, depthWrite: false,
    }),
  ));
  const ring = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(Array.from({ length: 32 }, (_, i) =>
      new THREE.Vector3(Math.cos(i * TAU / 32) * 0.055,
        Math.sin(i * TAU / 32) * 0.055, 0))),
    new THREE.LineBasicMaterial({ color: 0xffffff }),
  );
  ring.visible = false;
  selection.add(ring);
  const layer = { world, measured, ambient, shell, selection, columns, markers, ring };
  updateAmbientFrame(layer, 0);
  return layer;
}

export function setAccessDial(layer, value) {
  const dial = layer.dial;
  if (!dial) return;
  if (value !== null && (!Number.isFinite(value) || value < 0 || value > 100))
    throw Error("Invalid native percentage for the selected-country dial.");
  const angle = value === null ? null : TAU * value / 100;
  const count = angle === null || angle === 0 ? 0 : Math.max(1, Math.ceil(96 * value / 100));
  dial.arc.geometry.dispose();
  dial.arc.geometry = count
    ? new THREE.RingGeometry(0.173, 0.187, Math.max(3, count), 1, Math.PI / 2 - angle, angle)
    : new THREE.BufferGeometry();
  dial.arc.visible = count > 0;
  dial.missing.visible = value === null;
  dial.group.visible = true;
  dial.angle = angle;
}

/** Audited geographic polygons are rasterized once; motion cannot alter this texture. */
export function createAccessScene(research, { createCanvas = () => document.createElement("canvas") } = {}) {
  const plan = accessPaintPlan(research);
  const canvas = createCanvas();
  canvas.width = 2048;
  canvas.height = 1024;
  paintAccessTexture(canvas, plan);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  const world = new THREE.Group(), measured = new THREE.Group(), ambient = new THREE.Group();
  const shell = new THREE.Group(), selection = new THREE.Group();
  measured.name = "measured-country-access-surface";
  ambient.name = "ambient-frame-not-measured-change";
  world.add(measured, ambient, shell, selection);
  const surface = new THREE.Mesh(
    new THREE.SphereGeometry(1, 64, 48),
    new THREE.MeshBasicMaterial({ map: texture }),
  );
  // SphereGeometry's seam convention differs from xyz(lon,lat); align Greenwich to +z.
  surface.rotation.y = -Math.PI / 2;
  measured.add(surface);
  ambient.add(new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(Array.from({ length: 129 }, (_, index) =>
      new THREE.Vector3(Math.cos(index * TAU / 128) * 1.16, Math.sin(index * TAU / 128) * 1.16, 0))),
    new THREE.LineBasicMaterial({ color: 0xb5c3d0, opacity: 0.26, transparent: true, depthWrite: false }),
  ));
  const byRow = new Map(plan.countries.map(country => [country.rowId, country]));
  const markers = research.rows.map((row, index) => ({
    row, index, country: byRow.get(row.id) || null,
  }));
  const dialGroup = new THREE.Group();
  dialGroup.name = "selected-native-percentage-dial";
  dialGroup.visible = false;
  const dialMaterial = color => new THREE.LineBasicMaterial({ color, depthTest: false, depthWrite: false });
  const reference = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(Array.from({ length: 96 }, (_, i) =>
      new THREE.Vector3(Math.sin(i * TAU / 96) * 0.18, Math.cos(i * TAU / 96) * 0.18, 0))),
    dialMaterial(0x536872),
  );
  const arc = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({
    color: 0x9eddd7, side: THREE.DoubleSide, depthTest: false, depthWrite: false,
  }));
  const missing = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-0.08, -0.08, 0), new THREE.Vector3(0.08, 0.08, 0),
      new THREE.Vector3(-0.08, 0.08, 0), new THREE.Vector3(0.08, -0.08, 0),
    ]), dialMaterial(0xb5c3d0),
  );
  const ticks = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(Array.from({ length: 4 }, (_, i) => {
      const angle = i * TAU / 4;
      return [new THREE.Vector3(Math.sin(angle) * 0.20, Math.cos(angle) * 0.20, 0),
        new THREE.Vector3(Math.sin(angle) * 0.22, Math.cos(angle) * 0.22, 0)];
    }).flat()), dialMaterial(0xb5c3d0),
  );
  dialGroup.add(reference, ticks, arc, missing);
  dialGroup.traverse(object => { object.renderOrder = 100; });
  selection.add(dialGroup);
  const layer = {
    world, measured, ambient, shell, selection, surface, texture, plan, markers,
    period: 60, frameRadius: 1.16,
    dial: { group: dialGroup, reference, arc, missing, angle: null },
  };
  updateAmbientFrame(layer, 0);
  return layer;
}

export function createPairScene(research, { createCanvas = () => document.createElement("canvas") } = {}) {
  const plan = pairRingPlan(research);
  const world = new THREE.Group(), measured = new THREE.Group(), ambient = new THREE.Group();
  const shell = new THREE.Group(), selection = new THREE.Group();
  measured.name = "measured-native-percentage-duet";
  ambient.name = "ambient-reference-notches-not-measured-change";
  world.add(measured, ambient, shell, selection);
  const textures = [], markers = [], notches = [];
  for (const item of plan.rings) {
    const reference = new THREE.Mesh(
      new THREE.RingGeometry(plan.radius - 0.012, plan.radius + 0.012, 96),
      new THREE.MeshBasicMaterial({ color: 0x344b55, side: THREE.DoubleSide }),
    );
    reference.position.set(...item.center);
    shell.add(reference);
    const arc = new THREE.Mesh(
      new THREE.RingGeometry(plan.radius - 0.018, plan.radius + 0.018,
        Math.max(3, Math.ceil(item.row.value / 100 * 128)), 1, Math.PI / 2 - item.angle, item.angle),
      new THREE.MeshBasicMaterial({ color: item.color, side: THREE.DoubleSide }),
    );
    arc.visible = item.row.value > 0;
    arc.position.set(...item.center);
    arc.position.z += 0.001;
    arc.userData = { rowId: item.row.id, nativeAngle: item.angle };
    arc.renderOrder = item.foreground ? 1 : 0;
    measured.add(arc);
    const canvas = createCanvas();
    canvas.width = 512; canvas.height = 128;
    const context = canvas.getContext("2d");
    if (!context) throw Error("Pair-ring labels require a 2D canvas.");
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.textAlign = "center"; context.fillStyle = "#edf4fa";
    context.font = "30px sans-serif";
    context.fillText(item.label, 256, 43);
    context.font = "26px monospace";
    context.fillStyle = "#b5c3d0";
    context.fillText(`${item.row.value}% · of 100%`, 256, 85);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    textures.push(texture);
    const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthWrite: false }));
    label.scale.set(1.05, 0.2625, 1);
    label.position.set(item.center[0], -0.62, item.center[2]);
    measured.add(label);
    const notch = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, -0.018, 0), new THREE.Vector3(0, 0.018, 0),
      ]),
      new THREE.LineBasicMaterial({ color: 0xb5c3d0, opacity: 0.26, transparent: true }),
    );
    ambient.add(notch);
    notches.push({ notch, center: item.center });
    markers.push({
      row: item.row, index: item.index, center: new THREE.Vector3(...item.center),
      base: new THREE.Vector3(...item.center), normal: new THREE.Vector3(0, 0, 1),
      focusRotation: [0, 0, 0], arc,
    });
  }
  const ring = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(Array.from({ length: 96 }, (_, index) =>
      new THREE.Vector3(Math.sin(index * TAU / 96) * 0.51, Math.cos(index * TAU / 96) * 0.51, 0))),
    new THREE.LineBasicMaterial({ color: 0xffffff }),
  );
  ring.visible = false;
  selection.add(ring);
  const layer = {
    world, measured, ambient, shell, selection, markers, ring, textures, plan,
    period: plan.period, frameRadius: 1.16,
    animateAmbient(time) {
      const angle = TAU * (time % plan.period) / plan.period;
      for (const { notch, center } of notches) {
        notch.position.set(center[0] + Math.sin(angle) * 0.49,
          center[1] + Math.cos(angle) * 0.49, center[2] - 0.005);
        notch.rotation.z = -angle;
      }
    },
  };
  updateAmbientFrame(layer, 0);
  return layer;
}

/** This is the only time-dependent operation, and touches only the neutral hoop. */
export function updateAmbientFrame(layer, elapsedSeconds) {
  if (layer.animateAmbient) { layer.animateAmbient(elapsedSeconds); return; }
  const period = layer.period || 62;
  layer.ambient.rotation.set(0.35, TAU * (elapsedSeconds % period) / period, 0);
}

/** Independent 44px screen targets; geometry is never enlarged for touch. */
export function selectScreenTarget(targets, x, y, radius = 22) {
  let selected = null;
  let distance = Infinity;
  for (const target of targets) {
    if (!target.visible) continue;
    const candidate = Math.hypot(target.x - x, target.y - y);
    if (candidate <= radius && candidate < distance) {
      selected = target.index;
      distance = candidate;
    }
  }
  return selected;
}

export class ResearchGlobe {
  constructor(host, { entry, research, onSelect = () => {}, onMotion = () => {} }) {
    this.host = host;
    this.research = research;
    this.onSelect = onSelect;
    this.onMotion = onMotion;
    this.cleanup = [];
    this.pointers = new Map();
    this.visible = true;
    this.disposed = false;
    this.selected = -1;
    this.readMode = false;
    this.elapsed = 0;
    this.last = 0;
    this.lastDraw = 0;
    this.dirty = true;
    this.media = matchMedia("(prefers-reduced-motion: reduce)");
    this.reduced = this.media.matches;
    this.paused = this.reduced || document.hidden;
    this.geographic = String(research.design.conceptId) === "408";
    this.paired = PAIR_CONCEPTS.includes(String(research.design.conceptId));
    this.railInstrument = RAIL_CONCEPTS.includes(String(research.design.conceptId));
    this.countInstrument = COUNT_CONCEPTS.includes(String(research.design.conceptId));
    this.categoryInstrument = CATEGORY_CONCEPTS.includes(String(research.design.conceptId));
    this.percentageInstrument = PERCENTAGE_CONCEPTS.includes(String(research.design.conceptId));
    this.architectureInstrument = ARCHITECTURE_CONCEPTS.includes(String(research.design.conceptId));
    this.comparisonInstrument = COMPARISON_CONCEPTS.includes(String(research.design.conceptId));
    this.instrument = this.comparisonInstrument || this.architectureInstrument || this.percentageInstrument || this.categoryInstrument || this.countInstrument || this.railInstrument || INTERVAL_CONCEPTS.includes(String(research.design.conceptId));
    this.layer = this.geographic ? createAccessScene(research) :
      this.paired ? createPairScene(research) :
        this.comparisonInstrument ? createComparisonScene(research) :
        this.architectureInstrument ? createArchitectureScene(research) :
        this.percentageInstrument ? createPercentageScene(research) :
        this.categoryInstrument ? createCategoryScene(research) :
        this.countInstrument ? createCountScene(research) :
        this.railInstrument ? createRailScene(research) :
          this.instrument ? createInstrumentScene(research) : createLanternScene(research);
    this.metrics = this.layer.metrics || [];
    this.metric = this.metrics[0] || null;
    this.hasDetailInset = Boolean(this.layer.setDetailInset);
    this.detailInset = false;
    this.timeBasis = this.layer.setTimeBasis ? "paid and unpaid hours" : null;
    this.hasReverseEvidence = Boolean(this.layer.setReverseEvidence);
    this.reverseEvidence = false;
    try {
    this.world = this.layer.world;
    this.world.rotation.x = this.paired || this.instrument ? 0 : this.geographic ? 0.16 : 0.52;
    if (this.layer.initialRotation) this.world.rotation.set(...this.layer.initialRotation);
    this.scene = new THREE.Scene();
    this.scene.add(this.world);
    this.scene.add(new THREE.HemisphereLight(0xc9dce6, 0x131c25, 1.5));
    const key = new THREE.DirectionalLight(0xe0f0f5, 1.5);
    key.position.set(-3, 3, 4);
    this.scene.add(key);
    this.camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    if (this.layer.hud) this.camera.add(this.layer.hud);
    if (this.layer.hud) this.scene.add(this.camera);
    if (this.layer.dial) {
      this.camera.add(this.layer.dial.group);
      this.scene.add(this.camera);
    }
    this.renderer = new THREE.WebGLRenderer({
      alpha: true, antialias: true, powerPreference: "low-power",
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.canvas = this.renderer.domElement;
    this.canvas.className = "globe-canvas";
    this.canvas.tabIndex = 0;
    this.canvas.setAttribute("role", "img");
    this.canvas.setAttribute("aria-label",
      `${entry.newTitle}. ${this.geographic
        ? "Country basic electricity access in 2024. Unsupported economies remain in the table."
        : this.paired ? "Two equal native percentage reference rings, not a geographic map."
          : this.instrument ? "A native-unit evidence instrument. Source intervals and qualifiers are preserved; positions are not geographic."
          : "Abstract annual region comparison, not a geographic map."} ` +
      "Arrow keys rotate; plus and minus zoom; Space pauses motion; Escape clears selection. " +
      "All observations are available in the evidence table.");
    this.setReadMode(false);
    host.append(this.canvas);
    this.bind();
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(host);
    this.io = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      if (!this.visible) this.pause(true);
      else { this.last = 0; this.dirty = true; this.wake(); }
    });
    this.io.observe(host);
    this.listen(document, "visibilitychange", () => {
      if (document.hidden) this.pause(true);
      else { this.last = 0; this.dirty = true; this.wake(); }
    });
    this.listen(this.media, "change", event => {
      this.reduced = event.matches;
      this.pause(true);
      if (this.reduced) {
        this.elapsed = 0;
        updateAmbientFrame(this.layer, 0);
      }
    });
    this.listen(this.canvas, "webglcontextlost", event => {
      event.preventDefault();
      this.pause(true);
      host.dispatchEvent(new CustomEvent("globe-error", {
        detail: "The 3D view lost its graphics context. Every observation remains available in the evidence table.",
      }));
    });
    this.resize();
    this.onMotion(this.paused);
    } catch (error) {
      this.dispose();
      throw error;
    }
  }

  listen(target, type, listener, options) {
    target.addEventListener(type, listener, options);
    this.cleanup.push(() => target.removeEventListener(type, listener, options));
  }

  bind() {
    this.listen(this.canvas, "pointerdown", event => {
      this.pause(true);
      this.pointers.set(event.pointerId, {
        x: event.clientX, y: event.clientY, startX: event.clientX,
        startY: event.clientY, moved: false, captured: false,
      });
      if (this.pointers.size > 1)
        this.pointers.forEach(pointer => { pointer.moved = true; });
    });
    this.listen(this.canvas, "pointermove", event => {
      const pointer = this.pointers.get(event.pointerId);
      if (!pointer || this.readMode) return;
      const dx = event.clientX - pointer.x;
      const dy = event.clientY - pointer.y;
      const crossedThreshold = Math.hypot(event.clientX - pointer.startX,
        event.clientY - pointer.startY) >= 8;
      if (!pointer.captured && crossedThreshold) {
        this.canvas.setPointerCapture(event.pointerId);
        pointer.captured = true;
        pointer.moved = true;
      }
      if (pointer.captured) {
        const other = [...this.pointers.entries()].find(([id]) => id !== event.pointerId)?.[1];
        if (other) {
          const before = Math.hypot(pointer.x - other.x, pointer.y - other.y);
          const after = Math.hypot(event.clientX - other.x, event.clientY - other.y);
          this.zoom((before - after) * 0.008);
        } else this.rotate(dy * 0.006, dx * 0.006);
      }
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    });
    const end = event => {
      const pointer = this.pointers.get(event.pointerId);
      if (!pointer) return;
      const moved = pointer.moved || Math.hypot(event.clientX - pointer.startX,
        event.clientY - pointer.startY) >= 8;
      this.pointers.delete(event.pointerId);
      if (this.canvas.hasPointerCapture?.(event.pointerId))
        this.canvas.releasePointerCapture(event.pointerId);
      if (!moved && event.type === "pointerup") this.pick(event);
    };
    // Window listeners also finish a click that leaves the canvas before capture.
    this.listen(window, "pointerup", end);
    this.listen(window, "pointercancel", end);
    this.listen(this.canvas, "lostpointercapture", event => {
      this.pointers.delete(event.pointerId);
    });
    this.listen(this.canvas, "wheel", event => {
      if (this.readMode || document.activeElement !== this.canvas) return;
      event.preventDefault();
      this.zoom(event.deltaY * 0.002);
    }, { passive: false });
    this.listen(this.canvas, "keydown", event => {
      const moves = {
        ArrowLeft: [0, -0.16], ArrowRight: [0, 0.16],
        ArrowUp: [-0.16, 0], ArrowDown: [0.16, 0],
      };
      if (moves[event.key]) { event.preventDefault(); this.rotate(...moves[event.key]); }
      else if (event.code === "Space") { event.preventDefault(); this.pause(!this.paused); }
      else if (["+", "="].includes(event.key)) { event.preventDefault(); this.zoom(-0.2); }
      else if (event.key === "-") { event.preventDefault(); this.zoom(0.2); }
      else if (event.key === "Home") { event.preventDefault(); this.reset(); }
      else if (event.key === "Escape") { event.preventDefault(); this.clearSelection(); }
      else this.pause(true);
    });
  }

  setReadMode(readMode) {
    this.readMode = Boolean(readMode);
    if (this.canvas) {
      this.canvas.style.touchAction = this.readMode ? "pan-y pinch-zoom" : "none";
      this.canvas.style.cursor = this.readMode ? "default" : "grab";
    }
    if (this.observer) this.pause(true);
  }

  resize() {
    if (this.disposed) return;
    const width = this.host.clientWidth;
    const height = this.host.clientHeight;
    if (!width || !height) return;
    this.mobile = window.innerWidth <= 760;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.mobile ? 1.5 : 2));
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    if (this.layer.hud) this.layer.hud.scale.setScalar(Math.min(1, this.camera.aspect / 0.75));
    const previous = this.baseDistance;
    this.baseDistance = fitDistance(width, height, (this.layer.frameRadius || FRAME_RADIUS) + 0.08);
    this.camera.position.z = previous
      ? clamp(this.camera.position.z * this.baseDistance / previous,
        this.baseDistance * 0.72, this.baseDistance * 1.6)
      : this.baseDistance;
    if (this.layer.dial) {
      const halfHeight = 3 * Math.tan(this.camera.fov * Math.PI / 360);
      const halfWidth = halfHeight * this.camera.aspect;
      this.layer.dial.group.position.set(Math.max(0, halfWidth - 0.3), -halfHeight + 0.3, -3);
    }
    this.dirty = true;
    this.wake();
  }

  pick(event) {
    const rect = this.canvas.getBoundingClientRect();
    this.world.updateMatrixWorld(true);
    this.camera.updateMatrixWorld(true);
    if (this.geographic) {
      const ray = new THREE.Raycaster();
      // Expand the interaction area, never the measured country shape.
      const offsets = [[0, 0], ...[11, 22].flatMap(radius =>
        Array.from({ length: 12 }, (_, index) =>
          [Math.cos(index * TAU / 12) * radius, Math.sin(index * TAU / 12) * radius]))];
      for (const [dx, dy] of offsets) {
        ray.setFromCamera(new THREE.Vector2(
          (event.clientX + dx - rect.left) / rect.width * 2 - 1,
          1 - (event.clientY + dy - rect.top) / rect.height * 2,
        ), this.camera);
        const hit = ray.intersectObject(this.layer.surface)[0];
        if (!hit) continue;
        const local = this.world.worldToLocal(hit.point.clone()).normalize();
        const longitude = Math.atan2(local.x, local.z) * 180 / Math.PI;
        const latitude = Math.asin(clamp(local.y, -1, 1)) * 180 / Math.PI;
        const country = accessCountryAt(this.layer.plan, longitude, latitude);
        if (country) { this.select(country.index); return; }
      }
      return;
    }
    const targets = this.layer.markers.flatMap(mark => {
      const points = mark.hitPoints || (this.paired ? [mark.center, ...Array.from({ length: 32 }, (_, index) =>
        mark.center.clone().add(new THREE.Vector3(
          Math.sin(index * TAU / 32) * this.layer.plan.radius,
          Math.cos(index * TAU / 32) * this.layer.plan.radius, 0)))] : [mark.center]);
      return (mark.hitTargets || points.map(point => ({ point, normal: mark.normal })))
        .filter(target => !this.hasDetailInset || target.detailInset === this.detailInset)
        .map(({ point, normal: targetNormal }) => {
      const worldPoint = point.clone().applyMatrix4(this.world.matrixWorld);
      const normal = targetNormal.clone().transformDirection(this.world.matrixWorld);
      const towardCamera = this.camera.position.clone().sub(worldPoint).normalize();
      const projected = worldPoint.clone().project(this.camera);
      return {
        index: mark.index, visible: (this.paired || normal.dot(towardCamera) > 0) && projected.z < 1,
        x: rect.left + (projected.x + 1) * rect.width / 2,
        y: rect.top + (1 - projected.y) * rect.height / 2,
      };
      });
    });
    const index = selectScreenTarget(targets, event.clientX, event.clientY);
    if (index !== null) this.select(index);
  }

  select(index, focus = false) {
    const mark = this.layer.markers[index];
    if (!mark) return;
    this.pause(true);
    this.selected = index;
    this.layer.onSelect?.(index);
    if (this.layer.dial) setAccessDial(this.layer, mark.row.value);
    else {
      const targets = this.hasDetailInset
        ? mark.selectionTargets.filter(target => target.detailInset === this.detailInset)
        : mark.selectionTargets || [{ base: mark.base, normal: mark.normal }];
      [this.layer.ring, ...(this.layer.extraRings || [])].forEach((ring, index) => {
        const target = targets[index];
        ring.visible = Boolean(target);
        if (target) {
          ring.position.copy(target.base);
          ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), target.normal);
        }
      });
    }
    if (focus) this.focusSelection();
    this.onSelect(mark.row, index);
    this.dirty = true;
    this.wake();
  }

  focusSelection() {
    const mark = this.layer.markers[this.selected];
    if (!mark || !this.canFocus(this.selected)) return;
    this.pause(true);
    // Direct orientation, without tween or inertia, also honors reduced motion.
    if (this.geographic) {
      // Boundary vertex is a view target only: no fabricated center, pin or site.
      const [longitude, latitude] = mark.country.polygons[0][0][0];
      this.world.rotation.set(latitude * Math.PI / 180, -longitude * Math.PI / 180, 0);
    } else if (this.hasDetailInset && this.detailInset) this.world.rotation.set(0, -Math.PI, 0);
    else if (mark.focusRotation) this.world.rotation.set(...mark.focusRotation);
    else this.world.rotation.set(0, -mark.angle, 0);
    this.dirty = true;
    this.wake();
  }

  clearSelection() {
    this.pause(true);
    this.selected = -1;
    this.layer.onSelect?.(-1);
    if (this.layer.dial) this.layer.dial.group.visible = false;
    else {
      this.layer.ring.visible = false;
      this.layer.extraRings?.forEach(ring => { ring.visible = false; });
    }
    this.onSelect(null, -1);
    this.dirty = true;
    this.wake();
  }

  setDetailInset(enabled) {
    if (!this.hasDetailInset) return;
    this.pause(true);
    this.detailInset = Boolean(enabled);
    this.layer.setDetailInset(this.detailInset);
    this.world.rotation.set(0, this.detailInset ? -Math.PI : 0, 0);
    if (this.selected >= 0) this.select(this.selected);
    this.dirty = true;
    this.wake();
  }

  setTimeBasis(basis) {
    if (!this.layer.setTimeBasis || !["paid hours only", "paid and unpaid hours"].includes(basis)) return;
    this.pause(true);
    this.layer.setTimeBasis(basis);
    this.timeBasis = basis;
    if (this.selected >= 0) this.select(this.selected);
    this.dirty = true;
    this.wake();
  }

  setMetric(metric) {
    if (!this.metrics?.includes(metric) || !this.layer.setMetric) return false;
    this.pause(true);
    this.layer.setMetric(metric);
    this.metric = metric;
    this.dirty = true;
    this.wake();
    return true;
  }

  setReverseEvidence(enabled) {
    if (!this.hasReverseEvidence) return;
    this.pause(true);
    this.reverseEvidence = Boolean(enabled);
    this.layer.setReverseEvidence(this.reverseEvidence);
    this.dirty = true;
    this.wake();
  }

  rotate(x, y) {
    this.pause(true);
    this.world.rotation.x = clamp(this.world.rotation.x + x, -1.3, 1.3);
    this.world.rotation.y += y;
    this.dirty = true;
    this.wake();
  }

  flip() { this.rotate(0, Math.PI); }

  zoom(delta) {
    this.pause(true);
    this.camera.position.z = clamp(this.camera.position.z + delta,
      this.baseDistance * 0.72, this.baseDistance * 1.6);
    this.dirty = true;
    this.wake();
  }

  reset() {
    this.pause(true);
    this.world.rotation.set(this.paired || this.instrument ? 0 : this.geographic ? 0.16 : 0.52, 0, 0);
    if (this.layer.initialRotation) this.world.rotation.set(...this.layer.initialRotation);
    this.camera.position.z = this.baseDistance;
    this.dirty = true;
    this.wake();
  }

  canFocus(index) {
    const mark = this.layer.markers[index];
    if (this.hasDetailInset && this.detailInset)
      return Boolean(mark?.selectionTargets.some(target => target.detailInset));
    return Boolean(mark && (!this.geographic || mark.country));
  }

  snapshotCamera() {
    return { rotation: this.world.rotation.toArray().slice(0, 3),
      zoomRatio: this.camera.position.z / this.baseDistance,
      ...(this.hasDetailInset ? { detailInset: this.detailInset } : {}),
      ...(this.hasReverseEvidence ? { reverseEvidence: this.reverseEvidence } : {}),
      ...(this.metric ? { metric: this.metric } : {}),
      ...(this.timeBasis ? { timeBasis: this.timeBasis } : {}) };
  }

  restoreCamera(state) {
    if (!state || !Array.isArray(state.rotation) || state.rotation.length !== 3 ||
      !state.rotation.every(Number.isFinite) || !Number.isFinite(state.zoomRatio)) return false;
    this.pause(true);
    if (this.hasDetailInset && typeof state.detailInset === "boolean") this.setDetailInset(state.detailInset);
    if (this.hasReverseEvidence && typeof state.reverseEvidence === "boolean") this.setReverseEvidence(state.reverseEvidence);
    if (this.layer?.setTimeBasis && ["paid hours only", "paid and unpaid hours"].includes(state.timeBasis))
      this.setTimeBasis(state.timeBasis);
    if (this.metrics?.includes(state.metric)) this.setMetric(state.metric);
    this.world.rotation.set(...state.rotation);
    this.camera.position.z = this.baseDistance * clamp(state.zoomRatio, 0.72, 1.6);
    this.dirty = true;
    this.wake();
    return true;
  }

  pause(value) {
    this.paused = Boolean(value) || this.reduced || document.hidden || !this.visible;
    this.last = 0;
    if (this.paused && this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
    this.onMotion(this.paused);
    this.dirty = true;
    this.wake();
  }

  wake() {
    if (this.disposed || this.raf || !this.visible || document.hidden) return;
    this.raf = requestAnimationFrame(time => this.frame(time));
  }

  frame(time) {
    this.raf = 0;
    if (this.disposed || !this.visible || document.hidden) return;
    const dt = this.last ? Math.min((time - this.last) / 1000, 0.05) : 0;
    this.last = time;
    if (!this.paused) {
      this.elapsed += dt;
      updateAmbientFrame(this.layer, this.elapsed);
    }
    if (this.dirty || (!this.paused && (!this.mobile || time - this.lastDraw >= 1000 / 30))) {
      this.renderer.render(this.scene, this.camera);
      this.lastDraw = time;
      this.dirty = false;
    }
    if (!this.paused) this.wake();
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.observer?.disconnect();
    this.io?.disconnect();
    this.cleanup.forEach(cleanup => cleanup());
    this.pointers.clear();
    const geometries = new Set();
    const materials = new Set();
    (this.scene || this.layer?.world)?.traverse(object => {
      if (object.geometry) geometries.add(object.geometry);
      if (object.material)
        (Array.isArray(object.material) ? object.material : [object.material])
          .forEach(material => materials.add(material));
    });
    geometries.forEach(geometry => geometry.dispose());
    materials.forEach(material => material.dispose());
    this.layer?.columns?.dispose();
    this.layer?.instanced?.forEach(mesh => mesh.dispose());
    this.layer?.texture?.dispose();
    this.layer?.textures?.forEach(texture => texture.dispose());
    this.renderer?.dispose();
    this.renderer?.forceContextLoss();
    this.canvas?.remove();
  }
}
