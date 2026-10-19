# Repository and deployment

The user-selected GitHub destination is [jujubeans85/AFTERWORLDS](https://github.com/jujubeans85/AFTERWORLDS). Repository write access was verified through the connected GitHub integration. The repository already had public visibility; this work did not change that setting. Browser passkey authentication is not required for the connected repository operations.

The application snapshot was copied from the existing Sites source commit recorded in `research/baseline.json`. Research additions are isolated from the deployed app. The reviewed implementation queue lives in `research/manifest.json`; it does not automatically promote concepts into the existing 146-page atlas.

The current Sites project is configured in `.openai/hosting.json`. Continue its supported source/deployment workflow when implementing reviewed designs. The GitHub validation workflow checks the application build, Node tests, research contracts, reviewed file digests and generated research manifests. It does not deploy the site.

The static build uses root-relative URLs. GitHub Pages project hosting under `/AFTERWORLDS/` would require a deliberate base-path change across HTML, CSS/JS assets, data fetches, navigation and metadata. Do not enable that hosting mode without implementing and testing the migration. Root-domain static hosting already matches the build output.

No access tokens or credentials are required in the application source. Dependencies are pinned and vendored; their licence notices remain included.
