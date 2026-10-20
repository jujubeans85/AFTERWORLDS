import { addEvidenceEffects, addConceptEffects } from "./effects.js";
import * as THREE from "./vendor/three.module.js";
import {
  xyz,
  clamp,
  unwrapRing,
  fitDistance,
} from "./math.js";
const V = (lat, lon, r = 1) => new THREE.Vector3(...xyz(lat, lon, r));
export class Globe {
  constructor(
    host,
    {
      countries,
      entry,
      dataset,
      onSelect = () => {},
      onMotion = () => {},
      hero = false,
    },
  ) {
    this.host = host;
    this.entry = entry;
    this.dataset = dataset;
    this.onSelect = onSelect;
    this.onMotion = onMotion;
    this.hero = hero;
    this.cleanup = [];
    this.disposed = false;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    this.reduced = media.matches;
    this.paused = this.reduced || document.hidden;
    this.visible = true;
    this.moved = 0;
    this.vel = { x: 0, y: 0 };
    this.target = null;
    this.pointers = new Map();
    this.markers = [];
    this.time = 0;
    this.last = 0;
    this.raf = 0;
    this.dirty = true;
    try {
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
    this.canvas = this.renderer.domElement;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.canvas.className = "globe-canvas";
    this.canvas.tabIndex = hero ? -1 : 0;
    this.canvas.setAttribute(
      "aria-label",
      hero
        ? "Decorative preview globe"
        : `${entry.newTitle}. Interactive 3D globe. Use arrow keys to rotate, plus and minus to zoom, and Space to pause. Data are also available in the evidence panel.`,
    );
    this.canvas.setAttribute("role", "img");
    host.append(this.canvas);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(36, 1, 0.1, 50);
    this.camera.position.z = 3.9;
    this.world = new THREE.Group();
    this.startRotation = {
      x: 0.12,
      y:
        (-(
          {
            adoption: 90,
            power: 60,
            capital: -70,
            models: 90,
            robots: 100,
            access: 20,
            network: 40,
            water: -98,
            sovereignty: 30,
            borders: 35,
            chokepoints: 104,
          }[dataset?.id] ?? 0
        ) *
          Math.PI) /
        180,
    };
    this.world.rotation.x = this.startRotation.x;
    this.world.rotation.y = this.startRotation.y;
    this.scene.add(this.world);
    this.color = new THREE.Color(entry.color || "#b8f46e");
    this.world.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(1, 64, 48),
        new THREE.MeshPhongMaterial({
          color: 0x0a151b,
          shininess: 28,
          specular: 0x304850,
        }),
      ),
    );
    this.scene.add(new THREE.AmbientLight(0x709298, 0.75));
    const light = new THREE.DirectionalLight(0xd3f5ef, 2);
    light.position.set(-3, 3, 4);
    this.scene.add(light);
    this.addAtmosphere();
    if (!dataset || dataset.geographyMode === "geographic")
      this.addGeography(countries);
    this.addGrid();
    this.updateEffects = dataset ? addEvidenceEffects(this) : addConceptEffects(this);
    this.updateEffects(0);
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(host);
    this.io = new IntersectionObserver(([e]) => {
      this.visible = e.isIntersecting;
      if (!this.visible) this.pause(true);
      else this.wake();
    });
    this.io.observe(host);
    this.listen(document, "visibilitychange", () => {
      if (document.hidden) this.pause(true);
      else this.wake();
    });
    this.mediaListener = (e) => {
      this.reduced = e.matches;
      if (e.matches) this.pause(true);
    };
    media.addEventListener("change", this.mediaListener);
    this.cleanup.push(() =>
      media.removeEventListener("change", this.mediaListener),
    );
    this.listen(this.canvas, "webglcontextlost", (e) => {
      e.preventDefault();
      this.contextLost = true;
      this.pause(true);
      host.classList.add("context-lost");
      host.dispatchEvent(
        new CustomEvent("globe-error", {
          detail:
            "The 3D view lost its graphics context. Reload the page to restore it; the evidence table remains available.",
        }),
      );
    });
    if (!hero) this.bind();
    this.resize();
    this.wake();
    this.onMotion(this.paused);
    } catch (error) {
      this.dispose();
      throw error;
    }
  }
  listen(el, event, fn, opts) {
    el.addEventListener(event, fn, opts);
    this.cleanup.push(() => el.removeEventListener(event, fn, opts));
  }
  addAtmosphere() {
    const mat = new THREE.ShaderMaterial({
      uniforms: { color: { value: this.color } },
      vertexShader:
        "varying vec3 n; varying vec3 v; void main(){vec4 p=modelViewMatrix*vec4(position,1.);n=normalize(normalMatrix*normal);v=normalize(-p.xyz);gl_Position=projectionMatrix*p;}",
      fragmentShader:
        "uniform vec3 color; varying vec3 n; varying vec3 v; void main(){float f=pow(1.-abs(dot(n,v)),3.5);gl_FragColor=vec4(color,f*.17);}",
      transparent: true,
      side: THREE.BackSide,
      depthWrite: false,
    });
    this.world.add(
      new THREE.Mesh(new THREE.SphereGeometry(1.045, 64, 48), mat),
    );
  }
  addGeography(countries) {
    const lines = [];
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 512;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.fillStyle = "#fff";
    for (const country of countries)
      for (const poly of country.polygons) {
        for (const shift of [-360, 0, 360]) {
          ctx.beginPath();
          for (const ring of poly) {
            const safe = unwrapRing(ring);
            safe.forEach(([lon, lat], i) => {
              const x = ((lon + shift + 180) / 360) * 1024,
                y = ((90 - lat) / 180) * 512;
              i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
            });
            ctx.closePath();
          }
          ctx.fill("evenodd");
        }
        for (const ring of poly)
          ring.forEach(([lon, lat], i) => {
            if (i) {
              const prev = ring[i - 1];
              if (Math.abs(lon - prev[0]) < 180)
                lines.push(
                  ...xyz(prev[1], prev[0], 1.005),
                  ...xyz(lat, lon, 1.005),
                );
            }
          });
      }
    const pix = ctx.getImageData(0, 0, 1024, 512).data;
    const points = [];
    for (let lat = -85; lat < 85; lat += 1.65) {
      const step = 1.65 / Math.max(0.1, Math.cos((lat * Math.PI) / 180));
      for (let lon = -180; lon < 180; lon += step) {
        const i =
          (Math.floor(((90 - lat) / 180) * 512) * 1024 +
            Math.floor(((lon + 180) / 360) * 1024)) *
          4;
        if (pix[i + 3] > 100) points.push(...xyz(lat, lon, 1.004));
      }
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    this.world.add(
      new THREE.Points(
        geom,
        new THREE.PointsMaterial({
          color: 0x8eabae,
          size: 0.0065,
          transparent: true,
          opacity: 0.67,
          sizeAttenuation: true,
        }),
      ),
    );
    const outline = new THREE.BufferGeometry();
    outline.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(lines, 3),
    );
    this.world.add(
      new THREE.LineSegments(
        outline,
        new THREE.LineBasicMaterial({
          color: 0x76949a,
          transparent: true,
          opacity: 0.2,
        }),
      ),
    );
  }
  addGrid() {
    const pos = [];
    for (let lat = -60; lat <= 60; lat += 30)
      for (let lon = -180; lon < 180; lon += 3)
        pos.push(...xyz(lat, lon, 1.001), ...xyz(lat, lon + 3, 1.001));
    for (let lon = -180; lon < 180; lon += 30)
      for (let lat = -90; lat < 90; lat += 3)
        pos.push(...xyz(lat, lon, 1.001), ...xyz(lat + 3, lon, 1.001));
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    this.world.add(
      new THREE.LineSegments(
        g,
        new THREE.LineBasicMaterial({
          color: 0x71959b,
          transparent: true,
          opacity: 0.1,
        }),
      ),
    );
  }
  resize() {
    if (this.disposed) return;
    const w = this.host.clientWidth,
      h = this.host.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.baseDistance = fitDistance(
      w,
      h,
      1.54,
      36,
    );
    this.camera.position.z = this.baseDistance;
    this.camera.updateProjectionMatrix();
    this.dirty = true;
    this.wake();
  }
  bind() {
    this.listen(this.canvas, "pointerdown", (e) => {
      this.canvas.setPointerCapture(e.pointerId);
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      this.moved = 0;
      this.vel = { x: 0, y: 0 };
      this.target = null;
      this.dragging = true;
      this.canvas.style.cursor = "grabbing";
      this.stopRotation();
      this.wake();
    });
    this.listen(this.canvas, "pointermove", (e) => {
      const old = this.pointers.get(e.pointerId);
      if (!old) return;
      const dx = e.clientX - old.x,
        dy = e.clientY - old.y;
      this.moved += Math.abs(dx) + Math.abs(dy);
      if (this.pointers.size === 2) {
        const other = [...this.pointers.entries()].find(
          ([k]) => k !== e.pointerId,
        )?.[1];
        const before = Math.hypot(old.x - other.x, old.y - other.y),
          after = Math.hypot(e.clientX - other.x, e.clientY - other.y);
        this.zoom((before - after) * 0.008);
      } else {
        this.world.rotation.y += dx * 0.006;
        this.world.rotation.x = clamp(
          this.world.rotation.x + dy * 0.006,
          -1.45,
          1.45,
        );
        this.vel = { x: dy * 0.00025, y: dx * 0.00025 };
      }
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      this.dirty = true;
      this.wake();
    });
    const up = (e) => {
      if (!this.pointers.has(e.pointerId)) return;
      const click = this.moved < 7;
      this.pointers.delete(e.pointerId);
      this.dragging = this.pointers.size > 0;
      this.canvas.style.cursor = "grab";
      if (click && e.type === "pointerup") this.pick(e);
      this.wake();
    };
    this.listen(this.canvas, "pointerup", up);
    this.listen(this.canvas, "pointercancel", up);
    this.listen(
      this.canvas,
      "wheel",
      (e) => {
        if (document.activeElement !== this.canvas) return;
        e.preventDefault();
        this.zoom(e.deltaY * 0.002);
      },
      { passive: false },
    );
    this.listen(this.canvas, "keydown", (e) => {
      const moves = {
        ArrowLeft: [0, -0.16],
        ArrowRight: [0, 0.16],
        ArrowUp: [-0.16, 0],
        ArrowDown: [0.16, 0],
      };
      if (moves[e.key]) {
        e.preventDefault();
        this.rotate(...moves[e.key]);
      } else if (e.code === "Space") {
        e.preventDefault();
        this.pause(!this.paused);
      } else if (["+", "="].includes(e.key)) {
        e.preventDefault();
        this.zoom(-0.2);
      } else if (e.key === "-") {
        e.preventDefault();
        this.zoom(0.2);
      } else if (e.key === "Home") {
        e.preventDefault();
        this.reset();
      }
    });
  }
  pick(e) {
    this.world.updateMatrixWorld(true);
    const box = this.canvas.getBoundingClientRect();
    const ray = new THREE.Raycaster();
    ray.setFromCamera(
      new THREE.Vector2(
        ((e.clientX - box.left) / box.width) * 2 - 1,
        (-(e.clientY - box.top) / box.height) * 2 + 1,
      ),
      this.camera,
    );
    const hits = ray.intersectObjects(this.markers.map((m) => m.hit));
    if (hits.length) {
      const hit = hits.find((h) => {
        const p = new THREE.Vector3();
        this.markers[h.object.userData.index].group.getWorldPosition(p);
        return p.z > 0.05;
      });
      if (hit) this.select(hit.object.userData.index, false);
    }
  }
  select(index, fly = true) {
    const m = this.markers[index];
    if (!m) return;
    this.markers.forEach((x) => (x.ring.material.opacity = x === m ? 1 : 0.4));
    this.onSelect(m.point, index);
    this.stopRotation();
    if (fly) {
      this.vel = { x: 0, y: 0 };
      const x = ((m.chartLat ?? m.point.lat) * Math.PI) / 180,
        y = (-(m.chartLon ?? m.point.lon) * Math.PI) / 180;
      this.target = { x, y };
      if (this.reduced || this.paused) {
        this.world.rotation.set(x, y, 0);
        this.target = null;
      }
    }
    this.dirty = true;
    this.wake();
  }
  rotate(x, y) {
    this.stopRotation();
    this.target = null;
    this.world.rotation.x = clamp(this.world.rotation.x + x, -1.45, 1.45);
    this.world.rotation.y += y;
    this.dirty = true;
    this.wake();
  }
  flip() {
    this.rotate(0, Math.PI);
  }
  zoom(delta) {
    this.stopRotation();
    this.camera.position.z = clamp(
      this.camera.position.z + delta,
      2.55,
      Math.max(7, this.baseDistance * 1.5),
    );
    this.dirty = true;
    this.wake();
  }
  reset() {
    this.stopRotation();
    this.world.rotation.set(this.startRotation.x, this.startRotation.y, 0);
    this.camera.position.z = this.baseDistance;
    this.target = null;
    this.rotationStopped = true;
    this.vel = { x: 0, y: 0 };
    this.dirty = true;
    this.wake();
  }
  stopRotation() {
    this.rotationStopped = true;
    this.pause(true);
  }
  pause(value) {
    if (this.disposed) return;
    this.paused = Boolean(value) || this.reduced || document.hidden || !this.visible || Boolean(this.contextLost);
    if (!this.paused) this.rotationStopped = false;
    this.last = 0;
    if (this.paused) {
      this.vel = { x: 0, y: 0 };
      // Preserve an already chosen row's destination, without a paused fly-to.
      if (this.target) {
        this.world.rotation.set(this.target.x, this.target.y, 0);
        this.target = null;
      }
      if (this.raf) cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
    this.onMotion(this.paused);
    this.dirty = true;
    this.wake();
  }
  wake() {
    if (this.disposed || this.raf || !this.visible || document.hidden || this.contextLost ||
      (this.paused && !this.dirty)) return;
    this.raf = requestAnimationFrame((t) => this.frame(t));
  }
  frame(t) {
    this.raf = 0;
    if (this.disposed || this.contextLost) return;
    if (!this.visible || document.hidden || (this.reduced && !this.paused)) {
      this.pause(true);
      return;
    }
    const dt = Math.min((t - (this.last || t)) / 1000, 0.05);
    this.last = t;
    if (!this.paused) { this.time += dt; this.updateEffects(this.time); }
    let animate = !this.paused;
    if (!this.paused && !this.dragging && !this.rotationStopped) this.world.rotation.y += dt * 0.055;
    if (!this.paused && this.target) {
      let dy =
        (this.target.y - this.world.rotation.y + Math.PI) % (Math.PI * 2);
      if (dy < 0) dy += Math.PI * 2;
      dy -= Math.PI;
      this.world.rotation.x += (this.target.x - this.world.rotation.x) * 0.12;
      this.world.rotation.y += dy * 0.12;
      if (
        Math.abs(dy) + Math.abs(this.world.rotation.x - this.target.x) <
        0.003
      )
        this.target = null;
      animate = true;
    }
    if (this.dirty || animate) {
      this.renderer.render(this.scene, this.camera);
      this.dirty = false;
    }
    if (animate) this.wake();
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.observer?.disconnect();
    this.io?.disconnect();
    this.cleanup.forEach((fn) => fn());
    for (const pointerId of this.pointers.keys()) {
      if (this.canvas?.hasPointerCapture?.(pointerId))
        this.canvas.releasePointerCapture(pointerId);
    }
    this.pointers.clear();
    this.dragging = false;
    this.target = null;
    const materials = new Set(),
      geometries = new Set(), textures = new Set(), instances = new Set();
    this.scene?.traverse((o) => {
      if (o.geometry) geometries.add(o.geometry);
      if (o.isInstancedMesh) instances.add(o);
      if (o.material)
        (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) =>
          materials.add(m),
        );
    });
    materials.forEach((material) => {
      Object.values(material).forEach(value => { if (value?.isTexture) textures.add(value); });
      Object.values(material.uniforms || {}).forEach(uniform => {
        if (uniform.value?.isTexture) textures.add(uniform.value);
      });
    });
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
    textures.forEach(texture => texture.dispose());
    instances.forEach(instance => instance.dispose());
    this.renderer?.dispose();
    this.renderer?.forceContextLoss();
    this.canvas?.remove();
  }
}
