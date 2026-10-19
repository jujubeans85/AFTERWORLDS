import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { xyz, markerHeight, fitDistance, escapeHTML } from "../src/math.js";
const read = async (p) =>
  JSON.parse(await fs.readFile(new URL(p, import.meta.url), "utf8"));
const [catalog, registry, evidence] = await Promise.all([
  read("../data/source-catalog.json"),
  read("../dist/assets/registry.json"),
  read("../data/evidence.json"),
]);
test("complete public-gallery coverage survives generation without duplicate routes", async () => {
  assert.equal(catalog.entries.length, 146);
  assert.equal(registry.entries.length, 146);
  assert.deepEqual(
    new Set(registry.entries.map((e) => e.id)),
    new Set(catalog.entries.map((e) => e.id)),
  );
  assert.equal(new Set(registry.entries.map((e) => e.slug)).size, 146);
  for (const e of registry.entries) {
    assert.match(e.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    const html = await fs.readFile(
      new URL(`../dist/globe/${e.slug}/index.html`, import.meta.url),
      "utf8",
    );
    assert.ok(html.includes(escapeHTML(e.newTitle)));
    await fs.access(
      new URL(`../dist/assets/thumbs/${e.slug}.svg`, import.meta.url),
    );
  }
});
test("every evidence layer has a unique source inspiration and auditable data semantics", () => {
  assert.equal(evidence.length, 14);
  const withData = registry.entries.filter((e) => e.dataset);
  assert.equal(withData.length, 14);
  assert.equal(new Set(withData.map((e) => e.dataset.id)).size, 14);
  for (const d of evidence) {
    assert.ok(
      d.metric &&
        d.unit &&
        d.dataYear &&
        d.scope &&
        d.limitations &&
        d.coordinateMeaning,
    );
    assert.ok(["observed", "estimate"].includes(d.status));
    assert.ok(d.sources.length);
    for (const source of d.sources)
      assert.equal(new URL(source.url).protocol, "https:");
    for (const p of d.points) {
      assert.ok(Number.isFinite(p.value) && p.value >= 0);
      assert.ok(p.displayValue && p.note);
      if (d.geographyMode === "geographic") {
        assert.ok(Math.abs(p.lat) <= 90);
        assert.ok(Math.abs(p.lon) <= 180);
      } else {
        assert.equal(p.lat, null);
        assert.equal(p.lon, null);
      }
    }
  }
});
test("forecasts and context indicators cannot silently become current AI-only readings", () => {
  const power = evidence.find((d) => d.id === "power");
  assert.equal(power.dataYear, "2024");
  assert.equal(power.forecast.year, 2030);
  assert.equal(power.forecast.status, "forecast");
  assert.ok(!power.points.some((p) => p.value === power.forecast.value));
  assert.match(power.limitations, /AI-only/);
  const water = evidence.find((d) => d.id === "water");
  assert.equal(water.dataYear, "2023");
  assert.match(water.scope, /United States/);
  assert.match(water.scope, /not AI alone/);
  const work = evidence.find((d) => d.id === "work");
  assert.equal(work.geographyMode, "categorical");
  assert.match(work.limitations, /not unemployment/);
});
test("rounding and upper bounds remain visible in robot observations", () => {
  const d = evidence.find((d) => d.id === "robots");
  const germany = d.points.find((p) => p.name === "Germany");
  assert.match(germany.displayValue, /<|fewer/i);
  const india = d.points.find((p) => p.name === "India");
  assert.match(india.note, /Almost/);
});
test("sphere coordinates and centering are correct globally", () => {
  for (let lat = -85; lat <= 85; lat += 5)
    for (let lon = -180; lon <= 180; lon += 5) {
      const [x, y, z] = xyz(lat, lon);
      assert.ok(Math.abs(Math.hypot(x, y, z) - 1) < 1e-12);
      const yaw = (-lon * Math.PI) / 180,
        pitch = (lat * Math.PI) / 180;
      const xx = x * Math.cos(yaw) + z * Math.sin(yaw),
        zz = -x * Math.sin(yaw) + z * Math.cos(yaw);
      const yy = y * Math.cos(pitch) - zz * Math.sin(pitch),
        zzz = y * Math.sin(pitch) + zz * Math.cos(pitch);
      assert.ok(Math.abs(xx) + Math.abs(yy) < 1e-12);
      assert.ok(zzz > 0.999999);
    }
});
test("linear encoding preserves ratios and does not give zero a fake numerical height", () => {
  assert.equal(markerHeight(0, 100), 0);
  assert.equal(markerHeight(20, 100) / markerHeight(10, 100), 2);
  assert.throws(() => markerHeight(-1, 100));
  assert.throws(() => markerHeight(1, 0));
});
test("default camera contains the outer data sphere across portrait and landscape ratios", () => {
  for (const [w, h] of [
    [280, 400],
    [320, 450],
    [390, 450],
    [760, 650],
    [1200, 800],
    [500, 1000],
  ]) {
    const d = fitDistance(w, h),
      angle = Math.asin(1.54 / d);
    const half = (36 * Math.PI) / 360;
    assert.ok(angle < half);
    assert.ok(angle < Math.atan((Math.tan(half) * w) / h));
  }
});
test("content strings are escaped at markup boundaries", () => {
  assert.equal(
    escapeHTML('<img src=x onerror="alert(1)">&'),
    "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;&amp;",
  );
});
