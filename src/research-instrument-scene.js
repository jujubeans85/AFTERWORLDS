import * as THREE from "./vendor/three.module.js";
import { intervalInstrumentPlan } from "./research-intervals.js";

const TAU = 2 * Math.PI;
const colorMaterial = color => new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
const line = (points, color = "#718a94", opacity = 1) => new THREE.LineSegments(
  new THREE.BufferGeometry().setFromPoints(points.map(([x, y, z = 0]) => new THREE.Vector3(x, y, z))),
  new THREE.LineBasicMaterial({ color, opacity, transparent: opacity < 1 }),
);
function bar(parent, left, right, y, color, height = 0.035) {
  const object = new THREE.Mesh(new THREE.PlaneGeometry(right - left, height), colorMaterial(color));
  object.position.set((left + right) / 2, y, 0.006);
  object.visible = right > left;
  parent.add(object);
  return object;
}
function terminal(parent, x, y, color, kind) {
  if (kind === "<") {
    const ring = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(Array.from({ length: 32 }, (_, i) =>
        new THREE.Vector3(x + Math.cos(i * TAU / 32) * 0.026, y + Math.sin(i * TAU / 32) * 0.026, 0.012))),
      new THREE.LineBasicMaterial({ color }),
    );
    parent.add(ring);
    return ring;
  }
  const points = kind === "approximately"
    ? [[x, y - 0.045], [x, y - 0.025], [x, y - 0.01], [x, y + 0.01], [x, y + 0.025], [x, y + 0.045]]
    : [[x, y - 0.045], [x, y + 0.045]];
  const cap = line(points.map(([a, b]) => [a, b, 0.012]), color);
  parent.add(cap);
  return cap;
}
function titleTexture(createCanvas, draw, textures) {
  const canvas = createCanvas();
  canvas.width = 1024; canvas.height = 1024;
  const context = canvas.getContext("2d");
  if (!context) throw Error("Evidence-instrument labels require a 2D canvas.");
  context.clearRect(0, 0, 1024, 1024);
  draw(context);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textures.push(texture);
  return texture;
}
function panelText(context, text, x, y, size = 25, color = "#b5c3d0", align = "left") {
  context.font = `${size}px sans-serif`; context.fillStyle = color; context.textAlign = align;
  context.fillText(text, (x + 1.05) / 2.1 * 1024, (1.125 - y) / 2.25 * 1024);
}

export function createInstrumentScene(research, { createCanvas = () => document.createElement("canvas") } = {}) {
  const plan = intervalInstrumentPlan(research);
  const world = new THREE.Group(), measured = new THREE.Group(), ambient = new THREE.Group();
  const shell = new THREE.Group(), selection = new THREE.Group();
  world.add(measured, ambient, shell, selection);
  measured.name = "measured-native-evidence-instrument";
  ambient.name = "ambient-frame-not-measured-change";
  shell.add(new THREE.Mesh(new THREE.SphereGeometry(0.72, 24, 16), colorMaterial("#101a22")));
  const markers = new Array(research.rows.length), textures = [];
  let animateAmbient;
  if (plan.kind === "rails") {
    for (const panel of plan.panels) {
      const group = new THREE.Group();
      group.rotation.y = panel.face;
      group.position.set(Math.sin(panel.face) * 0.89, 0, Math.cos(panel.face) * 0.89);
      measured.add(group);
      const plate = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 2.25), colorMaterial("#101a22"));
      plate.position.z = -0.015; group.add(plate);
      const xAt = value => -0.75 + 1.5 * value / panel.domain[1];
      const rowY = panel.items.map((_, i) => panel.items.length === 1 ? 0 :
        panel.items.length === 2 ? 0.26 - i * 0.52 : 0.55 - i * 0.24);
      panel.items.forEach((item, offset) => {
        const y = rowY[offset];
        group.add(line([[-0.75, y], [0.75, y], [-0.75, y - 0.035], [-0.75, y + 0.035],
          [0.75, y - 0.035], [0.75, y + 0.035]], "#536872"));
        if (item.kind === "range") {
          const span = bar(group, xAt(item.lower), xAt(item.upper), y, item.color, 0.045);
          span.userData = { rowId: item.row.id, lower: item.lower, upper: item.upper, point: null };
          group.add(line([...[item.lower, item.upper].flatMap(value => [
            [xAt(value) - 0.015, y - 0.048, 0.01], [xAt(value) + 0.015, y - 0.023, 0.01],
            [xAt(value) - 0.015, y + 0.023, 0.01], [xAt(value) + 0.015, y + 0.048, 0.01],
          ])], item.color));
        } else if (item.kind === "whisker") {
          const whisker = line([[xAt(item.lower), y], [xAt(item.upper), y],
            [xAt(item.lower), y - 0.035], [xAt(item.lower), y + 0.035],
            [xAt(item.upper), y - 0.035], [xAt(item.upper), y + 0.035]], item.color);
          whisker.userData = { rowId: item.row.id, lower: item.lower, upper: item.upper, uncertainty: "one-robust-SE" };
          group.add(whisker);
          const point = terminal(group, xAt(item.point), y, item.color, "<");
          point.userData = { rowId: item.row.id, point: item.point, meaning: "outlined-source-estimate" };
        } else if (item.kind === "share") {
          const extent = bar(group, -0.75, xAt(item.point), y, item.color);
          extent.userData = { rowId: item.row.id, value: item.point };
        } else {
          if (item.qualifier === "approximately") bar(group, -0.75, xAt(item.boundary), y, item.color);
          const cap = terminal(group, xAt(item.boundary), y, item.color, item.qualifier);
          cap.userData = { rowId: item.row.id, threshold: item.boundary, qualifier: item.qualifier, point: null };
        }
        const localCenter = new THREE.Vector3(0, y, 0.02);
        const base = new THREE.Vector3(-0.88, y, 0.02);
        group.updateMatrix();
        const toWorld = vector => vector.applyMatrix4(group.matrix);
        const marker = {
          row: item.row, index: item.index, normal: new THREE.Vector3(Math.sin(panel.face), 0, Math.cos(panel.face)),
          center: toWorld(localCenter), base: toWorld(base), focusRotation: [0, -panel.face, 0],
          hitPoints: Array.from({ length: 17 }, (_, i) => toWorld(new THREE.Vector3(-0.75 + i * 1.5 / 16, y, 0.02))),
        };
        const hitTargets = marker.hitPoints.map(point => ({ point, normal: marker.normal }));
        const selectionTarget = { base: marker.base, normal: marker.normal };
        if (markers[item.index]) {
          markers[item.index].hitTargets.push(...hitTargets);
          markers[item.index].selectionTargets.push(selectionTarget);
        } else markers[item.index] = { ...marker, hitTargets, selectionTargets: [selectionTarget] };
      });
      const labelTexture = titleTexture(createCanvas, context => {
        panelText(context, panel.title, 0, 0.96, plan.conceptId === "330" ? 45 : 34, "#edf4fa", "center");
        panelText(context, panel.subtitle, 0, 0.80, 25, "#b5c3d0", "center");
        panel.items.forEach((item, index) => {
          const shortName = plan.conceptId === "330" ? `${item.row.outcome} assessment` :
            item.row.id === "gfw-fishing-untracked" ? "Industrial fishing" :
              item.row.id === "gfw-other-untracked" ? "Transport and energy" : item.row.name;
          if (plan.conceptId === "330") {
            panelText(context, shortName, -0.75, rowY[index] + 0.15, 37, item.color);
            panelText(context, `${item.point} SD`, -0.75, rowY[index] - 0.16, 52, item.color);
            panelText(context, `±${item.row.standardError} robust SE`, 0.75, rowY[index] - 0.16, 30, "#b5c3d0", "right");
          } else panelText(context, `${shortName} · ${item.label}`, -0.75, rowY[index] + 0.11,
            panel.items.length > 2 ? 24 : 34, item.color);
        });
        if (panel.context) panel.context.forEach((text, index) =>
          panelText(context, text, 0, 0.38 - index * 0.22, 30, "#edf4fa", "center"));
        else for (let tick = 0; tick <= 4; tick++) {
          const value = panel.domain[1] * tick / 4;
          panelText(context, `${Number(value.toFixed(3))}`, -0.75 + 1.5 * tick / 4, -0.85, 23, "#b5c3d0", "center");
        }
        if (!panel.context) panelText(context, `Scale: ${panel.domain[0]}–${panel.domain[1]} ${panel.unit}`, 0, -0.98, 22, "#b5c3d0", "center");
        panelText(context, panel.footer, 0, -1.085, 20, "#b5c3d0", "center");
      }, textures);
      const labels = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 2.25),
        new THREE.MeshBasicMaterial({ map: labelTexture, transparent: true, depthWrite: false }));
      labels.position.z = 0.018; group.add(labels);
    }
    const brackets = line([[-1.12, -0.35, 0.9], [-1.12, 0.35, 0.9],
      [-1.12, 0.35, 0.9], [-1.05, 0.35, 0.9],
      [-1.12, -0.35, 0.9], [-1.05, -0.35, 0.9]], "#b5c3d0", 0.26);
    ambient.add(brackets);
    if (plan.conceptId === "193-5") ambient.rotation.y = Math.PI;
    animateAmbient = time => { ambient.position.x = 0.012 * Math.sin(TAU * time / plan.period); };
  } else {
    const dashPositions = new Float32Array(plan.items.length * 2 * 3);
    const returnPoints = [];
    const spaces = [];
    plan.items.forEach((item, index) => {
      const face = index * TAU / plan.items.length;
      const group = new THREE.Group();
      group.rotation.y = face;
      group.position.set(Math.sin(face) * 0.92, 0, Math.cos(face) * 0.92);
      measured.add(group);
      group.add(new THREE.Mesh(new THREE.RingGeometry(0.31, 0.33, 96), colorMaterial("#344b55")));
      const arc = new THREE.Mesh(new THREE.RingGeometry(0.305, 0.335,
        Math.max(3, Math.ceil(item.row.value)), 1, Math.PI / 2 - item.angle, item.angle), colorMaterial(item.color));
      arc.userData = { rowId: item.row.id, nativeAngle: item.angle, qualifier: item.qualifier, point: null };
      group.add(arc);
      terminal(group, Math.sin(item.angle) * 0.32, Math.cos(item.angle) * 0.32, item.color, item.qualifier);
      const texture = titleTexture(createCanvas, context => {
        panelText(context, item.row.name, 0, 0.16, 80, "#edf4fa", "center");
        panelText(context, item.label, 0, -0.09, 70, item.color, "center");
        panelText(context, "of operating year", 0, -0.34, 50, "#b5c3d0", "center");
      }, textures);
      const label = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62),
        new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }));
      label.position.z = 0.02; group.add(label);
      group.updateMatrix();
      const toWorld = vector => vector.applyMatrix4(group.matrix);
      spaces.push(group.matrix.clone());
      for (let j = 0; j < 96; j++)
        returnPoints.push(toWorld(new THREE.Vector3(Math.sin(j * TAU / 96) * 0.39, Math.cos(j * TAU / 96) * 0.39, -0.02)),
          toWorld(new THREE.Vector3(Math.sin((j + 1) * TAU / 96) * 0.39, Math.cos((j + 1) * TAU / 96) * 0.39, -0.02)));
      markers[index] = {
        row: item.row, index, center: group.position.clone(), base: group.position.clone(),
        normal: new THREE.Vector3(Math.sin(face), 0, Math.cos(face)), focusRotation: [0, -face, 0],
        hitPoints: Array.from({ length: 24 }, (_, i) => toWorld(new THREE.Vector3(
          Math.sin(i * TAU / 24) * 0.32, Math.cos(i * TAU / 24) * 0.32, 0.02))),
      };
    });
    ambient.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(returnPoints),
      new THREE.LineBasicMaterial({ color: 0xb5c3d0, opacity: 0.26, transparent: true })));
    const dashGeometry = new THREE.BufferGeometry();
    dashGeometry.setAttribute("position", new THREE.BufferAttribute(dashPositions, 3));
    ambient.add(new THREE.LineSegments(dashGeometry,
      new THREE.LineBasicMaterial({ color: 0xb5c3d0, opacity: 0.26, transparent: true })));
    const point = new THREE.Vector3();
    animateAmbient = time => {
      spaces.forEach((matrix, index) => {
        const angle = TAU * (time / plan.period + index / spaces.length);
        for (let end = 0; end < 2; end++) {
          const radius = 0.39 + (end ? 0.012 : -0.012);
          point.set(Math.sin(angle) * radius, Math.cos(angle) * radius, -0.02).applyMatrix4(matrix);
          point.toArray(dashPositions, (index * 2 + end) * 3);
        }
      });
      dashGeometry.attributes.position.needsUpdate = true;
    };
  }
  const ring = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(Array.from({ length: 32 }, (_, i) =>
      new THREE.Vector3(Math.cos(i * TAU / 32) * 0.05, Math.sin(i * TAU / 32) * 0.05, 0))),
    new THREE.LineBasicMaterial({ color: 0xffffff }),
  );
  ring.visible = false; selection.add(ring);
  const extraRings = [];
  if (plan.conceptId === "193-5") {
    const duplicate = ring.clone();
    duplicate.visible = false;
    selection.add(duplicate); extraRings.push(duplicate);
  }
  const layer = {
    world, measured, ambient, shell, selection, markers, ring, extraRings, textures, plan,
    period: plan.period, frameRadius: plan.kind === "rails" ? 1.48 : 1.35, animateAmbient,
  };
  animateAmbient(0);
  return layer;
}
