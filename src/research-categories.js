export const CATEGORY_PROFILES = Object.freeze({
  "417": ["consortium-membership-facets", "membership", 7],
  "415": ["announced-zone-date-facets", "dates", 5],
  "397": ["jurisdiction-workflow-double-facet", "workflow", 2],
  "382": ["footprint-definition-double-facet", "architecture", 2],
  "371": ["fraud-amount-meaning-facets", "amount-text", 3],
  "368": ["licence-rule-product-gates", "product-links", 3],
  "358": ["voyage-supervision-ledger", "ledger", 3],
  "356": ["assistance-and-oversight-four-facets", "dated-evidence", 4],
  "348": ["bibliometric-definition-five-facets", "metric-text", 5],
  "321": ["demand-response-schedule-facets", "schedule", 7],
  "314": ["cooling-design-tradeoff-triptych", "cooling", 3],
  "305": ["euv-role-three-way-assembly", "role-links", 3],
  "259": ["mandate-handoff-double-node", "mandate", 2],
  "256": ["onboard-app-status-shell", "status", 6],
  "250": ["editorial-rule-pages", "pages", 4],
  "107": ["repository-rule-three-portfolios", "portfolios", 3],
  "150-5": ["investigation-mechanism-three-facets", "mechanism-links", 3],
  "155-17": ["partnership-knot", "partnership", 3],
  "170-3": ["confirmed-discovery-two-sided-orb", "celestial", 2],
  "178": ["legal-mechanism-double-shell", "books", 2],
});
export const CATEGORY_CONCEPTS = Object.freeze(Object.keys(CATEGORY_PROFILES));
const TEAL = "#57d5c4", BLUE = "#88bdf4", AMBER = "#f2ba68", WHITE = "#edf4fa";
export function categoryInstrumentPlan(research) {
  const id = String(research.design?.conceptId), config = CATEGORY_PROFILES[id];
  const rows = research.rows || research.dataset?.rows;
  if (!config || research.design.implementation?.primitive !== config[0] || rows?.length !== config[2] ||
    !["categorical", "none"].includes(research.design.scale?.type))
    throw Error("Unsupported categorical representation binding.");
  const profile = config[1];
  const items = rows.map((row, index) => {
    if (row.lat !== null || row.lon !== null) throw Error("Categorical facets cannot fabricate coordinates.");
    let color = BLUE, pattern = "solid";
    if (["membership", "workflow", "schedule"].includes(profile)) color = TEAL;
    if (profile === "dates") color = AMBER;
    if (profile === "architecture") color = index ? AMBER : TEAL;
    if (profile === "amount-text") color = WHITE;
    if (profile === "product-links" || profile === "cooling") color = index === 2 ? AMBER : BLUE;
    if (profile === "metric-text") color = index > 2 ? AMBER : BLUE;
    if (profile === "ledger") { color = [TEAL, BLUE, WHITE][index]; if (index === 2) pattern = "outline"; }
    if (profile === "dated-evidence") color = index < 2 ? TEAL : BLUE;
    if (profile === "role-links") color = [TEAL, BLUE, AMBER][index];
    if (profile === "mandate" || profile === "books") color = index ? BLUE : TEAL;
    if (profile === "status") { color = index < 4 ? TEAL : AMBER; pattern = index < 4 ? "solid" : "dotted"; }
    if (profile === "cooling" && index < 2) pattern = "dotted";
    if (profile === "pages") pattern = ["review", "prohibit", "disclose", "contextualise"][index];
    if (profile === "mechanism-links") color = index === 2 ? WHITE : "#9caabb";
    if (profile === "schedule" && index > 4) { color = WHITE; pattern = "outline"; }
    const members = profile === "membership" ? row.consortiumCountries.split(";").map(name =>
      ({ name: name.trim(), host: name.trim() === row.hostCountry })) : [];
    const reverse = profile === "books" ? [row.mechanism, row.exclusions] :
      profile === "portfolios" ? [row.value, row.notes] :
        profile === "amount-text" ? [row.amountQualifier, row.caseStatusAtPublication, `Reported: ${row.reportedAt}`] :
          profile === "workflow" ? [`Final decision: ${row.finalDecision}`, row.value] :
            profile === "mandate" ? [row.value, row.mechanism, row.notes] :
            profile === "metric-text" ? [row.unit, row.notes] : [row.notes].filter(Boolean);
    return { row, index, color, pattern, members, reverse,
      displayValue: `${row.qualifier && ["about", "nearly", "approximately"].includes(row.qualifier) ? `${row.qualifier} ` : ""}${row.value}`,
      clock: profile === "schedule" && index < 5 ? { startHour: 17, endHour: 21, denominator: 24 } : null };
  });
  const links = profile === "product-links" || profile === "mechanism-links" ? [[0, 2], [1, 2]] :
    profile === "role-links" ? [[0, 1], [0, 2], [1, 2]] : profile === "mandate" ? [[0, 1]] : [];
  const chronological = profile === "dates" ? items.slice().sort((a, b) => a.row.announcementDate.localeCompare(b.row.announcementDate)) : [];
  const nodes = profile === "partnership" ? [...new Set(rows.flatMap(row => [row.fromEntity, row.toEntity]))].map(name =>
    ({ name, role: rows.some(row => row.fromEntity === name) ? "cloud" : "model" })) : [];
  return { conceptId: id, profile, items, links, nodes, chronological,
    period: research.design.animation.decorative.periodSeconds, recipe: research.design.animation.recipe };
}
