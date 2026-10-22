const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const rows = JSON.parse(fs.readFileSync(path.join(root, 'Export/halka-arz-takvimi.json'), 'utf8'));
function esc(value) { return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]); }
// Önizleme için aynı veri sözleşmesi. Üretimde C# IpoCalendarDates çalışır.
function formatDate(row) {
    const names = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
    const days = row.days.match(/\d+/g).map(Number);
    const segments = [];
    let month = row.month, year = row.year, previous = 0;
    for (const day of days) {
        if (day < previous) { month++; if (month === 13) { month = 1; year++; } }
        if (!segments.length || segments.at(-1).month !== month || segments.at(-1).year !== year) segments.push({ month, year, days: [] });
        segments.at(-1).days.push(day); previous = day;
    }
    const crossesYear = segments.some(s => s.year !== row.year);
    const text = segments.map(s => `${s.days.join('-')} ${names[s.month - 1]}${crossesYear ? ' ' + s.year : ''}`).join(' - ');
    return text + (crossesYear ? '' : ' ' + row.year);
}
function markup(pageSize = 0, id = 'ipo-preview') {
    const groups = [...new Set(rows.map(r => r.year))].map(year => {
        const articles = rows.filter(r => r.year === year).map(row => {
            const startDay = Number(row.days.match(/\d+/)[0]);
            const date = `${year}-${String(row.month).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`;
            return `<article class="index-list" data-ct-row data-stock-code="${esc(row.stockCode)}" data-date="${date}">
                <div class="il-badge" aria-hidden="true">&nbsp;</div>
                <a class="ipo-calendar__logo-link" href="${esc(row.url)}"><img class="slogo" src="../Export/images/${esc(row.imageFileName)}" alt="${esc(row.title)}" loading="eager" decoding="async" data-ipo-image></a>
                <div class="il-content"><p class="subTxt">${esc(row.stockCode)}</p><div class="title-with-red-badge"><h3 class="il-halka-arz-sirket"><a href="${esc(row.url)}">${esc(row.title)}</a></h3></div><p class="ipo-calendar__date"><time>${esc(formatDate(row))}</time></p></div></article>`;
        }).join('');
        return `<section class="ipo-calendar__year" data-ipo-year-group data-year="${year}"><h2 class="ipo-calendar__year-title">${year} Halka Arzları</h2>${articles}</section>`;
    }).join('');
    return `<section class="ct-feed" id="${id}" data-ct-feed data-kind="ipo-calendar" data-feed-mode="client" data-page-size="${pageSize}"><h2 class="ct-feed__title">Halka Arz Listesi</h2><form data-ct-filters hidden aria-hidden="true"></form><div class="ipo-calendar" data-ipo-calendar>${groups}</div><p class="ct-feed__empty" data-ct-empty hidden>Kayıt bulunamadı.</p><nav class="ct-feed__pagination" data-ct-pagination aria-label="Liste sayfaları" hidden></nav><p class="ct-feed__status" data-ct-status role="status" aria-live="polite" aria-atomic="true"></p></section>`;
}
function html(pageSize = 0, feeds = 1) {
    return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Halka Arz Takvimi — önizleme</title>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Ubuntu:300,400,500,700&subset=latin,latin-ext&display=swap">
    <link rel="stylesheet" href="vendor/custom-table-feed.css"><link rel="stylesheet" href="../Web/wwwroot/css/components/ipo-calendar.css">
    <style>body{margin:0;background:#fff}main{box-sizing:border-box;max-width:885px;margin:0 auto;padding:32px 32px 0;font-family:Ubuntu,sans-serif;font-size:10px;line-height:10px}</style></head><body><main>
    ${Array.from({ length: feeds }, (_, i) => markup(pageSize, 'ipo-preview-' + i)).join('')}
    </main><script src="vendor/custom-table-feed.js"></script><script src="../Web/wwwroot/js/components/ipo-calendar.js"></script></body></html>`;
}
function build() {
    const directory = path.join(root, 'Preview');
    fs.mkdirSync(path.join(directory, 'vendor'), { recursive: true });
    const repo = path.resolve(root, '..');
    for (const [type, ext] of [['js', 'js'], ['css', 'css']]) {
        fs.copyFileSync(path.join(repo, `CustomTableFeedTransfer/Web/wwwroot/${type}/components/custom-table-feed.${ext}`), path.join(directory, `vendor/custom-table-feed.${ext}`));
    }
    fs.writeFileSync(path.join(directory, 'index.html'), html());
}
if (require.main === module) build();
module.exports = { html, rows, build, formatDate };
