# Independent foundation review

Reviewer: `quality_challenger`. Date: 19 October 2026. Scope: the draft `next-version-foundation` work on top of commit `2bf5f0803f58bd5cba9b1a7b1833ce699318c6c2`; exact reviewed file digests appear below.

**Verdict: pass for a draft engineering handoff after the source-level fixes listed below. Product release and the requested 9.2/10 standard remain unverified.** No live deployment, browser session, physical-device session or listening/haptic evaluation was performed by this reviewer. The refresh adapter is outside this review and is being checked separately.

## Executed evidence

The reviewer executed `npm run build`, then the seven explicit test files listed below. The build completed with 146 globe routes, 14 sourced stories and 132 labelled concepts. All **30 tests passed; zero failed, skipped or cancelled**. The build generated and copied the two new runtime modules and the soundscape index.

| Evidence | Result | Limit |
| --- | --- | --- |
| Existing contracts, geography, reader, research and visuals tests | 22 passed | Numerical/source/scene-construction checks, not rendered browser verification |
| `tests/sensory-sharing.test.mjs` | 5 passed | Injected audio/navigation doubles; no real audio output, browser share sheet, clipboard permission or motor |
| `tests/reader-autoread.test.mjs` | 3 passed | Executes the actual reader factory through a minimal DOM port and the JUICE speech engine; not browser layout, focus traversal or actual speech |
| Source inspection of integration, sharing, audio, CSS and build | Completed | Some event ordering and CSS behavior still require browser execution |

The exact command was:

```sh
npm run build
node --test tests/contracts.test.mjs tests/geography.test.mjs tests/reader.test.mjs tests/research.test.mjs tests/visuals.test.mjs tests/sensory-sharing.test.mjs tests/reader-autoread.test.mjs
```

The test names describing “gesture” refer to controlled calls in the harness. They do not establish that a browser grants transient user activation, permits speech or presents a native share sheet. The minimal DOM port does not reproduce layout, actual focus navigation, accessibility trees or dialog inertness.

## Findings corrected before this verdict

| Finding | Correction inspected | Verification |
| --- | --- | --- |
| A delayed share/clipboard failure could open an old world's manual-link dialog after navigation. | `shareCurrent` captures `renderToken` and discards stale UI completion. | Source review; the app-level navigation race is not exercised by the isolated sharing test. |
| Narration starting during the initial ambience fade could leave a later full-volume automation event. | `setNarrating` cancels/holds existing automation before scheduling the ducking target; a fallback cancels and sets the current value. | Source review and automation-event assertion in the audio double. Audible smoothness remains untested. |
| Turning action sounds off left an already scheduled short cue active. | Disabling `effects` calls `stopEffects`, stops the oscillators and disconnects their nodes. | Source review and executed cleanup assertion. |
| Effects could remain enabled on the index while settings were reachable only on world pages. | A header SOUND control is bound by `bindCommon` on the normal index, world and unknown-route views. | Source review. Actual keyboard/touch discoverability remains untested. |
| Additional header controls risked overflowing a narrow single-row layout. | At widths up to 480 CSS pixels the header wraps and navigation occupies its own row with minimum control widths. | Source inspection only; no rendered 320-pixel or physical-phone claim. |
| Valid JSON primitives or arrays in saved reader preferences could break preference assignment. | Parsed preferences are normalized to an object; malformed JSON and blocked storage retain a safe in-memory choice. | Executed tests include null, array, string, number, invalid JSON and throwing storage. |
| “TURN ALL OFF” implied that the newly automatic narration would also stop. | The button is now “TURN EFFECTS OFF”; narration retains its separate visible controls and persistent auto-read option. | Source/copy review. |

No unresolved defect from these findings remains in the inspected source. That conclusion is limited to this review scope; it does not mean no defects exist in browser behavior.

## Behavior supported by this foundation

- Ambience, action sounds and haptics start disabled and are session-only choices. There is no persisted sound opt-in and no audio context is constructed at silent startup. Sound profiles derive from stable world IDs, not catalogue order or displayed titles.
- One sensory director owns the active world's small oscillator graph. World changes stop the old ambience and cue nodes. Hidden-page handling stops nodes and suspends the context; returning to visibility attempts to resume effects that remain enabled. That is the actual current policy, not “resume only after another tap.” Browser rejection must still be checked on devices.
- Narration activity controls ambience ducking and quieter action cues. The resulting waveform, loudness, transition quality and perceptual differentiation have not been heard. Deterministic distinct IDs are not proof of 146 perceptually distinct soundscapes; these are related synthesized tone profiles.
- The explicit user request changes narration policy: opening a text panel reads it by default, and the option to disable this is visible in the panel and the reader. The factory does not speak on construction; `openDialog` invokes `reader.opened` after preparing the user-opened panel. Opt-out stops the queue immediately and persists when storage works. Manual Listen remains available. Panel replacement, closure, navigation and page hiding use the existing cancellation lifecycle.
- Automatic panel reading does not call the reader's focus-transfer path. The tests demonstrate that the minimal DOM port receives no focus call from that path; they do not prove real modal focus behavior. About copy now explains the default and opt-out.
- Sharing constructs an HTTP(S) URL for the current world's validated slug. Native sharing is invoked before an await; cancellation does not silently copy. Other failures try clipboard and then provide a selectable manual URL. These are current-edition links, not pinned historical versions or preserved camera/filter state.
- The build emits 146 stable sound identities. Existing research acceptance, dataset versions and renderers remain separate. This foundation does not implement the 73 accepted research designs or make the older 14-story score/effect system appropriate for them.

## Still required before product acceptance

1. **Actual browser integration:** inspect every new control, dialog, focus return and share fallback; exercise rapid navigation during asynchronous operations, unavailable APIs, denied permissions, speech failure, page restoration and the first 600 ms of narration/ambience interaction. Verify the app-level share token guard with a controlled delayed promise.
2. **Physical hardware:** use the matrix in `QUALITY_GATES.md` for touch, small-screen wrapping, VoiceOver/TalkBack, real speaker/headphone output, audio interruption and supported-device vibration. API presence and successful mock calls do not establish these outcomes.
3. **Narration quality:** the existing device-voice selection does not guarantee a calm female narrator. A selected/licensed voice or asset, pronunciation review and real listening are still needed. Verify persistent auto-read opt-out on actual storage/browser combinations and accessible Stop/Disable controls.
4. **Sound design:** listen to the profiles individually and in sequence; assess clipping, loop/route clicks, fatigue, intelligibility and a useful independent volume control. The present three-tone synthesis is a foundation, not completed per-world art direction. Optional haptics must never become essential feedback.
5. **Sharing:** test native sheets and clipboard policies on phones, recipient opening without prior state, social preview images/canonical metadata and any future pinned-version policy. The current static title/description and URL functions do not prove a finished social preview experience.
6. **Scientific integration:** preserve native values, uncertainty, dates and research gate bindings when implementing the new designs. The inherited hard-coded 20 October review labels should be replaced with actual metadata before a public release. A scheduled source fetch must not imply current/live values or silently refresh narration.
7. **Runtime and usability:** measured GPU/frame/resource behavior, meaningful participant tasks and the seven independent category scores remain open. Run the stated tests on the actual release deployment and retain failed runs and retest evidence.
8. **Refresh adapter and deployment:** this report does not accept the adapter, its source retrieval, scheduler, publication policy or rollback. It does not authorize or report a live deployment. Those artifacts and their later tests require their own recorded review.

The appropriate handoff statement is: **a buildable foundation with reviewed lifecycle fixes and 30 passing automated checks, ready for browser and device verification.** It is not a completed immersive atlas, a verified live-data service or a certified 9.2/10 product.

## Reviewed file digests

SHA-256 values identify the exact draft source and tests reviewed. Later changes require targeted reinspection of affected behavior.

| File | SHA-256 |
| --- | --- |
| `src/soundscape.js` | `f5270f7685314cfaf3fca1a813c66a5d0517adb6b4e40e8dd2fecf87603a756c` |
| `src/sharing.js` | `6b8922e32d5fe9b4289122630caef2f60da052aef73d61da3cf9d48612c20607` |
| `src/app.js` | `6cddd41cec1ec54118c2bd42de8b2f41dd430d0beb90182f98eb16dc2c88bd69` |
| `src/reader.js` | `8edbec95309fda9d6829278c1336db2bc47342bea4b105c7d1efca04e47549e5` |
| `scripts/build.mjs` | `442ba244f783ecacaa3e16a1cda6bf2b598740a40838c024cb27322dcb0f733d` |
| `src/style.css` | `cf1aeed09da8e540f176c2af5f8ef73a5af3bf0c26d37517fb8cfae74934f972` |
| `tests/sensory-sharing.test.mjs` | `80f4b8824dbf93f81dd606bd0bb35388dcee68d59dd4477b071c9e4906db24a7` |
| `tests/reader-autoread.test.mjs` | `6ee28a260202b3277919170b65ec2aa8a4a6f0de9adda5506be3e19eca2fa475` |
