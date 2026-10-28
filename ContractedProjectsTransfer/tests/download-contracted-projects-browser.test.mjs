import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash, webcrypto } from 'node:crypto';
import vm from 'node:vm';

const scriptUrl = new URL('../../scripts/download-yapikredi-contracted-projects-browser.js', import.meta.url);
const source = await readFile(scriptUrl, 'utf8');
const SOURCE = 'https://www.yapikredi.com.tr/kredi/anlasmali-projelerimiz/';
const png = Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGD4DwABBAEAX+XDSwAAAABJRU5ErkJggg==', 'base64'));
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const tick = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms));
async function until(predicate, message = 'condition was not reached') {
  const deadline = Date.now() + 2500;
  while (!predicate()) { if (Date.now() > deadline) assert.fail(message); await tick(2); }
}
const card = ({ name = 'ÖRNEK PROJE', firm = 'ÖRNEK İNŞAAT', address = 'İstanbul / Kağıthane', web = 'https://example.test/project', branchPhone = 'Merkez Şubesi / (0212) 123 45 67', image = '/medium/image/ornek_1/view', imageHtml } = {}) =>
  `<div class="item-ap"><h2>${name}</h2><div class="row"><picture>${imageHtml ?? (image === null ? '' : `<img data-src="${image}" src="/_assets/img/transparent.png">`)}</picture><ul><li><p>Firma Adı</p><span>${firm}</span></li><li><p>Adres</p><span>${address}</span></li><li><p>Web</p><span>${web ? `<a href="${web}">${web}</a>` : ''}</span></li><li><p>İlgili Şube / Tel</p><span>${branchPhone}</span></li></ul></div></div>`;
const pager = (active = 1, total = 1) => `<div class="pager"><ul><li class="pager-active" data-page="${active}"><a>${active}</a></li><li class="pager-last" data-page="${total}"><a>&gt;&gt;</a></li></ul></div>`;
const payload = html => ({ d: { StatusCode: 200, Data: `<form id="aspnetForm">${html}</form>`, Exception: null } });
const listing = html => new Response(JSON.stringify(payload(html)), { headers: { 'content-type': 'application/json' } });

function decode(text) {
  const entities = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ' };
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, key) => key[0] === '#'
    ? String.fromCodePoint(key[1].toLowerCase() === 'x' ? parseInt(key.slice(2), 16) : parseInt(key.slice(1), 10)) : entities[key] ?? whole);
}
function attrs(text) {
  return Object.fromEntries([...text.matchAll(/([\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)]
    .map(match => [match[1], decode(match[2] ?? match[3] ?? match[4] ?? '')]));
}
function matches(element, selector) {
  const name = /^[a-z][\w-]*/i.exec(selector)?.[0];
  if (name && element.tagName !== name.toUpperCase()) return false;
  for (const match of selector.matchAll(/\.([\w-]+)/g)) if (!element.classList.contains(match[1])) return false;
  for (const match of selector.matchAll(/#([\w-]+)/g)) if (element.id !== match[1]) return false;
  for (const match of selector.matchAll(/\[([\w-]+)(?:=["']?([^\]"']+)["']?)?\]/g)) {
    if (!element.hasAttribute(match[1]) || (match[2] !== undefined && element.getAttribute(match[1]) !== match[2])) return false;
  }
  return true;
}
// A small offline DOM tree: production uses the browser's native HTML parser.
class Element {
  constructor(tag = 'div', attributes = {}, owner = null) {
    this.tagName = tag.toUpperCase(); this.attributes = attributes; this.owner = owner; this.nodes = []; this.parentElement = null;
    this.style = {}; this.events = new Map(); this.id = attributes.id ?? '';
    this.classList = { contains: value => (this.attributes.class ?? '').split(/\s+/).includes(value) };
  }
  get children() { return this.nodes.filter(node => node instanceof Element); }
  get textContent() { return this.nodes.map(node => typeof node === 'string' ? node : node.textContent).join(''); }
  set textContent(text) { this.nodes = [String(text)]; }
  set innerHTML(html) { this.nodes = parseHtml(html, this.owner).nodes; for (const node of this.children) node.parentElement = this; }
  getAttribute(name) { return this.attributes[name] ?? null; }
  hasAttribute(name) { return Object.hasOwn(this.attributes, name); }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  appendChild(node) { this.nodes.push(node); node.parentElement = this; if (node.id && this.owner) this.owner.elements.set(node.id, node); return node; }
  addEventListener(name, callback) { this.events.set(name, callback); }
  removeEventListener(name) { this.events.delete(name); }
  remove() { if (this.parentElement) this.parentElement.nodes = this.parentElement.nodes.filter(node => node !== this); if (this.owner) this.owner.elements.delete(this.id); }
  querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null; }
  querySelectorAll(selector) {
    const all = [];
    const visit = element => { for (const child of element.children) { all.push(child); visit(child); } };
    visit(this);
    return all.filter(element => selector.split(',').some(group => {
      const direct = group.includes('>'), parts = group.trim().split(/\s*>\s*|\s+/);
      if (!matches(element, parts.at(-1))) return false;
      let parent = element.parentElement;
      for (let index = parts.length - 2; index >= 0; index--) {
        while (parent && !matches(parent, parts[index])) { if (direct) return false; parent = parent.parentElement; }
        if (!parent) return false;
        parent = parent.parentElement;
      }
      return true;
    }));
  }
}
function parseHtml(html, owner = null) {
  const root = new Element('document', {}, owner), stack = [root];
  const voidTags = new Set(['IMG', 'SOURCE', 'INPUT', 'META', 'LINK', 'BR', 'HR', 'AREA', 'BASE', 'WBR']);
  for (const token of html.matchAll(/<!--[\s\S]*?-->|<![^>]*>|<\/?[a-z][^>]*>|[^<]+/gi)) {
    const text = token[0];
    if (text.startsWith('<!')) continue;
    if (text.startsWith('</')) {
      const name = /^<\/([\w-]+)/.exec(text)[1].toUpperCase();
      const index = stack.findLastIndex(element => element.tagName === name);
      if (index > 0) stack.length = index;
    } else if (text.startsWith('<')) {
      const match = /^<([\w-]+)([\s\S]*?)\/?\s*>$/.exec(text);
      const element = new Element(match[1], attrs(match[2]), owner);
      stack.at(-1).appendChild(element);
      if (!voidTags.has(element.tagName) && !text.endsWith('/>')) stack.push(element);
    } else stack.at(-1).nodes.push(decode(text));
  }
  return root;
}
class Parser { parseFromString(html) { return parseHtml(html); } }

class Directory {
  constructor(name = 'chosen-folder', hooks = {}) { this.name = name; this.kind = 'directory'; this.files = new Map(); this.directories = new Map(); this.hooks = hooks; }
  async *values() { for (const name of this.files.keys()) yield await this.getFileHandle(name); }
  async getDirectoryHandle(name, { create = false } = {}) {
    if (!this.directories.has(name)) { if (!create) throw new DOMException('Missing', 'NotFoundError'); this.directories.set(name, new Directory(name, this.hooks)); }
    return this.directories.get(name);
  }
  async getFileHandle(name, { create = false } = {}) {
    if (!this.files.has(name)) { if (!create) throw new DOMException('Missing', 'NotFoundError'); this.files.set(name, new Uint8Array()); }
    const directory = this;
    return { name, kind: 'file', getFile: async () => new Blob([directory.files.get(name)]), createWritable: async () => {
      await directory.hooks.open?.(name);
      let data = new Uint8Array(), closed = false;
      return {
        write: async value => { if (directory.hooks.failWrite?.(name)) throw new DOMException('Disk full', 'QuotaExceededError'); data = typeof value === 'string' ? new TextEncoder().encode(value) : new Uint8Array(value); },
        close: async () => { await directory.hooks.beforeClose?.(name, data); directory.files.set(name, data); closed = true; await directory.hooks.close?.(name, data); },
        abort: async () => { if (!closed) { closed = true; await directory.hooks.abort?.(name); } },
      };
    } };
  }
  json(name) { return JSON.parse(new TextDecoder().decode(this.files.get(name))); }
}

function browser({ root = new Directory(), fetchImpl, bitmapImpl, online = true, pickerError } = {}) {
  const document = { elements: new Map(), getElementById(id) { return this.elements.get(id) ?? null; }, createElement(tag) { return new Element(tag, {}, this); } };
  document.body = new Element('body', {}, document); document.documentElement = document.body;
  const calls = [], logs = [], listeners = new Map(), state = { online, pickerCalls: 0 };
  const context = {
    document, location: new URL(SOURCE), isSecureContext: true, DOMParser: Parser, crypto: webcrypto,
    navigator: { get onLine() { return state.online; } },
    URL, TextEncoder, TextDecoder, Blob, Response, Headers, AbortController, AbortSignal, DOMException, Uint8Array,
    createImageBitmap: bitmapImpl ?? (async () => ({ width: 1, height: 1, close() {} })),
    setTimeout: (callback, milliseconds, ...args) => setTimeout(callback, milliseconds === 5000 ? 30 : milliseconds < 10000 ? 0 : milliseconds, ...args), clearTimeout,
    addEventListener: (name, callback) => { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name).add(callback); },
    removeEventListener: (name, callback) => listeners.get(name)?.delete(callback),
    dispatchEvent: event => { for (const callback of listeners.get(event.type) ?? []) callback(event); },
    console: Object.fromEntries(['log', 'info', 'warn', 'error'].map(name => [name, (...args) => logs.push(args)])),
    showDirectoryPicker: () => { state.pickerCalls++; return pickerError ? Promise.reject(pickerError) : Promise.resolve(root); },
    fetch: async (url, init = {}) => { calls.push({ url: String(url), init }); return fetchImpl ? fetchImpl(url, init) : init.method === 'POST' ? listing(card()) : new Response(png); },
  };
  context.window = context; context.self = context; context.top = context;
  const vmContext = vm.createContext(context);
  const reinject = () => vm.runInContext(source, vmContext, { filename: scriptUrl.pathname, timeout: 1000 });
  reinject();
  assert.ok(context.ykbContractedProjectsExport);
  return { get api() { return context.ykbContractedProjectsExport; }, get directory() { return root.name === 'ykb-anlasmali-projeler' ? root : root.directories.get('ykb-anlasmali-projeler'); },
    root, context, calls, logs, state, reinject, setOnline(value) { state.online = value; context.dispatchEvent({ type: value ? 'online' : 'offline' }); } };
}
async function start(instance) { const manifest = await instance.api.start(); assert.ok(manifest, instance.logs.map(args => args.map(value => value?.message ?? value).join(' ')).join('\n')); return manifest; }
function removeJson(directory) { for (const name of ['projects.json', 'errors.json', 'projects.resume.json']) directory.files.delete(name); }

test('snippet uses native browser APIs without runtime imports', () => {
  assert.doesNotThrow(() => new vm.Script(source));
  assert.doesNotMatch(source, /^\s*(?:import\s|export\s)|require\s*\(|\bBuffer\b|node:|process\.argv|fs\/promises/m);
  assert.match(source, /showDirectoryPicker/); assert.match(source, /DOMParser/); assert.match(source, /crypto\.subtle/);
});

test('synchronous picker, request filters, exact business fields and image hashes match controller contract', async () => {
  const branch = 'Halkalı Şubesi / Bakırköy Şubesi', phone = '(0212) 123 45 67 [Halkalı] / (0212) 765 43 21 [Bakırköy]';
  const instance = browser({ fetchImpl: async (url, init) => {
    if (init.method !== 'POST') return new Response(png);
    assert.equal(String(url), SOURCE + 'default.aspx/GetProjectList');
    assert.deepEqual(JSON.parse(init.body), { cityId: null, districtId: null, projectName: '', companyName: '', pageIndex: 1 });
    return listing(card({ firm: 'MESA, ARTAŞ &amp; KANTUR', branchPhone: branch + ' / ' + phone }));
  } });
  const pending = instance.api.start();
  assert.equal(instance.state.pickerCalls, 1);
  const manifest = await pending;
  assert.equal(manifest.schemaVersion, 1); assert.equal(manifest.sourceUrl, SOURCE); assert.equal(manifest.tableClassName, 'YkbYapikredi.ContractedProjects');
  assert.deepEqual(JSON.parse(JSON.stringify(manifest.filters)), { cityId: null, districtId: null, projectName: '', companyName: '' });
  assert.equal(manifest.listingComplete, true); assert.equal(manifest.totalRecords, 1);
  const record = manifest.records[0];
  assert.equal(record.projectName, 'ÖRNEK PROJE'); assert.equal(record.firmName, 'MESA, ARTAŞ & KANTUR');
  assert.equal(record.city, 'İstanbul'); assert.equal(record.district, 'Kağıthane'); assert.equal(record.addressText, 'İstanbul / Kağıthane');
  assert.equal(record.branch, branch); assert.equal(record.phone, phone); assert.equal(record.branchPhoneText, branch + ' / ' + phone);
  assert.equal(record.websiteUrl, 'https://example.test/project'); assert.equal(record.sourcePage, 1);
  assert.equal(record.imageStatus, 'downloaded'); assert.equal(record.imageSha256, digest(png)); assert.equal(record.imageByteLength, png.length);
  assert.match(record.imageFileName, /^[a-z0-9._-]+\.png$/); assert.ok(record.imageFileName.length <= 50);
  assert.deepEqual(instance.directory.directories.get('images').files.get(record.imageFileName), png);
  assert.equal(instance.directory.json('projects.json').records[0].imageFileName, record.imageFileName);
});

test('pagination stops at declared final page and preserves projects as one row each', async () => {
  const pages = [];
  const instance = browser({ fetchImpl: async (_url, init) => {
    if (init.method !== 'POST') return new Response(png);
    const index = JSON.parse(init.body).pageIndex; pages.push(index);
    return listing(card({ name: `Proje ${index}`, firm: 'Firma A, Firma B', image: null }) + pager(index, 2));
  } });
  const manifest = await start(instance);
  assert.deepEqual(pages, [1, 2, 1]); assert.equal(manifest.totalRecords, 2); assert.equal(manifest.listingComplete, true);
  assert.equal(manifest.records[1].sourcePage, 2); assert.equal(manifest.records[0].firmName, 'Firma A, Firma B');
  assert.equal(manifest.records[0].imageStatus, 'missing'); assert.equal(manifest.records[0].imageSourceUrl, null);
});

test('lazy image URL wins over placeholder, shared URLs produce one GET and one file', async () => {
  let gets = 0;
  const image = '/medium/image/ğüşiöç-çok-uzun-proje-resmi-adı-'.repeat(5) + '11/view';
  const instance = browser({ fetchImpl: async (_url, init) => init.method === 'POST' ? listing(card({ name: 'Bir', image }) + card({ name: 'İki', image })) : (gets++, new Response(png)) });
  const manifest = await start(instance);
  assert.equal(gets, 1); assert.equal(manifest.totalRecords, 2);
  assert.equal(manifest.records[0].imageFileName, manifest.records[1].imageFileName);
  assert.ok(manifest.records.every(record => !record.imageSourceUrl.includes('transparent.png')));
  assert.ok(manifest.records[0].imageFileName.length <= 50); assert.match(manifest.records[0].imageFileName, /^[a-z0-9._-]+\.png$/);
  assert.equal(instance.directory.directories.get('images').files.size, 1);
});

test('native image src and picture srcset are used when lazy src is a placeholder', async () => {
  const instance = browser({ fetchImpl: async (_url, init) => init.method === 'POST' ? listing(
    card({ name: 'Native', imageHtml: '<img data-src="/_assets/img/transparent.png" src="/medium/image/native_1/view">' }) +
    card({ name: 'Picture', imageHtml: '<source srcset="/medium/image/fallback_2/view?x=1&amp;y=2 1x, /medium/image/fallback_2/view?scale=2 2x"><img src="/_assets/img/transparent.png">' })) : new Response(png) });
  const manifest = await start(instance);
  assert.equal(manifest.records[0].imageSourceUrl, 'https://www.yapikredi.com.tr/medium/image/native_1/view');
  assert.equal(manifest.records[1].imageSourceUrl, 'https://www.yapikredi.com.tr/medium/image/fallback_2/view?x=1&y=2');
  assert.ok(manifest.records.every(record => record.imageStatus === 'downloaded'));
});

test('failed HTTP, HTML and image decode retain project rows with reported image errors', async () => {
  const instance = browser({ bitmapImpl: async () => { throw new DOMException('Bad image', 'InvalidStateError'); }, fetchImpl: async (url, init) => {
    if (init.method === 'POST') return listing(card({ name: '404', image: '/medium/image/404/view' }) + card({ name: 'HTML', image: '/medium/image/html/view' }) + card({ name: 'Decode', image: '/medium/image/decode/view' }) + card({ name: 'Missing', image: null }));
    return String(url).includes('/404/') ? new Response('missing', { status: 404 }) : String(url).includes('/html/') ? new Response('<html>Denied</html>') : new Response(png);
  } });
  const manifest = await start(instance);
  assert.equal(manifest.totalRecords, 4); assert.equal(manifest.listingComplete, true);
  assert.equal(manifest.records.filter(record => record.imageStatus === 'failed').length, 3);
  assert.equal(manifest.records.filter(record => record.imageStatus === 'missing').length, 1);
  assert.ok(manifest.records.filter(record => record.imageStatus === 'failed').every(record => record.imageError && !record.imageSha256 && !record.imageByteLength));
  assert.equal(instance.directory.json('errors.json').downloadErrors.length, 3);
});

test('duplicate pages and active-page mismatches never become a complete archive', async () => {
  for (const mismatch of [false, true]) {
    const instance = browser({ fetchImpl: async (_url, init) => init.method === 'POST'
      ? listing(card({ image: null }) + pager(mismatch ? 1 : JSON.parse(init.body).pageIndex, 2)) : new Response(png) });
    const manifest = await start(instance);
    assert.equal(manifest.listingComplete, false); assert.ok(manifest.listingErrors.length > 0);
  }
});

test('missing field captions stop listing while present empty fields preserve the project with warnings', async () => {
  const malformed = browser({ fetchImpl: async (_url, init) => {
    assert.equal(init.method, 'POST');
    return listing(card().replace('<p>Firma Adı</p>', '<p>Unexpected caption</p>'));
  } });
  const invalid = await start(malformed);
  assert.equal(invalid.listingComplete, false); assert.equal(invalid.totalRecords, 0); assert.ok(invalid.listingErrors.length > 0);
  const empty = browser({ fetchImpl: async (_url, init) => {
    assert.equal(init.method, 'POST');
    return listing(card({ firm: '', address: '', web: '', branchPhone: '', image: null }));
  } });
  const valid = await start(empty);
  assert.equal(valid.listingComplete, true); assert.equal(valid.totalRecords, 1); assert.ok(valid.warnings.length >= 4);
  assert.equal(valid.records[0].firmName, ''); assert.equal(valid.records[0].city, ''); assert.equal(valid.records[0].district, '');
  assert.equal(valid.records[0].branch, ''); assert.equal(valid.records[0].phone, ''); assert.equal(valid.records[0].websiteUrl, '');
  assert.equal(valid.records[0].imageStatus, 'missing');
});

test('fresh listing and no-JSON recovery reuse images and fetch only new or deleted files', async () => {
  let newCard = false, gets = 0;
  const instance = browser({ fetchImpl: async (_url, init) => init.method === 'POST' ? listing(card() + (newCard ? card({ name: 'Yeni', image: '/medium/image/new_2/view' }) : '')) : (gets++, new Response(png)) });
  const first = await start(instance); const originalName = first.records[0].imageFileName;
  removeJson(instance.directory); newCard = true;
  const second = await start(instance);
  assert.equal(second.totalRecords, 2); assert.equal(second.records[0].imageFileName, originalName); assert.equal(gets, 2);
  assert.equal(second.records[0].imageSha256, digest(png));
  instance.directory.directories.get('images').files.delete(originalName);
  await start(instance); assert.equal(gets, 3, 'only deleted image is fetched');
});

test('invalid JSON and zero-byte images recover; known-hash changes are fetched again', async () => {
  let gets = 0;
  const instance = browser({ fetchImpl: async (_url, init) => init.method === 'POST' ? listing(card()) : (gets++, new Response(png)) });
  const first = await start(instance); const name = first.records[0].imageFileName;
  for (const text of ['{broken', 'null', '{"schemaVersion":99,"records":[]}']) {
    instance.directory.files.set('projects.json', new TextEncoder().encode(text)); instance.directory.files.delete('projects.resume.json');
    const recovered = await start(instance); assert.equal(recovered.records[0].imageFileName, name); assert.ok(recovered.warnings.length > 0);
  }
  assert.equal(gets, 1);
  const changed = Uint8Array.from(png); changed[40] ^= 1;
  instance.directory.directories.get('images').files.set(name, changed);
  await start(instance); assert.equal(gets, 2, 'cached SHA rejects changed bytes even when decoder accepts them');
  instance.directory.directories.get('images').files.set(name, new Uint8Array()); removeJson(instance.directory);
  await start(instance); assert.equal(gets, 3);
});

test('four-worker image downloads serialize monotone JSON snapshots and settle before completion', async () => {
  let active = 0, peak = 0, writers = 0, peakWriters = 0; const snapshots = [];
  const root = new Directory('parallel', {
    open: name => { if (name.endsWith('.json')) peakWriters = Math.max(peakWriters, ++writers); },
    beforeClose: async name => { if (name.endsWith('.json')) await tick(2); },
    close: (name, bytes) => { if (name.endsWith('.json')) writers--; if (name === 'projects.json') snapshots.push(JSON.parse(new TextDecoder().decode(bytes))); },
    abort: name => { if (name.endsWith('.json')) writers--; },
  });
  const html = Array.from({ length: 13 }, (_, index) => card({ name: `Proje ${index}`, image: `/medium/image/project_${index}/view` })).join('');
  const instance = browser({ root, fetchImpl: async (_url, init) => {
    if (init.method === 'POST') return listing(html);
    peak = Math.max(peak, ++active); try { await tick(8); return new Response(png); } finally { active--; }
  } });
  const manifest = await start(instance);
  assert.ok(peak > 1 && peak <= 4, `active image GETs: ${peak}`); assert.equal(active, 0); assert.equal(peakWriters, 1); assert.equal(writers, 0);
  const counts = snapshots.map(snapshot => snapshot.records.filter(record => record.imageStatus === 'downloaded').length);
  assert.ok(counts.every((count, index) => index === 0 || count >= counts[index - 1]), `snapshot regression: ${counts}`);
  assert.equal(manifest.records.filter(record => record.imageStatus === 'downloaded').length, 13);
  assert.equal(root.directories.get('ykb-anlasmali-projeler').json('projects.json').records.filter(record => record.imageStatus === 'downloaded').length, 13);
});

test('offline pause resumes on online event, canceling picker sends no requests', async () => {
  const instance = browser({ online: false }); const pending = instance.api.start();
  await until(() => instance.api.progress.stage === 'waiting'); assert.equal(instance.calls.length, 0);
  instance.setOnline(true); assert.equal((await pending).listingComplete, true);
  const canceled = browser({ pickerError: new DOMException('Canceled', 'AbortError') }); await canceled.api.start();
  assert.equal(canceled.api.busy, false); assert.equal(canceled.calls.length, 0);
});

function blockedImage(init, counter, delay = null) {
  counter.active++; return new Promise((resolve, reject) => {
    const done = callback => { clearTimeout(timer); init.signal.removeEventListener('abort', abort); counter.active--; callback(); };
    const abort = () => done(() => { counter.aborted++; reject(new DOMException('Stopped', 'AbortError')); });
    const timer = delay === null ? null : setTimeout(() => done(() => resolve(new Response(png))), delay);
    init.signal.addEventListener('abort', abort, { once: true }); if (init.signal.aborted) abort();
  });
}
test('Stop settles all workers and keeps completed images plus a partial final manifest', async () => {
  let gets = 0; const counter = { active: 0, aborted: 0 };
  const html = Array.from({ length: 8 }, (_, index) => card({ name: `Stop ${index}`, image: `/medium/image/stop_${index}/view` })).join('');
  const instance = browser({ fetchImpl: async (_url, init) => init.method === 'POST' ? listing(html) : blockedImage(init, counter, ++gets === 1 ? 5 : null) });
  const pending = instance.api.start(); await until(() => instance.api.manifest?.records.some(record => record.imageStatus === 'downloaded'));
  instance.api.stop(); const manifest = await pending;
  assert.equal(counter.active, 0); assert.ok(counter.aborted > 0); assert.equal(instance.api.busy, false);
  assert.ok(manifest.records.some(record => record.imageStatus === 'downloaded'));
  assert.ok(manifest.records.some(record => record.imageStatus !== 'downloaded'));
  assert.equal(instance.directory.json('projects.json').records.filter(record => record.imageStatus === 'downloaded').length, manifest.records.filter(record => record.imageStatus === 'downloaded').length);
});

test('checkpoint failure aborts all workers and cannot leave an apparently successful run', async () => {
  let gets = 0, completed = 0; const counter = { active: 0, aborted: 0 };
  const root = new Directory('disk', { failWrite: name => name === 'projects.json' && completed > 0, close: name => { if (name.endsWith('.png')) completed++; } });
  const html = Array.from({ length: 8 }, (_, index) => card({ name: `Fail ${index}`, image: `/medium/image/fail_${index}/view` })).join('');
  const instance = browser({ root, fetchImpl: async (_url, init) => init.method === 'POST' ? listing(html) : blockedImage(init, counter, ++gets === 1 ? 5 : null) });
  await instance.api.start(); assert.equal(instance.api.busy, false); assert.equal(counter.active, 0); assert.ok(counter.aborted > 0); assert.equal(instance.api.progress.stage, 'error');
});

// Optional local source captures are read in place, never downloaded by these tests.
const savedPages = new Map();
for (const page of [1, 2, 14, 15]) {
  try { savedPages.set(page, JSON.parse(await readFile(`C:/Users/kutay/AppData/Local/Temp/ykb-projects-page-${page}.json`, 'utf8'))); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
}
try { savedPages.set(13, JSON.parse(await readFile('C:/Users/kutay/.codex/attachments/856a2130-6c4b-4a2b-a109-8f44031fdaf1/Pasted text.txt', 'utf8'))); }
catch (error) { if (error.code !== 'ENOENT') throw error; }

test('saved first, second, supplied thirteenth and final page captures parse without following page fifteen', { skip: savedPages.size !== 5 }, async () => {
  const pages = [];
  const instance = browser({ fetchImpl: async (_url, init) => {
    if (init.method !== 'POST') return new Response(png);
    const index = JSON.parse(init.body).pageIndex; pages.push(index);
    const fixture = savedPages.get(index);
    return fixture ? new Response(JSON.stringify(fixture)) : listing(card({ name: `Synthetic page ${index}`, image: null }) + pager(index, 14));
  } });
  const manifest = await start(instance);
  assert.equal(manifest.listingComplete, true); assert.equal(manifest.totalPages, 14);
  assert.deepEqual(pages, [...Array.from({ length: 14 }, (_, index) => index + 1), 1]);
  assert.equal(manifest.records.filter(record => record.sourcePage === 1).length, 5);
  assert.equal(manifest.records.filter(record => record.sourcePage === 2).length, 5);
  assert.equal(manifest.records.filter(record => record.sourcePage === 13).length, 5);
  assert.equal(manifest.records.filter(record => record.sourcePage === 14).length, 1);
  assert.equal(manifest.totalRecords, 26);
  const tema = manifest.records.find(record => record.projectName === 'TEMA İSTANBUL 2');
  assert.equal(tema.city, 'İstanbul'); assert.equal(tema.district, 'Küçükçekmece');
  assert.equal(tema.firmName, 'MESA, ARTAŞ, KANTUR-AKDAŞ');
  assert.equal(tema.branch, 'Halkalı Meydan Şubesi ve Bakırköy Dikilitaş Şubesi');
  assert.match(tema.phone, /^\(0212\) 495 01 20 \[Halkalı Meydan Şubesi\] \/ \(0212\) 414 77 66/);
  const last = manifest.records.find(record => record.sourcePage === 14);
  assert.equal(last.projectName, 'YENİ LEVENT'); assert.equal(last.city, 'İstanbul'); assert.equal(last.district, 'Kağıthane');
  assert.equal(last.websiteUrl, 'https://dapyapi.com.tr/');
});
