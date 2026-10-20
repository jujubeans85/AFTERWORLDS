# UI and sound profile coherence review

Source inspection and deterministic checks, 19 October 2026. This is not an audible audition, browser layout review or product rating. No app or frozen research files were changed.

## Recommendation

Keep the implemented canonical sound system and the dark editorial visual system. Add richer timbre gradually through a separate recipe layer; retain the full source ID, canonical profile generator and generated index as the only identity/tuning authority. The six future recipes describe synthesis arrangements, while the 14 existing palettes describe editorial subject identity. They serve different roles and need not compete.

`src/soundscape.js:soundscapeProfile` is authoritative. `dist/assets/soundscape-index.json` is generated from it. The proposal registry contains exact matching `id` and `worldId`, references that authority and assigns a future recipe. It stores no competing frequencies, cutoff values, seeds or per-world parameter tuple.

## What is coherent in the inspected implementation

- The app uses one `SensoryDirector`, with ambience, action sounds and haptics independently disabled at startup. `TURN EFFECTS OFF` stops ambience, action sounds and haptics; narration has separate Reader controls. Opening a text panel reads it aloud by default, with a persistent Auto-read opt-out and manual Listen available. Nothing is narrated on initial page load; all information remains available as text.
- Route changes call `setWorld`; the catalogue has no active world profile. Visibility handling stops current voices and suspends the context. The reader callback substantially ducks ambience during speech. These are appropriate shared lifecycle responsibilities.
- The 14 palette names complement the visual lens vocabulary: Power / power hum, Water / water glass, Intelligence / computational chamber, Life / organic chamber, and so on. They are editorial mood categories, not measurement scales.
- Pastel accents on the neutral `#080d10` background preserve the app's quiet dark-mode character. Calculated contrast for the 14 raw accent/background pairs ranges from **8.80:1 to 15.98:1**. This calculation does not certify rendered gradients, alpha blending, every component or non-colour accessibility.
- The sound dialog uses distinct textual On/Off states as well as accent borders, has 48px minimum button heights in CSS and disables unavailable features. The global header exposes `SOUND` on every page, changes to `SOUND · ON` when effects are enabled, and supplies an accessible state label and settings dialog trigger. These are useful source-level choices; real touch/layout behavior still needs verification.
- Full source IDs distinguish entries such as `422-2` and `422`; names, sort order and shared historical page URLs do not supply identity.

## Focused follow-ups

| Priority | Finding | Recommendation |
| --- | --- | --- |
| Before calling sound quality complete | All 146 rendered tuning tuples are distinct, but all currently use the same three-sine/low-pass construction. | Describe this as distinct deterministic tonal profiles, not 146 proven recognisable soundscapes. Audition every released motif; use the six future recipes to add perceptible timbre/envelope variety. |
| Preserve global access | The header now shows `SOUND` / `SOUND · ON` with an accessible state label on every page. The dialog exposes independent toggles and `TURN EFFECTS OFF`. | Verify keyboard, touch and screen-reader access across the home catalogue, world pages and unknown routes. Preserve the separate Auto-read preference and Reader Stop control. |
| Next audio/accessibility pass | User-opened text panels auto-read by default with persistent opt-out; page load does not narrate. The baseline ducks to 18% during speech and returns to normal when reading is paused. There is no independent volume/mono/steady-sound UI yet. | Keep current wording accurate. Add a quiet-reading option that stays silent through reader pauses, plus volume and mono. Test speech intelligibility with both headphones and phone speakers. |
| Next transition pass | Route changes stop and disconnect oscillators immediately. | Audition click/seam behavior. If needed, add a short bounded release followed by disposal or a short same-session crossfade; do not leave old nodes alive. Preserve generation-token cancellation. |
| Next product-copy pass | The sound dialog exposes the raw canonical ID as a small product label. | Prefer a short human-readable atmosphere description there. Keep the canonical ID available in source/method details or diagnostic copy; it is useful for reproducibility, not the primary listening choice. |
| Preserve during migration | The same few pastel ranges serve multiple editorial lenses, and baseline sound follows the source lens. | Keep text labels alongside colour. Do not treat hue or pitch as scientific quantity, danger or merit. An accepted reframe can change its displayed question without silently changing canonical v1 tuning. |
| Before a research-backed rendering release | The legacy app still uses score-driven effects for the existing stories, while the accepted design pack uses reviewed native-unit encodings. | Migrate through the evidence adapter and explicit primitives. Do not make the new shells or audio depend on the legacy score normalisation. |

A route's visual shell can change from Earth to moons or a membrane without automatically changing its soundtrack identity. This continuity helps recognition. A different synthesis recipe is a versioned presentation choice; a changed canonical tuning contract belongs to `SOUNDSCAPE_VERSION` and requires an explicit migration.

## Verification performed

The current generated sound index was compared with a fresh call to the actual `soundscapeProfile` export for all entries in `dist/assets/registry.json`. All 146 profiles matched exactly. There are 146 unique canonical IDs, 146 unique complete profile tuples and 146 unique tuples of the values currently used by the renderer (base frequency, cutoff and the seed-dependent upper-partial offset). This proves deterministic distinction in code, not audible distinction.

The reconciled proposal registry and all 24 representation shortlist references were checked against the generated canonical index. Every `id`/`worldId` join matches. Removed the earlier alternative namespace, SHA-256 seed generator and proposed frequency tables. None should be reintroduced by a future implementation.

The remaining acceptance work is physical listening, touch/browser behavior and participant comprehension under `QUALITY_GATES.md`. No 9.2/10 runtime score is claimed here.
