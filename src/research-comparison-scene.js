import * as THREE from "./vendor/three.module.js";
import { comparisonInstrumentPlan } from "./research-comparisons.js";

const TAU = 2 * Math.PI;
const material = color => new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
const line = (points, color = "#536872", opacity = 1) => new THREE.LineSegments(
  new THREE.BufferGeometry().setFromPoints(points.map(point => new THREE.Vector3(...point))),
  new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity }));
function wrap(value, length) {
  const result = [];
  for (const word of value.split(" ")) {
    if (!result.length || result.at(-1).length + word.length + 1 > length) result.push(word);
    else result[result.length - 1] += ` ${word}`;
  }
  return result;
}
export function createComparisonScene(research, { createCanvas = () => document.createElement("canvas") } = {}) {
  const plan = comparisonInstrumentPlan(research);
  const world = new THREE.Group(), measured = new THREE.Group(), ambient = new THREE.Group();
  const shell = new THREE.Group(), selection = new THREE.Group();
  world.add(measured, ambient, shell, selection);
  measured.name = "measured-native-comparison-facets";
  ambient.name = "ambient-frame-not-measured-change";
  const markers = new Array(plan.items.length), textures = [], values = [], intervals = [], panels = [], metricFrames = [];
  const radius = plan.panels.length > 4 ? 1.7 : 1.0;
  const width = Math.min(1.8, 2 * radius * Math.tan(Math.PI / plan.panels.length) * 0.86);
  const edge = width / 2 - 0.15, xAt = value => -edge + 2 * edge * value / plan.domain[1];
  function textPlane(group, entries, w = width, h = 2.3, hud = false) {
    const canvas = createCanvas(); canvas.width = 1024; canvas.height = Math.round(1024 * h / w);
    const context = canvas.getContext("2d");
    if (!context) throw Error("Comparison labels require a 2D canvas.");
    context.clearRect(0, 0, canvas.width, canvas.height);
    for (const [text, x, y, size = 32, color = "#b5c3d0"] of entries) {
      context.font = `${size}px sans-serif`;
      const measuredWidth = context.measureText ? context.measureText(text).width : text.length * size * 0.62;
      const availableWidth = canvas.width * (0.94 - 2 * Math.abs(x) / w);
      if (measuredWidth > availableWidth) context.font = `${size * Math.max(0.05, availableWidth) / measuredWidth}px sans-serif`;
      context.textAlign = "center"; context.fillStyle = color;
      context.fillText(text, (x / w + 0.5) * canvas.width, (0.5 - y / h) * canvas.height);
    }
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; textures.push(texture);
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, depthTest: !hud }));
    mesh.position.z = 0.05; group.add(mesh);
  }
  for (const panel of plan.panels) {
    const group = new THREE.Group(); group.rotation.y = panel.face;
    group.position.set(Math.sin(panel.face) * radius, 0, Math.cos(panel.face) * radius);
    measured.add(group); panels.push(group);
    group.add(new THREE.Mesh(new THREE.PlaneGeometry(width, 2.3), material("#101a22")));
    const entries = wrap(panel.key, width < 1.3 ? 21 : 29).map((text, index) =>
      [text, 0, 0.99 - index * 0.085, 39, "#edf4fa"]);
    const shared = plan.conceptId === "218";
    const stems = plan.conceptId === "115-2";
    const pointPositions = [];
    panel.items.forEach((item, offset) => {
      const shipment = plan.conceptId === "214" && panel.key === "Shipments";
      const y = shared ? 0.05 : shipment ? item.kind === "reported-total" ? -0.37 : 0.27 :
        panel.items.length === 2 ? 0.30 - offset * 0.66 : 0.56 - offset * 0.34;
      const x = stems ? offset ? edge * 0.5 : -edge * 0.5 : xAt(item.row.value);
      const yPoint = stems ? -0.52 + item.fraction * 1.05 : y;
      if (stems) {
        group.add(line([[x, -0.52, 0.015], [x, 0.53, 0.015]], "#344b55"));
        const stem = line([[x, -0.52, 0.03], [x, yPoint, 0.03]], item.color);
        stem.userData = { rowId: item.row.id, value: item.row.value, fraction: item.fraction, kind: "stem" };
        group.add(stem); values.push(stem);
      } else if (!shared || offset === 0) group.add(line([[-edge, y, 0.015], [edge, y, 0.015]], "#344b55"));
      let quantity;
      if (["bar", "reported-total", "open-lower-bar"].includes(item.kind)) {
        const left = xAt(item.stackStart), right = xAt(item.stackStart + item.row.value);
        if (item.kind === "reported-total") quantity = line([[left, y - 0.026, 0.03], [right, y - 0.026, 0.03],
          [right, y - 0.026, 0.03], [right, y + 0.026, 0.03], [right, y + 0.026, 0.03], [left, y + 0.026, 0.03],
          [left, y + 0.026, 0.03], [left, y - 0.026, 0.03]], item.color);
        else {
          quantity = new THREE.Mesh(new THREE.PlaneGeometry(right - left, 0.038), material(item.color));
          quantity.position.set((left + right) / 2, y, 0.025); quantity.visible = right > left;
        }
        if (item.kind === "open-lower-bar") {
          group.add(line([[right - 0.045, y - 0.042, 0.04], [right + 0.025, y, 0.04],
            [right + 0.025, y, 0.04], [right - 0.045, y + 0.042, 0.04]], item.color));
        } else if (item.row.qualifier === "approximately")
          group.add(line([[right, y - 0.045, 0.04], [right, y - 0.015, 0.04],
            [right, y + 0.015, 0.04], [right, y + 0.045, 0.04]], item.color));
        quantity.userData = { rowId: item.row.id, value: item.row.value, stackStart: item.stackStart, kind: item.kind, qualifier: item.row.qualifier };
      } else {
        quantity = new THREE.Mesh(new THREE.RingGeometry(0.023, 0.033, 24), material(item.color));
        quantity.position.set(x, yPoint, 0.04);
        quantity.userData = { rowId: item.row.id, value: item.row.value, fraction: item.fraction, kind: "point" };
      }
      group.add(quantity); values.push(quantity);
      pointPositions.push([x, y, 0.025]);
      if (item.interval) {
        const [lower, upper] = item.interval;
        const whisker = line([[xAt(lower), y, 0.028], [xAt(upper), y, 0.028],
          [xAt(lower), y - 0.04, 0.028], [xAt(lower), y + 0.04, 0.028],
          [xAt(upper), y - 0.04, 0.028], [xAt(upper), y + 0.04, 0.028]], item.color);
        whisker.userData = { rowId: item.row.id, lower, upper, confidenceLevel: item.row.confidenceLevel };
        group.add(whisker); intervals.push(whisker);
      }
      if (stems) {
        entries.push([item.row.metric === "producer_accuracy" ? "Producer" : "User", x, 0.73, 35, item.color],
          [`${item.row.value}%`, x, -0.69, 39, item.color], [`(${item.row.publishedParentheticalUncertainty})`, x, -0.80, 28],
          ["Published parenthetical; no CI inferred", 0, -0.97, 24]);
      } else if (shared) {
        entries.push([item.row.name.replace("Gemma4 ", "Gemma4\n").replace("Gemma3 ", "Gemma3\n").split("\n").join(" "),
          0, offset ? -0.40 : 0.54, 28, item.color],
        [`${item.row.value}% · ${item.row.configuration}`, 0, offset ? -0.52 : 0.41, 28, item.color]);
      } else {
        const title = shipment && item.kind !== "reported-total"
          ? `${item.label}: ${item.displayValue}` : `${item.label} · ${item.displayValue}`;
        const labelY = shipment && item.row.id === "jara-exp25" ? 0.61 : y + 0.14;
        wrap(title, width < 1.3 ? 25 : 40).forEach((text, index) => entries.push([text, 0, labelY - index * 0.063, 31, item.color]));
        if (item.supportingText) wrap(item.supportingText, 36).forEach((text, index) =>
          entries.push([text, 0, y - 0.14 - index * 0.06, 25]));
        if (item.interval) {
          entries.push([`95% CI ${item.interval[0]}–${item.interval[1]}`, 0, y - 0.13, 27]);
        }
      }
      group.updateMatrix();
      const normal = new THREE.Vector3(Math.sin(panel.face), 0, Math.cos(panel.face));
      const selectionX = shipment && item.kind !== "reported-total" ? xAt(item.stackStart + item.row.value / 2) : stems || shared ? x : -edge - 0.05;
      const position = new THREE.Vector3(selectionX, yPoint, 0.055);
      markers[item.index] = { row: item.row, index: item.index, normal,
        center: new THREE.Vector3(shipment && item.kind !== "reported-total" ? selectionX : x, yPoint, 0.055).applyMatrix4(group.matrix),
        base: position.applyMatrix4(group.matrix), focusRotation: [0, -panel.face, 0],
        hitPoints: shared || stems ? [new THREE.Vector3(x, yPoint, 0.055).applyMatrix4(group.matrix)] :
          Array.from({ length: 20 }, (_, i) => new THREE.Vector3(shipment && item.kind !== "reported-total"
            ? xAt(item.stackStart + item.row.value * i / 19) : -edge + 2 * edge * i / 19, y, 0.055).applyMatrix4(group.matrix)) };
      if (plan.metrics.length) {
        const frame = line([[-edge - 0.045, y - 0.08, 0.06], [-edge - 0.045, y + 0.08, 0.06],
          [edge + 0.045, y - 0.08, 0.06], [edge + 0.045, y + 0.08, 0.06]], "#edf4fa");
        frame.position.copy(group.position); frame.rotation.copy(group.rotation);
        frame.userData.metric = item.row.metric; selection.add(frame); metricFrames.push(frame);
      }
    });
    if (shared) group.add(line(pointPositions, "#b5c3d0", 0.7));
    entries.push([`0–${plan.domain[1]} ${plan.domain[1] === 1 ? plan.conceptId === "398" ? "water-deficit index" : "source fraction" : plan.conceptId === "211-4" ? "crashed vehicles / million vehicle-miles" : plan.conceptId === "214" ? "robots/year" : "%"}`,
      0, -1.08, 26]);
    if (plan.conceptId === "392") entries.push(["Shared test N=12", 0, -0.91, 29, "#f2ba68"]);
    if (plan.conceptId === "398") entries.push(["Different hardware; nonrandom fields", 0, -0.91, 25]);
    if (plan.conceptId === "323") entries.push(["Rounded source shares; not a closed total", 0, -0.91, 24]);
    if (plan.conceptId === "214") entries.push([panel.key === "Shipments" ? "Components vs reported total; never sum both" :
      "Production is a different accounting measure", 0, -0.91, 24]);
    if (plan.conceptId === "211-4") entries.push(["Waymo:2020-09/2026-06", 0, -0.77, 24],
      ["Human:2022; weighted through2026-06", 0, -0.88, 22], ["32% underreporting correction; observational", 0, -0.97, 21]);
    textPlane(group, entries);
  }
  let hud = null;
  if (plan.warning) {
    hud = new THREE.Group(); hud.position.set(0, -0.48, -2);
    const background = new THREE.Mesh(new THREE.PlaneGeometry(0.87, 0.20),
      new THREE.MeshBasicMaterial({ color: "#101a22", depthTest: false, depthWrite: false }));
    hud.add(background);
    const border = line([[-0.435, -0.1, 0.01], [0.435, -0.1, 0.01], [0.435, -0.1, 0.01], [0.435, 0.1, 0.01],
      [0.435, 0.1, 0.01], [-0.435, 0.1, 0.01], [-0.435, 0.1, 0.01], [-0.435, -0.1, 0.01]], "#f2ba68");
    border.material.depthTest = false; hud.add(border);
    textPlane(hud, [["Shared test N=12", 0, 0.057, 43, "#f2ba68"],
      ["Training years overlap test years", 0, 0, 36, "#f2ba68"],
      ["Source test dates are inconsistent", 0, -0.057, 36, "#f2ba68"]], 0.87, 0.20, true);
    hud.traverse(object => { object.renderOrder = 100; });
  }
  const panelEdge = (group, points) => {
    group.updateMatrix();
    return points.map(p => new THREE.Vector3(...p).applyMatrix4(group.matrix).toArray());
  };
  const frameParts = panels.map(group => panelEdge(group, [
    [-width / 2 - 0.07, -1.17, -0.02], [-width / 2 - 0.07, 1.17, -0.02],
    [-width / 2 - 0.07, 1.17, -0.02], [width / 2 + 0.07, 1.17, -0.02],
    [width / 2 + 0.07, 1.17, -0.02], [width / 2 + 0.07, -1.17, -0.02],
    [width / 2 + 0.07, -1.17, -0.02], [-width / 2 - 0.07, -1.17, -0.02],
  ]));
  let animateAmbient;
  if (plan.recipe === "counterframe-slide") {
    const frames = [0, 1].map(parity => {
      const frame = line(frameParts.filter((_, index) => index % 2 === parity).flat(), "#b5c3d0", 0.24);
      ambient.add(frame); return frame;
    });
    animateAmbient = time => frames.forEach((frame, index) => {
      frame.position.x = Math.sin(time * TAU / plan.period) * (index ? -0.012 : 0.012);
    });
  } else if (["facet-seam-trace", "paired-outline-scan"].includes(plan.recipe)) {
    ambient.add(line(frameParts.flat(), "#b5c3d0", 0.18));
    const ticks = line(panels.flatMap(group => panelEdge(group,
      [[-width / 2 - 0.07, -1, -0.018], [-width / 2 - 0.07, -0.9, -0.018]])), "#b5c3d0", 0.48);
    ambient.add(ticks);
    animateAmbient = time => {
      const phase = ((time / plan.period) % 1 + 1) % 1;
      const points = panels.flatMap(group => {
        if (plan.recipe === "paired-outline-scan") {
          const y = -1.05 + phase * 2.1;
          return panelEdge(group, [[-width / 2 - 0.07, y, -0.018], [-width / 2 + 0.01, y, -0.018]]);
        }
        const corners = [[-width / 2 - 0.07, -1.17], [-width / 2 - 0.07, 1.17],
          [width / 2 + 0.07, 1.17], [width / 2 + 0.07, -1.17]];
        const at = t => {
          const step = (t % 1) * 4, a = corners[Math.floor(step)], b = corners[(Math.floor(step) + 1) % 4], f = step % 1;
          return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, -0.018];
        };
        return panelEdge(group, [at(phase), at(phase + 0.025)]);
      });
      ticks.geometry.attributes.position.array.set(points.flat()); ticks.geometry.attributes.position.needsUpdate = true;
    };
  } else {
    ambient.add(line(panels.flatMap(group => panelEdge(group, [[-width / 2 - 0.07, -0.7, -0.02],
      [-width / 2 - 0.07, 0.7, -0.02], [-width / 2 - 0.07, 0.7, -0.02], [-width / 2, 0.7, -0.02]])), "#b5c3d0", 0.24));
    animateAmbient = time => { ambient.position.x = Math.sin(time * TAU / plan.period) * 0.012; };
  }
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.034, 0.043, 32), material("#ffffff"));
  ring.visible = false; selection.add(ring);
  const setMetric = metric => {
    if (!plan.metrics.includes(metric)) return false;
    metricFrames.forEach(frame => { frame.visible = frame.userData.metric === metric; });
    return true;
  };
  if (plan.metrics.length) setMetric(plan.metrics[0]);
  animateAmbient(0);
  return { world, measured, ambient, shell, selection, markers, ring, textures, plan, panels, values, intervals, hud, metricFrames,
    metrics: plan.metrics, setMetric: plan.metrics.length ? setMetric : null,
    period: plan.period, animateAmbient, frameRadius: plan.panels.length > 4 ? 2.35 : 1.65 };
}
