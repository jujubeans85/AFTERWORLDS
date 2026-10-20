# Native-unit continuation — 20 October 2026

This is the first implementation slice on `next-version-foundation`, continuing foundation commit `f2d3e39`. It is not the completed next version or a production release. Read the original handoff for the full remaining scope and `NATIVE_SLICE_REVIEW.md` for the independent source review.

## Implemented scope

- Concept **430**, stable route `/globe/the-carbon-clock/`, now displays **The Grid Behind the Cloud**.
- **44** exact accepted observations from `physical-cloud-grid-carbon`; all appear in the accessible table and data/design export. Dataset SHA-256: `1878fd571972c43918ef24a11e2ccee053f772dc68ece9f2afacb728d14922e1`.
- Fixed **0–700 g CO2eq/kWh** scale, column length **0.45 × value / 700**, separate CFE matching text, alphabetical abstract slots, no fabricated coordinates or impact score.
- Accepted research revision: `e25dfcd811c52646bda3577f27752e3d67639193337c37f55543674f4ef60092`. Immutable bundle SHA-256: `948eb7cb937dfeddde1bfaaeda451f87610439d1d63d66fa124d9dbc142ce0d2`.
- The build verifies frozen dataset bytes, canonical design digest and independent acceptance gates. Browser loading verifies the immutable bundle before rendering, is abortable and bounded, and rejects stale or unsupported contracts. This is an initial frozen release consumer, not an update/promotion service.
- One instanced measured layer and a separate neutral 62-second ambient hoop. Selection preserves camera position; Focus is explicit. Interaction, hidden tabs and offscreen state pause motion; resumption is explicit. Reduced motion keeps static evidence and direct controls.
- Region picker, next/previous, clear, keyboard rotation, independent screen hit targets, Move/Read mode, and static SVG/table fallback. Context failure disposes graphics and keeps evidence.
- Revision and optional stable source-row sharing; unavailable versions explain their fallback. No sound preferences are shared. Generated thumbnail now depicts native columns rather than the prior concept ornament.
- The existing reader behavior remains: user-opened text panels read by default, with persistent disable and manual Listen. Existing 14 sourced worlds and their canonical sound identities are preserved.

Collection counts: **146 routes = 14 earlier sourced stories + 1 native-unit research view + 131 concept routes**. Of the original 73 accepted research designs, **72 remain to implement**. The 59 held concepts retain their holds. Research acceptance is not runtime acceptance.

## Executed checks

The desktop shell has no `npm` on PATH. Package-script equivalents ran under bundled **Node v24.19.0**:

```sh
node scripts/build.mjs
node --test tests/*.test.mjs
node research/validate.mjs
node research/build-pack.mjs
git diff --exit-code -- research/manifest.json research/CONCEPT_RESULTS.md
```

Baseline: 42 tests passed. Current slice: **63 tests passed**, including eight research data/release checks, seven real Three.js scene/invariant checks and six UI/share/thumbnail checks. Frozen research validation reports zero errors/warnings. Research regeneration leaves frozen files unchanged. The scene tests do not establish GPU timings, appearance, browser touch behavior or hardware output.

## Browser observations by the primary agent

Local HTTP preview, **Firefox 158.0 (build 15826.10.7)** on **macOS 26.5.1 (25F80)**. The in-app browser failed to attach; Firefox native UI was used. These are manual browser observations and accessibility-tree checks, not an automated browser suite or VoiceOver test.

| Check | Observed result | Limit |
| --- | --- | --- |
| Baseline index and direct research route | Loaded, WebGL canvas and 44-row table present | No cross-browser certification |
| Next region | Johannesburg: 641 g CO2eq/kWh, CFE 15%; frame paused; button retained focus | Selected data and UI state, not usability study |
| User-opened evidence panel | Reader entered Reading; Close dialog retained focus | Speech state observed, voice naturalness not rated |
| Auto-read disable | Reading stopped immediately; both visible switches updated | Local browser storage only |
| Close and reopen after opt-out | Panel remained silent; focus returned to opener on close | No screen-reader-interaction claim |
| Manual Listen after opt-out | Reading resumed through manual control | No physical speaker assessment |
| Reload after opt-out | Disabled state persisted; reopening remained silent | Original enabled setting restored after the check |
| Responsive viewport | Inspected 320 × 720 CSS pixels, DPR 2; globe, wrapped content and scrollable static chart visible | Desktop responsive emulation, **not a phone test** |
| Table view | Canvas hidden; static native-unit chart and same table retained | Hardware WebGL-loss injection not executed |
| Direct version/selection URL | Exact revision plus `row=us-central2` selected Iowa, 417 g CO2eq/kWh, CFE 84%; Focus enabled | Recipient messaging-app preview not tested |
| Unavailable shared revision | Explicit warning that displayed evidence may differ; no row silently selected | Only this build's frozen revision is available |
| Index to research route | Sourced index showed 15 stories; clicking the research card retained focus on the final world heading after data loaded | Normal local response timing; delayed-response injection remains open |

Screenshots were inspected during the session. No retained browser trace, 20-navigation GPU memory measurement, named-device frame timing or user task study has been produced. Independent review caught and corrected pending-renderer selection/read-mode state and loading-heading focus loss; delayed-import timing remains source-reviewed rather than a browser-injected timing test.

## Rollback and deployment

The existing Sites project was inspected read-only: `appgprj_6ad67b0da294819193fd1987db291d6f`, active, version 3, custom audience, existing live URL `https://afterworld-ai-atlas.xntfsstt5z.chatgpt.site`. No source synchronization, version publication or deployment occurred. The native slice therefore has no production deployment URL.

Rollback **buildability** was tested by extracting `git archive f2d3e39` into a separate temporary directory, rebuilding and rerunning its **42 passing tests**. This restores the original 146-route / 14-story / 132-concept foundation without modifying the current checkout. It is not a tested production deployment rollback. Before any later deployment, save the currently deployed version and test that platform rollback separately.

## Remaining release gates

Coding, animation, user friendliness, scientific accuracy, mobile friendliness, engagement and scalability are all **unrated** under the seven-category product rubric. Passing code/data tests does not establish a 9.2 score.

Still required: 72 accepted native-unit designs; audited geography for electricity concept 408; immutable candidate review and promotion/rollback service; source cadence activation; richer auditioned audio, volume/mono controls and versioned recorded narration; canonical public-origin and raster sharing previews; selective alternative forms; desktop Safari/Chrome and physical iPhone/iPad/Android including a lower-resource device; keyboard/screen-reader, interruption/network/reduced-motion, frame/memory/lifecycle and observed comprehension checks. Recheck source freshness before public release. Keep the 59 evidence holds and frozen research unchanged until separately reviewed.

Do not scale the renderer by routing arbitrary rows through its 430-only primitive. Add each supported native primitive and its explicit contract before activating its source ID.
