/* Optional developer runner: exercises the browser-console exporter against live HTML.
 * Requires Playwright + Chrome/Chromium. Does not connect to Kentico or write DB rows.
 * node Tests/export-live.cjs /path/to/downloaded-live.html
 */
const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'Export');
const sourceUrl = 'https://www.yapikredi.com.tr/bireysel-bankacilik/yatirim-urunleri/hisse-senetleri/halka-arz-takvimi';

(async () => {
    const html = process.argv[2] ? await fs.readFile(process.argv[2], 'utf8') : await (await fetch(sourceUrl)).text();
    const articles = html.match(/<article\b[^>]*class="index-list"[^>]*>[\s\S]*?<\/article>/g) || [];
    assert(articles.length > 0);
    const chrome = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    const browser = await chromium.launch({ headless: true, ...(fsSync.existsSync(chrome) ? { executablePath: chrome } : {}) });
    try {
        const page = await browser.newPage();
        await page.route('**/*', route => {
            if (route.request().isNavigationRequest() && route.request().url() === sourceUrl) {
                return route.fulfill({ contentType: 'text/html; charset=utf-8', body: '<meta charset="utf-8">' + articles.join('\n') });
            }
            return route.abort();
        });
        await page.goto(sourceUrl);
        await page.addScriptTag({ path: path.join(root, 'Scripts/export-ipo-calendar.console.js') });
        await page.exposeFunction('ipoFetchBytes', async url => {
            const parsed = new URL(url);
            assert.equal(parsed.origin, 'https://www.yapikredi.com.tr');
            assert(parsed.pathname.startsWith('/medium/file/'));
            const response = await fetch(url);
            return { status: response.status, bytes: [...new Uint8Array(await response.arrayBuffer())] };
        });
        await page.exposeFunction('ipoWriteFile', async (folder, name, content) => {
            assert(folder === '' || folder === 'images');
            assert(/^[a-z0-9._-]+$/i.test(name) && !name.startsWith('.'));
            const directory = path.join(output, folder);
            await fs.mkdir(directory, { recursive: true });
            await fs.writeFile(path.join(directory, name), typeof content === 'string' ? content : Buffer.from(content));
        });
        const result = await page.evaluate(async () => {
            window.fetch = async url => {
                const result = await window.ipoFetchBytes(url);
                return new Response(new Uint8Array(result.bytes), { status: result.status });
            };
            function directory(folder) {
                return {
                    getDirectoryHandle: async name => directory(name),
                    getFileHandle: async name => ({ createWritable: async () => ({
                        write: async content => window.ipoWriteFile(folder, name, typeof content === 'string' ? content : [...content]),
                        close: async () => {}
                    }) })
                };
            }
            return window.YkbIpoExport.exportToDirectory(directory(''));
        });
        assert.equal(result.length, articles.length);
        for (const row of result) {
            assert(row.imageFileName.match(/\.(webp|png|jpg|gif|avif|svg)$/));
            assert((await fs.stat(path.join(output, 'images', row.imageFileName))).size > 0);
        }
        const json = JSON.parse(await fs.readFile(path.join(output, 'halka-arz-takvimi.json'), 'utf8'));
        assert.deepEqual(json, result);
        console.log(`${result.length} live rows and images exported; JSON/file matching verified.`);
        const info = { sourceUrl, verifiedAt: new Date().toISOString(), records: result.length,
            images: result.length, years: [...new Set(result.map(row => row.year))],
            crossMonthRecords: result.filter(row => row.days.split(',').map(Number)
                .some((day, index, days) => index > 0 && day < days[index - 1])).map(row => row.stockCode) };
        await fs.writeFile(path.join(root, 'Tests/live-export-verification.json'), JSON.stringify(info, null, 2));
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
