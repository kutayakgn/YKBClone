"""Preview only: mock data/server for exercising the real client assets without Kentico.
Run: python3 CustomTableFeedTransfer/Tests/press-preview-server.py
Never deploy this server in the Kentico application.
"""
import html
import json
from datetime import date, timedelta
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parents[1]
CATEGORIES = [(4, "Kredi Kartları"), (5, "Yapı Kredi"), (9, "Parakende Bankacılık"), (10, "Kurumsal Ve Ticari Bankacılık"), (12, "Sınırsız Bankacılık"), (13, "Özel Bankacılık"), (80, "Invester Relations - In The Press")]
ROWS = [dict(title="YAPI KREDİ’DEN YILIN İLK YARISINDA EKONOMİYE 3 TRİLYON TL DESTEK.pdf" if i == 0 else f"YAPI KREDİ BASIN BÜLTENİ {i+1}", date=date(2026, 7, 31)-timedelta(days=i*2), category=4 if i < 13 else 5, detail="Yapı Kredi, güçlü bilançosu, uluslararası fonlama kabiliyeti ve oluşturduğu entegre finans ekosisteminin gücüyle Türkiye ekonomisine kaynak sağladı. Banka, müşterilerinin ihtiyaçlarına yönelik çalışmalarını sürdürdü.") for i in range(25)]
ROWS += [dict(title="2024 YILI BASIN BÜLTENİ", date=date(2024, 5, 1), category=9, detail="Geçmiş yıl örnek raporu."), dict(title="2023 YILI BASIN BÜLTENİ", date=date(2023, 5, 1), category=9, detail="Geçmiş yıl örnek raporu.")]

def result(category="", period="2026", page=1, size=10):
    selected = [r for r in ROWS if not category or str(r['category']) == category]
    if period == '3m':
        today = date.today()
        month = today.month-3
        year = today.year
        if month < 1: month += 12; year -= 1
        selected = [r for r in selected if date(year,month,1) <= r['date'] <= today]
    elif period: selected = [r for r in selected if str(r['date'].year) == period]
    total = len(selected)
    pages = (total+size-1)//size if size else 0
    page = min(max(1,page),max(1,pages)) if size else 1
    selected = selected[(page-1)*size:page*size] if size else selected
    markup = f'<div class="ct-press__rows" data-press-result data-page="{page}" data-total-pages="{pages}" data-total-records="{total}">'
    for row in selected:
        markup += f'<article class="ct-press__row"><a class="ct-press__row-link" href="https://example.com/report.pdf" target="_blank" rel="noopener noreferrer"><h3 class="ct-press__row-title">{html.escape(row["title"])}</h3><time class="ct-press__date">{row["date"].strftime("%d.%m.%Y")}</time><p class="ct-press__detail">{html.escape(row["detail"])}</p></a></article>'
    return markup + ('<p class="ct-press__empty">Aramanıza uygun kayıt bulunamadı.</p>' if not selected else '') + '</div>'

def selector(name,label,options,value=''):
    options=[('', 'Seçiniz')]+[(str(k),v) for k,v in options]
    markup=f'<div class="ct-press-select" data-press-select><span class="ct-press-select__label">{label}</span><input type="hidden" name="{name}" value="{value}" data-press-value><button type="button" class="ct-press-select__trigger" aria-label="{label}" aria-expanded="false" aria-haspopup="listbox" data-press-trigger><span data-press-label>{dict(options)[value]}</span><span class="ct-press-select__arrow"></span></button><div class="ct-press-select__panel" data-press-panel hidden><input type="search" class="ct-press-select__search" data-press-search aria-label="{label} içinde ara"><div class="ct-press-select__options" role="listbox" data-press-options>'
    for key,text in options: markup+=f'<button type="button" role="option" tabindex="-1" data-value="{key}" aria-selected="{str(key==value).lower()}">{text}</button>'
    return markup+'</div><p data-press-no-options hidden>Sonuç bulunamadı.</p></div></div>'

def preview():
    return '<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Basın Bültenleri — Önizleme</title><link rel="stylesheet" href="/Web/wwwroot/css/components/custom-table-feed.css"><link rel="stylesheet" href="/Web/wwwroot/css/components/press-releases.css"><style>body{font-family:Arial,sans-serif;margin:0}main{max-width:820px;padding:28px 24px;margin:auto}</style></head><body><main><section class="ct-feed ct-press" id="press-preview" data-press-feed data-endpoint="/components/press-releases/rows" data-page-size="10"><form class="ct-press__filters" data-press-form>'+selector('category','Kategoriler',CATEGORIES)+selector('period','Tarih',[('3m','3 aylık'),('2026','2026'),('2024','2024'),('2023','2023')],'2026')+'<button type="submit" class="ct-press__submit">Git</button></form><div class="ct-press__info">Yapı Kredi Medya İlişkileri ve İtibar Yönetimi ile <a href="mailto:medyailiskileriveitibaryonetimi@yapikredi.com.tr">medyailiskileriveitibaryonetimi@yapikredi.com.tr</a> e-posta adresinden iletişim kurabilirsiniz.</div><p role="alert" data-press-error hidden></p><div data-press-results>'+result()+'</div><nav class="ct-feed__pagination" data-press-pagination hidden></nav><p class="ct-feed__status" data-press-status role="status"></p></section></main><script src="/Web/wwwroot/js/components/press-releases.js"></script></body></html>'

class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs): super().__init__(*args,directory=str(ROOT),**kwargs)
    def do_GET(self):
        request=urlparse(self.path)
        if request.path == '/Preview/press-releases.html': content=preview()
        elif request.path == '/components/press-releases/rows':
            params=parse_qs(request.query,keep_blank_values=True)
            get=lambda key,default:params.get(key,[default])[0]
            content=result(get('category',''),get('period',''),int(get('page','1')),int(get('pageSize','10')))
        else: return super().do_GET()
        body=content.encode()
        self.send_response(200);self.send_header('Content-Type','text/html; charset=utf-8');self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body)

if __name__=='__main__':
    print('Preview: http://127.0.0.1:8891/Preview/press-releases.html',flush=True)
    ThreadingHTTPServer(('127.0.0.1',8891),Handler).serve_forever()
