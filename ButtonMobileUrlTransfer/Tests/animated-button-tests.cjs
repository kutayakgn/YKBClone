const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
let JSDOM;
try { ({ JSDOM } = require('jsdom')); }
catch { ({ JSDOM } = require('/tmp/ykb-export-check/node_modules/jsdom')); }
const source = fs.readFileSync(path.join(__dirname, '../Web/wwwroot/js/components/animated-button.js'), 'utf8');
const html = id => `<a id="${id}" data-ykb-animation="true" data-player-url="/player.js" data-animation-url="/animation.json"><span class="ykb-animated-button__player"></span><img class="ykb-animated-button__poster" alt=""></a>`;
const flush = async () => { for (let i = 0; i < 15; i++) await Promise.resolve(); };
let checks = 0;
function setup(options = {}) {
    const dom = new JSDOM('<body>' + (options.html || html('one')) + '</body>', { url: 'https://example.test/', runScripts: 'outside-only' });
    const w = dom.window, d = w.document;
    Object.defineProperty(d, 'readyState', { value: 'complete' });
    let hidden = false;
    Object.defineProperty(d, 'hidden', { get: () => hidden });
    const media = new Map();
    w.matchMedia = q => {
        if (!media.has(q)) media.set(q, { matches: q.includes('max-width') ? !options.desktop : !!options.reduced,
            listeners: [], addEventListener(_, fn) { this.listeners.push(fn); } });
        return media.get(q);
    };
    const calls = { fetch: 0, scripts: 0, animations: [] };
    let io;
    if (!options.noObserver) w.IntersectionObserver = class {
        constructor(callback) { this.callback = callback; io = this; }
        observe() {} unobserve() {}
    };
    if (options.noObserver) d.querySelector('a').getBoundingClientRect = () => ({ width: 300, height: 72, top: 0, left: 0, bottom: 72, right: 300 });
    w.fetch = () => {
        calls.fetch++;
        if (options.fetchFailure) return Promise.reject(new Error('network'));
        return Promise.resolve({ ok: true, text: () => Promise.resolve('{"layers":[]}') });
    };
    const player = { loadAnimation(settings) {
        const a = { settings, plays: 0, pauses: 0, destroys: 0, events: {},
            addEventListener(name, fn) { this.events[name] = fn; },
            play() { this.plays++; }, pause() { this.pauses++; }, destroy() { this.destroys++; } };
        calls.animations.push(a);
        return a;
    } };
    if (options.existingPlayer) w.lottie = player;
    const append = d.head.appendChild.bind(d.head);
    d.head.appendChild = el => {
        if (el.tagName === 'SCRIPT') {
            calls.scripts++;
            Promise.resolve().then(() => {
                if (options.scriptFailure) el.onerror();
                else { w.lottie = player; el.onload(); }
            });
        }
        return append(el);
    };
    const run = () => w.eval(source);
    run();
    const emit = (id, visible = true) => io.callback([{ target: d.getElementById(id), isIntersecting: visible }]);
    const change = (query, value) => { const m = media.get(query); m.matches = value; m.listeners.forEach(fn => fn()); };
    return { dom, w, d, calls, run, emit,
        mobile: value => change('(max-width: 767.98px)', value),
        reduce: value => change('(prefers-reduced-motion: reduce)', value),
        hide: value => { hidden = value; d.dispatchEvent(new w.Event('visibilitychange')); } };
}
async function check(name, fn) { await fn(); checks++; console.log('PASS ' + name); }
(async () => {
    await check('desktop and offscreen mobile do not request player/data; switching to mobile loads once', async () => {
        const a = setup({ desktop: true });
        a.emit('one'); await flush(); assert.equal(a.calls.fetch + a.calls.scripts, 0);
        a.mobile(true); await flush(); assert.equal(a.calls.fetch, 1); assert.equal(a.calls.scripts, 1);
        a.calls.animations[0].events.DOMLoaded(); assert.equal(a.calls.animations[0].plays, 1);
        a.mobile(false); assert.equal(a.calls.animations[0].pauses, 1);
        a.dom.window.close();
        const b = setup(); await flush(); assert.equal(b.calls.fetch + b.calls.scripts, 0); b.dom.window.close();
    });
    await check('reduced motion initially uses only the poster; changing preference starts/stops animation', async () => {
        const a = setup({ reduced: true }); a.emit('one'); await flush(); assert.equal(a.calls.fetch, 0);
        a.reduce(false); await flush(); const p = a.calls.animations[0]; p.events.DOMLoaded();
        assert(a.d.getElementById('one').classList.contains('is-animation-ready'));
        a.reduce(true); assert(!a.d.getElementById('one').classList.contains('is-animation-ready')); assert.equal(p.pauses, 1);
        a.dom.window.close();
    });
    await check('multiple buttons share requests but receive independent animation data and instances', async () => {
        const a = setup({ html: html('one') + html('two') }); a.emit('one'); a.emit('two'); await flush();
        assert.equal(a.calls.fetch, 1); assert.equal(a.calls.scripts, 1); assert.equal(a.calls.animations.length, 2);
        assert.notEqual(a.calls.animations[0].settings.animationData, a.calls.animations[1].settings.animationData);
        assert.notEqual(a.calls.animations[0].settings.container, a.calls.animations[1].settings.container);
        a.dom.window.close();
    });
    await check('offscreen and hidden tabs pause playback; returning resumes without requests', async () => {
        const a = setup(); a.emit('one'); await flush(); const p = a.calls.animations[0]; p.events.DOMLoaded();
        a.emit('one', false); assert.equal(p.pauses, 1); a.emit('one'); assert.equal(p.plays, 2);
        a.hide(true); assert.equal(p.pauses, 2); a.hide(false); assert.equal(p.plays, 3); assert.equal(a.calls.fetch, 1);
        a.dom.window.close();
    });
    await check('a visibility change during loading cannot start playback in the background', async () => {
        const a = setup(); a.emit('one'); a.hide(true); await flush(); const p = a.calls.animations[0]; p.events.DOMLoaded();
        assert.equal(p.plays, 0); a.hide(false); assert.equal(p.plays, 1); a.dom.window.close();
    });
    await check('player/data failures retain the poster without unhandled rejection', async () => {
        for (const option of ['scriptFailure', 'fetchFailure']) {
            const a = setup({ [option]: true }); a.emit('one'); await flush();
            assert(!a.d.getElementById('one').classList.contains('is-animation-ready')); assert.equal(a.calls.animations.length, 0);
            a.emit('one'); await flush(); assert.equal(a.calls.fetch, 1); a.dom.window.close();
        }
    });
    await check('existing Lottie player is reused; initialization and refresh are idempotent', async () => {
        const a = setup({ existingPlayer: true }); a.run(); a.w.YkbAnimatedButtons.refresh(); a.emit('one'); await flush();
        assert.equal(a.calls.scripts, 0); assert.equal(a.calls.animations.length, 1); a.dom.window.close();
    });
    await check('disabled buttons and ordinary buttons never request animation resources', async () => {
        const a = setup({ html: html('one').replace('<a ', '<a aria-disabled="true" ') + '<a data-ykb-animation="false">Normal</a>' });
        a.emit('one'); await flush(); assert.equal(a.calls.fetch + a.calls.scripts, 0); a.dom.window.close();
    });
    await check('dynamic refresh starts new buttons and destroys removed instances', async () => {
        const a = setup(); a.emit('one'); await flush(); const p = a.calls.animations[0];
        a.d.getElementById('one').remove(); a.d.body.insertAdjacentHTML('beforeend', html('two'));
        a.w.YkbAnimatedButtons.refresh(); assert.equal(p.destroys, 1); a.emit('two'); await flush();
        assert.equal(a.calls.animations.length, 2); assert.equal(a.calls.fetch, 1); a.dom.window.close();
    });
    await check('removing a button during loading does not create an orphan player', async () => {
        const a = setup(); a.emit('one'); a.d.getElementById('one').remove(); await flush();
        assert.equal(a.calls.animations.length, 0); a.dom.window.close();
    });
    await check('browsers without IntersectionObserver use viewport fallback', async () => {
        const a = setup({ noObserver: true }); await flush(); assert.equal(a.calls.animations.length, 1); a.dom.window.close();
    });
    console.log(`${checks} animation scenarios passed.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
