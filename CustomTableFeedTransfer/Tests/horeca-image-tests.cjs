const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
let JSDOM;
try { ({ JSDOM } = require('jsdom')); }
catch { ({ JSDOM } = require('/tmp/ykb-export-check/node_modules/jsdom')); }
const base = path.join(__dirname, '..');
const core = fs.readFileSync(path.join(base, 'Web/wwwroot/js/components/custom-table-feed.js'), 'utf8');
const extension = fs.readFileSync(path.join(base, 'Web/wwwroot/js/components/horeca-restaurants.js'), 'utf8');
const fixture = fs.readFileSync(path.join(__dirname, 'horeca-fixture.html'), 'utf8');

function setup(reverse, prepare = () => {}) {
    const dom = new JSDOM('<body>' + fixture + '</body>', { url: 'https://example.test/restaurants', runScripts: 'outside-only' });
    const w = dom.window, d = w.document;
    const timers = new Map(), requests = [], warnings = [], outcomes = new WeakMap();
    let now = 0, nextId = 0;
    w.Date.now = () => now;
    w.setTimeout = (callback, delay = 0) => {
        const id = ++nextId; timers.set(id, { at: now + delay, callback }); return id;
    };
    w.clearTimeout = id => timers.delete(id);
    w.console.warn = (...args) => warnings.push(args);
    w.IntersectionObserver = class { constructor() { throw Error('All images must load without viewport observation'); } };
    function mark(image, complete, width) {
        if (!outcomes.has(image)) {
            Object.defineProperty(image, 'complete', { configurable: true, get: () => outcomes.get(image).complete });
            Object.defineProperty(image, 'naturalWidth', { configurable: true, get: () => outcomes.get(image).width });
        }
        outcomes.set(image, { complete, width });
    }
    d.querySelectorAll('img').forEach(image => mark(image, false, 0));
    const src = Object.getOwnPropertyDescriptor(w.HTMLImageElement.prototype, 'src');
    Object.defineProperty(w.HTMLImageElement.prototype, 'src', {
        configurable: true, get() { return src.get.call(this); },
        set(value) {
            requests.push({ image: this, source: value, at: now });
            mark(this, false, 0); src.set.call(this, value);
        }
    });
    w.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
    w.HTMLDialogElement.prototype.close = function () { this.open = false; this.dispatchEvent(new w.Event('close')); };
    prepare({ w, d, mark });
    if (reverse) { w.eval(extension); w.eval(core); } else { w.eval(core); w.eval(extension); }
    function advance(milliseconds) {
        const until = now + milliseconds;
        let turns = 0;
        for (;;) {
            const entry = [...timers].filter(([, t]) => t.at <= until).sort((a, b) => a[1].at - b[1].at)[0];
            if (!entry) break;
            assert(++turns < 1000, 'timer loop must remain bounded');
            timers.delete(entry[0]); now = entry[1].at; entry[1].callback();
        }
        now = until;
    }
    function result(image, success) {
        mark(image, true, success ? 96 : 0);
        image.dispatchEvent(new w.Event(success ? 'load' : 'error'));
    }
    return { dom, w, d, requests, timers, warnings, advance, mark, result,
        first: d.querySelector('.ct-restaurant__logo img') };
}

for (const reverse of [false, true]) {
    // The native browser receives every URL in the initial HTML, including hidden content.
    let h = setup(reverse);
    const images = [...h.d.querySelectorAll('.ct-restaurant__logo img, .ct-restaurant__thumbnail img')];
    assert(images.length > 6);
    assert(images.every(image => image.getAttribute('src') && image.getAttribute('loading') === 'eager'));
    assert(h.d.querySelector('[data-restaurant-city="izmir"][hidden] img[src]'));
    assert(h.d.querySelector('[data-horeca-collapse][aria-hidden="true"] img[src]'));
    assert.equal(h.d.querySelectorAll('[data-horeca-src]').length, 0);
    assert.equal(h.requests.length, 0, 'normal loads are never delayed or reassigned by JavaScript');
    assert.equal(h.timers.size, 0, 'pending images do not create retry timers');
    images.forEach(image => h.result(image, true));
    h.d.querySelector('[data-horeca-tab="izmir"]').click();
    h.d.querySelector('[data-horeca-tab="istanbul"]').click();
    h.d.querySelector('[data-horeca-toggle]').click();
    h.w.eval(extension);
    assert.equal(h.requests.length, 0, 'successful images stay untouched through tabs/branches/duplicate bundle');
    assert.equal(h.timers.size, 0);
    h.dom.window.close();

    // Only failed images retry; preserve signed URLs and stop after three retries.
    h = setup(reverse, ({ d }) => d.querySelector('img').setAttribute('src', '/getmedia/test/logo.webp?hash=original&width=96'));
    h.result(h.first, false); h.result(h.first, false);
    assert.equal(h.timers.size, 1, 'duplicate errors share one retry timer');
    const delays = [60000, 120000, 240000];
    for (let n = 0; n < delays.length; n++) {
        h.advance(delays[n] - 1); assert.equal(h.requests.length, n);
        h.advance(1); assert.equal(h.requests.length, n + 1);
        assert.equal(h.requests[n].image, h.first);
        assert.equal(h.requests[n].source, '/getmedia/test/logo.webp?hash=original&width=96');
        h.result(h.first, false);
    }
    h.advance(1000000); assert.equal(h.requests.length, 3, 'permanent errors never loop indefinitely');
    assert.equal(h.warnings.length, 1);
    h.dom.window.close();

    // A late success cancels retry, and a missed load event is detected before reassignment.
    h = setup(reverse);
    h.result(h.first, false); h.result(h.first, true);
    assert.equal(h.timers.size, 0); h.advance(60000); assert.equal(h.requests.length, 0);
    h.result(h.first, false); h.mark(h.first, true, 96);
    h.advance(60000); assert.equal(h.requests.length, 0);
    h.result(h.first, false); h.mark(h.first, false, 0);
    h.advance(60000); assert.equal(h.requests.length, 0, 'in-flight loads are not interrupted');
    h.dom.window.close();

    // Cached failure before bundle initialization, even in an inactive city/closed branch.
    h = setup(reverse, ({ d, mark }) => {
        mark(d.querySelector('[data-restaurant-city="izmir"] img'), true, 0);
        mark(d.querySelector('.ct-restaurant__thumbnail img'), true, 0);
    });
    assert.equal(h.timers.size, 2);
    h.advance(60000); assert.equal(h.requests.length, 2);
    h.requests.forEach(request => h.result(request.image, true));
    assert.equal(h.timers.size, 0);
    h.dom.window.close();

    // A source change or detached image must not resurrect an obsolete failed request.
    h = setup(reverse);
    const old = h.first.getAttribute('src');
    h.result(h.first, false); h.first.src = '/new-logo.webp';
    h.advance(60000);
    assert.equal(h.requests.length, 1); assert.equal(h.first.getAttribute('src'), '/new-logo.webp');
    assert.notEqual(h.first.getAttribute('src'), old);
    h.result(h.first, false); h.first.remove(); h.advance(60000);
    assert.equal(h.requests.length, 1);
    h.dom.window.close();

    // Gallery navigation/close cancels old retries, without delaying direct image display.
    h = setup(reverse);
    h.d.querySelector('[data-ct-pagination] [aria-label="2. sayfa"]').click();
    h.d.querySelector('[data-ct-row]:not([hidden]) [data-horeca-image]').click();
    const large = h.d.querySelector('dialog img');
    assert(large.src.endsWith('horeca-gallery-1.svg'));
    h.result(large, false); assert.equal(h.timers.size, 1);
    h.d.querySelector('[data-horeca-next]').click();
    assert(large.src.endsWith('horeca-gallery-2.svg'));
    assert.equal(h.timers.size, 0);
    h.result(large, false); h.d.querySelector('[data-horeca-close]').click();
    h.advance(60000);
    assert.equal(large.hasAttribute('src'), false); assert.equal(h.requests.length, 2);
    h.dom.window.close();
}
console.log('PASS: eager initial URLs for all cities/pages/closed galleries, no JS load queue, failed-only retries, three-retry limit, success/in-flight checks, cached failures, signed URLs, obsolete-source/detachment guards, gallery navigation, both bundle orders.');
