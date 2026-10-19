# AFTERWORLD evidence contract

Reviewed 20 October 2026 (Australia/Sydney). `evidence.json` is the single source for numerical content. It contains 14 independent evidence layers, 71 observations, source links, dates, scope, limitations, and separate forecast metadata.

## Rendering rules

1. Read `geographyMode` before creating geographic marks. `work` and `languages` are categorical; `proteins` is global. Their null coordinates are intentional. They may use labelled abstract sectors or a clearly conceptual globe, but never fabricated country pins.
2. Geographic points are representative anchors for whole countries or source-defined regions. The marker is not a data-centre, robot factory, language population, lab, or measurement station. Render the selected country/region name alongside each selected value.
3. Unshown countries have **no value in this selection**, not zero. Do not fill them with low values, interpolate between markers, or turn empty geography into a risk heatmap.
4. Marker size and decorative animation must have an explained scale. Moving particles and arcs are illustrative unless a separate source actually quantifies flows. Do not imply that an invented arc is real traffic, money, migration or electricity.
5. Keep `dataYear` visible. Retrieval date is not measurement date. Headline and map periods can differ only with explicit labels. The power globe uses 2024 regional shares and a separately identified 2025 global total.
6. Forecasts belong in their own distinctly labelled state. The IEA's 950 TWh is a 2030 central projection, not a 2026 observation. Do not animate a made-up growth path between dates as measured data.
7. Surface `scope`, `limitations`, and source URLs in an accessible evidence drawer, and expose a keyboard-readable table for every globe. Preserve rounded/threshold qualifications in robot values.
8. Geography is not causality. Access, 5G, industrial robots, data localisation, all-data-centre water/electricity, and gallium provide relevant AI context; the dataset does not demonstrate that AI caused their entire quantity or change.
9. “Observed” refers to reported counts/corpus statistics. It does not certify that the source is complete or that database predictions are scientifically confirmed. “Estimate” includes modelled exposure and telemetry-adjusted use.
10. No “live” label: this is a sourced release snapshot. Data refresh must be reviewable and preserve prior versions.

## Important checks

- Stanford's landing-page alt text gives South Asia 3 public AI supercomputers. The actual report's Figure 8.3.1 and surrounding prose give **2**. The file uses 2. The same PDF confirms that the East Asia/Pacific group excludes China.
- Microsoft Q2 2026 AI diffusion supersedes its H2 2025 figures. The current release measures people aged 15–64 using covered products during the period. Its tool coverage is incomplete, particularly for China; the source explicitly anticipates upward revisions from expanded coverage.
- IFR's September 2026 release supersedes the June preliminary US robot count. Industrial installations do not equal humanoid robots or job losses. Several source totals are rounded or thresholds.
- The water layer is a dated US case study from Berkeley Lab's 2024 report: direct water consumption in 2023. A June 2026 electricity update exists; it does not justify re-labelling the 2023 water estimate as current.
- AlphaFold v6 is a versioned database snapshot. It contains computational predictions. Later community contributions must not be silently added to this denominator.
- Common Crawl's CC-MAIN-2026-39 language mix describes crawled HTML documents; it is not the language distribution of a specific AI training set or the world's speakers.

## Primary records inspected

| Layer | Primary record | Data period |
| --- | --- | --- |
| Power geography | [IEA Energy and AI](https://www.iea.org/reports/energy-and-ai/executive-summary) | 2024 |
| Power headline and outlook | [IEA Key Questions on Energy and AI](https://www.iea.org/reports/key-questions-on-energy-and-ai/executive-summary), published 16 April 2026 | 2025 / 2030 projection |
| Private investment | [Stanford AI Index, Economy](https://hai.stanford.edu/ai-index/2026-ai-index-report/economy) | 2025 |
| Notable models | [Stanford AI Index, Research](https://hai.stanford.edu/ai-index/2026-ai-index-report/research-and-development) | 2025 |
| Industrial robots | [IFR World Robotics 2026 release](https://ifr.org/ifr-press-releases/news/five-million-robots-now-operate-in-factories-globally) | 2025 |
| Internet use | [ITU Facts and Figures](https://www.itu.int/itu-d/reports/statistics/2025/10/15/ff25-internet-use/) | 2025 |
| 5G coverage | [ITU network coverage](https://www.itu.int/itu-d/reports/statistics/2025/10/15/ff25-mobile-network-coverage/) | 2025 |
| AI use | [Microsoft Q2 report](https://aka.ms/AIDiffusionReport2026Q2), pp. 12–15; [dataset](https://github.com/microsoft/ai-diffusion-report/blob/main/data/AI_Diffusion_Q22026_Update.csv) | Q2 2026 |
| Occupational exposure | [ILO–NASK](https://www.ilo.org/resource/news/one-four-jobs-risk-being-transformed-genai-new-ilo%E2%80%93nask-global-index-shows) | 2025 index |
| Crawl languages | [Common Crawl statistics](https://commoncrawl.github.io/cc-crawl-statistics/plots/languages.html) | CC-MAIN-2026-39 |
| Water | [Berkeley Lab report](https://eta-publications.lbl.gov/sites/default/files/2024-12/lbnl-2024-united-states-data-center-energy-usage-report_1.pdf), pp. 55–56 | 2023 |
| Public compute and localisation | [Stanford policy chapter](https://hai.stanford.edu/assets/files/ai_index_report_2026_chapter_8_policy_and_governance.pdf), Figures 8.3.1 / 8.3.3 | 2025 / through 2024 |
| Protein predictions | [EMBL-EBI v6 release](https://www.ebi.ac.uk/pdbe/news/alphafold-database-release-notes) | 2025 release |
| Gallium | [IEA Energy and AI](https://www.iea.org/reports/energy-and-ai/executive-summary) | 2025 report estimate |

## Maintenance

Add a reviewed release to the registry rather than overwriting values without a source/date change. Check units, denominators, geography, status and comparability before updating a layer. Publication dates intentionally have only known precision. No invented confidence interval is supplied. Do not relabel a one-time editorial snapshot as an automated data pipeline.
