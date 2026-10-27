import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash, webcrypto } from 'node:crypto';
import vm from 'node:vm';

const scriptUrl = new URL('../../scripts/download-yapikredi-bulletins-browser.js', import.meta.url);
const source = await readFile(scriptUrl, 'utf8');
const pdf = new TextEncoder().encode('%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF\n');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

function storedZip(entries) {
  const encoder = new TextEncoder(), locals = [], central = [];
  let offset = 0;
  const checksum = bytes => {
    let value = 0xffffffff;
    for (const byte of bytes) {
      value ^= byte;
      for (let bit = 0; bit < 8; bit++) value = (value >>> 1) ^ (0xedb88320 & -(value & 1));
    }
    return (value ^ 0xffffffff) >>> 0;
  };
  const join = chunks => {
    const result = new Uint8Array(chunks.reduce((length, chunk) => length + chunk.length, 0));
    let cursor = 0;
    for (const chunk of chunks) { result.set(chunk, cursor); cursor += chunk.length; }
    return result;
  };
  for (const [name, content] of Object.entries(entries)) {
    const nameBytes = encoder.encode(name), bytes = encoder.encode(content), crc = checksum(bytes);
    const local = new Uint8Array(30), header = new DataView(local.buffer);
    header.setUint32(0, 0x04034b50, true); header.setUint16(4, 20, true); header.setUint32(14, crc, true);
    header.setUint32(18, bytes.length, true); header.setUint32(22, bytes.length, true); header.setUint16(26, nameBytes.length, true);
    const entry = new Uint8Array(46), directory = new DataView(entry.buffer);
    directory.setUint32(0, 0x02014b50, true); directory.setUint16(4, 20, true); directory.setUint16(6, 20, true);
    directory.setUint32(16, crc, true); directory.setUint32(20, bytes.length, true); directory.setUint32(24, bytes.length, true);
    directory.setUint16(28, nameBytes.length, true); directory.setUint32(42, offset, true);
    locals.push(local, nameBytes, bytes); central.push(entry, nameBytes);
    offset += local.length + nameBytes.length + bytes.length;
  }
  const directory = join(central), end = new Uint8Array(22), footer = new DataView(end.buffer), count = Object.keys(entries).length;
  footer.setUint32(0, 0x06054b50, true); footer.setUint16(8, count, true); footer.setUint16(10, count, true);
  footer.setUint32(12, directory.length, true); footer.setUint32(16, offset, true);
  return join([...locals, directory, end]);
}

const row = ({ date = '26.10.2026', type = 'Günlük', href = '/medium/file/gunluk_123/view' } = {}) =>
  `<tr><td class="firstTd">${date}</td><td>${type}</td><td class="lastTd">${href === null ? 'Dosya yok' : `<a href="${href}">indir</a>`}</td></tr>`;
const pager = (active = 1, last = 281) =>
  `<tr><td colspan="3"><div class="pager"><ul><li class="pager-active" data-page="${active}"><a>${active}</a></li><li class="pager-last" data-page="${last}"><a>&gt;&gt;</a></li></ul></div></td></tr>`;
const listing = html => new Response(JSON.stringify({ d: { StatusCode: 200, Data: html, Exception: null } }), { headers: { 'content-type': 'application/json' } });

function decode(value) {
  return value.replace(/&(?:amp|quot|apos|lt|gt|nbsp);|&#(?:x[0-9a-f]+|\d+);/gi, match => {
    const named = { '&amp;': '&', '&quot;': '"', '&apos;': "'", '&lt;': '<', '&gt;': '>', '&nbsp;': ' ' };
    if (named[match]) return named[match];
    return String.fromCodePoint(match[2].toLowerCase() === 'x' ? parseInt(match.slice(3, -1), 16) : parseInt(match.slice(2, -1), 10));
  });
}

function attributes(value) {
  return Object.fromEntries([...value.matchAll(/([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)]
    .map(match => [match[1], decode(match[2] ?? match[3] ?? match[4])]));
}

// Small DOM facade for browser API execution; production uses native DOMParser.
class Element {
  constructor(tag = 'div', attrs = {}, html = '', owner = null) {
    this.tagName = tag.toUpperCase(); this.attrs = attrs; this.owner = owner; this.style = {};
    this.children = []; this.events = new Map(); this._html = html; this.textContent = decode(html.replace(/<[^>]*>/g, ''));
    this.id = attrs.id ?? ''; this.className = attrs.class ?? '';
    this.classList = { contains: name => this.className.split(/\s+/).includes(name) };
    this.dataset = Object.fromEntries(Object.entries(attrs).filter(([key]) => key.startsWith('data-')).map(([key, value]) => [key.slice(5), value]));
  }
  get innerHTML() { return this._html; }
  set innerHTML(html) {
    this._html = html;
    this.textContent = decode(html.replace(/<[^>]*>/g, ''));
    if (this.tagName === 'TBODY' || this.tagName === 'TABLE') {
      this.children = [...html.matchAll(/<tr\b([^>]*)>([\s\S]*?)<\/tr\s*>/gi)].map(match => {
        const result = new Element('tr', attributes(match[1]), match[2]);
        result.children = [...match[2].matchAll(/<td\b([^>]*)>([\s\S]*?)<\/td\s*>/gi)]
          .map(cell => new Element('td', attributes(cell[1]), cell[2]));
        return result;
      });
    }
    if (this.owner) for (const match of html.matchAll(/<([a-z][\w-]*)\b([^>]*)>/gi)) {
      const attrs = attributes(match[2]);
      if (attrs.id) this.owner.elements.set(attrs.id, new Element(match[1], attrs, '', this.owner));
    }
  }
  getAttribute(name) { return this.attrs[name] ?? null; }
  hasAttribute(name) { return Object.hasOwn(this.attrs, name); }
  setAttribute(name, value) { this.attrs[name] = String(value); }
  addEventListener(name, callback) { this.events.set(name, callback); }
  removeEventListener(name) { this.events.delete(name); }
  appendChild(child) { this.children.push(child); if (child.id && this.owner) this.owner.elements.set(child.id, child); return child; }
  append(...children) { for (const child of children) this.appendChild(child); }
  remove() { if (this.owner) this.owner.elements.delete(this.id); }
  querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null; }
  querySelectorAll(selector) {
    if (selector.startsWith('#')) return this.owner?.getElementById(selector.slice(1)) ? [this.owner.getElementById(selector.slice(1))] : [];
    if (selector === 'a[href]') return [...this._html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi)]
      .map(match => new Element('a', attributes(match[1]), match[2])).filter(element => element.getAttribute('href') !== null);
    if (selector === 'li[data-page]') return [...this._html.matchAll(/<li\b([^>]*)>/gi)]
      .map(match => new Element('li', attributes(match[1]))).filter(element => element.getAttribute('data-page') !== null);
    if (selector === 'td') return this.children.filter(element => element.tagName === 'TD');
    if (selector === 'tr') return this.children.filter(element => element.tagName === 'TR');
    if (selector === 'td[colspan]') return this.children.flatMap(element => element.children).filter(element => element.tagName === 'TD' && element.hasAttribute('colspan'));
    return [];
  }
}

class Parser {
  parseFromString() {
    const table = new Element('table');
    return { querySelector: selector => selector === 'table' ? table : null };
  }
}

class MemoryDirectory {
  constructor(name = 'chosen-folder', failure = {}) { this.name = name; this.kind = 'directory'; this.files = new Map(); this.directories = new Map(); this.failure = failure; }
  async queryPermission() { return 'granted'; }
  async requestPermission() { return 'granted'; }
  async *values() { for (const name of this.files.keys()) yield await this.getFileHandle(name); }
  async getDirectoryHandle(name, { create = false } = {}) {
    if (!this.directories.has(name)) {
      if (!create) throw new DOMException('Not found', 'NotFoundError');
      this.directories.set(name, new MemoryDirectory(name, this.failure));
    }
    return this.directories.get(name);
  }
  async getFileHandle(name, { create = false } = {}) {
    if (this.failure.create?.(name)) throw new DOMException('Cannot create file', 'NotAllowedError');
    if (!this.files.has(name)) {
      if (!create) throw new DOMException('Not found', 'NotFoundError');
      this.files.set(name, new Uint8Array());
    }
    const directory = this;
    return {
      name, kind: 'file',
      getFile: async () => new Blob([directory.files.get(name)]),
      createWritable: async () => {
        if (directory.failure.writable?.(name)) throw new DOMException('Cannot open writable', 'NotAllowedError');
        await directory.failure.onOpen?.(name, directory);
        let pending = new Uint8Array();
        let finished = false;
        return {
          write: async value => {
            if (directory.failure.write?.(name)) throw new DOMException('Disk full', 'QuotaExceededError');
            pending = typeof value === 'string' ? new TextEncoder().encode(value) : value instanceof Blob ? new Uint8Array(await value.arrayBuffer()) : new Uint8Array(value);
            await directory.failure.afterWrite?.(name, pending, directory);
          },
          close: async () => {
            if (directory.failure.close?.(name)) throw new DOMException('Cannot save', 'NotAllowedError');
            await directory.failure.beforeClose?.(name, pending, directory);
            directory.files.set(name, pending);
            finished = true;
            await directory.failure.onClose?.(name, pending, directory);
          },
          abort: async () => { if (!finished) { finished = true; await directory.failure.onAbort?.(name, directory); } },
        };
      },
    };
  }
  async readJson(name) { return JSON.parse(new TextDecoder().decode(this.files.get(name))); }
}

function browser({ root = new MemoryDirectory(), fetchImpl, pickerError, online = true, initialApi } = {}) {
  const document = { elements: new Map(), getElementById(id) { return this.elements.get(id) ?? null; }, createElement(tag) { return new Element(tag, {}, '', this); } };
  document.body = new Element('body', {}, '', document); document.documentElement = document.body;
  const calls = [], logs = [], state = { pickerCalls: 0, online };
  const listeners = new Map();
  const context = {
    document, location: new URL('https://www.yapikredi.com.tr/yapi-kredi-blue-class/baska-turlu-bir-yatirim-mumkun-mu'),
    isSecureContext: true, DOMParser: Parser, crypto: webcrypto,
    navigator: { get onLine() { return state.online; } },
    URL, TextEncoder, TextDecoder, Blob, Response, Headers, AbortController, AbortSignal, DOMException, Uint8Array,
    setTimeout: (callback, milliseconds, ...args) => setTimeout(callback, milliseconds === 5000 ? 30 : milliseconds < 10000 ? 0 : milliseconds, ...args), clearTimeout,
    setInterval: (callback, milliseconds, ...args) => setInterval(callback, milliseconds < 10000 ? 2 : milliseconds, ...args), clearInterval,
    addEventListener: (name, callback) => { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name).add(callback); },
    removeEventListener: (name, callback) => listeners.get(name)?.delete(callback),
    dispatchEvent: event => { for (const callback of listeners.get(event.type) ?? []) callback(event); },
    console: { log: (...args) => logs.push(args), info: (...args) => logs.push(args), warn: (...args) => logs.push(args), error: (...args) => logs.push(args) },
    showDirectoryPicker: () => {
      state.pickerCalls++;
      if (pickerError) return Promise.reject(pickerError);
      return Promise.resolve(root);
    },
    fetch: async (url, init = {}) => {
      calls.push({ url: String(url), init });
      if (fetchImpl) return fetchImpl(url, init);
      return init.method === 'POST' ? listing(row()) : new Response(pdf);
    },
    alert: value => logs.push([value]),
  };
  if (initialApi) context.ykbBulletinExport = initialApi;
  context.window = context; context.self = context; context.top = context;
  const vmContext = vm.createContext(context);
  const reinject = () => vm.runInContext(source, vmContext, { filename: scriptUrl.pathname, timeout: 1000 });
  reinject();
  assert.ok(context.ykbBulletinExport, 'console snippet exposes its browser control panel API');
  return { get api() { return context.ykbBulletinExport; }, calls, context, root, get directory() { return root.directories.get('ykb-piyasa-bultenleri'); }, state, logs, reinject,
    setOnline(value) { state.online = value; context.dispatchEvent({ type: value ? 'online' : 'offline' }); } };
}

const tick = (milliseconds = 0) => new Promise(resolve => setTimeout(resolve, milliseconds));
async function until(predicate, message = 'condition was not reached') {
  const deadline = Date.now() + 2000;
  while (!predicate()) { if (Date.now() > deadline) assert.fail(message); await tick(2); }
}

async function runSuccessful(instance) {
  const result = await instance.api.start();
  assert.ok(result, instance.logs.map(args => args.map(value => value?.message ?? value).join(' ')).join('\n'));
  return result;
}

function deleteManifests(directory) {
  for (const name of ['reports.json', 'reports.resume.json', 'errors.json']) directory.files.delete(name);
}

test('is a self-contained browser snippet with no Node imports or file APIs', () => {
  assert.doesNotThrow(() => new vm.Script(source));
  assert.doesNotMatch(source, /^\s*(?:import\s|export\s)|require\s*\(|\bBuffer\b|node:|process\.argv|fs\/promises/m);
  assert.match(source, /showDirectoryPicker/);
  assert.match(source, /DOMParser/);
  assert.match(source, /crypto\.subtle/);
});

test('selects a folder immediately, paginates and persists importer-compatible JSON and ASCII files', async () => {
  const instance = browser({ fetchImpl: async (_url, init) => {
    if (init.method !== 'POST') return new Response(pdf);
    const payload = JSON.parse(init.body);
    assert.equal(payload.type, 'Any');
    assert.equal(payload.dateFrom, '1964-01-01T00:00:00+03:00');
    assert.equal(payload.dateTo, '2029-01-01T00:00:00+03:00');
    const isSecond = payload.pageIndex === 2;
    return listing(row({ date: isSecond ? '25.10.2026' : '26.10.2026', type: 'ĞÜŞİÖÇ ğüşıöç '.repeat(10), href: isSecond ? '/medium/file/ikinci_2/view' : '/medium/file/ilk_1/view' }) + pager(payload.pageIndex, 2));
  } });
  const promise = instance.api.start();
  assert.equal(instance.state.pickerCalls, 1, 'picker must run in the synchronous user gesture');
  const manifest = await promise;
  assert.equal(instance.api.busy, false);
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.listingComplete, true);
  assert.equal(manifest.totalRecords, 2);
  assert.equal(manifest.listingErrors.length, 0);
  const folder = instance.directory.directories.get('reports');
  const names = Array.from(manifest.records, record => record.fileName);
  assert.equal(new Set(names).size, 2);
  for (const record of manifest.records) {
    assert.equal(record.status, 'downloaded');
    assert.match(record.fileName, /^[A-Za-z0-9._-]+\.pdf$/);
    assert.ok(record.fileName.length <= 50);
    assert.equal(record.sha256, sha256(pdf));
    assert.equal(record.byteLength, pdf.length);
    assert.deepEqual(folder.files.get(record.fileName), pdf);
  }
  const saved = await instance.directory.readJson('reports.json');
  assert.equal(saved.totalRecords, 2);
  assert.deepEqual(saved.records.map(record => record.fileName), names);
  assert.equal((await instance.directory.readJson('errors.json')).downloadErrors.length, 0);
});

test('downloads real DOCX ZIP bytes and rejects generic ZIP and truncated PDF content', async () => {
  const docx = storedZip({ '[Content_Types].xml': '<Types/>', '_rels/.rels': '<Relationships/>', 'word/document.xml': '<w:document/>' });
  const genericZip = storedZip({ 'readme.txt': 'ordinary ZIP, not Word' });
  const instance = browser({ fetchImpl: async (url, init) => {
    if (init.method === 'POST') return listing(row({ href: '/medium/file/word_1/view' }) + row({ date: '25.10.2026', href: '/medium/file/zip_2/view' }) + row({ date: '24.10.2026', href: '/medium/file/partial_3/view' }));
    if (String(url).includes('/word_1/')) return new Response(docx);
    if (String(url).includes('/zip_2/')) return new Response(genericZip);
    return new Response('%PDF-1.7');
  } });
  const manifest = await instance.api.start();
  const word = manifest.records.find(record => record.sourceUrl.includes('/word_1/'));
  assert.equal(word.status, 'downloaded');
  assert.match(word.fileName, /\.docx$/);
  assert.ok(word.fileName.length <= 50);
  assert.equal(word.sha256, sha256(docx));
  assert.equal(word.byteLength, docx.length);
  assert.equal(manifest.records.filter(record => record.status === 'failed').length, 2);
  assert.equal((await instance.directory.readJson('errors.json')).downloadErrors.length, 2);
});

test('canceled folder picker sends no requests and leaves the control panel idle', async () => {
  const instance = browser({ pickerError: new DOMException('User canceled', 'AbortError') });
  await instance.api.start();
  assert.equal(instance.calls.length, 0);
  assert.equal(instance.api.busy, false);
});

test('failed documents are reported, then resumed without redownloading good files', async () => {
  let failed = true, goodGets = 0, badGets = 0;
  const instance = browser({ fetchImpl: async (url, init) => {
    if (init.method === 'POST') return listing(row() + row({ date: '25.10.2026', href: '/medium/file/failed_2/view' }));
    if (String(url).includes('/failed_2/')) { badGets++; return failed ? new Response('<html>Denied</html>') : new Response(pdf); }
    goodGets++; return new Response(pdf);
  } });
  const first = await instance.api.start();
  assert.equal(first.listingComplete, true);
  assert.equal(first.records.filter(record => record.status === 'downloaded').length, 1);
  assert.equal(first.records.filter(record => record.status === 'failed').length, 1);
  assert.equal((await instance.directory.readJson('errors.json')).downloadErrors.length, 1);
  failed = false;
  const second = await instance.api.start();
  assert.equal(second.records.filter(record => record.status === 'downloaded').length, 2);
  assert.equal(goodGets, 1);
  assert.ok(badGets >= 2);
  const good = second.records.find(record => record.sourceUrl.includes('gunluk_123'));
  const original = instance.directory.directories.get('reports').files.get(good.fileName);
  const damaged = Uint8Array.from(original); damaged[9] ^= 1; // Preserve PDF header/EOF; only SHA detects this change.
  instance.directory.directories.get('reports').files.set(good.fileName, damaged);
  await instance.api.start();
  assert.equal(goodGets, 2, 'same-size changed contents must fail SHA validation and download again');
});

test('duplicate listing pages are saved as incomplete', async () => {
  const instance = browser({ fetchImpl: async (_url, init) => init.method === 'POST'
    ? listing(row() + pager(JSON.parse(init.body).pageIndex, 2)) : new Response(pdf) });
  const manifest = await instance.api.start();
  assert.equal(manifest.listingComplete, false);
  assert.ok(manifest.listingErrors.length > 0);
  assert.equal((await instance.directory.readJson('reports.json')).listingComplete, false);
});

test('a server page mismatch cannot be marked as complete', async () => {
  const instance = browser({ fetchImpl: async (_url, init) => init.method === 'POST'
    ? listing(row() + pager(1, 2)) : new Response(pdf) });
  const manifest = await instance.api.start();
  assert.equal(manifest.listingComplete, false);
  assert.equal(manifest.totalRecords, 1);
  assert.ok(manifest.listingErrors.some(error => /2.*sayfa.*1/s.test(error.error)));
});

test('retries transient listing HTTP failures and document network failures', async () => {
  let posts = 0, gets = 0;
  const instance = browser({ fetchImpl: async (_url, init) => {
    if (init.method === 'POST') return ++posts === 1 ? new Response('busy', { status: 503 }) : listing(row());
    if (++gets === 1) throw new TypeError('temporary network failure');
    return new Response(pdf);
  } });
  const manifest = await instance.api.start();
  assert.equal(manifest.listingComplete, true);
  assert.equal(manifest.records[0].status, 'downloaded');
  assert.equal(posts, 3, 'initial failure, successful listing and first-page verification');
  assert.equal(gets, 2, 'initial failure and successful retry');
  assert.equal(instance.api.progress.stage, 'complete');
});

test('a PDF write failure cannot become a downloaded record', async () => {
  const root = new MemoryDirectory('disk', { write: name => /\.pdf$/i.test(name) });
  const instance = browser({ root });
  const manifest = await instance.api.start();
  assert.ok(manifest);
  assert.equal(manifest.records[0].status, 'failed');
  assert.match(manifest.records[0].error, /Disk full|QuotaExceeded/i);
  assert.equal((await instance.directory.readJson('errors.json')).downloadErrors.length, 1);
  assert.equal((await instance.directory.readJson('reports.json')).records[0].status, 'failed');
});

test('a manifest write failure stops network work and resets busy state', async () => {
  const root = new MemoryDirectory('disk', { write: name => name === 'reports.json' });
  const instance = browser({ root });
  await instance.api.start();
  assert.equal(instance.api.busy, false);
  assert.equal(instance.calls.length, 0);
});

test('Stop aborts an active request and leaves resumable incomplete JSON', async () => {
  let signal;
  const instance = browser({ fetchImpl: async (_url, init) => {
    signal = init.signal;
    instance.api.stop();
    throw new DOMException('Canceled', 'AbortError');
  } });
  const manifest = await instance.api.start();
  assert.equal(signal.aborted, true);
  assert.equal(instance.api.busy, false);
  assert.ok(manifest);
  assert.equal(manifest.listingComplete, false);
  assert.equal((await instance.directory.readJson('reports.json')).listingComplete, false);
});

test('fresh source listing recovers PDF and DOCX without JSON, then downloads only a new source row', async () => {
  const docx = storedZip({ '[Content_Types].xml': '<Types/>', 'word/document.xml': '<w:document/>' });
  let includeNew = false;
  const gets = new Map();
  const instance = browser({ fetchImpl: async (url, init) => {
    if (init.method === 'POST') return listing(row() + row({ date: '25.10.2026', href: '/medium/file/word_2/view' }) + (includeNew ? row({ date: '24.10.2026', href: '/medium/file/new_3/view' }) : ''));
    const key = String(url); gets.set(key, (gets.get(key) ?? 0) + 1);
    return new Response(key.includes('/word_2/') ? docx : pdf);
  } });
  const first = await runSuccessful(instance);
  assert.equal(first.records[0].fileName, '2026-10-26-gunluk-gunluk-123-81da856e1a45.pdf', 'old script filename must remain compatible');
  const originalNames = Array.from(first.records, record => record.fileName);
  deleteManifests(instance.directory);
  includeNew = true;
  const recovered = await runSuccessful(instance);
  assert.equal(recovered.listingComplete, true);
  assert.equal(recovered.totalRecords, 3);
  assert.deepEqual(Array.from(recovered.records.slice(0, 2), record => record.fileName), originalNames);
  assert.equal(recovered.records.filter(record => record.status === 'downloaded').length, 3);
  assert.equal(gets.get(first.records[0].sourceUrl), 1);
  assert.equal(gets.get(first.records[1].sourceUrl), 1);
  assert.equal(gets.get(recovered.records[2].sourceUrl), 1);
  assert.equal(recovered.records[1].sha256, sha256(docx));
  const saved = await instance.directory.readJson('reports.json');
  assert.equal(saved.totalRecords, 3);
  assert.equal(saved.records[1].byteLength, docx.length);
  instance.directory.directories.get('reports').files.delete(recovered.records[0].fileName);
  await runSuccessful(instance);
  assert.equal(gets.get(first.records[0].sourceUrl), 2, 'only the deleted file is downloaded again');
  assert.equal(gets.get(first.records[1].sourceUrl), 1);
  assert.equal(gets.get(recovered.records[2].sourceUrl), 1);
});

test('invalid, null and unsupported old JSON warn and do not block file reuse', async () => {
  let gets = 0;
  const instance = browser({ fetchImpl: async (_url, init) => init.method === 'POST' ? listing(row()) : (gets++, new Response(pdf)) });
  const first = await runSuccessful(instance);
  const variants = ['{broken', 'null', '[]', JSON.stringify({ schemaVersion: 9, records: [] }), JSON.stringify({ schemaVersion: 1, records: null })];
  for (const bad of variants) {
    instance.directory.files.set('reports.json', new TextEncoder().encode(bad));
    instance.directory.files.set('reports.resume.json', new TextEncoder().encode(bad));
    const recovered = await runSuccessful(instance);
    assert.equal(recovered.listingComplete, true);
    assert.equal(recovered.records[0].fileName, first.records[0].fileName);
    assert.equal(recovered.records[0].sha256, sha256(pdf));
    assert.ok(recovered.warnings.length > 0, `invalid JSON must be reported: ${bad}`);
  }
  instance.directory.files.set('reports.json', new TextEncoder().encode('{broken'));
  instance.directory.files.set('reports.resume.json', new TextEncoder().encode(JSON.stringify(first)));
  const withResume = await runSuccessful(instance);
  assert.equal(withResume.records[0].status, 'downloaded');
  assert.ok(withResume.warnings.length > 0);
  assert.equal(gets, 1, 'valid document is reused even when all old JSON metadata is unusable');
});

test('an orphan document written before any JSON checkpoint is recovered by its old deterministic name', async () => {
  const root = new MemoryDirectory();
  const directory = await root.getDirectoryHandle('ykb-piyasa-bultenleri', { create: true });
  const reports = await directory.getDirectoryHandle('reports', { create: true });
  const oldName = '2026-10-26-gunluk-gunluk-123-81da856e1a45.pdf';
  reports.files.set(oldName, pdf);
  const instance = browser({ root, fetchImpl: async (_url, init) => {
    assert.equal(init.method, 'POST', 'recovered document must not be fetched');
    return listing(row());
  } });
  const manifest = await runSuccessful(instance);
  assert.equal(manifest.records[0].fileName, oldName);
  assert.equal(manifest.records[0].status, 'downloaded');
  assert.equal(manifest.records[0].sha256, sha256(pdf));
  assert.equal((await directory.readJson('reports.json')).records[0].byteLength, pdf.length);
});

test('invalid local document content is redownloaded even without old JSON', async () => {
  const root = new MemoryDirectory();
  const directory = await root.getDirectoryHandle('ykb-piyasa-bultenleri', { create: true });
  const reports = await directory.getDirectoryHandle('reports', { create: true });
  const oldName = '2026-10-26-gunluk-gunluk-123-81da856e1a45.pdf';
  reports.files.set(oldName, new TextEncoder().encode('%PDF-1.7'));
  let gets = 0;
  const instance = browser({ root, fetchImpl: async (_url, init) => init.method === 'POST' ? listing(row()) : (gets++, new Response(pdf)) });
  const manifest = await runSuccessful(instance);
  assert.equal(gets, 1);
  assert.equal(manifest.records[0].status, 'downloaded');
  assert.deepEqual(reports.files.get(oldName), pdf);
  reports.files.set(oldName, new Uint8Array());
  deleteManifests(directory);
  await runSuccessful(instance);
  assert.equal(gets, 2, 'a zero-byte file left by an aborted writable is not reused');
  assert.deepEqual(reports.files.get(oldName), pdf);
});

test('bad cached metadata cannot attach another report’s valid local PDF to a fresh source record', async () => {
  let newSource = false, gets = 0;
  const newHref = '/medium/file/different_456/view';
  const instance = browser({ fetchImpl: async (_url, init) => init.method === 'POST'
    ? listing(row({ href: newSource ? newHref : '/medium/file/gunluk_123/view' })) : (gets++, new Response(pdf)) });
  const first = await runSuccessful(instance);
  const badCache = JSON.parse(JSON.stringify(first));
  badCache.records[0].sourceUrl = 'https://www.yapikredi.com.tr' + newHref;
  instance.directory.files.set('reports.json', new TextEncoder().encode(JSON.stringify(badCache)));
  instance.directory.files.delete('reports.resume.json');
  newSource = true;
  const next = await runSuccessful(instance);
  assert.equal(gets, 2, 'a filename carrying a different identity hash must not satisfy the new report');
  assert.notEqual(next.records[0].fileName, first.records[0].fileName);
  assert.ok(next.warnings.length > 0);
  assert.deepEqual(instance.directory.directories.get('reports').files.get(first.records[0].fileName), pdf);
});

test('parallel downloads are bounded to four and JSON snapshots never overlap or regress', async () => {
  let activeGets = 0, peakGets = 0, activeJson = 0, peakJson = 0;
  const snapshots = [];
  const isJson = name => name.endsWith('.json');
  const root = new MemoryDirectory('parallel', {
    onOpen: name => { if (isJson(name)) peakJson = Math.max(peakJson, ++activeJson); },
    beforeClose: async name => { if (isJson(name)) await tick(2); },
    onClose: (name, bytes) => { if (isJson(name)) activeJson--; if (name === 'reports.json') snapshots.push(JSON.parse(new TextDecoder().decode(bytes))); },
    onAbort: name => { if (isJson(name)) activeJson--; },
  });
  const html = Array.from({ length: 13 }, (_, index) => row({ href: `/medium/file/report_${index}/view` })).join('');
  const instance = browser({ root, fetchImpl: async (_url, init) => {
    if (init.method === 'POST') return listing(html);
    peakGets = Math.max(peakGets, ++activeGets);
    try { await tick(8); return new Response(pdf); }
    finally { activeGets--; }
  } });
  const manifest = await runSuccessful(instance);
  assert.ok(peakGets > 1 && peakGets <= 4, `concurrent GET count: ${peakGets}`);
  assert.equal(activeGets, 0);
  assert.equal(peakJson, 1, 'all metadata writes must be serialized');
  assert.equal(activeJson, 0);
  assert.equal(manifest.records.filter(record => record.status === 'downloaded').length, 13);
  const counts = snapshots.map(snapshot => snapshot.records.filter(record => record.status === 'downloaded').length);
  assert.ok(counts.every((count, index) => index === 0 || count >= counts[index - 1]), `snapshots regressed: ${counts}`);
  const saved = await instance.directory.readJson('reports.json');
  assert.equal(saved.totalRecords, 13);
  assert.equal(saved.downloadedCount, 13);
  assert.equal(saved.pendingCount, 0);
  assert.equal((await instance.directory.readJson('errors.json')).downloadErrors.length, 0);
});

function abortableDocument(init, counters, delay = null) {
  counters.active++;
  counters.peak = Math.max(counters.peak, counters.active);
  return new Promise((resolve, reject) => {
    const finish = callback => { clearTimeout(timer); init.signal.removeEventListener('abort', aborted); counters.active--; callback(); };
    const aborted = () => finish(() => { counters.aborted++; reject(new DOMException('Stopped', 'AbortError')); });
    const timer = delay === null ? null : setTimeout(() => finish(() => resolve(new Response(pdf))), delay);
    init.signal.addEventListener('abort', aborted, { once: true });
    if (init.signal.aborted) aborted();
  });
}

test('Stop waits for every active worker and preserves completed files in final JSON', async () => {
  const counters = { active: 0, peak: 0, aborted: 0 };
  let gets = 0;
  const html = Array.from({ length: 8 }, (_, index) => row({ href: `/medium/file/stop_${index}/view` })).join('');
  const instance = browser({ fetchImpl: async (_url, init) => init.method === 'POST' ? listing(html) : abortableDocument(init, counters, ++gets === 1 ? 5 : null) });
  const promise = instance.api.start();
  await until(() => instance.api.manifest?.records.some(record => record.status === 'downloaded'), 'first worker did not complete');
  assert.ok(counters.active > 0);
  instance.api.stop();
  const manifest = await promise;
  assert.ok(manifest);
  assert.equal(instance.api.busy, false);
  assert.equal(counters.active, 0);
  assert.ok(counters.aborted >= 1);
  const saved = await instance.directory.readJson('reports.json');
  assert.equal(saved.downloadedCount, manifest.records.filter(record => record.status === 'downloaded').length);
  assert.ok(saved.downloadedCount >= 1);
  assert.ok(saved.pendingCount + saved.failedCount > 0);
  for (const record of saved.records.filter(record => record.status === 'downloaded')) assert.ok(instance.directory.directories.get('reports').files.has(record.fileName));
});

test('a checkpoint failure aborts and settles workers before busy resets', async () => {
  const counters = { active: 0, peak: 0, aborted: 0 };
  let finishedDocuments = 0, gets = 0;
  const root = new MemoryDirectory('failing', {
    write: name => name === 'reports.json' && finishedDocuments > 0,
    onClose: name => { if (/\.pdf$/.test(name)) finishedDocuments++; },
  });
  const html = Array.from({ length: 8 }, (_, index) => row({ href: `/medium/file/failure_${index}/view` })).join('');
  const instance = browser({ root, fetchImpl: async (_url, init) => init.method === 'POST' ? listing(html) : abortableDocument(init, counters, ++gets === 1 ? 5 : null) });
  await instance.api.start();
  assert.equal(instance.api.busy, false);
  assert.equal(counters.active, 0);
  assert.ok(counters.aborted >= 1);
  assert.equal(instance.api.progress.stage, 'error');
  assert.equal(finishedDocuments, 1, 'no new successful writes should continue after persistence failed');
});

test('offline state pauses before HTTP, then an online event resumes the same run', async () => {
  const instance = browser({ online: false });
  const promise = instance.api.start();
  await until(() => instance.api.progress.stage === 'waiting', 'offline status was not shown');
  assert.equal(instance.calls.length, 0);
  instance.setOnline(true);
  const manifest = await promise;
  assert.equal(manifest.listingComplete, true);
  assert.equal(manifest.records[0].status, 'downloaded');
});

test('stale offline hints are bounded and do not permanently block a reachable server', async () => {
  const instance = browser({ online: false });
  const manifest = await runSuccessful(instance);
  assert.equal(instance.state.online, false);
  assert.equal(manifest.records[0].status, 'downloaded');
  assert.ok(instance.calls.length > 0);
});

test('repasting replaces an idle old version and preserves an active run', () => {
  const old = { version: 1, busy: false };
  const idle = browser({ initialApi: old });
  assert.notEqual(idle.api, old);
  assert.equal(idle.api.version, 3);
  const first = idle.api;
  idle.reinject();
  assert.notEqual(idle.api, first);
  assert.equal(idle.api.version, 3);
  const running = { version: 1, busy: true };
  const busy = browser({ initialApi: running });
  assert.equal(busy.api, running);
  assert.equal(busy.state.pickerCalls, 0);
});

test('Stop between the connection check and request creation does not start another fetch', async () => {
  const instance = browser();
  let scheduled = false;
  Object.defineProperty(instance.context.navigator, 'onLine', {
    configurable: true,
    get() {
      if (!scheduled) {
        scheduled = true;
        queueMicrotask(() => instance.api.stop());
      }
      return true;
    },
  });
  const manifest = await instance.api.start();
  assert.ok(scheduled);
  assert.ok(manifest);
  assert.equal(instance.calls.length, 0, 'a request cannot begin after the parent signal was aborted');
  assert.equal(instance.api.busy, false);
  assert.equal(manifest.listingComplete, false);
});
