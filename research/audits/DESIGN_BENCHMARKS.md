# Research and design comparison standard

These references set professional comparison targets for the research pack. The user's 8.5+/10 comparison request is treated as an aspiration; no published or independently measured numeric rating is claimed for these products. Documentation and publicly retrieved interface text were inspected, not runtime performance. AFTERWORLD's proposed designs cannot be assigned a product-quality score before implementation and device testing.

## Reference evidence

| Reference | Documented qualities inspected | AFTERWORLD acceptance expectation |
| --- | --- | --- |
| [earth.nullschool.net](https://earth.nullschool.net/) and [its methods](https://earth.nullschool.net/about.html) | Interface text exposes date, units, source, scale and start/stop animation. Methods explain model inputs, update intervals, vertical levels and limits; the page documents keyboard controls. | Every design binds visible marks to units, period and a source. Motion has a stated meaning and a pause/reduced-motion state. Model output, observation and illustrative animation remain distinct. A legend explains the actual scale, including bounds and missing values. |
| [NASA Eyes](https://science.nasa.gov/eyes/) | NASA describes interactive 3D views of real mission data and imagery; Eyes on the Earth includes date-range exploration, satellite context and explanations of trends. | Interaction must reveal specific evidence, not merely rotate decoration. A selected mark opens its value, period and scope; a timeline appears only if supported by comparable observations. Guide users to one meaningful initial discovery and give an accurate reason to inspect the other side. |
| [Global Fishing Watch](https://globalfishingwatch.org/our-platform/) | Its platform documentation describes vessel search, flag/time filters, activity inspection, downloadable datasets and APIs. | Selected or filtered observations must remain traceable to the underlying rows and source. State the observation window and classification method; downloadable data should reproduce the displayed subset. Machine-learning classifications must not be silently presented as direct observation. |
| [World Processor](https://world-processor.com/) | The original globe-as-argument concept is the explicit artistic source; the frozen inventory preserves a source ID, explanation and URL per concept. | Each design states exactly what is inherited conceptually and what changes. No claim that a newly narrowed dataset answers a broader original research question. No copied source photographs or chart presentation without a documented reuse basis. |

## Concrete design review questions

1. Can a reader answer **what, where or which category, when, how much, according to whom, and with what limitation** from the proposed selection/legend without inferring from decoration?
2. Does a doubled numeric value change the stated visual channel by the correct amount? Area, volume, length, colour, rate and rank must not be interchanged. A beautiful curve is not evidence of a physical flow.
3. Does spin expose additional genuine observations or a documented abstract comparison? If a single global measure has no geographic backside, the concept must say so and offer an appropriate abstract interaction.
4. Does each design remain intelligible when animation is paused, colour distinctions are unavailable, or only its table is read? Mobile selection must not depend on a tiny animated target or hover.
5. Is the design materially distinct in the evidence/question, data encoding, or discovery interaction? Colour, title, camera angle and particle styling alone do not establish a different research story.
6. Does the design preserve missingness, source-defined regions and uncertainty? A gap is not zero; a country anchor is not a site; a source scenario is not a measured future.
7. Is ambition bounded by a documented geometry/particle budget, one active scene, and a low-motion fallback? These are implementation requirements, not evidence that a frame-rate target has been achieved.

## Competition claim boundary

AFTERWORLD can aim to outperform these references in short editorial entry points, a coherent AI-themed catalogue, and distinct visual arguments. That is a design hypothesis. This review does not claim it surpasses their scientific coverage, update infrastructure, interface quality or performance. Validate those claims with the completed implementation, explicit tasks, representative phones/desktops and measured results.

The per-concept G10 review records conformity with the research/design specification. The seven product release gates in `docs/QUALITY_REVIEW.md` remain separate.
