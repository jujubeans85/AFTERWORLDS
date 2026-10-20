// Native-unit designs share rulers, never accounting categories or denominators.
export const RAIL_CONCEPTS = Object.freeze(["372", "276", "409", "369", "324", "385", "232"]);
const CONFIG = {
  "372": ["report-channel-counter-rails", 20, 2, 44],
  "276": ["connection-cost-calipers", 3, 2, 40],
  "409": ["cross-language-consistency-sextant", 100, 6, 60],
  "369": ["unlike-accounts-scale-rails", 400000000000, 6, 58],
  "324": ["contract-capacity-faceted-ledger", 3000, 5, 56],
  "385": ["commitment-versus-annual-flow-panels", 500000000000, 4, 62],
  "232": ["ancestry-entry-share-meridians", 100, 6, 62],
};
export function railInstrumentPlan(research) {
  const id = String(research.design?.conceptId), config = CONFIG[id];
  const rows = research.rows || research.dataset?.rows;
  if (!config || research.design.implementation?.primitive !== config[0] ||
    research.design.scale?.domain?.[0] !== 0 || research.design.scale?.domain?.[1] !== config[1] ||
    rows?.length !== config[2]) throw Error("Unsupported native rail binding.");
  const items = rows.map((row, index) => {
    if (row.lat !== null || row.lon !== null || (row.value !== null &&
      (!Number.isFinite(row.value) || row.value < 0 || row.value > config[1])))
      throw Error("Native rails require source extents and abstract slots.");
    const amber = id === "372" || id === "276" ? index === 1 :
      id === "369" ? row.measureType === "corporate revenue" : id === "385" && index === 0;
    return { row, index, fraction: row.value === null ? null : row.value / config[1],
      kind: id === "409" ? "marker" : id === "276" ? "caliper" :
        id === "385" && index === 0 ? "outline" : "bar",
      color: id === "409" ? "#88bdf4" : amber ? "#f2ba68" : "#57d5c4",
      label: `${row.qualifier === "approximately" ? "≈" : ""}${row.value === null ? "No observation" : row.value}`,
    };
  });
  const domain = [0, config[1]];
  const makePanel = (title, subtitle, panelItems, face = 0, extra = {}) =>
    ({ title, subtitle, items: panelItems, face, domain, ...extra });
  let panels;
  if (id === "372") panels = [
    makePanel("Reporting channels", "1 Nov 2023 – 31 May 2024 · video clips", items),
    makePanel("Two detection mechanisms", "The shared window is not an exposure denominator", [], Math.PI,
      { context: ["Proactive investigation: 2 clips", "Public reporting: 19 clips",
        "Neither channel estimates prevalence.", "No total universe or harm rate is inferred."] }),
  ];
  if (id === "276") panels = [
    makePanel("Before the first prompt", "Global median country price baskets · 2025", items),
    makePanel("A price-to-income denominator", "0–3% of GNI per capita", [], Math.PI,
      { context: ["Mobile and fixed broadband baskets", "are country medians relative to GNI.",
        "Not disposable income.", "Not an AI subscription price."] }),
  ];
  if (id === "369") panels = [
    makePanel("Corporate revenue", "Company sales · distinct fiscal periods", items.filter(item => item.row.measureType === "corporate revenue")),
    makePanel("National GDP", "National value added · calendar 2025", items.filter(item => item.row.measureType === "national GDP"), Math.PI),
  ];
  if (id === "385") panels = [
    makePanel("An announced intention", "21 Jan 2025 · next four years · not money spent", [items[0]]),
    makePanel("Annual GDP references", "2025 annual flows · no annualisation or equivalence", items.slice(1), Math.PI),
  ];
  if (id === "324") panels = items.map((item, index) =>
    makePanel(item.row.buyer, item.row.kind, [item], index * 2 * Math.PI / items.length,
      { narrow: true, context: [item.row.name.split(" / ")[1], item.row.period,
        item.row.incrementalMW ? "190 MW uprate is included in 690 MW" : item.row.kind,
        "Contract quantity is not delivered load"], pattern: item.row.kind }));
  if (id === "409" || id === "232") {
    panels = items.map((item, index) => makePanel(item.row.name,
      id === "409" ? "Archived consistency score" : "Recorded participant entries",
      [item], index * 2 * Math.PI / items.length, { narrow: true, vertical: true }));
    if (id === "232") panels.push(makePanel("Small-share magnifier",
      "Same entries · separate 0–10% ruler", items.filter(item => item.row.value <= 10), Math.PI,
      { domain: [0, 10], inset: true }));
  }
  const unit = id === "372" ? "clips" : id === "276" ? "% of GNI per capita" :
    id === "409" ? "consistency score" : id === "324" ? "MW" :
      id === "232" ? "% of participant entries" : "USD";
  return { conceptId: id, items, panels, domain, unit, period: config[3],
    recipe: research.design.animation.decorative ? research.design.animation.recipe : null };
}
