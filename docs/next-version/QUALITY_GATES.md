# Next-version quality gates

Independent reviewer: `quality_challenger`. Prepared 19 October 2026 against repository commit `2bf5f0803f58bd5cba9b1a7b1833ce699318c6c2` and the frozen research pack. This document is an implementation and verification contract, not a product certification.

**The seven product criteria remain unrated.** The 73 accepted research specifications scored 92–98/100 under a separate research rubric. That score does not establish a 9.2/10 application, animation, sound experience or mobile experience. Product acceptance requires at least 92/100 in **each** of the seven categories below, every mandatory gate, and evidence tied to the actual release. A high average cannot compensate for a failed category.

**User-authorized narration update:** the user subsequently requested “Add auto read on opening a text box as default + option to disable.” This overrides the earlier opt-in-only narration assumption: user-opened text panels should read automatically by default, with a prominent persistent opt-out and immediate Stop/Pause. Page load, route restoration, data refresh and returning from a hidden tab must not begin speech. Ambience, action sounds and haptics remain separately default off. The updated behavior still requires browser/device verification.

## Observed baseline

- `npm test` was executed during this review: 22 passed, zero failed. These are code, source-contract and numerical checks, including scene construction and reader state; they are not browser or physical-device tests.
- The application has 146 separate inspiration routes, 14 existing numerical stories, a shared Three.js renderer, individual link copying, static fallbacks and the JUICE device-speech reader. The 73 new accepted research specifications are not 73 implemented worlds.
- Existing `src/scoring.js` and `src/effects.js` apply magnitude scores to the 14 earlier stories. The new accepted designs require native-unit encodings, no atlas-wide impact score and invariant measured marks during decorative loops. A contract-driven rendering adapter must preserve that distinction; do not send new research rows through the legacy score path by default.
- The reader discovers platform voices. It does not guarantee a consistent female narrator across devices. The existing copy-link action does not establish native sharing, stable version-specific sharing or working social previews.
- Current source contains fixed 20 October review text despite the research pack's actual 19 October UTC retrieval date. Replace hard-coded review claims with the relevant version metadata during integration; never advance observation dates because a fetch or deployment occurred.
- No physical phone, browser rendering, hearing/listening evaluation, haptic feedback or participant study was executed by this reviewer. The requirements below are open until their evidence exists.

## Evidence labels and release records

Every check must carry one of these labels. A screenshot or a passing assertion does not silently upgrade its evidence class.

| Label | What it demonstrates | What it cannot demonstrate |
| --- | --- | --- |
| `SOURCE` | Reviewed code, data, definitions, licences, algorithms and design contracts | Rendered output, browser event behavior or user comprehension |
| `AUTOMATED` | Executed unit, integration, build, data-diff or deterministic geometry assertions | Real rendering, physical touch, speaker quality or vibration |
| `BROWSER` | Executed tests in a named real browser engine with screenshots, traces and assertions | A physical phone merely because viewport and user agent are emulated |
| `PHYSICAL` | Named physical hardware, OS/browser versions, settings and observed input/output | Population-wide performance or usability from one device |
| `PARTICIPANT` | Observed tasks with real people under a recorded protocol | A universal preference, causal engagement lift or generalizable success rate from a small sample |
| `FIELD` | Consented/appropriately minimized production measurements, dated population and sample size | A product-wide result when routes, devices or users are absent from the sample |

A browser controlling a genuinely remote physical phone may supply `PHYSICAL` evidence if the provider identifies the hardware and the test verifies the relevant capability. A desktop WebKit run, device simulator or Chrome responsive viewport is still `BROWSER`. A remote phone session without an audible output path or an on-device observer cannot certify sound or vibration.

Store each future evidence record with: release commit and deployed URL; test ID; dataset and design digests; evidence class; operator; timestamp/timezone; device model, OS and browser build; viewport, DPR and display refresh rate; network profile; relevant accessibility/audio settings; exact steps and expected result; actual result; raw trace/video/screenshot or observation artifact; defects and retest links. Keep failed runs alongside the retests. Redact participant identifiers. A route or asset change invalidates the affected evidence, not necessarily the entire suite.

## Staged implementation and exit criteria

| Stage | Work | Exit evidence |
| --- | --- | --- |
| 0. Reproducible foundation | Preserve the current release; pin dependencies; run build, existing tests and strict research validation. Establish release manifest, route state and a shared lifecycle for renderer, sound and narration. | `AUTOMATED`: clean build, tests, all frozen data/design bindings resolve; no runtime rating. |
| 1. Six representative worlds | Implement 408 country coverage, 378 recorder sites/time/effort, 388 interval-only estimates, 117 logarithmic model estimates, 8-6 clinical comparison and 107 policy dossier. Exercise genuinely different forms. | All relevant research gates remain intact; rendered browser inspection and physical smoke tests for each family before wider migration. |
| 2. Accessible controls and sound | Add coherent motion controls, opt-in ambience/UI sounds, optional haptics, narration with transcript and individual sharing. Wire cancellation to route, tab and dialog lifecycle. | Browser state-machine tests plus physical touch, audio and accessibility evidence. Every enhancement works as a silent/static experience. |
| 3. One verified refresh adapter | Start with a documented machine-readable public source. Preserve a previous accepted version; produce a staged candidate, semantic diff and render diff. | Executed success, unchanged, malformed, missing, revised and rollback cases. One real source revision changes the correct displayed values and marks. A fixture alone does not prove an active feed. |
| 4. Roll out accepted cohorts | Implement the remaining 67 accepted research specifications by geometry family; re-audit the 14 legacy stories under their declared contracts. Leave the 59 holds visibly unfinished. | Every released world passes route/data/narrative/representation checks; family stress cases pass the device matrix. No catalogue count implies all worlds are finished. |
| 5. Independent release trial | Run the seven-category review, device matrix, task study and comparison protocol below on the candidate deployment. Fix and retest failures. | Each category ≥92 with cited evidence and no mandatory failure. State which populations/builds were tested. |
| 6. Operate and revalidate | Track actual refresh jobs, failures, resource budgets and meaningful interaction metrics; preserve historical snapshots. | Published operational evidence, change log and rollback procedure. “Live” wording is permitted only for a genuinely operating feed with known latency. |

This sequence supports a Codex engineering handoff: implementation, automated/browser execution and reproducible reports can be assigned to the coding agent. Real hardware observations, listener preference and participant comprehension require the corresponding access or people; an agent cannot replace those by declaring a plan complete. Start from the existing repository and reviewed evidence, rather than rebuilding the catalogue from prompts.

## Seven product criteria

The independent assessor scores ten items per category, each from 0–10. `10` means the stated target is met on the required evidence and matrix; `9` is a documented minor deviation without a blocked task or semantic error; `8` is a documented modest limitation confined to optional polish; `0–7` records an unmet target and its actual severity. An item lacking the required evidence is **unrated**, not a speculative 9.2. Any unrated item keeps the category unrated. A mandatory failure blocks release even if the arithmetic exceeds 92.

All thresholds not explicitly attributed to a standard are project acceptance targets. Agree them before observing results; do not weaken them to manufacture a pass.

| Criterion | Ten scored dimensions | Mandatory evidence and failures |
| --- | --- | --- |
| Coding | Reproducible build; typed/validated contracts; separation of native data and decoration; module boundaries; lifecycle disposal; failure recovery; route/state integrity; meaningful tests; dependency/security hygiene; maintainability | `SOURCE` + `AUTOMATED` + `BROWSER`. Build, provenance, malformed-input, rapid-route/cancellation and context-loss paths pass. No secret in client bundles, unescaped source content, broken core route or uncaught error in release tasks. Tests compare independent expected values/behaviors, not merely implementation details. |
| Animation | Encoding fidelity; visual hierarchy; spatial legibility; camera behavior; picking accuracy; frame pacing; transition continuity; pause/reduced motion; lifecycle suspension; perceptual polish | `BROWSER` + `PHYSICAL`. Measured geometry remains invariant during decorative loops. No unsupported flow, flashing, clipping, hidden denominator or selection drift. Real traces and video cover representative/worst-case worlds at all tested quality levels. |
| User friendliness | First action; task completion; navigation; evidence discovery; keyboard access; assistive technology; settings clarity; recovery; reading/listening control; comprehension | `BROWSER`, `PHYSICAL`, `PARTICIPANT`. Core tasks work without drag, hover, sound or haptics. Visible focus, correct dialogs and equivalent text/table access. Default auto-read on user-opened text panels has a prominent persistent opt-out. No keyboard trap, lost content, speech outside the authorized trigger or task-blocking confusion. |
| Scientific accuracy | Primary fidelity; geography; time; units/denominators; uncertainty; missingness; AI relationship; score/forecast meaning; narrative/audio consistency; update provenance | Frozen research gates plus rendered value/geometry/table/narration/export comparison and update tests. Any fabricated value, false current/live claim, incorrect causal claim, false precision, hidden missingness, unlicensed asset or materially wrong source blocks release. |
| Mobile friendliness | Responsive layout; touch selection; gesture coexistence; readable controls; orientation; performance; memory/thermal behavior; audio interruption; accessibility; graceful degradation | `PHYSICAL` on both mobile OS families and lower-capability hardware. No scroll trap, unreachable dialog, lost pinch/page controls, crash, runaway audio or essential haptic dependency. Emulation alone cannot pass this category. |
| Engagement optimization | Clear promise; initial discovery; meaningful second discovery; original visual identity; curiosity accuracy; understandable sharing; relevant next world; optional sensory appeal; comprehension; measured voluntary continuation | `PARTICIPANT` and later `FIELD`. Predeclared tasks and denominators; report failures and uncertainty. No fabricated scarcity, sound coercion, misleading “backside” promise or time-on-site target that rewards confusion. Aesthetic confidence is not measured engagement. |
| Scalability | Lazy loading; bounded scene; index cost; data-size scaling; cancellation/disposal; cache/versioning; update jobs; observability; rollback; contribution workflow | `AUTOMATED`, `BROWSER`, `PHYSICAL` and executed staging jobs. One active world/audio graph; no per-index-card WebGL context. Test actual largest world and a disclosed growth fixture. Route cycling stabilizes resources; failed refresh preserves last accepted data. No blanket traffic capacity claim without a declared workload and measured deployment. |

Use two independent reviewers for final scoring: an engineering/data reviewer and a visual/accessibility reviewer. Each cites evidence and unresolved issues; disagreement about a hard gate is unresolved until retested. Do not combine the research score, the seven category scores or competitor impressions into a single marketing number without explaining the calculation and scope.

## Browser, device and accessibility matrix

At test time record exact hardware and versions. Select models that are actually available; these classes are a required coverage plan, not a claim they were tested.

| Required physical class | Primary risks |
| --- | --- |
| Recent iPhone running Safari | Touch/pinch, dynamic browser chrome, audio unlock/interruption, VoiceOver, sharing and unsupported-haptics fallback |
| Older supported iPhone with a small display | Memory, text/reflow, modal scrolling, thermal frame pacing and low-power behavior |
| Mid-range Android phone running Chrome | Representative mobile GPU, touch accuracy, TalkBack, native sharing, audio and any available vibration |
| Lower-memory supported Android phone | Resource growth, loading, fallback quality, low power and intermittent network |
| iPad/tablet in portrait and landscape | Resizing, multitasking viewport, touch and optional keyboard use |
| Integrated-GPU laptop | Desktop keyboard/mouse, sustained rendering and reduced-motion behavior; Chrome/Edge and Firefox browser checks |
| macOS Safari desktop/laptop | WebKit desktop behavior, keyboard and VoiceOver; does not replace iPhone Safari evidence |

Run automated browser smoke tests on every released route in Chromium, Firefox and WebKit where the approved environment supports them. Manual rendered review covers **every new world** for scale, labels and distinctness. Physical stress tests cover each distinct rendering/interaction family and its worst case, not only a visually easy homepage. Test 320 CSS-pixel reflow, large text, portrait/landscape, zoom, reduced motion and forced-colors/high-contrast equivalents where supported. Canvas may have a meaningful two-dimensional exception, but controls and evidence text must reflow and remain accessible.

Use WCAG 2.2 AA as the accessibility target, with a **44×44 CSS-pixel project control target**. That is deliberately stronger than WCAG 2.2's 24×24 minimum with exceptions; do not misstate the standard. Small data marks need a larger invisible hit target or a usable list/table alternative without claiming that overlapping targets uniquely identify marks. Provide non-drag rotation/focus controls, text equivalents for graphs, visible focus, sufficient contrast and reliable focus return. Test keyboard-only, VoiceOver on iOS/Safari, TalkBack on Android and one desktop screen reader; automated accessibility scans alone cannot establish conformance.

## Measured rendering and resource targets

For each performance case record three cold and three warm runs, fixed settings and at least two minutes of scripted interaction. Add a 15-minute physical-phone session combining rotation, selection, narration and route changes. Record initial temperature/low-power state when available and any observed throttling. Do not infer battery consumption from frame rate alone.

- Establish usable first content before heavy assets. Track LCP ≤2.5 seconds, INP ≤200 milliseconds and CLS ≤0.1. These are the published Core Web Vitals “good” thresholds; **field** claims require the 75th percentile, segmented by mobile and desktop. A small laboratory run is a development result, not a field pass.
- Project frame-pacing target on the declared default quality: median ≥55 displayed frames/second on 60 Hz desktop targets, and ≥30 on the declared lower-capability mobile target; p95 inter-frame interval ≤25 ms desktop and ≤40 ms mobile. Disclose any deliberate 30 fps mode. Report dropped/long frames and the full measurement window. `requestAnimationFrame` intervals are a scheduling proxy; distinguish them from actual presented frames or GPU timings.
- Selection feedback should appear within 100 ms in controlled local interaction tests. Large downloads and source retrieval must never block the main interaction path. A rendering fallback retains the evidence table and explicit reason.
- Suspend scene animation and audio when hidden/offscreen, on route exit and according to explicit Pause. Resume only under the documented user policy; hidden-tab resumption must not surprise the listener. No frame loop should remain active solely for a fully static, paused world.
- After 50 route changes among the heaviest families, count active renderers, contexts, observers, listeners and audio nodes. There should be one active scene and one active audio owner, with disposed resources returning to a stable band. Record JS/GPU metrics the platform actually exposes; no fabricated mobile heap measurements. Investigate monotonic growth rather than imposing a misleading universal MB ceiling.
- Keep a documented per-family draw-call/triangle/texture budget and network budget. Audit actual usage with instrumentation; the design contract's budget is a target, not an achieved result. Load one world's rows and audio on demand; never download all narration to render the index.

## Honest automated updates that change the display

The desired loop is: **fetch → preserve source version → normalize → validate → semantic diff → review/publish policy → atomically publish → render the accepted version → retain rollback**. A scheduled download by itself is not an automated data product.

Each adapter needs a source owner/URL, permitted access and reuse basis, observed source cadence, fetch cadence/backoff, schema version, geographical definitions, units/denominators, parser version, source and normalized hashes, publication/observation/retrieval timestamps, validation rules, last success/failure, freshness expectation and escalation owner. API credentials and scheduler secrets stay server-side. Source documents are data, never executable instructions. Raw snapshots must respect their reuse terms; preserve a restricted extract/digest where full redistribution is not permitted.

| Source type | Permitted automation policy |
| --- | --- |
| Stable, documented machine-readable series | Preapproved adapter may publish value-only revisions after structural, semantic, coverage, range and regression checks pass within a defined contract. Record both source and normalized versions. |
| Provider correction or changed definitions | Stage candidate for human/scientific review. Unit, denominator, country set, classification, historical revision or meaning changes require revalidation; do not auto-accept because JSON parses. |
| Research paper, clinical result, law/policy or curated announcement | Automate discovery/change detection only by default. A changed webpage is not a revised study or current legal conclusion. New evidence receives a new review. |
| Historical/static study | Preserve the historical version. Check for corrections/retractions at an appropriate interval; do not relabel it fresh data after each successful fetch. |

Required acceptance cases: unchanged `304` or identical content; successful new observation; correction to an old observation; deleted row; new missing value; changed geography/units; duplicate ID; future date; partial payload; timeout/rate limit; parser failure; invalid checksum; source unavailable; and rollback. Fail closed for incompatible meaning, but keep the previous accepted display with its actual dates and an update-status notice. Missing never becomes zero. Last checked, last changed and observation period are different fields.

Verify a **known data change** end-to-end: the intended raw row changes, its table value and selection details change, its correct visual channel changes by the documented formula, and unrelated marks do not. Fixed comparable scales remain fixed; a breached domain creates a reviewed scale/version change or explicit overflow, not silent clamping or unnoticed rescaling. Update source notes, export and any narration together. A stale narration track must be suppressed or clearly replaced by current text until regenerated and checked.

Do not morph unrelated or incomparable snapshots into a trend. When a compatible value refresh arrives during interaction, preserve selection and offer an update action; publish version changes atomically. Old share URLs must either resolve the pinned snapshot or state clearly that a newer edition is being shown. A moving animation never proves that data are live. Use “updated on …” for snapshots; use “live” only if the source, operating pipeline and measured latency support it.

## Audio, narration, haptics and sharing

| Feature | Design and semantic contract | Required physical checks |
| --- | --- | --- |
| Per-world ambience | Opt-in, subtle, original/licensed and distinct by timbre/texture/motif. One active layer, independent volume/mute, restrained transition. Decorative by default; no unlabelled pitch/loudness/rhythm encoding of danger or magnitude. A deliberate data sonification needs an explicit mapping and equivalent visual/text values. | Phone speaker and headphones; audible clicks, loop seams, clipping, fatigue, route transitions, Bluetooth/wired output changes, silent/low-power states where applicable. Listen to each released motif; compare loudness, not just filenames or frequency parameters. |
| UI sounds | A small consistent vocabulary for confirmed actions, never continuous hover/drag chatter. Optional, distinct from narration, and no sole success/error signal. | Rapid taps, denied actions, screen reader active, mute persistence and no duplicate triggers. |
| Haptics | Capability-detected optional enhancement, short action confirmation, throttled, no continuous motor during spin. Visual feedback is always sufficient. Browser vibration support is limited; an API call returning successfully does not prove a felt pulse. | An actual supported handset with observer confirmation; unsupported handset fallback; repeated taps, disabled preference and interruption. Never promise iPhone web haptics without tested support. |
| Calm female narration | Prefer a deliberately selected, licensed narrator asset/voice for a consistent identity; retain the device-speech fallback as a separately named experience. Do not infer voice gender from an API language code. Script, transcript, data digest, pronunciation notes, voice/version and reuse rights are versioned. No voice imitation without authorization. | Automatic start on a user-opened text panel by default; persistent opt-out, explicit Listen after opt-out, pause/resume/stop, panel replacement, interruptions, locking/backgrounding and route cancellation. Review every spoken number, unit, negative sign, range, date, proper name and caveat. Human listening assesses calmness/intelligibility; code cannot certify it. |
| Audio priority | Narration pauses or substantially ducks decorative ambience; screen-reader use never forces a competing stream. Independent controls remain discoverable. Audio context unlock starts from a user gesture; rejected playback gives a recoverable state. | No autoplay on fresh entry, reload, share link or restored tab; no old speech after navigation; no overlapping TTS and prerecorded narration. Lower ambience or stop it if intelligibility is reduced. |
| Individual sharing | Stable canonical world URL plus optional explicit version and allowed view state. Native share where available, clipboard/text fallback otherwise. Escape and validate incoming parameters. A social preview shows the correct title, honest date and representative static rendering. | Share from actual Android/iOS, cancellation, denied clipboard, recipient opening the link without prior session, backward/forward navigation and social crawler preview. No private preferences or identifiers in the URL. |

A provider-generated voice can satisfy the requested vocal character only after the chosen output is heard and approved editorially; delivery of an audio file alone is insufficient. Prerecorded audio needs an equivalent transcript. Dynamic statistical narration must be generated from the accepted display state and verified after each data change. Do not add emotionally alarming sound to a clinical result, an uncertain model estimate or a small selected case series.

Auto-read acceptance cases: first user-opened panel reads once; reopening/replacing a panel cancels the previous queue; closing the panel or leaving the route stops speech; disabled auto-read remains disabled after reopening and reload when storage is available; blocked storage still honors the current-session choice; manual Listen remains available while auto-read is disabled; changing the option never reads an unrelated panel; failed/unsupported speech shows a recoverable silent state without repeated retries; automatic playback does not steal keyboard focus or scroll the reader away from the opened text. No pointer gesture is required from keyboard users. The stop/disable control must be discoverable before a user has to endure a long reading. Do not infer a screen reader's presence; provide control over the competing app narration.

## Expanded visual forms

The sphere can be a geographic map, abstract comparison object or framing device. The choice follows the evidence. Retain unique editorial forms—ribbons, rails, cabinets, paired gauges, lattices, folded panels, bounded intervals, time slices and cutaways—when their quantitative meaning is explicit. Do not force a categorical study onto invented latitudes or inflate a single study into worldwide coverage.

Each newly implemented form must declare its source connection, visual variables and formulas, units/domain, categorical ordering, row filters, geography meaning, uncertainty/missing states, meaningful backside action, keyboard/table equivalent and performance budget. Test zero, minimum/maximum, negative values where valid, interval-only records, overlapping categories, long labels and missing values. A doubled value must affect the declared area/length/angle correctly; a dramatic 3D volume must not accidentally encode a cubic exaggeration. For sparse/local studies, use an honest comparison or source-detail reveal; do not promise undiscovered data on the far side of an otherwise empty Earth.

Decorative animations may vary across worlds while keeping measured marks fixed. Motion, sound and haptics are separate channels with documented meaning and independent controls. Camera rotation must never change the numeric interpretation. A static screenshot should preserve enough legend/date context to remain truthful when shared.

## Participant study and comparison protocol

Before release, run at least two formative rounds of five participants and a final independent sample of at least twelve, including mobile-first readers and participants who use relevant assistive technologies. These are project discovery targets, not statistically representative samples. Avoid only testing designers or people already familiar with the app. Record sample composition, exact counts, task order, time limits and changes between rounds.

The release tasks are: choose a world from the index; discover a meaningful second observation or comparison; explain its unit and date; distinguish an observation from an estimate or context claim; find the principal limitation/source; reach the same value using a keyboard/table route; mute/pause and restart the intended media; share the world and open it in a fresh session. Target at least 90% unassisted completion of each core task in the final sample, zero repeated critical misconception after fixes, and median first meaningful discovery within 30 seconds. Report raw numerators and denominators and uncertainty; do not market twelve participants as a proven population rate.

Use earth.nullschool, NASA Eyes and Global Fishing Watch as documented comparison experiences, not products assigned invented 8.5+/10 scores. Compare common tasks fairly on matched devices—orientation, finding dates/units, inspecting evidence, pausing motion and returning to the starting view. Counterbalance order and report where their task scope differs. AFTERWORLDS may win an editorial-discovery task while another product offers stronger scientific depth; record both. Distinct art direction alone does not prove superiority.

For ongoing engagement measure voluntary second-world exploration, successful evidence inspection, comprehension and useful sharing alongside abandonment/errors. Define event denominators and collection policy before rollout. Avoid collecting narrated text, detailed browsing histories or device fingerprints. Session duration alone rewards confusion; no retention or conversion lift is claimed without an appropriate experiment and adequate data.

## Final release decision

The independent report must identify tested build/digests; released world IDs; excluded/held worlds; device/browser matrix; executed and missing evidence; ten scored items in each category; unresolved defects; source freshness; update operating status; and reviewer identities. All seven categories must independently reach 92 and all hard gates must pass. A foundation preview can ship with honest status, but it cannot be described as the completed professional-standard atlas.

Recheck affected evidence after geometry, source semantics, narration, shared controls or update-policy changes. Minor copy fixes need targeted verification, not performative reruns of every test. Save traceable failures and fixes. The person or agent accepting the handoff must not edit scores merely to meet the requested number.

## Primary references checked for this document

- [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/): accessibility conformance requires a combination of automated and human evaluation; relevant provisions include non-text content, prerecorded audio alternatives, pause/stop, keyboard access, dragging alternatives and target size.
- [Google Web Vitals](https://web.dev/articles/vitals): LCP, INP and CLS thresholds and the 75th-percentile field evaluation requirement. Project GPU/frame targets above are separate.
- [Mozilla Web Audio best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices): user-gesture audio-context activation and user control.
- [Mozilla Vibration API](https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API): limited cross-browser availability and no-op behavior on unsupported devices.
- `research/audits/DESIGN_BENCHMARKS.md` and `research/audits/FINAL_RESEARCH_REVIEW.md`: existing primary-source comparison research, accepted claim boundaries and the distinction between research readiness and product quality.

Reference retrieval date: 19 October 2026. Browser capabilities and source policies must be rechecked at execution time; no compatibility guarantee is inferred from this document.
