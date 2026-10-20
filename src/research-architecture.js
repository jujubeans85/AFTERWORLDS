export const ARCHITECTURE_CONCEPTS = Object.freeze(["428", "407", "284", "202", "117"]);
const CONFIG = {
  "428": ["seven-throughput-gates", 25, 7, "gates"],
  "407": ["sample-market-meridian-bars", 100, 32, "markets"],
  "284": ["applicant-count-radial-books", 2500, 10, "books"],
  "202": ["operating-exposure-five-spools", 100, 5, "spools"],
  "117": ["log-compute-lantern", 1e27, 20, "log-markers"],
};
const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;
export function architectureInstrumentPlan(research) {
  const id = String(research.design?.conceptId), config = CONFIG[id], rows = research.rows || research.dataset?.rows;
  if (!config || research.design.implementation?.primitive !== config[0] ||
    research.design.scale?.domain?.[0] !== (id === "117" ? 1e25 : 0) ||
    research.design.scale?.domain?.[1] !== config[1] || rows?.length !== config[2])
    throw Error("Unsupported architectural measurement binding.");
  const items = rows.map((row, index) => {
    if (row.lat !== null || row.lon !== null || !Number.isFinite(row.value) ||
      row.value < (id === "117" ? 1e25 : 0) || row.value > config[1])
      throw Error("Architecture requires native values on abstract source slots.");
    if (id === "284" && (!Number.isInteger(row.rank) || row.rank < 1 || row.rank > 10))
      throw Error("Applicant books require exact source rank.");
    if (id === "117" && !["Confident", "Likely", "Speculative"].includes(row.estimateConfidence))
      throw Error("Training estimates require source confidence labels, never probabilities.");
    return { row, index, extent: id === "117" ? null : (id === "284" ? 0.5 : 1) * row.value / config[1],
      offset: id === "117" ? 0.45 * (Math.log10(row.value) - 25) / 2 : null,
      color: id === "117" ? "#57d5c4" : ["407", "284"].includes(id) ? "#f2ba68" : "#88bdf4",
      pattern: id === "428" && row.id === "panama" ? "fiscal-diagonal" :
        id === "117" ? row.estimateConfidence : id === "407" ? "estimated-outline" : "solid" };
  });
  if (id === "407") items.sort((a, b) => compare(a.row.name.toLowerCase(), b.row.name.toLowerCase()) || compare(a.row.id, b.row.id));
  if (id === "284") items.sort((a, b) => a.row.rank - b.row.rank);
  items.forEach((item, slot) => { item.slot = slot; item.angle = slot * 2 * Math.PI / items.length; });
  return { conceptId: id, kind: config[3], items, domain: research.design.scale.domain.slice(),
    period: research.design.animation.decorative.periodSeconds, recipe: research.design.animation.recipe };
}
