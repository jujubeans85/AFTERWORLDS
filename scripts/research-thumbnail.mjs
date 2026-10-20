import { validateResearchBinding } from "../src/research-data.js";
import { escapeHTML } from "../src/math.js";

const TAU = Math.PI * 2;
const compareText = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const cross = (a, b, c) =>
  (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);

function hull(points) {
  const sorted = points.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const lower = [], upper = [];
  for (const point of sorted) {
    while (lower.length > 1 && cross(lower.at(-2), lower.at(-1), point) <= 0) lower.pop();
    lower.push(point);
  }
  for (const point of [...sorted].reverse()) {
    while (upper.length > 1 && cross(upper.at(-2), upper.at(-1), point) <= 0) upper.pop();
    upper.push(point);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

/**
 * Render a build-validated immutable 430 release bundle as a static thumbnail.
 * Source extents use the same native formula and width as ResearchGlobe.
 * The oblique, orthographic camera is presentation only; it creates no new data.
 */
export function researchThumbnail(bundle) {
  const rows = validateResearchBinding(bundle).slice().sort((a, b) =>
    compareText(a.name.toLowerCase(), b.name.toLowerCase()) || compareText(a.id, b.id));
  const tilt = 0.52;
  const viewRotation = 0.28;
  const scale = 75;
  const project = ([x, y, z]) => {
    const rotatedX = x * Math.cos(viewRotation) + z * Math.sin(viewRotation);
    const rotatedZ = -x * Math.sin(viewRotation) + z * Math.cos(viewRotation);
    return [
      150 + rotatedX * scale,
      119 - (y * Math.cos(tilt) - rotatedZ * Math.sin(tilt)) * scale,
      y * Math.sin(tilt) + rotatedZ * Math.cos(tilt),
    ];
  };
  const rear = [], front = [];
  rows.forEach((row, slot) => {
    const angle = slot * TAU / rows.length;
    const normal = [Math.sin(angle), 0, Math.cos(angle)];
    const tangent = [Math.cos(angle), 0, -Math.sin(angle)];
    const sourceLength = row.value === null ? null : 0.45 * row.value / 700;
    const length = sourceLength ?? 0;
    const vertices = [];
    for (const radial of [1, 1 + length])
      for (const horizontal of [-0.0175, 0.0175])
        for (const vertical of [-0.0175, 0.0175])
          vertices.push(project([
            normal[0] * radial + tangent[0] * horizontal,
            vertical,
            normal[2] * radial + tangent[2] * horizontal,
          ]));
    const center = project(normal.map(value => value * (1 + length / 2)));
    const description = `${row.name} · ${row.id}: ${
      row.value === null ? "No observation" : `${row.value} ${row.unit}`
    }; ${row.period}; CFE matching ${row.cfePercent}% (separate measure)`;
    const attributes = `data-row-id="${escapeHTML(row.id)}" data-native-length="${
      sourceLength === null ? "missing" : sourceLength
    }"`;
    let mark;
    if (sourceLength === null) {
      const base = project(normal.map(value => value * 1.008));
      mark = `<path d="M${base[0] - 2},${base[1] + 2}l4,-4m-1,5l4,-4" fill="none" stroke="#66717e"/>`;
    } else if (length === 0) {
      // A real zero has no quantitative extent, rather than an invented minimum bar.
      mark = "";
    } else {
      mark = `<polygon points="${hull(vertices.map(point => point.slice(0, 2)))
        .map(point => point.map(value => value.toFixed(4)).join(",")).join(" ")}" fill="#f2ba68"/>`;
    }
    (center[2] >= 0 ? front : rear).push(
      `<g ${attributes}><title>${escapeHTML(description)}</title>${mark}</g>`,
    );
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="250" viewBox="0 0 300 250" role="img" aria-labelledby="research-title research-description">
<title id="research-title">${escapeHTML(bundle.design.title)}</title>
<desc id="research-description">Abstract comparison of 44 cloud regions, annual 2025. Uniform amber column lengths use a fixed 0–700 g CO2eq/kWh scale. Slots are alphabetical categories, not geographic locations. Rear columns are occluded by the neutral core. CFE matching is a separate measure; all values are available in the evidence table.</desc>
<rect width="300" height="250" fill="#080d10"/>
<g>${rear.join("")}</g>
<circle cx="150" cy="119" r="${scale}" fill="#101a22" stroke="#263841" stroke-width="0.6"/>
<g>${front.join("")}</g>
<g fill="#b5c3d0" text-anchor="middle" font-family="monospace" font-size="9">
<text x="150" y="218">44 REGIONS · ANNUAL 2025</text>
<text x="150" y="234">0–700 g CO2eq/kWh · ABSTRACT COMPARISON</text>
</g>
</svg>`;
}
