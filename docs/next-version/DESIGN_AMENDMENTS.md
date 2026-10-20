# Scientific design corrections

Frozen research is never edited by this mechanism. Two explicit corrections are allowlisted. For concept 156-8: the source report's rounded 53% is shown with an explicit rounded-source label, without a strict lower-bound arrow. The separate 90% observation keeps its own conditional denominator. No combined percentage is derived.

The proposal remains `proposed-not-accepted` and is retained byte for byte. The independent factual note supports the correction and is also retained verbatim. The immutable evidence record has `status: scientific-review-supported` and `authorizesRuntimeActivation: false`. It is evidence of scientific review, not human approval, runtime activation, or production approval.

Concept 74 corrects the selection literal `AIME2026` to the source label `AIME 2026` and retains the intended four rows for E2B Thinking and 27B IT on two tasks. Its independent factual review corroborates all four scores and the no-tools AIME configuration. The original two-row selection remains frozen and auditable.

Runtime activation requires both a separate explicit active-list change and a real runtime review at `data-updates/design-activation/<conceptId>.json` after the corrected scene, source bindings, table, browser and regression checks pass. Both approval files are currently absent and both concepts are inactive. Missing approval prevents publishing even if its ID is added to the active list.

`src/research-design-amendments.js` allowlists exact original design, dataset, proposal, review and effective design hashes. `scripts/research-design-amendments.mjs` reconstructs only the two exact allowlisted corrections and their added validation requirements, and verifies the effective design digest. Missing or changed reviews and proposals fail closed. No generalized JSON patch or arbitrary file reference is accepted.

When the concept is activated, the release includes:

- The unchanged dataset and its frozen byte digest.
- The effective design and its canonical digest.
- `designAmendment`: the complete original design, exact proposal text, exact review text, all original/effective/evidence hashes, and the scoped review status.
- `designAmendmentSha256`: the canonical evidence-record digest, included in the release revision calculation.
- `runtimeApprovalText` and `runtimeApprovalSha256`: the exact separate runtime review and its byte digest, also included in the revision.

The summary exposes `designAmendment` with `sha256`, `url`, `originalDesignSha256`, `effectiveDesignSha256`, and hash/URL references for `originalDesign`, `proposal` and `review`. Those immutable references live under `/assets/research/amendments/`. Browser loading verifies the evidence hashes, reconstructs the exact effective design, rejects the original conflicting geometry or task selection, and rejects evidence or runtime approval attached to the wrong concept.

The runtime approval must name a distinct independent agent reviewer and preparer, an actual ISO review time after the factual review, all exact original/effective/evidence hashes, and passing evidence for `sourceMeaning`, `nativeUnits`, `scene`, `tableParity`, `browser` and `regressions`. Test fixtures use fictitious records only in disposable directories; they do not create repository approval.

The resulting acceptance kind is `design-amended-research`, with its actual runtime review time. Original research acceptance remains separately dated. The original conflicting design was never runtime-active; `originalResearchRevision` identifies it as frozen-specification-only, and its immutable original evidence remains downloadable. It is not inserted as a runnable historical version.

After loading, the full evidence record is available as `designAmendmentEvidence`, with `designAmendmentSha256`, `runtimeApprovalText` and `runtimeApprovalSha256`, so a complete download can reproduce the revision. Provenance displays should name the correction and the independent agent review scope without implying human identity authentication or production approval.
