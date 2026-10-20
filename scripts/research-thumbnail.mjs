import { AMENDED_CONCEPTS, amendedInstrumentPlan } from "../src/research-amended.js";
import { MULTI_CONCEPTS, multiInstrumentPlan } from "../src/research-multi-plan.js";
import { PANEL_CONCEPTS, panelInstrumentPlan } from "../src/research-panels.js";
import { histogramPlan } from "../src/research-histogram.js";
import { MAP_CONCEPTS, geographyInstrumentPlan, mapPaintPlan } from "../src/research-maps.js";
import { COMPARISON_CONCEPTS, comparisonInstrumentPlan } from "../src/research-comparisons.js";
import { validateResearchBinding } from "../src/research-data.js";
import { escapeHTML } from "../src/math.js";
import { accessPaintPlan, accessColor, ACCESS_OCEAN, ACCESS_OUTSIDE } from "../src/research-geography.js";
import { PAIR_CONCEPTS, pairRingPlan } from "../src/research-pairs.js";
import { INTERVAL_CONCEPTS, intervalInstrumentPlan } from "../src/research-intervals.js";
import { RAIL_CONCEPTS, railInstrumentPlan } from "../src/research-rails.js";
import { COUNT_CONCEPTS, countInstrumentPlan } from "../src/research-counts.js";
import { CATEGORY_CONCEPTS, categoryInstrumentPlan } from "../src/research-categories.js";
import { PERCENTAGE_CONCEPTS, percentageInstrumentPlan } from "../src/research-percentages.js";
import { ARCHITECTURE_CONCEPTS, architectureInstrumentPlan } from "../src/research-architecture.js";

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
  if (String(bundle.conceptId) === "74") return crossingThumbnail(bundle);
  if (String(bundle.conceptId) === "156-8") return typedPanelThumbnail(bundle);
  if (MULTI_CONCEPTS.includes(String(bundle.conceptId))) return multiThumbnail(bundle);
  if (PANEL_CONCEPTS.includes(String(bundle.conceptId))) return typedPanelThumbnail(bundle);
  if (String(bundle.conceptId) === "365") return histogramThumbnail(bundle);
  if (MAP_CONCEPTS.includes(String(bundle.conceptId))) return mapThumbnail(bundle);
  if (COMPARISON_CONCEPTS.includes(String(bundle.conceptId))) return comparisonThumbnail(bundle);
  if (String(bundle.conceptId) === "408") return accessThumbnail(bundle);
  if (PAIR_CONCEPTS.includes(String(bundle.conceptId))) return pairThumbnail(bundle);
  if (INTERVAL_CONCEPTS.includes(String(bundle.conceptId))) return intervalThumbnail(bundle);
  if (RAIL_CONCEPTS.includes(String(bundle.conceptId))) return railThumbnail(bundle);
  if (COUNT_CONCEPTS.includes(String(bundle.conceptId))) return countThumbnail(bundle);
  if (CATEGORY_CONCEPTS.includes(String(bundle.conceptId))) return categoryThumbnail(bundle);
  if (PERCENTAGE_CONCEPTS.includes(String(bundle.conceptId))) return percentageThumbnail(bundle);
  if (ARCHITECTURE_CONCEPTS.includes(String(bundle.conceptId))) return architectureThumbnail(bundle);
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

function architectureThumbnail(bundle) {
  const rows = validateResearchBinding(bundle), plan = architectureInstrumentPlan({ ...bundle, rows }), e = escapeHTML;
  let content = "";
  if (plan.kind === "log-markers") {
    content = `<text x="145" y="18" fill="#b5c3d0" font-size="8">10^25</text><text x="280" y="18" text-anchor="end" fill="#b5c3d0" font-size="8">10^27</text>`;
    content += plan.items.map((item, index) => {
      const y = 30 + index * 9.5, x = 145 + 135 * item.offset / 0.45;
      return `<g data-row-id="${e(item.row.id)}" data-native-offset="${item.offset}"><title>${e(`${item.row.name}: ${item.row.value} FLOP; ${item.row.estimateConfidence}`)}</title>
<text x="10" y="${y + 2}" fill="#edf4fa" font-size="6">${e(item.row.name)}</text><path d="M145,${y}H280" stroke="#344b55"/>
<circle cx="${x}" cy="${y}" r="2" fill="${item.color}"/></g>`;
    }).join("");
  } else if (plan.kind === "spools") {
    content = plan.items.map((item, index) => {
      const x = 34 + index * 58;
      return `<g data-row-id="${e(item.row.id)}" data-native-length="${item.extent}"><title>${e(`${item.row.name}: ${item.row.value} ${item.row.unit}; ${item.row.period}`)}</title>
<circle cx="${x}" cy="98" r="19" fill="none" stroke="#536872"/><circle cx="${x}" cy="98" r="4" fill="none" stroke="#536872"/>
<path d="M${x - 22},132h44" stroke="#344b55"/><path d="M${x - 22},132h${44 * item.extent}" stroke="${item.color}" stroke-width="3"/>
<text x="${x}" y="155" text-anchor="middle" fill="${item.color}" font-size="9">${item.row.value}</text>
<text x="${x}" y="173" text-anchor="middle" fill="#b5c3d0" font-size="6">${e(item.row.name.split(",")[0])}</text></g>`;
    }).join("");
  } else {
    const step = 270 / plan.items.length, width = plan.kind === "gates" ? 20 : plan.kind === "books" ? 10 : 4;
    const scale = plan.kind === "books" ? 300 : 150;
    content = plan.items.map((item, index) => {
      const x = 15 + step * (index + 0.5), y = 190 - scale * item.extent;
      const shape = plan.kind === "gates" ?
        `<path d="M${x - width / 2},190V${y}H${x + width / 2}V190" fill="none" stroke="${item.color}" stroke-width="2"/>` :
        `<rect x="${x - width / 2}" y="${y}" width="${width}" height="${190 - y}" fill="${item.color}"/>`;
      return `<g data-row-id="${e(item.row.id)}" data-native-length="${item.extent}" data-slot="${item.slot}"><title>${e(`${item.row.name}: ${item.row.value} ${item.row.unit}; ${item.row.period}`)}</title>
${shape}<text x="${x}" y="204" text-anchor="middle" fill="#b5c3d0" font-size="${plan.kind === "markets" ? 4 : 7}">${plan.kind === "books" ? item.row.rank : item.row.value}</text>
${item.pattern === "fiscal-diagonal" ? `<path d="M${x - 9},211l5,-5m1,5l5,-5" stroke="#88bdf4"/><text x="${x}" y="226" text-anchor="middle" fill="#b5c3d0" font-size="6">FY2025</text>` : ""}</g>`;
    }).join("");
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="250" viewBox="0 0 300 250" role="img"><title>${e(bundle.design.title)}</title>
<desc>${e(bundle.design.legend)} Source order or alphabetical abstract slots are preserved. No geographic positions are invented.</desc>
<rect width="300" height="250" fill="#080d10"/><g font-family="sans-serif">${content}
<text x="150" y="243" text-anchor="middle" fill="#b5c3d0" font-size="7">${e(plan.kind === "log-markers" ? "LOG10 POSITION · FIXED MARKER SIZE · ESTIMATES" : `NATIVE 0–${plan.domain[1]} SCALE · ABSTRACT CATEGORIES`)}</text></g></svg>`;
}

function percentageThumbnail(bundle) {
  const rows = validateResearchBinding(bundle), plan = percentageInstrumentPlan({ ...bundle, rows }), e = escapeHTML;
  const half = plan.kind === "semicircle-pairs";
  const content = plan.items.map((item, index) => {
    const x = plan.items.length === 3 ? 54 + index * 96 : index % 2 ? 223 : 77;
    const y = half ? index < 2 ? 92 : 190 : 113, radius = plan.items.length === 3 ? 29 : 36;
    const endX = half ? x - radius * Math.cos(item.angle) : x + radius * Math.sin(item.angle);
    const endY = half ? y - radius * Math.sin(item.angle) : y - radius * Math.cos(item.angle);
    const extent = (half ? Math.PI : TAU) * radius * item.fraction;
    const reference = half ? `<path d="M${x - radius},${y}A${radius},${radius} 0 0 1 ${x + radius},${y}" fill="none" stroke="#344b55" stroke-width="3"/>` :
      `<circle cx="${x}" cy="${y}" r="${radius}" fill="none" stroke="#344b55" stroke-width="3"/>`;
    const mark = half ? `<path d="M${x - radius},${y}A${radius},${radius} 0 0 1 ${endX},${endY}" fill="none" stroke="${item.color}" stroke-width="${item.high ? 1 : 4}"/>` :
      `<circle cx="${x}" cy="${y}" r="${radius}" fill="none" stroke="${item.color}" stroke-width="4" stroke-dasharray="${extent} ${TAU * radius - extent}" transform="rotate(-90 ${x} ${y})"/>`;
    let whisker = "";
    if (item.ci95) {
      const left = x - 48, yCI = 200, at = value => left + 96 * value / 100;
      whisker = `<path d="M${left},${yCI}h96" stroke="#344b55"/><path d="M${at(item.ci95[0])},${yCI}H${at(item.ci95[1])}M${at(item.ci95[0])},${yCI - 4}v8M${at(item.ci95[1])},${yCI - 4}v8" stroke="${item.color}" data-ci95="${item.ci95.join(",")}"/>
<text x="${x}" y="217" text-anchor="middle" fill="#b5c3d0" font-size="7">95% CI ${item.ci95[0]}–${item.ci95[1]}%</text>`;
    }
    const label = half ? `${item.row.sex === "female" ? "F" : "M"} · ${item.high ? "high exposure" : "any exposure"}` :
      plan.conceptId === "255" ? item.row.name.split(",")[0] :
        plan.conceptId === "233-2" ? item.row.target : plan.conceptId === "138-8" ? index ? "Lateral movement" : "Malware-writing" : item.row.name;
    return `<g data-row-id="${e(item.row.id)}" data-native-angle="${item.angle}" data-percent="${item.percent}"><title>${e(`${item.row.name}: ${item.label}; ${item.denominatorLabel || item.row.unit}; ${item.row.period}`)}</title>
${reference}${mark}<text x="${x}" y="${y + (half ? -8 : 5)}" text-anchor="middle" fill="${item.color}" font-size="14">${item.label}</text>
<text x="${x}" y="${y + (half ? 17 : 55)}" text-anchor="middle" fill="#edf4fa" font-size="8">${e(label)}</text>
${item.denominatorLabel ? `<text x="${x}" y="${y + 70}" text-anchor="middle" fill="#b5c3d0" font-size="6">${e(item.denominatorLabel)}</text>` : ""}
${whisker}</g>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="250" viewBox="0 0 300 250" role="img"><title>${e(bundle.design.title)}</title><desc>${e(bundle.design.legend)} Native published percentages and interval endpoints are unchanged.</desc>
<rect width="300" height="250" fill="#080d10"/><g font-family="sans-serif">${content}<text x="150" y="239" text-anchor="middle" fill="#b5c3d0" font-size="8">${half ? "0–100% SEMICIRCLES · HIGH IS A SUBSET OF ANY" : "INDEPENDENT COMPLETE 100% REFERENCES"}</text></g></svg>`;
}

function categoryThumbnail(bundle) {
  const rows = validateResearchBinding(bundle), plan = categoryInstrumentPlan({ ...bundle, rows }), e = escapeHTML;
  let content = "";
  if (plan.profile === "partnership") {
    const nodePositions = new Map();
    const clouds = plan.nodes.filter(node => node.role === "cloud"), models = plan.nodes.filter(node => node.role === "model");
    plan.nodes.forEach(node => {
      const list = node.role === "cloud" ? clouds : models;
      nodePositions.set(node.name, [node.role === "cloud" ? 65 : 235, 62 + list.indexOf(node) * 65 + (list.length === 2 ? 30 : 0)]);
    });
    content = plan.items.map(item => {
      const [x, y] = nodePositions.get(item.row.fromEntity), [u, v] = nodePositions.get(item.row.toEntity);
      return `<path data-row-id="${e(item.row.id)}" d="M${x},${y}Q150,${(y + v) / 2 - 14} ${u},${v}" fill="none" stroke="#8a939f"><title>${e(item.row.name)}: studied partnership</title></path>`;
    }).join("") + plan.nodes.map(node => {
      const [x, y] = nodePositions.get(node.name);
      return `<g data-entity="${e(node.name)}"><circle cx="${x}" cy="${y}" r="10" fill="${node.role === "cloud" ? "#88bdf4" : "#57d5c4"}"/>
<text x="${x}" y="${y + 25}" text-anchor="middle" fill="#edf4fa" font-size="9">${e(node.name)}</text></g>`;
    }).join("");
  } else {
    const countRows = Math.ceil(plan.items.length / 2), cardHeight = Math.min(88, 198 / countRows);
    content = plan.items.map((item, index) => {
      const x = index % 2 ? 157 : 12, y = 18 + Math.floor(index / 2) * cardHeight, width = 131, height = cardHeight - 9;
      const numeric = ["architecture", "amount-text", "metric-text"].includes(plan.profile);
      const title = `${item.row.name}: ${item.displayValue}; ${item.row.unit}; ${item.row.period}`;
      const border = ["dotted", "outline"].includes(item.pattern) ? 'stroke-dasharray="2 3"' : "";
      let glyph = "";
      if (plan.profile === "architecture")
        glyph = Array.from({ length: item.index ? 3 : 1 }, (_, n) => `<rect x="${x + 102}" y="${y + 37 + n * 4}" width="19" height="9" fill="none" stroke="${item.color}"/>`).join("");
      if (plan.profile === "celestial") glyph = `<circle cx="${x + 111}" cy="${y + 43}" r="10" fill="#b9d9f5"/>`;
      if (item.clock) {
        const cx = x + 112, cy = y + height - 15, r = 9;
        const sx = cx + r * Math.sin(TAU * 17 / 24), sy = cy - r * Math.cos(TAU * 17 / 24);
        const ex = cx + r * Math.sin(TAU * 21 / 24), ey = cy - r * Math.cos(TAU * 21 / 24);
        glyph = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#536872"/><path d="M${sx},${sy}A9,9 0 0 1 ${ex},${ey}" fill="none" stroke="${item.color}" stroke-width="2" data-hours="17,21"/>`;
      }
      const value = numeric ? item.displayValue : item.displayValue.length > 62 ? `${item.displayValue.slice(0, 59)}…` : item.displayValue;
      const split = (text, length) => text.length <= length ? [text] : [text.slice(0, length), text.slice(length)];
      return `<g data-row-id="${e(item.row.id)}" data-profile="${plan.profile}" data-native-value="${e(String(item.row.value))}"><title>${e(title)}</title>
<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${["pages", "portfolios", "books"].includes(plan.profile) ? 8 : 0}" fill="#101a22" stroke="${item.color}" ${border}/>
${split(item.row.name, 29).map((line, n) => `<text x="${x + 7}" y="${y + 12 + n * 8}" fill="#edf4fa" font-size="7">${e(line)}</text>`).join("")}
${numeric ? `<text x="${x + 7}" y="${y + height * 0.62}" fill="${item.color}" font-size="11">${e(value)}</text>
<text x="${x + 7}" y="${y + height * 0.62 + 10}" fill="#b5c3d0" font-size="5">${e(item.row.unit)}</text>` :
        split(value, 34).map((line, n) => `<text x="${x + 7}" y="${y + Math.min(33, height - 19) + n * 7}" fill="${item.color}" font-size="6">${e(line)}</text>`).join("")}
${glyph}</g>`;
    }).join("");
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="250" viewBox="0 0 300 250" role="img"><title>${e(bundle.design.title)}</title>
<desc>${e(bundle.design.legend)} Equal category forms carry no quantity, intensity or geographic allocation. Exact source dates and full definitions are in the evidence table.</desc>
<rect width="300" height="250" fill="#080d10"/><g font-family="sans-serif">${content}
<text x="150" y="237" text-anchor="middle" fill="#b5c3d0" font-size="8">SOURCE CATEGORIES · EQUAL FORMS · NO SIZE SCALE</text></g></svg>`;
}

function countThumbnail(bundle) {
  const rows = validateResearchBinding(bundle), plan = countInstrumentPlan({ ...bundle, rows }), e = escapeHTML;
  let content;
  if (plan.kind === "mosaic") {
    content = plan.items.map((item, index) => {
      const x = index % 2 ? 164 : 20, y = index < 2 ? 34 : 139;
      const cell = plan.conceptId === "333" ? 5 : 12, columns = plan.conceptId === "333" ? 11 : 4;
      const tiles = Array.from({ length: item.slots }, (_, slot) => `<rect data-anonymous-tile="${slot}" x="${x + slot % columns * cell}" y="${y + Math.floor(slot / columns) * cell}" width="${cell * 0.78}" height="${cell * 0.78}" fill="${item.color}"/>`).join("");
      const label = plan.conceptId === "63-8" && index === 1 ? "Professional / post-edited" : item.row.name;
      return `<g data-row-id="${e(item.row.id)}" data-native-count="${item.row.value}"><title>${e(`${item.row.name}: ${item.label}`)}</title>
${tiles}<text x="${x}" y="${y + 73}" fill="#edf4fa" font-size="8">${e(label)}</text>
<text x="${x}" y="${y + 85}" fill="${item.color}" font-size="10">${item.row.value} ${e(item.row.unit)}</text></g>`;
    }).join("");
  } else if (plan.kind === "counters") {
    content = plan.items.map((item, index) => {
      const x = index ? 222 : 78, y = 111;
      return `<g data-row-id="${e(item.row.id)}" data-native-count="${item.row.value}" data-denominator="9"><title>${e(item.row.name)}: ${item.row.value}/9</title>
${Array.from({ length: 9 }, (_, slot) => {
        const a = TAU * slot / 9;
        return `<rect data-anonymous-slot="${slot}" data-filled="${slot < item.row.value}" x="${x + Math.sin(a) * 40 - 5}" y="${y - Math.cos(a) * 40 - 5}" width="10" height="10" fill="${slot < item.row.value ? item.color : "none"}" stroke="${item.color}"/>`;
      }).join("")}
<text x="${x}" y="${y + 5}" text-anchor="middle" font-size="20" fill="${item.color}">${item.row.value}/9</text>
<text x="${x}" y="180" text-anchor="middle" font-size="10" fill="#edf4fa">${e(item.row.comparison)}</text></g>`;
    }).join("") + `<text x="150" y="211" text-anchor="middle" font-size="9" fill="#b5c3d0">3-MONTH LEAD · 6 VALIDATION + 3 TEST YEARS</text>`;
  } else {
    content = plan.items.map((item, index) => {
      const x = 40 + index * 72, y = 162 - 110 * item.fraction;
      return `<g data-row-id="${e(item.row.id)}" data-native-fraction="${item.fraction}" data-time-basis="${e(item.row.timeBasis)}"><title>${e(`${item.row.name}: ${item.label}; ${item.row.timeBasis}`)}</title>
<path d="M${x},52V162" stroke="#536872"/><rect x="${x - 8}" y="${y - 3}" width="16" height="6" fill="${index < 2 ? item.color : "none"}" stroke="${item.color}"/>
<text x="${x}" y="181" text-anchor="middle" fill="${item.color}" font-size="11">${item.row.value}</text>
<text x="${x}" y="196" text-anchor="middle" fill="#b5c3d0" font-size="8">${e(item.row.statistic)}</text></g>`;
    }).join("") + `<text x="76" y="220" text-anchor="middle" fill="#b5c3d0" font-size="8">Including unpaid time</text>
<text x="220" y="220" text-anchor="middle" fill="#b5c3d0" font-size="8">Paid hours only</text>
<text x="150" y="28" text-anchor="middle" fill="#b5c3d0" font-size="10">0–10 USD/hour · source survey estimates</text>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="250" viewBox="0 0 300 250" role="img"><title>${e(bundle.design.title)}</title>
<desc>${e(bundle.design.legend)} Anonymous units retain exact counts. No individual year, country, language or worker identities are inferred.</desc>
<rect width="300" height="250" fill="#080d10"/><g font-family="sans-serif">${content}
<text x="150" y="242" text-anchor="middle" fill="#b5c3d0" font-size="8">${plan.kind === "counterweights" ? "MEAN ≠ MEDIAN · DIFFERENT TIME DENOMINATORS" : "ANONYMOUS COUNT POSITIONS · SOURCE CATEGORIES"}</text></g></svg>`;
}

function railThumbnail(bundle) {
  const rows = validateResearchBinding(bundle), plan = railInstrumentPlan({ ...bundle, rows });
  const meridian = ["409", "232"].includes(plan.conceptId);
  const e = escapeHTML;
  let content = "";
  if (meridian) {
    content = plan.items.map((item, index) => {
      const y = 40 + index * 23;
      const start = 157, end = 282, x = start + (end - start) * item.fraction;
      return `<g data-row-id="${e(item.row.id)}" data-native-fraction="${item.fraction}">
<title>${e(`${item.row.name}: ${item.label}; ${item.row.unit}; ${item.row.period}`)}</title>
<path d="M${start},${y}H${end}" stroke="#344b55"/>
${item.kind === "marker" ? `<circle cx="${x}" cy="${y}" r="3" fill="#080d10" stroke="${item.color}"/>` :
    `<path d="M${start},${y}H${x}" stroke="${item.color}" stroke-width="4"/>`}
<text x="12" y="${y - 2}" fill="#edf4fa" font-size="7">${e(item.row.name)}</text>
<text x="12" y="${y + 8}" fill="${item.color}" font-size="7">${e(item.label)}</text></g>`;
    }).join("");
    content += `<text x="157" y="24" fill="#b5c3d0" font-size="9">0</text><text x="282" y="24" text-anchor="end" fill="#b5c3d0" font-size="9">100</text>`;
    if (plan.conceptId === "232") {
      content += `<text x="12" y="184" fill="#b5c3d0" font-size="8">Same small shares · separate 0–10% inset</text>`;
      content += plan.items.filter(item => item.row.value <= 10).map((item, index) => {
        const y = 193 + index * 9;
        return `<g data-inset-row-id="${e(item.row.id)}" data-panel-domain="0,10"><text x="12" y="${y + 3}" fill="#b5c3d0" font-size="6">${e(item.row.name)}</text>
<path d="M157,${y}H282" stroke="#344b55"/><path d="M157,${y}h${125 * item.row.value / 10}" stroke="${item.color}" stroke-width="2"/></g>`;
      }).join("");
    } else content += `<text x="150" y="201" text-anchor="middle" fill="#b5c3d0" font-size="9">ARCHIVED CONSISTENCY ≠ ACCURACY</text>`;
  } else {
    const panels = plan.panels.filter(panel => panel.items.length);
    const rowSpace = Math.min(53, (188 - panels.length * 13) / rows.length);
    let cursor = 28;
    content = panels.map(panel => {
      const titleY = cursor; cursor += 15;
      const rowsSvg = panel.items.map(item => {
        const y = cursor + rowSpace * 0.52; cursor += rowSpace;
        const x = 126, extent = 150 * item.fraction;
        let shape = `<rect x="${x}" y="${y - 2}" width="${extent}" height="4" fill="${item.color}"/>`;
        if (item.kind === "outline") shape = `<rect x="${x}" y="${y - 3}" width="${extent}" height="6" fill="none" stroke="${item.color}"/>`;
        if (item.kind === "caliper") shape = `<path d="M${x},${y}h${extent}M${x},${y - 4}v8M${x + extent},${y - 4}v8" stroke="${item.color}" fill="none"/>`;
        const label = plan.conceptId === "324" ? `${item.row.buyer} · ${item.row.kind}` :
          plan.conceptId === "369" && item.row.measureType === "corporate revenue" ? `Microsoft ${item.row.id.endsWith("2025") ? "FY2025" : "FY2026"}` :
            plan.conceptId === "385" && item.kind === "outline" ? "Four-year intention" :
              plan.conceptId === "372" ? item.index ? "Public reporting" : "Proactive investigation" : item.row.name;
        return `<g data-row-id="${e(item.row.id)}" data-native-fraction="${item.fraction}" data-kind="${item.kind}">
<title>${e(`${item.row.name}: ${item.label}; ${item.row.unit}; ${item.row.period}; ${item.row.kind || item.row.measureType || ""}`)}</title>
<text x="12" y="${y - 5}" fill="#edf4fa" font-size="7">${e(label)}</text>
<text x="12" y="${y + 7}" fill="${item.color}" font-size="8">${e(item.label)}</text>
<path d="M126,${y}H276" stroke="#344b55"/>${shape}
${item.row.incrementalMW ? `<text x="126" y="${y + 13}" fill="#b5c3d0" font-size="6">190 MW included; not added again</text>` : ""}</g>`;
      }).join("");
      return `<g data-panel-domain="${panel.domain.join(",")}"><text x="12" y="${titleY}" fill="#b5c3d0" font-size="8">${e(panel.title)}</text>${rowsSvg}</g>`;
    }).join("");
    content += `<text x="150" y="220" text-anchor="middle" fill="#b5c3d0" font-size="9">0–${plan.domain[1] >= 1e9 ? plan.domain[1] / 1e9 + "bn" : plan.domain[1]} ${e(plan.unit)}</text>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="250" viewBox="0 0 300 250" role="img">
<title>${e(bundle.design.title)}</title><desc>${e(bundle.design.legend)} All positions are categorical. Source row names and values are available in the full evidence table.</desc>
<rect width="300" height="250" fill="#080d10"/><g font-family="sans-serif">${content}<text x="150" y="244" text-anchor="middle" font-size="7" fill="#b5c3d0">NATIVE SOURCE UNITS · CATEGORIES ARE NOT GEOGRAPHY</text></g></svg>`;
}

function intervalThumbnail(bundle) {
  const rows = validateResearchBinding(bundle);
  const plan = intervalInstrumentPlan({ ...bundle, rows });
  let content = "";
  if (plan.kind === "qualified-rings") {
    content = plan.items.map((item, index) => {
      const x = index % 2 ? 220 : 80, y = index < 2 ? 80 : 173, radius = 27;
      const extent = TAU * radius * item.row.value / 100;
      const endX = x + Math.sin(item.angle) * radius, endY = y - Math.cos(item.angle) * radius;
      const terminal = item.qualifier === "<"
        ? `<circle cx="${endX}" cy="${endY}" r="3" fill="#080d10" stroke="${item.color}"/>`
        : `<path d="M${endX - 3},${endY - 3}l6,6" stroke="${item.color}" ${item.qualifier === "approximately" ? 'stroke-dasharray="2 2"' : ""}/>`;
      return `<g data-row-id="${escapeHTML(item.row.id)}" data-qualifier="${escapeHTML(item.qualifier)}" data-native-angle="${item.angle}">
<title>${escapeHTML(`${item.row.name}: ${item.label}; ${item.row.period}`)}</title>
<circle cx="${x}" cy="${y}" r="${radius}" fill="none" stroke="#344b55" stroke-width="3"/>
<circle cx="${x}" cy="${y}" r="${radius}" fill="none" stroke="${item.color}" stroke-width="3" stroke-dasharray="${extent} ${TAU * radius - extent}" transform="rotate(-90 ${x} ${y})"/>
${terminal}<text x="${x}" y="${y + 4}" text-anchor="middle" fill="#edf4fa" font-size="11">${escapeHTML(item.label)}</text>
<text x="${x}" y="${y + 43}" text-anchor="middle" fill="#b5c3d0" font-size="10">${escapeHTML(item.row.name)}</text></g>`;
    }).join("");
  } else {
    const totalRows = plan.panels.reduce((count, panel) => count + panel.items.length, 0);
    const step = Math.min(43, (187 - plan.panels.length * 22) / totalRows);
    let cursor = 30;
    content = plan.panels.map(panel => {
      const start = cursor;
      cursor += 22;
      const panelRows = panel.items.map(item => {
        const y = cursor + step * 0.6;
        cursor += step;
        const xAt = value => 129 + 147 * value / panel.domain[1];
        const rowName = item.row.outcome || (item.row.id === "gfw-fishing-untracked" ? "Fishing" :
          item.row.id === "gfw-other-untracked" ? "Other vessels" : item.row.name);
        let mark = "";
        if (item.kind === "range")
          mark = `<rect x="${xAt(item.lower)}" y="${y - 2}" width="${xAt(item.upper) - xAt(item.lower)}" height="4" fill="${item.color}" data-lower="${item.lower}" data-upper="${item.upper}"/>`;
        else if (item.kind === "whisker")
          mark = `<path d="M${xAt(item.lower)},${y}H${xAt(item.upper)}M${xAt(item.lower)},${y - 4}v8M${xAt(item.upper)},${y - 4}v8" stroke="${item.color}" data-lower="${item.lower}" data-upper="${item.upper}"/><circle cx="${xAt(item.point)}" cy="${y}" r="3" fill="#080d10" stroke="${item.color}" data-point="${item.point}"/>`;
        else if (item.kind === "share")
          mark = `<rect x="129" y="${y - 2}" width="${xAt(item.point) - 129}" height="4" fill="${item.color}"/>`;
        else {
          if (item.qualifier === "approximately")
            mark += `<rect x="129" y="${y - 2}" width="${xAt(item.boundary) - 129}" height="4" fill="${item.color}"/>`;
          mark += item.qualifier === "<"
            ? `<circle cx="${xAt(item.boundary)}" cy="${y}" r="3" fill="#080d10" stroke="${item.color}" data-boundary="${item.boundary}"/>`
            : `<path d="M${xAt(item.boundary)},${y - 4}v8" stroke="${item.color}" stroke-dasharray="2 2"/>`;
        }
        return `<g data-row-id="${escapeHTML(item.row.id)}" data-kind="${item.kind}">
<title>${escapeHTML(`${item.row.name} · ${item.label}; ${item.row.period}`)}</title>
<text x="12" y="${y - 3}" fill="#edf4fa" font-size="9">${escapeHTML(rowName)}</text>
<text x="12" y="${y + 7}" fill="#b5c3d0" font-size="7">${escapeHTML(item.label)}</text>
<path d="M129,${y}H276" stroke="#344b55"/>${mark}</g>`;
      }).join("");
      return `<g data-panel-domain="${panel.domain.join(",")}"><text x="12" y="${start + 9}" fill="#b5c3d0" font-size="8">${escapeHTML(panel.title)}</text><text x="276" y="${start + 19}" text-anchor="end" fill="#b5c3d0" font-size="8">${escapeHTML(`${panel.domain[0]}–${panel.domain[1]} ${panel.unit}`)}</text>${panelRows}</g>`;
    }).join("");
  }
  const footer = plan.conceptId === "388" ? "RANGES ≠ POINTS · SHARES TOTAL 99%" :
    plan.conceptId === "330" ? "±1 ROBUST SE · ONE TRIAL · N 654" :
      plan.conceptId === "406" ? "% OF OPERATING YEAR · NOT WATER VOLUME" : "COUNTRY VS CONTINENT · BOUNDS ≠ POINTS";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="250" viewBox="0 0 300 250" role="img" aria-labelledby="research-title research-description">
<title id="research-title">${escapeHTML(bundle.design.title)}</title>
<desc id="research-description">${escapeHTML(bundle.design.legend)} Qualifiers and interval endpoints are preserved. No geographic allocation.</desc>
<rect width="300" height="250" fill="#080d10"/><g font-family="sans-serif">${content}<text x="150" y="239" text-anchor="middle" fill="#b5c3d0" font-size="8">${escapeHTML(footer)}</text></g></svg>`;
}

function pairThumbnail(bundle) {
  const rows = validateResearchBinding(bundle);
  const plan = pairRingPlan({ ...bundle, rows });
  const radius = 43, circumference = TAU * radius;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="250" viewBox="0 0 300 250" role="img" aria-labelledby="research-title research-description">
<title id="research-title">${escapeHTML(bundle.design.title)}</title>
<desc id="research-description">Two equal complete 100% reference rings. ${escapeHTML(bundle.design.legend)} Global statistics, not a geographic map. No interpolated values.</desc>
<rect width="300" height="250" fill="#080d10"/>
${plan.rings.map((item, index) => {
    const x = index ? 220 : 80, y = 110, extent = circumference * item.row.value / 100;
    return `<g data-row-id="${escapeHTML(item.row.id)}" data-native-angle="${item.angle}">
<title>${escapeHTML(`${item.label}: ${item.row.value}% · ${item.row.period}`)}</title>
<circle cx="${x}" cy="${y}" r="${radius}" fill="none" stroke="#344b55" stroke-width="6"/>
<circle cx="${x}" cy="${y}" r="${radius}" fill="none" stroke="${item.color}" stroke-width="6" stroke-dasharray="${extent} ${circumference - extent}" transform="rotate(-90 ${x} ${y})"/>
<text x="${x}" y="${y + 5}" fill="#edf4fa" text-anchor="middle" font-family="monospace" font-size="16">${item.row.value}%</text>
<text x="${x}" y="177" fill="#b5c3d0" text-anchor="middle" font-family="sans-serif" font-size="11">${escapeHTML(item.label)}</text>
</g>`;
  }).join("")}
<text x="150" y="217" fill="#b5c3d0" text-anchor="middle" font-family="monospace" font-size="10">EQUAL 100% REFERENCE RINGS</text>
<text x="150" y="235" fill="#b5c3d0" text-anchor="middle" font-family="monospace" font-size="9">GLOBAL SHARES · NO GEOGRAPHIC ALLOCATION</text>
</svg>`;
}

function accessThumbnail(bundle) {
  const rows = validateResearchBinding(bundle);
  const plan = accessPaintPlan({ ...bundle, rows });
  const paths = (country, fill, extra = "") => country.polygons.map(polygon =>
    [-360, 0, 360].map(shift => {
      const path = polygon.map(ring => ring.map(([lon, lat], index) =>
        `${index ? "L" : "M"}${((lon + shift + 180) / 360 * 276 + 12).toFixed(3)},${
          ((90 - lat) / 180 * 138 + 48).toFixed(3)}`).join("") + "Z").join("");
      return `<path d="${path}" fill="${fill}" fill-rule="evenodd" stroke="#182b30" stroke-width=".3" ${extra}/>`;
    }).join("")).join("");
  const mapped = plan.countries.map(country =>
    `<g data-row-id="${escapeHTML(country.row.id)}" data-native-fraction="${
      country.row.value === null ? "missing" : country.row.value / 100
    }"><title>${escapeHTML(`${country.row.name}: ${
      country.row.value === null ? "No observation" : `${country.row.value}%`
    }; basic electricity access, 2024`)}</title>${
      paths(country, country.row.value === null ? "url(#missing-hatch)" : country.fill)
    }</g>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="250" viewBox="0 0 300 250" role="img" aria-labelledby="research-title research-description">
<title id="research-title">${escapeHTML(bundle.design.title)}</title>
<desc id="research-description">Basic electricity access in 2024, fixed 0–100% scale. Geographic overview using audited country boundaries. ${plan.coverage.mapped} mapped economies; ${plan.coverage.tableOnly} remain table-only. Access does not measure reliability, affordability or AI use.</desc>
<defs><clipPath id="map-clip"><rect x="12" y="48" width="276" height="138"/></clipPath><pattern id="missing-hatch" width="5" height="5" patternUnits="userSpaceOnUse"><rect width="5" height="5" fill="#66717e"/><path d="M-1,1l2,-2M0,5l5,-5M4,6l2,-2" stroke="#b5c3d0" stroke-width="1"/></pattern></defs>
<rect width="300" height="250" fill="#080d10"/>
<rect x="12" y="48" width="276" height="138" fill="${ACCESS_OCEAN}"/>
<g clip-path="url(#map-clip)">${plan.background.map(country => paths(country, ACCESS_OUTSIDE)).join("")}${mapped}</g>
<g font-family="monospace" text-anchor="middle" font-size="9" fill="#b5c3d0">
<text x="150" y="30">BASIC ELECTRICITY ACCESS · 2024</text>
${[0, 25, 50, 75, 100].map((value, index) => `<rect x="${35 + index * 48}" y="198" width="38" height="6" fill="${accessColor(value)}"/><text x="${54 + index * 48}" y="217">${value}%</text>`).join("")}
<text x="150" y="238">${plan.coverage.mapped} MAPPED · ${plan.coverage.tableOnly} TABLE-ONLY ECONOMIES</text>
</g></svg>`;
}

function comparisonThumbnail(bundle) {
  const rows = validateResearchBinding(bundle), plan = comparisonInstrumentPlan({ ...bundle, rows });
  const size = 186 / plan.items.length, xAt = value => 149 + 130 * value / plan.domain[1];
  const content = plan.items.map((item, index) => {
    const y = 28 + size * index, x = xAt(item.row.value), color = item.color;
    let mark = `<circle cx="${x}" cy="${y}" r="2" fill="#080d10" stroke="${color}"/>`;
    if (["bar", "reported-total", "open-lower-bar"].includes(item.kind)) {
      const left = xAt(item.stackStart), right = xAt(item.stackStart + item.row.value);
      mark = `<rect x="${left}" y="${y - 1.5}" width="${right - left}" height="3" fill="${item.kind === "reported-total" ? "none" : color}" stroke="${color}"/>`;
      if (item.kind === "open-lower-bar") mark += `<path d="M${right - 3},${y - 3}l5,3l-5,3" fill="none" stroke="${color}"/>`;
      if (item.row.qualifier === "approximately") mark += `<path d="M${right},${y - 4}v8" stroke="${color}" stroke-dasharray="1 1"/>`;
    }
    if (item.interval) mark += `<path d="M${xAt(item.interval[0])},${y}H${xAt(item.interval[1])}M${xAt(item.interval[0])},${y - 3}v6M${xAt(item.interval[1])},${y - 3}v6" stroke="${color}" data-lower="${item.interval[0]}" data-upper="${item.interval[1]}"/>`;
    return `<g data-row-id="${escapeHTML(item.row.id)}" data-native-value="${item.row.value}" data-stack-start="${item.stackStart}"><title>${escapeHTML(`${item.key}: ${item.label} ${item.displayValue}; ${item.row.unit}; ${item.row.period}; ${item.supportingText || ""}`)}</title><text x="12" y="${y + 2}" font-size="${Math.min(7, size * 0.65)}" fill="#b5c3d0">${escapeHTML(`${item.key} · ${item.displayValue}`.slice(0, 33))}</text><path d="M149,${y}H279" stroke="#344b55"/>${mark}</g>`;
  }).join("");
  const footer = plan.warning || (plan.conceptId === "398" ? "SOURCE WATER-DEFICIT INDEX; SD IS TEXT ONLY" :
    plan.conceptId === "115-2" ? "PARENTHETICAL UNCERTAINTY; NO CI INFERRED" : plan.conceptId === "211-4" ? "95% CI; CRASHED VEHICLES / MILLION VEHICLE-MILES" :
    plan.conceptId === "214" ? "PRODUCTION ≠ SHIPMENTS; TOTAL IS NOT AN EXTRA PART" : plan.conceptId === "323" ? "ROUNDED SHARES; NO NORMALISATION" : "SOURCE METRICS REMAIN SEPARATE");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="250" viewBox="0 0 300 250"><title>${escapeHTML(bundle.design.title)}</title><desc>${escapeHTML(bundle.design.legend)}</desc><rect width="300" height="250" fill="#080d10"/><g font-family="sans-serif">${content}<text x="150" y="230" text-anchor="middle" font-size="6.5" fill="#b5c3d0">0–${plan.domain[1]} NATIVE SCALE</text><text x="150" y="242" text-anchor="middle" font-size="5.8" fill="#b5c3d0">${escapeHTML(footer)}</text></g></svg>`;
}

function mapThumbnail(bundle) {
  const rows = validateResearchBinding(bundle), plan = geographyInstrumentPlan({ ...bundle, rows });
  let content = "", footer = "", description = bundle.design.legend;
  if (plan.conceptId === "378") {
    const species = plan.species[0], week = plan.weeks[0];
    const xAt = lon => 25 + (lon - Math.min(...plan.sites.map(site => site.lon))) / (Math.max(...plan.sites.map(site => site.lon)) - Math.min(...plan.sites.map(site => site.lon))) * 250;
    const yAt = lat => 202 - (lat - Math.min(...plan.sites.map(site => site.lat))) / (Math.max(...plan.sites.map(site => site.lat)) - Math.min(...plan.sites.map(site => site.lat))) * 154;
    content = plan.sites.map(site => {
      const item = plan.items.find(item => item.row.name === site.name && item.row.species === species && item.row.week === week);
      const x = xAt(site.lon), y = yAt(site.lat), fill = !item || item.state === "unknown" ? "url(#geo-missing)" : item.state === "detected" ? "#57d5c4" : "#080d10";
      const absent = !item ? `<path d="M${x-3},${y-3}l6,6M${x-3},${y+3}l6,-6" stroke="#b5c3d0"/>` : "";
      const effort = item?.effortAngle == null ? "" : `<circle cx="${x}" cy="${y}" r="5" fill="none" stroke="#344b55"/><circle cx="${x}" cy="${y}" r="5" fill="none" stroke="#b5c3d0" stroke-dasharray="${5 * item.effortAngle} ${5 * (TAU - item.effortAngle)}" transform="rotate(-90 ${x} ${y})"/>`;
      return `<g data-row-id="${escapeHTML(item?.row.id || "")}" data-source-lat="${site.lat}" data-source-lon="${site.lon}" data-absent="${!item}"><title>${escapeHTML(`${site.name}; ${item?.state || "unknown absent combination"}; ${species}, week ${week}`)}</title>${item ? `<circle cx="${x}" cy="${y}" r="3" fill="${fill}" stroke="${item.state === "not-detected" ? "#88bdf4" : "#66717e"}"/>` : absent}${effort}</g>`;
    }).join("");
    footer = `${species.toUpperCase()} · SOURCE WEEK ${week}`;
    description += " Static first species/week regional coordinate view; remaining observations are selectable in the live scene and table.";
  } else {
    const xAt = lon => (lon + 180) / 360 * 276 + 12, yAt = lat => (90 - lat) / 180 * 138 + 42;
    const paths = (country, fill, stroke = "#182b30") => country.polygons.map(polygon => [-360,0,360].map(shift =>
      `<path d="${polygon.map(ring => ring.map(([lon,lat],index) => `${index ? "L" : "M"}${xAt(lon+shift)},${yAt(lat)}`).join("")+"Z").join("")}" fill="${fill}" fill-rule="evenodd" stroke="${stroke}" stroke-width=".5"/>`).join("")).join("");
    const paint = mapPaintPlan(plan, "people");
    content = `<g clip-path="url(#geo-clip)">${plan.background.map(country => paths(country,"#343e49")).join("")}${paint.countries.map(country => {
      let mark = "";const anchor = country.displayAnchor;
      if(plan.conceptId === "375") mark = `<path d="M${xAt(anchor.lon)},${yAt(anchor.lat)}v${-country.length*70}" stroke="#57d5c4" stroke-width="2" data-native-length="${country.length}"/>`;
      if(plan.conceptId === "78-4" && country.radius !== null) mark = `<circle cx="${xAt(anchor.lon)}" cy="${yAt(anchor.lat)}" r="${country.radius*70}" fill="#57d5c4" data-native-radius="${country.radius}"/>`;
      return `<g data-row-id="${escapeHTML(country.row.id)}"><title>${escapeHTML(`${country.row.name}; ${rows[country.index].value}; ${rows[country.index].unit}`)}</title>${paths(country, country.row.value === null ? "url(#geo-missing)" : country.fill, plan.conceptId === "78-4" ? "#182b30" : "#57d5c4")}${mark}</g>`;
    }).join("")}</g>`;
    footer = `${plan.coverage.mapped} MAPPED · ${plan.coverage.tableOnly} TABLE-ONLY`;
    description += plan.conceptId === "78-4" ? " Default count-area mode; percentage mode is a separate explicit live control." : " Country summaries; anchors are not observed site locations.";
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="250" viewBox="0 0 300 250"><title>${escapeHTML(bundle.design.title)}</title><desc>${escapeHTML(description)}</desc><defs><clipPath id="geo-clip"><rect x="12" y="42" width="276" height="138"/></clipPath><pattern id="geo-missing" width="5" height="5" patternUnits="userSpaceOnUse"><rect width="5" height="5" fill="#66717e"/><path d="M0,5L5,0" stroke="#b5c3d0"/></pattern></defs><rect width="300" height="250" fill="#080d10"/>${content}<text x="150" y="230" text-anchor="middle" font-family="sans-serif" font-size="9" fill="#b5c3d0">${escapeHTML(footer)}</text><text x="150" y="244" text-anchor="middle" font-family="sans-serif" font-size="7" fill="#b5c3d0">${plan.conceptId === "378" ? "PUBLISHED RANDOMISED COORDINATES; UNKNOWN ≠ ABSENT" : "COUNTRY SUMMARY; NO LOCAL DENSITY OR SITE LOCATION"}</text></svg>`;
}

function typedPanelThumbnail(bundle) {
  const rows=validateResearchBinding(bundle),plan=AMENDED_CONCEPTS.includes(String(bundle.conceptId))?amendedInstrumentPlan({...bundle,rows}):panelInstrumentPlan({...bundle,rows}),step=190/plan.items.length;
  const description = plan.conceptId === "156-8"
    ? "Rounded primary-report 53% of surveyed workers had clients outside their country. Separately, 90% of respondents who knew client location reported clients outside Latin America and the Caribbean. The denominators differ; do not multiply these percentages."
    : bundle.design.legend;
  const content=plan.items.map((item,index)=>{
    const y=27+index*step,qualifier=item.row.qualifier===">"?">":item.row.qualifier==="approximately"?"≈":item.row.qualifier==="rounded source percentage"?"Rounded ":"";
    const xAt=value=>151+125*value/item.domain[1];let mark="";
    if(item.kind==="bar")mark=`<path d="M151,${y+8}H276" stroke="#344b55"/><path d="M151,${y+8}H${xAt(item.value)}" stroke="${item.color}" stroke-width="4"/>`;
    if(item.kind==="hazard")mark=`<path d="M151,${y+8}H276M${xAt(1)},${y+3}v10" stroke="#344b55"/><path d="M${xAt(item.interval[0])},${y+8}H${xAt(item.interval[1])}M${xAt(item.interval[0])},${y+4}v8M${xAt(item.interval[1])},${y+4}v8" stroke="${item.color}" data-lower="${item.interval[0]}" data-upper="${item.interval[1]}"/><circle cx="${xAt(item.value)}" cy="${y+8}" r="3" fill="#080d10" stroke="${item.color}"/>`;
    if(item.kind==="ring"){const r=Math.min(12,step*.32),c=TAU*r;mark=`<circle cx="260" cy="${y+5}" r="${r}" fill="none" stroke="#344b55"/><circle cx="260" cy="${y+5}" r="${r}" fill="none" stroke="${item.color}" stroke-width="3" stroke-dasharray="${c*item.value/100} ${c*(1-item.value/100)}" transform="rotate(-90 260 ${y+5})"/>`;}
    return `<g data-row-id="${escapeHTML(item.row.id)}" data-kind="${item.kind}"><title>${escapeHTML(`${item.row.name}; ${qualifier}${item.value}; ${item.row.unit}; ${item.caption}; ${item.row.period}`)}</title><text x="12" y="${y}" font-size="8" fill="${item.color}">${escapeHTML(item.row.name.slice(0,44))}</text><text x="12" y="${y+12}" font-size="7" fill="#b5c3d0">${escapeHTML(`${qualifier}${item.value} ${item.row.unit}`.slice(0,72))}</text>${mark}</g>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="250" viewBox="0 0 300 250"><title>${escapeHTML(bundle.design.title)}</title><desc>${escapeHTML(description)}</desc><rect width="300" height="250" fill="#080d10"/><g font-family="sans-serif">${content}<text x="150" y="238" text-anchor="middle" fill="#b5c3d0" font-size="8">SEPARATE SOURCE UNITS AND DENOMINATORS</text></g></svg>`;
}
function histogramThumbnail(bundle){
 const plan=histogramPlan({...bundle,rows:validateResearchBinding(bundle)});
 return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="250" viewBox="0 0 300 250"><title>${escapeHTML(bundle.design.title)}</title><desc>Paired source count histograms, zero-frequency bins retained. Red wine N1599; white wine N4898. Share mode remains a separate explicit live control.</desc><rect width="300" height="250" fill="#080d10"/><path d="M18,205H285" stroke="#536872"/>${plan.items.map(item=>{const x=25+item.row.qualityScore*24+(item.row.wineType==="white"?7:0),h=item.length*160;return `<g data-row-id="${escapeHTML(item.row.id)}" data-count="${item.row.value}" data-denominator="${item.row.sampleDenominator}"><title>${escapeHTML(`${item.row.name}: ${item.row.value} / ${item.row.sampleDenominator}`)}</title><rect x="${x}" y="${205-h}" width="5" height="${h}" fill="${item.color}"/><path d="M${x},205h5" stroke="${item.color}"/></g>`;}).join("")}<g fill="#b5c3d0" font-family="sans-serif" font-size="9" text-anchor="middle">${Array.from({length:11},(_,i)=>`<text x="${29+i*24}" y="220">${i}</text>`).join("")}<text x="150" y="20">0–2500 SAMPLES · QUALITY SCORE 0–10</text><text x="150" y="240">AMBER: RED WINE · BLUE: WHITE WINE</text></g></svg>`;
}

function multiThumbnail(bundle){
 const plan=multiInstrumentPlan(bundle);
 const history=plan.history.map((item,index)=>{
  const x=25+index*25;
  const mark=item.kind==="chronological-rib"?`<path d="M${x},130V${130-95*item.value/8000}" stroke="${item.color}" stroke-width="4" data-native-length="${item.value/8000}"/>`:
   `<circle cx="${x}" cy="90" r="8" fill="none" stroke="#344b55"/><circle cx="${x}" cy="90" r="8" fill="none" stroke="${item.color}" stroke-width="2" stroke-dasharray="${16*Math.PI*item.value/100} ${16*Math.PI*(1-item.value/100)}" transform="rotate(-90 ${x} 90)" data-native-angle="${TAU*item.value/100}"/>`;
  return `<g data-row-id="${escapeHTML(item.row.id)}" data-dataset-id="${escapeHTML(item.row.datasetId)}"><title>${escapeHTML(`${item.row.period}: ${item.value}; ${item.caption}`)}</title>${mark}<text x="${x}" y="146" text-anchor="middle" font-size="6" fill="#b5c3d0">${item.row.period}</text></g>`;
 }).join("");
 const context=plan.context.map((item,index)=>{
  const y=plan.history.length?169+index*23:30+index*48;
  return `<g data-row-id="${escapeHTML(item.row.id)}" data-dataset-id="${escapeHTML(item.row.datasetId)}"><title>${escapeHTML(`${item.row.name}: ${item.value}; ${item.row.unit}; ${item.caption}`)}</title><text x="12" y="${y}" font-size="8" fill="${item.color}">${escapeHTML(item.row.name.slice(0,45))}</text><text x="12" y="${y+11}" font-size="7" fill="#b5c3d0">${escapeHTML(`${item.value} ${item.row.unit}`.slice(0,72))}</text></g>`;
 }).join("");
 return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="250" viewBox="0 0 300 250"><title>${escapeHTML(bundle.design.title)}</title><desc>${escapeHTML(bundle.design.legend)}</desc><rect width="300" height="250" fill="#080d10"/><g font-family="sans-serif">${history}${context}<text x="150" y="240" text-anchor="middle" fill="#b5c3d0" font-size="7">DISTINCT SOURCES; NO ALLOCATION OR CANCELLATION</text></g></svg>`;
}

function crossingThumbnail(bundle){
 const plan=amendedInstrumentPlan(bundle),positions=plan.items.map(item=>({x:25+250*item.value/100,y:item.index<2?68:170}));
 return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="250" viewBox="0 0 300 250"><title>${escapeHTML(bundle.design.title)}</title><desc>Four exact scores on two task rails. Constant-width same-model links show the task-specific rank reversal, not overall ranking.</desc><rect width="300" height="250" fill="#080d10"/><path d="M25,68H275M25,170H275" stroke="#344b55"/>${[[0,2],[1,3]].map(pair=>`<path d="M${positions[pair[0]].x},${positions[pair[0]].y}L${positions[pair[1]].x},${positions[pair[1]].y}" stroke="${plan.items[pair[0]].color}" fill="none"/>`).join("")}${plan.items.map(item=>`<g data-row-id="${escapeHTML(item.row.id)}" data-score="${item.value}"><title>${escapeHTML(`${item.row.name}; ${item.row.benchmark}; ${item.value}%; ${item.row.configuration}`)}</title><circle cx="${positions[item.index].x}" cy="${positions[item.index].y}" r="3" fill="#080d10" stroke="${item.color}"/><text x="${positions[item.index].x}" y="${positions[item.index].y+(item.index%2?16:-9)}" text-anchor="middle" fill="${item.color}" font-family="sans-serif" font-size="9">${item.value}%</text></g>`).join("")}<g font-family="sans-serif" font-size="10" fill="#b5c3d0" text-anchor="middle"><text x="150" y="35">MMLU Pro</text><text x="150" y="205">AIME 2026</text><text x="150" y="228">VIOLET: E2B THINKING · AMBER: 27B IT</text><text x="150" y="242">0–100% · DEVELOPER-REPORTED · AIME: NO TOOLS</text></g></svg>`;
}
