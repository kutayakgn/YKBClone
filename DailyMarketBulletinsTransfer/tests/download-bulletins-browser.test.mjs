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
  async *values() { for (const name of this.files.keys()) yield { name, kind: 'file' }; }
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
        let pending = new Uint8Array();
        return {
          write: async value => {
            if (directory.failure.write?.(name)) throw new DOMException('Disk full', 'QuotaExceededError');
            pending = typeof value === 'string' ? new TextEncoder().encode(value) : value instanceof Blob ? new Uint8Array(await value.arrayBuffer()) : new Uint8Array(value);
          },
          close: async () => { if (directory.failure.close?.(name)) throw new DOMException('Cannot save', 'NotAllowedError'); directory.files.set(name, pending); },
          abort: async () => {},
        };
      },
    };
  }
  async readJson(name) { return JSON.parse(new TextDecoder().decode(this.files.get(name))); }
}

function browser({ root = new MemoryDirectory(), fetchImpl, pickerError } = {}) {
  const document = { elements: new Map(), getElementById(id) { return this.elements.get(id) ?? null; }, createElement(tag) { return new Element(tag, {}, '', this); } };
  document.body = new Element('body', {}, '', document); document.documentElement = document.body;
  const calls = [], logs = [], state = { pickerCalls: 0, active: false };
  const context = {
    document, location: new URL('https://www.yapikredi.com.tr/yapi-kredi-blue-class/baska-turlu-bir-yatirim-mumkun-mu'),
    isSecureContext: true, DOMParser: Parser, crypto: webcrypto,
    URL, TextEncoder, TextDecoder, Blob, Response, Headers, AbortController, AbortSignal, DOMException, Uint8Array,
    setTimeout: (callback, milliseconds, ...args) => setTimeout(callback, milliseconds < 10000 ? 0 : milliseconds, ...args), clearTimeout,
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
  context.window = context; context.self = context; context.top = context;
  vm.runInNewContext(source, context, { filename: scriptUrl.pathname, timeout: 1000 });
  assert.ok(context.ykbBulletinExport, 'console snippet exposes its browser control panel API');
  return { api: context.ykbBulletinExport, calls, context, root, get directory() { return root.directories.get('ykb-piyasa-bultenleri'); }, state, logs };
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
  const damaged = Uint8Array.from(original); damaged[damaged.length - 2] ^= 1;
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
