export const COMPARISON_CONCEPTS = Object.freeze(["402", "398", "392", "323", "218", "214", "115-2", "211-4"]);
const CONFIG = {
  "402": ["segmentation-metric-prism", 1, 12],
  "398": ["field-stage-water-deficit-pairs", 1, 8],
  "392": ["hypoxia-configuration-metric-facets", 1, 28],
  "323": ["non-normalised-fuel-comparison", 100, 7],
  "218": ["six-task-model-dumbbells", 100, 12],
  "214": ["production-versus-shipments-hinge", 220000, 5],
  "115-2": ["class-error-paired-reeds", 100, 18],
  "211-4": ["injury-rate-confidence-pairs", 7, 10],
};
export function comparisonInstrumentPlan(research) {
  const id = String(research.design?.conceptId), config = CONFIG[id];
  let rows = research.rows || research.dataset?.rows;
  if (id === "218") {
    const expected = Array.from({ length: 6 }, (_, task) => [`gemma-${task}-0`, `gemma-${task}-2`]).flat();
    const included = research.design.datasetBindings?.[0]?.includedRowIds;
    if (!Array.isArray(included) || included.length !== expected.length ||
      included.some((rowId, index) => rowId !== expected[index]))
      throw Error("Comparison requires the exact reviewed twelve-row subset.");
    const source = research.rows || research.dataset?.rows;
    if (!Array.isArray(source)) throw Error("Comparison source rows are missing.");
    rows = included.map(rowId => {
      const matches = source.filter(row => row.id === rowId);
      if (matches.length !== 1) throw Error("Comparison subset IDs must resolve exactly once.");
      return matches[0];
    });
    if (research.rows && (source.length !== expected.length ||
      source.some((row, index) => row.id !== expected[index])))
      throw Error("Bound comparison rows must retain reviewed order.");
  }
  if (!config || research.design.implementation?.primitive !== config[0] ||
    research.design.scale?.domain?.[0] !== 0 || research.design.scale?.domain?.[1] !== config[1] || rows?.length !== config[2])
    throw Error("Unsupported comparison instrument binding.");
  const metricMode = ["402", "392"].includes(id);
  const metrics = metricMode ? [...new Set(rows.map(row => row.metric))] : [];
  const items = rows.map((row, index) => {
    if (row.lat !== null || row.lon !== null || !Number.isFinite(row.value) || row.value < 0 || row.value > config[1])
      throw Error("Comparison instruments require native values and categorical slots.");
    if (id === "211-4" && (row.confidenceLevel !== 0.95 || !Number.isFinite(row.ciLower) || !Number.isFinite(row.ciUpper) ||
      row.ciLower < 0 || row.ciUpper > 7 || row.ciLower > row.value || row.ciUpper < row.value))
      throw Error("Injury comparison requires actual source 95% endpoints.");
    if (id === "398" && (!Number.isFinite(row.standardDeviation) || row.standardDeviation < 0))
      throw Error("Field comparison requires the source descriptive SD.");
    if (id === "115-2" && !Number.isFinite(row.publishedParentheticalUncertainty))
      throw Error("Class comparison requires exact parenthetical uncertainty text.");
    let key = "", label = row.name, color = "#57d5c4", kind = "point";
    if (metricMode) { key = row.model || row.name; label = row.metric; }
    if (id === "398") { key = `${row.period} · ${row.growthStage}`; label = `Field ${row.field} · ${row.name}`; color = row.field === "A" ? "#57d5c4" : "#88bdf4"; }
    if (id === "218") { key = row.benchmark; color = row.name === "Gemma4 E4B IT Thinking" ? "#57d5c4" : "#f2ba68"; }
    if (id === "115-2") { key = row.name; label = row.metric; color = row.metric === "producer_accuracy" ? "#57d5c4" : "#f2ba68"; kind = "stem"; }
    if (id === "211-4") { key = row.name.split(" — ")[0]; label = row.cohort; color = row.cohort === "Waymo" ? "#57d5c4" : "#f2ba68"; kind = "confidence-point"; }
    if (id === "323") {
      key = row.geographicId === "USA" ? "United States" : "China"; label = row.name.split(" — ")[1];
      color = { gas: "#f2ba68", renewables: "#57d5c4", nuclear: "#88bdf4", coal: "#9caabb" }[label];
      kind = row.qualifier === ">" ? "open-lower-bar" : "bar";
    }
    if (id === "214") {
      key = row.id.startsWith("jara-prod") ? "Production" : "Shipments";
      label = key === "Production" ? `${row.period} production` : row.name;
      color = key === "Production" ? "#88bdf4" : row.id === "jara-exp25" ? "#f2ba68" : "#57d5c4";
      kind = row.id === "jara-total25" ? "reported-total" : "bar";
    }
    const qualifier = row.qualifier === ">" ? ">" : row.qualifier === "approximately" ? "≈" : "";
    return { row, index, key, label, color, kind, fraction: row.value / config[1],
      displayValue: `${qualifier}${row.value}`, interval: id === "211-4" ? [row.ciLower, row.ciUpper] : null,
      supportingText: id === "398" ? `Descriptive SD ${row.standardDeviation}; not CI` :
        id === "115-2" ? `Published (${row.publishedParentheticalUncertainty}); definition not verified` : null,
      stackStart: id === "214" && row.id === "jara-exp25" ? rows.find(row => row.id === "jara-dom25").value : 0 };
  });
  const keys = [...new Set(items.map(item => item.key))];
  const panels = keys.map((key, index) => ({ key, face: index * 2 * Math.PI / keys.length, items: items.filter(item => item.key === key) }));
  return { conceptId: id, items, panels, metrics, domain: [0, config[1]],
    period: research.design.animation.decorative.periodSeconds, recipe: research.design.animation.recipe,
    warning: id === "392" ? "Shared test N=12; overlapping training years; inconsistent source dates" : null };
}
