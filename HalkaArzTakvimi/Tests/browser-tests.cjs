const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');
const { html, rows, build, formatDate } = require('./build-preview.cjs');
const dateCases = require('./source-date-cases.json');
const root = path.resolve(__dirname, '..');
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.json': 'application/json' };

(async () => {
    build();
    let checks = 0;
    const server = http.createServer(async (request, response) => {
        try {
            const url = new URL(request.url, 'http://localhost');
            if (url.pathname === '/Preview/case.html') {
                response.setHeader('Content-Type', mime['.html']);
                return response.end(html(Number(url.searchParams.get('size') || '0'), Number(url.searchParams.get('feeds') || '1')));
            }
            const file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
            if (!file.startsWith(root + path.sep)) { response.writeHead(403); return response.end(); }
            response.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
            response.end(await fs.readFile(file));
        } catch { response.writeHead(404); response.end(); }
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    const chrome = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    const browser = await chromium.launch({ headless: true, ...(fsSync.existsSync(chrome) ? { executablePath: chrome } : {}) });
    try {
        const page = await browser.newPage({ viewport: { width: 885, height: 700 } });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        async function load(size = 0, feeds = 1) {
            await page.goto(`${base}/Preview/case.html?size=${size}&feeds=${feeds}`, { waitUntil: 'networkidle' });
            await page.evaluate(() => document.fonts.ready);
        }
        const count = id => page.locator(`${id || ''} [data-ct-row]:visible`).count();
        const years = id => page.locator(`${id || ''} [data-ipo-year-group]:visible`).evaluateAll(nodes => nodes.map(n => Number(n.dataset.year)));
        async function check(name, fn) { await fn(); checks++; console.log('PASS ' + name); }

        await check('PageSize=0 renders all 107 rows, all years and no pagination', async () => {
            await load();
            assert.equal(await count(), rows.length);
            assert.deepEqual(await years(), [2026, 2025, 2024, 2023]);
            assert.equal(await page.locator('[data-ct-pagination]').isVisible(), false);
        });
        await check('PageSize=10 hides years without rows on the current page', async () => {
            await load(10);
            assert.equal(await count(), 10);
            assert.deepEqual(await years(), [2026]);
            const before = page.url();
            await page.locator('button[aria-label="Son sayfa"]').click();
            assert.equal(await count(), rows.length % 10);
            assert.deepEqual(await years(), [2023]);
            assert.equal(page.url(), before);
            assert.equal(await page.locator('button[aria-label="Sonraki sayfa"]').isDisabled(), true);
            assert.equal(await page.locator('button[aria-label="İlk sayfa"]').count(), 1);
        });
        await check('page crossing a year boundary shows both matching headings', async () => {
            await load(10);
            await page.locator('button[aria-label="3. sayfa"]').click();
            assert.equal(await count(), 10);
            assert.deepEqual(await years(), [2026, 2025]);
        });
        await check('rows are globally ordered by start date descending', async () => {
            await load();
            const dates = await page.locator('[data-ct-row]').evaluateAll(nodes => nodes.map(n => n.dataset.date));
            assert.deepEqual(dates, dates.slice().sort().reverse());
        });
        await check('repeat initialization and two feeds remain independent', async () => {
            await load(1, 2);
            await page.evaluate(() => { window.YKB.IpoCalendar.init(); window.YKB.CustomTableFeeds.init(); });
            await page.locator('#ipo-preview-0 button[aria-label="Sonraki sayfa"]').click();
            assert.equal(await page.locator('#ipo-preview-0 [data-ct-row]:visible').getAttribute('data-stock-code'), rows[1].stockCode);
            assert.equal(await page.locator('#ipo-preview-1 [data-ct-row]:visible').getAttribute('data-stock-code'), rows[0].stockCode);
        });
        await check('live typography, 60px logo and 15px content offset are preserved', async () => {
            await load();
            const measurements = await page.locator('[data-ct-row]').first().evaluate(article => {
                function style(selector) { return getComputedStyle(article.querySelector(selector)); }
                return { image: style('img').width, code: style('.subTxt').fontSize,
                    title: style('h3').fontSize, date: style('time').fontSize,
                    padding: style('.il-content').paddingLeft,
                    fontLoaded: document.fonts.check('400 20px Ubuntu') };
            });
            assert.deepEqual(measurements, { image: '60px', code: '16px', title: '20px', date: '13px', padding: '15px', fontLoaded: true });
        });
        await check('320px, 390px and desktop layouts have no horizontal overflow', async () => {
            for (const width of [320, 390, 885]) {
                await page.setViewportSize({ width, height: 800 });
                assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
            }
        });
        await check('visible rows use downloaded matching image files', async () => {
            await page.setViewportSize({ width: 885, height: 800 });
            const first = page.locator('[data-ct-row] img').first();
            await first.scrollIntoViewIfNeeded();
            await first.evaluate(image => image.decode());
            assert.equal(await first.evaluate(image => image.naturalWidth > 0), true);
        });
        await check('all live date strings parse, including eight cross-month cases', async () => {
            await page.addScriptTag({ path: path.join(root, 'Scripts/export-ipo-calendar.console.js') });
            const parsed = await page.evaluate(data => data.map(row => window.YkbIpoExport.parseDate(row.dateText)), dateCases);
            assert.equal(parsed.length, 107);
            assert.equal(parsed.filter(row => row.dateParts.length > 1).length, 8);
            for (let i = 0; i < parsed.length; i++) {
                assert.equal(parsed[i].days, rows[i].days);
                assert.equal(parsed[i].month, rows[i].month);
            }
        });
        await check('invalid dates are rejected and leap-day parsing works', async () => {
            const result = await page.evaluate(() => {
                const api = window.YkbIpoExport;
                function rejected(value) { try { api.parseDate(value); return false; } catch { return true; } }
                return { invalid: rejected('31 Şubat 2026'), leap: api.parseDate('28-29 Şubat - 1 Mart 2024').days };
            });
            assert.deepEqual(result, { invalid: true, leap: '28,29,1' });
        });
        await check('display dates are generated only from Days/Month/Year for all 107 records', async () => {
            for (const row of rows) {
                assert.equal('dateText' in row, false);
                assert.equal('dateParts' in row, false);
                const source = dateCases.find(c => c.stockCode === row.stockCode);
                const expected = source.dateText.replace(/,\s*(?=\d{1,2}\s+[A-Za-zÇĞİÖŞÜçğıöşü])/, ' - ');
                assert.equal(formatDate(row), expected);
                assert.equal(await page.locator(`[data-stock-code="${row.stockCode}"] time`).textContent(), expected);
            }
            assert.equal(formatDate({ days: '30,31,1', month: 12, year: 2026 }), '30-31 Aralık 2026 - 1 Ocak 2027');
        });
        await page.goto(`${base}/Preview/index.html`, { waitUntil: 'networkidle' });
        await page.evaluate(() => document.fonts.ready);
        assert.equal(await page.locator('[data-ct-feed]').count(), 1);
        assert.equal(await count(), 107);
        await page.screenshot({ path: path.join(root, 'Preview/desktop.png') });
        await page.setViewportSize({ width: 390, height: 844 });
        await page.evaluate(async () => {
            await Promise.all([...document.images].slice(0, 10).map(image => {
                image.loading = 'eager';
                return image.decode().catch(() => {});
            }));
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        });
        assert.equal(await page.locator('.ct-feed__title').count(), 1);
        assert.equal(await count(), 107);
        await page.screenshot({ path: path.join(root, 'Preview/mobile.png') });
        assert.deepEqual(errors, []);
        console.log(`${checks} browser scenarios passed.`);
    } finally {
        await browser.close();
        await new Promise(resolve => server.close(resolve));
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
