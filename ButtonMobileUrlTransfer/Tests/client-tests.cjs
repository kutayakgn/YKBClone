const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
let JSDOM;
try { ({ JSDOM } = require('jsdom')); }
catch { ({ JSDOM } = require('/tmp/ykb-export-check/node_modules/jsdom')); }
const source = fs.readFileSync(path.join(__dirname, '../Web/wwwroot/js/button-modals.js'), 'utf8');
let checks = 0;

function setup(options = {}) {
    const dom = new JSDOM('<body></body>', { url: 'https://example.test/page' });
    const document = dom.window.document;
    Object.defineProperty(document, 'readyState', { value: options.loading ? 'loading' : 'complete' });
    const mediaListeners = [];
    const media = {
        matches: !options.mobile,
        addEventListener: (_, handler) => mediaListeners.push(handler)
    };
    const calls = { show: [], hide: [], open: [], assign: [], focus: 0, errors: [] };
    const popup = { opener: {}, focus: () => calls.focus++ };
    const window = {
        matchMedia: query => { assert.equal(query, '(min-width: 992px)'); return media; },
        innerWidth: options.mobile ? 390 : 1280, innerHeight: options.mobile ? 700 : 900,
        screenLeft: 10, screenTop: 20,
        location: { protocol: options.http ? 'http:' : 'https:', assign: url => calls.assign.push(url) },
        open: (...args) => { calls.open.push(args); return options.blocked ? null : popup; }
    };
    if (!options.noBootstrap) window.bootstrap = { Modal: { getOrCreateInstance: el => ({
        show: () => {
            calls.show.push(el.id); el.classList.add('show');
            el.dispatchEvent(new dom.window.Event('shown.bs.modal'));
        },
        hide: () => { calls.hide.push(el.id); el.classList.remove('show'); }
    }) } };
    document.body.innerHTML = options.html || '';
    if (options.seen) document.cookie = 'ykb_modal_seen_' + options.seen + '=1; Path=/';
    const context = vm.createContext({ window, document, URL, location: window.location,
        screen: { width: 1280, height: 900 },
        console: { warn: message => calls.errors.push(message), error: message => calls.errors.push(message) }
    });
    if (options.legacyInitialized) window.YkbButtonModalInitialized = true;
    if (options.legacyUrlsInitialized) window.YkbButtonMobileUrlsInitialized = true;
    vm.runInContext(source, context);
    const click = (id, modifiers = {}) => {
        const event = new dom.window.MouseEvent('click', { bubbles: true, cancelable: true, ...modifiers });
        let prevented;
        const preventNavigation = e => { prevented = e.defaultPrevented; e.preventDefault(); };
        document.addEventListener('click', preventNavigation);
        document.getElementById(id).dispatchEvent(event);
        document.removeEventListener('click', preventNavigation);
        return prevented === undefined ? event.defaultPrevented : prevented;
    };
    return { dom, document, window, media, calls, popup, click,
        resize: desktop => { media.matches = desktop; mediaListeners.forEach(fn => fn()); },
        repeat: () => vm.runInContext(source, context) };
}
function button(target, mobile = '/mobile', extra = '') {
    return `<a id="button" href="/normal" data-url="/normal" data-mobile-url="${mobile}"
        data-ykb-button data-target-desktop="${target}" data-target-mobile="${target}" ${extra}><span id="label">Go</span></a>`;
}
function check(name, test) { test(); checks++; console.log('PASS ' + name); }

for (const target of ['_self', '_blank', '_popupwindow']) {
    for (const mobileUrl of ['/mobile', '', '   ']) {
        check(`mobile ${target}: ${mobileUrl.trim() ? 'MobilUrl' : 'Url fallback'}`, () => {
            const a = setup({ mobile: true, html: button(target, mobileUrl) });
            const expected = mobileUrl.trim() || '/normal';
            assert.equal(a.document.getElementById('button').getAttribute('href'), expected);
            const prevented = a.click('label');
            assert.equal(prevented, true);
            if (target === '_self') assert.deepEqual(a.calls.assign, ['https://example.test' + expected]);
            else assert.equal(a.calls.open[0][0], 'https://example.test' + expected);
            assert.equal(a.document.getElementById('button').target, target === '_blank' ? '_blank' : '_self');
            if (target === '_blank') assert.equal(a.document.getElementById('button').rel, 'noopener noreferrer');
            a.dom.window.close();
        });
    }
    check(`desktop ${target} ignores MobilUrl; resize restores Url`, () => {
        const a = setup({ html: button(target) });
        assert.equal(a.document.getElementById('button').getAttribute('href'), '/normal');
        a.resize(false);
        assert.equal(a.document.getElementById('button').getAttribute('href'), '/mobile');
        a.resize(true); a.click('button');
        assert.equal(a.document.getElementById('button').getAttribute('href'), '/normal');
        if (target === '_self') assert.deepEqual(a.calls.assign, ['https://example.test/normal']);
        else assert.equal(a.calls.open[0][0], 'https://example.test/normal');
        a.dom.window.close();
    });
}
check('legacy anchors without data-url restore original href', () => {
    const a = setup({ mobile: true, html: button('_self').replace('data-url="/normal"', '') });
    a.resize(true);
    assert.equal(a.document.getElementById('button').getAttribute('href'), '/normal');
    a.dom.window.close();
});
check('mobile-only URL works; empty desktop URL prevents navigation', () => {
    const a = setup({ mobile: true, html: button('_self').replaceAll('/normal', '#') });
    assert.equal(a.click('button'), true);
    assert.deepEqual(a.calls.assign, ['https://example.test/mobile']);
    assert.equal(a.document.getElementById('button').getAttribute('href'), '/mobile');
    a.resize(true); assert.equal(a.click('button'), true);
    a.dom.window.close();
});
check('modal ignores mobile URL; show/hide, seen cookie, manual reopen preserved', () => {
    const a = setup({ mobile: true, html: button('_modal', '/mobile', 'data-modal-id="m"') + '<div id="m" class="ykb-modal"></div>' });
    assert.equal(a.click('button'), true);
    assert.deepEqual(a.calls.show, ['m']);
    assert.equal(a.document.getElementById('button').getAttribute('href'), '/normal');
    assert(a.document.cookie.includes('ykb_modal_seen_m=1'));
    a.click('button'); assert.deepEqual(a.calls.hide, ['m']);
    a.click('button'); assert.equal(a.calls.show.length, 2);
    assert.equal(a.calls.open.length, 0);
    a.dom.window.close();
});
check('distinct desktop/mobile targets preserved across resize', () => {
    const a = setup({ html: button('_modal', '/mobile', 'data-modal-id="m"').replace('data-target-mobile="_modal"', 'data-target-mobile="_blank"') + '<div id="m" class="ykb-modal"></div>' });
    a.click('button'); assert.equal(a.calls.show.length, 1);
    a.resize(false); assert.equal(a.click('button'), true);
    assert.equal(a.document.getElementById('button').target, '_blank');
    assert.equal(a.document.getElementById('button').getAttribute('href'), '/mobile');
    a.dom.window.close();
});
check('only first unseen automatic modal opens', () => {
    const a = setup({ seen: 'm', html: button('_modal', '', 'data-auto-open="true" data-modal-id="m"') +
        button('_modal', '', 'data-auto-open="true" data-modal-id="n"').replace('id="button"', 'id="second"') +
        '<div class="ykb-modal" id="m"></div><div class="ykb-modal" id="n"></div>' });
    assert.deepEqual(a.calls.show, ['n']);
    a.dom.window.close();
});
check('seen automatic modal suppressed; manual click still opens', () => {
    const a = setup({ seen: 'm', html: button('_modal', '', 'data-auto-open="true" data-modal-id="m"') + '<div class="ykb-modal" id="m"></div>' });
    assert.equal(a.calls.show.length, 0); a.click('button'); assert.deepEqual(a.calls.show, ['m']);
    a.dom.window.close();
});
check('popup geometry, focus and opener preserved', () => {
    const a = setup({ html: button('_popupwindow') }); a.click('button');
    assert(a.calls.open[0][2].includes('width=900,height=800,left=200,top=70'));
    assert.equal(a.popup.opener, null); assert.equal(a.calls.focus, 1);
    a.dom.window.close();
});
check('blocked mobile popup falls back to selected URL in same tab', () => {
    const a = setup({ mobile: true, blocked: true, html: button('_popupwindow') }); a.click('button');
    assert.deepEqual(a.calls.assign, ['https://example.test/mobile']);
    assert(a.calls.open[0][2].includes('width=390,height=700'));
    a.dom.window.close();
});
for (const key of ['ctrlKey', 'metaKey', 'shiftKey', 'altKey']) {
    check(`${key} leaves native navigation intact with mobile href`, () => {
        const a = setup({ mobile: true, html: button('_popupwindow') });
        assert.equal(a.click('button', { [key]: true }), false);
        assert.equal(a.calls.open.length, 0);
        assert.equal(a.document.getElementById('button').getAttribute('href'), '/mobile');
        a.dom.window.close();
    });
}
check('duplicate script does not install duplicate click handlers', () => {
    const a = setup({ html: button('_popupwindow') }); a.repeat(); a.click('button');
    assert.equal(a.calls.open.length, 1); a.dom.window.close();
});
check('legacy modal initialized flag does not block mobile URL update', () => {
    const a = setup({ legacyInitialized: true, mobile: true, html: button('_self') });
    assert.equal(a.document.getElementById('button').dataset.mobileUrl, '/mobile');
    assert.equal(a.document.getElementById('button').getAttribute('href'), '/mobile');
    a.click('button');
    assert.equal(a.document.getElementById('button').getAttribute('href'), '/mobile');
    a.dom.window.close();
});
check('old element redirect cannot override selected mobile URL', () => {
    const a = setup({ mobile: true, legacyInitialized: true, html: button('_self') });
    const b = a.document.getElementById('button');
    b.setAttribute('href', '/normal');
    let usedUrl;
    b.addEventListener('click', () => {
        usedUrl = '/normal';
        a.window.location.assign('https://example.test/normal');
    });
    a.click('label');
    assert.equal(usedUrl, undefined);
    assert.deepEqual(a.calls.assign, ['https://example.test/mobile']);
    assert.equal(a.calls.open.length, 0);
    a.dom.window.close();
});
check('dynamically inserted button gets mobile href for middle click', () => {
    const a = setup({ mobile: true });
    a.document.body.innerHTML = button('_blank');
    a.document.getElementById('button').dispatchEvent(new a.dom.window.MouseEvent('auxclick', {
        bubbles: true, cancelable: true, button: 1
    }));
    assert.equal(a.document.getElementById('button').getAttribute('href'), '/mobile');
    a.dom.window.close();
});
check('DOMContentLoaded initialization and nested-label click work', () => {
    const a = setup({ loading: true, mobile: true, html: button('_self') });
    a.document.dispatchEvent(new a.dom.window.Event('DOMContentLoaded'));
    assert.equal(a.document.getElementById('button').getAttribute('href'), '/mobile');
    assert.equal(a.click('label'), true); a.dom.window.close();
});
check('missing modal and Bootstrap retain guarded behavior', () => {
    const a = setup({ noBootstrap: true, html: button('_modal', '', 'data-modal-id="m"') });
    assert.equal(a.click('button'), true);
    a.document.body.insertAdjacentHTML('beforeend', '<div id="m" class="ykb-modal"></div>');
    assert.equal(a.click('button'), true);
    assert.equal(a.calls.errors.length, 2); a.dom.window.close();
});
check('cookie retains one-year duration and HTTPS Secure flag', () => {
    for (const http of [false, true]) {
        const a = setup({ http, html: button('_modal', '', 'data-modal-id="m"') + '<div id="m" class="ykb-modal"></div>' });
        let written;
        Object.defineProperty(a.document, 'cookie', { get: () => '', set: value => { written = value; } });
        a.click('button');
        assert(written.includes('Max-Age=31536000; Path=/; SameSite=Lax'));
        assert.equal(written.includes('; Secure'), !http);
        a.dom.window.close();
    }
});
check('old mobile initialization flag does not block new navigation controller', () => {
    const a = setup({ mobile: true, legacyInitialized: true, legacyUrlsInitialized: true, html: button('_self') });
    assert(a.window.YkbButtonLinks);
    a.click('button');
    assert.deepEqual(a.calls.assign, ['https://example.test/mobile']);
    a.dom.window.close();
});
check('SubBanner anchor uses MobilLink via the shared data-mobile-url attribute', () => {
    const a = setup({ mobile: true, html: '<section class="sub-banner-component"><a id="button" class="sub-banner_detail-button" href="/banner-desktop" data-url="/banner-desktop" data-mobile-url="/banner-mobile" data-target-desktop="_self" data-target-mobile="_self" data-ykb-button>Details</a></section>' });
    a.click('button'); assert.deepEqual(a.calls.assign, ['https://example.test/banner-mobile']);
    a.resize(true); a.click('button');
    assert.deepEqual(a.calls.assign, ['https://example.test/banner-mobile', 'https://example.test/banner-desktop']);
    a.dom.window.close();
});
check('blank opens selected URL once with noopener/noreferrer', () => {
    const a = setup({ mobile: true, html: button('_blank') });
    a.click('button');
    assert.deepEqual(a.calls.open, [['https://example.test/mobile', '_blank', 'noopener,noreferrer']]);
    assert.equal(a.calls.assign.length, 0); a.dom.window.close();
});
check('unrelated anchors keep native behavior', () => {
    const a = setup({ mobile: true, html: '<a id="other" href="/other">Other</a>' });
    assert.equal(a.click('other'), false);
    assert.equal(a.calls.assign.length, 0); assert.equal(a.calls.open.length, 0);
    a.dom.window.close();
});
console.log(`${checks} regression scenarios passed.`);
