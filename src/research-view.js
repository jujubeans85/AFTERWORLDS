import * as THREE from "./vendor/three.module.js";
import { clamp, fitDistance } from "./math.js";

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

/** This is the only time-dependent operation, and touches only the neutral hoop. */
export function updateAmbientFrame(layer, elapsedSeconds) {
  layer.ambient.rotation.set(0.35, TAU * (elapsedSeconds % 62) / 62, 0);
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
    this.layer = createLanternScene(research);
    try {
    this.world = this.layer.world;
    this.world.rotation.x = 0.52;
    this.scene = new THREE.Scene();
    this.scene.add(this.world);
    this.scene.add(new THREE.HemisphereLight(0xc9dce6, 0x131c25, 1.5));
    const key = new THREE.DirectionalLight(0xe0f0f5, 1.5);
    key.position.set(-3, 3, 4);
    this.scene.add(key);
    this.camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
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
      `${entry.newTitle}. Abstract annual region comparison, not a geographic map. ` +
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
    const previous = this.baseDistance;
    this.baseDistance = fitDistance(width, height, FRAME_RADIUS + 0.08);
    this.camera.position.z = previous
      ? clamp(this.camera.position.z * this.baseDistance / previous,
        this.baseDistance * 0.72, this.baseDistance * 1.6)
      : this.baseDistance;
    this.dirty = true;
    this.wake();
  }

  pick(event) {
    const rect = this.canvas.getBoundingClientRect();
    this.world.updateMatrixWorld(true);
    this.camera.updateMatrixWorld(true);
    const targets = this.layer.markers.map(mark => {
      const worldPoint = mark.center.clone().applyMatrix4(this.world.matrixWorld);
      const normal = mark.normal.clone().transformDirection(this.world.matrixWorld);
      const towardCamera = this.camera.position.clone().sub(worldPoint).normalize();
      const projected = worldPoint.clone().project(this.camera);
      return {
        index: mark.index, visible: normal.dot(towardCamera) > 0 && projected.z < 1,
        x: rect.left + (projected.x + 1) * rect.width / 2,
        y: rect.top + (1 - projected.y) * rect.height / 2,
      };
    });
    const index = selectScreenTarget(targets, event.clientX, event.clientY);
    if (index !== null) this.select(index);
  }

  select(index, focus = false) {
    const mark = this.layer.markers[index];
    if (!mark) return;
    this.pause(true);
    this.selected = index;
    this.layer.ring.position.copy(mark.base);
    this.layer.ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), mark.normal);
    this.layer.ring.visible = true;
    if (focus) this.focusSelection();
    this.onSelect(mark.row, index);
    this.dirty = true;
    this.wake();
  }

  focusSelection() {
    const mark = this.layer.markers[this.selected];
    if (!mark) return;
    this.pause(true);
    // Direct orientation, without tween or inertia, also honors reduced motion.
    this.world.rotation.set(0, -mark.angle, 0);
    this.dirty = true;
    this.wake();
  }

  clearSelection() {
    this.pause(true);
    this.selected = -1;
    this.layer.ring.visible = false;
    this.onSelect(null, -1);
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
    this.world.rotation.set(0.52, 0, 0);
    this.camera.position.z = this.baseDistance;
    this.dirty = true;
    this.wake();
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
    this.layer?.columns.dispose();
    this.renderer?.dispose();
    this.renderer?.forceContextLoss();
    this.canvas?.remove();
  }
}
