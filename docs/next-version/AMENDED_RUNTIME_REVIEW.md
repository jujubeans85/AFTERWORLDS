# Runtime review of corrected designs 74 and 156-8

Reviewed 2026-10-20 at 06:40:56 UTC by `/root/quality_challenger`, independent of the scene, binding and UI authors. The result supports local development runtime activation of these two exact corrected designs. It does not certify a production release, a numerical product rating, physical-device usability, performance, listening quality or an operational source feed.

The factual correction evidence remains in [74_FACTUAL_DESIGN_REVIEW.md](74_FACTUAL_DESIGN_REVIEW.md) and [156-8_FACTUAL_DESIGN_REVIEW.md](156-8_FACTUAL_DESIGN_REVIEW.md). Those scientific-only records do not authorize runtime activation. The separate records in `data-updates/design-activation/` do so only after the implementation checks below. Agent names and hashes provide a reproducible project audit, not authenticated human identities or cryptographic review signatures.

## Independent implementation evidence

- **74:** Four exact source observations retain both models on MMLU Pro and AIME 2026. Native 0–100 positions preserve 60 versus 67.6 and 37.5 versus 20.8. Constant-width links join the same model; their crossing does not imply time or an overall ranking. AIME explicitly says “no tools.” The complete 18-row source remains available.
- **156-8:** The first bar is the primary report's rounded 53%, with no strict-bound arrow. The second is 90% conditional on respondents who know client location. Scene, static equivalent, table and preview retain both outcomes: clients outside the worker's country versus clients outside Latin America and the Caribbean. No product of the percentages is inferred.
- Independent automated checks cover exact geometry, ambient invariance, visible benchmark configurations, table/static row parity, separate denominators, and corrected Sources wording. The original frozen legend remains in the historical design for audit; current presentation does not repeat its superseded strict-bound assertion.
- I independently ran 19 multiple-source/amendment tests, then four amended-scene tests after the configuration fix, twelve amendment/harness/panel tests, and two new independent UI tests. All passed. The preceding integrated 71-view run passed 210 tests; these scoped reruns are not additive unique-test counts.
- I inspected both final PNGs and the coordinator's final screenshots. The first 156 preview omitted the actual client-location outcomes; the corrected preview now includes both outcomes and their denominators. The 74 preview explicitly identifies its MMLU-only two-of-four subset and directs readers to the AIME no-tools rows in the full view.

## Browser evidence and limits

The coordinator `/root` executed the browser checks in a local isolated review harness at port 4174. I inspected the saved images and evaluated the reported interactions; I did not execute those browser interactions myself.

For 74, the coordinator selected and focused the AIME 37.5 no-tools observation, verified all four rows, opened the four-point static equivalent, and reported one canvas with no horizontal overflow at a 320-pixel viewport. The desktop screenshot shows the actual crossing scene with both task labels.

For 156-8, an initial harness picker width caused overflow and stale copied UI retained the old legend. After refresh, the coordinator reported viewport and scroll widths of 320, one canvas, corrected title/accessible label and rounded Sources wording. The selected 90% observation retained its conditional denominator; the opened static equivalent retained both exact bars and outcomes. The final desktop screenshot shows the actual first panel; the narrow screenshot shows readable selected-observation evidence and the preview.

The temporary harness is explicitly not an accepted release. Its isolation test verifies that staging leaves activation files and accepted pointers unchanged, closes relative module imports and produces both preview PNGs. Activation still requires the separate actual approval record and normal build validation.

## Reproducibility

The retained [artifact manifest](review-proof/amended-reviewed-artifacts.json) contains the exact scientific-amendment hashes, fixture identities, module hashes, preview hashes and screenshot hashes. Local preview copies are [74](review-proof/amended-74-preview.png) and [156-8](review-proof/amended-156-8-preview.png). Browser evidence is in `browser-proof/amended-74-review-{320,desktop}.jpg` and `browser-proof/amended-156-review-{320,desktop}.jpg`.

The frozen `research/` tree remains unchanged. No runtime approval is backdated to the original scientific acceptance, and no original revision is claimed to have previously run.
