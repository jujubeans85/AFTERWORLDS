// Shared native percentage encoding. These are equal denominator rings, not
// planetary size, orbit, geography, adoption speed or interpolated history.
export const PAIR_CONCEPTS = Object.freeze(["5-6", "63"]);
export function pairRingPlan(research) {
  const id = String(research.design?.conceptId);
  const rows = research.rows || research.dataset?.rows;
  const primitive = id === "5-6" ? "mapped-fraction-year-duet" : "urban-rural-open-rings";
  const ids = id === "5-6" ? ["seabed-2025", "seabed-2026"] : ["internet-urban", "internet-rural"];
  if (!PAIR_CONCEPTS.includes(id) || research.design.implementation?.primitive !== primitive ||
    research.design.scale?.domain?.[0] !== 0 || research.design.scale?.domain?.[1] !== 100 ||
    rows?.length !== 2 || rows.some((row, index) => row.id !== ids[index] ||
      !Number.isFinite(row.value) || row.value < 0 || row.value > 100 ||
      row.qualifier !== null || row.lat !== null || row.lon !== null))
    throw Error("Unsupported or changed accepted pair-ring binding.");
  return {
    conceptId: id, period: id === "5-6" ? 64 : 44, radius: 0.45,
    rings: rows.map((row, index) => ({
      row, index, angle: 2 * Math.PI * row.value / 100,
      label: id === "5-6" ? `${row.period.replace("GEBCO_", "").replace(" release", "")}${index ? " · latest" : ""}` : row.name,
      center: [index ? 0.61 : -0.61, 0.08,
        id === "5-6" ? (index ? 0.16 : -0.16) : (index ? -0.16 : 0.16)],
      foreground: id === "5-6" ? index === 1 : index === 0,
      remainderLabel: id === "5-6" ? "Outside modern-standard mapped coverage" : "Not using Internet",
      color: index ? "#57d5c4" : "#88bdf4",
    })),
  };
}
