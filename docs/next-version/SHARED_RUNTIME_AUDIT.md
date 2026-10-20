# Shared runtime audit for the accepted research set

Reviewer: `quality_challenger`. Date: 20 October 2026. This is an implementation-risk audit, not activation approval or product scoring. It supplements the evidence editor's derived `RUNTIME_BINDING_AUDIT.json` and preserves the frozen research.

This audit records the fifteen-view starting point. Subsequent work addressed typed categorical/none scales, expanded semantic metadata, explicit reverse/inset/time-denominator state and several family-specific fallbacks. Current executed checkpoints and unresolved evidence limits are in [CONTINUATION_QUALITY_REVIEW.md](CONTINUATION_QUALITY_REVIEW.md). The table below remains a checklist for the remaining families; it does not assert every original issue is still present.

## What the fifteen-view shared UI assumed

The first fifteen adapters are predominantly single-dataset numeric instruments. The current page, chart, selection, share and download functions cannot safely become a universal renderer merely by expanding `ACTIVE_RESEARCH_CONCEPTS`.

| Current assumption | Accepted counterexample | Required behavior before activation |
| --- | --- | --- |
| `design.scale.domain` is a numeric array and can be joined or divided by its maximum | Categorical string domains, `none`, panel-specific `domains`, mixed and switchable scales | A typed scale presentation must provide the exact per-panel legend and controls. Missing numeric domains must not produce `NaN`, an exception or a made-up 0–100 ruler. |
| One accepted bundle has one dataset, source map, period, unit and row list | 394, 217, 56-5 | Preserve each dataset binding and panel independently. Share/selection identity must retain dataset and row identity where needed; exports must include every bound dataset and its digest. Do not flatten unrelated rows into one numerical array. |
| Every supplied row is drawn | 218 includes 12 of 18, 74 includes 2 of 18, 217 includes one of five inference rows | Use the explicit accepted `includedRowIds`, describe the visible subset honestly and retain provenance for omitted context. Do not weaken the binding validator to accept arbitrary filtering. |
| `row.value` is the encoded numerical field | 138-8 has account count `value` but uses `publishedPercent`; 78-4 switches population count and `internetPercent`; 365 switches counts and shares | Introduce named modes/fields with explicit units and denominators. For 138-8, display 560 accounts and denominator 832 while using the published 67.3% for the arc, not a recomputed 67.30769%. Activities overlap. |
| Null is a missing observation | 388 interval-only estimates; categorical records | Determine the record kind from the accepted contract. A range is not a missing point, and a category is not a zero-length bar. The 388 exception is already implemented; it is not a general permission to invent endpoints. |
| Every quantity begins at zero on a linear ruler | 117 log10 radial position | Preserve logarithmic **position**, source-native estimated FLOP and the accepted ticks. Do not log-transform bar length or substitute normalized scores. |
| One numerical shape covers all uncertainty | 330 robust SE; 398 SD; 211-4 CI; 8-6 clinical counts, denominators and CI; 115-2 parenthetical uncertainty | Render and label the specific uncertainty type. Preserve sample/analysis denominators. Never turn SE into CI, SD into uncertainty of a mean, or a qualifier into an exact endpoint. |
| An unknown qualifier can be omitted | Source bounds, rounded/approximate counts and text-defined cases | Retain the exact qualifier in both selection and fallback; reject unsupported quantitative interpretations. `nativeValue` currently handles a defined small set and must expand deliberately. |
| One shared bar chart is an equivalent fallback | Categorical dossiers, incompatible-unit panels, clinical summaries, recorder effort, logarithmic positions | Give each family a faithful static/table equivalent. A readable table does not by itself complete its accepted geometry, but it must never misrepresent that geometry. |
| Compact scene values can be all rows | 378 has 1,587 observations; other larger cohorts exceed twelve | The current readable DOM summary intentionally omits datasets larger than twelve rows. Larger families need an explicit selected slice or compact current-selection summary with honest filters, not silent truncation. |
| Camera and selection are the entire interactive state | 232 inset, future quantity/panel/time/effort modes | Preserve and validate the declared mode through delayed imports, Apply, reset and sharing when the contract requires it. Disable unavailable scene controls. A restored camera must not face a different scale after a mode is lost. |

## Accessible source fields cannot disappear

The shared table originally exposed only core fields and a few special cases. The current fifteen-view metadata additions cover account type, capacity kind/buyer/included uprate, and the 409 response method/metric definition/territory count. The remaining accepted `accessibleEquivalent.columns` require deliberate formatting.

Examples that affect interpretation:

- **398:** `standardDeviation`, growth stage and field.
- **211-4 / 8-6 / 8-17:** cohort, confidence bounds/level, crash or event counts, analyzed and randomized denominators, follow-up period.
- **378:** species, week, uptime fraction and automated detections. Missing effort differs from zero detections with effort; source-randomized coordinates need their warning.
- **365 / 78-4 / 138-8:** denominator and alternate-measure fields, including population source ID and published percentage.
- **117:** estimate confidence/notes, organization countries and primary reference.
- **218 / 74 / 402 / 392 / 390:** benchmark, configuration, model, metric and test sample.
- **364 / 320 / 422-2 / 407:** comparison denominator, lead/target month, statistic/time basis, sex/exposure category and sample age/scope.
- **Categorical relationships and cases:** host/consortium countries, publication case status, amount qualifier, measurement kind, mandate/mechanism, exclusions, endpoints of organizational relationships and named host star.

Prefer a per-contract column/selection descriptor with human-readable labels and type-aware value formatting. Required fields, optional source fields and display-only context are distinct. Rendering an object as `[object Object]`, dumping raw JSON into a customer-facing panel, or treating absent optional fields as source failure does not supply parity.

## Source and design conflict requiring a hold

Concept **156-8** has a substantive frozen-contract conflict identified by the evidence editor and confirmed as an implementation blocker: its geometry asks for an open “over 53%” lower-bound end, while the normalized row says the primary report's rounded 53% must be used rather than the press release's strict “over 53” language. The renderer must not choose one silently. Keep this concept inactive until a separate reviewed reconciliation is authorized and recorded. Do not edit the frozen source or invent an implementation acceptance score.

## Remaining release blockers

Each additional family still needs its accepted encoding, complete provenance/table/export parity, route and cancellation behavior, meaningful backside or detail interaction, appropriate static fallback and representative sharing image. Source activation alone is not completion.

Across the application, physical device and assistive-technology coverage, sound/narration listening, native sharing/crawler behavior, performance traces, participant comprehension, matched comparison tasks and deployment/rollback evidence remain separate gates. Candidate-only WDI tooling does not operate or authorize unattended acceptance. The fifteen native views do not make the remaining 58 accepted designs, 59 held concepts or 14 earlier scored stories equivalent or complete.

After each family, freeze a reproducible build checkpoint, run the affected contract and scene tests plus the built-import dependency check, perform browser review, then record the result. Further source edits invalidate the affected checkpoint evidence; they do not retroactively change what was tested.
