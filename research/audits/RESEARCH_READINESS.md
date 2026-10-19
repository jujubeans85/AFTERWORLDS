# AFTERWORLD research readiness standard

This is an internal research and design acceptance standard for the 132 unfinished concepts. It does not certify the application's animation, mobile usability, accessibility, GPU performance, or overall product quality. The previous independent review remains applicable to those areas.

An **implementation-ready** finding requires all hard gates below and an independently supported research-readiness score of at least **92/100**. A total cannot compensate for a failed gate. The threshold is a project acceptance rule, not an external rating or a prediction of user experience. A researcher may propose a score; only the independent review may record an accepted result.

## Review outcomes

| Outcome | Meaning |
| --- | --- |
| `direct-ready` | Direct AI evidence, populated data, source checks, reuse basis, semantics and a distinct design are complete; every hard gate passes and the independent score is at least 92/100. |
| `context-ready` | The same acceptance requirements pass for an explicitly contextual relationship to AI; no observed AI effect or causality is implied. |
| `reframe-ready` | A documented narrower or different question passes all gates and the independent 92/100 threshold. Record original and proposed questions and the reason; readiness covers the revised claim only. |
| `hold` | A plausible concept has a specific missing source, row, licence, method or design requirement, or its independent score is below 92. List the exact blocker and next evidence needed. |
| `reject` | The central claim is unsupported or misleading and no defensible implementation is established. Absence of evidence is not evidence of zero. |

These outcomes apply per concept and per dataset version. A reusable data file can support several genuinely different analyses, but it does not establish several independent datasets. The pack must report unique dataset counts separately from concept counts.

## Non-negotiable gates

| Gate | Required evidence | Automatic failure examples |
| --- | --- | --- |
| G1 — Populated, usable observations | Real local rows, field definitions, unit, population/denominator, period, missing-value convention, and enough coverage to support the precise claim. File loads and observed row count agrees with the manifest. | A promising URL, an unexecuted API query, synthetic placeholder values, empty CSV, or samples described as complete global coverage. |
| G2 — Primary-source traceability | Publisher, exact source URL or DOI, release/version, retrieval date, and table/page/API-field locator. Every row links to its source; transformations are reproducible. Verify all manually transcribed rows. For large machine imports, reconcile source row counts/identifiers and document stratified value checks, extreme/zero/missing checks and extraction logic. | Search snippets as the only evidence; uncited inference; a secondary summary when the primary record is accessible; inaccessible source without a verifiable preserved extract. |
| G3 — Reuse and attribution | Record the exact licence or terms URL, holder, required credit, permitted packaged assets/data, and reviewer-checked reuse basis. Preserve notices. If relying on factual extraction rather than a data licence, explicitly identify that basis and the limited factual material reused; do not describe the source as openly licensed or copy protected presentation. Unresolved reuse restrictions block acceptance. | “Public website” treated as a licence; unknown rights; source photographs/charts packaged without a reuse basis; dataset licence confused with site software licence. |
| G4 — Honest time coverage | Observation start/end or snapshot, publication date, retrieval date, update cadence if known, and a reason the release is suitable. Mixed-year values are flagged; change claims use comparable definitions and periods. | Calling a 2024 observation “2026 data” because publication occurred in 2026; comparing different denominators as a trend; implying live data from a static file. |
| G5 — Honest geography | Stable country/region identifiers; source boundary/region definitions; geographic unit and assignment rule; no overlapping aggregates summed; coordinates identified as actual locations or display anchors. Non-geographic observations retain null geography. | Language mapped to a guessed country; regional aggregate displayed as a site; country totals turned into local density; invented spatial allocation; missing = zero. |
| G6 — Uncertainty and coverage | Preserve estimate/observed/approximate/threshold status, sample size and interval when supplied, population coverage, selection rules, known missingness, and methodological breaks. Explain what the source cannot establish. | False precision; converting “more than” into an exact total; representing a selected company sample as the entire world; hiding projection assumptions. |
| G7 — Defensible AI relationship | Classify each layer as `direct`, `context`, or `illustrative`; state the actual link and its primary-source support. Separate measurement from causal interpretation. | All data-centre power labelled AI-only; all automation counted as AI; infrastructure context described as an observed AI effect; general social harm attributed causally to AI without evidence. |
| G8 — Score semantics | Set scoring to `none`, or provide formula, inputs, weights, domain, direction, reference baseline, normalization, temporal comparability, clipping, uncertainty and missing-data behavior. A constructed editorial index is labelled as such and cannot masquerade as source measurement. | A 0–100 number with no meaning; rank displayed as amount; min–max rescaling implying cross-time improvement; zero-filled missing values; a “danger” score invented from unrelated quantities. |
| G9 — Forecast semantics | Set forecast to `none`, or supply primary forecast/model documentation, horizon, scenario, units, assumptions, uncertainty and applicability. An original forecast also needs reproducible code and independent validation against a suitable baseline, including temporal leakage checks. | Invented 2030 values; linear extrapolation presented as an authoritative forecast; a publisher's scenario relabelled as a prediction; forecasts without a stated scenario or methodology. |
| G10 — Faithful, distinct design | Specific World Processor source ID and explanation; honest new claim; complete encoding/interaction design linked to actual fields. Distinguish measured geometry from decorative motion. Provide a legible non-3D equivalent and explicit mobile/reduced-motion behavior. | Renamed duplicate dataset presented as a new analysis; decoration implying quantities; arbitrary globe geography; no interpretable backside content; different colours as the sole claim of a distinct design. |

`direct` means the observation explicitly measures an AI-related system, activity, capability, adoption or AI-attributed outcome within the source's stated method. It does not automatically establish causation. `context` measures a condition relevant to AI, without claiming the observed condition is caused by AI. `illustrative` is a conceptual analogy or artistic proposition: it cannot be counted as an accepted measured AI-impact layer or assigned a measurement-derived harm score. A contextual dataset may pass with an appropriately limited title and explanation.

There is no arbitrary minimum row count: a well-supported single global number can pass as a global abstract chart. It cannot be sold as worldwide geographic discovery. If the design needs data on the far side of the sphere, the supplied observations must genuinely support that interaction; camera movement cannot create new evidence.

## Research-readiness scoring

Each category receives documented points, with evidence paths and a short reason. Unchecked claims receive no credit. Use the listed maximum only when all completion evidence is present; roughly 80% means adequate but with a named non-blocking limitation; lower marks require a concrete deficiency. No rounding up across the 92-point threshold. Hard gates remain independent of this scoring exercise.

| Category | Maximum | Completion evidence |
| --- | ---: | --- |
| Source fidelity and verification | 20 | Primary records resolve; exact locations and verification log support values and interpretation; transformations can be reconstructed. |
| Populated coverage and completeness | 15 | Ready local rows, sufficient honest coverage for the claim, documented denominator/missingness, complete field dictionary. |
| Geographic validity | 10 | Correct identifiers, source-defined regions, validated joins/anchors, preserved absence, appropriate non-geographic mode where needed. |
| Temporal validity | 10 | Observation/publication/retrieval dates separated; latest suitable release checked; comparative periods and update policy justified. |
| Uncertainty and statistical meaning | 10 | Estimates, selection, thresholds and limitations carried into the proposed interface; no invalid comparisons or causal upgrades. |
| AI relationship and claim discipline | 10 | Direct/context/illustrative status justified, with a precise title and evidence-matched claim. |
| Quantitative design and score/forecast semantics | 10 | Faithful scales, legends and selection; any scores/forecasts independently defensible, or explicitly absent; accessible alternative specified. |
| Reuse and attribution | 5 | Checked reuse basis, credits and applicable notices accompany the exact packaged content. |
| Implementation contract | 5 | Stable schema, deterministic loading/transforms, file digest, clear dependencies, documented updates and validation checks. |
| Source inspiration and distinct creative treatment | 5 | Explicit original-to-new connection; design identity differs meaningfully in evidence, encoding or interaction, not palette alone. |
| **Total** | **100** | **At least 92, plus every hard gate passed.** |

## Minimum research pack contract

Each concept's manifest must expose the fields below, either directly or by stable references to shared records. The format may vary; the information may not be omitted.

| Object | Required fields |
| --- | --- |
| Concept | `conceptId`, original source ID/URL, current proposal, proposed title, exact claim, source connection, dataset IDs, AI relationship class and justification. |
| Dataset | Stable `datasetId`, local file path, SHA-256 digest, actual row count, schema/version, unit, denominator/population, geography mode, observation period, release date, retrieval date, source IDs, coverage, omissions and uncertainty. |
| Observation | Stable row/entity ID, name, value or explicit null, unit, period, provenance source ID/locator, status/qualifier, geographic ID or null, any actual coordinates and coordinate meaning, notes. |
| Source | Publisher, title, primary URL/DOI, exact table/page/API locator, publication/version, retrieval date, verification record and reuse/attribution record. |
| Transformation | Input files/source query, executable code or explicit arithmetic, aggregation/join rules, denominator, exclusions, rounding and validation results. `none` if values are untransformed. |
| Score | `none`, or a complete documented score specification satisfying G8. This refers to a user-facing data score, separate from this readiness rubric. |
| Forecast | `none`, or a complete independently defensible forecast specification satisfying G9. |
| Design | Short title, core visual metaphor, geometry-to-data mapping, scale, units, legend, colour meaning, uncertainty treatment, motion meaning, spin/backside discovery, selection behavior, accessible table, mobile/reduced-motion behavior, performance budget and distinctness notes. |
| Review | Outcome, all ten gate results with evidence paths, per-category points/reasons, total, reviewer, review date, reviewed dataset digest/version, remaining limitations and explicit blocking next steps. |

A compact review record should follow this shape. The example is deliberately unreviewed; it is not accepted evidence:

```json
{
  "conceptId": "original-source-id",
  "datasetIds": ["dataset-id"],
  "verdict": "hold",
  "researchReadinessScore": null,
  "productQualityScore": null,
  "gates": {
    "G1": {"status": "unchecked", "evidence": []},
    "G2": {"status": "unchecked", "evidence": []},
    "G3": {"status": "unchecked", "evidence": []},
    "G4": {"status": "unchecked", "evidence": []},
    "G5": {"status": "unchecked", "evidence": []},
    "G6": {"status": "unchecked", "evidence": []},
    "G7": {"status": "unchecked", "evidence": []},
    "G8": {"status": "unchecked", "evidence": []},
    "G9": {"status": "unchecked", "evidence": []},
    "G10": {"status": "unchecked", "evidence": []}
  },
  "scoring": "none",
  "forecast": "none",
  "reviewedFileDigests": {},
  "reviewer": null,
  "reviewedAt": null,
  "blockers": ["Await populated, verified research pack"],
  "limitations": []
}
```

Valid gate statuses are `pass`, `fail` and `unchecked`; both `fail` and `unchecked` prevent every `*-ready` verdict. A dataset shared by concepts can reuse verified data gates, but each concept still needs its own claim, AI-relationship, score/forecast and design review. A changed input digest invalidates the corresponding value/coverage checks until the changes are reviewed. Researcher-supplied verdicts are proposals until independently reviewed.

## Review reporting

The final audit must reconcile all 132 concept IDs and report how many pass, need research, need reframing, or are unsupported. It must separately report unique datasets and their real observation counts, external-source checks performed, any inaccessible sources and unresolved reuse issues. No blanket average or quality claim substitutes for per-concept findings. Accepted designs are implementation specifications; their resulting animation, accessibility and mobile behavior must pass the separate runtime release gates after implementation.
