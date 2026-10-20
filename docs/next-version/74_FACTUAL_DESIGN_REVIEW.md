# Factual review of the proposed two-task selection correction

Reviewer: `quality_challenger`, independent reviewing agent. Reviewed 20 October 2026.

Scope: scientific design amendment evidence only. This review does not activate a runtime adapter, alter frozen research, authenticate a human reviewer or approve a product release.

The reviewed proposal is `data-updates/design-proposals/74-two-task-selection.json`, SHA-256 `5dbb02da9dfeb8860b1b62f673f242f63e957be45232db99524c433ce07b93a2`. I independently reproduced its original canonical design hash `15d189d2d273c17edf1eef416ecb3ad655c4fb45d4fb2f6297483cf016001711` and frozen dataset byte hash `0e336f937febe3f8c5f19b6fd5efdb032c48c18a8c29abbbc7a0a4e52f4bbf2c`.

The frozen design's exact claim, geometry and validation test require two models on two tasks. Its filter instead contains `AIME2026`, while the frozen dataset contains `AIME 2026`. Consequently the current included IDs contain only the two MMLU Pro observations. The proposal corrects that one literal, includes exactly four existing row IDs and updates the included count and validation requirement. It changes no observation value.

I independently opened the official [Gemma 4 model card](https://ai.google.dev/gemma/docs/core/model_card_4). Its **Benchmark Results** table currently supports the following selected observations:

| Frozen row ID | Task | Selected model | Percent |
| --- | --- | --- | --- |
| `gemma-0-1` | MMLU Pro | Gemma 4 E2B | 60.0 |
| `gemma-0-2` | MMLU Pro | Gemma 3 27B, no think | 67.6 |
| `gemma-2-1` | AIME 2026, no tools | Gemma 4 E2B | 37.5 |
| `gemma-2-2` | AIME 2026, no tools | Gemma 3 27B, no think | 20.8 |

The corrected filter reproduces exactly these four frozen rows. Preserve the existing model names and configuration fields, including the no-tools AIME condition. The opposite ordering is supported for this fixed pair and these two tests. It is not an overall model ranking or a causal model-size experiment. This current source inspection does not establish the original evaluation date or turn the page-update date into a test date.

Factual verdict: the exact filter/selection correction is supported and reconciles the binding with the design's already stated scientific claim. The proposal remains `proposed-not-accepted`. A hash-bound effective amendment and a separate actual scene/table/browser/regression runtime review remain required before activation.
