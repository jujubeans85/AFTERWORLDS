"""Assemble the reviewer's recorded judgments; this is not an automatic fact checker.

The explicit decisions below were made after source, concept and design inspection.
Running this script does not authorize adding a new accepted concept. Dataset/source
checks and final design bindings must have been frozen and reviewed first.
"""
import copy
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATE = '2026-10-19'

# Coverage /15, time /10, uncertainty /10, distinctness /5. The remaining
# categories are source fidelity20, geography10, AI link10, encoding10,
# attribution5 and implementation contract5, earned only after all gates close.
# These are scope-specific research judgments, never runtime/product scores.
DECISIONS = '''
422-2|13|8|9|5|Employment-survey years are mixed and unspecified; modeled occupational exposure cannot establish employment loss.
415|12|9|9|4|Five historical announcements form a bounded dossier; the collection and linked Scotland release have different dates.
408|15|10|9|4|Country coverage is broad and independently re-fetched; basic connection is not reliability or usable AI access.
385|12|9|9|3|An investment intention and annual GDP are deliberately unlike quantities; this is a scale-literacy reframe only.
375|13|9|9|5|The top-five inventor-location extract is intentionally selected and patent families do not measure realized innovation.
369|13|9|9|4|Selected GDP comparators and company fiscal sales are not an economic-equivalence ranking.
330|12|9|8|5|A selected school trial has substantial differential attrition; coefficients, robust standard errors and regression denominators are retained.
320|13|9|9|5|A voluntary regional platform-worker survey is contextual to AI; pay denominators and trimming remain explicit.
284|13|9|9|5|Top-ten applicants are a selected patent-family view, distinct from inventor location and social impact.
276|13|10|9|4|Two global median connectivity baskets are a narrow affordability prerequisite, not AI subscription access.
247|12|9|9|4|Named initiative partners establish participation in an announcement, not delivered assistance or benefit.
63|13|10|9|4|Two global urban/rural aggregates expose a prerequisite gap but cannot locate subnational AI access.
78-4|14|10|9|4|The full country join preserves missingness; modeled connected-person counts inherit survey and population uncertainty.
155-17|12|9|9|4|Three historical studied relationships are not an exhaustive or current platform-dependence network.
156-8|13|9|9|5|Two survey proportions have different denominators and cover general web-platform work rather than AI-only trade.
417|13|9|9|5|A complete first-selection cohort supports consortium membership, not operating capacity or wider AI alliances.
409|13|9|9|5|Six archival model results are a selected comparison; consistency is not territorial truth or current ability.
407|14|10|8|5|All32 market values and sample definitions were checked;15 market samples overrepresent connected segments.
397|12|9|9|4|Two documented administrative components support workflow roles only, not refusal rates or outcomes.
372|12|9|9|4|Two observation channels cannot identify underlying incidence or reporting completeness.
371|12|9|9|4|Three reported cases have different monetary meanings and incomplete criminal attribution.
333|13|10|9|4|A single recorded appointment vote is not institutional influence, population representation or policy compliance.
356|12|10|9|4|A selected administrative dossier distinguishes pilot dates and later ministerial disclosure; outcomes are not quantified.
256|12|9|9|4|A historical launch-status ledger does not certify the satellite's current application inventory or performance.
250|12|10|9|4|One newsroom's dated rules are not evidence of content prevalence or worldwide press conditions.
259|12|9|9|4|Two formal mandates and one report handoff do not establish effectiveness or completeness of global governance.
218|13|10|8|5|Developer-reported, differently configured model scores do not isolate a parameter-count effect; tasks remain separate.
63-8|13|9|9|5|Language-version preparation counts do not measure language populations, quality or model-training representation.
74|13|10|8|5|Two selected tasks demonstrate one rank reversal without supporting a universal model ranking.
117|14|10|8|5|All qualifying public records were independently reselected; speculative estimates and undisclosed training remain material limits.
138-8|12|10|8|5|Selected vendor-assessed accounts and overlapping activity classes cannot estimate worldwide cybercrime or attribution.
178|12|9|9|4|Two unlike governance mechanisms are documented categories, not equal authority, compliance or effectiveness scores.
430|14|9|9|5|All44 annual regional factors were checked, but hourly marginal emissions and measured AI workload energy are absent.
428|13|9|9|5|Seven oil transit bottlenecks have overlapping flows and mixed fiscal/half-year windows; no AI allocation is supported.
406|12|8|8|4|Selected climate examples use approximate and threshold operating-time shares with unspecified averaging windows.
394|14|10|9|4|A national metered history and later connection rules are separate evidence types; neither maps individual proposals.
382|12|9|9|4|An original campus announcement supplies different land and floorspace definitions, not completed geographic footprint.
368|12|10|9|4|A historical chip-rule announcement is a bounded policy event, not legal advice, current exhaustive controls or observed exports.
358|12|8|8|4|Project-reported milestones retain an inconsistent article header and undated later supervision text.
325|12|10|8|4|Selected rider feedback and uptake are not causal accessibility gains or collision safety outcomes.
324|13|10|8|5|Announced contract capacities have unlike kinds and possible overlaps; no indiscriminate sum or delivered-energy inference.
323|12|9|8|5|Selected physical fuel shares have approximate and threshold values; missing categories are not zeros.
321|13|9|9|5|Named historical demand-response programmes do not quantify saved energy, flexible capacity or routed workloads.
314|12|9|9|4|Two announced design pilots and a qualitative energy trade-off establish intentions rather than commissioned results.
305|12|8|9|4|Three engineering roles are a deliberately narrow dependency dossier without supplier shares or exclusivity.
266-2|13|9|9|5|Mixed-period manufacturing milestones and a global revenue share cannot be converted to local capacity.
255|12|8|8|4|Three company-selected alternative-water shares have undefined averaging periods and no absolute avoided-volume denominator.
233-2|12|10|8|4|Two aggregate benchmark gains lack spatial rasters; source article reuse is limited to factual values and original wording.
217|13|10|8|5|Efficiency and aggregate demand describe different populations; the contrast cannot identify a rebound magnitude.
214|13|10|9|5|One country's production and shipment accounts are accurately distinguished but not AI-specific or a global census.
211-4|13|10|9|5|Corrected provider comparison includes all95% intervals but retains reporting corrections and unlike historical benchmarks.
202|13|10|9|5|Five provider operating domains are exposure only; cumulative miles do not measure fleet size or comparative safety.
30-8|12|9|8|5|Lifecycle totals and marginal response disclosures have incompatible system boundaries and denominators.
56-5|14|10|9|4|National share history and global demand are separate; no Irish share is used to allocate AI or worldwide consumption.
111-3|12|8|9|4|Regional water totals and named infrastructure links include an undated description and do not identify basin effects.
150-5|12|9|9|4|A bounded investigation dossier clarifies conventional automation; no AI casualty attribution is supported.
193-5|12|9|8|5|Country and continental grains differ; approximate and upper-bound per-resident values cannot yield an exact ratio.
402|13|9|9|5|Four algorithms on one benchmark do not establish global plastic detection, mass or geographic coverage.
365|14|9|9|5|All6497 raw benchmark samples were independently recounted; one wine region does not represent world taste or quality.
5-6|13|10|9|4|Two global release fractions are descriptive seafloor coverage, not AI contribution or a spatial map of unmapped cells.
388|14|9|9|5|Source intervals and rounded regional shares are preserved; tracking absence does not establish illegal fishing.
8-6|13|9|10|5|A two-site randomized trial measures screening completion, with different arm timing, exclusion and missingness explicit.
8-17|13|9|9|5|One clinical workflow trial has source confidence intervals but hospital-record mortality ascertainment limits generalization.
115-2|13|9|9|5|Class-specific validation accuracy is not wetland extent; unspecified parenthetical uncertainty remains exact text.
364|12|9|8|5|Reported nine-year win counts mix six validation and three test years and do not contain yearly win identities or margins.
390|13|9|9|5|The global e-waste ledger is context, not measured AI hardware waste; overlapping subsets remain separate.
392|12|8|7|5|Small observational evaluation has a date conflict and potential training-year overlap; only the published configuration comparison is accepted.
170-3|12|9|9|5|Two confirmed historical discoveries are a curated demonstration of ML assistance, not a complete or current discovery census.
378|14|9|9|5|A selected Norwegian recorder network preserves effort gaps and randomized public coordinates; acoustic tags do not establish individual birds or migration paths.
232|13|9|9|5|Curated ancestry participant entries can be repeated across GWAS studies and are not genomic AI training provenance or distinct people.
348|13|9|8|5|Selected 1980–2025 bibliometric point findings do not reproduce the full statistical uncertainty model; associations cannot establish AI causation.
398|12|9|8|5|Two fields and two seasons confound AI, hardware and management; spatial dispersion is not independent trial replication.
107|12|8|9|4|Three undated repository policy snapshots are a small access-rule comparison; actual training provenance and record-specific permissions remain separate.
'''

decisions = {}
for line in DECISIONS.strip().splitlines():
    cid, cov, time, unc, distinct, reason = line.split('|', 5)
    decisions[cid] = dict(coverage=int(cov), time=int(time), uncertainty=int(unc), distinctness=int(distinct), reason=reason)


def read(path):
    return json.loads((ROOT / path).read_text())


def records(value):
    return value if isinstance(value, list) else value['concepts']


def sha(path):
    return hashlib.sha256((ROOT / path).read_bytes()).hexdigest()


def gate(status, evidence, reason):
    return dict(status=status, evidence=evidence, reason=reason)


def assemble():
    datasets = {d['datasetId']: d for p in (ROOT / 'research/datasets').glob('*.json') for d in [json.loads(p.read_text())]}
    designs = {d['conceptId']: d for d in read('research/designs/design-registry.json')['designs']}
    source_logs = {'society': ['research/audits/source-checks.json'], 'governance': ['research/audits/source-checks.json'], 'physical': ['research/audits/root-source-checks.json'], 'planet': ['research/audits/society-peer-planet-checks.json','research/audits/governance-peer-planet-checks.json']}
    output = []
    for group in ['physical', 'society', 'governance', 'planet']:
        author_path = f'research/{group}-audit.json'
        for original in records(read(author_path)):
            c = copy.deepcopy(original)
            cid = c['conceptId']
            d = designs[cid]
            candidate = c.get('candidateVerdict', c.get('proposedVerdict', c.get('researcherVerdict', c['verdict'])))
            accepted = cid in decisions and candidate.endswith('-ready')
            paths = [f'research/datasets/{x}.json' for x in c['datasetIds']]
            ds = [datasets[x] for x in c['datasetIds']]
            evidence = paths + source_logs[group]
            c['designId'] = d['designId']
            c['review'] = dict(gates={}, score=None, scoreBreakdown=[], reviewer='quality_challenger (independent of dataset and design authors)', reviewedAt=DATE, datasetDigests={x['datasetId']: sha(f'research/datasets/{x["datasetId"]}.json') for x in ds})
            c['review']['scope'] = 'Research/data/design-contract readiness only. No browser, animation, accessibility, mobile, engagement, scalability or overall product rating is conferred.'
            c['review']['peerEvidence'] = source_logs[group]
            if accepted:
                # Fail closed on stale or absent field bindings. Judgment itself is above.
                bindings = {b['datasetId']: b for b in d['datasetBindings']}
                for data in ds:
                    b = bindings.get(data['datasetId'])
                    assert b and b['sha256'] == c['review']['datasetDigests'][data['datasetId']], f'Stale design: {cid}/{data["datasetId"]}'
                    assert b['rowCount'] == len(data['rows'])
                c['verdict'] = 'reframe-ready' if cid in {'8-6', '364'} else candidate
                c['blockers'] = []
                c['proposedTitle'] = d['title']
                c['review']['decisionRationale'] = decisions[cid]['reason']
                c['limitations'] = list(dict.fromkeys(c.get('limitations', []) + [decisions[cid]['reason']] + [x['uncertainty'] for x in ds]))
                r = c['review']['gates']
                rows = [row for data in ds for row in data['rows']]
                missing = sum(row['status'] == 'missing' for row in rows)
                bounded = sum(row['value'] is None and row['status'] != 'missing' for row in rows)
                r['G1'] = gate('pass', paths, f'{len(rows)} local records across {len(ds)} distinct dataset file(s): {len(rows)-missing-bounded} nonmissing value/category records, {bounded} interval-only estimates and {missing} explicit missing records. Coverage and denominators support this precise claim: {c["claim"]}')
                r['G2'] = gate('pass', evidence, 'All manually extracted rows were independently reconciled with primary locators; machine imports were independently re-fetched/recomputed where recorded. Final accepted file digests are frozen below. Peer source checks are attributed rather than presented as this reviewer performing every retrieval.')
                r['G3'] = gate('pass', evidence, 'Source-by-source reuse and credit inspected: ' + ' | '.join(f'{s["sourceId"]}: {s["reuse"]["basis"]}' for x in ds for s in x['sources']) + '. Acceptance covers only the packaged factual rows and original explanations; it grants no permission to reuse source graphics, article prose or excluded assets.')
                r['G4'] = gate('pass', paths, 'Observation, publication and retrieval dates remain distinct; unknown periods stay explicitly unknown and the display is a dated snapshot. ' + ' | '.join(f'{x["datasetId"]}: {x["time"]["observationStart"]} to {x["time"]["observationEnd"]}' for x in ds))
                r['G5'] = gate('pass', paths + ['research/designs/design-registry.json'], ' | '.join(f'{x["datasetId"]}: {x["geography"]["definition"]}' for x in ds) + f' Design geography is {d["geographyMode"]}; categorical positions have no geographic meaning. No invented local density or missing-as-zero allocation.')
                r['G6'] = gate('pass', paths + ['research/designs/design-registry.json'], decisions[cid]['reason'] + ' | ' + ' | '.join(x['uncertainty'] for x in ds))
                r['G7'] = gate('pass', evidence, f'Classified {c["aiRelationship"]["class"]}: {c["aiRelationship"]["justification"]} Direct denotes an evidenced AI connection, not an automatic causal effect. Only the proposed bounded claim is accepted.')
                r['G8'] = gate('pass', paths + ['research/designs/design-registry.json'], 'No atlas extremity, danger or composite impact score is constructed. Native published benchmark measures retain their metric definition and domain; unlike measures are neither averaged nor silently rescaled.')
                r['G9'] = gate('pass', paths + ['research/designs/design-registry.json'], 'No new forecast is supplied. Historical forecast-skill evaluations, policy intentions and investment announcements remain explicitly retrospective/source statements, with no invented future values.')
                r['G10'] = gate('pass', ['research/designs/design-registry.json', 'research/designs/shared-contract.json', 'research/audits/DESIGN_BENCHMARKS.md'], f'{d["designId"]}: {d["implementation"]["primitive"]}. Exact fields, final hashes, scales, uncertainty, backside inspection and accessible/mobile equivalents reviewed. Source connection: {c["sourceConnection"]} This passes a design specification, not executed visual/runtime quality.')
                p = decisions[cid]
                categories = [('Primary-source fidelity',20,20,r['G2']['reason'],evidence),('Populated coverage',p['coverage'],15,p['reason'],paths),('Geography',10,10,r['G5']['reason'],paths),('Time coverage',p['time'],10,p['reason'],paths),('Uncertainty and statistical meaning',p['uncertainty'],10,p['reason'],paths),('AI relationship',10,10,r['G7']['reason'],evidence),('Quantitative design, score and forecast',10,10,d['implementation']['geometry'],['research/designs/design-registry.json']),('Reuse and attribution',5,5,r['G3']['reason'],paths),('Implementation contract',5,5,'Populated typed records, source IDs, exact hashes, field bindings and documented transformations; execution remains a later release gate.',paths),('Source inspiration and distinctness',p['distinctness'],5,d['distinctness']['evidenceDifference']+' '+p['reason'],['research/designs/design-registry.json'])]
                c['review']['scoreBreakdown'] = [dict(category=n,earned=e,possible=m,reason=why,evidence=ev) for n,e,m,why,ev in categories]
                c['review']['score'] = sum(x['earned'] for x in c['review']['scoreBreakdown'])
                assert c['review']['score'] >= 92, (cid, c['review']['score'])
            else:
                c['verdict'] = 'hold'
                c['review']['ratingWithheld'] = 'No numeric research-readiness rating is assigned while required populated evidence or a field-bound design is absent. Null is not zero quality; it prevents false precision.'
                c['review']['decisionRationale'] = 'The original construct is not yet supported by an implementation-ready evidence layer. The specific author investigation and unblock steps are retained for follow-up.'
                ev = [author_path]
                blockers = c.get('blockers') or c.get('blockingNextSteps') or c.get('missingEvidence') or ['Populated evidence supporting the precise claim and a verified field-bound design are missing.']
                c['blockers'] = blockers
                for number in range(1,11):
                    reason = 'No accepted dataset version supports this gate for the original construct. ' + ' '.join(blockers)
                    status = 'fail' if number in {1,10} else 'unchecked'
                    if number in {8,9}:
                        status,reason = 'pass','No unsupported composite score or future-value forecast is supplied; this alone does not establish data readiness.'
                    c['review']['gates'][f'G{number}'] = gate(status,ev,reason)
            output.append(c)
    assert len(output)==132 and len({x['conceptId'] for x in output})==132
    result = dict(reviewedAt=DATE,reviewer='quality_challenger',standard='research/audits/RESEARCH_READINESS.md',scope='Independent research readiness; no certified product score and no invented competitor numeric ratings.',concepts=output)
    (ROOT/'research/audits/final-review.json').write_text(json.dumps(result,indent=2)+'\n')
    print('Reviewed',len(output),'accepted',sum(x['verdict'].endswith('-ready') for x in output))


if __name__ == '__main__':
    assemble()
