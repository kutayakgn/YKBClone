const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
class Element {
    constructor() { this.dataset = {}; this.attrs = {}; this.listeners = {}; this.children = []; this.value = ''; this.map = {}; this.hidden = false; this.classList = { add() {} }; }
    querySelector(selector) { return this.map[selector] || (selector === '[aria-current="page"]' ? this.children.find(x => x.attrs['aria-current'] === 'page') : null); }
    querySelectorAll(selector) { return selector === 'button' ? this.children : []; }
    setAttribute(key,value) { this.attrs[key] = value; }
    addEventListener(key,fn) { this.listeners[key] = fn; }
    replaceChildren(...children) { this.children = children; if (children[0]?.dataset.totalPages !== undefined) this.map['[data-press-result]'] = children[0]; }
    appendChild(child) { this.children.push(child); }
    focus() {}
}
const root = new Element(), form = new Element(), category = new Element(), period = new Element(), results = new Element(), pagination = new Element(), error = new Element(), status = new Element();
root.id = 'test-feed'; root.dataset = { endpoint: '/components/press-releases/rows', pageSize: '10' };
root.map = { '[data-press-form]': form, '[data-press-results]': results, '[data-press-pagination]': pagination, '[data-press-error]': error, '[data-press-status]': status };
form.map = { '[data-press-value][name="category"]': category, '[data-press-value][name="period"]': period };
function result(page, totalPages, totalRecords) { const el = new Element(); el.dataset = { page: String(page), totalPages: String(totalPages), totalRecords: String(totalRecords) }; return el; }
results.map['[data-press-result]'] = result(1,3,25);
period.value = '2026';
const document = { readyState: 'complete', querySelectorAll: () => [root], createElement: () => new Element() };
const requests = [];
const window = { location: { href: 'https://example.test/page' } };
const source = fs.readFileSync(path.join(__dirname,'../Web/wwwroot/js/components/press-releases.js'),'utf8');
class Parser { parseFromString(html) { const data = JSON.parse(html); return { querySelector: () => result(data.page,data.totalPages,data.totalRecords) }; } }
vm.runInNewContext(source, { window, document, console, URL, AbortController, DOMParser: Parser, fetch: async url => {
    requests.push(new URL(url));
    return { ok: true, text: async () => JSON.stringify({ page: Number(url.searchParams.get('page')), totalPages: 2, totalRecords: 13 }) };
} });
const settle = () => new Promise(resolve => setImmediate(resolve));
(async () => {
    assert.equal(root.dataset.pressInitialized, 'true');
    category.value = '4'; period.value = '2024';
    form.listeners.submit({ preventDefault() {} }); await settle();
    assert.equal(requests.length,1);
    assert.equal(requests[0].searchParams.get('category'),'4');
    assert.equal(requests[0].searchParams.get('period'),'2024');
    assert.equal(requests[0].searchParams.get('pageSize'),'10');
    assert.equal(requests[0].searchParams.get('page'),'1');
    // Editing selections without Git must not change pagination's active filters.
    category.value = '5'; period.value = '2023';
    pagination.children.find(x => x.attrs['aria-label'] === 'Sonraki sayfa').listeners.click(); await settle();
    assert.equal(requests[1].searchParams.get('category'),'4');
    assert.equal(requests[1].searchParams.get('period'),'2024');
    assert.equal(requests[1].searchParams.get('page'),'2');
    category.value = ''; period.value = ''; root.dataset.pageSize = '0';
    form.listeners.submit({ preventDefault() {} }); await settle();
    assert.equal(requests[2].searchParams.has('category'),false);
    assert.equal(requests[2].searchParams.has('period'),false);
    assert.equal(requests[2].searchParams.get('pageSize'),'0');
    assert.equal(window.location.href,'https://example.test/page');
    console.log('PASS: initialization, Git sends category/year/PageSize, pagination preserves applied filters, Seçiniz omits filters, URL stays unchanged.');
})().catch(error => { console.error(error); process.exitCode = 1; });
