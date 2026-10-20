export const PERCENTAGE_CONCEPTS = Object.freeze(["255", "233-2", "422-2", "138-8", "8-6"]);
const CONFIG = {
  "255": ["alternative-water-three-rings", 3],
  "233-2": ["benchmark-coverage-double-discs", 2],
  "422-2": ["paired-occupation-exposure-meridians", 4],
  "138-8": ["overlapping-activity-rings", 2],
  "8-6": ["screening-completion-arms", 2],
};
export function percentageInstrumentPlan(research) {
  const id = String(research.design?.conceptId), config = CONFIG[id], rows = research.rows || research.dataset?.rows;
  if (!config || research.design.implementation?.primitive !== config[0] ||
    research.design.scale?.domain?.[0] !== 0 || research.design.scale?.domain?.[1] !== 100 ||
    rows?.length !== config[1]) throw Error("Unsupported percentage instrument binding.");
  const items = rows.map((row, index) => {
    const percent = id === "138-8" ? row.publishedPercent : row.value;
    if (row.lat !== null || row.lon !== null || !Number.isFinite(percent) || percent < 0 || percent > 100)
      throw Error("Percentage instruments require a source-native bounded percent.");
    if (id === "138-8" && (!Number.isInteger(row.value) || row.denominatorAccounts !== 832))
      throw Error("Account counts require their published percent and source denominator.");
    if (id === "8-6" && (!Array.isArray(row.ci95) || row.ci95.length !== 2 ||
      !row.ci95.every(Number.isFinite) || row.ci95[0] > percent || row.ci95[1] < percent ||
      row.ci95[0] < 0 || row.ci95[1] > 100 || !Number.isInteger(row.numerator) ||
      !Number.isInteger(row.analyzedN) || !Number.isInteger(row.randomizedN) ||
      row.numerator > row.analyzedN || row.analyzedN > row.randomizedN))
      throw Error("Screening requires source CI95 and separate analyzed/randomized denominators.");
    if (id === "422-2" && (!["female", "male"].includes(row.sex) ||
      !["any exposure", "high exposure (gradients3–4)"].includes(row.exposureCategory)))
      throw Error("Occupation exposure requires source sex and nested category labels.");
    const high = id === "422-2" && row.exposureCategory !== "any exposure";
    const color = id === "422-2" ? row.sex === "female" ? "#57d5c4" : "#f2ba68" :
      id === "233-2" ? index ? "#57d5c4" : "#88bdf4" :
        id === "138-8" || id === "8-6" ? index ? "#88bdf4" : "#57d5c4" : "#57d5c4";
    return { row, index, percent, fraction: percent / 100, angle: (id === "422-2" ? Math.PI : 2 * Math.PI) * percent / 100,
      color, high, ci95: id === "8-6" ? row.ci95.slice() : null,
      face: id === "422-2" ? high ? Math.PI : 0 : index * 2 * Math.PI / rows.length,
      label: `${percent}%`,
      denominatorLabel: id === "138-8" ? `${row.value}/${row.denominatorAccounts} classified accounts` :
        id === "8-6" ? `${row.numerator}/${row.analyzedN} analyzed; ${row.randomizedN} randomized` : null };
  });
  return { conceptId: id, kind: id === "422-2" ? "semicircle-pairs" : "full-rings", items,
    period: research.design.animation.decorative.periodSeconds };
}
