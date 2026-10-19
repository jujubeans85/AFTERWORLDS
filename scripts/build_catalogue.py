#!/usr/bin/env python3
"""Build the original concept catalogue from audited public gallery inventory.
The authored TSV is the single editing surface. Public HTML stays in a scratch
cache; only short paraphrases, source links and heading metadata are published.
"""
import argparse,csv,datetime,json,re,unicodedata
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
LENSES={'energy','water','work','capital','models','language','access','chips','trust','biosphere','science','oceans','mobility','borders'}
TITLE_ONLY={'313','305','259','232','11','74'}
def slug(text):
    return re.sub(r'[^a-z0-9]+','-',unicodedata.normalize('NFKD',text).encode('ascii','ignore').decode().lower()).strip('-')
def versions(paragraphs):
    result=[];seen=set()
    for p in paragraphs:
        match=re.search(r'\[([\d, \-]+)[\]}]',p[:100])
        if not match:continue
        identifier=match[1].strip()
        # A printed combined label stays combined; it is not evidence of independently inspected objects.
        tail=p[match.end():].strip()
        year=re.search(r'(?<!\d)(?:19|20)\d{2}(?!\d)',tail[:120])
        year=year.group(0) if year else None
        key=(identifier,year)
        if key in seen:continue
        seen.add(key);result.append({'label':identifier,'year':int(year) if year else None})
    return result

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--details',required=True);args=ap.parse_args()
    inventory=json.loads((ROOT/'data/source-inventory.json').read_text())
    with (ROOT/'data/concept-mapping.tsv').open() as f:authored={r['id']:r for r in csv.DictReader(f,delimiter='\t')}
    details={e['id']:e for e in json.loads(Path(args.details).read_text())}
    assert len(inventory['entries'])==146
    assert set(authored)==set(e['id'] for e in inventory['entries'])
    entries=[]
    for base in inventory['entries']:
        a=authored[base['id']];d=details.get(base['id'],{});v=versions(d.get('paragraphs',[]))
        assert a['lens'] in LENSES
        e={**base,**{k:val for k,val in a.items() if k!='id'},'slug':slug(a['newTitle']),
          'sourceRead':bool(d.get('retrieved')),'sourceEvidence':'title-only' if base['id'] in TITLE_ONLY else 'caption',
          'sourceVersions':v,'status':'research-candidate','evidenceStatus':'concept',
          'evidenceNote':'Research concept, not measured AI-impact data. The proposed relationship requires a separately audited dataset.',
          'geographicNote':'Any animated geography on this concept route is an illustrative composition, not a measured location, intensity, or causal effect.',
          'sourceNote':('The public page provides titles or version headings but no explanatory caption. The connection uses that limited evidence.' if base['id'] in TITLE_ONLY else 'The original source provides the historical artistic framing only; its older numerical claims are not reused as current evidence.')}
        entries.append(e)
    assert len({e['slug'] for e in entries})==len(entries)
    assert len({e['newTitle'] for e in entries})==len(entries)
    assert len({e['question'] for e in entries})==len(entries)
    historical={(v['label'],v['year']) for e in entries for v in e['sourceVersions']}
    meta={'schemaVersion':1,'project':'Afterworld','sourceProject':'World Processor','sourceArtist':'Ingo Günther','sourceWebsite':'https://world-processor.com/','retrievedAt':inventory['retrieved_at'],
      'catalogueBuiltAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'galleryEntryCount':len(entries),'detailPagesRead':sum(e['sourceRead'] for e in entries),
      'titleOnlyPages':sorted(TITLE_ONLY),'galleries':inventory['galleries'],'observedVersionLabelYearPairs':len(historical),
      'coverage':'Complete inventory of the 146 unique entry links exposed by the three public gallery pages when retrieved. Some entry pages contain several historical versions. Version labels and years visible in caption headings are recorded, but this is not a census of every artwork or all historical versions in the separate archive.',
      'versionHandling':'The original gallery id and title remain unchanged even when a detail page includes newer, older or differently labelled versions. Combined printed version labels remain combined. A null year means no year was found in the heading, not that the work is undated.',
      'originality':'All new titles, research questions and concept connections are original. No original artwork photographs, scans or long source captions are included.',
      'evidencePolicy':'Every entry is a research concept. No concept implies a measured causal AI effect, and no numeric source claim is republished as current evidence. Promote to an evidence-backed data layer only after auditing definitions, units, dates, geographic coverage, missingness and sources.',
      'reuse':'Citation and artistic inspiration do not imply endorsement by or affiliation with the original artist.'}
    payload={'meta':meta,'entries':entries}
    (ROOT/'data/source-catalog.json').write_text(json.dumps(payload,indent=2,ensure_ascii=False)+'\n')
    print(json.dumps({'entries':len(entries),'detailPagesRead':meta['detailPagesRead'],'historicalHeadingPairs':len(historical),'titleOnlyPages':len(TITLE_ONLY),'uniqueTitles':len({e['newTitle'] for e in entries}),'output':str(ROOT/'data/source-catalog.json')},indent=2))
if __name__=='__main__':main()
