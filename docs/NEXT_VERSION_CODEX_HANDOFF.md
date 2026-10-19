# AFTERWORLDS implementation handoff

Prepared 20 October 2026, Australia/Sydney (19 October UTC). Continue the implementation in a Codex development environment with a permitted browser harness and access to physical test devices. This handoff contains working foundation code, an audition and exact research/design contracts. It does not mark the next version as complete.

## Goal and latest decisions

Build an intriguing, quiet, dark atlas: an indexed home page, one independently shareable world per page, and direct manipulation revealing further evidence. Preserve the World Processor source ID as identity. Use the 73 accepted research concepts to expand the existing 14 sourced stories; retain the 59 held concepts with their honest labels. Do not replace all objects with one decorative stock globe.

Add source-appropriate updates that change accepted visual values; a subtle unique sound identity for each world; optional action sounds and hardware-dependent haptics; natural-sounding feminine story narration; and selective alternative forms such as paired moons, cells and constellations. Scientific truth and legibility take precedence over spectacle. All seven requested product categories must eventually clear 9.2/10 independently, with evidence.

**Latest explicit user instruction:** opening a text panel should read it aloud by default, with an option to disable. This supersedes earlier manual-only narration assumptions. Keep speech off on initial page load, passive refresh and tab restoration. Ambience, action sounds and haptics remain separately off until selected. Auto-read preference is persistent; sensory playback choices apply to the visit.

## Repository and deployment facts

| Item | Value |
| --- | --- |
| Authoritative repository | `https://github.com/jujubeans85/AFTERWORLDS` |
| Working branch | `next-version-foundation` |
| Parent GitHub main commit | `2bf5f0803f58bd5cba9b1a7b1833ce699318c6c2` |
| Existing live site | `https://afterworld-ai-atlas.xntfsstt5z.chatgpt.site` |
| Sites project | `appgprj_6ad67b0da294819193fd1987db291d6f` |
| App source preserved from Sites | `c1d3de4daa010a4a05e5a95a93c04390ddad4805` |
| Research inventory source | `95f6f75765e4657418382301cc0d88a816cdf153` |
| Runtime | Browser ES modules, vendored Three.js 0.180.0, static Node build; no application framework migration required |
| Build output | `dist/`, regenerated, excluded from Git |
| Verification runtime | Node 22 in GitHub Actions; package supports Node ≥20 |

The older `6hbb45xbtr-tech` repository URL is superseded. Use the linked GitHub connection; do not recreate the repository or repeat the previous passkey troubleshooting. Inspect upstream changes before pushing. No credentials, generation tokens or temporary signed media URLs belong in the repo.

The branch is a draft foundation. It is **not deployed to the existing live site**. In this session the Sites skill did not permit starting a preview or improvising browser QA without its browser-control skill, which was unavailable. Physical devices were also unavailable. Those limitations are explicit release blockers, not failed device-test results.

## What is implemented here

| Capability | Implemented foundation | Remaining work |
| --- | --- | --- |
| Single-world sharing | Prominent Share World button; native share; cancellation handling; clipboard fallback; selectable URL fallback; stale async response guard | Verify on target apps/devices; image preview cards; accepted-version/selection sharing |
| World sound identity | `aw:world:<sourceId>:sound:v1`; 146 generated profiles, 14 tonal palettes; one lazy AudioContext | Audition distinctiveness, richer recipes, volume/mono controls, transitions and actual speaker tests |
| Ambience and actions | Quiet procedural sine layers; optional short UI tones; global settings and effects-off control | Production sound design and listening assessment |
| Haptics | Independent opt-in, capability check, short throttled pulses, cancellation | Felt output on supported physical devices; absence of support is a normal fallback |
| Reader interaction | Background ducking; auto-read on user-opened text panels; persistent opt-out; panel replacement stops old speech; focus preserved | Browser autoplay/voice behavior, screen-reader interaction, phone calls and hardware audio route testing |
| Consistent narrator | A 34.6-second synthetic feminine audition, dry and subtle room mixes, transcript/provenance | Final listening/editorial acceptance; versioned per-world story assets and playback integration |
| Data refresh | All 73 dataset policies plus a manual candidate-only WDI electricity-access importer | Real-source reconciliation, approval/promotion service, accepted-manifest consumer, scheduling and render updates |
| Alternative forms | 24 exact accepted-concept mappings, semantic boundaries and future sound recipes | Implement and test selected forms after the native-unit data adapter |

The 73 research concepts have **not** been connected to the live renderer by this foundation. Existing output still has 146 routes, 14 earlier sourced stories and 132 concept routes. Research acceptance does not automatically change a page's runtime status.

## Read these contracts first

1. `research/README.md`, `research/IMPLEMENTATION.md`, `research/manifest.json` and `research/audits/FINAL_RESEARCH_REVIEW.md`.
2. `research/designs/shared-contract.json` and `research/designs/design-registry.json`. Bind each accepted design to the exact listed dataset digest and included row IDs.
3. `docs/next-version/DATA_UPDATES.md` and `update-policy.json`: all 73 cadences, source contracts, reuse constraints and candidate rules.
4. `docs/next-version/REPRESENTATION_SYSTEM.md`, `representation-shortlist.proposed.json`, `soundscape-registry.proposed.json` and `UI_SOUND_COHERENCE.md`.
5. `docs/next-version/QUALITY_GATES.md` and `FOUNDATION_REVIEW.md`. Their evidence classes and release matrix apply to all claims of completion.

The frozen research contains 2,486 normalized observations, including 817 explicitly missing rows and two interval-only rows. A separate wine raw file has 6,497 observations. Do not confuse these counts or treat missing rows as zeros. The accepted set is 59 reframes, 11 contextual views and three direct AI-related views. Do not turn all 73 into causal AI-impact claims.

## Single sources of truth

| Responsibility | Owner |
| --- | --- |
| Stable source identity / slug / route | `data/source-catalog.json`, current build registry |
| Frozen research facts and verdicts | `research/datasets/`, audit and manifest files |
| Accepted visual specification | `research/designs/design-registry.json` |
| Source update policy | `docs/next-version/update-policy.json`, until promoted into a reviewed runtime policy module |
| Audio profile identity and current tuning | `src/soundscape.js`; build generates `dist/assets/soundscape-index.json` |
| Proposed richer audio recipe assignment | `docs/next-version/soundscape-registry.proposed.json`; references canonical profile IDs, does not redefine tuning |
| Reading text | Rendered text through `readingText` in `src/reader.js` |
| Narrator assets | Versioned transcript/audio manifest; audition in `assets/audio/narration/` |

Do not maintain hand-edited copies of generated registries. Do not create a second audio context per globe. New data adapters and releases belong outside `research/`, with immutable digests and a small accepted-release pointer.

## Implementation sequence

### 1. Establish a browser-tested foundation

Run the commands below, open the branch through a permitted browser workflow, and test the source changes on desktop plus a real phone. Prioritize auto-read opt-out, global sound muting, audio cleanup, modal focus, keyboard operation, narrow-screen header wrapping, share cancellation and manual URL fallback. Automated tests cover logic; they cannot establish layout, naturalness, hardware vibration or frame pacing.

### 2. Build the native-unit research renderer

Create a separate adapter for accepted research: source rows → exact design bindings → declared scale → measured marks. **Do not pipe these rows through `scoreFor()` or the old effect system's 1–100 magnitude scoring.** Maintain separate scene groups for measured marks and ambient frames. Decorative motion must not change measured length, area, position, interval endpoints, colours or dates.

Implement one vertical slice end to end before scaling. Good first candidates are concept `430`, The Grid Behind the Cloud, and the electricity-access concept associated with `society-electricity-access`. For `430`, use the exact 44 row IDs, `g CO2eq/kWh`, fixed [0,700] scale, declared length formula and separate CFE badges. Its accepted layout uses abstract region slots; do not infer facility coordinates from nulls. Resolve stable concept IDs through the manifest for every other dataset.

Support missing, interval-only, threshold, estimate, forecast, mixed-period and non-geographic cases explicitly. Every mark needs a table equivalent. Preserve the page's source links, limitation text, units, dates and comparison denominator. Lazy-load the active world's data and geometry. Add a load/dispose contract and test the heaviest supported primitive before expanding the queue.

Implement the remaining accepted specifications using shared primitive families. Retain exact per-world interaction goals and distinct visual logic. Keep the 59 holds in the concept index until their missing evidence gates are separately met.

### 3. Make source updates change accepted renders

The supplied WDI importer is a pilot that creates review candidates for the frozen 2024 electricity indicator. Run it with `node scripts/refresh-wdi.mjs`; its exact CLI and tests are documented in `docs/next-version/DATA_UPDATES.md`. The handoff live check succeeded with 217 economies, two nulls and no semantic change, so it created no release. Recheck when implementing the production pipeline; preserve its failure if the current network/source is unavailable. Do not bypass an access or schema failure.

Implement immutable candidate and accepted snapshots, semantic diffs, hash-bound design validation, independent review records and atomic manifest promotion/rollback. The browser fetches only the application's accepted manifest. It never directly polls every upstream provider and never renders quarantined candidates.

After a reviewed cadence is operational, check the small accepted manifest on page focus and an appropriate visibility-aware interval; use conditional requests, a deduplicated request and a bounded timeout. Load changed snapshots by content hash. Show “Updated data available” and preserve selection/camera when applying. A short transition may interpolate from old to new accepted marks; endpoints must be exact, reduced motion must apply immediately, and intermediate frames must not be presented as observed measurements.

Display observation period, source release, last check and accepted revision distinctly. A same-year revision is not a trend. No change means no new release or fabricated animation. Retain the last accepted version on errors; label update status honestly. Historical studies should remain historical snapshots. None of the current 73 sources supports a blanket real-time badge.

After the pilot's tests and semantic review pass, configure candidate schedules using the existing policy. The user requested appropriate automation; a new permission loop is not needed for routine implementation. Activation waits for technical readiness, not an invented approval step. Unattended production promotion requires a rigorously bounded, reviewed acceptance policy; do not replace scientific review with a green parser test.

### 4. Finish audio and narration

Preserve the canonical audio IDs. The baseline produces three restrained tones per world; exact parameter uniqueness is not proof that listeners distinguish all worlds. The creative agent proposes six reusable richer families. Implement selected recipes with seeded parameters, bounded voice counts, no per-frame allocations and explicit cleanup. Test headphones, mono and phone speakers. Avoid scientific claims about sounds: these are editorial atmospheres, not recorded planets, measured climate noise or quantum signals.

Expose ambience, action sounds, voice and haptics as independent choices. Add useful volume controls without crowding the globe. Keep a globally accessible effects-off control. Smooth route transitions without overlapping many world soundscapes or losing immediate mute behavior. No haptic or sound cue should run on every drag frame. Physical vibration support varies; never simulate a “passed haptic test” from a true API return alone.

Plugin discovery found the connected Runway account suitable for consistent narration. The provided audition uses Miriam, with a calm feminine delivery and slower pace. It is **synthetic**, not a recording of a human narrator. Eight credits were used for the single audition; do not regenerate it or buy 146 loops as a first step. The generic AI Voice Generator offers style labels but did not expose the same explicit narrator direction in the inspected tool. JUICE Reader remains the low-cost accessible fallback, with device-dependent voice quality.

Audition assets: `assets/audio/narration/audition-miriam-dry.mp3`, `audition-miriam-room.mp3`, `audition-transcript.txt` and `audition-manifest.json`. The room mix uses quiet early reflections; both files are retained for a listening comparison. Technical loudness was measured, but naturalness and phone-speaker clarity are **not listener-approved**. The sample's “annual grid emissions” should be tightened to “annual grid emission factors” in final narration; the production story must also explain abstract region slots. The audition is not copied into the live build or used as every world's story.

For final narration, write a short factual story per accepted world: intriguing question → observation and unit → meaningful interaction → boundary/uncertainty. Bind transcript, citations, dataset hash, design version, voice and audio hashes together. Show the transcript and preserve manual reading. If values or scope change, invalidate the affected audio until regenerated/reviewed; fall back to current displayed text. Avoid reciting changing numbers from stale audio.

Use one voice-priority owner so recorded stories, auto-read panels and manual Listen cannot overlap. User-opened text panels default to auto-read; the visible persistent switch must stop current speech immediately when disabled. After opt-out, manual Listen must still work. Storage failures must not block the switch for the current visit. Browser speech restrictions require a clear manual retry, never an automatic loop.

### 5. Complete sharing

Existing native sharing supplies the single world URL and title. Keep calling it directly from a user gesture. Cancellation is silent; unsupported or denied APIs fall back to clipboard then a selectable address. Do not assert that a share-sheet resolution proves the recipient received anything.

Add a canonical public origin configuration and build per-world absolute canonical/OG URLs plus PNG or JPEG preview cards. Current generated HTML has per-route title and description but no completed image-preview system. Do not rely on client-only metadata or SVG support in messaging apps. Preserve old slugs with redirects if titles evolve.

For reproducible scientific shares, add an accepted snapshot ID and optional stable selection to a validated URL contract; unknown/unavailable versions should explain the fallback rather than silently showing different evidence. Share neither local sound preferences nor private user state. Test native sheets and previews in actual messaging targets, copied URLs, direct navigation, reload and back/forward.

### 6. Introduce alternative forms selectively

Use the creative agent's 24 exact accepted mappings. Moon pairs support comparable pairs; cells expose bounded samples/denominators; organ frames contextualize the relevant clinical study; relational atoms show documented roles/links; constellations organize distinct catalogue items. Keep the metaphor label and source-scale marks visible.

There is no accepted literal qubit dataset. A Bloch-sphere renderer stays blocked until compatible quantum-state evidence exists. Ordinary percentages cannot become amplitudes, entanglement or phase. Star brightness and planetary orbits likewise need real corresponding measures or an explicit nonquantitative decorative role. Alternative shells must earn their place through comprehension and interaction tests.

## Commands and verification

```bash
git fetch origin
git switch next-version-foundation
npm run build
npm test
npm run research:validate
npm run research:build
git diff --exit-code -- research/manifest.json research/CONCEPT_RESULTS.md
```

At handoff, the full suite passes **42 tests**: 30 app/foundation tests plus 12 WDI importer tests. Build and frozen research validation pass; regenerated research manifests are unchanged. `FOUNDATION_REVIEW.md` records the independent reviewer’s narrower 30-test app/foundation scope and exact file digests. `tests/reader-autoread.test.mjs` uses a minimal DOM port to exercise the real reader factory; it is not a browser or accessibility test. Audio tests use Web Audio fakes; they do not prove sound quality. WDI tests use controlled fixtures and cannot prove current upstream availability.

For deployment, use the configured Sites project or a documented replacement chosen within the existing task. The static routes assume an origin-root deployment; do not blindly publish to a GitHub project subpath. Keep preview and production origins explicit. Inspect the existing site and synchronization state before replacing its source. Recheck deployment hash and a direct globe URL after publishing.

## Device testing and scoring

Follow `docs/next-version/QUALITY_GATES.md`. At minimum cover a real iPhone/Safari, iPad/Safari, desktop Safari and Chrome, Android Chrome including a lower-resource device, keyboard-only navigation, screen-reader use, reduced motion, offline/intermittent networking, hidden-tab lifecycle, low-power state and repeated world changes. Capture OS/browser versions, viewport, DPR, build hash, traces and observed results. Do not describe emulation as physical testing.

Compare common tasks with earth.nullschool, NASA Eyes and Global Fishing Watch using matched devices and documented tasks. Their established quality is a benchmark, not evidence for invented competitor scores. Obtain independent engineering/data and visual/accessibility assessments. Each of coding, animation, user friendliness, scientific accuracy, mobile friendliness, engagement and scalability needs evidence for its own ≥9.2 gate. An unrated gate stays unrated.

Engagement means users can discover a second meaningful view, understand a limit and choose to explore/share another world. It does not mean aggressive autoplay, fabricated urgency or hiding essential information. Use observed task outcomes and an optional privacy-respecting study; do not infer success from animation or a share button existing.

## Agent continuation and completion criteria

The user explicitly requested continuing agents. Retain these roles even if new sessions require new agent instances:

- **Evidence editor:** source truth, candidate semantic diffs, null/uncertainty preservation, licences and update acceptance.
- **Creative representation designer:** exact dataset-to-form mapping, meaningful backside discovery, sound identity and visual coherence.
- **Independent quality challenger:** challenge code and claims, run verification, compare benchmark tasks and refuse unearned scores.

Check with agents before claiming each milestone. Their advice is not a substitute for executed tests. Save any blocking finding with a reproducer and owner; fix it before moving the affected capability to production.

Finish by providing the deployment URL, branch/PR and commit, exact implemented count, accepted data revision, device matrix, seven evidence-backed scores or explicitly unrated categories, remaining holds, and a tested rollback. Do not stop at another architecture proposal when the execution environment supports the work. If hardware or access remains unavailable, finish everything else and identify the precise remaining gate.
