const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
let JSDOM;
try { ({ JSDOM } = require('jsdom')); }
catch { ({ JSDOM } = require('/tmp/ykb-export-check/node_modules/jsdom')); }
const source=fs.readFileSync(path.join(__dirname,'../Web/wwwroot/js/components/rich-text-links.js'),'utf8');
const guid='ce356585-3630-43d8-b9ae-2eee199154d6', compact=guid.replaceAll('-','');
const secondGuid='ac356585-3630-43d8-b9ae-2eee199154d6';
const response = (id,ok=true) => ({ ok, status: ok?200:404, text: async()=>'<div class="modal" id="modal-'+id.replaceAll('-','')+'"><script>window.executed=true</script><div class="modal-dialog"><div class="modal-content">Content</div></div></div>' });
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function setup(bootstrap=true,existing=false) {
    const dom=new JSDOM('<body><section data-rich-text data-culture="tr-TR" data-modal-endpoint="/components/rich-text/modal"><a id="one" href="#modal-'+compact+'">tıklayınız</a><a id="two" href="#modal-'+guid+'">aynı modal</a><a id="three" href="#modal-'+secondGuid+'">diğer</a><a id="popup" href="https://example.com/" target="popup">Popup</a></section>'+(existing?'<div id="modal-'+compact+'" class="modal"></div>':'')+'</body>',{url:'https://example.test/tr/test',runScripts:'outside-only'});
    const w=dom.window, shown=[],requests=[],popups=[];
    w.console.error=()=>{};
    w.fetch=url=>{requests.push(new URL(url)); return Promise.resolve(response(new URL(url).searchParams.get('id')));};
    w.open=(...args)=>{popups.push(args);return {opener:{}};};
    if(bootstrap)w.bootstrap={Modal:{getOrCreateInstance:element=>({show:()=>shown.push(element.id)})}};
    w.eval(source);
    const click=id=>w.document.getElementById(id).click();
    return {dom,w,shown,requests,popups,click};
}
(async()=>{
    const a=setup();
    assert.equal(a.requests.length,0); // No initial fetch, even with modal links.
    assert.equal(a.w.YKB.RichTextLinks.modalReference('#modal-'+guid).domId,'modal-'+compact);
    assert.equal(a.w.YKB.RichTextLinks.modalReference('#modal-123'),null);
    assert.equal(a.w.YKB.RichTextLinks.modalReference('https://other.test/#modal-'+compact),null);
    a.click('one');await tick();
    assert.equal(a.requests.length,1);assert.equal(a.requests[0].searchParams.get('id'),guid);
    assert.equal(a.requests[0].searchParams.get('culture'),'tr-TR');
    assert.equal(a.shown.length,1);assert.equal(a.w.document.querySelectorAll('.modal script').length,0);
    a.click('two');await tick();assert.equal(a.requests.length,1);assert.equal(a.shown.length,2);
    a.w.eval(source);a.click('popup');assert.equal(a.popups.length,1);
    assert(a.popups[0][2].includes('width=1010'));assert(a.popups[0][2].includes('height=740'));
    assert.equal(a.requests.length,1); // Normal popup never asks for modal data.
    a.dom.window.close();

    const concurrent=setup();let finish;
    concurrent.w.fetch=url=>{concurrent.requests.push(new URL(url));return new Promise(resolve=>{finish=resolve;});};
    concurrent.click('one');concurrent.click('two');await tick();assert.equal(concurrent.requests.length,1);
    finish(response(guid));await tick();assert.equal(concurrent.shown.length,1);concurrent.dom.window.close();

    const retry=setup();let attempt=0;
    retry.w.fetch=url=>{retry.requests.push(new URL(url));return Promise.resolve(response(guid,++attempt>1));};
    retry.click('one');await tick();assert.equal(retry.shown.length,0);
    assert.equal(retry.w.document.querySelector('[data-rich-text-modal-error]').hidden,false);
    retry.click('one');await tick();assert.equal(retry.requests.length,2);assert.equal(retry.shown.length,1);
    retry.dom.window.close();

    const cached=setup(true,true);cached.click('one');await tick();assert.equal(cached.requests.length,0);assert.equal(cached.shown.length,1);cached.dom.window.close();
    const missing=setup(false);missing.click('one');await tick();assert.equal(missing.requests.length,0);assert.equal(missing.shown.length,0);missing.dom.window.close();

    const race=setup();const resolvers={};
    race.w.fetch=url=>{const id=new URL(url).searchParams.get('id');race.requests.push(new URL(url));return new Promise(resolve=>{resolvers[id]=resolve;});};
    race.click('one');race.click('three');await tick();
    resolvers[secondGuid](response(secondGuid));await tick();resolvers[guid](response(guid));await tick();
    assert.deepEqual(race.shown,['modal-'+secondGuid.replaceAll('-','')]);race.dom.window.close();
    console.log('PASS: no initial requests, GUID normalization, first-click fetch, DOM reuse, concurrent deduplication, retry, latest-click wins, existing modal reuse, Bootstrap guard, popup sizing, duplicate script guard.');
})().catch(e=>{console.error(e);process.exitCode=1;});
