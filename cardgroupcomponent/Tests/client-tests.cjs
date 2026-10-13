const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
class Element {
    constructor() { this.children = []; this.dataset = {}; this.map = {}; this.listeners = {}; this.buttons = []; this.attrs = {}; this.isConnected = true; this.disabled = false; }
    hasAttribute(name) { return name in this.attrs; }
    querySelector(selector) { return this.map[selector] || null; }
    querySelectorAll(selector) { return selector === '[data-card-group-page]' ? this.buttons : []; }
    closest(selector) { return selector === '[data-card-group-page]' ? this : this.owner; }
    setAttribute(key,value) { this.attrs[key] = value; }
    addEventListener(key,listener) { this.listeners[key] = listener; }
    replaceChildren(result) { this.result = result; this.buttons = []; }
    dispatchEvent() {}
}
const root = new Element(), content = new Element(), status = new Element(), error = new Element();
root.id = 'test-group'; root.dataset = { endpoint: '/components/card-groups/page', groupId: '4bc18cf5-bc64-4e02-9c5f-13994824ab56', culture: 'tr-TR' };
content.attrs['data-card-group-content'] = ''; error.attrs['data-card-group-error'] = ''; status.attrs['data-card-group-status'] = '';
root.children = [error, content, status];
const first = new Element(), next = new Element(); first.owner = next.owner = root;
first.disabled = true; first.dataset.cardGroupPage = '1'; next.dataset.cardGroupPage = '2';
content.buttons = [first,next];
const requests = []; let ok = false;
const window = { location: { href: 'https://example.test/my-page' } };
const docListeners = {};
const document = { readyState: 'complete', querySelectorAll: () => [root], addEventListener: (name, fn) => { docListeners[name] = fn; } };
class Parser { parseFromString(html) { return { querySelector: () => { const result = new Element(); result.dataset = JSON.parse(html); return result; } }; } }
const source = fs.readFileSync(path.join(__dirname,'../Web/wwwroot/js/components/card-group-pagination.js'),'utf8');
const runtime = { window, document, Element, URL, AbortController, DOMParser: Parser,
    CustomEvent: class {}, console: { error() {} }, fetch: async url => {
        requests.push(new URL(url));
        return { ok, status: 500, text: async () => JSON.stringify({ page: '2', totalCards: '25', totalPages: '3' }) };
    } };
vm.runInNewContext(source, runtime);
const click = button => docListeners.click({ target: button, preventDefault() {} });
const settle = () => new Promise(resolve => setImmediate(resolve));
(async () => {
    assert.equal(root.dataset.cardGroupInitialized, 'true');
    const nested = new Element(); nested.owner = new Element(); nested.dataset.cardGroupPage = '3';
    click(nested); await settle(); assert.equal(requests.length,0); // Nested pager belongs to its own group.
    click(first); await settle(); assert.equal(requests.length,0); // Disabled boundary.
    click(next); await settle();
    assert.equal(requests.length,1);
    assert.equal(error.hidden,false);
    assert.equal(next.disabled,false); assert.equal(first.disabled,true); // Restore prior controls on failure.
    assert.equal(root.attrs['aria-busy'],'false');
    ok = true; click(next); await settle();
    assert.equal(requests.length,2);
    assert.equal(requests[1].searchParams.get('groupId'),root.dataset.groupId);
    assert.equal(requests[1].searchParams.get('culture'),'tr-TR');
    assert.equal(requests[1].searchParams.get('page'),'2');
    assert.equal(requests[1].searchParams.has('pageSize'),false); // PageSize always comes from CMS server query.
    assert.equal(content.result.dataset.page,'2');
    assert.equal(error.hidden,true);
    assert.equal(window.location.href,'https://example.test/my-page');
    // A newly inserted group initializes lazily on its first pagination click.
    const late = new Element(); late.id = 'late-group'; late.dataset = { ...root.dataset };
    const lateContent = new Element(), lateError = new Element(), lateStatus = new Element();
    lateContent.attrs['data-card-group-content'] = ''; lateError.attrs['data-card-group-error'] = ''; lateStatus.attrs['data-card-group-status'] = '';
    late.children = [lateError, lateContent, lateStatus];
    const lateButton = new Element(); lateButton.owner = late; lateButton.dataset.cardGroupPage = '3';
    lateContent.buttons = [lateButton];
    click(lateButton); await settle();
    assert.equal(requests[2].searchParams.get('page'), '3');
    assert.equal(late.dataset.cardGroupInitialized, 'true');
    // Setup failures before fetch must be caught rather than reject unhandled.
    const setupButton = new Element(); setupButton.owner = root; setupButton.dataset.cardGroupPage = '3';
    content.buttons = [setupButton];
    runtime.AbortController = class { constructor() { throw new ReferenceError('controller setup failed'); } };
    click(setupButton); await settle();
    assert.equal(requests.length, 3);
    assert.equal(error.hidden, false);
    assert.equal(root.attrs['aria-busy'], 'false');
    window.YKB.CardGroups.init(); // Reinitialization must be harmless.
    assert.equal(root.dataset.cardGroupInitialized,'true');
    console.log('PASS: delegated clicks, late-inserted groups, scoped nested groups, disabled controls, failure retry, pre-fetch error handling, AJAX parameters, partial replacement, CMS-owned PageSize, unchanged page URL.');
})().catch(error => { console.error(error); process.exitCode=1; });
