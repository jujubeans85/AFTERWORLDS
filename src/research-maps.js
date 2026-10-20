import { unwrapRing } from "./math.js";
import { accessColor, polygonContains, ACCESS_OUTSIDE, ACCESS_MISSING } from "./research-geography.js";
export const MAP_CONCEPTS = Object.freeze(["378", "375", "247", "78-4"]);
const PRIMITIVES = { "378": "recorder-detection-and-effort-map", "375": "five-location-count-stems", "247": "programme-membership-country-outlines", "78-4": "country-count-percentage-switch" };
export function geographyInstrumentPlan(research) {
  const id = String(research.design?.conceptId), rows = research.rows || research.dataset?.rows;
  if (!MAP_CONCEPTS.includes(id) || research.design.implementation?.primitive !== PRIMITIVES[id] || !Array.isArray(rows)) throw Error("Unsupported geographic instrument.");
  // Runtime binding validation owns the frozen primitive identity; retain explicit source semantics here.
  const period = research.design.animation.decorative.periodSeconds;
  if (id === "378") {
    const sites = new Map(), keys = new Set();
    const items = rows.map((row, index) => {
      if (!Number.isFinite(row.lat) || !Number.isFinite(row.lon) || ![0, 1, null].includes(row.value) ||
        !(row.uptimeFraction === null || Number.isFinite(row.uptimeFraction) && row.uptimeFraction >= 0 && row.uptimeFraction <= 1) ||
        (row.uptimeFraction === null) !== (row.value === null)) throw Error("Recorder state and effort must remain source-native.");
      const site = sites.get(row.name);
      if (site && (site.lat !== row.lat || site.lon !== row.lon)) throw Error("Inconsistent published recorder coordinates.");
      sites.set(row.name, { name: row.name, lat: row.lat, lon: row.lon });
      const key = `${row.species}|${row.week}|${row.name}`;
      if (keys.has(key)) throw Error("Duplicated recorder species/week/site."); keys.add(key);
      return { row, index, lat: row.lat, lon: row.lon, effortAngle: row.uptimeFraction === null ? null : 2 * Math.PI * row.uptimeFraction,
        state: row.value === null ? "unknown" : row.value === 1 ? "detected" : "not-detected" };
    });
    return { conceptId: id, items, sites: [...sites.values()], species: [...new Set(rows.map(row => row.species))],
      weeks: [...new Set(rows.map(row => row.week))].sort((a, b) => a - b), period };
  }
  if (!research.geography?.countries) throw Error("Audited geographic joins are required.");
  const rowById = new Map(rows.map((row, index) => [row.id, { row, index }])), joined = new Set();
  const maxValue = id === "78-4" ? Math.max(...rows.filter(row => row.value !== null).map(row => row.value)) : null;
  const countries = research.geography.countries.map(country => {
    const match = rowById.get(country.rowId);
    if (!match || joined.has(country.rowId) || match.row.geographicId !== country.geographicId || !country.polygons?.length)
      throw Error("Invalid geographic join.");
    joined.add(country.rowId);
    const polygons = country.polygons.map(polygon => polygon.map(unwrapRing));
    const anchor = country.displayAnchor;
    if (["375", "78-4"].includes(id) && (!anchor || !Number.isFinite(anchor.lat) || !Number.isFinite(anchor.lon) ||
      !polygons.some(polygon => polygonContains(polygon, anchor.lon, anchor.lat)))) throw Error("Country summary requires a validated interior display anchor.");
    const value = match.row.value;
    if (id === "375" && (!Number.isFinite(value) || value < 0 || value > 40000)) throw Error("Patent families require native 0–40000 counts.");
    if (id === "247" && value !== "named partner") throw Error("Membership is categorical, never magnitude.");
    if (id === "78-4" && (value !== null && (!Number.isFinite(value) || value < 0) ||
      match.row.internetPercent !== null && (!Number.isFinite(match.row.internetPercent) || match.row.internetPercent < 0 || match.row.internetPercent > 100)))
      throw Error("Connectivity count and percent must remain separate native quantities.");
    return { ...country, ...match, polygons, length: id === "375" ? 0.45 * value / 40000 : null,
      radius: id === "78-4" && value !== null ? 0.12 * Math.sqrt(value / maxValue) : null };
  });
  const unsupportedRowIds = rows.filter(row => !joined.has(row.id)).map(row => row.id);
  const declared = research.geography.unsupportedRowIds;
  if (!declared || declared.length !== unsupportedRowIds.length || unsupportedRowIds.some(id => !declared.includes(id)))
    throw Error("Geographic coverage differs from audited unsupported rows.");
  return { conceptId: id, rows, countries, maxValue, unsupportedRowIds, period,
    background: (research.geography.backgroundCountries || []).map(country => ({ ...country, polygons: country.polygons.map(polygon => polygon.map(unwrapRing)) })),
    coverage: { total: rows.length, mapped: countries.length, tableOnly: unsupportedRowIds.length } };
}
export function mapPaintPlan(plan, mode = "people") {
  return { ...plan, countries: plan.countries.map(country => ({ ...country,
    row: { ...country.row, value: plan.conceptId === "78-4" ? mode === "percent" ? country.row.internetPercent : country.row.value : 1 },
    fill: plan.conceptId === "78-4" && mode === "percent" ? accessColor(country.row.internetPercent) :
      plan.conceptId === "78-4" && country.row.value === null ? ACCESS_MISSING : ACCESS_OUTSIDE })) };
}
