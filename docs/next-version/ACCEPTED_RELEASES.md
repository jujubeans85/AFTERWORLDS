# Reviewed releases and electricity geography

The runtime supports 57 accepted research concepts, including 20 typed categorical designs. `ACTIVE_RESEARCH_CONCEPTS` in `src/research-data.js` is the explicit activation list; the derived runtime audit records every active and pending binding. Frozen research is unchanged. The implemented WDI pipeline can prepare a review proposal, accept a separately reviewed candidate, preserve previous releases and roll back. No candidate has been promoted by this implementation, no reviewer record is fabricated, and no unattended promotion is enabled.

## Native-unit build and browser contract

`prepareResearchRuntime(root, dist)` in `scripts/research-runtime.mjs` verifies the frozen manifest, final research gates, dataset bytes and independently reviewed design digest. It writes immutable content-addressed JSON bundles to `dist/assets/research/<sha256>.json` and returns summaries keyed by concept ID.

The build also atomically writes `/assets/research/accepted-manifest.json`:

```json
{
  "schemaVersion": 1,
  "worlds": { "408": "current summary object", "430": "current summary object" },
  "history": { "408": { "url": "/assets/research/history/<sha256>.json", "sha256": "<sha256>" } }
}
```

The strings above describe object positions; they are not real release records. Summaries include `conceptId`, `datasetId`, title/question, `release: {url, sha256}`, `datasetSha256`, `designSha256`, `revision`, `observationPeriod`, fixed scale and `acceptance: {kind, acceptedAt, lastCheckedAt, sourceReleases}`. Electricity summaries also include `geographySha256` and map coverage.

The browser loads only accepted summaries through `loadResearchWorld`. It verifies the complete bundle, canonical design and dataset content, accepted row bindings and the geography digest. Dataset SHA identifies the original frozen bytes or the serialized proposed update dataset; the complete bundle has a separate digest. Changing units, row universe, scale, period or geographic scope fails closed.

An accepted manifest change is an offer to load a new accepted revision. Preserve selection/camera until the user applies it; retain the previous accepted data on errors. Observation year, source release, last check and acceptance date are distinct. A 2024 correction remains a revision of 2024. Historical immutable bundles are regenerated from retained acceptance records on a clean build, alongside the frozen baseline. Each lazily loaded immutable history index has `{schemaVersion:1, conceptId, versions:{revision:summary}}`; the browser verifies its digest and all release references. Narration enrichment writes a newly hashed index and updates its reference rather than modifying an immutable index. Manifest and individual history files have a 256,000-byte build/reader limit; the 57-world manifest is 111,331 bytes. The 2 MB release-bundle cap is unchanged.

## Geography audit for 408

`data/geography/un-m49-world-atlas.json` records the [UN Statistics Division M49](https://unstats.un.org/unsd/methodology/m49/) country-code table inspected on 20 October 2026. The [world-atlas documentation](https://github.com/topojson/world-atlas#worldobjectscountries) identifies its geometry IDs as three-digit numeric country codes. Joins use explicit alpha3-to-numeric codes, never names or guessed coordinates. The code table and existing `vendor/countries-110m.json` bytes are pinned by SHA256.

The 217-economy dataset produces **167 mapped economies and 50 table-only economies**. The 1:110m file omits many small territories. World Bank-specific `CHI` and `XKX` have no approved numeric join. Cyprus and Somalia are deliberately table-only: the supplied shapes omit separately unkeyed Northern Cyprus and Somaliland geometries, and no aggregate value is assigned to a partial source scope. All 177 background polygons remain available as neutral, nonquantitative context, including outside-sample and unkeyed polygons.

`research.geography` exposes:

- `countries`: `{rowId, geographicId, geometryId, name, polygons}` for approved joins.
- `backgroundCountries`: `{geometryId|null, polygons}` for neutral land.
- `unsupported`, `unsupportedRowIds`, `coverage: {total, mapped, tableOnly}`, source provenance and limitations.

All 217 rows remain table-visible, including null American Samoa and Kosovo observations. There are 122 exact 100% observations. Native marks expose `fraction=value/100` and `dialAngle=2π×value/100`; null stays null. The polygons show uniform economy summaries, not local access or service reliability. Generalized boundary rendering does not establish complete territorial coverage or settle border questions.

## Candidate, review and promotion

1. Run `node scripts/refresh-wdi.mjs`. It pins indicator `EG.ELC.ACCS.ZS` to 2024 and creates a candidate only when normalized content differs from the currently accepted release. The frozen dataset remains the provenance baseline. A correction back to frozen values still creates a candidate if it differs from the accepted version.
2. Run `node scripts/review-wdi.mjs propose <candidate-directory>`. This verifies raw response hashes and pagination, reproduces normalization, checks the fixed economy universe, and writes a content-addressed proposal under `data-updates/proposals/`. It makes no acceptance decision.
3. Independently inspect the exact proposal, its raw source/terms evidence and its revised design. `proposal.diff` compares against the actual accepted parent and includes reversions; `baselineDiff` separately preserves the importer comparison against frozen research.
4. Save a separate review document binding the exact printed proposal/candidate/dataset/design hashes. Required fields are `schemaVersion:1`, `decision:"accept"`, `independent:true`, distinct nonempty `reviewer` and `preparedBy`, `acceptedAt` as an ISO timestamp after the source check, and `expectedPreviousVersionId` matching `proposal.parent.versionId`. `checks` must contain `sourceValues`, `sourceTerms`, `definitions`, `semanticDiff`, `coverage` and `designBinding`, each with `status:"pass"` and nonempty `evidence` references. These declarations record a real independent review; a parser test or a generated name cannot supply one.
5. Run `node scripts/review-wdi.mjs promote <candidate-directory> <independent-review.json>`. It reproduces the proposal again, validates review bindings, preserves the release/candidate/raw files immutably, and atomically switches `data-updates/accepted-manifest.json` under a lock. A changed parent prevents promotion.
6. Run tests and the build, then the required preview/device review and deployment workflow. The build consumes only the accepted pointer, never a candidate fallback. Publication remains distinct from local acceptance.

Accepted releases live under `data-updates/accepted/society-electricity-access/<versionId>/`; every pointer state is retained under `data-updates/manifest-history/`. Review records are not cryptographic identity proofs; repository access controls and an actual independent review remain necessary.

## Rollback

Restore a previously accepted update with:

```sh
node scripts/review-wdi.mjs rollback <target-version> <expected-current-version> <target-release-sha256>
```

Restore the frozen baseline with:

```sh
node scripts/review-wdi.mjs rollback frozen-b1648fb3836c <expected-current-version>
```

Both retain history and reject a stale expected current version. A failed or interrupted promotion may leave unreferenced immutable files; these are never selected by the public manifest.

## Limits

The update pipeline remains bounded to the existing 2024 electricity indicator and fixed accepted economy universe. A new year, added economy, changed definition, changed scale or another dataset needs a new reviewed adapter contract. Real source and terms review is still required for every promotion. Current importer failures stop rather than bypass access/schema errors. Retry/backoff, conditional upstream caching, production schedule activation and device validation remain separate work. These tools neither fabricate a live-data badge nor certify product-quality scores.

## Actual source check

The World Bank recheck on **2026-10-20 at 05:35:12.683 UTC** succeeded with zero changed rows, the existing two explicit nulls and database release `2026-10-08`. Normalized SHA256 remains `3eb41289bd49765f86797048c18ee6a726ce3185b1bd6321a80bd722f88bfc97`. No candidate release or acceptance was created. The immutable check receipt is `data-updates/checks/society-electricity-access/42d2960b571ffab9478c07a5d3ffc1a327db1b6cbb512502b648f1240f37fd5c.json`; it contains actual raw response digests and byte counts. Subsequent successful checks produce a check receipt without manufacturing a release. The build exposes the latest check time/status separately from the accepted observation and revision.

## Staged candidate-only schedule

`.github/workflows/wdi-candidates.yml` supports manual dispatch and a monthly check, approximating the policy's proposed 30-day interval without suggesting a publisher release schedule. Scheduled execution requires both `refs/heads/main` and repository variable `AFTERWORLDS_WDI_CANDIDATES=enabled`. The variable has not been enabled by this implementation. Activate it only after the deployment-ready merge and review of current source terms and artifact access.

The job has read-only repository permissions, no persisted checkout credentials, pinned action commits, a ten-minute ceiling and no promotion, commit, push or deployment command. Tests and frozen research validation precede source access. The fixed-year importer stops on access/schema failures. `scripts/check-wdi-ci.mjs` records an immutable success or failure report; failure remains a failing workflow, not a silently skipped refresh.

Each run uploads candidate files, raw candidate response attestations and check reports to a uniquely named immutable artifact for **seven days**. Artifacts inherit the repository's Actions access rules and contain no secrets; current scope is the approved World Bank electricity factual extract and API responses. They are review material, not a public accepted manifest. Preserve any artifact selected for review into the repository's immutable acceptance workflow before expiration. A green run cannot accept evidence.
