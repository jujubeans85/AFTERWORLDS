export const COUNT_CONCEPTS = Object.freeze(["333", "63-8", "364", "320"]);
const CONFIG = {
  "333": ["recorded-vote-mosaic", 121, 3, 66, ["#57d5c4", "#f2ba68", "#88bdf4"]],
  "63-8": ["translation-preparation-count-mosaic", 42, 4, 52, ["#edf4fa", "#57d5c4", "#88bdf4", "#f2ba68"]],
  "364": ["nine-year-comparison-counters", 9, 2, 62, ["#88bdf4", "#57d5c4"]],
  "320": ["mean-median-counterweights", 10, 4, 46, null],
};
export function countInstrumentPlan(research) {
  const id = String(research.design?.conceptId), config = CONFIG[id], rows = research.rows || research.dataset?.rows;
  if (!config || research.design.implementation?.primitive !== config[0] ||
    research.design.scale?.domain?.[0] !== 0 || research.design.scale?.domain?.[1] !== config[1] ||
    rows?.length !== config[2]) throw Error("Unsupported count or counterweight binding.");
  const items = rows.map((row, index) => {
    if (row.lat !== null || row.lon !== null || !Number.isFinite(row.value) || row.value < 0 ||
      row.value > config[1] || (id !== "320" && !Number.isInteger(row.value)))
      throw Error("Counts must be exact source integers and positions must be categorical.");
    if (id === "364" && (row.denominator !== 9 || row.leadMonths !== 3))
      throw Error("Comparison counters require nine anonymous years and three-month lead.");
    if (id === "320" && (!["median", "mean"].includes(row.statistic) ||
      !["paid hours only", "paid and unpaid hours"].includes(row.timeBasis)))
      throw Error("Counterweights require separate source statistic and time basis.");
    return { row, index, color: id === "320" ? row.statistic === "mean" ? "#f2ba68" : "#57d5c4" : config[4][index],
      fraction: row.value / config[1], slots: id === "364" ? 9 : id === "320" ? null : row.value,
      label: id === "364" ? `${row.value}/9 comparison years` : id === "320" ? `${row.value} USD/hour` : `${row.value} ${row.unit}` };
  });
  if (["333", "63-8"].includes(id) && items.reduce((sum, item) => sum + item.row.value, 0) !== config[1])
    throw Error("Anonymous mosaic tiles must preserve the complete source count.");
  return { conceptId: id, kind: id === "320" ? "counterweights" : id === "364" ? "counters" : "mosaic",
    domain: [0, config[1]], items, period: config[3] };
}
