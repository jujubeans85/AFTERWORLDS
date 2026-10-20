import * as THREE from "./vendor/three.module.js";
import { architectureInstrumentPlan } from "./research-architecture.js";

const TAU = Math.PI * 2;
const material = color => new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
const lines = (points, color = "#536872", opacity = 1) => new THREE.LineSegments(
  new THREE.BufferGeometry().setFromPoints(points.map(point => new THREE.Vector3(...point))),
  new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity }));
function wrap(value, columns) {
  const result = [];
  for (const word of value.split(" ")) {
    if (!result.length || result.at(-1).length + word.length + 1 > columns) result.push(word);
    else result[result.length - 1] += ` ${word}`;
  }
  return result;
}
export function createArchitectureScene(research, { createCanvas = () => document.createElement("canvas") } = {}) {
  const plan = architectureInstrumentPlan(research);
  const world = new THREE.Group(), measured = new THREE.Group(), ambient = new THREE.Group();
  const shell = new THREE.Group(), selection = new THREE.Group();
  world.add(measured, ambient, shell, selection);
  measured.name = "measured-native-architecture";
  ambient.name = "ambient-frame-not-measured-change";
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(plan.kind === "spools" ? 0.65 :
    plan.kind === "log-markers" ? 0.97 : 1, 40, 24),
    material(plan.kind === "gates" ? "#102330" : "#101a22"));
  shell.add(sphere);
  const markers = new Array(plan.items.length), dataObjects = [], frames = [];
  // One label atlas keeps high-row-count worlds from allocating a canvas per row.
  const canvas = createCanvas(), columns = Math.min(8, plan.items.length), rows = Math.ceil(plan.items.length / columns);
  const cellW = 256, cellH = 384;
  canvas.width = columns * cellW; canvas.height = rows * cellH;
  const context = canvas.getContext("2d");
  if (!context) throw Error("Native architecture labels require a 2D canvas.");
  context.clearRect(0, 0, canvas.width, canvas.height);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  plan.items.forEach(item => {
    const group = new THREE.Group(); group.rotation.y = item.angle;
    group.position.set(Math.sin(item.angle), 0, Math.cos(item.angle)); measured.add(group);
    const pointList = [];
    let quantity;
    if (plan.kind === "gates") {
      quantity = lines([[-0.20, 0, 0.02], [-0.20, item.extent, 0.02],
        [-0.20, item.extent, 0.02], [0.20, item.extent, 0.02], [0.20, item.extent, 0.02], [0.20, 0, 0.02]], item.color);
      group.add(lines([[-0.24, 0, 0], [-0.24, 1, 0], [-0.24, 1, 0], [0.24, 1, 0], [0.24, 1, 0], [0.24, 0, 0]], "#344b55"));
      if (item.pattern === "fiscal-diagonal") {
        const hatch = [];
        for (let i = 0; i < 7; i++) hatch.push([-0.25, -0.07 - i * 0.012, 0.015], [-0.17, -0.03 - i * 0.012, 0.015]);
        group.add(lines(hatch, item.color));
      }
      for (let i = 0; i < 16; i++) pointList.push(new THREE.Vector3(0, i / 15, 0.03));
      frames.push({ matrix: group.matrix.clone(), width: 0.56, height: 1.08, y: 0 });
    } else if (plan.kind === "markets" || plan.kind === "books") {
      const width = plan.kind === "books" ? 0.12 : 0.035;
      const full = plan.kind === "books" ? 0.5 : 1;
      quantity = new THREE.Mesh(new THREE.PlaneGeometry(width, item.extent), material(item.color));
      quantity.position.set(0, item.extent / 2, 0.025); quantity.visible = item.extent > 0;
      group.add(lines([[-width / 2 - 0.008, 0, 0.015], [-width / 2 - 0.008, full, 0.015],
        [width / 2 + 0.008, 0, 0.015], [width / 2 + 0.008, full, 0.015]], "#536872"));
      if (plan.kind === "markets") group.add(lines([[-width / 2, 0, 0.03], [-width / 2, item.extent, 0.03],
        [-width / 2, item.extent, 0.03], [width / 2, item.extent, 0.03], [width / 2, item.extent, 0.03], [width / 2, 0, 0.03]], "#b5c3d0"));
      for (let i = 0; i < 16; i++) pointList.push(new THREE.Vector3(0, full * i / 15, 0.035));
      frames.push({ width: width + 0.06, height: full + 0.06, y: 0 });
    } else if (plan.kind === "spools") {
      group.position.multiplyScalar(1.1);
      const spool = new THREE.Mesh(new THREE.RingGeometry(0.22, 0.24, 72), material("#536872"));
      spool.position.set(0, 0.22, 0.015); group.add(spool);
      const hub = new THREE.Mesh(new THREE.RingGeometry(0.04, 0.052, 32), material("#536872"));
      hub.position.copy(spool.position); group.add(hub);
      quantity = new THREE.Mesh(new THREE.PlaneGeometry(item.extent, 0.035), material(item.color));
      quantity.position.set(-0.5 + item.extent / 2, -0.12, 0.035); quantity.visible = item.extent > 0;
      group.add(lines([[-0.5, -0.12, 0.015], [0.5, -0.12, 0.015]], "#344b55"));
      for (let i = 0; i < 24; i++) pointList.push(new THREE.Vector3(-0.5 + i / 23, -0.12, 0.04));
      frames.push({ radius: 0.29, y: 0.22 });
    } else {
      // Local +z is the outward radial direction; only marker position encodes
      // the logarithm. Marker radius and all ruler dimensions remain constant.
      const ruler = [];
      const step = item.pattern === "Confident" ? 1 : item.pattern === "Likely" ? 12 : 28;
      for (let i = 0; i < step; i++) ruler.push([0, 0, 0.45 * i / step],
        [0, 0, 0.45 * (i + (step === 1 ? 1 : 0.55)) / step]);
      group.add(lines(ruler, "#536872"));
      group.add(lines([[-0.025, 0, 0], [0.025, 0, 0], [-0.025, 0, 0.225], [0.025, 0, 0.225],
        [-0.025, 0, 0.45], [0.025, 0, 0.45]], "#b5c3d0"));
      quantity = new THREE.Mesh(new THREE.SphereGeometry(0.021, 16, 10), material(item.color));
      quantity.position.set(0, 0, item.offset);
      for (let i = 0; i < 24; i++) pointList.push(new THREE.Vector3(0, 0, 0.45 * i / 23));
    }
    quantity.userData = { rowId: item.row.id, value: item.row.value, extent: item.extent, offset: item.offset,
      slot: item.slot, pattern: item.pattern };
    group.add(quantity); dataObjects.push(quantity);
    const cellX = item.slot % columns * cellW, cellY = Math.floor(item.slot / columns) * cellH;
    const title = plan.kind === "books" ? `${item.row.rank}. ${item.row.name}` : item.row.name;
    const measuredWrap = (value, size) => {
      context.font = `${size}px sans-serif`;
      const width = text => context.measureText ? context.measureText(text).width : text.length * size * 0.62;
      const result = [];
      for (const originalWord of String(value).split(/\s+/)) {
        let word = originalWord;
        // Long unbroken source names are split at glyph boundaries, not allowed
        // to paint over a neighboring source label in the shared atlas.
        while (width(word) > cellW - 24) {
          let end = word.length - 1;
          while (end > 1 && width(word.slice(0, end)) > cellW - 24) end--;
          result.push(word.slice(0, end)); word = word.slice(end);
        }
        if (!result.length || width(`${result.at(-1)} ${word}`) > cellW - 24) result.push(word);
        else result[result.length - 1] += ` ${word}`;
      }
      return result;
    };
    const texts = [...measuredWrap(title, 28).map(text => [text, 28, "#edf4fa"]),
      ...measuredWrap(String(item.row.value), 34).map(text => [text, 34, item.color]),
      ...measuredWrap(plan.kind === "log-markers" ? `${item.row.estimateConfidence} estimate` :
        plan.kind === "gates" ? item.row.period : plan.kind === "markets" ? `${item.row.ageRange}; ${item.row.sampleScope}` : item.row.unit, 20).map(text => [text, 20, "#b5c3d0"])];
    if (plan.kind === "log-markers") texts.push(["10^25 — 10^27 FLOP", 21, "#b5c3d0"]);
    const textHeight = texts.reduce((sum, [, size]) => sum + size + 4, 0);
    const fit = Math.min(1, (cellH - 24) / textHeight);
    context.save?.(); context.beginPath?.(); context.rect?.(cellX, cellY, cellW, cellH); context.clip?.();
    let cursor = 12;
    for (const [text, size, color] of texts) {
      cursor += size * fit;
      context.font = `${size * fit}px sans-serif`; context.textAlign = "center"; context.fillStyle = color;
      context.fillText(text, cellX + cellW / 2, cellY + cursor); cursor += 4 * fit;
    }
    context.restore?.();
    const labelWidth = plan.kind === "spools" ? 0.8 : plan.kind === "gates" ? 0.58 : plan.kind === "books" ? 0.42 : 0.20;
    const geometry = new THREE.PlaneGeometry(labelWidth, labelWidth * cellH / cellW);
    const uv = geometry.attributes.uv;
    for (let index = 0; index < uv.count; index++) uv.setXY(index,
      (item.slot % columns + uv.getX(index)) / columns,
      1 - (Math.floor(item.slot / columns) + 1 - uv.getY(index)) / rows);
    const label = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }));
    label.position.set(0, -labelWidth * cellH / cellW / 2 - 0.15, 0.04); group.add(label);
    group.updateMatrix();
    if (frames.length && plan.kind !== "log-markers") frames.at(-1).matrix = group.matrix.clone();
    const normal = new THREE.Vector3(Math.sin(item.angle), 0, Math.cos(item.angle));
    const base = plan.kind === "log-markers" ? new THREE.Vector3(0, 0, item.offset + 0.04) :
      new THREE.Vector3(-0.06, plan.kind === "spools" ? -0.12 : item.extent, 0.055);
    markers[item.index] = { row: item.row, index: item.index, normal,
      center: base.clone().applyMatrix4(group.matrix), base: base.applyMatrix4(group.matrix),
      hitPoints: pointList.map(point => point.applyMatrix4(group.matrix)),
      focusRotation: plan.kind === "log-markers" ? [0.5, -item.angle + 0.5, 0] : [0.15, -item.angle, 0] };
  });
  texture.needsUpdate = true;
  let animateAmbient;
  if (plan.recipe === "outer-gimbal") {
    const hoop = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 128 }, (_, index) =>
      new THREE.Vector3(Math.sin(index * TAU / 128) * 1.6, Math.cos(index * TAU / 128) * 1.6, 0))),
      new THREE.LineBasicMaterial({ color: "#b5c3d0", transparent: true, opacity: 0.26 }));
    ambient.add(hoop); animateAmbient = time => { ambient.rotation.set(0.15, time * TAU / plan.period, 0); };
  } else {
    const framePoints = [];
    for (const frame of frames) {
      const local = frame.radius ? Array.from({ length: 96 }, (_, index) => [index, index + 1].map(i => [
        Math.sin(i * TAU / 96) * frame.radius, frame.y + Math.cos(i * TAU / 96) * frame.radius, -0.02])).flat() :
        [[-frame.width / 2, frame.y, -0.02], [-frame.width / 2, frame.y + frame.height, -0.02],
          [-frame.width / 2, frame.y + frame.height, -0.02], [frame.width / 2, frame.y + frame.height, -0.02],
          [frame.width / 2, frame.y + frame.height, -0.02], [frame.width / 2, frame.y, -0.02],
          [frame.width / 2, frame.y, -0.02], [-frame.width / 2, frame.y, -0.02]];
      frame.points = local.map(point => new THREE.Vector3(...point).applyMatrix4(frame.matrix));
      framePoints.push(...frame.points);
    }
    ambient.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(framePoints),
      new THREE.LineBasicMaterial({ color: "#b5c3d0", transparent: true, opacity: 0.22 })));
    const positions = new Float32Array(frames.length * 6), geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    ambient.add(new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: "#b5c3d0", transparent: true, opacity: 0.28 })));
    const p = new THREE.Vector3();
    animateAmbient = time => {
      frames.forEach((frame, index) => {
        const offset = (time / plan.period % 1) * frame.points.length / 2, segment = Math.floor(offset), t = offset - segment;
        for (let end = 0; end < 2; end++) {
          p.lerpVectors(frame.points[segment * 2], frame.points[segment * 2 + 1], Math.min(1, t + end * 0.13));
          p.toArray(positions, index * 6 + end * 3);
        }
      });
      geometry.attributes.position.needsUpdate = true;
    };
  }
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.032, 0.04, 32), material("#ffffff"));
  ring.visible = false; selection.add(ring); animateAmbient(0);
  return { world, measured, ambient, shell, selection, markers, ring, textures: [texture], plan, dataObjects,
    initialRotation: plan.kind === "log-markers" ? [0.52, 0.2, 0] : null,
    period: plan.period, animateAmbient, frameRadius: plan.kind === "spools" ? 1.75 : 1.65 };
}
