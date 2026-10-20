import * as THREE from "./vendor/three.module.js";
import { railInstrumentPlan } from "./research-rails.js";

const TAU = 2 * Math.PI;
function segments(points, color = "#536872", opacity = 1) {
  return new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points.map(point => new THREE.Vector3(...point))),
    new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity }));
}
const material = color => new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
function wrap(text, maximum) {
  const lines = [];
  for (const word of text.split(" ")) {
    if (!lines.length || lines.at(-1).length + word.length + 1 > maximum) lines.push(word);
    else lines[lines.length - 1] += ` ${word}`;
  }
  return lines;
}
export function createRailScene(research, { createCanvas = () => document.createElement("canvas") } = {}) {
  const plan = railInstrumentPlan(research);
  const world = new THREE.Group(), measured = new THREE.Group(), ambient = new THREE.Group();
  const shell = new THREE.Group(), selection = new THREE.Group();
  world.add(measured, ambient, shell, selection);
  measured.name = "measured-native-rails";
  ambient.name = "ambient-frame-not-measured-change";
  const meridians = ["409", "232"].includes(plan.conceptId);
  shell.add(new THREE.Mesh(new THREE.SphereGeometry(meridians ? 0.85 : 0.7, 32, 20), material("#101a22")));
  const markers = new Array(plan.items.length), textures = [];
  const panelFrames = [], mainPanels = [];
  let insetPanel = null;
  for (const panel of plan.panels) {
    const width = panel.narrow ? plan.conceptId === "324" ? 1.24 : 0.91 : 2.1;
    const height = 2.25, half = width / 2;
    const group = new THREE.Group();
    group.rotation.y = panel.face;
    const radius = panel.inset ? 1.54 : panel.narrow ? 1.15 : 0.9;
    group.position.set(Math.sin(panel.face) * radius, 0, Math.cos(panel.face) * radius);
    measured.add(group);
    if (panel.inset) { insetPanel = group; group.visible = false; }
    else mainPanels.push(group);
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material("#101a22"));
    plate.position.z = -0.025; group.add(plate);
    const edge = half - 0.16, span = edge * 2;
    const rowY = panel.items.map((_, index) => panel.items.length === 1 ? 0.08 :
      panel.items.length === 2 ? 0.25 - index * 0.65 : 0.52 - index * 0.32);
    const canvas = createCanvas();
    canvas.width = Math.round(width * 640); canvas.height = 1440;
    const context = canvas.getContext("2d");
    if (!context) throw Error("Native ruler labels require a 2D canvas.");
    context.clearRect(0, 0, canvas.width, canvas.height);
    function text(value, x, y, size = 26, color = "#b5c3d0", align = "center") {
      context.font = `${size}px sans-serif`; context.fillStyle = color; context.textAlign = align;
      context.fillText(value, (x + half) / width * canvas.width, (height / 2 - y) / height * canvas.height);
    }
    const headline = wrap(panel.title, panel.narrow ? 19 : 42);
    headline.forEach((value, index) => text(value, 0, 1.02 - index * 0.065, panel.narrow ? 29 : 35, "#edf4fa"));
    wrap(panel.subtitle, panel.narrow ? 23 : 57).forEach((value, index) =>
      text(value, 0, 0.82 - index * 0.055, 24));
    const normal = new THREE.Vector3(Math.sin(panel.face), 0, Math.cos(panel.face));
    group.updateMatrix();
    const toWorld = vector => vector.applyMatrix4(group.matrix);
    panel.items.forEach((item, offset) => {
      const value = item.row.value, fraction = value === null ? null : value / panel.domain[1];
      const y = rowY[offset], xAt = v => -edge + span * v / panel.domain[1];
      const start = panel.vertical ? new THREE.Vector3(0, -0.64, 0.01) : new THREE.Vector3(-edge, y, 0.01);
      const end = panel.vertical ? new THREE.Vector3(0, 0.55, 0.01) : new THREE.Vector3(edge, y, 0.01);
      const valuePoint = start.clone().lerp(end, fraction ?? 0);
      group.add(segments([start.toArray(), end.toArray(),
        ...(panel.vertical ? [[-0.04, -0.64, 0.01], [0.04, -0.64, 0.01], [-0.04, 0.55, 0.01], [0.04, 0.55, 0.01]]
          : [[-edge, y - 0.04, 0.01], [-edge, y + 0.04, 0.01], [edge, y - 0.04, 0.01], [edge, y + 0.04, 0.01]])]));
      let quantity;
      if (fraction === null) {
        quantity = segments([[-0.04, y - 0.04, 0.02], [0.04, y + 0.04, 0.02]], "#8a939f");
      } else if (item.kind === "marker") {
        quantity = new THREE.Mesh(new THREE.RingGeometry(0.025, 0.039, 32), material(item.color));
        quantity.position.copy(valuePoint); quantity.position.z = 0.025;
      } else if (item.kind === "caliper") {
        quantity = segments([[start.x, y + 0.055, 0.02], [valuePoint.x, y + 0.055, 0.02],
          [start.x, y - 0.035, 0.02], [start.x, y + 0.085, 0.02],
          [valuePoint.x, y - 0.035, 0.02], [valuePoint.x, y + 0.085, 0.02]], item.color);
        const phone = offset === 0;
        const left = -edge - 0.065;
        group.add(segments(phone ? [
          [left - 0.02, y + 0.21, 0.02], [left + 0.02, y + 0.21, 0.02],
          [left + 0.02, y + 0.21, 0.02], [left + 0.02, y + 0.29, 0.02],
          [left + 0.02, y + 0.29, 0.02], [left - 0.02, y + 0.29, 0.02],
          [left - 0.02, y + 0.29, 0.02], [left - 0.02, y + 0.21, 0.02],
        ] : [[left - 0.025, y + 0.25, 0.02], [left + 0.025, y + 0.25, 0.02],
          [left - 0.025, y + 0.23, 0.02], [left - 0.025, y + 0.27, 0.02],
          [left + 0.025, y + 0.23, 0.02], [left + 0.025, y + 0.27, 0.02]], item.color));
      } else if (item.kind === "outline") {
        quantity = segments([[start.x, y - 0.035, 0.02], [valuePoint.x, y - 0.035, 0.02],
          [valuePoint.x, y - 0.035, 0.02], [valuePoint.x, y + 0.035, 0.02],
          [valuePoint.x, y + 0.035, 0.02], [start.x, y + 0.035, 0.02],
          [start.x, y + 0.035, 0.02], [start.x, y - 0.035, 0.02]], item.color);
      } else {
        quantity = new THREE.Mesh(new THREE.PlaneGeometry(panel.vertical ? 0.035 : span * fraction,
          panel.vertical ? 1.19 * fraction : 0.035), material(item.color));
        quantity.position.copy(start.clone().lerp(valuePoint, 0.5)); quantity.position.z = 0.02;
        quantity.visible = fraction > 0;
      }
      quantity.userData = { rowId: item.row.id, value, fraction, domain: panel.domain, kind: item.kind };
      group.add(quantity);
      if (panel.vertical) {
        text(`${item.label}${plan.conceptId === "232" ? "%" : ""}`, 0, -0.81, 33, item.color);
        text("0", 0.14, -0.65, 24); text("100", 0.15, 0.54, 24);
      } else {
        const name = plan.conceptId === "369" && item.row.measureType === "corporate revenue"
          ? `Microsoft FY${item.row.id.endsWith("2025") ? "2025" : "2026"}` :
          plan.conceptId === "385" && item.kind === "outline" ? "Announced intention" :
            plan.conceptId === "372" ? offset === 0 ? "Proactive investigation" : "Public reporting" :
              panel.narrow ? item.row.buyer : item.row.name;
        wrap(`${name} · ${item.label}`, panel.narrow ? 25 : 58).forEach((line, index) =>
          text(line, -edge, y + 0.2 - index * 0.055, panel.narrow ? 26 : 27, item.color, "left"));
        if (plan.conceptId === "369")
          text(item.row.period, -edge, y - 0.10, 22, "#b5c3d0", "left");
      }
      const hitPoints = Array.from({ length: 25 }, (_, i) => toWorld(start.clone().lerp(end, i / 24)));
      const base = toWorld(new THREE.Vector3(panel.vertical ? -0.12 : -edge - 0.08, panel.vertical ? -0.81 : y, 0.035));
      const target = { base, normal, detailInset: Boolean(panel.inset) };
      const hits = hitPoints.map(point => ({ point, normal, detailInset: Boolean(panel.inset) }));
      if (markers[item.index]) {
        markers[item.index].hitTargets.push(...hits);
        markers[item.index].selectionTargets.push(target);
      } else markers[item.index] = { row: item.row, index: item.index, base, normal,
        center: toWorld(start.clone().lerp(end, 0.5)), hitPoints, hitTargets: hits,
        selectionTargets: [target], focusRotation: [0, -panel.face, 0] };
    });
    if (panel.context) panel.context.forEach((line, index) =>
      wrap(line, panel.narrow ? 28 : 54).forEach((part, partIndex) =>
        text(part, 0, (panel.items.length ? -0.20 : 0.3) - index * 0.16 - partIndex * 0.052, panel.narrow ? 23 : 29, "#edf4fa")));
    if (panel.items.length && !panel.vertical) {
      for (let tick = 0; tick <= 4; tick++) {
        const value = panel.domain[1] * tick / 4;
        text(`${value >= 1e9 ? value / 1e9 : value}`, -edge + span * tick / 4, -0.9, 23);
      }
    }
    text(`0–${panel.domain[1] >= 1e9 ? panel.domain[1] / 1e9 + "bn" : panel.domain[1]} ${plan.unit}`, 0, -1.02, panel.narrow ? 20 : 24);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace; textures.push(texture);
    const labels = new THREE.Mesh(new THREE.PlaneGeometry(width, height),
      new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }));
    labels.position.z = 0.045; group.add(labels);
    // Capacity-kind patterns are categorical decoration with explicit labels,
    // carried by the fixed measured group and never scaled by MW.
    if (panel.pattern) {
      const step = panel.pattern === "restart" ? 0.20 : panel.pattern === "uprate" ? 0.07 :
        panel.pattern === "existing supply plus uprate" ? 0.10 : 0;
      const points = [];
      for (let y = -0.8; y < 0.67; y += step || 2)
        points.push([-half + 0.04, y, 0.015], [-half + 0.04, Math.min(y + (step ? step / 2 : 1.47), 0.67), 0.015]);
      group.add(segments(points, "#8a939f", 0.65));
    }
    panelFrames.push({ matrix: group.matrix.clone(), half });
  }
  let animateAmbient;
  if (meridians) {
    const radius = 1.74;
    const rim = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 128 }, (_, index) =>
      new THREE.Vector3(Math.sin(index * TAU / 128) * radius, 0, Math.cos(index * TAU / 128) * radius))),
      new THREE.LineBasicMaterial({ color: 0xb5c3d0, transparent: true, opacity: 0.26 }));
    const notch = segments([[radius - 0.03, 0, 0], [radius + 0.03, 0, 0]], "#b5c3d0", 0.26);
    ambient.add(rim, notch);
    animateAmbient = time => {
      if (plan.conceptId === "409") ambient.rotation.set(0.18, time * TAU / plan.period, 0);
      else notch.rotation.y = time * TAU / plan.period;
    };
  } else {
    const points = [];
    for (const frame of panelFrames) {
      for (const coordinates of [[-frame.half - 0.07, -0.5, 0], [-frame.half - 0.07, 0.5, 0],
        [-frame.half - 0.07, 0.5, 0], [-frame.half, 0.5, 0]])
        points.push(new THREE.Vector3(...coordinates).applyMatrix4(frame.matrix).toArray());
    }
    if (plan.conceptId !== "385") ambient.add(segments(points, "#b5c3d0", 0.26));
    animateAmbient = time => { ambient.position.x = Math.sin(time * TAU / plan.period) * 0.012; };
    if (plan.conceptId === "385") {
      // A neutral trace travels outside the intention plate; its amount stays
      // an unfilled, stationary source outline.
      const trace = segments([[0, 0, 0], [0.055, 0, 0]], "#b5c3d0", 0.26);
      ambient.add(trace);
      animateAmbient = time => {
        const t = (time / plan.period % 1) * 4;
        trace.position.set(t < 1 ? -1.1 + 2.2 * t : t < 2 ? 1.1 :
          t < 3 ? 1.1 - 2.2 * (t - 2) : -1.1,
        t < 1 ? 1.18 : t < 2 ? 1.18 - 2.36 * (t - 1) :
          t < 3 ? -1.18 : -1.18 + 2.36 * (t - 3), 0.9);
      };
    }
  }
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.035, 0.043, 32), material("#ffffff"));
  ring.visible = false; selection.add(ring);
  const extraRings = [];
  if (plan.conceptId === "232") { const extra = ring.clone(); extra.visible = false; selection.add(extra); extraRings.push(extra); }
  animateAmbient(0);
  return { world, measured, ambient, shell, selection, markers, ring, extraRings, textures, plan,
    insetPanel, mainPanels,
    setDetailInset: insetPanel ? enabled => {
      insetPanel.visible = enabled;
      mainPanels.forEach(panel => { panel.visible = !enabled; });
    } : null,
    animateAmbient, period: plan.period, frameRadius: meridians || plan.conceptId === "324" ? 1.95 : 1.48 };
}
