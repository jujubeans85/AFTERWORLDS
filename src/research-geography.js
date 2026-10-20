import { unwrapRing } from "./math.js";

export const ACCESS_OCEAN = "#101a22";
export const ACCESS_OUTSIDE = "#343e49";
export const ACCESS_MISSING = "#66717e";

/** One fixed single-hue scale shared by the live surface, legend and thumbnail. */
export function accessColor(value) {
  if (value === null) return ACCESS_MISSING;
  if (!Number.isFinite(value) || value < 0 || value > 100)
    throw Error("Electricity access must be a native percentage or null.");
  return `hsl(174 50% ${12 + 0.62 * value}%)`;
}

export function polygonContains(polygon, longitude, latitude) {
  for (const shift of [-360, 0, 360]) {
    const lon = longitude - shift;
    let inside = false;
    for (const ring of polygon) {
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i], [xj, yj] = ring[j];
        if ((yi > latitude) !== (yj > latitude) &&
          lon < (xj - xi) * (latitude - yi) / (yj - yi) + xi) inside = !inside;
      }
    }
    if (inside) return true;
  }
  return false;
}

/** Rows without an audited join remain table-only; no coordinates are synthesized. */
export function accessPaintPlan(research) {
  if (String(research.design?.conceptId) !== "408" || !research.geography?.countries)
    throw Error("The country-access surface requires audited 408 geography.");
  const rows = research.rows || research.dataset.rows;
  const rowMap = new Map(rows.map((row, index) => [row.id, { row, index }]));
  const joined = new Set();
  const countries = research.geography.countries.map(country => {
    const match = rowMap.get(country.rowId);
    if (!match || joined.has(country.rowId) || country.geographicId !== match.row.geographicId ||
      !country.polygons?.length) throw Error("Invalid or duplicated country-access geometry join.");
    joined.add(country.rowId);
    return {
      ...country, ...match, fill: accessColor(match.row.value),
      polygons: country.polygons.map(polygon => polygon.map(unwrapRing)),
    };
  });
  const unsupported = rows.filter(row => !joined.has(row.id)).map(row => row.id);
  const declared = research.geography.unsupportedRowIds;
  if (!declared || declared.length !== unsupported.length ||
    unsupported.some(id => !declared.includes(id)))
    throw Error("Map coverage differs from the audited table-only set.");
  return {
    countries,
    background: (research.geography.backgroundCountries || []).map(country => ({
      ...country, polygons: country.polygons.map(polygon => polygon.map(unwrapRing)),
    })),
    unsupportedRowIds: unsupported,
    coverage: { total: rows.length, mapped: countries.length, tableOnly: unsupported.length },
  };
}

export function accessCountryAt(plan, longitude, latitude) {
  return plan.countries.find(country =>
    country.polygons.some(polygon => polygonContains(polygon, longitude, latitude))) || null;
}

/** A path is kept in source lon/lat; seam copies clip naturally to the viewport. */
export function traceAccessPolygon(context, polygon, width, height, shift = 0) {
  context.beginPath();
  for (const ring of polygon) {
    ring.forEach(([longitude, latitude], index) => {
      const x = (longitude + shift + 180) / 360 * width;
      const y = (90 - latitude) / 180 * height;
      if (index) context.lineTo(x, y);
      else context.moveTo(x, y);
    });
    context.closePath();
  }
}

export function paintAccessTexture(canvas, plan) {
  const context = canvas.getContext("2d");
  if (!context) throw Error("The country-access texture requires a 2D canvas.");
  const { width, height } = canvas;
  context.fillStyle = ACCESS_OCEAN;
  context.fillRect(0, 0, width, height);
  for (const country of plan.background) for (const polygon of country.polygons)
    for (const shift of [-360, 0, 360]) {
      traceAccessPolygon(context, polygon, width, height, shift);
      context.fillStyle = ACCESS_OUTSIDE;
      context.fill("evenodd");
    }
  for (const country of plan.countries) for (const polygon of country.polygons)
    for (const shift of [-360, 0, 360]) {
      traceAccessPolygon(context, polygon, width, height, shift);
      context.fillStyle = country.fill;
      context.fill("evenodd");
      if (country.row.value === null) {
        context.save();
        context.clip("evenodd");
        context.beginPath();
        for (let x = -height; x < width; x += 10) {
          context.moveTo(x, height);
          context.lineTo(x + height, 0);
        }
        context.strokeStyle = "#b5c3d0";
        context.lineWidth = 2;
        context.stroke();
        context.restore();
      }
      traceAccessPolygon(context, polygon, width, height, shift);
      context.strokeStyle = "#182b30";
      context.lineWidth = 0.65;
      context.stroke();
    }
  return canvas;
}
