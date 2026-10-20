# Independent rollout audit

Reviewer: `quality_challenger`. Prepared 20 October 2026, Australia/Sydney. This is a source-contract audit and implementation order, not product acceptance.

## Starting evidence

The continuation starts from one implemented native research world, concept 430. The independent reviewer reran all **63 tests**, which passed without failures, skips or cancellations. This run used the existing built assets and bundled Node v24.19.0; it did not rebuild or perform browser/device testing. The working tree was clean at the start of this audit.

The frozen registry contains **73 accepted specifications**, with 59 reframes, 11 contextual views and three direct AI-related views. One implemented specification leaves 72 to implement at this starting point. The 59 held concepts are separate from that implementation queue and remain held. Existing 14 sourced stories are also separate from the accepted-research count.

## Concept 408: checks that matter

The accepted `country-access-surface-and-dial` specification binds exactly 217 World Bank reporting-economy rows for 2024. Its fixed scale is `0–100 percent of population`. The data contains two explicit nulls (`electricity-ASM`, `electricity-XKX`), 122 exact 100 values, no true zero, and a minimum nonnull value of 5.4. The two statuses are `estimated` and `missing`.

Required checks:

- Join geographic IDs to independently audited country/economy polygons. The existing 110m topology has 177 geometries and numeric IDs; Kosovo and Somaliland have no numeric ID. Names alone do not establish an identity mapping, and differently defined territories must not be silently merged.
- Report supported geometry coverage visibly. Every unsupported or missing economy remains in the table and selection list. Outside-sample polygons are not fabricated zero observations.
- Uniform polygon fill follows `value / 100`; the selected fixed-size dial sweep is `2 * pi * value / 100`. A full 100% circle must not disappear through modulo or coincide visually with zero. Null has no numerical sweep and receives an explicit missing label/hatch.
- “Next country lacking access” traverses nonnull observations in ascending value, with deterministic ties. It must not treat null as zero or use an invented risk ranking.
- Show native percentage, period, status, source locator and population denominator. Do not call basic electricity access reliability, affordability, AI access or an AI effect.
- Keep the constant-radius 60-second gimbal separate from polygon colors, geometry and selected dial. Phase checks compare all measured attributes, not only vertex positions.
- Exercise zero, full access and null fixtures independently of the frozen observations, and disclose which are fixtures. Test unsupported IDs, duplicate joins, missing geometry, reduced motion, selection by table and route disposal.

## Efficient rollout without changing research

The accepted set includes 35 linear scales, 18 categorical scales, seven panel-specific scales, three scales explicitly declaring no numerical encoding, two switchable scales, two count scales, and one each of source-native linear score, integer-count, mixed, panel-specific noncomparability, log-position and categorical detection with separate effort.

These scale categories are useful for engineering reuse; they are not permission to replace 73 distinct accepted designs with one stock renderer. Keep a reviewed adapter per concept specifying the source field, row inclusion/order, exact formula, labels, layout, selection and special cases. Shared modules should implement those declarations and reject unsupported combinations.

| Order | Reusable implementation | Representative worlds and conditions |
| --- | --- | --- |
| 1 | Geographic joins, bounded polygon colors, dial and coverage handling | 408 establishes these primitives. Reuse joins for 247's uniform membership outlines and 78-4's separate count/percentage modes only after their own semantics pass. |
| 2 | Native scalar marks and paired comparisons | 284 radial books, 320 mean/median counterweights, 63 urban/rural rings, 8-6 trial arms and 5-6 dated mapped-fraction duet. Share bar/arc math but retain declared pairings, denominators and layouts. |
| 3 | Nonquantitative facets and documented relationships | 18 categorical specifications, including 417, 358, 356, 305, 259, 250, 107, 155-17 and 178. Equal-size facets and explicit relationship labels must not imply invented magnitudes, flows or causal effects. |
| 4 | Bounds, intervals and uncertainty | 406 qualified bounds; 388 interval-only bands; 330 standard-error gauges; 211-4 confidence pairs; 193-5 bound plus magnified inset. Distinguish threshold, approximation, missingness and statistical interval types. |
| 5 | Multiple panels and mode changes | 394/56-5 historical share with separate context, 217 incompatible units, 30-8 footprint boundary panels, 365 histogram count/share modes, 266-2 milestones/revenue. Never normalize unlike measures into a shared impact scale. |
| 6 | Specialized log-position and recording-effort maps | 117 log-FLOP positions; 378 recorder/species/week detection and effort. 378's 1,587 rows require a declared selected subset, explicit missing effort, source-randomized coordinate labels and measured resource checks before expansion. |

The shortest valid route is to finish one representative adapter per family, run its adversarial cases, then activate only siblings whose per-concept contract is implemented. A generic table can expose accepted evidence early, but table availability does not certify completion of its specified visual design.

### Cases a generic numeric mapper would get wrong

- **138-8:** the arc uses `publishedPercent`; `value` is the account count, with `denominatorAccounts` printed separately. Overlapping activities cannot become one pie.
- **78-4:** count and `internetPercent` are separate modes and units. Population weighting cannot be inferred from percentage alone.
- **388:** two rows have null point values with real lower/upper endpoints. They are interval-only observations, not missing rows and not midpoint estimates. Rounded continental shares total 99 and must not be renormalized.
- **330:** whiskers are plus/minus one robust standard error, not 95% confidence intervals.
- **398:** standard deviations are a different field and interpretation from 330's standard errors and 211-4's confidence bounds.
- **406 / 193-5 / 156-8:** open bounds and source qualifications must remain visible; a terminal at the bound is not an exact point estimate.
- **117:** logarithmic radial position encodes FLOP. Logarithmic bar length, area or volume is not the accepted encoding.
- **378:** null detection with missing effort differs from no detection with recorded effort. A detection is not an individual bird count.

## Full handoff work still required

| Capability | Remaining acceptance work |
| --- | --- |
| Research rendering | Complete and independently inspect each accepted primitive, all data/table/export parity and preserved limitations. Keep held concepts out of measured claims. |
| Source updates | Immutable candidates, semantic diffs, independent acceptance records, atomic accepted-manifest publication, rollback, cadence execution and a known-change end-to-end render test. A successful fetch or candidate file alone is insufficient. |
| Narration | Reviewed per-world scripts and versioned audio bound to data/design hashes; one voice owner; stale-audio invalidation; manual fallback; editorial listening and interruption behavior. Existing synthetic audition is not approval of all narration. |
| Sound | Useful independent volume/mono controls, richer bounded recipes, cleanup, real listening across outputs and route transitions. Parameter uniqueness is not perceived distinctness. |
| Sharing | Explicit public origin, absolute canonical/OG URLs and raster previews, pinned-version semantics, real recipient/native-sheet/clipboard cases. Preserve old slugs. |
| Alternative forms | Apply the accepted mappings selectively; retain their native quantities and meaning. Literal Bloch-sphere states remain blocked without compatible quantum evidence. |
| Runtime/accessibility | Other desktop browser engines; physical iPhone/iPad/Android classes; keyboard and screen readers; reduced motion, network, audio interruptions and resource/frame traces tied to the release build. |
| Product assessment | Participant task evidence, matched benchmark tasks and two independent reviewers. All seven product categories remain unrated until their required evidence exists. |
| Deployment/rollback | Inspect current platform state, retain a recoverable deployed version, verify release hash and direct world URLs, and exercise platform rollback. A temporary-directory build rollback does not prove production rollback. |

Update this document's starting counts only when a later review explicitly verifies additional activated worlds. Never change frozen research or lower acceptance gates to make a runtime milestone appear complete.
