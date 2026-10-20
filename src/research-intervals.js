// Explicit native-unit instruments. No interval midpoint, precise threshold
// estimate, normalisation, confidence interval or cross-denominator sum is made.
export const INTERVAL_CONCEPTS = Object.freeze(["388", "330", "406", "193-5"]);
const CONFIG = {
  "388": ["range-first-ocean-observatory", 100, 8, 60],
  "330": ["trial-outcome-meridian-gauges", 0.4, 2, 48],
  "406": ["qualified-cooling-time-arcs", 100, 4, 50],
  "193-5": ["per-resident-bound-contrast", 600, 2, 56],
};
const unitLabel = (row, id) => id === "330" ? "SD" : id === "193-5" ? "kWh/person/year" : "%";
export function intervalValueLabel(row, conceptId) {
  const id = String(conceptId);
  const unit = unitLabel(row, id);
  if (id === "388" && row.value === null) return `${row.lower}–${row.upper}${unit}`;
  if (id === "330") return `${row.value} SD · ±${row.standardError} robust SE`;
  const qualifier = row.qualifier === "<" ? "<" :
    row.qualifier === "approximately" ? "≈" : row.qualifier === "up to" ? "up to " : "";
  return `${qualifier}${row.value}${unit === "%" ? "" : " "}${unit}`;
}
export function intervalInstrumentPlan(research) {
  const id = String(research.design?.conceptId), config = CONFIG[id];
  const rows = research.rows || research.dataset?.rows;
  if (!config || research.design.implementation?.primitive !== config[0] ||
    research.design.scale?.domain?.[0] !== 0 || research.design.scale?.domain?.[1] !== config[1] ||
    rows?.length !== config[2]) throw Error("Unsupported interval instrument binding.");
  const items = rows.map((row, index) => {
    if (row.lat !== null || row.lon !== null) throw Error("Native instruments cannot invent geographic coordinates.");
    const item = { row, index, label: intervalValueLabel(row, id), color: "#57d5c4" };
    if (id === "388" && index < 2) {
      if (row.value !== null || !Number.isFinite(row.lower) || !Number.isFinite(row.upper) ||
        row.lower < 0 || row.upper > 100 || row.lower > row.upper)
        throw Error("A published range requires both endpoints and no point estimate.");
      return { ...item, kind: "range", lower: row.lower, upper: row.upper, point: null };
    }
    if (!Number.isFinite(row.value) || row.value < 0 || row.value > config[1])
      throw Error("Native instrument value is outside its declared domain.");
    if (id === "330") {
      if (!Number.isFinite(row.standardError) || row.standardError < 0 ||
        row.value - row.standardError < 0 || row.value + row.standardError > 0.4 ||
        !Number.isInteger(row.regressionN)) throw Error("Trial whiskers require the source robust standard error.");
      return { ...item, kind: "whisker", point: row.value,
        lower: row.value - row.standardError, upper: row.value + row.standardError,
        color: row.outcome === "composite" ? "#88bdf4" : "#57d5c4" };
    }
    if (id === "406" || id === "193-5") {
      if (!["<", "approximately", "up to"].includes(row.qualifier))
        throw Error("A source threshold or approximation cannot become an exact point.");
      return { ...item, kind: id === "406" ? "qualified-arc" : "qualified-rail",
        point: null, boundary: row.value, qualifier: row.qualifier,
        angle: id === "406" ? Math.PI * 2 * row.value / 100 : null,
        color: id === "193-5" && index === 1 ? "#88bdf4" : "#57d5c4" };
    }
    return { ...item, kind: "share", point: row.value, color: "#88bdf4" };
  });
  if (id === "406") return { conceptId: id, kind: "qualified-rings", period: config[3], items };
  const panels = id === "388" ? [
    { face: 0, title: "Not publicly tracked", subtitle: "Category-specific industrial activity · 2017–2021",
      domain: [0, 100], unit: "%", items: items.slice(0, 2), footer: "Published ranges; no point estimates" },
    { face: Math.PI, title: "Where activity was detected", subtitle: "All detected vessel activity · coastal study waters",
      domain: [0, 100], unit: "%", items: items.slice(2), footer: "Rounded shares total 99%; not renormalised" },
  ] : id === "330" ? [
    { face: 0, title: "One teacher-supported trial", subtitle: "Edo State · June–July 2024 · regression N 654",
      domain: [0, 0.4], unit: "SD", items, footer: "Whiskers: ±1 robust SE, not 95% CI" },
    { face: Math.PI, title: "One intervention, two outcomes", subtitle: "Teacher-supported Edo State schools",
      domain: [0, 0.4], unit: "SD", items: [], context: [
        "English and composite assessments",
        "come from the same six-week intervention.",
        "Model access, teachers and curriculum",
        "were part of one supported bundle.",
      ], footer: "No national, adult-literacy or other-language estimate" },
  ] : [
    { face: 0, title: "Host-region electricity per resident", subtitle: "All data centres · 2024 · not AI-only",
      domain: [0, 600], unit: "kWh/person/year", items, footer: "United States: country · Africa: continent" },
    { face: Math.PI, title: "Africa: magnified bound", subtitle: "Inset scale 0–5 kWh/person/year",
      domain: [0, 5], unit: "kWh/person/year", items: [items[1]], footer: "The same <1 bound; no exact value or ratio" },
  ];
  return { conceptId: id, kind: "rails", period: config[3], items, panels };
}
