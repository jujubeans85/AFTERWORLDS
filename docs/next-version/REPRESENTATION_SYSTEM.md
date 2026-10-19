# AFTERWORLDS: representation and sound system

**Proposal for the next version, 19 October 2026.** This document proposes a representation vocabulary and richer sound recipes around the frozen research pack and the implemented baseline sound service. It changes neither the accepted datasets nor app source. The 73 accepted specifications remain the evidence baseline; the new shells and richer sound recipes have not passed implementation or usability review.

The recommendation is one coherent collection of **data objects**, with the spherical Earth as one member. Use form to explain the relationship in the evidence: a pair, a boundary, a category, a documented connection or a real sequence. Keep the original World Processor ID as each object's identity and keep one object per existing route. Do not distribute ordinary categories randomly across a realistic solar system to create apparent meaning.

## What the current app provides

The inspected app has a useful lifecycle shell in `src/globe.js`: one scene, direct rotation, selection callbacks, reduced-motion detection, visibility handling and disposal. `src/app.js` owns route changes and `mountGlobe`; `src/reader.js` owns the JUICE Reader speech experience. These are integration points, not reasons to rebuild the application framework.

The current `src/effects.js` still takes `scoreFor(dataset, point)/100`, uses this quantity for several visual channels and motion, and repeats global effects over an abstract sphere. Its categorical layout uses synthetic angular positions. The frozen 73-design pack instead specifies source-native scales, exact row selections and decorative motion that preserves measured quantities. **Implement the accepted data adapters before adding new shells. Do not route the new research pack through the legacy score effect function.** A source-native percentage is allowed; a newly invented impact score is not.

`src/soundscape.js` now implements the app-wide `SensoryDirector`, canonical `soundscapeProfile(entry)` and 14 lens-based tonal palettes. `scripts/build.mjs` generates `dist/assets/soundscape-index.json` from that same function. `src/reader.js` supplies an `onPlaybackChange` callback, wired in `src/app.js` to narration ducking. User-opened text panels auto-read by default, with a persistent Auto-read opt-out and manual Listen available. Nothing is narrated on initial page load. Extend these owners; do not add a competing profile generator, second audio context or guessed reader-state polling.

## A reusable representation grammar

An object has five layers with separate responsibilities:

1. **Evidence:** immutable source rows, exact included row IDs, dataset digests, units, dates, qualifiers and definitions.
2. **Encoding:** the reviewed transformation from fields to marks. This owns scale and uncertainty, not the shell or soundtrack.
3. **Shell:** Earth, moon pair, planet, star instrument, cell, organ frame, relational atom, state sphere or constellation. It owns the reading arrangement and can carry a clearly labelled metaphor.
4. **Ambient frame:** a separate non-data group using the accepted gentle-motion recipes. It never changes a value, scale, interval, source date, location or category order.
5. **Audio identity:** a quiet deterministic composition keyed to the source ID. It expresses the object's identity, not a measured property of the subject.

A reader can switch to the table without losing anything from the first two layers. Turning the object exposes a particular comparison, source boundary or observation; it must not be necessary to find essential limitations.

| Family | Useful scientific/structural meaning | Appropriate abstract use now | Boundary |
| --- | --- | --- | --- |
| **Earth / geographic planet** | Locations, source-defined territories or actual approximate recorder coordinates | Keep the five accepted geographic studies geographic | Only documented geography. A country value is not a city or facility. |
| **Moon pair** | Two comparable observations, groups or release snapshots | Equal bodies carry equal scales; a fixed bridge explains the comparison | No mass, gravitational dominance, physical orbit or rate of change. Two unrelated quantities do not become a binary system. |
| **Planet** | Actual named celestial objects when evidence supports them | A self-contained evidence object with rings, panels or a cutaway | Planet 170-3 supplies confirmed discovery cases, not radii, composition, orbit or habitability. Other planets are explicitly abstract. |
| **Star instrument** | A radial arrangement of independent, labelled measures | A corona of source-scale spokes or fixed markers around a neutral core | Light intensity, core temperature and flare speed carry no value. No inference from training FLOP to energy or stellar physics. |
| **Cell / membrane** | Bounded samples, compartments, source-defined subsets or repeated comparable classes | Cutaway membranes expose denominators and separate panels | Not a cell count, cell size, tissue image, biological prevalence or known overlap unless those are supplied. |
| **Organ frame** | A study specifically concerning that organ or related clinical intervention | A restrained, schematic heart or eye outline frames the actual trial comparison | Not patient anatomy, disease location, live physiology or treatment advice. No heartbeat, pumping blood or healthy/diseased tissue simulation from aggregate outcomes. |
| **Relational atom** | A small documented graph or assembly of distinct roles | Equal nodes and fixed edges on an abstract scaffold; an outside ring is a frame | Not a chemical element, electron shell, bond order, quantum trajectory or inferred central controller. |
| **Qubit / state sphere** | A real one-qubit state representation needs compatible quantum-state evidence | None of the 73 datasets qualifies for a literal Bloch sphere. An optional comparison instrument can borrow the spherical frame without quantum labels | Ordinary benchmark percentages cannot become amplitudes, phase, entanglement or probabilities. Hold the literal quantum renderer until a suitable dataset is reviewed. |
| **Universe / constellation** | A catalogue of distinct objects or a source-defined network | Editorial catalogue neighborhoods, or seven documented consortium panels with member lists | Distances are layout unless a reviewed metric supplies them. No galaxy physics, fabricated citation edges, inferred embeddings or complete-universe claim. |

A Bloch vector has specific quantum meaning: IBM describes its axes through the X, Y and Z Pauli expectation values. A sphere showing two ordinary benchmark scores is therefore a comparison diagram, not a qubit measurement. [IBM, Plot quantum states](https://quantum.cloud.ibm.com/docs/en/guides/plot-quantum-states).

The metaphor label is persistent: **Geographic observations**, **Abstract comparison**, **Clinical study frame**, **Celestial discovery cases — sizes not to scale**, or **Editorial catalogue layout**. Do not leave the distinction in an About dialog.

## First mappings to prototype

These are shell adaptations of accepted evidence. They need a focused G10 re-review and runtime review before release. The JSON companion stores the precise accepted dataset references; no new numbers are introduced here.

| ID | Proposed object | Evidence and actual encoding | Meaningful exploration |
| --- | --- | --- | --- |
| **408** | Night-side Earth | Country/economy basic-electricity percentages, fixed 0–100% fill and selected dial | Turn to actual country observations; missing geography stays table-visible. No simulated electrical grid. |
| **378** | Listening Earth | Approximate Norwegian sites; detection, non-detection and two types of unknown coverage | Choose one species and source week; tour recorded sites north to south. The empty far hemisphere is explained, not populated. No birdsong recordings or migration paths. |
| **170-3** | Twin discovery planets | Two equal tokens for Kepler-90i and Kepler-80g with host-star labels | Turn to the other discovery's evidence. The equal sizes are a layout convention. No orbital animation or star map. |
| **5-6** | Survey moons | Two equal 100% reference rings for the 2025 and 2026 global mapped-seabed shares | Separate the release snapshots, then align them on one common scale. The rest of each ring stays visibly unmeasured; no basin is assigned a value. |
| **63** | Unequal-connection moons | Two equal global urban/rural Internet-use rings | Compare the unfilled portions using equal denominators. A decorative outside frame moves; the shares do not. |
| **422-2** | Exposure moons with inner rails | Any-exposure and high-exposure pairs retain the same labelled semicircle scale | Reveal gradients 3–4 as a subset of any exposure. Do not turn the subset into another population or add its share. |
| **430** | Carbon lantern / artificial star | Forty-four annual regional columns; separate CFE text badges | Turn between actual cloud regions; open the distinction between an annual grid factor and procurement matching. There is no time-of-day state. |
| **117** | Compute corona | Fixed markers on the accepted log10 training-FLOP ruler | Rotate to other estimated runs and inspect confidence wording. Core brightness is constant and carries no energy measure. |
| **284** | Applicant star | Ten equal-width source-ranked spines with lengths on the accepted patent-count scale | Reveal lower-ranked applicants and exact counts. No headquarters, ownership or physical stars. |
| **138-8** | Account membrane | Separate complete denominator rings for two overlapping account-activity categories | Open the denominator chamber and inspect overlap caveats. No Venn intersection size can be drawn from two marginal counts. |
| **232** | Representation cell | Six source-curated ancestry-entry shares on independent 100% meridians, with the declared magnifier | Inspect the small categories and who is excluded from the denominator. No ancestry-to-continent map or biological race boundary. |
| **63-8** | Translation membrane | Forty-two anonymous version tiles, divided into four preparation categories | Peel back category labels to the exact source definitions. Tiles are not people, countries or named languages. |
| **115-2** | Nine-compartment specimen | Nine class panels, each with producer/user accuracy on the same 0–100 rails | Turn to a class where the two measures differ; uncertainty stays source text until its meaning is established. No wetland tissue or area map. |
| **8-17** | Heart-study frame | Two mortality rails plus a separate hazard-ratio interval and null=1 | Turn from trial arms to the HR uncertainty and follow-up limitations. The heart outline is static and schematic. |
| **8-6** | Eye-study frame | Equal completion rings plus source confidence intervals and exact denominators | Separate on-site enrollment examination from control referral follow-up. An eye outline represents study subject, not diagnosis or improved vision. |
| **155-17** | Partnership atom | Five equal organisation nodes and exactly three undirected source edges | Turn to the shared partner in two relationships; the edges never carry moving money or data particles. |
| **305** | Three-part assembly atom | Three source-defined engineering roles and a constant-width assembly scaffold | Inspect each role behind the integrator. No atom count, exclusive supplier inference or trade-route overlay. |
| **74** | Comparison state sphere, experimental | The four accepted score markers and fixed crossing ribbons | Turn from MMLU Pro to AIME2026 to see the rank reversal. Label **Classical benchmark comparison**; no Bloch axes, qubit vector or probability terminology. Prefer the existing comparison design if the shell causes confusion. |
| **417** | Consortium constellation | Seven equal first-selection panels; source-listed members appear as equal tokens | Expand one consortium, inspect its membership, collapse it, compare another. Distances and token size carry no compute or geopolitics. |
| **348** | Five-world science observatory | Five equal panels with separate native-unit statements and definitions | Move from individual researcher associations to embedding extent and within-family citation engagement. No invented citation network or 3D embedding. |
| **394** | History planet with policy shell | Eleven annual metered-electricity ribs; separate dated policy hinge | Step through actual 2015–2025 observations, then open the separate 2026 rule. The policy is not another demand value. |
| **56-5** | Share strata | Eleven dated Irish percentage rings plus detached global context | Compare actual national shares; global levels/growth keep their own units and scope. No extrapolation to an AI-only fraction. |
| **390** | Two-era waste planet | Separate 2010/2022 generation and collection panels plus differently scoped context | Align the two actual years; distinguish overlapping quantities. No intermediate years or waste routes appear. |
| **398** | Two field specimens | Four stage/year pairs on the accepted WDI ruler; descriptive SD as text | Reveal the 2023 vegetative-stage exception. Field A and B do not become a randomised treatment experiment. |

## Differences, separations and evolutions

**Difference** is a question with a comparator. Offer `Align comparison` for units and denominators that match; show values side by side when they do not. A calculated difference is allowed only after its formula, common denominator, period and interpretation pass review. Do not turn a comparative ratio into a causal effect.

**Separation** reveals the structure already present in the evidence. A `Separate layers` action can move complete panels apart while preserving their internal scales: population versus share (78-4), paid hours versus all working time (320), lifecycle versus marginal response (30-8), unlike fiscal accounts (369), or planned versus observed facts (385). No tween crosses from one value into another. In reduced-motion mode, the final layout appears immediately. `Rejoin` restores the same reading order and selection.

**Evolution** has four distinct modes. A route declares exactly one, rather than presenting Past / Present / Future everywhere.

| Mode | Accepted examples | Permitted behavior |
| --- | --- | --- |
| Observed sequence | **394**, **56-5**: 2015–2025 Irish annual records | Explicit year steps and a table of every observation. A line between points is labelled a visual connection, not interpolated data. No synthetic 2026 value. |
| Sparse observations | **5-6**: two mapped-coverage releases; **390**: 2010/2022; **214**: 2024/2025 production | Two dated states or side-by-side panels. No continuous growth animation across the gap. Shipments remain a separate account. |
| Source-indexed study sequence | **378**: actual source weeks; **398**: two years × two growth stages | Step through recorded categories and preserve unknowns. Source week is not automatically an ISO date. Growth stage is not a regular time interval. |
| Dated statements / plans | **415**, **356**, **314**, **368** | Chronological evidence cards with status badges. A later publication does not establish operational completion. |

All other accepted objects default to **comparison, no evolution**. The present data pack supplies no automatic future mode. Decorative stellar motion, membrane drift and orbit-like framing always have their own `ambientTime`, never the data `observationPeriod`.

## Sound: one identity per source world

The implemented baseline has **146 canonical source-keyed profiles across 14 lens palettes**, rendered as three quiet sine voices through a low-pass filter. The six families below are **future synthesis recipes**, not replacements for that identity or tuning system. `soundscape-registry.proposed.json` maps each implemented `id` and `worldId` to one proposed richer recipe. It deliberately contains no copied frequency, cutoff, seed or competing parameter tuple. Unique metadata does not prove perceptual distinctness; the richer recipes still require listening tests.

| Synth family | Character and reusable recipe | Suggested objects | Forbidden interpretation |
| --- | --- | --- | --- |
| `glass-air` | Two or three quiet sine partials, soft attack, infrequent upper note | Discovery planets, languages, abstract space | Not measured radiation, astronomical sound or a model's actual signal. |
| `warm-orbit` | Three soft additive tones, slow timbral shift, no beat grid | Moon comparisons, global shares, capital | Not orbital period, rising wealth, adoption speed or a performance ranking. |
| `woven-circuit` | Muted sine/triangle layers with slow staggered envelopes | Infrastructure, supply roles, abstract atoms | Not power consumption, traffic, clock speed or machine telemetry. |
| `hollow-tide` | Very low-level band-limited procedural noise beneath a steady tone | Water, ocean, coverage and missingness | Not recorded ocean, local weather, river flow or the amount of missing data. |
| `soft-chamber` | Two rounded low-mid tones with long envelopes, little stereo width | Trial and specimen frames | No heartbeat, breathing, medical alarm, animal call or physiological rate. |
| `distant-lattice` | Sparse mellow partial clusters with long quiet gaps | Governance, consortia, trust and editorial observatories | No warning severity, confidence or truth score. |

Every family is original procedural synthesis. Avoid voices and borrowed field recordings. For a bird study, the ambient bed is explicitly synthetic; a real species recording would need a separate licensed, identified and optional educational feature.

### Canonical identity and future recipe assignment

The canonical identity is **`aw:world:<worldId>:sound:v1`**, for example `aw:world:422-2:sound:v1`. The authority is `soundscapeProfile(entry)` in `src/soundscape.js`; the build-generated index is its distribution artifact. The proposed registry's `id` and `worldId` must exactly match that index. Use the full source ID as a string, including suffixes. Titles, route order and shared source-page URLs are not identity keys.

The canonical module owns its deterministic seed and the lens-based frequency/cutoff tuple. The proposal does not recalculate them. A richer recipe receives the canonical profile and an independently versioned `recipeId`; it may change the synthesis arrangement only under its reviewed recipe contract. Keep canonical v1 tuning unchanged. If the owner intentionally changes that identity or tuning contract, increment `SOUNDSCAPE_VERSION` and perform a declared migration rather than overriding values in this document.

The 14 baseline tonal palettes follow the current editorial lenses. Six future recipes group those palettes into a smaller implementation vocabulary, with explicit per-world recipe overrides where a representation warrants one. The default mapping is energy/chips/mobility → `woven-circuit`; water/oceans → `hollow-tide`; work/capital/access → `warm-orbit`; models/language/science → `glass-air`; trust/borders → `distant-lattice`; biosphere → `soft-chamber`. A recipe assignment does not change its world's canonical palette or root tuning.

Future envelope, phrase and stereo decisions should derive from the canonical `seed` or explicit recipe defaults and must be versioned in that renderer. This proposal intentionally leaves those new per-world numbers unassigned until the recipes are auditioned. **No numeric observation, risk, missingness, mortality, country or source date controls pitch, loudness, density or tempo.** This is ambience, not data sonification. A future sonification mode would need a separate disclosed scale and accessibility review.

### Implemented baseline versus proposed improvements

| Concern | Implemented baseline inspected | Proposed richer version |
| --- | --- | --- |
| Identity and palette | Canonical source ID, deterministic tuple, 14 lens palettes | Reuse the profile unchanged; assign one of six versioned recipes. |
| Start and controls | Ambience, action sounds and haptics start off; global `SOUND` / `SOUND · ON` opens accessible settings, with separate opt-ins and `TURN EFFECTS OFF` | Add volume, mono and steady sound; preserve the existing global state indicator. |
| Narration | User-opened text panels auto-read by default with persistent opt-out; initial page load does not narrate. Reader controls remain separate. The callback ducks ambience to 18% while starting/playing; paused reading restores normal ambience | Offer quiet reading that mutes ambience through reading pauses until close/finish; retain the user-requested Auto-read default and opt-out. |
| Visibility | Hidden state stops voices and suspends; returning can resume previously enabled audio | Keep behavior clearly disclosed; an optional remain-paused preference can require a fresh action. |
| Route changes | Stops/disconnects old voices; the home catalogue has no world profile | Consider a bounded ramp/crossfade after real-device click/seam testing. |
| Sound texture | Three sine voices and one low-pass filter | Add timbre/envelope variety and test what listeners can distinguish; do not claim metadata variation is audible. |

### Target playback and accessibility contract

The following are next-version requirements, not a claim that every control already exists. The baseline/proposal table above records the current implementation.

- Ambience, action sounds and haptics start off and do not start from hover, scroll, page entry or decorative animation. The global `SOUND` settings provide explicit enable actions. Persist future volume and recipe preferences, but require an effects enable action in a new session. Narration follows its separate user-requested default: automatically read user-opened text panels, with persistent Auto-read opt-out and manual Listen available; never narrate on initial page load.
- One audio service owns one `AudioContext` for the app. Lazily create/resume it from the user's sound action. Handle suspended/interrupted playback visibly; never start a retry loop or treat failure as a broken page.
- Each scene uses at most six oscillator voices, one optional shared procedural-noise buffer and 24 connected audio nodes. The noise-buffer budget is 2 MB. A transition can briefly have two bounded voicesets, then must stop/disconnect the old one. These are targets to verify on named phones.
- Ramp gain over 100–250 ms for ordinary mute/duck changes to avoid clicks; use a 1.2 second maximum scene crossfade when sound is already explicitly enabled. Ambient effects remain silent in a new session until explicitly enabled. Returning from a hidden tab follows the disclosed resume preference; the current baseline resumes previously enabled sound. `TURN EFFECTS OFF` immediately updates the UI and stops ambient/action/touch effects; a future click-free release may ramp audio to zero within 50 ms. This control does not stop narration: Reader Stop and the Auto-read preference remain separate.
- Default volume is low. Target the rendered default mix at approximately −36 to −30 dBFS RMS and peaks at or below −18 dBFS, then audition on phone speakers and headphones. These are digital mix targets, not a promise about acoustic sound pressure at a listener's ears. Do not use an aggressive sub-bass channel or sharp high-frequency transients to distinguish objects.
- Atmosphere controls and Reader controls are separate. User-opened text panels auto-read by default unless the persistent preference is disabled; manual Listen remains available. The baseline ducks during speech. For the proposed quiet-reading preference, ramp ambience to zero from reader start through reading pauses; restore only after finish/close when visible and still enabled. A manual mute always wins. Extend the existing reader callback with explicit states where needed; do not poll the speech engine.
- Hide, route disposal or `pagehide` stops scheduling and fades/suspends the ambient graph. The catalogue and static thumbnail grid have no ambient world sound; a text panel explicitly opened there may auto-read under the same Reader preference. Prevent a failed old async route from starting sound after the reader has navigated away.
- Provide effects-off, volume, mono and `Steady sound` controls alongside the separate Reader Stop and Auto-read preference. Steady sound removes pan and repeating filter/envelope variation. Reduced motion freezes visuals; do not assume it is an audio preference, but expose the matching steady-sound option. Do not make information depend on hearing, stereo separation, visual motion or colour.
- A concise description such as `Soft synthetic tones; no data is encoded in the sound` appears beside the control. The complete text/table remains available with audio disabled. Audio phase changes never generate live-region announcements.

The proposed implementation uses the standard Web Audio graph and scheduling model, including oscillator/gain/filter nodes and context suspend/resume. See the [W3C Web Audio Recommendation](https://www.w3.org/TR/webaudio-1.0/). This is an implementation direction; browser/device behavior still needs tests.

## Codex implementation architecture

Keep the existing static vanilla-JavaScript deployment. Add modules behind the current route shell and migrate one evidence route at a time.

| Proposed module | Responsibility | Hard boundary |
| --- | --- | --- |
| `evidence/adapter.js` | Verify manifest status/digests, select exact rows, expose native-unit fields and missingness | Cannot invent a score or silently include unreviewed rows. |
| `representations/registry.js` | Resolve full source ID to accepted design + separately versioned shell proposal | No fallback from unknown evidence to a plausible numeric sculpture. |
| `scene/controller.js` | Own the renderer, camera, selection, pause, visibility and resource cleanup | One live renderer; scene construction cannot own app routing or audio contexts. |
| `representations/primitives.js` | Reuse fixed-scale rails, rings, markers, tiles, facets, exact graph edges and map marks | Data transforms are explicit typed functions; never parse prose formulas. |
| `representations/shells/*.js` | Assemble family-specific reading frames around those primitives | A shell cannot change units, values, selection, source grain or review status. |
| `motion/controller.js` | Run the accepted bounded ambient recipe on a dedicated group | No changes to `dataGroup`; no automatic time sweep. |
| Existing `src/soundscape.js` / a later extracted `audio/scene-audio.js` | Extend `SensoryDirector` for volume, richer recipes, lifecycle and reader priority | Preserve canonical `soundscapeProfile`; no second context or profile generator. |
| Proposed `audio/families.js` | Six procedural recipes accepting the canonical profile | Bound voices and smooth envelopes; no independent frequency table, seed or network assets. |
| `ui/object-controls.js` | Compare, separate, source-date steps, table, sound and reading controls | Each control exists only when that route has a defined evidence operation. |

Proposed scene contract:

```ts
type RepresentationInstance = {
  root: THREE.Group;
  dataGroup: THREE.Group;
  ambientGroup: THREE.Group;
  select(rowId: string | null): void;
  setView(view: "combined" | "separated" | "table"): void;
  setObservationKey(key: string): void; // only declared source keys
  updateAmbient(seconds: number): void;
  getTableRows(): readonly SourceRow[];
  dispose(): void;
};
```

The table receives the same adapter selection as the marks. `selection`, `view` and `observationKey` are explicit state; hover and camera pose do not mutate data. Shell adaptations should reuse the accepted formula/primitive first. If a metaphor needs a new measured geometry, submit that change as a new design revision with a new review, rather than silently replacing the frozen contract.

Use a route generation token for both lazy scene and audio work. A stale generation disposes its pending resources instead of becoming audible or visible. The audio service listens to `scene-enter`, `scene-exit`, `reader-state`, `visibility` and explicit user audio actions. Visual Pause and Sound Off remain separate; add a clearly named `Quiet mode` convenience action that disables ambient motion and sound together without altering direct manipulation or reading.

For a constellation homepage, use static thumbnails/HTML by default. An optional one-canvas catalogue has at most 24 visible object proxies at once, an equivalent list, keyboard navigation and a persistent explanation that arrangement is editorial. Do not allocate one WebGL context or audio graph per card.

## Delivery sequence and acceptance

1. **Foundation:** implement the digest-aware adapter and a scene factory; port one accepted simple comparison without changing its data meaning. Verify exact row/table parity and source units before extending the sound renderer.
2. **Three contrasting pilots:** 5-6 (survey moons), 155-17 (partnership atom) and 8-17 (heart-study frame). Together they test a numeric comparison, a categorical graph and uncertainty with a clinical framing. Add 378 as the geographic/missingness stress case.
3. **Sound extension:** extend the existing service with the six proposed recipes, resolve all 146 profiles from the canonical module/index, then audition every released motif and compare a representative sample for distinctness. Unique IDs and tuning tuples do not prove recognisably different sound.
4. **Semantics review:** confirm users can say what is measured, what is decorative, why the object is this shape, what is absent and what changes when a control is used. Explicitly ask whether they inferred real orbital motion, heartbeat, quantum behavior or causal change. Confusion blocks that metaphor.
5. **Runtime release:** verify touch, keyboard, screen-reader table parity, reduced motion, mono/quiet mode, reader priority, Safari/iOS and Android playback interruption, no effects before enable and no narration before a user opens a text panel or selects Listen, persistent Auto-read opt-out, route races, one-context cleanup, offscreen stopping and measured phone performance. Capture evidence; do not convert a specification score into a 9.2/10 product claim.

The frozen research files and their hashes remain untouched by this proposal. Source provenance for each shortlist item is its accepted `designId` and dataset binding in `research/designs/design-registry.json`; new review is required for altered encodings. The representation shortlist and richer-recipe assignments are draft implementation inputs. The canonical sound service already exists in source; this document does not certify deployment or audible/device quality.
