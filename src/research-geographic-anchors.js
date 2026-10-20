import { unwrapRing } from './math.js';
import { polygonContains } from './research-geography.js';
export const DISPLAY_ANCHOR_MEANING = 'polygon-interior display anchor; country summary, not observed location';
const area = ring => Math.abs(ring.reduce((sum, point, i) => { const next = ring[(i + 1) % ring.length]; return sum + point[0] * next[1] - next[0] * point[1]; }, 0) / 2);
export function validDisplayAnchor(anchor, polygons) {
  return anchor?.meaning === DISPLAY_ANCHOR_MEANING && Number.isFinite(anchor.lat) && Number.isFinite(anchor.lon) && Math.abs(anchor.lat) <= 90 && Math.abs(anchor.lon) <= 180 &&
    polygons.some(polygon => polygonContains(polygon.map(unwrapRing), anchor.lon, anchor.lat));
}
export function interiorDisplayAnchor(polygons) {
  const ranked = polygons.map(polygon => polygon.map(unwrapRing)).sort((a, b) => area(b[0]) - area(a[0]));
  for (const polygon of ranked) {
    const xs = polygon[0].map(p => p[0]), ys = polygon[0].map(p => p[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    // Search a fixed progressively finer grid, preferring the bounding-box centre.
    for (const divisions of [2, 8, 32, 128]) {
      const candidates = [];
      for (let x = 1; x < divisions; x++) for (let y = 1; y < divisions; y++) candidates.push([minX + (maxX - minX) * x / divisions, minY + (maxY - minY) * y / divisions]);
      candidates.sort((a, b) => Math.hypot(a[0] - (minX + maxX) / 2, a[1] - (minY + maxY) / 2) - Math.hypot(b[0] - (minX + maxX) / 2, b[1] - (minY + maxY) / 2));
      for (const [longitude, lat] of candidates) {
        const lon = ((longitude + 180) % 360 + 360) % 360 - 180;
        if (polygonContains(polygon, lon, lat)) return { lat, lon, meaning: DISPLAY_ANCHOR_MEANING };
      }
    }
  }
  throw Error('Geography: no validated polygon-interior display anchor');
}
