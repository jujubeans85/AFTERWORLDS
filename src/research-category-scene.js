import * as THREE from "./vendor/three.module.js";
import { categoryInstrumentPlan } from "./research-categories.js";

const TAU = Math.PI * 2;
const material = color => new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
const segments = (points, color = "#536872", opacity = 1) => new THREE.LineSegments(
  new THREE.BufferGeometry().setFromPoints(points.map(point => new THREE.Vector3(...point))),
  new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity }));
function wrap(text, columns = 25) {
  const lines = [];
  for (const word of String(text ?? "").split(/\s+/)) {
    if (!lines.length || lines.at(-1).length + word.length + 1 > columns) lines.push(word);
    else lines[lines.length - 1] += ` ${word}`;
  }
  return lines;
}
export function createCategoryScene(research, { createCanvas = () => document.createElement("canvas") } = {}) {
  const plan = categoryInstrumentPlan(research);
  const world = new THREE.Group(), measured = new THREE.Group(), ambient = new THREE.Group();
  const shell = new THREE.Group(), selection = new THREE.Group();
  world.add(measured, ambient, shell, selection);
  measured.name = "measured-source-categorical-representation";
  ambient.name = "ambient-frame-not-measured-change";
  const textures = [], markers = new Array(plan.items.length), members = [], panels = [], sourceNodes = [], sourceLinks = [];
  function textPlane(parent, entries, width = 1.25, height = 2.3, back = false, z = 0.04) {
    const canvas = createCanvas(); canvas.width = 1024; canvas.height = Math.round(1024 * height / width);
    const context = canvas.getContext("2d");
    if (!context) throw Error("Categorical evidence labels require a 2D canvas.");
    context.clearRect(0, 0, canvas.width, canvas.height);
    for (const [text, x, y, size = 34, color = "#b5c3d0"] of entries) {
      context.font = `${size}px sans-serif`; context.textAlign = "center"; context.fillStyle = color;
      context.fillText(text, (x / width + 0.5) * canvas.width, (0.5 - y / height) * canvas.height);
    }
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; textures.push(texture);
    const labels = new THREE.Mesh(new THREE.PlaneGeometry(width, height),
      new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }));
    labels.position.z = back ? -z : z; if (back) labels.rotation.y = Math.PI;
    parent.add(labels); return labels;
  }
  const addMarker = (item, group, localPoints) => {
    group.updateMatrix();
    const normal = new THREE.Vector3(0, 0, 1).transformDirection(group.matrix);
    markers[item.index] = { row: item.row, index: item.index, normal,
      center: group.position.clone(),
      base: new THREE.Vector3(-0.48, 0.94, 0.15).applyMatrix4(group.matrix),
      hitPoints: localPoints.map(point => point.applyMatrix4(group.matrix)),
      focusRotation: [0, -group.rotation.y, 0] };
  };
  const pageProfile = ["pages", "portfolios", "books", "ledger", "workflow"].includes(plan.profile);
  if (plan.profile === "partnership") {
    const cloud = plan.nodes.filter(node => node.role === "cloud"), model = plan.nodes.filter(node => node.role === "model");
    const nodePositions = new Map();
    plan.nodes.forEach(node => {
      const group = node.role === "cloud" ? cloud : model, index = group.indexOf(node);
      const position = new THREE.Vector3(node.role === "cloud" ? -0.76 : 0.76,
        (group.length - 1) * 0.45 - index * 0.9, node.name === "Anthropic" ? 0.25 : 0);
      nodePositions.set(node.name, position);
      const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.14, 20, 12),
        material(node.role === "cloud" ? "#88bdf4" : "#57d5c4"));
      sphere.position.copy(position); sphere.userData = { entity: node.name, role: node.role };
      measured.add(sphere); sourceNodes.push(sphere);
      const labels = new THREE.Group(); labels.position.copy(position); measured.add(labels);
      textPlane(labels, [[node.name, 0, -0.23, 58, "#edf4fa"], [node.role, 0, -0.34, 32]], 0.8, 0.8);
    });
    plan.items.forEach(item => {
      const from = nodePositions.get(item.row.fromEntity), to = nodePositions.get(item.row.toEntity);
      const midpoint = from.clone().add(to).multiplyScalar(0.5); midpoint.z = 0.48;
      const curve = new THREE.QuadraticBezierCurve3(from, midpoint, to);
      const edge = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(48)),
        new THREE.LineBasicMaterial({ color: "#8a939f" }));
      edge.userData = { rowId: item.row.id, fromEntity: item.row.fromEntity, toEntity: item.row.toEntity, directed: false };
      measured.add(edge); sourceLinks.push(edge);
      const center = curve.getPoint(0.5);
      markers[item.index] = { row: item.row, index: item.index, base: center.clone(), center,
        normal: new THREE.Vector3(0, 0, 1), hitPoints: curve.getPoints(32), focusRotation: [0, 0, 0] };
    });
  } else {
    if (!pageProfile) shell.add(new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 16), material("#101a22")));
    for (const item of plan.items) {
      const face = item.index * TAU / plan.items.length, group = new THREE.Group();
      group.rotation.y = face; group.position.set(Math.sin(face) * 1.32, 0, Math.cos(face) * 1.32);
      group.userData.sourceFace = face;
      measured.add(group); panels.push(group);
      const width = plan.items.length > 5 ? 1.06 : 1.4, height = 2.3, half = width / 2;
      const geometry = new THREE.PlaneGeometry(width, height, pageProfile ? 20 : 1, 1);
      if (pageProfile) {
        const position = geometry.attributes.position;
        for (let index = 0; index < position.count; index++)
          position.setZ(index, 0.1 * (position.getX(index) / half) ** 2);
        position.needsUpdate = true; geometry.computeVertexNormals();
      }
      group.add(new THREE.Mesh(geometry, material("#101a22")));
      const borderPoints = [];
      const dashed = ["dotted", "outline"].includes(item.pattern);
      for (const [from, to] of [
        [[-half, -1.15, 0.12], [half, -1.15, 0.12]], [[half, -1.15, 0.12], [half, 1.15, 0.12]],
        [[half, 1.15, 0.12], [-half, 1.15, 0.12]], [[-half, 1.15, 0.12], [-half, -1.15, 0.12]],
      ]) {
        const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to);
        for (let step = 0; step < (dashed ? 20 : 1); step++)
          borderPoints.push(a.clone().lerp(b, step / (dashed ? 20 : 1)).toArray(),
            a.clone().lerp(b, (step + (dashed ? 0.45 : 1)) / (dashed ? 20 : 1)).toArray());
      }
      const border = segments(borderPoints, item.color, 0.75);
      border.userData = { rowId: item.row.id, pattern: item.pattern }; group.add(border);
      const entries = wrap(plan.profile === "celestial" ? item.row.archiveName : item.row.name, plan.items.length > 5 ? 22 : 28)
        .map((text, index) => [text, 0, 0.98 - index * 0.09, 43, "#edf4fa"]);
      const numericText = ["architecture", "amount-text", "metric-text"].includes(plan.profile);
      if (numericText) {
        entries.push([item.displayValue, 0, 0.42, 62, item.color]);
        wrap(item.row.unit, 28).forEach((text, index) => entries.push([text, 0, 0.27 - index * 0.08, 35, item.color]));
      } else {
        wrap(item.displayValue, 26).forEach((text, index) => entries.push([text, 0, 0.46 - index * 0.085, 36, item.color]));
      }
      wrap(item.row.period, 29).forEach((text, index) => entries.push([text, 0, -0.93 - index * 0.065, 27]));
      if (plan.profile === "workflow") {
        group.add(segments([[-0.18, -0.20, 0.14], [0.18, -0.20, 0.14],
          [0.18, -0.20, 0.14], [0.18, -0.05, 0.14], [0.18, -0.05, 0.14], [-0.18, -0.05, 0.14],
          [-0.18, -0.05, 0.14], [-0.18, -0.20, 0.14],
          [0, -0.20, 0.14], [0, -0.43, 0.14], [0, -0.43, 0.14], [-0.04, -0.37, 0.14],
          [0, -0.43, 0.14], [0.04, -0.37, 0.14]], "#57d5c4"));
        const head = new THREE.Mesh(new THREE.RingGeometry(0.035, 0.045, 24), material("#edf4fa"));
        head.position.set(0, -0.50, 0.14); group.add(head);
        group.add(segments([[-0.08, -0.64, 0.14], [-0.08, -0.58, 0.14], [-0.08, -0.58, 0.14],
          [0.08, -0.58, 0.14], [0.08, -0.58, 0.14], [0.08, -0.64, 0.14]], "#edf4fa"));
        entries.push([`Final decision: ${item.row.finalDecision}`, 0, -0.78, 32, "#edf4fa"]);
      }
      if (plan.profile === "architecture") {
        const points = [];
        for (let layer = 0; layer < (item.index ? 3 : 1); layer++) {
          const y = -0.35 - layer * 0.09;
          points.push([-0.27, y, 0.14], [0.27, y, 0.14], [0.27, y, 0.14], [0.27, y - 0.15, 0.14],
            [0.27, y - 0.15, 0.14], [-0.27, y - 0.15, 0.14], [-0.27, y - 0.15, 0.14], [-0.27, y, 0.14]);
        }
        group.add(segments(points, item.color));
        entries.push([item.index ? "Floorspace · announcement" : "Land boundary · announcement", 0, -0.78, 29]);
      }
      if (plan.profile === "celestial") {
        const token = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 16), material("#b9d9f5"));
        token.position.set(0, -0.25, 0.14); token.userData = { rowId: item.row.id, physicalRadius: false }; group.add(token);
        entries.push([`Host: ${item.row.hostStar}`, 0, -0.60, 38], ["Equal tokens; not planet radii", 0, -0.76, 27]);
      }
      if (item.clock) {
        const clock = new THREE.Group(); clock.position.set(0, -0.42, 0.14); group.add(clock);
        clock.add(new THREE.Mesh(new THREE.RingGeometry(0.215, 0.225, 96), material("#536872")));
        const angle = TAU * 4 / 24;
        const arc = new THREE.Mesh(new THREE.RingGeometry(0.205, 0.235, 24, 1,
          Math.PI / 2 - TAU * 21 / 24, angle), material(item.color));
        arc.userData = { rowId: item.row.id, startHour: 17, endHour: 21, denominator: 24 }; clock.add(arc);
        entries.push(["17:00–21:00 · documented schedule", 0, -0.76, 25]);
      }
      if (plan.profile === "membership") {
        const detail = new THREE.Group(); detail.visible = false; group.add(detail); members.push(detail);
        const tokenText = [];
        item.members.forEach((member, index) => {
          const x = ((index % 2) - 0.5) * 0.46, y = -0.18 - Math.floor(index / 2) * 0.23;
          const token = new THREE.Mesh(new THREE.CircleGeometry(0.045, 24), material(member.host ? "#57d5c4" : "#88bdf4"));
          token.position.set(x, y, 0.15); token.userData = { name: member.name, host: member.host, role: member.host ? "H" : "M" };
          detail.add(token);
          tokenText.push([member.host ? "H" : "M", x, y - 0.01, 24, "#101a22"], [member.name, x, y - 0.1, 23]);
        });
        textPlane(detail, tokenText, width, height, false, 0.16);
        entries.push(["Select to reveal equal member tokens", 0, -0.78, 24]);
      }
      if (["amount-text", "metric-text"].includes(plan.profile)) {
        const definition = plan.profile === "amount-text" ? item.row.caseStatusAtPublication :
          item.index < 3 ? "Individual-level observational measure" : "Collective observational measure";
        wrap(definition, 28).forEach((text, index) => entries.push([text, 0, -0.47 - index * 0.08, 30]));
      }
      if (plan.profile === "books") {
        group.add(segments([[-half - 0.04, -1.1, -0.03], [-half - 0.04, 1.1, -0.03],
          [-half - 0.07, -1.1, -0.06], [-half - 0.07, 1.1, -0.06]], item.color));
      }
      if (plan.profile === "pages") {
        const pattern = item.index + 1;
        for (let i = 0; i < pattern; i++)
          group.add(segments([[-0.14 + i * 0.08, -0.40, 0.14], [-0.14 + i * 0.08, -0.52, 0.14]], item.color));
      }
      textPlane(group, entries, width, height, false, pageProfile ? 0.14 : 0.16);
      const backLines = [item.row.name, ...item.reverse.filter(Boolean), item.row.period].flatMap(text => wrap(text, 29));
      textPlane(group, backLines.map((text, index) => [text, 0, 0.97 - index * Math.min(0.105, 1.92 / Math.max(1, backLines.length)), 29]), width, height, true, 0.03);
      addMarker(item, group, Array.from({ length: 20 }, (_, index) =>
        new THREE.Vector3((index % 4 - 1.5) * width / 5, 0.8 - Math.floor(index / 4) * 0.4, 0.17)));
    }
    for (const [from, to] of plan.links) {
      const a = panels[from].position.clone(), b = panels[to].position.clone();
      const curve = new THREE.QuadraticBezierCurve3(a, new THREE.Vector3(0, -0.5, 0), b);
      const edge = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(48)),
        new THREE.LineBasicMaterial({ color: "#8a939f" }));
      edge.userData = { from: plan.items[from].row.id, to: plan.items[to].row.id, directed: plan.profile === "mandate" };
      measured.add(edge); sourceLinks.push(edge);
      if (plan.profile === "mandate") {
        const p = curve.getPoint(0.7), direction = curve.getTangent(0.7);
        const arrow = new THREE.ArrowHelper(direction, p, 0.14, "#8a939f", 0.07, 0.04);
        measured.add(arrow);
        const caption = new THREE.Group(); caption.position.set(0, -0.65, 0.3); measured.add(caption);
        textPlane(caption, [["Annual report presented at Dialogue", 0, 0, 43]], 1.4, 0.3);
      }
    }
    if (plan.chronological.length) {
      const radius = 1.62, y = -1.38;
      measured.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 128 }, (_, index) =>
        new THREE.Vector3(Math.sin(index * TAU / 128) * radius, y, Math.cos(index * TAU / 128) * radius))),
        new THREE.LineBasicMaterial({ color: "#536872" })));
      plan.chronological.forEach((item, index) => {
        const angle = index * TAU / plan.chronological.length, date = new THREE.Group();
        date.position.set(Math.sin(angle) * radius, y, Math.cos(angle) * radius); date.rotation.y = angle; measured.add(date);
        date.userData = { rowId: item.row.id, announcementDate: item.row.announcementDate, chronologicalSlot: index };
        textPlane(date, [[item.row.announcementDate, 0, 0, 45, item.color], [item.row.name, 0, -0.1, 27]], 0.8, 0.3);
      });
    }
  }
  // Every decorative profile is neutral and separate from source text and links.
  const framePoints = [];
  if (["cage-precession", "reference-ring-trace", "closed-return-trace"].includes(plan.recipe)) {
    for (let plane = 0; plane < (plan.recipe === "cage-precession" ? 3 : 1); plane++)
      for (let i = 0; i < 128; i += plan.recipe === "closed-return-trace" ? 2 : 1) for (const j of [i, i + 1]) {
        const a = j * TAU / 128, radius = plan.profile === "partnership" ? 1.45 : 1.95;
        framePoints.push(plane === 0 ? [Math.sin(a) * radius, Math.cos(a) * radius, 0] :
          plane === 1 ? [Math.sin(a) * radius, 0, Math.cos(a) * radius] : [0, Math.sin(a) * radius, Math.cos(a) * radius]);
      }
  } else {
    for (const panel of panels) {
      panel.updateMatrix();
      for (const p of [[-0.76, -1.2, -0.05], [0.76, -1.2, -0.05], [0.76, -1.2, -0.05], [0.76, 1.2, -0.05],
        [0.76, 1.2, -0.05], [-0.76, 1.2, -0.05], [-0.76, 1.2, -0.05], [-0.76, -1.2, -0.05]])
        framePoints.push(new THREE.Vector3(...p).applyMatrix4(panel.matrix).toArray());
    }
  }
  const frame = segments(framePoints, "#b5c3d0", 0.24); ambient.add(frame);
  let animateAmbient;
  if (plan.recipe === "cage-precession") animateAmbient = time => { ambient.rotation.set(0.13, time * TAU / plan.period, 0); };
  else if (plan.recipe === "page-edge-parallax") animateAmbient = time => { ambient.rotation.y = Math.sin(time * TAU / plan.period) * Math.PI / 90; };
  else if (plan.recipe === "counterframe-slide") {
    ambient.remove(frame); frame.geometry.dispose(); frame.material.dispose();
    const first = segments(framePoints.slice(0, 8), "#b5c3d0", 0.24);
    const second = segments(framePoints.slice(8), "#b5c3d0", 0.24);
    ambient.add(first, second);
    animateAmbient = time => {
      first.position.x = Math.sin(time * TAU / plan.period) * 0.012;
      second.position.x = -first.position.x;
    };
  }
  else {
    const count = plan.recipe === "facet-seam-trace" ? panels.length : 1;
    const buffer = new Float32Array(count * 6), geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(buffer, 3));
    ambient.add(new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: "#b5c3d0", transparent: true, opacity: 0.28 })));
    animateAmbient = time => {
      for (let index = 0; index < count; index++) {
        const offset = (time / plan.period + index / count) % 1;
        const segmentCount = plan.recipe === "facet-seam-trace" ? 4 : framePoints.length / 2;
        const segment = Math.floor(offset * segmentCount);
        const base = plan.recipe === "facet-seam-trace" ? index * 8 : 0;
        const a = framePoints[base + segment * 2], b = framePoints[base + segment * 2 + 1];
        const t = offset * segmentCount - segment;
        for (let end = 0; end < 2; end++) for (let axis = 0; axis < 3; axis++)
          buffer[index * 6 + end * 3 + axis] = a[axis] + (b[axis] - a[axis]) * Math.min(1, t + end * 0.12);
      }
      geometry.attributes.position.needsUpdate = true;
    };
  }
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.035, 0.044, 32), material("#ffffff"));
  ring.visible = false; selection.add(ring); animateAmbient(0);
  return { world, measured, ambient, shell, selection, markers, ring, textures, plan, panels, sourceNodes, sourceLinks, members,
    period: plan.period, animateAmbient,
    setReverseEvidence: panels.length ? enabled => panels.forEach(panel => {
      panel.rotation.y = panel.userData.sourceFace + (enabled ? Math.PI : 0);
    }) : null,
    onSelect: index => members.forEach((group, memberIndex) => { group.visible = index === memberIndex; }),
    frameRadius: plan.profile === "dates" ? 2.1 : plan.profile === "partnership" ? 1.55 : 1.95 };
}
