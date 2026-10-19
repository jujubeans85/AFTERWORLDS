# Data updates for the next version

The next version should update from **accepted, versioned observations**. A scheduled fetch creates a candidate; source checks, semantic validation and an independent review produce an accepted snapshot; the release manifest then changes the rendered globe. The 73 frozen datasets remain reproducible references. None currently justifies a real-time data badge.

`update-policy.json` covers every dataset, its frozen hash, proposed checking interval, exact source endpoints, reuse basis, scientific constraints and render behavior. All schedules and automatic publication are disabled in this handoff. The intervals are editorial proposals, not promises about when publishers release data. A manual electricity-access pilot is implemented and tested below; the other adapters are implementation contracts. No recurring job or production refresh is running.

## Implemented pilot

Run `node scripts/refresh-wdi.mjs` from the repository root. It fetches the country catalogue, fixed-2024 electricity indicator and indicator metadata. A changed result writes a complete candidate with raw JSON and SHA256 attestations under `data-updates/candidates/society-electricity-access/<versionId>/`. An identical semantic result prints a check summary and writes no candidate release. Nothing can promote, deploy or change the globe from this command.

The live source check on 2026-10-19 succeeded: **zero changed rows** across the frozen 217-economy selection, including its two explicit missing values. Normalized content SHA256: `3eb41289bd49765f86797048c18ee6a726ce3185b1bd6321a80bd722f88bfc97`. No candidate file was created. This confirms the importer ran against the public endpoints; it does not supply new observation dates or imply an unattended service.

`node --test tests/data-updates.test.mjs` passes 12 tests covering real frozen-source reproduction, null versus absence, zero, changed geography, semantic/schema failures, complete pagination, bounded requests and timeouts, raw attestations, canonical hashes and atomic candidate writes. The pilot fails immediately on HTTP errors; the retry/backoff policy in the JSON is a future worker requirement. It does not implement conditional HTTP caching, durable no-change check receipts, joined connectivity, review/promotion, an accepted-manifest renderer or a schedule.

## What actually changes

The audit divides the 73 datasets into these update classes:

| Class | Count | Proposed behavior |
| --- | ---: | --- |
| Structured snapshots | 4 | Deterministic import candidates; review revisions, schema and meaning |
| Release bundles | 2 | Fetch matching data files and methodology notes together |
| Annual reports or surveys | 10 | Check quarterly; accept a new observation year only with comparable definitions |
| Periodic reports | 3 | Check twice yearly; do not presume annual releases |
| Versioned reports, studies or benchmarks | 9 | New editions need explicit compatibility review |
| Curated policies | 9 | Monthly source checks; review wording, jurisdiction and effective dates |
| Curated events | 10 | Append dated primary evidence; never turn plans into outcomes automatically |
| Archival studies or events | 21 | Retain historical identity; monitor corrections, retractions and follow-up |
| Versioned archives | 2 | Pin the archive version; reprocess only a separately reviewed release |
| Curated snapshot | 1 | Verify the downloadable interface and measurement definitions before adapting |
| Mixed-source comparisons | 2 | Update components with explicit, independent periods |

A successful check with no changed observations updates `checkedAt` only. It does not advance the observation year, animate a fabricated change, or mint a new release. An amended value for 2024 is a **revision to 2024**, not change between 2024 and 2026. Historical studies should retain an “Historical snapshot” label instead of becoming misleadingly “stale” merely through age.

## First adapters, in order

**1. World Bank electricity access.** Start with `society-electricity-access`, explicitly querying 2024. The Indicators API supports JSON, date selection and pagination. Use the country metadata response to exclude aggregates, preserve missing values and compare source revisions at the same year. The baseline has 217 economies; a changed country universe needs review rather than a permanent assumption that it must always contain 217. The endpoint and detailed parsing contract are in `wdi-fixed-year-v1`. [API documentation](https://datahelpdesk.worldbank.org/knowledgebase/articles/898581-api-basic-call-structures).

Do not let `lastupdated` replace the observation period. Validate the requested indicator, economy identifiers, numeric/null values, percentage bounds and complete pagination. A new calendar year is a separate candidate with a coverage report. Recheck indicator-specific terms and credit the World Bank and original providers; the default licence has exceptions for third-party data. [World Bank reuse summary](https://data.worldbank.org/summary-terms-of-use), [licensing details](https://datacatalog.worldbank.org/public-licenses).

**2. Population-weighted connectivity.** Extend that adapter to `society-population-connectivity` only after the single-indicator pilot works. Join `IT.NET.USER.ZS` and `SP.POP.TOTL` on exact economy plus the same explicit year. Preserve null when either input is absent; calculate population × percentage / 100 with source precision. The output represents estimated Internet users, not AI users. Never select the latest nonempty value separately for each input. GDP components in the company/Stargate comparisons can later reuse the downloader, but their mixed fiscal/calendar and stock/flow meanings still require separate comparison review.

**3. Epoch notable models.** `governance-large-training` can use a weekly candidate check. Epoch documents daily CSV synchronization and additions to historical records. Keep the notable subset, the declared publication-date window, the ≥10²⁵ FLOP threshold, estimate confidence and supporting references. Identify records by a reviewed model/date key and rename aliases, not the frozen positional `epoch-N` IDs. A new estimate, a renamed model, and a newly released model are different changes. Organization nationality must not become physical training geography. [Update process](https://epoch.ai/data/ai-models-documentation/database-updates), [record definitions](https://epoch.ai/data/ai-models-documentation/records), [download subsets](https://epoch.ai/data/ai-models-documentation/downloads).

**4. Google annual region data.** The official documentation links a machine-readable repository. Its 2025 CSV is a promising replacement for HTML extraction, but this handoff has not verified its raw body. The GitHub page shows 48 lines; the frozen web-table dataset contains 44 observations. That difference must be reconciled before migration. Pin a reviewed commit, inspect file-specific notices, and compare shared values and region IDs. The repository licence indicator must not silently replace the frozen webpage’s CC BY attribution. Annual gross grid intensity and Google CFE remain distinct; neither is an hourly grid feed or a measured AI task footprint. [Official machine-readable link](https://docs.cloud.google.com/architecture/framework/sustainability/low-carbon-regions), [repository](https://github.com/GoogleCloudPlatform/region-carbon-info), [2025 CSV](https://github.com/GoogleCloudPlatform/region-carbon-info/blob/main/data/yearly/2025.csv).

**5. Waymo release bundle.** Check monthly for a reviewed release, using the official hub’s CSV1, CSV3 and release-note links. The publisher describes updates tied to NHTSA reporting and possible methodology changes; it does not promise a daily feed. Reject mixed cutoffs or benchmark vintages. Preserve service-area definitions, outcome/crash filters, paired cohorts, source 95% intervals and adjustment methods. The historical extraction script is useful, but is not an ongoing release-discovery adapter. Existing limited factual extraction does not authorize publishing entire crash-level files or reports. [Official hub, FAQ 2.4.1 and downloads](https://www.waymo.com/safety/impact/).

The remaining sources need the exact review classes in the JSON. CSO and JARA annual data are good later candidates, but a verified CSO table identifier and stable JARA extraction contract are still missing. Zenodo can expose archive metadata and new versions, but Norwegian recorder data remain a historical study. Preserve each file’s licence separately from the metadata licence. [Zenodo developer documentation](https://developers.zenodo.org/).

## Fetch and validation contract

Run imports server-side in a controlled worker or CI job. Do not call upstream providers from every visitor’s browser. Use a host/path allowlist, HTTPS, response-size limits, timeouts and a real JSON/CSV parser. Revalidate redirect destinations. Treat source text as data; no fetched instruction can modify adapters, secrets, validation rules or deployment steps.

Default to one request at a time per host, at least one second between requests, and at most three attempts. These are application limits, not asserted provider quotas. Respect stricter provider limits and `Retry-After`; back off on 429 and transient server failures. Stop on access blocks, terms failures or schema drift. Use conditional requests when ETag/Last-Modified exist. Store raw and canonical normalized hashes; a changed HTML footer alone is not a data update.

Every candidate needs a machine-readable diff: added/removed entities; old/new values and units; period changes; null/estimate/qualifier changes; source revisions; changed coverage; and changed methods. Use stable source identities, never array position. Preserve uncertainty and thresholds; “less than” cannot become an exact number. A schema change quarantines a candidate. A large numerical change is flagged for investigation rather than clipped or normalized away.

Validate the current baseline against its frozen hash before comparing. Treat new geography, AI attribution, causal wording, a derived formula, score, forecast, or changed visual scale as a new reviewed claim. Existing gates and the 92/100 research-readiness threshold still apply where relevant. A successful HTTP request or a passing schema cannot grant scientific acceptance.

Publish full upstream files only when their verified licence permits redistribution. For limited factual extracts, preserve approved facts, source locators and hashes without bundling full articles, protected charts or crash microdata. Candidate CI artifacts also require an appropriate retention/access policy.

## Versioning and the renderer

Use separate roots such as `data-updates/candidates/<datasetId>/<versionId>/` and `data-updates/accepted/<datasetId>/<versionId>/`. These paths are the proposed handoff convention; the implementer may adopt an equivalent documented layout. Never overwrite `research/`, the frozen manifests or independent-review hashes.

A version contains the normalized rows, source releases, raw digests, adapter version, semantic diff, validation results, reviewer decision and hash-bound design binding. The small accepted manifest maps dataset ID to accepted version, content hash and design version. Candidate files are never a production fallback. Promotion changes that manifest atomically; rollback restores its previous version.

For a refreshed globe, recompute only the fields its design binds. Preserve stable selected entities and camera state where possible. Display the observation period, source publication date, last successful check and acceptance date as separate facts. Offer a prior-version comparison and a concise “what changed” list. New regions must not receive guessed coordinates or inherited magnitudes.

Keep comparable units and an explicit scale domain. Automatic per-release min/max scaling can make an unchanged value appear different; use a fixed reviewed domain or clearly disclose a scale revision. A period slider appears only for comparable observations. Revisions can have a revision-history control without pretending to be a time series. Interpolate geometry only between accepted values, honor reduced motion, and update the accessible table to exactly the same values. Failure retains the last accepted snapshot with its actual dates.

## Codex deployment handoff

1. Continue on `next-version-foundation`. Start from the implemented candidate importer and add a snapshot validator and accepted-manifest reader outside frozen research. Keep workflows on manual dispatch initially; do not add a cron merely because a policy interval exists.
2. Extend and review the implemented fixed-2024 electricity adapter against preserved response fixtures. Test complete pagination, aggregate exclusion, valid zero, null, duplicate IDs, wrong indicator/year, API-error payload, changed definitions and HTTP failure. Verify an unchanged import is a semantic no-op.
3. The first real fetch succeeded with no semantic change. Run the next candidate check when integrating the production pipeline. Produce a readable diff and source/terms evidence. Review the candidate and affected design bindings independently; do not auto-merge by virtue of a green parser test.
4. Run the repository’s existing `npm test`, `npm run research:validate` and `npm run build`, plus the new importer tests and affected rendering checks. Research validation must still pass against the untouched frozen pack.
5. Publish a preview containing the candidate through an explicit preview-only selection. Check mobile layout, accessible table, reduced motion, units, missing values, scale and old/new comparison. Production continues to read the last accepted manifest.
6. Commit the accepted snapshot and manifest after review. Deploy the application through its configured repository/hosting workflow. Record deployed commit and accepted manifest hash, and verify the production route displays the accepted period and values.
7. Once the pilot passes its technical and semantic gates, implement the user-requested automation using the proposed cadence for candidate creation. Keep per-dataset scheduling, failures and last-success status observable. A later unattended promotion policy needs separately approved semantic limits and independent review rules; it is not granted by this document.

A truly live layer would need a new source contract: a documented high-frequency measurement or forecast, suitable redistribution terms, geographic definition, latency and uncertainty, and a clear relationship to AI. The existing annual grid factors, published trials and historical detections cannot supply that simply by polling them faster.
