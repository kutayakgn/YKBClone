const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
let JSDOM;
try { ({ JSDOM } = require('jsdom')); }
catch { ({ JSDOM } = require('/tmp/ykb-export-check/node_modules/jsdom')); }
const base = path.join(__dirname,'..');
const core = fs.readFileSync(path.join(base,'Web/wwwroot/js/components/custom-table-feed.js'),'utf8');
const extension = fs.readFileSync(path.join(base,'Web/wwwroot/js/components/horeca-restaurants.js'),'utf8');
const fixture = fs.readFileSync(path.join(__dirname,'horeca-fixture.html'),'utf8');
function run(reverse) {
    const dom = new JSDOM('<body>'+fixture+fixture.replaceAll('horeca-test','horeca-second').replace('data-page-size="2"','data-page-size="0"')+'</body>', { url:'https://example.test/restaurants', runScripts:'outside-only' });
    const w = dom.window, d = w.document;
    w.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
    w.HTMLDialogElement.prototype.close = function () { this.open = false; this.dispatchEvent(new w.Event('close')); };
    if (reverse) { w.eval(extension); w.eval(core); } else { w.eval(core); w.eval(extension); }
    const root=d.querySelector('#horeca-test'), other=d.querySelector('#horeca-second');
    const visible = element => [...element.querySelectorAll('[data-ct-row]')].filter(row=>!row.hidden);
    assert.equal(visible(root).length,2);
    assert.equal(visible(other).length,3);
    assert.equal(other.querySelector('[data-ct-pagination]').hidden,true);
    const button=root.querySelector('[data-horeca-toggle]'), collapse=button.closest('article').querySelector('[data-horeca-collapse]');
    assert.equal(button.getAttribute('aria-expanded'),'false');
    assert.equal(collapse.inert,true);
    button.click(); assert.equal(button.getAttribute('aria-expanded'),'true'); assert.equal(collapse.inert,false);
    assert(collapse.classList.contains('is-expanded'));
    button.click(); assert.equal(button.getAttribute('aria-expanded'),'false');
    root.querySelector('[data-ct-pagination] [aria-label="2. sayfa"]').click();
    assert.equal(visible(root).length,1); assert(visible(root)[0].textContent.includes('Banyan'));
    const thumbnail=visible(root)[0].querySelector('[data-horeca-image]'); thumbnail.click();
    const dialog=d.querySelector('dialog'); assert(dialog.open);
    assert(dialog.querySelector('[data-horeca-large-image]').getAttribute('data-horeca-src').endsWith('horeca-gallery-1.svg'));
    dialog.querySelector('[data-horeca-next]').click();
    assert(dialog.querySelector('[data-horeca-large-image]').getAttribute('data-horeca-src').endsWith('horeca-gallery-2.svg'));
    dialog.querySelector('[data-horeca-close]').click(); assert.equal(dialog.open,false);
    assert.equal(d.activeElement,thumbnail);
    root.querySelector('[data-horeca-tab="izmir"]').click();
    assert.equal(visible(root).length,1); assert(visible(root)[0].textContent.includes('İzmir Restoran'));
    assert.equal(root.querySelector('[data-ct-pagination]').hidden,true);
    assert.equal(visible(other).length,3);
    root.querySelector('[data-horeca-tab="ankara"]').click();
    assert.equal(visible(root).length,0); assert.equal(root.querySelector('[data-ct-empty]').hidden,false);
    root.querySelector('[data-horeca-tab="istanbul"]').click();
    assert.equal(visible(root).length,2); assert(root.querySelector('[aria-current="page"]').textContent==='1');
    // Duplicate bundle execution must not bind toggle handlers twice.
    w.eval(extension); root.querySelector('[data-horeca-toggle]').click();
    assert.equal(root.querySelector('[data-horeca-toggle]').getAttribute('aria-expanded'),'true');
    assert.equal(w.location.href,'https://example.test/restaurants');
    dom.window.close();
}
run(false); run(true);
console.log('PASS: both bundle orders, Istanbul default, restaurant pagination, PageSize=0, independent feeds, branch expand/collapse, gallery navigation/focus restore, empty city, page reset, duplicate scripts, unchanged URL.');
