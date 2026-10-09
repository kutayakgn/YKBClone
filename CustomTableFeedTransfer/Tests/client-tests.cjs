const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Run the shipped client, without browser dependencies. Internal access exists
// only in this test VM; no test hooks are added to the production bundle.
const source = fs.readFileSync(path.join(__dirname, '../Web/wwwroot/js/components/custom-table-feed.js'), 'utf8');
const window = {};
const document = { readyState: 'loading', addEventListener() {}, querySelectorAll: () => [] };
class Element {
    constructor() {
        this.children = []; this.attributes = {}; this.listeners = {}; this.dataset = {};
        this.hidden = false; this.value = '';
        const classes = new Set();
        this.classList = {
            add: x => classes.add(x), remove: x => classes.delete(x),
            toggle: (x, on) => on ? classes.add(x) : classes.delete(x)
        };
    }
    toggleAttribute(name, on) { if (name === 'hidden') this.hidden = on; }
    setAttribute(name, value) { this.attributes[name] = value; }
    addEventListener(name, fn) { this.listeners[name] = fn; }
    replaceChildren() { this.children = []; }
    appendChild(child) { this.children.push(child); }
    querySelector(selector) {
        return selector === '[aria-current="page"]' ? this.children.find(x => x.attributes['aria-current'] === 'page') : null;
    }
    focus() {}
    click() { if (!this.disabled) this.listeners.click(); }
}
document.createElement = () => new Element();
vm.runInNewContext(source.replace('handlers.set("projects", projects);',
    'window.testInternals = { initialize, bulletins }; handlers.set("projects", projects);'),
    { window, document, console });
const api = window.YKB.CustomTableFeeds;
const { normalize, parseDate, isoDate, displayDate, previousMonth, unique } = api.utils;
assert.equal(normalize(' İZMİR '), 'izmir');
assert.equal(parseDate('31.02.2026'), undefined);
assert.equal(parseDate('29.02.2025'), undefined);
assert.equal(isoDate(parseDate('29.02.2024')), '2024-02-29');
assert.equal(parseDate(''), null);
assert.equal(parseDate('2026-10-09'), undefined);
assert.equal(unique(['İzmir', 'İZMİR', ' Ankara ', '', 'Ankara']).length, 2);
assert.equal(isoDate(previousMonth(new Date(2026, 2, 31))), '2026-02-28');
assert.equal(isoDate(previousMonth(new Date(2024, 2, 31))), '2024-02-29');
assert.equal(isoDate(previousMonth(new Date(2026, 0, 9))), '2025-12-09');

function feed(size) {
    const root = new Element();
    root.dataset = { kind: 'test', pageSize: String(size) };
    const rows = Array.from({ length: 13 }, (_, i) => {
        const row = new Element(); row.dataset.date = `2026-10-${String(13-i).padStart(2,'0')}`; return row;
    });
    const form = new Element(), pagination = new Element(), empty = new Element(), status = new Element();
    const controls = { '[data-ct-filters]': form, '[data-ct-pagination]': pagination, '[data-ct-empty]': empty, '[data-ct-status]': status };
    root.querySelector = selector => controls[selector];
    root.querySelectorAll = () => rows;
    let filter = () => true;
    root.readFilter = () => filter;
    return { root, rows, pagination, form, status, empty,
        filter(fn) { filter = fn; form.listeners.submit({ preventDefault() {} }); },
        shown() { return rows.filter(row => !row.hidden); }
    };
}
api.register('test', root => () => root.readFilter());
const a = feed(2), b = feed(0);
window.testInternals.initialize(a.root);
window.testInternals.initialize(b.root);
assert.equal(a.shown().length, 2);
assert.equal(b.shown().length, 13);
assert.equal(b.pagination.hidden, true);
assert.equal(a.pagination.children[0].disabled, true);
a.pagination.children.find(x => x.attributes['aria-label'] === 'Son sayfa').click();
assert.equal(a.shown().length, 1);
assert.equal(a.pagination.children.at(-1).disabled, true);
assert.deepEqual(a.pagination.children.map(x => x.textContent), ['<<', '<', '5', '6', '7', '>', '>>']);
assert.equal(b.shown().length, 13); // Other instances stay independent.
a.filter(row => row.dataset.date >= '2026-10-10');
assert.equal(a.shown().length, 2);
assert.equal(a.pagination.children.find(x => x.attributes['aria-current'] === 'page').textContent, '1');
a.pagination.children.find(x => x.attributes['aria-label'] === 'Sonraki sayfa').click();
assert.equal(a.shown()[1].dataset.date, '2026-10-10');
a.filter(() => false);
assert.equal(a.shown().length, 0);
assert.equal(a.empty.hidden, false);

// Exercise the actual bulletin predicate and invalid range handling.
const datesRoot = new Element(), start = new Element(), end = new Element(), error = new Element();
datesRoot.querySelector = selector => ({ '[data-start-date]': start, '[data-end-date]': end, '[data-filter-error]': error })[selector];
datesRoot.querySelectorAll = () => []; // Calendar interactions verified in Preview.
const read = window.testInternals.bulletins(datesRoot, a.rows);
assert.equal(start.value, displayDate(previousMonth(new Date())));
assert.equal(end.value, displayDate(new Date()));
start.value = '10.10.2026'; end.value = '12.10.2026';
assert.equal(a.rows.filter(read()).length, 3); // Both boundaries inclusive.
start.value = '13.10.2026';
assert.equal(read(), null);
assert.equal(error.hidden, false);
start.value = '31.02.2026';
assert.equal(read(), null);

// Initial bulletin rendering must apply the default date range, before submit.
const initial = feed(0);
const first = new Element(), last = new Element(), validation = new Element();
initial.root.dataset.kind = 'bulletins';
const originalQuery = initial.root.querySelector;
initial.root.querySelector = selector => ({ '[data-start-date]': first, '[data-end-date]': last, '[data-filter-error]': validation })[selector] || originalQuery(selector);
initial.root.querySelectorAll = selector => selector === '[data-ct-date]' ? [] : initial.rows;
initial.rows[0].dataset.date = isoDate(previousMonth(new Date()));
initial.rows[1].dataset.date = isoDate(new Date());
initial.rows.slice(2).forEach(row => { row.dataset.date = '1900-01-01'; });
window.testInternals.initialize(initial.root);
assert.equal(initial.shown().length, 2);
console.log('PASS: dates, month-end clamping, default initial date filter, Turkish search, PageSize=0, pagination, filter reset, empty results, independent instances, inclusive date ranges.');
