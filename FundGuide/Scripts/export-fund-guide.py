#!/usr/bin/env python3
"""Public WebForms year filter exporter. Python standard library only."""
import concurrent.futures, hashlib, io, json, re, unicodedata, subprocess, tempfile, zipfile
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlencode, urljoin, unquote
BASE='https://www.yapikredi.com.tr'
URL=BASE+'/bireysel-bankacilik/yatirim-urunleri/yatirim-fonlari/fon-rehberi'
OUT=Path(__file__).resolve().parents[1]/'Export'
class Parser(HTMLParser):
 def __init__(self):
  super().__init__(convert_charrefs=True); self.hidden={}; self.years=[]; self.select=False; self.rows=[]; self.row=None; self.cell=None; self.anchor=None
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='input' and a.get('type')=='hidden' and a.get('name'): self.hidden[a['name']]=a.get('value','')
  if tag=='select': self.select=a.get('id')=='ctl00_ContentPlaceHolder1_ddlSearchYear'
  if tag=='option' and self.select: self.years.append(int(a['value']))
  if tag=='tr': self.row=[]
  if tag=='td' and self.row is not None: self.cell={'text':'','links':[]}
  if tag=='a' and self.cell is not None: self.anchor={'href':a.get('href',''),'text':''}
 def handle_data(self,data):
  if self.cell is not None: self.cell['text']+=data
  if self.anchor is not None: self.anchor['text']+=data
 def handle_endtag(self,tag):
  if tag=='select': self.select=False
  if tag=='a' and self.anchor is not None:
   if self.cell is not None: self.cell['links'].append(self.anchor)
   self.anchor=None
  if tag=='td' and self.cell is not None:
   if self.row is not None: self.row.append(self.cell)
   self.cell=None
  if tag=='tr' and self.row is not None:
   if self.row and any('/medium/file/' in l['href'] for c in self.row for l in c['links']): self.rows.append(self.row)
   self.row=None

def parse(text):
 p=Parser();p.feed(text);return p

def clean(s): return ' '.join(s.split())
def slug(s):
 s=s.translate(str.maketrans('ıİşŞğĞüÜöÖçÇ','iIsSgGuUoOcC'))
 return re.sub('[^a-z0-9]+','-',unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower()).strip('-')

def main():
 def fetch(url,data=None):
  with tempfile.TemporaryDirectory() as tmp:
   headers=Path(tmp)/'headers'; body=Path(tmp)/'body'
   command=['curl','--fail','--location','--silent','--show-error','--retry','3','--max-time','120','-D',str(headers),'-o',str(body),url]
   if data is not None: command += ['--data-binary','@-','-H','Content-Type: application/x-www-form-urlencoded']
   subprocess.run(command,input=data,check=True)
   blocks=headers.read_text().strip().split('\n\n'); values={}
   for line in blocks[-1].splitlines()[1:]:
    if ':' in line:
     key,value=line.split(':',1);values[key.strip().lower()]=value.strip()
   return body.read_bytes(),values
 raw,_=fetch(URL); current=parse(raw.decode('utf-8')); years=current.years
 groups={'2026-ve-sonrasi':[], '2026-oncesi':[]}; manifest=[]; files={}; report=[]
 months=['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']
 for year in years:
  # Submit the same filter form as selecting a year and pressing Göster.
  payload=dict(current.hidden);payload['ctl00$ContentPlaceHolder1$ddlSearchYear']=str(year);payload['ctl00$ContentPlaceHolder1$btnFilter']='Göster'
  raw,_=fetch(URL,urlencode(payload).encode());current=parse(raw.decode('utf-8'))
  (OUT/'source').mkdir(parents=True,exist_ok=True);(OUT/'source'/f'{year}.html').write_bytes(raw)
  bucket='2026-ve-sonrasi' if year>=2026 else '2026-oncesi'; count=0
  for cells in current.rows:
   link=next(l for c in cells for l in c['links'] if '/medium/file/' in l['href']); source=urljoin(BASE,link['href']); first=clean(cells[0]['text'])
   if year>=2026:
    month=next((i+1 for i,m in enumerate(months) if m.casefold() in first.casefold()),0)
    if not month: raise ValueError(f'Unknown month: {year} {first}')
    row={'year':year,'month':month,'title':first,'fileName':''}
   else: row={'fundCode':first,'fundName':clean(cells[1]['text']),'fileName':'','year':year}
   groups[bucket].append(row); manifest.append({'group':bucket,'row':row,'sourceUrl':source});count+=1
  report.append({'year':year,'rows':count}); print('YEAR',year,count,flush=True)
  if not count: raise ValueError(f'No rows for {year}')
 def download(source):
  data,headers=fetch(source)
  if data.startswith(b'%PDF'): ext='.pdf'
  elif data.startswith(b'PK\x03\x04'):
   with zipfile.ZipFile(io.BytesIO(data)) as package: members=package.namelist()
   ext=next((extension for prefix,extension in [('word/','.docx'),('xl/','.xlsx'),('ppt/','.pptx')] if any(name.startswith(prefix) for name in members)),None)
   if ext is None: raise ValueError('Unsupported ZIP document: '+source)
  elif data.startswith(bytes.fromhex('d0cf11e0a1b11ae1')):
   kind=headers.get('content-type','')+' '+headers.get('content-disposition','')
   ext='.xls' if ('excel' in kind or '.xls' in kind) else '.ppt' if ('powerpoint' in kind or '.ppt' in kind) else '.doc'
  else: raise ValueError(f'Unknown document: {source} {headers} {data[:80]!r}')
  disposition=headers.get('content-disposition',''); name=re.search(r'filename\*?=(?:UTF-8\x27\x27)?[\"]?([^\";]+)',disposition,re.I)
  stem=slug(Path(unquote(name.group(1)) if name else source.split('/')[-2]).stem) or 'fund-guide'
  suffix='-'+hashlib.sha256(source.encode()).hexdigest()[:12]; filename=stem[:50-len(suffix)-len(ext)]+suffix+ext
  for group in {entry['group'] for entry in manifest if entry['sourceUrl']==source}:
   target=OUT/group/'files'/filename;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data)
  return source,filename,hashlib.sha256(data).hexdigest(),len(data)
 unique=list(dict.fromkeys(x['sourceUrl'] for x in manifest))
 # Bounded downloading avoids flooding the public server.
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
  for source,filename,digest,length in pool.map(download,unique): files[source]=(filename,digest,length);print('FILE',filename,length,flush=True)
 for entry in manifest:
  entry['row']['fileName']=files[entry['sourceUrl']][0]
 for bucket,rows in groups.items(): (OUT/bucket/'fund-guides.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
 (OUT/'download-manifest.json').write_text(json.dumps([{'group':e['group'],'year':e['row']['year'],'fileName':e['row']['fileName'],'sourceUrl':e['sourceUrl'],'sha256':files[e['sourceUrl']][1],'bytes':files[e['sourceUrl']][2]} for e in manifest],ensure_ascii=False,indent=2)+'\n')
 (OUT/'summary.json').write_text(json.dumps({'source':URL,'years':report,'rows':sum(len(r) for r in groups.values()),'uniqueSources':len(files)},indent=2)+'\n')
 print(json.dumps(report))
if __name__=='__main__': main()
