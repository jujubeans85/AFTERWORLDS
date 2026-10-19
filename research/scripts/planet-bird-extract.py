"""Fetch only selected small CSV members from the public CC BY 4.0 Zenodo ZIP.
HTTP ranges avoid downloading the unrelated raw audio-detection and eBird tables.
All normalized records and member SHA256 digests are retained for audit.
"""
import urllib.request,io,zipfile,json,csv,pathlib,hashlib
ROOT=pathlib.Path(__file__).resolve().parents[1]
meta=json.load(urllib.request.urlopen('https://zenodo.org/api/records/19778881',timeout=30))
file=meta['files'][0];URL=file['links']['self'];SIZE=file['size']
class Remote(io.RawIOBase):
 def __init__(self):self.p=0;self.cache={}
 def seek(self,n,w=0):self.p=n if w==0 else self.p+n if w==1 else SIZE+n;return self.p
 def tell(self):return self.p
 def read(self,n=-1):
  if n<0:n=SIZE-self.p
  if n==0:return b''
  start=self.p;end=min(SIZE-1,start+n-1);self.p=end+1;key=(start,end)
  if key not in self.cache:
   rr=urllib.request.urlopen(urllib.request.Request(URL,headers={'Range':f'bytes={start}-{end}'}),timeout=40)
   if rr.status!=206:raise RuntimeError('Range unavailable; refuse implicit full-archive download')
   self.cache[key]=rr.read()
  return self.cache[key]
z=zipfile.ZipFile(Remote());wanted=['Data/Sites/sites_forRelease.csv','Data/Validation/validation_analysis.csv','Data/Detections/weekly/Willow Warbler_weekly_audio_detections.csv','Data/Detections/weekly/Common Chiffchaff_weekly_audio_detections.csv','Data/Detections/weekly/Spotted Flycatcher_weekly_audio_detections.csv'];out={}
for suffix in wanted:
 name=next(f.filename for f in z.infolist() if f.filename.endswith('/'+suffix) and not f.filename.startswith('__MACOSX'))
 b=z.read(name);rows=list(csv.DictReader(io.StringIO(b.decode('utf-8-sig'))));out[suffix]={'member':name,'sha256':hashlib.sha256(b).hexdigest(),'bytes':len(b),'rows':rows};print(suffix,len(rows),rows[:2],flush=True)
(ROOT/'sources/planet-birds-tables.json').write_text(json.dumps({'recordId':'19778881','sourceUrl':'https://zenodo.org/records/19778881','retrievedAt':'2026-10-19','license':meta['metadata'].get('license'),'archiveChecksum':file['checksum'],'tables':out},ensure_ascii=False,indent=2)+'\n')
