import * as THREE from "./vendor/three.module.js";
import { percentageInstrumentPlan } from "./research-percentages.js";

const TAU = Math.PI * 2;
const material = color => new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
const lines = (points, color = "#536872", opacity = 1) => new THREE.LineSegments(
  new THREE.BufferGeometry().setFromPoints(points.map(point => new THREE.Vector3(...point))),
  new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity }));
function words(value, count = 32) {
  const result = [];
  for (const word of value.split(" ")) {
    if (!result.length || result.at(-1).length + word.length + 1 > count) result.push(word);
    else result[result.length - 1] += ` ${word}`;
  }
  return result;
}
export function createPercentageScene(research, { createCanvas = () => document.createElement("canvas") } = {}) {
  const plan = percentageInstrumentPlan(research);
  const world = new THREE.Group(), measured = new THREE.Group(), ambient = new THREE.Group();
  const shell = new THREE.Group(), selection = new THREE.Group();
  world.add(measured, ambient, shell, selection);
  measured.name = "measured-native-percentage-instruments";
  ambient.name = "ambient-frame-not-measured-change";
  const markers = [], textures = [], measuredArcs = [], whiskers = [], frames = [];
  const half = plan.kind === "semicircle-pairs";
  const faceGroups = new Map();
  for (const item of plan.items) {
    if (faceGroups.has(item.face)) continue;
    const group = new THREE.Group(); group.rotation.y = item.face;
    group.position.set(Math.sin(item.face) * 0.85, 0, Math.cos(item.face) * 0.85);
    measured.add(group); faceGroups.set(item.face, group);
    group.add(new THREE.Mesh(new THREE.PlaneGeometry(1.8, 2.3), material("#101a22")));
  }
  const labelEntries = new Map([...faceGroups.keys()].map(face => [face, []]));
  for (const item of plan.items) {
    const group = faceGroups.get(item.face), entries = labelEntries.get(item.face);
    const radius = half ? 0.56 : 0.46, y = half ? item.row.sex === "female" ? 0.32 : -0.48 : 0.17;
    const fullAngle = half ? Math.PI : TAU;
    const start = half ? Math.PI - item.angle : Math.PI / 2 - item.angle;
    const ref = new THREE.Mesh(new THREE.RingGeometry(radius - 0.009, radius + 0.009, 128, 1, 0, fullAngle), material("#344b55"));
    ref.position.y = y; ref.position.z = 0.015; group.add(ref);
    let arc;
    if (item.high) {
      const points = [];
      for (let index = 0; index <= 64; index++) {
        const a = start + item.angle * index / 64;
        points.push(new THREE.Vector3(Math.cos(a) * (radius + 0.018), y + Math.sin(a) * (radius + 0.018), 0.027));
      }
      for (let index = 64; index >= 0; index--) {
        const a = start + item.angle * index / 64;
        points.push(new THREE.Vector3(Math.cos(a) * (radius - 0.018), y + Math.sin(a) * (radius - 0.018), 0.027));
      }
      arc = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: item.color }));
    } else {
      arc = new THREE.Mesh(new THREE.RingGeometry(radius - 0.018, radius + 0.018,
        Math.max(3, Math.ceil(item.percent)), 1, start, item.angle), material(item.color));
      arc.position.y = y; arc.position.z = 0.025; arc.visible = item.percent > 0;
    }
    arc.userData = { rowId: item.row.id, percent: item.percent, nativeAngle: item.angle, pattern: item.high ? "outline" : "solid" };
    group.add(arc); measuredArcs.push(arc);
    if (half) {
      entries.push([item.row.sex === "female" ? "F · female-dominated" : "M · male-dominated", 0, y + 0.19, 38, item.color],
        [item.label, 0, y + 0.055, 57, item.color],
        ["0%", -radius, y - 0.075, 29], ["100%", radius, y - 0.075, 29]);
    } else {
      words(item.row.name).forEach((text, index) => entries.push([text, 0, 1.00 - index * 0.09, 38, "#edf4fa"]));
      entries.push([item.label, 0, 0.15, 72, item.color], ["Complete 100% reference", 0, -0.38, 28]);
    }
    if (item.denominatorLabel) {
      words(item.denominatorLabel, 37).forEach((text, index) => entries.push([text, 0, -0.49 - index * 0.07, 33, item.color]));
    }
    if (item.ci95) {
      const yCI = -0.72, xAt = value => -0.62 + 1.24 * value / 100;
      group.add(lines([[-0.62, yCI, 0.015], [0.62, yCI, 0.015]], "#344b55"));
      const whisker = lines([[xAt(item.ci95[0]), yCI, 0.025], [xAt(item.ci95[1]), yCI, 0.025],
        [xAt(item.ci95[0]), yCI - 0.035, 0.025], [xAt(item.ci95[0]), yCI + 0.035, 0.025],
        [xAt(item.ci95[1]), yCI - 0.035, 0.025], [xAt(item.ci95[1]), yCI + 0.035, 0.025]], item.color);
      whisker.userData = { rowId: item.row.id, ci95: item.ci95, domain: [0, 100] };
      group.add(whisker); whiskers.push(whisker);
      entries.push([`95% CI ${item.ci95[0]}–${item.ci95[1]}%`, 0, -0.88, 34],
        ["0", -0.62, -0.82, 24], ["100", 0.62, -0.82, 24],
        ["Completion ≠ vision improvement", 0, -1.05, 26]);
    } else if (plan.conceptId === "233-2") {
      entries.push([`Target: ${item.row.target}`, 0, -0.51, 30],
        [item.index ? "Ranked probability skill" : "Brier skill · excludes arid zero-precipitation cells", 0, -0.63, 26],
        ["PBC-ECMWF vs operationally debiased ECMWF", 0, -0.78, 26],
        ["2016/2024 test years", 0, -0.95, 29]);
    } else if (!half) {
      const note = plan.conceptId === "138-8" ? "Overlapping activities; never add rings" :
        plan.conceptId === "233-2" ? "2016/2024 tests · source baseline" : "Company-selected examples; no water volume";
      entries.push([note, 0, -0.91, 26]);
    }
    group.updateMatrix();
    const normal = new THREE.Vector3(Math.sin(item.face), 0, Math.cos(item.face));
    const points = Array.from({ length: 49 }, (_, index) => {
      const angle = fullAngle * index / 48;
      return new THREE.Vector3(Math.cos(angle) * radius, y + Math.sin(angle) * radius, 0.035).applyMatrix4(group.matrix);
    });
    markers[item.index] = { row: item.row, index: item.index, normal,
      center: new THREE.Vector3(0, y, 0.035).applyMatrix4(group.matrix),
      base: new THREE.Vector3(-0.75, y, 0.035).applyMatrix4(group.matrix),
      hitPoints: points, focusRotation: [0, -item.face, 0] };
    frames.push({ matrix: group.matrix.clone(), y, radius: radius + 0.10, fullAngle });
  }
  for (const [face, group] of faceGroups) {
    const entries = labelEntries.get(face);
    if (half) entries.push([face ? "High exposure · gradients 3–4" : "Any exposure", 0, 1.04, 42, "#edf4fa"],
      ["Share of occupations; not job losses", 0, -0.81, 29],
      ["High exposure is included within any exposure", 0, -0.97, 26]);
    const canvas = createCanvas(); canvas.width = 1024; canvas.height = 1310;
    const context = canvas.getContext("2d");
    if (!context) throw Error("Percentage labels require a 2D canvas.");
    context.clearRect(0, 0, canvas.width, canvas.height);
    for (const [text, x, y, size, color = "#b5c3d0"] of entries) {
      context.font = `${size}px sans-serif`; context.textAlign = "center"; context.fillStyle = color;
      context.fillText(text, (x / 1.8 + 0.5) * canvas.width, (0.5 - y / 2.3) * canvas.height);
    }
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; textures.push(texture);
    const labels = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 2.3),
      new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }));
    labels.position.z = 0.04; group.add(labels);
  }
  const framePoints = [];
  for (const frame of frames) for (let index = 0; index < 96; index++) for (const end of [index, index + 1]) {
    const a = frame.fullAngle * end / 96;
    framePoints.push(new THREE.Vector3(Math.cos(a) * frame.radius,
      frame.y + Math.sin(a) * frame.radius, -0.025).applyMatrix4(frame.matrix));
  }
  ambient.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(framePoints),
    new THREE.LineBasicMaterial({ color: "#b5c3d0", transparent: true, opacity: 0.22 })));
  const data = new Float32Array(frames.length * 6), geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(data, 3));
  ambient.add(new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: "#b5c3d0", transparent: true, opacity: 0.28 })));
  const p = new THREE.Vector3();
  const animateAmbient = time => {
    frames.forEach((frame, index) => {
      const a = (time / plan.period % 1) * frame.fullAngle;
      for (let end = 0; end < 2; end++) {
        const radius = frame.radius + (end ? 0.012 : -0.012);
        p.set(Math.cos(a) * radius, frame.y + Math.sin(a) * radius, -0.025).applyMatrix4(frame.matrix);
        p.toArray(data, index * 6 + end * 3);
      }
    });
    geometry.attributes.position.needsUpdate = true;
  };
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.035, 0.044, 32), material("#ffffff"));
  ring.visible = false; selection.add(ring); animateAmbient(0);
  return { world, measured, ambient, shell, selection, markers, ring, textures, plan, measuredArcs, whiskers,
    period: plan.period, animateAmbient, frameRadius: 1.5 };
}
