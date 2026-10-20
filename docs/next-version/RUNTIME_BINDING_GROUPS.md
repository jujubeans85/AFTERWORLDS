# Remaining accepted runtime bindings

`RUNTIME_BINDING_AUDIT.json` is generated implementation-planning evidence, not a second dataset registry or an activation list. Run `node scripts/audit-research-runtime.mjs` to reproduce it from frozen accepted designs. The script verifies each accepted design digest and bound dataset digest before reporting source units, native scale, denominators, exact selected IDs, additional fields, missing bound fields, source periods, and required geometry.

The audit covers 73 accepted designs: 57 active and 16 pending. Scene support and independent validation remain required for every activation. A common group does not authorize a generic visual substitution.

| Pending group | Count | Implementation constraint |
| --- | ---: | --- |
| Native linear rulers | 2 | Keep each reviewed grouping, ruler, inset, source unit, denominator and status. Some are source-native scores or unlike accounting measures. |
| Categorical/equal facets | 0 | Twenty designs are active. Numeric amounts remain labels only; no quantity-derived area, brightness, rank or point location without the exact design. |
| Incompatible-unit panels | 6 | Independent panel domains; no cross-panel magnitude comparison or sum. |
| Geographic join required | 4 | Support only the geometry explicitly justified by source coordinates/identities; no guessed country or point placement. |
| Multiple-dataset panels | 3 | Bind each dataset hash and selected rows independently; current single-dataset bundle schema needs extension. |
| Integer counts | 0 | All three current count designs are active; preserve the counted population and category semantics. |
| Derived percentage with overlap | 0 | Concept 138-8 displays source `publishedPercent` on the percentage arc and keeps account count/denominator 832 separately. Do not recompute higher-precision percentages, clip raw count 560 to 100, or normalize overlapping categories. |
| Explicit denominator switch | 1 | Concept 365 requires count/share modes and the appropriate wine-type denominator; no universal normalization. |
| Logarithmic native values | 0 | Concept 117 requires a labelled logarithmic position scale; source FLOP values stay unchanged. |
| Qualified intervals/bounds | 0 | Concept 211-4 preserves source confidence intervals and the source rate denominator. |

The latest activated batch adds eight exact comparison scenes: segmentation metrics, field-stage water deficit, hypoxia metrics, physical fuel shares, model benchmark pairs, production versus shipments, wetland class accuracy and injury-involvement confidence intervals. Earlier batches cover architecture, percentage, categorical, count, ruler, interval, pair and geographic primitives. Every active adapter has its own matching scene profile and thumbnail. The complete build passed with 57 native research views and 174 passing tests after activation.

Known exceptions requiring explicit code:

- Concept 156-8 is held: its accepted geometry calls for an open lower bound at 53%, but its bound source row explicitly requires the report-rounded 53% rather than a strict bound. The unaccepted proposal at `data-updates/design-proposals/156-8-rounded-percentage.json` preserves exact original hashes. Independent factual review supports the correction, but a separate scene/table/browser/regression runtime approval remains required before activation.
- Concept 218 selects 12 of 18 rows. Frozen concept 74 mistakenly selects only 2 of the same 18 rows because its AIME filter literal does not match the source. A separately reviewed, hash-bound amendment restores the intended 4 rows; it remains inactive pending separate runtime approval. The exact filters and IDs both matter.
- Concept 217 selects one of five inference rows alongside a separate electricity dataset. Neither omitted inference values nor incompatible units can be silently included.
- Concept 390 binds `metric` although three rows omit that field. A scoped optional-field rule must preserve their other source labels.
- Concept 8-17 has two mortality percentages with randomized sample sizes and one hazard ratio with interval endpoints. Bound fields are intentionally absent from the other panel's rows.
- Concept 388 already uses two interval-only rows and six separate-denominator continental shares; missing interval endpoints on share rows are intentional.
- Unit strings are often more explicit at row or scale level. The generated audit records every alias; permit only a reviewed concept/dataset-specific mapping, without numeric conversion.

The immutable release builder still verifies independent acceptance and raw dataset hashes. This planning audit cannot grant acceptance, update data, or substitute for scene tests, accessibility parity, performance checks, or product-quality review.
