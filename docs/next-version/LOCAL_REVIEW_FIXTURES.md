# Isolated local review fixtures

These scripts write disposable temporary directories. They do not promote candidate data, author review records, or modify the repository's accepted pointers. Local HTTP servers bind only to `127.0.0.1`. Their notices and fixture records distinguish test data from accepted source observations.

## Corrected-design review

`node scripts/review-designs.mjs --serve --port=4174` stages the complete frozen datasets and separately hash-bound scientific corrections for 74 and 156-8. It uses the real scene, source table, source guidance, static chart and PNG generator. Its identity remains `local-review-fixture`, with `authorizesRuntimeActivation: false`, even after these designs acquire a separate runtime approval. This fixture cannot itself publish an accepted release.

The independent actual runtime records now live in `data-updates/design-activation/74.json` and `156-8.json`; they are separate from this staging mechanism. The 73-view build and 215-test full suite passed after those records were validated normally.

## Update components

`node scripts/review-updates.mjs --serve --port=4175` copies the actual 430 baseline and creates one deliberately synthetic update: `africa-south1` changes from 641 to 642 g CO2eq/kWh. All other rows remain unchanged. The fixture uses the real bounded release loader, accepted-manifest monitor, immutable history reader and scene/UI modules. The page owns its own orchestration, so its results establish component integration only, not the application's route or Apply behavior.

Check and Apply are separate. A deliberately corrupted release must fail integrity verification while leaving the displayed world intact. The immutable history index includes the baseline copy and synthetic revision, both explicitly labelled local test summaries.

## Actual application

`node scripts/review-app-updates.mjs --serve --port=4176` copies the complete built application. The application, view, UI and loader module bytes remain unchanged; an isolation regression verifies this. Only a disposable registry's 430 summary and the local server's manifest response are staged. Sharing stays within the local origin.

The parent control page embeds the real `/globe/the-carbon-clock` route with `fixture=preserve-me&row=africa-south1`. Stage an update, wait until at least 30 seconds after the last check, then focus the embedded app. Its existing focus listener and throttle run normally. Use its own Apply button, then read its actual URL to inspect the retained unrelated query and selected row plus changed `v`.

The historical-baseline control opens the original immutable revision through the real `v` lookup while the staged manifest points to the synthetic update. A corrupt-pointer check should start from the baseline: the actual app skips fetching when the offered revision already equals the displayed revision. The delayed stage holds the next release response for five seconds so navigation away can exercise cancellation.

No removed-row test is fabricated: 430's exact accepted binding requires all 44 rows. These local fixtures do not certify physical-device behavior, listening quality, production hosting, or upstream data acceptance.
