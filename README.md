# AFTERWORLDS

A dark, interactive globe atlas about AI's strange geography, inspired by Ingo Günther's **World Processor**.

## Research implementation pack

The new [research pack](research/README.md) audits all 132 unfinished concepts, with populated JSON datasets, source and reuse records, distinct animation specifications, per-concept independent review, and a validated implementation queue. [Results for all 132](research/CONCEPT_RESULTS.md) distinguish accepted narrow claims from research holds. Research acceptance does not automatically replace the current app’s concept pages.

```sh
npm run research:validate
npm run research:build
```

## This edition

- 146 separately routed globe pages, one for every entry linked from the three current public galleries.
- 14 sourced numerical stories; 132 prominently labelled research concepts.
- 14 distinct animated visual systems driven by documented 1–100 magnitude scores.
- More information overlays on all 146 worlds, with 1–4 summary paragraphs and dated past/present/future cards.
- Eight transparent linear extrapolations; unavailable trends stay explicitly unavailable.
- Flooded miniature skylines, binary clouds, electric arcs, mechanical gardens, coin towers, neural branches, signal halos, gates, task tiles, letterform ribbons, compute citadels, enclosures, molecular folds, and supply funnels.
- Pointer, touch/pinch, keyboard, rotation pause, reset, other-side control, searchable index, evidence tables, JSON export and reduced-motion support.
- Consistent, locally served Space Grotesk / Space Mono typography with globe-specific text accents and readable contrast.
- JUICE Reader on every information block: per-block listening, whole-overlay reading, passage controls, device voices, 0.8–2× speed, text-size preferences and cancellation on navigation/close.
- The existing application uses a frozen source snapshot; this is not a live feed. The separate research pack records its actual UTC review dates.

The current gallery inventory is complete. All historical versions and the separate historical archive are **not** exhaustively re-created. The quality target of 9.2/10 is **not certified**: browser/device QA remains outstanding. Read [the independent review](docs/QUALITY_REVIEW.md).

## Run and build

Node 20+. No package installation or runtime service credentials are required. Third-party dependencies are vendored at pinned versions.

```sh
npm run build
npm test
```

Serve `dist/` as static files. Each `/globe/<slug>/` has a real `index.html`, so direct links and reloads require no SPA fallback. For ordinary local development outside the managed Sites environment, a static server such as `python3 -m http.server 8080 --directory dist` is sufficient. Managed Sites preview must use its supported preview tooling.

## Architecture

- `data/concept-mapping.tsv`: original editorial concept source.
- `data/source-inventory.json`: source-gallery inventory.
- `data/source-catalog.json`: enriched, attributed inspiration catalogue.
- `data/evidence.json`: single source of truth for dated numerical layers.
- `scripts/build.mjs`: validates content, matches evidence to source entries, emits all pages and static SVG thumbnails.
- `src/globe.js`: one shared Three.js renderer; lifecycle cleanup, event ownership and viewport fitting.
- `src/app.js`: navigation, search, accessibility controls, evidence and export UI.
- `src/math.js`: independently testable projection and scale functions.
- `src/scoring.js`: one scoring and temporal calculation contract.
- `src/effects.js`: bounded, reusable geometry for all 14 story-specific animation systems.
- `src/information.js`: accessible summary, timeline, sources and score methodology content.
- `src/reader.js`: one shared player and a DOM adapter that reads the displayed information; no separate copies of article text.
- `vendor/juice-speech.js`: unchanged JUICE Reader speech engine; provenance and validation in `docs/READER_UPDATE.md`.
- `dist/`: generated deployment output. Do not edit generated copies.

Index thumbnails are static SVGs, not 146 WebGL contexts. Only the active globe owns a renderer. Animation stops when hidden/offscreen; navigation releases GPU resources. Application dependencies, fonts and data are served locally. Optional online device voices may send the selected text to their platform provider. No analytics, accounts, payment flows or application APIs are implemented.

## Data refresh contract

Review the primary source, definition, units, date, scope, missingness and licence before changing `data/evidence.json`. Never silently replace an estimate with a reading, a forecast with an observation, or an infrastructure measure with an AI-only footprint. Retain numerical qualifiers in `displayValue`. Country and region markers are representative anchors, not precise sites. Categorical/global values must have null coordinates.

Promote a research concept only after a specific source and geographic/abstract encoding are independently reviewed. Add its explicit source-ID mapping in `scripts/build.mjs`. A concept with new numbers still needs an original, source-relevant editorial interpretation.

## Deployment

The Sites source repository and deployment are configured by `.openai/hosting.json`; use the supported Sites workflow for that project. `dist/_headers` provides portable static-host security guidance; enforce equivalent headers in any host that does not recognize this file.

The application source and reviewed research pack are maintained at [jujubeans85/AFTERWORLDS](https://github.com/jujubeans85/AFTERWORLDS). The existing Sites deployment remains separate from research acceptance; promoting a dataset requires implementing its reviewed design and completing runtime QA. Root-relative asset paths assume a root/custom domain. Project-path hosting needs the base-path migration described in docs/GITHUB_HANDOFF.md.

## Credits

Artistic inspiration: [Ingo Günther, World Processor](https://world-processor.com/wpp). Independent, unaffiliated project; no original photographs or globe artwork reproduced. Natural Earth geography via world-atlas 2.0.2 (ISC/public-domain geographic data). Three.js 0.180.0 (MIT). Vendored libraries and licences are retained in `vendor/` and copied to `dist/assets/vendor/` at build time. Numerical sources remain linked per story. See `data/EVIDENCE_NOTES.md`.

Type: Space Grotesk and Space Mono, served locally with SIL Open Font License texts. Speech: the user's shared JUICE Reader engine from `jujubeans85/JUICE`.

## Living sculptures edition

Scores use the story’s fixed editorial ceiling, not the largest currently visible point: `round(100 × value / ceiling)`, clamped to 1–100 for positive inputs. Actual zero is 0; missingness stays null. Size, density, colour and speed can repeat the same magnitude score; speed is not a measured trend. Percentage metrics use a 100% ceiling. Raw source values and bounds are always retained. These are display scales, not universal risk rankings.

Futures are computed from dated, comparable source pairs using linear absolute change. They appear only in overlays and do not overwrite the observed geographical layer. Scope is stated next to each timeline. Publisher forecasts are separated. No trend is fabricated for concepts, incompatible model-count vintages, job exposure, changing language samples, bulk protein releases or unavailable border/gallium histories.

Only the active world animates. Geometry is bounded and batches repeated blocks with instancing. Dragging stops automatic rotation while the sculpture continues; Pause and reduced motion stop both. Static index icons echo sourced effects without creating extra GPU contexts. Node checks cover routes, data contracts, scores, projections, geometry, concept constructors, overlay content, reader behavior and research acceptance safeguards. Supported browser QA was unavailable for this update: no desktop/mobile visual or shader-runtime certification is claimed.
