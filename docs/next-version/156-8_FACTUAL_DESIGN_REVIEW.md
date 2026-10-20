# Factual review of the proposed 156-8 design correction

Reviewer: `quality_challenger`, independent reviewing agent. Reviewed 20 October 2026.

Scope: scientific design amendment evidence only. This note does not activate a runtime adapter, alter frozen research, approve a production release or authenticate a human reviewer.

The reviewed proposal is `data-updates/design-proposals/156-8-rounded-percentage.json`, SHA-256 `1117408097c1011504cf09a0c1dc15e83b8469044d0440b7a98a00f0956ae5a7`. Its original design and dataset hashes remain recorded in that proposal.

I independently opened and read the primary [ILO English report](https://www.ilo.org/sites/default/files/2025-04/Informe%20Plataformas%20Digitales_EN_web.pdf). Section 2.5, printed page 23 (PDF page 27, zero-based index 26), gives 53 percent for workers with clients outside their country. Its description concerns being above one half; it does not establish a strict lower bound above 53 percent. The executive summary, PDF page 7 (index 6), repeats the 53 percent figure. This was a text inspection of the primary PDF, not a visual inspection of its page layout.

The proposed explicit rounded-source label at 53 percent, without a strict-lower-bound arrow, is supported by that report and the frozen row's existing qualifier. Encoding this row as `>53%` would assert stronger precision than the report and conflict with the row's stated interpretation.

For the subsequent 90 percent figure, the report expressly identifies respondents who know their clients' location; Table 6 describes known foreign-client locations. Retain the frozen row's explicit denominator, “percent of respondents who know client location,” rather than silently using all respondents or the entire 53 percent group. The proposal correctly keeps two separately labelled facets and does not multiply the percentages into a new unsourced quantity.

Factual verdict: the proposed geometry correction and additional validation requirement are supported. The proposal remains `proposed-not-accepted`; its separate immutable amendment, acceptance procedure, explicit runtime implementation and regression checks remain necessary before activation.
