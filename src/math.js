export const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
export function xyz(lat, lon, r = 1) {
  const a = (lat * Math.PI) / 180,
    b = (lon * Math.PI) / 180;
  return [
    r * Math.cos(a) * Math.sin(b),
    r * Math.sin(a),
    r * Math.cos(a) * Math.cos(b),
  ];
}
export function decodeTopology(topology) {
  const { scale, translate } = topology.transform;
  const arcs = topology.arcs.map((a) => {
    let x = 0,
      y = 0;
    return a.map((p) => {
      x += p[0];
      y += p[1];
      return [x * scale[0] + translate[0], y * scale[1] + translate[1]];
    });
  });
  const ring = (refs) =>
    refs.flatMap((i, k) => {
      const a = i < 0 ? [...arcs[~i]].reverse() : arcs[i];
      return k ? a.slice(1) : a;
    });
  return topology.objects.countries.geometries.map((g) => ({
    id: g.id,
    name: g.properties?.name,
    polygons: (g.type === "Polygon" ? [g.arcs] : g.arcs).map((p) =>
      p.map(ring),
    ),
  }));
}
export const escapeHTML = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function formatValue(n) {
  return new Intl.NumberFormat("en", { maximumFractionDigits: 2 }).format(n);
}
export function markerHeight(value, max) {
  if (!Number.isFinite(value) || value < 0 || !Number.isFinite(max) || max <= 0)
    throw Error("Invalid marker scale");
  return (value / max) * 0.52;
}
export function hash(s) {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

export function unwrapRing(ring) {
  // Antarctic perimeter intentionally closes along the south-pole map edge.
  if (ring.some((p) => p[1] <= -89.9)) return ring;
  const result = [];
  let previous;
  for (const [raw, lat] of ring) {
    let lon = raw;
    if (previous !== undefined) {
      while (lon - previous > 180) lon -= 360;
      while (lon - previous < -180) lon += 360;
    }
    result.push([lon, lat]);
    previous = lon;
  }
  return result;
}
export function fitDistance(width, height, radius = 1.54, fov = 36) {
  const half = (fov * Math.PI) / 360,
    aspect = width / height,
    minHalf = Math.min(half, Math.atan(Math.tan(half) * aspect));
  return (radius / Math.sin(minHalf)) * 1.04;
}
