# AFTERWORLD — independent quality challenge

Review date: 20 October 2026, Australia/Sydney.

**Verdict: the requested 9.2/10 standard is not certified.** This review supplies evidence and release gates, not a flattering score. Source/code inspection and numerical checks cannot substitute for rendering the application, using it on phones, measuring frame times, or testing with users. Those browser/device checks are unavailable in the current build environment and remain open.

This is a first research edition with 146 separate globe routes: 14 evidence-backed stories and 132 explicitly labelled research concepts. A concept route is not a completed measured reinterpretation. The current source inventory covers 146 entries in the three public World Processor galleries; it does not claim all historical versions or every physical globe. The original project's About page describes over 1,000 physical globes, and individual gallery pages can contain multiple historical versions.

## Benchmark selection

The following are professional reference experiences for the requested 8.5+/10 comparison. That threshold is a design brief, **not an externally published rating or a score awarded by this audit**. Only their public interfaces/documentation were inspected; no comparative runtime benchmark was executed.

| Reference | Evidence inspected | Standard AFTERWORLD should meet or improve |
| --- | --- | --- |
| [earth.nullschool.net](https://earth.nullschool.net/) | Public interface exposes data, date, source, scale, units and animation pause. [About](https://earth.nullschool.net/about) documents NOAA, Copernicus and other inputs, update cadence, methods and limitations. | Preserve the immediate visual invitation while making every quantity, period and limitation legible. AFTERWORLD should offer clearer short editorial entry points and simpler one-topic pages. It does not match this reference's scientific coverage or refresh pipeline. |
| [NASA Eyes on the Earth](https://eyes.nasa.gov/apps/earth/) | [NASA's description](https://science.nasa.gov/resource/interactive-eyes-on-the-earth/) connects 3D exploration to Earth-observing missions and near-real-time science data. [Eyes overview](https://science.nasa.gov/eyes/) describes browser-based real-data visualizations. | Make exploration reveal meaningful information, with predictable camera controls and a clear return path. AFTERWORLD should offer lighter topic discovery and shorter stories. It does not claim NASA's validation, mission data depth or device coverage. |
| [World Processor](https://world-processor.com/wpp) | Three public gallery indexes and selected original explanations, including [347](https://world-processor.com/347/), [366](https://world-processor.com/366/), [336](https://world-processor.com/336/) and [56-5](https://world-processor.com/56-5/). | Preserve the idea of a sphere as a memorable argument. Each source connection must be specific; an unrelated metric attached to a renamed globe does not satisfy the brief. |

## Seven independent release gates

A high average cannot conceal a weak scientific or mobile result. All seven categories need evidence before a 9.2+ claim is defensible.

| Category | Acceptance evidence required | Current review status |
| --- | --- | --- |
| Coding | Deterministic build; schema validation; stable routes and back navigation; source escaping; graceful graphics failure; cleanup on navigation; meaningful scale/geography tests. | Static review completed for the renderer, app and build logic. Three independent geography regression tests pass. The build owner reports 11 passing tests and 146 validated routes/thumbnails. Browser errors and graphics failure recovery remain untested. |
| Animation | Correct spherical positioning; no false data motion; smooth interaction; responsive camera fit; usable pause; reduced-motion support; offscreen work stopped. | Core coordinate and linear-scale math verified. Source includes pause, reduced motion, visibility handling and resource cleanup. Frame pacing and visual quality are not verified. |
| User friendliness | Topic selection, rotate, zoom, reset, data selection and return to index work by touch, pointer and keyboard; readable source explanations; useful errors. | Controls can be inspected in code. Task completion, focus behavior and screen-reader experience remain untested. |
| Scientific accuracy | Every numeric claim has a dated primary source, unit, scope and limitation. Estimates, projections, exposure, context and observation remain distinct. Geometry must honestly encode its stated quantity. | All 14 numerical layers checked against primary records. Dateline and camera corrections checked mathematically; proportional abstract encodings inspected in code. Final evidence-specific questions/connections checked for all 14 source mappings. Rendered verification remains open. |
| Mobile friendliness | No horizontal overflow at 320px; 44px main controls; portrait/landscape layout; pinch without accidental navigation; reduced-motion and low-power behavior; actual iOS Safari/Android Chrome checks. | Source now uses wrapping 44px controls, a viewport-width globe host and larger microcopy. Device behavior, readability, overflow and performance remain unverified. |
| Engagement optimization | A clear first action, meaningful discoveries around the sphere, a satisfying next topic, shareable individual routes, and no misleading curiosity bait. | Editorial hypotheses, not measured engagement. No usability session or retention evidence exists. Sparse one-point studies do not supply a full-sphere discovery experience. |
| Scalability | One rendering engine and data registry; no per-card WebGL contexts; reviewed/versioned data updates; explicit absence semantics; resource disposal; paginated/filterable index. | Shared architecture is appropriate. Dataset refresh and catalogue growth require editorial review; this is not an automated live observatory. Large-catalogue/device stress checks remain open. |

## Independent checks performed

- Read `src/globe.js`, `src/math.js`, `src/app.js`, responsive styles, `data/evidence.json` and the evidence contract.
- Executed the camera centering equations across 2,555 latitude/longitude pairs. All mapped to the intended forward-facing center within numerical tolerance.
- Executed the proportional scale check: a value of 20 produces exactly twice the bar height of 10 under the same maximum. The scale uses height rather than radius or volume.
- Decoded the actual vendored world topology: 177 geographic features. Identified seven antimeridian jumps affecting Fiji, Russia and Antarctica. The initial land-mask fill could create false ocean-spanning strips despite skipping those segments in the outlines. A correction was requested before release.
- Rechecked the ring-unwrapping correction: Fiji/Russia jumps are removed, with wrapped copies provided to the land-mask fill. Antarctica's final implicit Canvas closing edge preserves the source ring's closure. This is a geometry/code check; the rendered result remains uninspected.
- Executed 11 independent land/ocean point-in-polygon checkpoints using the actual decoded polygons. Before the fix, mid-Pacific (−140°, −16.4°) and South Atlantic (−30°, −16.4°) points falsely fell inside Fiji. After the fix, both are ocean; the other ocean checkpoints and US, Australia, China, Congo, Japan and Antarctica interior checkpoints all pass.
- Saved those checkpoints as three regression tests in `tests/geography.test.mjs` and executed them successfully with Node's test runner.
- Executed responsive camera-fit checks at 280×400, 320×450, 375×450, 390×450, 760×650, 1000×800 and 500×1000. The computed distance leaves positive frustum margin for the 1.54-unit outer mark radius. CSS clipping still needs separate review.
- Checked the global protein unit arithmetic: 241 whole million-unit marks plus a fractional mark representing 70,489 predictions. Its square-root size scaling makes the fractional mark's screen area proportional, before perspective.
- Inspected primary-source PDFs for Stanford policy Figures 8.3.1 and 8.3.3 as rendered page images, not only web alt text. The evidence registry correctly uses South Asia = 2 public AI supercomputers and excludes China from the separately displayed East Asia/Pacific group.
- Reviewed the final explicit 14-item source mapping and evidence-specific editorial overrides in `scripts/build.mjs`. Each states the actual evidence scope; the prior proposal is preserved separately as `researchProposal`.
- Verified source-owned `vendor/` inputs and their copy into the generated build, eliminating the previous dependence on a pre-existing `dist` tree.
- Inspected the final categorical selection implementation: chart latitude/longitude are separate from the evidence's null geographic coordinates, with endpoint targets and evidence-table selection. The legend identifies bottom-to-top table order. Runtime hit testing remains unverified.
- The build owner reports 11 passing tests, 146 validated routes and thumbnails, and eight representative SVG thumbnails rendered through Inkscape. These are build/static-artifact checks, not browser or WebGL validation by this reviewer.
- No browser, WebGL runtime, mobile device, Lighthouse, screen-reader, user-session, or load test was performed by this reviewer.

## Evidence audit

The values below are checked against the specific sources linked in the registry. A match means faithful transcription and appropriate stated scope; it does not independently establish the source's completeness or causal validity.

| Layer | Independent source check | Qualification |
| --- | --- | --- |
| Power | IEA 2025 regional shares and IEA 2026 global 2025 total/2030 outlook match. | All data centres; 2024 map shares must not be relabelled 2026. The 2030 quantity is a projection. |
| Capital | Stanford AI Index 2026 Economy chart values match for US, Europe and China. | Private investment is not total public/private funding, capability or benefit. Europe is a region. |
| Models | Stanford AI Index 2026 Research text matches the selected US/China counts. | Curated notable models; unshown countries are not zero. |
| Robots | IFR September 2026 release matches selected 2025 values and approximate/threshold language. | Installations do not equal AI robots, humanoids or displaced workers. Approximate values must retain their qualifiers. |
| Access | ITU 2025 Internet-use values match. | Connectivity is contextual, not evidence that AI caused the connectivity pattern. ITU regions must retain their definition. |
| Network | ITU 2025 5G regional and global values match. | Coverage is not adoption, quality or AI use. |
| Adoption | Independently read Microsoft's September 2026 Q2 report and checked all 15 selected country values against its tables. | Microsoft describes telemetry and coverage limitations; this is an estimate, not a census of all AI usage. |
| Work | ILO–NASK May 2025 release matches global and high-income aggregates. | Modelled exposure is not actual job loss. Aggregates overlap and must not be added or pinned to invented countries. |
| Languages | All selected values match Common Crawl CC-MAIN-2026-39 language statistics. | HTML crawl pages, not speakers, the entire web or an actual model's training mix. Geography must be absent from the encoding. |
| Water | Berkeley Lab report direct-water values and dates match. | Historical US case study, all data centres, direct consumption only. |
| Sovereignty | Stanford policy Figure 8.3.1 values and region exclusion verified in the PDF. | Selected public/public–private systems, not total compute capacity. |
| Borders | Stanford policy Figure 8.3.3 regional counts verified in the PDF. | Measures differ in force; counts do not equal restrictiveness. Data policy is broader than AI. |
| Proteins | EMBL-EBI v6 release total matches. | Predicted structures are not experimentally confirmed structures, drugs, species or country achievements. |
| Chokepoints | IEA 2025 refined-gallium supply estimate matches. | One material, not all chips or AI compute. Preserve the approximate estimate status. |

## Corrections requested during review

| Finding | Resolution and verification boundary |
| --- | --- |
| Antimeridian fill created false land across oceans. | Ring unwrapping and wrapped copies added. Independent geographic regression tests pass. Rendered view unverified. |
| Fixed camera could crop tall mobile views and tall data marks. | Camera now fits host aspect and outer mark radius; seven numerical viewport cases pass. Mobile host changed from 124% width to 100%. Rendered layout unverified. |
| Non-geographic datasets originally fell through to arbitrary sculpture. | Separate percentage-ring and million-per-unit global encodings added, with geography hidden. Ring legend correctly states fraction of each ring, because circles at different latitudes have different circumferences. Visual identification of rings remains a usability concern to test. |
| Concept inventory could be confused with completed scientific globes. | Index and pages explicitly distinguish sourced stories and research concepts. No completeness or scientific-data claim for concepts is accepted. |
| Mobile controls shrank below 44px; simply enlarging them would overflow. | Source now preserves 44px controls and wraps the strip. Mobile metadata/hints were enlarged. Real layout and touch behavior unverified. |
| Homepage animation had no explicit pause. | Preview pause button and state callback added in source. Runtime behavior unverified. |
| Malformed percent-encoded routes could throw during lookup. | Safe route decoding added. Actual direct-navigation behavior still belongs in browser QA. |
| Dialog opening reset the inner content rather than the actual scroll container. | Code now resets the modal's scroll position. Runtime behavior unverified. |
| Several source-to-story descriptions promised a different analysis from the attached dataset. | Final explicit evidence-specific question/connection overrides reviewed for all 14 mappings; original proposals are retained separately. Ownership/investment, wages/exposure, synthetic media/adoption and ancestry/protein prediction are now distinguished. Closed at source level. |
| Category rings lacked a direct route from a visible mark to its observation. | Endpoint targets and evidence-table selection added; chart-only coordinates remain separate from raw null geography. Bottom-to-top ordering is explained. Source reviewed; runtime selection and visual identification remain unverified. |
| Some static thumbnail orientations could hide all observations. | Dataset-specific initial thumbnail longitudes now face the selected evidence, including the single-country US water study. Source reviewed; static thumbnail rendering is recorded by the build owner. |

The build initially read its geographic vendor input from the generated `dist` tree. It now reads source-owned `vendor/` inputs and copies them into the build. This source-level prerequisite issue is closed.

## Performance and accessibility references

[Google's Web Vitals guidance](https://web.dev/articles/vitals) defines good thresholds as LCP ≤2.5s, INP ≤200ms and CLS ≤0.1 at the 75th percentile, segmented by mobile/desktop. Lab measurements are useful but do not certify field performance. None are claimed here.

[WCAG 2.2 target-size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) sets a 24×24 CSS-pixel AA minimum with exceptions. This project's 44px control target is deliberately stronger. [Pause/stop guidance](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html) supports explicit control of persistent animation. Compliance must be verified in the rendered interface.

## Final sign-off boundary

The accurate release statement is **a reviewable first edition with audited sources and documented limitations**. It is not a verified 9.2/10 product and not a completed reinterpretation of every original globe. To clear the remaining bar, execute real browser/device QA, confirm the corrected map/encoding visually, finish each concept's evidence/design work, and run short task-based usability sessions. Any future numeric score should identify the assessor, rubric, tested build, device matrix and remaining limitations.


## Living sculptures update (20 October 2026)

The sourced visual systems, scoring and overlays have been replaced. Sixteen automated checks pass, including finite bounded scene geometry for all fourteen datasets, score monotonicity/zero/missing handling, known projection results, and all 146 overlay contracts. Research concepts remain unscored. Browser automation is unavailable in this managed session, so shaders, visual overlap, touch and actual GPU performance remain unverified on devices. No numerical quality grade is asserted.
