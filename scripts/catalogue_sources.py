#!/usr/bin/env python3
"""Audit the three public World Processor galleries; cache source HTML outside the repo.
No original artwork is copied into Afterworld. Detail text is used only to check
independently written concept summaries; the published catalogue cites each page.
"""
import argparse, concurrent.futures, datetime, json, re, urllib.request
from pathlib import Path
from urllib.parse import urljoin
from lxml import html
BASE='https://world-processor.com/'
GALLERIES=[('301–450',BASE,'homepage'),('201–300',BASE+'wp201-300','wp201-300'),('1–200',BASE+'wp1-200','wp1-200')]
def fetch(url,path):
    if path.exists():return path.read_text()
    req=urllib.request.Request(url,headers={'User-Agent':'Afterworld-source-audit/1.0'})
    text=urllib.request.urlopen(req,timeout=65).read().decode('utf-8')
    path.write_text(text)
    return text

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--cache',default='/tmp/afterworld-worldprocessor');ap.add_argument('--out',default='data/source-inventory.json');ap.add_argument('--details',action='store_true');args=ap.parse_args()
    cache=Path(args.cache);cache.mkdir(parents=True,exist_ok=True)
    entries=[];counts=[]
    for gallery,url,name in GALLERIES:
        tree=html.fromstring(fetch(url,cache/(name+'.html')))
        page=[]
        for a in tree.xpath('//a[@href]'):
            text=' '.join(a.text_content().split())
            match=re.search(r'\[(\d+(?:-\d+)?)[\]}]\s*(.+)',text)
            if match:
                row={'id':match[1],'title':match[2],'url':urljoin(BASE,a.attrib['href']),'gallery':gallery,'gallery_url':url}
                if row['url'] not in {x['url'] for x in entries}:entries.append(row);page.append(row)
        counts.append({'gallery':gallery,'url':url,'entry_count':len(page)})
    Path(args.out).parent.mkdir(parents=True,exist_ok=True)
    payload={'retrieved_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'entries':entries,'galleries':counts}
    Path(args.out).write_text(json.dumps(payload,indent=2,ensure_ascii=False)+'\n')
    print('Inventory:',len(entries),'entries',flush=True)
    if args.details:
        def detail(e):
            try:
                tree=html.fromstring(fetch(e['url'],cache/(e['id']+'.html')))
                blocks=tree.xpath('//div[contains(concat(" ",normalize-space(@class)," ")," sqs-block-html ")]')
                paragraphs=[]
                for block in blocks:
                    for p in block.xpath('.//p|.//h1|.//h2|.//h3'):
                        text=' '.join(p.text_content().split())
                        if text and text not in paragraphs:paragraphs.append(text)
                return {**e,'paragraphs':paragraphs,'retrieved':True}
            except Exception as error:return {**e,'paragraphs':[],'retrieved':False,'error':str(error)}
        with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:
            details=[]
            for row in pool.map(detail,entries):
                details.append(row)
                print(row['id'],row['retrieved'],len(row['paragraphs']),flush=True)
        (cache/'details.json').write_text(json.dumps(details,indent=2,ensure_ascii=False)+'\n')
        print('Details cached:',len(details),flush=True)
if __name__=='__main__':main()
