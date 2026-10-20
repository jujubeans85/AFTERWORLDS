# Independent review: native-unit concept 430

Reviewer: `quality_challenger`. Date: 20 October 2026, Australia/Sydney.
Scope: the working-tree implementation on `f2d3e3994bfca6f2505994f0bffb7666d2fc5882`, limited to the first native-unit research slice and affected integration.

**Verdict: automated and source-level evidence supports continuing this development slice. This is not approval of a completed atlas or production release.** The seven product categories remain unrated. Only concept `430` is activated from the 73 accepted research specifications.

## Checks executed by this reviewer

The default shell has no `npm`. The reviewer used bundled Node `v24.19.0` to execute the package-script commands directly, in this order:

```sh
node scripts/build.mjs
node --test tests/*.test.mjs
node research/validate.mjs
node research/build-pack.mjs
git diff --exit-code -- research/manifest.json research/CONCEPT_RESULTS.md
```

All commands passed. The build contains 146 routes: 14 legacy sourced stories, one native-unit research view and 131 labelled concepts. All **63 tests passed**, with zero failures, skips or cancellations. Frozen research validation reported zero errors and warnings: 73 accepted datasets, 2,486 observations, 817 explicitly missing rows and two interval-only rows. Regeneration left the frozen manifest and concept results unchanged.

The reviewer inspected the adapter, release builder, renderer, UI, thumbnail, sharing, application integration, CSS and relevant tests. This reviewer did not operate a browser, listen to audio, use assistive technology, test physical devices, run a source-update service or deploy the site.

## Source and numerical conclusions

- Build activation requires the accepted design digest, exact frozen dataset digest, matching independent review records, all ten research gates and the accepted manifest entry. Runtime loading verifies the immutable bundle and its content digests. Only the supported concept and primitive are admitted.
- All 44 accepted rows remain bound by source ID. The measured length is `0.45 * value / 700` globe radii, on the fixed `0–700 g CO2eq/kWh` domain. These rows do not enter the legacy score/effect system.
- Alphabetical abstract slots do not infer coordinates. Separate CFE text retains its distinct meaning and procurement caveat. Source periods, status, qualifiers, provenance and limitations remain available in the table and evidence text.
- Automated phase checks leave measured transforms and materials unchanged while the independent neutral hoop moves. Zero and missing values are distinguished in adapter/geometry/static-chart tests; these fixtures do not assert that the frozen 44-row dataset contains missing values.
- Selection, explicit camera focus and clear are separate operations. Source inspection shows teardown of scene geometry, materials, observers, event listeners, animation scheduling and the WebGL renderer.
- Loads use abort signals, a request deadline and route tokens. A stale completion cannot replace a later route. Failures retain a clear unavailable state or the verified static chart/table rather than inventing measurements.
- Share URLs include the accepted revision and optional stable row ID. The query survives application navigation. Unknown revisions display a fallback explanation. This build retains only the included snapshot; it is not a historical-version service.
- The generated research thumbnail uses the accepted rows and native length formula rather than the old geographic concept illustration. It remains an SVG thumbnail, not a completed messaging-app raster preview.

## Findings addressed during review

| Finding | Source correction inspected | Evidence limit |
| --- | --- | --- |
| Selection or Read Mode chosen while the renderer module loaded could be lost on construction. | Pending selection and Read Mode are retained and applied after construction; camera controls stay disabled during loading. | Source review. A deliberately delayed module-load browser test remains useful. |
| Replacing the loading heading discarded the keyboard navigation destination. | Focus is restored to the replacement heading only when the loading heading still owned it. | Source review; no focus steal is requested when the user moved elsewhere. |
| About universally described sourced stories as 1–100 score renderers and used legacy geography/motion explanations. | Scores and anchors now explicitly apply to the earlier stories. The native view is described as using alphabetical abstract slots, native units and a separate frame that pauses on manipulation. | Source review. |
| Original inspiration copy could reintroduce the superseded hourly-computation question. | Concept 430 uses the accepted design's source-inspiration connection. | Source review. |
| Download wording could imply its combined export bytes matched the frozen dataset file hash. | The action says “Download data & design”; the digest label identifies the original frozen dataset file, not the combined export. | Source review. |
| Restoring the default Move mode incidentally paused the frame immediately after construction. | The application applies pending Read Mode only when it is enabled, preserving the intended default motion policy. | Source review; the build and all 63 tests passed again after this final change. |

## Remaining actionable items and verification

No unresolved source-level defect from the findings above remains in the final inspected state. This statement is limited to this review scope and is not a claim that browser behavior is defect-free. The shared footer now directs readers to each world's source dates instead of implying a universal source-review date.

The prior implementation-race and focus fixes need targeted browser coverage with delayed data/module responses and with the user moving focus during loading. Context-loss fallback, rapid route cycling, resource stability, real sharing sheets/clipboard denial, other browser engines and native accessibility behavior remain open. Passing geometry construction and simulated API tests cannot establish those outcomes.

The 72 other accepted research designs, source-update promotion/rollback service, production narration, richer audio, raster sharing previews and physical-device matrix remain outside this implemented slice. No live-data, hardware-haptic, natural-voice, performance, participant-success or 9.2/10 claim is supported by this review.

## Browser evidence reported by the coordinating agent

The coordinating agent reports Firefox 158 on macOS 26.5.1 checks of concept 430 loading; Next Region selecting Johannesburg with `641 g CO2eq/kWh` and separate `15%` CFE while pausing motion without moving focus; default panel reading; immediate stop/opt-out; manual Listen; opt-out persistence after reload; and close-focus return. It also reports a responsive `320 × 720` screenshot covering the globe/static chart, and a separate temporary-directory rollback build at `f2d3e39` with 42 passing tests.

These are attributed reports, not tests performed by this reviewer. A resized desktop viewport is not a physical phone test. The coordinating agent should retain its browser evidence separately and tie it to the final build.

## Reviewed file digests

These SHA-256 values identify the inspected state. Subsequent changes require targeted reinspection.

| File | SHA-256 |
| --- | --- |
| `src/research-data.js` | `2277781b9b365c7d3262edf8d257db60dfce818d73d2a383150a6511bde611bc` |
| `src/research-view.js` | `d8917990b69f59569ad01e1f89bdac3504210c80c3cc1a4ca202e28a28bf9e46` |
| `src/research-ui.js` | `50f660e8fa2ed44a281703698482e035633547733f9cc96044d8548e68a0c6a4` |
| `src/app.js` | `45d14a01db2fa04a14cc6ea5c3f9836e89790f6ee823ab12858e6e04da1f1545` |
| `src/sharing.js` | `2f66d6f6b807ed850b9e2402a4a5aa5bc080ff6908cfd5cb1114a537b8878103` |
| `src/style.css` | `df3c695fc8b9ee1e7b9e6e2d42700fcaa04f2454da6c7d49822faf31e668e433` |
| `scripts/build.mjs` | `42e365e06e02f15c303ae39d339adc64a4d1748e8b694659994ab15e5e7c205b` |
| `scripts/research-runtime.mjs` | `0cdf971c06ae44929c26957eafef62b5cf69bc0ae00ff58eb5b08561c86f0441` |
| `scripts/research-thumbnail.mjs` | `f2d5cedcc0ffd1a9df382bd13ceb3301633b76522d4f92022b79aa65399a68b4` |
| `tests/research-runtime.test.mjs` | `f3314488d90353615a918ae87970ed0c4c8e5ea3a61ddad30f10745138526878` |
| `tests/research-view.test.mjs` | `2a3c7c0f5db275ff7a8d20da5d7500e65b73b226a75c07b2ed686373ac89ac94` |
| `tests/research-ui.test.mjs` | `04b6521df7bd65fa43405c086f656d26560d65d57479c33e7e66ffbb31864d31` |
