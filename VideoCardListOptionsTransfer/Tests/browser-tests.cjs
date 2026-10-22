const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const script = fs.readFileSync(path.join(__dirname, '../Web/wwwroot/js/components/video-card-list.js'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '../Web/wwwroot/css/components/video-card-list.css'), 'utf8');
let checks = 0;

function fixture({ filter = true, title = true, size = 1, columns = 3, id = 'list' } = {}) {
    const years = [2024, 2025, 2025];
    return `<section class="video-card-list" id="${id}" data-video-card-list data-filter-active="${filter}"
        data-unfiltered-title="Video Arşivi" data-page-size="${size}"
        style="--video-card-columns:${columns};--video-card-tablet-columns:${Math.min(columns, 2)}">
        ${title || filter ? '<div class="video-card-list__header">' : ''}
        ${title ? '<h2 class="video-card-list__year" data-video-card-year-heading></h2>' : ''}
        ${filter ? `<div class="video-year-dropdown" data-video-year-dropdown><input data-video-card-year value="2025" type="hidden">
        <button class="video-year-dropdown__trigger" data-video-year-trigger aria-expanded="false"><span data-video-year-selected>2025</span></button>
        <div class="video-year-dropdown__panel" data-video-year-panel hidden><input class="video-year-dropdown__search" data-video-year-search type="search">
        <div class="video-year-dropdown__options" role="listbox"><button class="video-year-dropdown__option" data-video-year-option data-value="2024" tabindex="-1">2024</button>
        <button class="video-year-dropdown__option" data-video-year-option data-value="2025" tabindex="-1">2025</button></div>
        <p data-video-year-empty hidden>Empty</p></div></div>` : ''}
        ${title || filter ? '</div>' : ''}
        <div data-video-card-grid>${years.map((year, i) => `<article data-video-card-item data-year="${year}" data-key="${i}">Video ${i}</article>`).join('')}</div>
        <p data-video-card-empty hidden>Empty</p><nav class="video-card-list__pagination" data-video-card-pagination hidden></nav><p data-video-card-status></p></section>`;
}

(async () => {
    const installedChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
        (fs.existsSync(installedChrome) ? installedChrome : undefined);
    const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
    try {
        const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.route('**/*', route => route.abort());
        async function load(html) {
            await page.goto('about:blank');
            await page.setContent(`<style>${css}</style>${html}`);
            await page.addScriptTag({ content: script });
        }
        async function visibleKeys(id = 'list') {
            return page.locator(`#${id} [data-video-card-item]:visible`).evaluateAll(nodes => nodes.map(n => n.getAttribute('data-key')));
        }
        async function check(name, fn) { await fn(); checks++; console.log('PASS ' + name); }

        for (const filter of [true, false]) for (const title of [true, false]) for (const size of [0, 1]) {
            await check(`filter=${filter}, title=${title}, pageSize=${size}`, async () => {
                await load(fixture({ filter, title, size }));
                assert.deepEqual(await visibleKeys(), size ? [filter ? '1' : '0'] : filter ? ['1', '2'] : ['0', '1', '2']);
                assert.equal(await page.locator('[data-video-card-year-heading]').count(), title ? 1 : 0);
                assert.equal(await page.locator('[data-video-year-dropdown]').count(), filter ? 1 : 0);
                if (title) assert.equal(await page.locator('[data-video-card-year-heading]').textContent(), filter ? '2025' : 'Video Arşivi');
                if (size) {
                    assert.equal(await page.locator('button[aria-label="İlk sayfa"]').count(), 1);
                    assert.equal(await page.locator('button[aria-label="Önceki sayfa"]').isDisabled(), true);
                    await page.locator('button[aria-label="Son sayfa"]').click();
                    assert.deepEqual(await visibleKeys(), ['2']);
                    assert.equal(await page.locator('button[aria-label="Sonraki sayfa"]').isDisabled(), true);
                    await page.locator('button[aria-label="İlk sayfa"]').click();
                } else assert.equal(await page.locator('[data-video-card-pagination]').isVisible(), false);
                assert.equal(page.url(), 'about:blank');
            });
        }
        await check('searchable dropdown selects year and resets pagination', async () => {
            await load(fixture());
            await page.locator('button[aria-label="Son sayfa"]').click();
            await page.locator('[data-video-year-trigger]').click();
            assert.equal(await page.locator('[data-video-year-panel]').isVisible(), true);
            await page.locator('[data-video-year-search]').fill('2024');
            assert.equal(await page.locator('[data-video-year-option]:visible').count(), 1);
            await page.locator('[data-video-year-option][data-value="2024"]').click();
            assert.deepEqual(await visibleKeys(), ['0']);
            assert.equal(await page.locator('[data-video-card-year-heading]').textContent(), '2024');
            assert.equal(await page.locator('[data-video-year-panel]').isVisible(), false);
            assert.equal(page.url(), 'about:blank');
        });
        await check('dropdown keyboard and empty-search behavior', async () => {
            await load(fixture());
            await page.locator('[data-video-year-trigger]').click();
            await page.locator('[data-video-year-search]').fill('1999');
            assert.equal(await page.locator('[data-video-year-empty]').isVisible(), true);
            await page.locator('[data-video-year-search]').press('Escape');
            assert.equal(await page.locator('[data-video-year-panel]').isVisible(), false);
            await page.locator('[data-video-year-trigger]').press('ArrowDown');
            await page.locator('[data-video-year-search]').fill('2024');
            await page.locator('[data-video-year-search]').press('Enter');
            assert.deepEqual(await visibleKeys(), ['0']);
        });
        await check('multiple instances and repeat initialization stay independent', async () => {
            await load(fixture({ id: 'a', filter: false }) + fixture({ id: 'b' }));
            await page.evaluate(() => { window.YKB.initVideoCardLists(); window.YKB.initVideoCardLists(); });
            await page.locator('#a button[aria-label="Sonraki sayfa"]').click();
            assert.deepEqual(await visibleKeys('a'), ['1']);
            assert.deepEqual(await visibleKeys('b'), ['1']);
            assert.equal(await page.locator('#a button[aria-current="page"]').textContent(), '2');
        });
        await check('empty lists work without heading or dropdown', async () => {
            await load(fixture({ title: false }).replace(/<article.*?<\/article>/g, ''));
            assert.equal(await page.locator('[data-video-card-empty]').isVisible(), true);
            assert.equal(await page.locator('[data-video-card-pagination]').isVisible(), false);
        });
        for (const columns of [1, 3, 4, 8]) {
            await check(`responsive grid for RowCardCount=${columns}`, async () => {
                await load(fixture({ columns, filter: false, size: 0 }));
                for (const [width, expected] of [[1200, columns], [800, Math.min(columns, 2)], [390, 1]]) {
                    await page.setViewportSize({ width, height: 900 });
                    const count = await page.locator('[data-video-card-grid]').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length);
                    assert.equal(count, expected);
                }
            });
        }
        await check('video modal keeps autoplay off, moves to body and clears iframe on close', async () => {
            await load(fixture({ filter: false }) + '<div id="holder"><div id="video-modal" data-video-card-modal><iframe data-video-card-iframe data-embed-url="https://www.youtube.com/embed/ERvbmC3_TiU?autoplay=1"></iframe></div></div>');
            await page.evaluate(() => document.querySelector('#video-modal').dispatchEvent(new Event('show.bs.modal')));
            const src = await page.locator('iframe').getAttribute('src');
            assert.equal(new URL(src).searchParams.get('autoplay'), '0');
            assert.equal(new URL(src).searchParams.get('playsinline'), '1');
            assert.equal(await page.locator('#video-modal').evaluate(el => el.parentElement === document.body), true);
            await page.evaluate(() => document.querySelector('#video-modal').dispatchEvent(new Event('hidden.bs.modal')));
            assert.equal(await page.locator('iframe').getAttribute('src'), null);
        });
        await check('merged CSS keeps 170px images, mobile ratio, 24px modal padding and dropdown arrow', async () => {
            await page.setViewportSize({ width: 1200, height: 900 });
            await load(fixture({ filter: true, size: 0 }) + '<div class="video-card-modal"><div class="modal-dialog"><div class="modal-content"><div class="modal-body"><div class="video-card-modal__frame"></div></div></div></div></div>');
            await page.evaluate(() => {
                document.querySelector('[data-video-card-item][data-key="1"]').innerHTML = '<div class="video-card-item__media"><img alt=""></div>';
                document.querySelector('[data-video-year-trigger]').insertAdjacentHTML('beforeend', '<span class="video-year-dropdown__arrow"></span>');
            });
            assert.equal(await page.locator('.video-card-item__media').evaluate(el => getComputedStyle(el).height), '170px');
            assert.equal(await page.locator('.modal-body').evaluate(el => getComputedStyle(el).padding), '24px');
            assert((await page.locator('.modal-dialog').boundingBox()).width <= 800);
            await page.locator('[data-video-year-trigger]').click();
            assert.notEqual(await page.locator('.video-year-dropdown__arrow').evaluate(el => getComputedStyle(el).transform), 'none');
            await page.setViewportSize({ width: 390, height: 900 });
            const box = await page.locator('.video-card-item__media').boundingBox();
            assert(Math.abs(box.width / box.height - 16 / 9) < 0.02);
        });
        assert.deepEqual(errors, []);
        console.log(`${checks} browser scenarios passed.`);
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
