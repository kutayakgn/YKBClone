import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash, webcrypto } from 'node:crypto';
import vm from 'node:vm';

const scriptUrl = new URL('../../scripts/download-yapikredi-asset-allocation-browser.js', import.meta.url);
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

const row = ({ date = '26.10.2026', type = 'Aylık', href = '/medium/file/gunluk_123/view' } = {}) =>
  `<tr><td class="firstTd">${date}</td><td>${type}</td><td class="lastTd">${href === null ? 'Dosya yok' : `<a href="${href}">indir</a>`}</td></tr>`;
const pager = (active = 1, last = 4) =>
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
    document, location: new URL('https://www.yapikredi.com.tr/yapi-kredi-hakkinda/piyasa-bulteni/varlik-dagilimi-bulteni/'),
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
  if (initialApi) context.ykbAssetAllocationExport = initialApi;
  context.window = context; context.self = context; context.top = context;
  const vmContext = vm.createContext(context);
  const reinject = () => vm.runInContext(source, vmContext, { filename: scriptUrl.pathname, timeout: 1000 });
  reinject();
  assert.ok(context.ykbAssetAllocationExport, 'console snippet exposes its browser control panel API');
  return { get api() { return context.ykbAssetAllocationExport; }, calls, context, root, get directory() { return root.directories.get('ykb-varlik-dagilim-onerileri'); }, state, logs, reinject,
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

const SOURCE = 'https://www.yapikredi.com.tr/yapi-kredi-hakkinda/piyasa-bulteni/varlik-dagilimi-bulteni/';
const TABLE = 'YkbYapikredi.AllAssetAllocationRecommendations';
const DATE_FROM = '2024-01-01T00:00:00+03:00', DATE_TO = '2026-12-31T23:59:59+03:00';

test('is a standalone browser snippet with no Node runtime dependencies', () => {
  assert.doesNotThrow(() => new vm.Script(source));
  assert.doesNotMatch(source, /^\s*(?:import\s|export\s)|require\s*\(|\bBuffer\b|node:|process\.argv|fs\/promises/m);
  assert.match(source, /showDirectoryPicker/); assert.match(source, /DOMParser/); assert.match(source, /crypto\.subtle/);
});

test('picker is synchronous and request timestamps/envelope match the asset-allocation controller exactly', async () => {
  const instance = browser({ fetchImpl: async (url, init) => {
    if (init.method !== 'POST') return new Response(pdf);
    assert.equal(String(url), SOURCE + 'default.aspx/LoadAssetAllocationReleases');
    assert.deepEqual(JSON.parse(init.body), { pageIndex: 1, dateFrom: DATE_FROM, dateTo: DATE_TO, type: 'Any' });
    return listing(row({ date: '30.09.2026' }));
  } });
  const promise = instance.api.start();
  assert.equal(instance.state.pickerCalls, 1);
  const manifest = await promise;
  assert.ok(manifest); assert.equal(instance.api.busy, false);
  assert.equal(manifest.schemaVersion, 1); assert.equal(manifest.sourceUrl, SOURCE); assert.equal(manifest.tableClassName, TABLE);
  assert.equal(manifest.startDate, '2024-01-01'); assert.equal(manifest.endDate, '2026-12-31');
  assert.equal(manifest.dateFrom, DATE_FROM); assert.equal(manifest.dateTo, DATE_TO);
  assert.equal(manifest.listingComplete, true); assert.equal(manifest.listingErrors.length, 0); assert.ok(Array.isArray(manifest.warnings));
  const record = manifest.records[0];
  assert.equal(record.date, '2026-09-30'); assert.equal(record.bulletinType, 'Aylık'); assert.equal(record.sourcePage, 1);
  assert.equal(record.status, 'downloaded'); assert.equal(record.sha256, sha256(pdf)); assert.equal(record.byteLength, pdf.length); assert.equal(record.error, null);
  assert.match(record.fileName, /^[a-z0-9._-]+\.pdf$/); assert.ok(record.fileName.length <= 50);
  const saved = await instance.directory.readJson('reports.json'); assert.equal(saved.tableClassName, TABLE); assert.equal(saved.dateTo, DATE_TO);
});

test('four pages and 34 records are complete without requesting page five', async () => {
  const requested = [];
  const instance = browser({ fetchImpl: async (_url, init) => {
    if (init.method !== 'POST') return new Response(pdf);
    const index = JSON.parse(init.body).pageIndex; requested.push(index);
    const count = index === 4 ? 4 : 10;
    return listing(Array.from({ length: count }, (_, offset) => row({ href: `/medium/file/page_${index}_${offset}/view` })).join('') + pager(index, 4));
  } });
  const manifest = await runSuccessful(instance);
  assert.deepEqual(requested, [1, 2, 3, 4, 1]); assert.equal(manifest.totalRecords, 34); assert.equal(manifest.totalPages, 4); assert.equal(manifest.listingComplete, true);
  assert.equal(manifest.records.filter(record => record.status === 'downloaded').length, 34);
  assert.ok(!manifest.sourceCountChanged); assert.ok(!manifest.warnings.some(warning => /Kaynak sayısı değişti/.test(warning)));
});

test('changed source counts warn and follow all actual pages rather than hard-coding four', async () => {
  const requested = [];
  const instance = browser({ fetchImpl: async (_url, init) => {
    if (init.method !== 'POST') return new Response(pdf);
    const index = JSON.parse(init.body).pageIndex; requested.push(index);
    return listing(Array.from({ length: 7 }, (_, offset) => row({ href: `/medium/file/new_${index}_${offset}/view` })).join('') + pager(index, 5));
  } });
  const manifest = await runSuccessful(instance);
  assert.deepEqual(requested, [1, 2, 3, 4, 5, 1]); assert.equal(manifest.totalRecords, 35); assert.equal(manifest.listingComplete, true);
  assert.equal(manifest.sourceCountChanged, true); assert.ok(manifest.warnings.some(warning => /Kaynak sayısı değişti/.test(warning)));
});

test('inclusive date boundaries and leap day are accepted; invalid or out-of-range dates stop listing', async () => {
  const valid = browser({ fetchImpl: async (_url, init) => init.method === 'POST' ? listing(
    row({ date: '01.01.2024', href: '/medium/file/start/view' }) + row({ date: '29.02.2024', href: '/medium/file/leap/view' }) + row({ date: '31.12.2026', href: '/medium/file/end/view' })) : new Response(pdf) });
  const accepted = await runSuccessful(valid); assert.equal(accepted.totalRecords, 3); assert.equal(accepted.listingComplete, true);
  assert.deepEqual(Array.from(accepted.records, record => record.date), ['2024-01-01', '2024-02-29', '2026-12-31']);
  for (const date of ['31.12.2023', '01.01.2027', '29.02.2025', '31.02.2024']) {
    const instance = browser({ fetchImpl: async (_url, init) => { assert.equal(init.method, 'POST'); return listing(row({ date })); } });
    const rejected = await runSuccessful(instance); assert.equal(rejected.listingComplete, false, date); assert.equal(rejected.totalRecords, 0, date); assert.ok(rejected.listingErrors.length > 0, date);
  }
});

test('entity text and long Turkish names retain data while deterministic ASCII filenames stay at most 50 characters', async () => {
  const type = 'Aylık &amp; ĞÜŞİÖÇ ğüşıöç '.repeat(8);
  const instance = browser({ fetchImpl: async (_url, init) => init.method === 'POST'
    ? listing(row({ type, href: '/medium/file/çok-uzun-bülten_1/view' }) + row({ type, href: '/medium/file/çok-uzun-bülten_2/view' })) : new Response(pdf) });
  const manifest = await runSuccessful(instance);
  assert.equal(manifest.records[0].bulletinType, 'Aylık & ĞÜŞİÖÇ ğüşıöç '.repeat(8).trim());
  assert.notEqual(manifest.records[0].fileName, manifest.records[1].fileName);
  for (const record of manifest.records) { assert.match(record.fileName, /^[a-z0-9._-]+\.pdf$/); assert.ok(record.fileName.length <= 50); }
});

test('PDF/DOCX bytes are accepted while generic ZIP, truncated PDF and HTML are reported without dropping records', async () => {
  const docx = storedZip({ '[Content_Types].xml': '<Types/>', '_rels/.rels': '<Relationships/>', 'word/document.xml': '<w:document/>' });
  const genericZip = storedZip({ 'readme.txt': 'not Word' });
  const html = ['pdf', 'word', 'zip', 'partial', 'html'].map(name => row({ href: `/medium/file/${name}/view` })).join('');
  const instance = browser({ fetchImpl: async (url, init) => {
    if (init.method === 'POST') return listing(html);
    return new Response(String(url).includes('/word/') ? docx : String(url).includes('/zip/') ? genericZip : String(url).includes('/partial/') ? '%PDF-1.7' : String(url).includes('/html/') ? '<html>Denied</html>' : pdf);
  } });
  const manifest = await runSuccessful(instance);
  assert.equal(manifest.listingComplete, true); assert.equal(manifest.totalRecords, 5);
  assert.equal(manifest.downloadedCount, 2); assert.equal(manifest.failedCount, 3);
  const word = manifest.records.find(record => record.sourceUrl.includes('/word/'));
  assert.match(word.fileName, /\.docx$/); assert.ok(word.fileName.length <= 50); assert.equal(word.sha256, sha256(docx)); assert.equal(word.byteLength, docx.length);
  assert.ok(manifest.records.filter(record => record.status === 'failed').every(record => record.error && record.sha256 === null && record.byteLength === null));
  assert.equal((await instance.directory.readJson('errors.json')).downloadErrors.length, 3);
});

test('server page mismatch, duplicate pages and missing row links cannot appear complete', async () => {
  for (const mode of ['mismatch', 'duplicate', 'link']) {
    const instance = browser({ fetchImpl: async (_url, init) => {
      if (init.method !== 'POST') return new Response(pdf);
      const index = JSON.parse(init.body).pageIndex;
      return listing(row({ href: mode === 'link' ? null : '/medium/file/same/view' }) + pager(mode === 'mismatch' ? 1 : index, 2));
    } });
    const manifest = await runSuccessful(instance); assert.equal(manifest.listingComplete, false, mode); assert.ok(manifest.listingErrors.length > 0, mode);
  }
});

test('JSON-free recovery reuses PDF and DOCX, builds a fresh manifest and downloads only missing/new files', async () => {
  const docx = storedZip({ '[Content_Types].xml': '<Types/>', 'word/document.xml': '<w:document/>' });
  let includeNew = false; const gets = new Map();
  const instance = browser({ fetchImpl: async (url, init) => {
    if (init.method === 'POST') return listing(row() + row({ href: '/medium/file/word/view' }) + (includeNew ? row({ href: '/medium/file/new/view' }) : ''));
    const key = String(url); gets.set(key, (gets.get(key) ?? 0) + 1); return new Response(key.includes('/word/') ? docx : pdf);
  } });
  const first = await runSuccessful(instance); deleteManifests(instance.directory); includeNew = true;
  const second = await runSuccessful(instance);
  assert.equal(second.totalRecords, 3); assert.equal(second.listingComplete, true); assert.equal(second.records[0].fileName, first.records[0].fileName); assert.equal(second.records[1].sha256, sha256(docx));
  assert.equal(gets.get(first.records[0].sourceUrl), 1); assert.equal(gets.get(first.records[1].sourceUrl), 1); assert.equal(gets.get(second.records[2].sourceUrl), 1);
  instance.directory.directories.get('reports').files.delete(second.records[0].fileName);
  await runSuccessful(instance); assert.equal(gets.get(first.records[0].sourceUrl), 2); assert.equal(gets.get(first.records[1].sourceUrl), 1);
});

test('bad or wrong-table cache metadata does not block local recovery; hashes and zero-byte files still force downloads', async () => {
  let gets = 0;
  const instance = browser({ fetchImpl: async (_url, init) => init.method === 'POST' ? listing(row()) : (gets++, new Response(pdf)) });
  const first = await runSuccessful(instance); const name = first.records[0].fileName;
  for (const text of ['{broken', 'null', JSON.stringify({ ...first, tableClassName: 'YkbYapikredi.DailyAllMarketBullettins' })]) {
    instance.directory.files.set('reports.json', new TextEncoder().encode(text)); instance.directory.files.delete('reports.resume.json');
    const recovered = await runSuccessful(instance); assert.equal(recovered.records[0].fileName, name); assert.ok(recovered.warnings.length > 0);
  }
  assert.equal(gets, 1);
  const changed = Uint8Array.from(pdf); changed[9] ^= 1;
  instance.directory.directories.get('reports').files.set(name, changed);
  await runSuccessful(instance); assert.equal(gets, 2, 'known SHA must catch same-size changes with intact PDF header and footer');
  instance.directory.directories.get('reports').files.set(name, new Uint8Array()); deleteManifests(instance.directory);
  await runSuccessful(instance); assert.equal(gets, 3);
});

test('failed downloads are retried while intact reports are reused', async () => {
  let failing = true, goodGets = 0, badGets = 0;
  const instance = browser({ fetchImpl: async (url, init) => {
    if (init.method === 'POST') return listing(row() + row({ href: '/medium/file/bad/view' }));
    if (String(url).includes('/bad/')) { badGets++; return new Response(failing ? '<html>Denied</html>' : pdf); }
    goodGets++; return new Response(pdf);
  } });
  const first = await runSuccessful(instance); assert.equal(first.failedCount, 1); failing = false;
  const second = await runSuccessful(instance); assert.equal(second.downloadedCount, 2); assert.equal(second.failedCount, 0); assert.equal(goodGets, 1); assert.equal(badGets, 2);
});

test('four document workers keep JSON snapshots serialized and final completion monotone', async () => {
  let active = 0, peak = 0, writers = 0, peakWriters = 0; const snapshots = [];
  const root = new MemoryDirectory('parallel', {
    onOpen: name => { if (name.endsWith('.json')) peakWriters = Math.max(peakWriters, ++writers); },
    beforeClose: async name => { if (name.endsWith('.json')) await tick(2); },
    onClose: (name, bytes) => { if (name.endsWith('.json')) writers--; if (name === 'reports.json') snapshots.push(JSON.parse(new TextDecoder().decode(bytes))); },
    onAbort: name => { if (name.endsWith('.json')) writers--; },
  });
  const html = Array.from({ length: 13 }, (_, index) => row({ href: `/medium/file/concurrent_${index}/view` })).join('');
  const instance = browser({ root, fetchImpl: async (_url, init) => {
    if (init.method === 'POST') return listing(html);
    peak = Math.max(peak, ++active); try { await tick(8); return new Response(pdf); } finally { active--; }
  } });
  const manifest = await runSuccessful(instance);
  assert.ok(peak > 1 && peak <= 4, `document GET concurrency: ${peak}`); assert.equal(active, 0); assert.equal(peakWriters, 1); assert.equal(writers, 0);
  const counts = snapshots.map(snapshot => snapshot.records.filter(record => record.status === 'downloaded').length);
  assert.ok(counts.every((count, index) => index === 0 || count >= counts[index - 1]));
  assert.equal(manifest.downloadedCount, 13); assert.equal((await instance.directory.readJson('reports.json')).downloadedCount, 13);
});

function blockedDocument(init, counters, delay = null) {
  counters.active++;
  return new Promise((resolve, reject) => {
    const done = callback => { clearTimeout(timer); init.signal.removeEventListener('abort', abort); counters.active--; callback(); };
    const abort = () => done(() => { counters.aborted++; reject(new DOMException('Stopped', 'AbortError')); });
    const timer = delay === null ? null : setTimeout(() => done(() => resolve(new Response(pdf))), delay);
    init.signal.addEventListener('abort', abort, { once: true }); if (init.signal.aborted) abort();
  });
}
test('Stop waits for all workers and preserves downloaded files plus explicit pending/failed rows', async () => {
  let gets = 0; const counters = { active: 0, aborted: 0 };
  const html = Array.from({ length: 8 }, (_, index) => row({ href: `/medium/file/stop_${index}/view` })).join('');
  const instance = browser({ fetchImpl: async (_url, init) => init.method === 'POST' ? listing(html) : blockedDocument(init, counters, ++gets === 1 ? 5 : null) });
  const promise = instance.api.start(); await until(() => instance.api.manifest?.records.some(record => record.status === 'downloaded'));
  instance.api.stop(); const manifest = await promise;
  assert.equal(counters.active, 0); assert.ok(counters.aborted > 0); assert.equal(instance.api.busy, false); assert.equal(manifest.interrupted, true);
  assert.ok(manifest.downloadedCount >= 1); assert.ok(manifest.pendingCount + manifest.failedCount > 0);
  assert.equal((await instance.directory.readJson('reports.json')).downloadedCount, manifest.downloadedCount);
});

test('a failed JSON checkpoint aborts and settles active workers', async () => {
  let gets = 0, completed = 0; const counters = { active: 0, aborted: 0 };
  const root = new MemoryDirectory('disk', { write: name => name === 'reports.json' && completed > 0, onClose: name => { if (name.endsWith('.pdf')) completed++; } });
  const html = Array.from({ length: 8 }, (_, index) => row({ href: `/medium/file/failure_${index}/view` })).join('');
  const instance = browser({ root, fetchImpl: async (_url, init) => init.method === 'POST' ? listing(html) : blockedDocument(init, counters, ++gets === 1 ? 5 : null) });
  await instance.api.start(); assert.equal(instance.api.busy, false); assert.equal(counters.active, 0); assert.ok(counters.aborted > 0); assert.equal(instance.api.progress.stage, 'error');
});

test('offline runs wait for connection and folder cancellation leaves no requests', async () => {
  const instance = browser({ online: false }); const pending = instance.api.start();
  await until(() => instance.api.progress.stage === 'waiting'); assert.equal(instance.calls.length, 0);
  instance.setOnline(true); assert.equal((await pending).listingComplete, true);
  const canceled = browser({ pickerError: new DOMException('Canceled', 'AbortError') }); await canceled.api.start(); assert.equal(canceled.api.busy, false); assert.equal(canceled.calls.length, 0);
});

const savedPages = new Map();
for (const page of [1, 2, 3, 4]) {
  try { savedPages.set(page, JSON.parse(await readFile(`C:/Users/kutay/AppData/Local/Temp/ykb-asset-allocation-page${page}.json`, 'utf8'))); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
}
test('saved real source pages parse all 34 monthly records and stop at the actual fourth page', { skip: savedPages.size !== 4 }, async () => {
  const requested = [];
  const instance = browser({ fetchImpl: async (_url, init) => {
    if (init.method !== 'POST') return new Response(pdf);
    const index = JSON.parse(init.body).pageIndex; requested.push(index); assert.ok(savedPages.has(index), 'must not request past page four');
    return new Response(JSON.stringify(savedPages.get(index)));
  } });
  const manifest = await runSuccessful(instance);
  assert.deepEqual(requested, [1, 2, 3, 4, 1]); assert.equal(manifest.listingComplete, true); assert.equal(manifest.totalRecords, 34);
  assert.deepEqual([1, 2, 3, 4].map(page => manifest.records.filter(record => record.sourcePage === page).length), [10, 10, 10, 4]);
  assert.ok(manifest.records.every(record => record.bulletinType === 'Aylık'));
  assert.equal(manifest.records[0].date, '2026-09-30'); assert.equal(manifest.records.at(-1).date, '2024-01-01');
  assert.equal(manifest.records[0].sourceUrl, 'https://www.yapikredi.com.tr/medium/file/ekim_72960/view');
});

