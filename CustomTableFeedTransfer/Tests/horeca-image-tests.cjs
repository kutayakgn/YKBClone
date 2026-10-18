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

function setup(reverse, withObserver = true, twoFeeds = false) {
    const html = fixture + (twoFeeds ? fixture.replaceAll('horeca-test', 'horeca-other').replace('data-page-size="2"', 'data-page-size="0"') : '');
    const dom = new JSDOM('<body>' + html + '</body>', { url: 'https://example.test/restaurants', runScripts: 'outside-only' });
    const w = dom.window, d = w.document;
    const timers = new Map(), requests = [], active = new Set(), warnings = [], observers = [];
    let now = 0, nextId = 0;
    w.Date.now = () => now;
    w.setTimeout = (callback, delay = 0) => {
        const id = ++nextId; timers.set(id, { at: now + delay, callback }); return id;
    };
    w.clearTimeout = id => timers.delete(id);
    w.console.warn = (...args) => warnings.push(args);
    if (withObserver) w.IntersectionObserver = class {
        constructor(callback) { this.callback = callback; this.targets = new Set(); observers.push(this); }
        observe(image) { this.targets.add(image); }
        unobserve(image) { this.targets.delete(image); }
    };
    const src = Object.getOwnPropertyDescriptor(w.HTMLImageElement.prototype, 'src');
    Object.defineProperty(w.HTMLImageElement.prototype, 'src', {
        configurable: true, get() { return src.get.call(this); },
        set(value) {
            requests.push({ image: this, source: value, at: now }); active.add(this);
            assert(active.size <= 2, 'no more than two native image requests may be active page-wide');
            src.set.call(this, value);
        }
    });
    const remove = w.Element.prototype.removeAttribute;
    w.Element.prototype.removeAttribute = function (name) {
        if (this.tagName === 'IMG' && name === 'src') active.delete(this);
        return remove.call(this, name);
    };
    w.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
    w.HTMLDialogElement.prototype.close = function () { this.open = false; this.dispatchEvent(new w.Event('close')); };
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
    function near(image, isIntersecting = true) {
        const observer = observers.find(o => o.targets.has(image));
        assert(observer, 'image must be observed');
        observer.callback([{ target: image, isIntersecting }]);
    }
    function result(image, success) {
        active.delete(image);
        image.dispatchEvent(new w.Event(success ? 'load' : 'error'));
    }
    return { dom, w, d, requests, active, warnings, observers, advance, near, result,
        first: d.querySelector('.ct-restaurant__logo img') };
}

for (const reverse of [false, true]) {
    // No image request can escape the queue during HTML parsing, even on PageSize=0.
    let h = setup(reverse, true, true);
    assert.equal(h.requests.length, 0);
    assert.equal(h.d.querySelectorAll('img[src]').length, 0);
    assert.equal(h.observers.length, 1, 'all feed instances share one viewport observer');
    const logos = [...h.d.querySelectorAll('.ct-restaurant__logo img')].filter(img => !img.closest('[hidden]'));
    logos.forEach(img => h.near(img));
    assert.equal(h.requests.length, 1);
    h.advance(999); assert.equal(h.requests.length, 1);
    h.advance(1); assert.equal(h.requests.length, 2);
    h.advance(1000); assert.equal(h.requests.length, 2, 'concurrency blocks a third request');
    h.result(logos[0], true); assert.equal(h.requests.length, 3);
    for (let n = 1; n < h.requests.length; n++) assert(h.requests[n].at - h.requests[n - 1].at >= 1000);
    h.dom.window.close();

    // HTTP status is unavailable on <img>; any error invokes conservative global backoff.
    h = setup(reverse);
    h.first.setAttribute('data-horeca-src', '/getmedia/test/logo.webp?hash=original&width=96');
    h.w.YKB.CustomTableFeeds.init(); // no duplicate factory or network start
    h.d.querySelector('#horeca-test').dispatchEvent(new h.w.CustomEvent('ykb:customtablefeed-rendered'));
    h.near(h.first);
    h.result(h.first, false);
    h.advance(59999); assert.equal(h.requests.length, 1, 'no rapid retry in a rate-limit window');
    h.advance(1); assert.equal(h.requests.length, 2);
    assert.equal(h.requests[1].source, '/getmedia/test/logo.webp?hash=original&width=96', 'cache keys/signed queries stay unchanged');
    h.result(h.first, false);
    h.advance(120000); assert.equal(h.requests.length, 2, 'one retry maximum; permanent errors never loop');
    assert.equal(h.warnings.length, 2);
    h.dom.window.close();

    h = setup(reverse);
    const second = h.d.querySelectorAll('.ct-restaurant__logo img')[1];
    h.near(h.first); h.near(second); h.result(h.first, false);
    h.advance(59999); assert.equal(h.requests.length, 1, 'backoff pauses other queued images too');
    h.advance(1); assert.equal(h.requests.length, 2);
    h.dom.window.close();

    // Scroll, city, page and branch visibility determine eligibility before starting a request.
    h = setup(reverse);
    h.advance(1000); assert.equal(h.requests.length, 0, 'offscreen images do not load');
    const izmir = h.d.querySelector('[data-restaurant-city="izmir"] img');
    h.near(izmir); assert.equal(h.requests.length, 0, 'inactive city remains deferred');
    h.d.querySelector('[data-horeca-tab="izmir"]').click();
    assert.equal(h.requests.length, 1); h.result(izmir, true);
    h.d.querySelector('[data-horeca-tab="istanbul"]').click();
    h.near(h.first); h.advance(1000); h.result(h.first, true);
    const count = h.requests.length;
    h.d.querySelector('[data-horeca-tab="izmir"]').click();
    h.d.querySelector('[data-horeca-tab="istanbul"]').click();
    h.advance(1000); assert.equal(h.requests.length, count, 'tab revisits do not reassign loaded sources');
    const toggle = h.d.querySelector('[data-horeca-toggle]');
    const thumb = toggle.closest('article').querySelector('.ct-restaurant__thumbnail img');
    h.near(thumb); assert.equal(h.requests.length, count, 'closed branch remains deferred');
    toggle.click(); assert.equal(h.requests.at(-1).image, thumb);
    h.dom.window.close();

    // A queued page-one image is dropped after pagination; a stalled transfer releases its slot.
    h = setup(reverse);
    h.near(h.first); h.near(h.d.querySelectorAll('.ct-restaurant__logo img')[1]);
    h.d.querySelector('[data-ct-pagination] [aria-label="2. sayfa"]').click();
    h.advance(1000); assert.equal(h.requests.length, 1, 'newly hidden queued image never starts');
    h.result(h.first, true);
    const pageTwo = h.d.querySelector('[data-ct-row]:not([hidden])');
    h.near(pageTwo.querySelector('.ct-restaurant__logo img'));
    h.advance(30000); assert.equal(h.active.size, 0, 'stalled request is aborted before slot release');
    h.dom.window.close();

    // Gallery navigation/close must cancel old jobs without treating cancellation as a rate limit.
    h = setup(reverse);
    h.d.querySelector('[data-ct-pagination] [aria-label="2. sayfa"]').click();
    h.d.querySelector('[data-ct-row]:not([hidden]) [data-horeca-image]').click();
    const large = h.d.querySelector('dialog img');
    h.near(large); assert(h.requests.at(-1).source.endsWith('horeca-gallery-1.svg'));
    h.d.querySelector('[data-horeca-next]').click(); h.near(large);
    h.advance(1000); assert(h.requests.at(-1).source.endsWith('horeca-gallery-2.svg'));
    h.d.querySelector('[data-horeca-close]').click();
    h.advance(90000);
    assert.equal(h.requests.length, 2); assert.equal(h.active.size, 0);
    assert.equal(large.hasAttribute('src'), false); assert.equal(h.warnings.length, 0);
    h.dom.window.close();

    // No observer: still honor visibility, the global concurrency limit and start spacing.
    h = setup(reverse, false);
    assert.equal(h.requests.length, 1); h.advance(1000); assert.equal(h.requests.length, 2);
    h.result(h.first, true); h.advance(1000);
    assert.equal(h.requests.length, 2, 'hidden page/city/branch are excluded in fallback mode');
    h.dom.window.close();
}
console.log('PASS: viewport-only sources, shared 2-request cap, 1-second pacing, 60-second global backoff, one retry, cache-safe URLs, hidden pages/branches, gallery cancellation, request timeout, no-observer fallback, both bundle orders.');
