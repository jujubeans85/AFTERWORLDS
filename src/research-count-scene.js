import * as THREE from "./vendor/three.module.js";
import { countInstrumentPlan } from "./research-counts.js";

const TAU = Math.PI * 2;
const material = color => new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
const line = (points, color = "#536872", opacity = 1) => new THREE.LineSegments(
  new THREE.BufferGeometry().setFromPoints(points.map(point => new THREE.Vector3(...point))),
  new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity }));
function wrap(value, max = 28) {
  const result = [];
  for (const word of value.split(" ")) {
    if (!result.length || result.at(-1).length + word.length > max) result.push(word);
    else result[result.length - 1] += ` ${word}`;
  }
  return result;
}
export function createCountScene(research, { createCanvas = () => document.createElement("canvas") } = {}) {
  const plan = countInstrumentPlan(research);
  const world = new THREE.Group(), measured = new THREE.Group(), ambient = new THREE.Group();
  const shell = new THREE.Group(), selection = new THREE.Group();
  world.add(measured, ambient, shell, selection);
  measured.name = "measured-source-counts-and-counterweights";
  ambient.name = "ambient-frame-not-measured-change";
  const markers = [], textures = [], countMeshes = [], timeGroups = [];
  const label = (parent, lines, width, height, position = [0, 0, 0.025]) => {
    const canvas = createCanvas(); canvas.width = 1024; canvas.height = Math.round(1024 * height / width);
    const context = canvas.getContext("2d");
    if (!context) throw Error("Count labels require a 2D canvas.");
    context.clearRect(0, 0, canvas.width, canvas.height);
    for (const [text, x, y, size = 36, color = "#b5c3d0"] of lines) {
      context.font = `${size}px sans-serif`; context.fillStyle = color; context.textAlign = "center";
      context.fillText(text, (x / width + 0.5) * canvas.width, (0.5 - y / height) * canvas.height);
    }
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; textures.push(texture);
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(width, height),
      new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }));
    plane.position.set(...position); parent.add(plane); return plane;
  };
  const marker = (item, group, points, focus = null) => {
    group.updateMatrixWorld(true);
    const normal = new THREE.Vector3(0, 0, 1).transformDirection(group.matrixWorld);
    const worldPoints = points.map(point => point.clone().applyMatrix4(group.matrixWorld));
    markers[item.index] = { row: item.row, index: item.index, normal,
      center: group.position.clone(), base: new THREE.Vector3(-0.6, 0.63, 0.035).applyMatrix4(group.matrixWorld),
      hitPoints: worldPoints, focusRotation: focus || [0, -group.rotation.y, 0] };
  };
  let animateAmbient, setTimeBasis;
  if (plan.kind === "mosaic") {
    shell.add(new THREE.Mesh(new THREE.SphereGeometry(0.8, 24, 16), material("#101a22")));
    const seams = [];
    for (const item of plan.items) {
      const face = item.index * TAU / plan.items.length, group = new THREE.Group();
      group.rotation.y = face; group.position.set(Math.sin(face) * 1.05, 0, Math.cos(face) * 1.05);
      measured.add(group);
      group.add(new THREE.Mesh(new THREE.PlaneGeometry(1.42, 1.8), material("#101a22")));
      const cell = plan.conceptId === "333" ? 0.079 : 0.15;
      const columns = plan.conceptId === "333" ? 11 : 4;
      const rows = Math.ceil(item.slots / columns);
      const geometry = new THREE.PlaneGeometry(cell * 0.78, cell * 0.78);
      const tiles = new THREE.InstancedMesh(geometry, material(item.color), item.slots);
      tiles.userData = { rowId: item.row.id, anonymousCount: item.slots, tileSize: cell * 0.78 };
      const matrix = new THREE.Matrix4(), positions = [], patternPoints = [];
      for (let slot = 0; slot < item.slots; slot++) {
        const x = ((slot % columns) - (Math.min(columns, item.slots) - 1) / 2) * cell;
        const y = ((rows - 1) / 2 - Math.floor(slot / columns)) * cell;
        const z = 0.015;
        matrix.makeTranslation(x, y, z); tiles.setMatrixAt(slot, matrix);
        positions.push(new THREE.Vector3(x, y, z + 0.015));
        // Each category has a fixed redundant pattern; no tile is a named entity.
        if (item.index === 1) patternPoints.push([x - cell * 0.22, y, z + 0.005], [x + cell * 0.22, y, z + 0.005]);
        else if (item.index === 2) patternPoints.push([x, y - cell * 0.22, z + 0.005], [x, y + cell * 0.22, z + 0.005]);
        else if (item.index === 3) patternPoints.push([x - cell * 0.2, y - cell * 0.2, z + 0.005], [x + cell * 0.2, y + cell * 0.2, z + 0.005]);
      }
      tiles.instanceMatrix.needsUpdate = true; group.add(tiles); countMeshes.push(tiles);
      if (patternPoints.length) group.add(line(patternPoints, "#101a22"));
      const labels = wrap(item.row.name).map((text, index) => [text, 0, 0.76 - index * 0.072, 43, "#edf4fa"]);
      labels.push([item.label, 0, -0.64, 43, item.color],
        ["Anonymous count positions", 0, -0.79, 30]);
      label(group, labels, 1.42, 1.8);
      marker(item, group, positions);
      group.updateMatrix();
      for (const p of [[-0.76, -0.94, 0], [0.76, -0.94, 0], [0.76, -0.94, 0], [0.76, 0.94, 0],
        [0.76, 0.94, 0], [-0.76, 0.94, 0], [-0.76, 0.94, 0], [-0.76, -0.94, 0]])
        seams.push(new THREE.Vector3(...p).applyMatrix4(group.matrix).toArray());
    }
    if (plan.conceptId === "333") {
      const rim = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 128 }, (_, i) =>
        new THREE.Vector3(Math.sin(i * TAU / 128) * 1.65, Math.cos(i * TAU / 128) * 1.65, 0))),
        new THREE.LineBasicMaterial({ color: 0xb5c3d0, transparent: true, opacity: 0.26 }));
      ambient.add(rim); animateAmbient = time => { ambient.rotation.y = time * TAU / plan.period; };
    } else {
      // Enclosure seams stay neutral; moving dashes follow only those seams.
      ambient.add(line(seams, "#b5c3d0", 0.22));
      const dashes = new THREE.BufferGeometry();
      const positions = new Float32Array(plan.items.length * 6);
      dashes.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      ambient.add(new THREE.LineSegments(dashes, new THREE.LineBasicMaterial({ color: 0xb5c3d0, transparent: true, opacity: 0.28 })));
      animateAmbient = time => {
        plan.items.forEach((item, index) => {
          const edge = ((time / plan.period + index / plan.items.length) % 1) * 4;
          const base = index * 8 + Math.floor(edge) * 2;
          const from = new THREE.Vector3(...seams[base]), to = new THREE.Vector3(...seams[base + 1]);
          from.clone().lerp(to, edge % 1).toArray(positions, index * 6);
          from.clone().lerp(to, Math.min(1, edge % 1 + 0.035)).toArray(positions, index * 6 + 3);
        });
        dashes.attributes.position.needsUpdate = true;
      };
    }
  } else if (plan.kind === "counters") {
    const ambientPoints = [];
    for (const item of plan.items) {
      const group = new THREE.Group();
      group.position.set(item.index ? 0.62 : -0.62, 0, item.index ? -0.12 : 0.12); measured.add(group);
      const points = [];
      for (let slot = 0; slot < 9; slot++) {
        const angle = slot * TAU / 9, x = Math.sin(angle) * 0.38, y = Math.cos(angle) * 0.38;
        const tile = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.12),
          new THREE.MeshBasicMaterial({ color: item.color, side: THREE.DoubleSide, wireframe: slot >= item.row.value }));
        tile.position.set(x, y, 0); tile.rotation.z = -angle;
        tile.userData = { rowId: item.row.id, anonymousSlot: slot, filled: slot < item.row.value };
        group.add(tile); points.push(new THREE.Vector3(x, y, 0.02)); countMeshes.push(tile);
      }
      label(group, [[item.row.comparison, 0, 0.68, 40, "#edf4fa"],
        [`${item.row.value}/9`, 0, 0, 78, item.color], ["Three-month lead", 0, -0.64, 32]], 1.15, 1.5);
      marker(item, group, points, [0, 0, 0]);
      for (let i = 0; i < 96; i++) ambientPoints.push(
        [group.position.x + Math.sin(i * TAU / 96) * 0.48, Math.cos(i * TAU / 96) * 0.48, group.position.z - 0.03],
        [group.position.x + Math.sin((i + 1) * TAU / 96) * 0.48, Math.cos((i + 1) * TAU / 96) * 0.48, group.position.z - 0.03]);
    }
    const back = new THREE.Group(); back.rotation.y = Math.PI; back.position.z = -0.3; measured.add(back);
    back.add(new THREE.Mesh(new THREE.PlaneGeometry(2.25, 1.8), material("#101a22")));
    label(back, [["2012–2020 comparison counts", 0, 0.65, 47, "#edf4fa"],
      ["Six validation years + three test years", 0, 0.32, 37],
      ["Validation years were used for tuning.", 0, 0.10, 35],
      ["Winning year identities are not supplied.", 0, -0.15, 35],
      ["No reconstructed ice edge or win margin.", 0, -0.40, 35]], 2.25, 1.8);
    ambient.add(line(ambientPoints, "#b5c3d0", 0.26));
    const dashPositions = new Float32Array(12), dashGeometry = new THREE.BufferGeometry();
    dashGeometry.setAttribute("position", new THREE.BufferAttribute(dashPositions, 3));
    ambient.add(new THREE.LineSegments(dashGeometry,
      new THREE.LineBasicMaterial({ color: 0xb5c3d0, transparent: true, opacity: 0.26 })));
    animateAmbient = time => {
      const angle = time * TAU / plan.period;
      for (let index = 0; index < 2; index++) for (let end = 0; end < 2; end++) {
        const radius = 0.48 + (end ? 0.013 : -0.013), offset = (index * 2 + end) * 3;
        dashPositions[offset] = (index ? 0.62 : -0.62) + Math.sin(angle) * radius;
        dashPositions[offset + 1] = Math.cos(angle) * radius;
        dashPositions[offset + 2] = index ? -0.15 : 0.09;
      }
      dashGeometry.attributes.position.needsUpdate = true;
    };
  } else {
    for (const [groupIndex, timeBasis] of ["paid and unpaid hours", "paid hours only"].entries()) {
      const group = new THREE.Group(); group.position.x = groupIndex ? 0.52 : -0.52; measured.add(group);
      const items = plan.items.filter(item => item.row.timeBasis === timeBasis);
      const plates = [];
      for (const [offset, item] of items.entries()) {
        const x = offset ? 0.2 : -0.2, y = -0.55 + 1.2 * item.fraction;
        group.add(line([[x, -0.55, 0], [x, 0.65, 0]], "#536872"));
        const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.08), material(item.color));
        plate.position.set(x, y, 0.015); plate.userData = { rowId: item.row.id, value: item.row.value, fraction: item.fraction };
        group.add(plate); plates.push(plate); countMeshes.push(plate);
        label(group, [[item.row.statistic, x, 0.84, 46, item.color],
          [`${item.row.value}`, x, -0.75, 60, item.color]], 0.94, 2.1);
        // Marker coordinates are refreshed only by the explicit denominator switch.
        marker(item, group, [new THREE.Vector3(x, y, 0.03)], [0, 0, 0]);
        markers[item.index].localPoint = new THREE.Vector3(x, y, 0.03);
      }
      label(group, [[timeBasis === "paid hours only" ? "Paid hours only" : "Including unpaid", 0, -0.95, 48],
        [timeBasis === "paid hours only" ? "" : "time", 0, -1.04, 48],
        ["0–10 USD/hour", 0, 1.02, 40]], 0.94, 2.2);
      timeGroups.push({ group, plates, items, timeBasis });
    }
    setTimeBasis = basis => {
      if (!["paid and unpaid hours", "paid hours only"].includes(basis)) return false;
      for (const entry of timeGroups) {
        const active = entry.timeBasis === basis;
        entry.group.position.z = active ? 0.30 : -0.30;
        entry.plates.forEach(plate => { plate.material.wireframe = !active; });
        entry.group.updateMatrix();
        entry.items.forEach(item => {
          const m = markers[item.index];
          m.center = m.localPoint.clone().applyMatrix4(entry.group.matrix);
          m.base = m.center.clone().add(new THREE.Vector3(0, 0.1, 0.01));
          m.hitPoints = [m.center];
        });
      }
      return true;
    };
    setTimeBasis("paid and unpaid hours");
    const sleeveA = line([[-0.8, -0.65, -0.38], [-0.8, 0.75, -0.38]], "#b5c3d0", 0.26);
    const sleeveB = line([[0.8, -0.65, -0.38], [0.8, 0.75, -0.38]], "#b5c3d0", 0.26);
    ambient.add(sleeveA, sleeveB);
    animateAmbient = time => {
      sleeveA.position.x = Math.sin(time * TAU / plan.period) * 0.012;
      sleeveB.position.x = -sleeveA.position.x;
    };
  }
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.035, 0.044, 32), material("#ffffff"));
  ring.visible = false; selection.add(ring); animateAmbient(0);
  return { world, measured, ambient, shell, selection, markers, ring, textures, countMeshes,
    plan, period: plan.period, animateAmbient, setTimeBasis, timeGroups,
    instanced: countMeshes.filter(mesh => mesh.isInstancedMesh),
    frameRadius: plan.kind === "mosaic" ? 1.75 : plan.kind === "counters" ? 1.45 : 1.3 };
}
