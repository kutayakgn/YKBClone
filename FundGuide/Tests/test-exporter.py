"""Run the real exporter with two local fake HTTP year-filter responses."""
import importlib.util, io, json, tempfile, urllib.parse, zipfile
from pathlib import Path
from unittest.mock import patch
spec=importlib.util.spec_from_file_location('exporter',Path(__file__).resolve().parents[1]/'Scripts/export-fund-guide.py')
exporter=importlib.util.module_from_spec(spec);spec.loader.exec_module(exporter)
with tempfile.TemporaryDirectory() as tmp:
 exporter.OUT=Path(tmp)/'Export'
 posted=[]
 def page(year):
  row='<td><a href="/medium/file/new/download">Eylül 2026</a></td><td></td>' if year==2026 else '<td><a href="/medium/file/old/download">YF / ABC</a></td><td><a href="/medium/file/old/download">Fon Adı</a></td>'
  return ('<input type="hidden" name="__VIEWSTATE" value="test"><select id="ctl00_ContentPlaceHolder1_ddlSearchYear"><option value="2026">2026</option><option value="2025">2025</option></select><table><tr>'+row+'</tr></table>').encode()
 packet=io.BytesIO()
 with zipfile.ZipFile(packet,'w') as archive: archive.writestr('word/document.xml','<document/>')
 def fake_run(command,input=None,check=None):
  url=next(arg for arg in command if arg.startswith('https://'))
  body=Path(command[command.index('-o')+1]);header=Path(command[command.index('-D')+1])
  if url==exporter.URL:
   year=2026
   if input:
    query=urllib.parse.parse_qs(input.decode());year=int(query['ctl00$ContentPlaceHolder1$ddlSearchYear'][0]);posted.append(year)
    assert query['ctl00$ContentPlaceHolder1$btnFilter']==['Göster']
   content=page(year);mime='text/html'
  else:
   content=b'%PDF-1.4\nexample' if '/new/' in url else packet.getvalue();mime='application/octet-stream'
  body.write_bytes(content)
  header.write_text('HTTP/1.1 200 OK\nContent-Type: '+mime+'\nContent-Disposition: attachment; filename="'+('Türkçe Çok Uzun Dosya Adı '*8)+'.pdf"\n\n')
 with patch.object(exporter.subprocess,'run',fake_run): exporter.main()
 assert posted==[2026,2025]
 monthly=json.loads((exporter.OUT/'2026-ve-sonrasi/fund-guides.json').read_text())[0]
 legacy=json.loads((exporter.OUT/'2026-oncesi/fund-guides.json').read_text())[0]
 assert monthly['month']==9 and monthly['title']=='Eylül 2026'
 assert legacy['fundName']=='Fon Adı' and legacy['fundCode']=='YF / ABC'
 assert monthly['fileName']!=legacy['fileName']
 assert monthly['fileName'].endswith('.pdf') and legacy['fileName'].endswith('.docx')
 for group,row in [('2026-ve-sonrasi',monthly),('2026-oncesi',legacy)]:
  assert len(row['fileName'])<=50 and row['fileName'].isascii()
  assert (exporter.OUT/group/'files'/row['fileName']).is_file()
 print('PASS: year submissions, new/legacy JSON, filename shortening/collisions, actual PDF/DOCX detection and disk writing')
