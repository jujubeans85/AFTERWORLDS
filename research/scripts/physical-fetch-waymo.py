"""Reproduce the small factual source extract used by the physical pack.
Only selected CSV records are persisted; full provider dataset is not redistributed.
The corrected October2,2026 release contains1804 rows in this fixed-period file.
"""
import csv,hashlib,io,json,pathlib,urllib.request
root=pathlib.Path(__file__).resolve().parents[1]
url='https://storage.googleapis.com/waymo-uploads/files/documents/safety/safety-impact-data/CSV3%20-%20Collision%20Counts%20and%20Comparison%20to%20Benchmarks%20202009-202606-2022benchmark.csv'
raw=urllib.request.urlopen(url,timeout=30).read()
rows=list(csv.DictReader(io.StringIO(raw.decode('utf-8-sig'))))
selected=[r for r in rows if r['Outcome']=='Any Injury' and r['Grouping Type']=='All Crashes' and r['Benchmark Comparison']=='Any-injury-reported']
assert len(rows)==1804 and len(selected)==11, 'Source changed; inspect release notes before updating.'
for r in selected:
 for prefix in ['Waymo','Benchmark']:
  assert float(r[prefix+' IPMM CI Lower']) <= float(r[prefix+' IPMM']) <= float(r[prefix+' IPMM CI Upper'])
record={'url':url,'retrievedAt':'2026-10-19','release':'2026-10-02','rawSourceSha256':hashlib.sha256(raw).hexdigest(),'originalRows':len(rows),'selection':'Outcome=Any Injury; Grouping Type=All Crashes; Benchmark Comparison=Any-injury-reported','selectedRows':selected}
(root/'sources'/'physical-waymo-selected.json').write_text(json.dumps(record,indent=2)+'\n')
print('Verified',len(selected),'selected records from',len(rows),'raw records')
