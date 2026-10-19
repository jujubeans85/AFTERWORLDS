# Typography and JUICE Reader · 20 October 2026

## Implementation

One typography system replaces the mixed serif/system headings: Space Grotesk for display and body text, Space Mono for compact labels. Both fonts and their SIL Open Font Licenses are bundled locally. Headings, controls, focus outlines, selections and the player inherit the selected world's accent. Body copy stays bright and neutral; long-form paragraphs are 16px by default. A larger-text option increases reading copy without changing the underlying information.

`src/reader.js` is a single shared player, moved into a native information dialog while it is open so its controls stay inside the modal focus boundary. It reads from the rendered content, stripping interface controls, without duplicating editorial text. Summary paragraphs form one reading block; other explanatory paragraphs, context, selected-location notes, limitations and legends receive individual Listen controls. A whole-overlay control includes quick statistics and evidence table values. Headings, navigation and terse globe gestures do not get redundant playback controls.

The actual JUICE Reader engine was copied unchanged from `READER/dist/speech.js` in the user's `jujubeans85/JUICE` checkout at commit `3b31b4d49efd9f1f7eb5810591a2862c502fe8fd`. `vendor/juice-speech.js` is the only speech engine. The existing generation/utterance guards, short passages and word-boundary resume behavior are retained. The atlas adapter handles selection, labels and lifecycle without creating another speech queue or opening another site. Future upstream updates should replace this vendored engine deliberately and run the tests.

Playback is opt-in. Settings include available device voices, Australian/British/American shortcuts when exposed by the device, voice refresh, 0.8/1/1.25/1.5/1.75/2× speed, pause/resume, previous/next, stop, replay and larger text. Preferences alone are kept in localStorage; content is not persisted. No speech backend or API key is introduced. Platform online voices may transmit selected text to their provider; this is stated beside the voice settings. No lock-screen/background playback promise is made. Losing page visibility pauses playback, and closing/switching overlays or navigating stops it.

Font upstreams: Google Fonts `ofl/spacegrotesk` and `ofl/spacemono`. Original TTFs were losslessly packaged as WOFF with FontTools; font design is unchanged. No runtime font CDN request is needed.

## Verification

- Build succeeded: all 146 world routes, 14 sourced stories and 132 labelled concepts retained.
- 20 Node tests passed, including existing dataset, projection, geometry and overlay checks, plus playback cancellation/resume, voice and speed changes, replay, speech-error recovery and missing-API handling.
- All 14 globe accent colours and the core body palette meet at least 4.5:1 against the four tested dark surfaces. Button text also meets that threshold. This checks the specified colour pairs, not full WCAG certification.
- Node/JSDOM exercised the actual app entrypoint: no automatic playback; hero and context controls; pause and boundary resume; voice/speed/text preferences; navigation cancellation; player placement inside dialogs; close cancellation; method paragraphs; all 146 information overlays; idempotent enhancement; and the unavailable-speech reading fallback.
- The vendored speech engine is byte-identical to the recovered JUICE source.
- Browser automation was unavailable in the managed Sites environment. No preview server or substitute browser was started. Node DOM simulation does not establish layout, WebGL rendering or audible speech. Desktop/mobile visual QA and audible iPad/Safari validation remain outstanding.
