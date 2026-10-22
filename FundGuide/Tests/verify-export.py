import hashlib, json, re
from pathlib import Path
root=Path(__file__).resolve().parents[1]
manifest=json.loads((root/'Export/download-manifest.json').read_text())
summary=json.loads((root/'Export/summary.json').read_text())
names={};content={};rows=[]
for group in ['2026-ve-sonrasi','2026-oncesi']:
 data=json.loads((root/'Export'/group/'fund-guides.json').read_text());rows+=data
 positions=set()
 for row in data:
  assert 'sortOrder' not in row
  name=row['fileName'];assert len(name)<=50 and re.fullmatch(r'[a-z0-9][a-z0-9._-]*\.(pdf|docx?|xlsx?|pptx?)',name),name
  key=(row['year'],row['fileName']);assert key not in positions;positions.add(key)
  if group=='2026-ve-sonrasi': assert row['year']>=2026 and 1<=row['month']<=12 and row['title']
  else: assert row['year']<2026 and row['fundCode'] and row['fundName']
  path=root/'Export'/group/'files'/name;blob=path.read_bytes()
  assert blob.startswith(b'%PDF') or blob.startswith(b'PK\x03\x04') or blob.startswith(bytes.fromhex('d0cf11e0a1b11ae1'))
  digest=hashlib.sha256(blob).hexdigest()
  assert name not in names or names[name]==digest,'filename collision '+name
  names[name]=digest;content[(group,name)]=digest
for entry in manifest: assert content[(entry['group'],entry['fileName'])]==entry['sha256']
assert len(rows)==summary['rows']==1838
assert len(names)==summary['uniqueSources']
print(json.dumps({'rows':len(rows),'documents':len(names),'maxFileNameLength':max(map(len,names)),'years':summary['years'],'bytes':sum((root/'Export'/g/'files'/n).stat().st_size for g,n in content)},indent=2))
