# AFTERWORLDS research implementation pack

Primary-source research, populated datasets, independent acceptance decisions and creative specifications for the **132 previously labelled research concepts**. The frozen inventory preserves each World Processor source ID and the original AFTERWORLDS proposal. This pack does not change the deployed globe pages.

Start with [the complete results](CONCEPT_RESULTS.md). The machine-readable [manifest](manifest.json) contains an `implementationQueue` restricted to accepted concepts and exact dataset versions. Counts in that manifest distinguish concepts, unique datasets, normalized observations, explicitly missing values and interval-only estimates. Linked raw source records are additional material and are not silently added to the normalized row count.

The final independent review accepts **73 concepts** and holds **59** for specific evidence gaps. The accepted set contains **3 direct findings, 11 contextual findings and 59 explicitly revised questions**. All 73 have matched creative specifications. Their 73 unique datasets contain 2,486 normalized records, including 817 explicitly missing records and 2 range-only estimates. Internal research-readiness scores are 92–98/100; held concepts remain unscored.

| Need | File |
| --- | --- |
| All 132 outcomes, including evidence holds | [CONCEPT_RESULTS.md](CONCEPT_RESULTS.md) |
| Ready implementation queue and dataset hashes | [manifest.json](manifest.json) |
| Populated, normalized JSON datasets | [datasets/](datasets/) |
| Per-concept creative treatment and data bindings | [designs/design-registry.json](designs/design-registry.json) |
| Shared interaction, motion and performance requirements | [designs/shared-contract.json](designs/shared-contract.json) |
| Independent gate decisions and score evidence | [audits/final-review.json](audits/final-review.json) |
| Acceptance rubric | [audits/RESEARCH_READINESS.md](audits/RESEARCH_READINESS.md) |
| Professional reference comparison | [audits/DESIGN_BENCHMARKS.md](audits/DESIGN_BENCHMARKS.md) |
| Implementation and release instructions | [IMPLEMENTATION.md](IMPLEMENTATION.md) |

## What acceptance means

Each accepted concept passes all ten research gates and scores at least **92/100** in the independent review. A `reframe-ready` verdict covers only its revised question; `context-ready` does not establish an AI-caused effect. A hold names the evidence, method or design still needed. No missing measurement is filled with an invented value.

These are research and design-specification scores. They do not certify a 9.2/10 finished application. Animation, mobile usability, accessibility, engagement, coding and scalability require the implementation and device checks described in the release instructions. Reference products are comparison targets; no unsupported numerical ratings or claim of outperforming them is made.

## Dataset contract

Each file includes real `rows`, field definitions, units, population or denominator, geography rules, observation and publication dates, retrieval date, primary sources, precise source locators, reuse basis, transformations, uncertainty and omissions. The observation `sourceId` joins to `sources[].sourceId`. Coordinates remain null where the source provides no defensible locations. Abstract category placement on a globe must be labelled as nongeographic.

Preserve source estimates, thresholds, confidence intervals, range-only observations and explicit missing rows. Annual grid factors are not per-prompt emissions; contracts are not electricity already delivered; model benchmark performance is not real-world coverage; exposure is not job loss; survey satisfaction is not a safety rate. Forecast and composite-score methods are explicitly absent unless the individual accepted record documents them.

Source licences apply separately. Limited factual extracts are labelled as such and do not grant reuse of the original article, chart, photograph or larger database. Attribution and any source-specific restrictions travel with the data into the application.

## Reproduce and validate

From the repository root, using Node.js 22 or later:

```sh
npm run research:validate
npm run research:build
npm test
npm run build
```

Validation checks the frozen 132 IDs, populated dataset contracts, source joins, missingness, review gates, score arithmetic, exact file hashes and creative bindings to existing fields and rows. It cannot establish scientific truth on its own: the independent source-check logs document those checks.

`research:build` deterministically regenerates the manifest and results from the accepted review. The Python scripts preserve research extraction and normalization steps; some explicitly fetch public sources, which can change. Do not run a research-authoring script over a signed-off pack and assume the review still applies. Regenerated datasets need renewed verification and design/review hashes before acceptance. In particular, use `governance_build.py --datasets-only` when refreshing that domain without overwriting its researcher audit.

## Review responsibilities

Four domain researchers examined physical infrastructure, society, governance and the planet. The creative agent supplied individual representations. The original quality challenger retained final acceptance authority. Physical rows received a separate root-agent source check; society and governance were checked by the quality challenger; planet datasets received cross-domain peer checks. Findings and corrections remain in [audits/](audits/) and [sources/](sources/).

All retrieval and review dates use UTC. Observation periods remain those of the source, even when an older release is the latest suitable evidence. A static researched snapshot is never labelled live data.
