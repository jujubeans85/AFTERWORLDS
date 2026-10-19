#!/usr/bin/env python3
"""Build a design registry. Evidence matches remain proposals until independent review."""
import csv,datetime,hashlib,json,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(Path(__file__).resolve().parent))
from match_overrides import OVERRIDES
from motion_specs import motion_for

def main():
    concepts=json.loads((ROOT/'research/concepts-132.json').read_text())
    with (ROOT/'research/designs/intent-matrix.tsv').open() as f:intents={r['conceptId']:r for r in csv.DictReader(f,delimiter='\t')}
    audits={}
    for p in (ROOT/'research').glob('*-audit.json'):
        d=json.loads(p.read_text());rows=d if isinstance(d,list) else d.get('concepts',d.get('entries',[]))
        audits.update({r['conceptId']:r for r in rows})
    review_path=ROOT/'research/audits/final-review.json'
    review_bytes=review_path.read_bytes() if review_path.exists() else None
    final_review=json.loads(review_bytes) if review_bytes else {}
    review_lookup={r['conceptId']:r for r in final_review.get('concepts',[])}
    designs=[];errors=[]
    for c in concepts:
        cid=c['id'];a=audits.get(cid,{});intent=intents.get(cid,{});o=OVERRIDES.get(cid);bindings=[];ready=bool(o and a.get('datasetIds'))
        if ready:
            for did in a['datasetIds']:
                p=ROOT/'research/datasets'/f'{did}.json'
                if not p.exists():ready=False;errors.append(f'{cid}: missing {p}');continue
                raw=p.read_bytes();d=json.loads(raw);fields=o.get('fieldsByDataset',{}).get(did,o.get('fields',[]))
                missing=[x for x in fields if not any(x in r for r in d['rows'])]
                if missing:ready=False;errors.append(f'{cid}/{did}: missing fields {missing}')
                selection=o.get('selectionByDataset',{}).get(did,o.get('selection'))
                selected=d['rows'] if not selection else [r for r in d['rows'] if all(r.get(test['field']) in test['values'] for test in selection['all'])]
                if not selected:ready=False;errors.append(f'{cid}/{did}: empty declared selection')
                bindings.append({'datasetId':did,'path':str(p.relative_to(ROOT)),'sha256':hashlib.sha256(raw).hexdigest(),'rowCount':len(d['rows']),'fields':fields,'filter':selection or 'all supplied rows; no implicit exclusion','includedRowCount':len(selected),'includedRowIds':[r['id'] for r in selected],'transformation':o.get('transform','Source values unchanged; apply only the explicitly documented geometric scale. Preserve null, qualifier and status.'),'sourceGeography':d['geography'],'observationPeriod':d['time']})
        spec=o if ready else None
        mode=spec['mode'] if spec else intent.get('geographyMode','unresolved')
        draft=bool(intent)
        d={'designId':'design-'+cid,'conceptId':cid,'status':'evidence-matched-awaiting-review' if ready else ('provisional-draft' if draft else 'draft-pending'),
           'readinessVerdict':'hold','reviewAcceptancePending':True,'researchReadinessScore':None,'productQualityScore':None,
           'title':spec['title'] if spec else c['newTitle'],'researcherProposedTitle':a.get('proposedTitle'),
           'question':a.get('proposedQuestion',c['question']),'exactClaim':a.get('claim',a.get('exactClaim',a.get('exactScope'))) if ready else None,
           'originalQuestion':c['question'],'reframeReason':a.get('reframeReason',a.get('rationale')),
           'aiRelationship':({'class':a['aiRelationship'],'justification':a.get('rationale','Source-defined contextual relationship.')} if isinstance(a.get('aiRelationship'),str) else a.get('aiRelationship',{'class':'illustrative','justification':'Unmeasured research proposal; not an observed AI effect.'})),
           'sourceInspiration':{'id':cid,'url':c['url'],'originalTitle':c['title'],'originalConcept':c['sourceConcept'],'connection':('Artistic starting point: '+c['sourceConcept']+' Evidence-backed adaptation: '+spec['legend']+' The original globe supplies historical framing, not current measurements.') if spec else c['connection'],'originalMappingDraft':c['connection'],'originalMappingStatus':'Pre-audit proposal; not the current evidence claim.'},
           'datasetBindings':bindings,'sharedContract':'research/designs/shared-contract.json',
           'geographyMode':mode,'coordinateMeaning':spec.get('coordinateMeaning') if spec and spec.get('coordinateMeaning') else ('Source geographic identifiers joined to audited polygons; any display anchors are labelled summaries, not observed sites.' if mode=='geographic' else 'No observed coordinates are imputed. Slots are explicitly nongeographic categories or global-statistic facets.'),
           'visualMetaphor':spec['title'] if spec else intent.get('metaphor',c['newTitle']),
           'implementation':{'primitive':spec['primitive'] if spec else intent.get('primitive','no-data-geometry-until-reviewed'),'geometry':spec['geometry'] if spec else intent.get('geometryIntent','No measured geometry specified before a defensible dataset exists.'),'materials':'shared-contract.visualSystem.materials','shaders':'shared-contract.visualSystem.shaders','loading':'One selected dataset and one live scene; no duplicate data store.'},
           'scale':spec['scale'] if spec else {'type':'unbound','unit':'unresolved; requires source data; do not render numeric marks'},
           'color':spec['color'] if spec else 'Provisional: select categorical or ordered colour only after actual field semantics are reviewed. No unsourced intensities.',
           'legend':spec['legend'] if spec else intent.get('legendIntent','Research concept; no measured data.'),
           'uncertainty':'Preserve source status, qualifier, nulls, scope and limitations in labels and table. Do not invent confidence intervals. Missing and outside-sample are separate from zero.',
           'animation':motion_for(cid) if spec else {'measured':{'type':'none'},'decorative':'Provisional draft only; no measured data animation approved.','reducedMotion':'Static research-concept card and accessible text.'},
           'backsideDiscovery':spec['backside'] if spec else intent.get('backsideIntent','Do not invent hidden observations. Backside behavior is blocked until the data scope is known.'),
           'interaction':'shared-contract.interaction; data selection retains exact source row ID and never changes its quantity.',
           'accessibleEquivalent':{'type':'semantic HTML table plus text summary','columns':(['id','name','value','unit','period','status','qualifier','sourceId','sourceLocator','notes']+([f for f in spec['fields'] if f not in ['id','name','value','unit','period','status','qualifier']] if spec else [])),'parity':'Every bound row remains available, including null values and rows without supported map geometry.'},
           'mobile':'44px hit targets independent of geometry; 320px single-column layout; viewport Move/Read toggle; scroll outside canvas; tap selection; table and Next observation require no drag.',
           'performanceBudget':'shared-contract.performanceBudget; targets are untested until implemented on named devices.',
           'scoring':{'type':'none','reason':'No new composite or impact rating is constructed; any source-native score retains its documented definition.'},'forecast':{'type':'none','reason':'No forecast invented; published plans remain plans and observed history remains history.'},
           'timeControls':'Show source observation period and publication/retrieval separately. No Past/Present/Future control unless actual compatible data support each state.',
           'distinctness':{'comparedDesignIds':[],'evidenceDifference':a.get('proposedQuestion',spec['legend']) if spec else intent.get('distinctQuestion',c['question']),'encodingDifference':spec['geometry'] if spec else intent.get('geometryIntent','Await evidence-specific design.'),'interactionDifference':spec['backside'] if spec else intent.get('backsideIntent','No data interaction approved.')},
           'validationTests':['Apply every shared-contract validation test.']+(spec.get('special',[]) if spec else ['Do not ship this draft as measured data.','Bind populated reviewed observations before rendering any data magnitude.']),
           'requiredDataIfHeld':[] if ready else [s.strip() for s in intent.get('requiredFields','populated data;primary source;reuse;geography;time').split(';')],
           'gaps':([] if ready else a.get('blockers',[])+['No final reviewed field-linked design for this concept.']),
           'limitations':a.get('limitations',[]),
           'reviewContract':'research/audits/RESEARCH_READINESS.md; all10 gates plus independent>=92 required. Implementation/animation quality is untested.'}
        if spec and spec.get('specialTransform'):d['transformationDetail']=spec['specialTransform']
        if spec and spec.get('encodings'):d['fieldEncodings']=spec['encodings']
        final=review_lookup.get(cid)
        if final:
            review=final.get('review',{})
            expected=review.get('datasetDigests',{})
            actual={b['datasetId']:b['sha256'] for b in bindings}
            gates=review.get('gates',{})
            score=review.get('score')
            accepted=(ready and final.get('verdict') in ('direct-ready','context-ready','reframe-ready')
                      and final.get('designId')==d['designId'] and bool(actual) and expected==actual
                      and isinstance(score,(int,float)) and score>=92
                      and all(gates.get('G'+str(n),{}).get('status')=='pass' for n in range(1,11)))
            d['reviewSynchronization']={'reviewPath':str(review_path.relative_to(ROOT)),
                'reviewedAt':review.get('reviewedAt',final_review.get('reviewedAt')),
                'reviewer':review.get('reviewer',final_review.get('reviewer')),
                'datasetDigestsMatch':bool(actual) and expected==actual,
                'adopted':accepted,
                'runtimeCaveat':'Accepted specification readiness does not establish implemented animation, usability, accessibility, mobile, engagement, scalability or product quality.'}
            if accepted:
                d.update(status='accepted-specification',readinessVerdict=final['verdict'],
                         reviewAcceptancePending=False,researchReadinessScore=score)
            elif final.get('verdict')=='hold':
                d.update(status='held-research-draft',reviewAcceptancePending=False)
            elif ready:
                d['gaps'].append('Independent acceptance cannot be adopted: current dataset digests, design identity, score or all ten gates do not match the final review.')
        designs.append(d)
    # Comparisons expose family reuse to the reviewer without pretending they are independent datasets.
    comparison_groups=[['375','284'],['408','63','78-4','276'],['320','156-8','166-2'],['417','247','333','259'],['218','74','331'],['56-5','217','30-8','430'],['8-17','8-6','377','330'],['365','115-2','355'],['178','368','397']]
    lookup={x['conceptId']:x for x in designs}
    for group in comparison_groups:
        for cid in group:
            if cid in lookup:lookup[cid]['distinctness']['comparedDesignIds']=['design-'+other for other in group if other!=cid and other in lookup]
    out={'schemaVersion':1,'builtAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'coverage':{'concepts':len(designs),'specificDrafts':sum(x['status']!='draft-pending' for x in designs),'evidenceMatched':sum(bool(x['datasetBindings']) for x in designs),'evidenceMatchedProposals':sum(x['status']=='evidence-matched-awaiting-review' for x in designs),'independentlyAccepted':sum(x['status']=='accepted-specification' for x in designs),'researchHeld':sum(x['readinessVerdict']=='hold' for x in designs),'uniqueBoundDatasets':len({b['datasetId'] for x in designs for b in x['datasetBindings']})},'warning':'Acceptance is research/data/design-specification readiness only, adopted from the independent review after exact digest and gate checks. No runtime product-quality rating is conferred. Held drafts must not be rendered as measured findings.','designs':designs}
    (ROOT/'research/designs/design-registry.json').write_text(json.dumps(out,indent=2,ensure_ascii=False)+'\n')
    print(json.dumps(out['coverage'],indent=2))
    if errors:print('BINDING ERRORS:',*errors,sep='\n');sys.exit(1)
if __name__=='__main__':main()
