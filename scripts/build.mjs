import { soundscapeProfile } from "../src/soundscape.js";
import { prepareResearchRuntime } from "./research-runtime.mjs";
import { researchThumbnail } from "./research-thumbnail.mjs";
import { motif } from "./thumbnail-effects.mjs";
import { scoreFor } from "../src/scoring.js";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  decodeTopology,
  escapeHTML as esc,
  xyz,
  hash,
} from "../src/math.js";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const read = async (p) =>
  JSON.parse(await fs.readFile(path.join(root, p), "utf8"));
const catalogue = await read("data/source-catalog.json");
const evidence = await read("data/evidence.json");
const topo = await read("vendor/countries-110m.json");
const countries = decodeTopology(topo);
const researchRuntime = await prepareResearchRuntime(root, dist);
const researchBundles = Object.fromEntries(await Promise.all(Object.entries(researchRuntime).map(async ([id,summary]) => [id, JSON.parse(await fs.readFile(path.join(dist,summary.release.url), 'utf8'))])));
const matches = {
  power: "322",
  capital: "381",
  models: "347",
  robots: "336",
  access: "221",
  network: "327",
  adoption: "1-8",
  work: "207",
  languages: "66-11",
  water: "3-11",
  sovereignty: "315",
  borders: "97-8",
  proteins: "231",
  chokepoints: "391",
};
const lenses = {
  energy: ["Power", "#d5f57c"],
  water: ["Water", "#78d6e4"],
  work: ["Work", "#f0ae7d"],
  capital: ["Capital", "#d3d590"],
  models: ["Intelligence", "#b9a2ee"],
  language: ["Language", "#b5a8f3"],
  access: ["Access", "#c5f486"],
  chips: ["Materials", "#ebb775"],
  trust: ["Trust", "#e8a0b6"],
  biosphere: ["Life", "#92dbaa"],
  science: ["Discovery", "#93bbf4"],
  oceans: ["Oceans", "#75bcd1"],
  mobility: ["Movement", "#d7c49d"],
  borders: ["Borders", "#ada8e2"],
};
const dById = Object.fromEntries(evidence.map((d) => [matches[d.id], d]));
const editorial = {
  power: {
    question: "Where is the electricity behind the cloud consumed?",
    connection:
      "Reframes the original geography of energy supply as the unequal geography of data-centre demand. The map includes all data centres, not AI alone.",
  },
  capital: {
    question: "Where does private AI investment accumulate?",
    connection:
      "Moves from the geography of individual billionaire fortunes to the geography of private AI investment. Investment flows are not personal wealth or ownership.",
  },
  models: {
    question: "Where are notable AI models being produced?",
    connection:
      "Moves from the spread of network addresses to the concentration of notable AI model production. This selected count measures releases, not connected devices or model quality.",
  },
  robots: {
    question: "Where are new industrial robots being installed?",
    connection:
      "Recasts the original comparison of manufacturing workforces as a comparison of new industrial robot installations. Robots are not workers, and not every industrial robot uses AI.",
  },
  access: {
    question: "Who can participate in a networked AI future?",
    connection:
      "Updates the original Internet-user framing with recent regional Internet-use estimates. Connectivity is a prerequisite for many AI services, not a measurement of AI adoption.",
  },
  network: {
    question: "How uneven is the reach of the fast mobile network?",
    connection:
      "Extends the original mobile-teledensity comparison to regional 5G coverage. Coverage does not establish affordability, use, or an AI-caused change.",
  },
  adoption: {
    question: "How unevenly is generative AI becoming an everyday habit?",
    connection:
      "Moves from household television ownership to estimated working-age generative-AI use. The link is uneven technology adoption; this dataset does not measure synthetic media or exposure to violence.",
  },
  work: {
    question:
      "Which economic groups have more work tasks exposed to generative AI?",
    connection:
      "Moves from international industrial-wage differences to differences in modelled occupational exposure. These overlapping income-group estimates do not measure wages, annotation work or job losses.",
  },
  languages: {
    question: "Whose written language dominates a commonly used web crawl?",
    connection:
      "Recasts the original globe of language and speaker numbers as a non-geographic comparison of sampled web-page languages. Crawl share does not measure speaker share, model quality or an actual training mixture.",
  },
  water: {
    question: "How much direct water does a data-centre industry consume?",
    connection:
      "Moves from the planetary distribution of freshwater reservoirs to a documented US data-centre water-consumption case study. It does not allocate a global or AI-only water footprint.",
  },
  sovereignty: {
    question: "Who can operate public AI computing infrastructure?",
    connection:
      "Revisits the original North-South division through selected public and public-private AI supercomputer counts. Source-defined regions replace a simplistic binary divide; counts are not computing capacity.",
  },
  borders: {
    question: "Where are rules drawing new boundaries around data?",
    connection:
      "Translates physical political borders into regional counts of data-localisation measures. The measures concern data broadly and their number is not a scale of legal restrictiveness.",
  },
  proteins: {
    question:
      "What changes when predicted molecular shapes become a global resource?",
    connection:
      "Moves from biological information used to trace human dispersal to AI-predicted protein structures shared in a global database. The connection is biological information, not genetic ancestry or a geographic claim.",
  },
  chokepoints: {
    question: "How concentrated is one material feeding advanced electronics?",
    connection:
      "Recasts the original gold-production geography as the concentration of refined gallium supply. Gallium serves many industries; its supply share is not a share of AI chips or compute.",
  },
};
const entries = catalogue.entries.map((e, i) => ({
  ...e,
  ...(dById[e.id] ? editorial[dById[e.id].id] : {}),
  researchProposal: {
    title: e.newTitle,
    question: e.question,
    connection: e.connection,
  },
  dataset: dById[e.id] || null,
  research: researchRuntime[e.id] || null,
  newTitle: researchRuntime[e.id]?.title || dById[e.id]?.title || e.newTitle,
  ...(researchRuntime[e.id] ? {question: researchRuntime[e.id].question} : {}),
  number: String(i + 1).padStart(3, "0"),
  color: lenses[e.lens][1],
  lensLabel: lenses[e.lens][0],
}));
const featuredOrder = [
  "adoption",
  "power",
  "languages",
  "capital",
  "water",
  "robots",
  "work",
  "models",
  "borders",
  "sovereignty",
  "chokepoints",
  "access",
  "network",
  "proteins",
];
entries.sort((a, b) => {
  const ai = a.dataset
      ? featuredOrder.indexOf(a.dataset.id)
      : 1000 + Number(a.number),
    bi = b.dataset
      ? featuredOrder.indexOf(b.dataset.id)
      : 1000 + Number(b.number);
  return ai - bi;
});
const registry = {
  schemaVersion: 2,
  reviewed: "2026-10-20",
  evidenceCount: evidence.length + Object.keys(researchRuntime).length,
  legacyEvidenceCount: evidence.length,
  researchImplementedCount: Object.keys(researchRuntime).length,
  researchAcceptedCount: 73,
  researchHeldCount: 59,
  conceptCount: entries.length - evidence.length - Object.keys(researchRuntime).length,
  scope: catalogue.meta.coverage,
  entries,
};
const slugs = new Set();
for (const e of entries) {
  if (slugs.has(e.slug)) throw Error("Duplicate route");
  slugs.add(e.slug);
  if (!e.sourceRead || !e.newTitle || !e.question)
    throw Error("Missing catalogue evidence");
}
for (const d of evidence) {
  if (!matches[d.id]) throw Error("Unmapped evidence");
  if (!entries.some((e) => e.dataset?.id === d.id))
    throw Error("Missing assigned source");
  if (
    !d.visual?.effect ||
    !Number.isFinite(d.visual?.ceiling) || d.visual.ceiling <= 0 ||
    !d.brief?.paragraphs?.length ||
    !d.sources?.length ||
    !d.limitations ||
    !d.metric ||
    !d.unit ||
    !d.dataYear
  )
    throw Error("Incomplete evidence");
  for (const p of d.points) {
    if (!Number.isFinite(p.value) || p.value < 0) throw Error("Invalid data");
    if (
      d.geographyMode === "geographic" &&
      (!Number.isFinite(p.lat) || !Number.isFinite(p.lon))
    )
      throw Error("Missing coordinates");
    if (d.geographyMode !== "geographic" && (p.lat !== null || p.lon !== null))
      throw Error("Invented geography");
  }
}
await fs.mkdir(path.join(dist, "assets/thumbs"), { recursive: true });
await fs.mkdir(path.join(dist, "assets/vendor"), { recursive: true });
for (const f of await fs.readdir(path.join(root, "vendor")))
  await fs.copyFile(
    path.join(root, "vendor", f),
    path.join(dist, "assets/vendor", f),
  );
for (const f of ["app.js", "soundscape.js", "sharing.js", "reader.js", "globe.js", "research-data.js", "research-view.js", "research-ui.js", "math.js", "scoring.js", "effects.js", "information.js", "style.css", "reset.css"])
  await fs.copyFile(path.join(root, "src", f), path.join(dist, "assets", f));
await fs.writeFile(
  path.join(dist, "assets/registry.json"),
  JSON.stringify(registry),
);
await fs.copyFile(
  path.join(root, "data/source-catalog.json"),
  path.join(dist, "assets/source-catalog.json"),
);
await fs.copyFile(
  path.join(root, "data/evidence.json"),
  path.join(dist, "assets/evidence.json"),
);
function thumbnail(e) {
  if (e.research) return researchThumbnail(researchBundles[e.id]);
  const seed = hash(e.id);
  const centers = {
    adoption: 90,
    power: 60,
    capital: -70,
    models: 90,
    robots: 100,
    access: 20,
    network: 40,
    water: -98,
    sovereignty: 30,
    borders: 35,
    chokepoints: 104,
  };
  const yaw = e.dataset
    ? (-(centers[e.dataset.id] ?? 0) * Math.PI) / 180
    : ((seed % 360) * Math.PI) / 180;
  const tilt = 0.16;
  const radius = 86;
  const cx = 150,
    cy = 124;
  const project = (lat, lon, r = 1) => {
    let [x, y, z] = xyz(lat, lon, r);
    [x, z] = [
      x * Math.cos(yaw) + z * Math.sin(yaw),
      -x * Math.sin(yaw) + z * Math.cos(yaw),
    ];
    [y, z] = [
      y * Math.cos(tilt) - z * Math.sin(tilt),
      y * Math.sin(tilt) + z * Math.cos(tilt),
    ];
    return [cx + x * radius, cy - y * radius, z];
  };
  const lines = [];
  if (!e.dataset || e.dataset.geographyMode === "geographic")
    for (const c of countries)
      for (const poly of c.polygons)
        for (const ring of poly)
          for (let i = 3; i < ring.length; i += 3) {
            const a = project(ring[i - 3][1], ring[i - 3][0]),
              b = project(ring[i][1], ring[i][0]);
            if (a[2] > 0.02 && b[2] > 0.02 && Math.abs(a[0] - b[0]) < 100)
              lines.push(
                `M${a[0].toFixed(1)},${a[1].toFixed(1)}L${b[0].toFixed(1)},${b[1].toFixed(1)}`,
              );
          }
  const accent = [];
  if (e.dataset) {
    const d=e.dataset;
    d.points.forEach((p,i)=>{
      const geographic=d.geographyMode==='geographic', global=d.geographyMode==='global';
      const lat=geographic?p.lat:(global?0:-52+i*104/Math.max(1,d.points.length-1));
      const lon=geographic?p.lon:(global?0:i*137.508);
      const a=project(lat,lon);
      if(a[2]>.04) accent.push(`<g transform="translate(${a[0]},${a[1]})">${motif(d.visual.effect,scoreFor(d,p)/100,e.color,seed)}</g>`);
    });
  } else {
    const mode = {
      energy: 0,
      water: 2,
      work: 1,
      capital: 3,
      models: 3,
      language: 1,
      access: 1,
      chips: 3,
      trust: 0,
      biosphere: 2,
      science: 0,
      oceans: 2,
      mobility: 0,
      borders: 1,
    }[e.lens];
    const n = mode === 1 ? 11 : 6;
    for (let j = 0; j < n; j++) {
      let d = "",
        pen = false;
      for (let k = 0; k <= 160; k++) {
        const t = (k / 160) * Math.PI * 2;
        const lat =
          mode === 1
            ? -75 + (k / 160) * 150
            : mode === 2
              ? -55 + j * 22 + Math.sin(t * 3 + j) * 4
              : Math.sin(t * (mode === 0 ? 2 : 1) + j) * 50;
        const lon =
          mode === 1
            ? (j * 360) / n + Math.sin(lat * 0.03) * 25
            : (t * 180) / Math.PI - 180;
        const p = project(lat, lon, 1.03);
        if (p[2] > 0.03) {
          d += `${pen ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`;
          pen = true;
        } else pen = false;
      }
      accent.push(`<path d="${d}" opacity=".7"/>`);
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="250" viewBox="0 0 300 250"><defs><radialGradient id="g" cx="35%" cy="30%"><stop stop-color="#1c3037"/><stop offset=".65" stop-color="#101d23"/><stop offset="1" stop-color="#04090b"/></radialGradient><radialGradient id="a"><stop offset=".67" stop-color="${e.color}" stop-opacity="0"/><stop offset=".8" stop-color="${e.color}" stop-opacity=".07"/><stop offset="1" stop-color="${e.color}" stop-opacity="0"/></radialGradient></defs><circle cx="150" cy="124" r="112" fill="url(#a)"/><circle cx="150" cy="124" r="86" fill="url(#g)" stroke="${e.color}" stroke-opacity=".28" stroke-width=".7"/><ellipse cx="150" cy="124" rx="86" ry="29" stroke="#668187" stroke-opacity=".18" fill="none"/><ellipse cx="150" cy="124" rx="34" ry="86" stroke="#668187" stroke-opacity=".18" fill="none"/><path d="${lines.join("")}" stroke="#a2bcc0" stroke-opacity=".42" stroke-width=".6" fill="none"/><g stroke="${e.color}" fill="none" stroke-width="1.2" stroke-linecap="round">${accent.join("")}</g></svg>`;
}
function html(e) {
  const title = e
    ? `${e.newTitle} — AFTERWORLD`
    : "AFTERWORLD — An atlas of the machine age";
  const desc = e
    ? e.dataset?.summary || e.question
    : "An interactive atlas of AI’s strange geography. Explore sourced evidence and 146 original globe interpretations inspired by World Processor.";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#080d10"><meta name="description" content="${esc(desc)}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:type" content="website"><title>${esc(title)}</title><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/assets/style.css"><link rel="modulepreload" href="/assets/math.js"></head><body><a class="skip" href="#main">Skip to content</a><div id="app"><main id="main" class="boot-error"><div class="eyebrow">AFTERWORLD</div><h1>${esc(e?.newTitle || "A stranger world is already here.")}</h1><p>${esc(desc)}</p><p>Loading the atlas…</p></main></div><noscript><p style="padding:2rem">JavaScript is required for the interactive atlas. <a href="/assets/evidence.json">Read the complete numerical data</a> or <a href="/assets/source-catalog.json">browse the inspiration index</a>.</p></noscript><script type="module" src="/assets/app.js"></script></body></html>`;
}
await fs.writeFile(path.join(dist, "assets/soundscape-index.json"), JSON.stringify(entries.map(soundscapeProfile), null, 2));
await fs.writeFile(path.join(dist, "index.html"), html());
for (const e of entries) {
  await fs.mkdir(path.join(dist, "globe", e.slug), { recursive: true });
  await fs.writeFile(path.join(dist, "globe", e.slug, "index.html"), html(e));
  await fs.writeFile(
    path.join(dist, "assets/thumbs", e.slug + ".svg"),
    thumbnail(e),
  );
}
await fs.writeFile(
  path.join(dist, "404.html"),
  html({
    newTitle: "Uncharted world",
    question: "This address is not in the atlas.",
  }),
);
await fs.writeFile(
  path.join(dist, "assets/favicon.svg"),
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#080d10"/><circle cx="32" cy="32" r="19" fill="none" stroke="#c5f486" stroke-width="2"/><ellipse cx="32" cy="32" rx="26" ry="8" fill="none" stroke="#c5f486" stroke-width="2" transform="rotate(-35 32 32)"/></svg>',
);
await fs.writeFile(
  path.join(dist, "_headers"),
  `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'self' https://chatgpt.com;\n/assets/vendor/*\n  Cache-Control: public, max-age=86400\n`,
);
await fs.writeFile(
  path.join(dist, "robots.txt"),
  "User-agent: *\nDisallow: /\n",
);
console.log(
  `Built ${entries.length} globe routes, ${evidence.length} legacy sourced stories, ${registry.researchImplementedCount} native-unit research view, ${registry.conceptCount} labelled concepts. All source and data contracts passed.`,
);
