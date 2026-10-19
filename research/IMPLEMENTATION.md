# Implementing a reviewed world

Start with `manifest.json` → `implementationQueue`. This list contains only concepts whose exact dataset versions and design specifications passed independent research review. Candidate verdicts in the four research-stream audit files are proposals; the final review governs acceptance.

1. Resolve every listed dataset path and check its SHA-256 against the manifest. Parse the normalized observations, column dictionary, source records and coverage notes. Do not synthesize absent rows.
2. Resolve the concept's `designId` in `designs/design-registry.json` and apply `designs/shared-contract.json`. Implement its specific geometry, legend, interactions and accessible table. Keep decorative movement distinct from measured data.
3. Respect the dataset's geographic mode. Null coordinates are deliberate. Country or region display anchors must never appear to identify a measured facility. Categorical and global observations belong on an explicitly abstract sphere.
4. Keep observation dates, publication dates and retrieval dates separate. A later access date does not update an older observation. A static research snapshot must never be labelled live.
5. Carry the accepted claim, AI relationship, coverage and uncertainty into the information overlay. Use the proposed title for an accepted reframe; the original title may no longer be accurate.
6. Follow the concept's explicit scoring and forecast contracts. `type: none` means no numerical score or invented future value. The existing app's generic display ceilings and linear extrapolations must not be inherited automatically by these new datasets. “Not available” is a valid timeline state.
7. Add an explicit source-ID mapping and data adapter in the app build only after implementing the design. Preserve one real route per world. Keep raw source values available in its accessible table and JSON export.
8. Run research validation, the static app build, tests, and the separate runtime acceptance checks below. Research acceptance alone does not release a globe to production.

## Runtime release checks

The user's product target remains at least 9.2/10 across coding, animation, user friendliness, scientific accuracy, mobile friendliness, engagement and scalability. No runtime score is assigned by this pack. Use the same explicit rubric and record device/browser evidence before rating the resulting product.

| Area | Required implementation evidence |
| --- | --- |
| Coding | Clean build; no runtime errors; deterministic source transformations; schema and stale-digest checks; route reloads; disposal and listener ownership checked through repeated navigation. |
| Animation | All geometric and motion encodings match the accepted specification; pause and reduced motion stop every animated system; no flashing; no clipping through a full rotation; visible uncertainty. |
| User friendliness | A first-time user can identify the question, unit, period and legend, rotate/select a record, open the source and return to the index. Equivalent controls work with keyboard and screen reader. |
| Scientific accuracy | Final visible claims match the reviewed dataset digest; forecasts/scenarios, samples and contextual AI links remain labelled; no unsupported geographic allocation or causal language. |
| Mobile friendliness | Verify touch drag and pinch, 44px targets, overlays, safe areas, orientation and page scrolling on actual small-screen browsers. Record the devices and viewport sizes tested. |
| Engagement | Backside discoveries reveal real additional records or comparisons. User testing records whether people understand and use the interaction; no invented engagement uplift or dark patterns. |
| Scalability | One active renderer; instanced repeated geometry; lazy data loading; finite GPU budget; memory returns after navigation; test long sessions and low-power devices; asset and frame timing measurements recorded. |

See `audits/DESIGN_BENCHMARKS.md` for documented comparison features. Competitor quality ratings are not invented. These criteria are an implementation checklist, not evidence that implementation already passes.

## Refreshing evidence

Refresh the primary source, verify its release and reuse terms, rerun the documented extraction, and preserve the previous version in Git. Recheck changed values, definitions, geographic joins, missingness and extremes. Update the independent review and dataset digests before rebuilding the pack. `npm run research:validate` rejects stale digests on accepted concepts. A changing source URL alone does not refresh the data.

Research assets are separate from the current live app. Publishing this repository does not silently promote candidates or replace the deployed globe collection.
