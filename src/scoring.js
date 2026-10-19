// One fixed scale per story, shared by animation, legends, selection and export.
// A score is magnitude within that story, never risk or a cross-story ranking.
export function scoreValue(value, ceiling) {
  if (value === null || value === undefined) return null;
  if (!Number.isFinite(value) || value < 0 || !Number.isFinite(ceiling) || ceiling <= 0)
    throw new RangeError('Invalid score input');
  if (value === 0) return 0;
  return Math.max(1, Math.min(100, Math.round(100 * value / ceiling)));
}
export function scoreFor(dataset, point) {
  return scoreValue(point.value, dataset.visual.ceiling);
}
export function extrapolate({ past, latest, targetYear, method = 'linear', ceiling = null }) {
  if (!past || !latest || ![past.year, latest.year, past.value, latest.value, targetYear].every(Number.isFinite)
      || latest.year <= past.year || targetYear <= latest.year || past.value < 0 || latest.value < 0)
    throw new RangeError('Comparable dated observations required');
  let value;
  if (method === 'linear') value = latest.value + (latest.value - past.value) / (latest.year - past.year) * (targetYear - latest.year);
  else if (method === 'cagr' && past.value > 0) value = latest.value * (latest.value / past.value) ** ((targetYear - latest.year) / (latest.year - past.year));
  else throw new RangeError('Unsupported extrapolation');
  return Math.max(0, ceiling === null ? value : Math.min(ceiling, value));
}
export function outlookFor(dataset) {
  const t = dataset.brief?.timeline;
  if (!t) return null;
  return { ...t, projected: t.projection ? extrapolate({ past: t.past, latest: t.latest, ...t.projection }) : null };
}
