const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function data() { return ['2026-ve-sonrasi','2026-oncesi'].flatMap(group => JSON.parse(fs.readFileSync(path.join(root,'Export',group,'fund-guides.json'),'utf8')).map(row => ({...row,group}))); }
function markup(rows, size, index) {
 const id = 'fund-guide-'+index;
 const years = [...new Set(rows.map(row=>row.year))].sort((a,b)=>b-a);
 const latest = years[0] || 0;
 return `<section id="feed-${index}" class="ct-feed" data-ct-feed data-kind="fund-guide" data-feed-mode="client" data-page-size="${size}"><div class="fund-guide" data-fund-guide>
 <form class="fund-guide__filters" data-ct-filters><div class="fund-guide__field"><span class="fund-guide__label" id="${id}-label">Tarih</span><div class="fund-guide__select" data-fg-select><input type="hidden" data-fg-year value="${latest}"><button type="button" class="fund-guide__trigger" data-fg-trigger aria-haspopup="listbox" aria-expanded="false" aria-labelledby="${id}-label ${id}-selected" aria-controls="${id}-panel" ${years.length?'':'disabled'}><span id="${id}-selected" data-fg-selected>${latest||'Seçiniz'}</span><span class="fund-guide__arrow"></span></button><div class="fund-guide__panel" id="${id}-panel" data-fg-panel hidden><input type="search" class="fund-guide__search" data-fg-search aria-label="Yıl ara" aria-controls="${id}-options"><div class="fund-guide__options" id="${id}-options" role="listbox">${years.map(year=>`<button type="button" class="fund-guide__option" data-fg-option data-value="${year}" role="option" aria-selected="${year===latest}" tabindex="-1">${year}</button>`).join('')}</div><p data-fg-no-year hidden>Yıl bulunamadı.</p></div></div></div><button class="fund-guide__submit" type="submit" ${years.length?'':'disabled'}>Göster</button></form>
 ${years.map(year=>`<div class="fund-guide__table-wrap" data-fg-group data-year="${year}" ${year===latest?'':'hidden'}><table class="fund-guide__table fund-guide__table--${year>=2026?'monthly':'legacy'}"><thead><tr>${year>=2026?'<th>Fon Rehberi</th>':'<th>Fon Kod</th><th>Fon Adı</th>'}</tr></thead><tbody>${rows.filter(row=>row.year===year).map(row=>{const url='../Export/'+row.group+'/files/'+row.fileName; const link=text=>`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(text)}</a>`;return `<tr data-ct-row data-year="${year}">${year>=2026?`<td>${link(row.title)}</td>`:`<td>${link(row.fundCode)}</td><td>${link(row.fundName)}</td>`}</tr>`;}).join('')}</tbody></table></div>`).join('')}
 </div><p class="ct-feed__empty" data-ct-empty hidden>Aramanıza uygun kayıt bulunamadı.</p><nav class="ct-feed__pagination" data-ct-pagination aria-label="Liste sayfaları" hidden></nav><p class="ct-feed__status" data-ct-status role="status" aria-live="polite"></p></section>`;
}
function html(size=0, feeds=1, customRows) {
 const rows=customRows||data();
 return `<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Fon Rehberi — önizleme</title><link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Ubuntu:300,400,500,700&subset=latin,latin-ext&display=swap"><link rel="stylesheet" href="vendor/custom-table-feed.css"><link rel="stylesheet" href="../Web/wwwroot/css/components/fund-guide.css"><style>body{margin:0;background:#fff}main{max-width:885px;box-sizing:border-box;margin:auto;padding:32px;font-family:Ubuntu,Arial,sans-serif}section+section{margin-top:40px}</style><main>${Array.from({length:feeds},(_,i)=>markup(rows,size,i)).join('')}</main><script src="vendor/custom-table-feed.js"></script><script src="../Web/wwwroot/js/components/fund-guide.js"></script></html>`;
}
function build() { fs.writeFileSync(path.join(root,'Preview/index.html'),html()); }
module.exports={html,data,build};
if(require.main===module) build();
