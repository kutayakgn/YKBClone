/* Yapı Kredi bülten arşivi. Chrome/Edge DevTools Console'a tamamını yapıştırın.
   https://www.yapikredi.com.tr/yapi-kredi-blue-class/baska-turlu-bir-yatirim-mumkun-mu
   Ardından açılan paneldeki gerçek düğmeye basıp bir üst klasör seçin. */
(() => {
  'use strict';
  if (window.ykbBulletinExport) {
    console.info('Bülten paneli zaten açık. window.ykbBulletinExport üzerinden durumu inceleyebilirsiniz.');
    return;
  }
  const SOURCE = 'https://www.yapikredi.com.tr/yapi-kredi-blue-class/baska-turlu-bir-yatirim-mumkun-mu';
  const ENDPOINT = SOURCE + '.aspx/LoadPlatinumMarketReleases';
  const START = '1964-01-01', END = '2028-12-31';
  const DELAY = 250, TIMEOUT = 60000, RETRIES = 3, MAX_FILE = 100 * 1024 * 1024;
  const encoder = new TextEncoder(), decoder = new TextDecoder();
  const api = window.ykbBulletinExport = {
    busy: false, manifest: null, errors: null,
    progress: { stage: 'ready', message: '', page: 0, totalPages: 0, index: 0, total: 0 },
    start, stop,
  };
  let aborter = null, interrupted = false;
  const panel = document.createElement('section');
  panel.id = 'ykb-bulletin-panel';
  panel.style.cssText = 'position:fixed!important;right:18px!important;bottom:18px!important;width:350px!important;max-width:90vw!important;z-index:2147483647!important;background:#fff!important;color:#15354c!important;border:2px solid #0079bd!important;border-radius:10px!important;padding:16px!important;box-shadow:0 5px 25px #0004!important;font:14px/1.5 Arial,sans-serif!important;text-align:left!important;';
  panel.innerHTML = '<strong style="font-size:16px">Yapı Kredi bülten arşivi</strong>' +
    '<p style="margin:8px 0">1964–2028 · PDF / DOCX<br>Seçilen üst klasörde <b>ykb-piyasa-bultenleri</b> oluşturulur. Aynı klasörü seçerek devam edebilirsiniz.</p>' +
    '<button id="ykb-bulletin-start" type="button" style="padding:8px;cursor:pointer">Klasör seç ve indir</button> ' +
    '<button id="ykb-bulletin-stop" type="button" style="padding:8px;cursor:pointer" disabled>Durdur</button>' +
    '<p id="ykb-bulletin-status" role="status" style="margin:10px 0 0;white-space:pre-wrap;overflow-wrap:anywhere"></p>';
  (document.body || document.documentElement).appendChild(panel);
  const startButton = document.getElementById('ykb-bulletin-start');
  const stopButton = document.getElementById('ykb-bulletin-stop');
  const status = document.getElementById('ykb-bulletin-status');
  startButton.addEventListener('click', start);
  stopButton.addEventListener('click', stop);
  function update(stage, message, extra = {}) {
    Object.assign(api.progress, extra, { stage, message });
    status.textContent = message;
  }
  function environmentError() {
    if (window.top !== window.self) return 'Kodu sayfanın ana çerçevesinin Console alanında çalıştırın.';
    if (window.location.origin !== 'https://www.yapikredi.com.tr') return 'Kodu https://www.yapikredi.com.tr üzerindeki bülten sayfasında çalıştırın.';
    if (!window.isSecureContext || typeof window.showDirectoryPicker !== 'function' || !window.crypto?.subtle) {
      return 'Bu işlem güncel masaüstü Chrome veya Edge ve güvenli HTTPS bağlantısı gerektirir.';
    }
    return null;
  }
  const setupError = environmentError();
  if (setupError) { update('error', setupError); startButton.disabled = true; }
  else update('ready', 'Hazır. Başlamak için “Klasör seç ve indir” düğmesine basın. Sekmeyi açık tutun.');

  function stop() {
    if (!api.busy) return;
    interrupted = true;
    aborter?.abort();
    update('stopping', 'Durduruluyor… Tamamlanan dosyalar ve JSON kaydediliyor.');
  }
  async function start() {
    if (api.busy) return null;
    const error = environmentError();
    if (error) { update('error', error); return null; }
    api.busy = true;
    interrupted = false;
    aborter = new AbortController();
    startButton.disabled = true;
    stopButton.disabled = false;
    update('selecting', 'Bir üst klasör seçin.');
    let manifest = null, pickerCompleted = false;
    try {
      // Keep the picker in the real button's transient user activation: no await before this call.
      const picker = window.showDirectoryPicker({ mode: 'readwrite' });
      const parent = await picker;
      pickerCompleted = true;
      if (interrupted) { update('stopped', 'İşlem durduruldu.'); return null; }
      const directory = await parent.getDirectoryHandle('ykb-piyasa-bultenleri', { create: true });
      manifest = await exportArchive(directory, aborter.signal);
      const counts = `${manifest.downloadedCount} başarılı, ${manifest.failedCount} hatalı, ${manifest.pendingCount} bekleyen.`;
      update(interrupted ? 'stopped' : manifest.listingComplete && !manifest.failedCount && !manifest.pendingCount ? 'complete' : 'incomplete',
        `${interrupted ? 'Durduruldu.' : 'İşlem tamamlandı.'} ${counts}\nListe tam: ${manifest.listingComplete ? 'evet' : 'hayır'}.\nAyrıntılar: reports.json ve errors.json. Hatalar için aynı klasörü seçerek tekrar çalıştırın.`);
      console.info('Yapı Kredi bülten sonucu:', manifest, api.errors);
      return manifest;
    } catch (error) {
      const cancelled = error.name === 'AbortError' && !pickerCompleted;
      update(cancelled ? 'stopped' : 'error', cancelled ? 'Klasör seçimi iptal edildi.' : `İşlem durdu: ${error.message}`);
      console.error('Yapı Kredi bülten hatası:', error);
      return null;
    } finally {
      api.busy = false;
      startButton.disabled = false;
      stopButton.disabled = true;
      aborter = null;
    }
  }
  const identity = record => JSON.stringify([record.date, record.bulletinType, record.sourceUrl]);
  async function sha256(bytes) {
    const digest = await window.crypto.subtle.digest('SHA-256', typeof bytes === 'string' ? encoder.encode(bytes) : bytes);
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  }
  function validDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value + 'T00:00:00Z')) ||
      new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) !== value) throw new Error('Geçersiz tarih: ' + value);
    return value;
  }
  async function parsePage(payload, pageIndex) {
    let result = payload?.d;
    if (typeof result === 'string') result = JSON.parse(result);
    if (!result || Number(result.StatusCode) !== 200 || result.Exception) {
      throw new Error(`Liste API hatası: ${result?.StatusCode ?? 'durum yok'} ${result?.Message || ''} ${result?.Exception ? JSON.stringify(result.Exception) : ''}`);
    }
    if (typeof result.Data !== 'string') throw new Error('Liste yanıtındaki Data HTML metni değil.');
    // HTML fragments contain orphan <tr>; put them in a real table before reading rows.
    const doc = new DOMParser().parseFromString('<!doctype html><html><body><table></table></body></html>', 'text/html');
    const table = doc.querySelector('table');
    table.innerHTML = result.Data;
    const records = [];
    for (const row of table.querySelectorAll('tr')) {
      const cells = Array.from(row.children).filter(child => child.tagName === 'TD');
      if (cells.length === 1 && cells[0].hasAttribute('colspan')) continue;
      if (cells.length !== 3) throw new Error(`${pageIndex}. sayfada beklenmeyen tablo satırı.`);
      const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(cells[0].textContent.trim());
      if (!match) throw new Error(`${pageIndex}. sayfada geçersiz rapor tarihi.`);
      const date = validDate(`${match[3]}-${match[2]}-${match[1]}`);
      if (date < START || date > END) throw new Error(`Filtre dışında rapor tarihi: ${date}.`);
      const bulletinType = cells[1].textContent.replace(/\s+/gu, ' ').trim();
      const links = Array.from(cells[2].querySelectorAll('a[href]'));
      if (!bulletinType || links.length !== 1) throw new Error(`${pageIndex}. sayfada rapor türü veya tek dosya bağlantısı bulunamadı.`);
      const url = new URL(links[0].getAttribute('href'), SOURCE);
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Geçersiz dosya URL: ' + url.href);
      url.hash = '';
      records.push({ date, bulletinType, sourceUrl: url.href, sourcePage: pageIndex });
    }
    if (!records.length && result.Data.trim() && !table.querySelector('td[colspan]')) throw new Error(`${pageIndex}. sayfada tanınabilir kayıt yok.`);
    let active = null, totalPages = 1;
    for (const item of table.querySelectorAll('li[data-page]')) {
      const value = item.getAttribute('data-page');
      if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) < 1) throw new Error('Geçersiz sayfalama numarası.');
      totalPages = Math.max(totalPages, Number(value));
      if (item.classList.contains('pager-active')) {
        if (active !== null) throw new Error('Birden çok etkin sayfa döndü.');
        active = Number(value);
      }
    }
    if (active === null && totalPages === 1 && pageIndex === 1) active = 1;
    if (active !== pageIndex) throw new Error(`${pageIndex}. sayfa istendi, sunucu ${active ?? 'belirsiz'}. sayfayı döndürdü.`);
    if (!records.length && (pageIndex !== 1 || totalPages > 1)) throw new Error('Beklenmeyen boş liste sayfası.');
    const keys = records.map(identity);
    if (new Set(keys).size !== keys.length) throw new Error(`${pageIndex}. sayfada yinelenen kayıt var.`);
    return { records, totalPages, fingerprint: await sha256(keys.join('\n')) };
  }
  function slug(value) {
    const map = { ı: 'i', İ: 'i', ş: 's', Ş: 's', ğ: 'g', Ğ: 'g', ü: 'u', Ü: 'u', ö: 'o', Ö: 'o', ç: 'c', Ç: 'c' };
    return value.replace(/[ıİşŞğĞüÜöÖçÇ]/g, char => map[char]).normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }
  async function fileName(record, extension) {
    const parts = new URL(record.sourceUrl).pathname.split('/').filter(Boolean);
    if (/^(view|download)$/i.test(parts.at(-1) || '')) parts.pop();
    let base = parts.at(-1) || 'report';
    try { base = decodeURIComponent(base); } catch { /* Slugging also handles malformed escapes. */ }
    const text = slug(`${record.date}-${record.bulletinType}-${base}`) || 'report';
    const suffix = '-' + (await sha256(identity(record))).slice(0, 12) + extension;
    return (text.slice(0, 50 - suffix.length).replace(/-+$/g, '') || 'report') + suffix;
  }
  function safeName(name) {
    return typeof name === 'string' && name.length <= 50 && /^[a-z0-9][a-z0-9._-]*\.(pdf|docx)$/.test(name) && !name.includes('..');
  }
  function fileType(bytes) {
    const readable = decoder.decode(bytes.subarray(0, 1024)).replace(/^\uFEFF/, '');
    if (/^\s*</.test(readable)) throw new Error('PDF/DOCX yerine HTML/XML döndü.');
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const zip = bytes.length >= 4 && view.getUint32(0, true) === 0x04034b50;
    if (!zip && /%PDF-\d\.\d/.test(readable)) {
      if (!decoder.decode(bytes.subarray(Math.max(0, bytes.length - 65536))).includes('%%EOF')) throw new Error('Eksik PDF: son %%EOF işareti yok.');
      return '.pdf';
    }
    if (!zip || bytes.length < 22) throw new Error('Desteklenmeyen dosya: yalnızca PDF ve DOCX kabul edilir (eski DOC kabul edilmez).');
    let end = -1;
    for (let offset = bytes.length - 22; offset >= Math.max(0, bytes.length - 65557); offset--) {
      if (view.getUint32(offset, true) === 0x06054b50 && offset + 22 + view.getUint16(offset + 20, true) === bytes.length) { end = offset; break; }
    }
    if (end < 0 || view.getUint16(end + 4, true) || view.getUint16(end + 6, true)) throw new Error('Geçersiz DOCX ZIP son kaydı.');
    const count = view.getUint16(end + 10, true), size = view.getUint32(end + 12, true), start = view.getUint32(end + 16, true);
    if (count < 2 || count === 65535 || start + size !== end || start >= end) throw new Error('Geçersiz DOCX ZIP dizini.');
    let cursor = start;
    const names = new Set();
    for (let i = 0; i < count; i++) {
      if (cursor + 46 > end || view.getUint32(cursor, true) !== 0x02014b50) throw new Error('Geçersiz DOCX ZIP girdisi.');
      const nameLength = view.getUint16(cursor + 28, true), local = view.getUint32(cursor + 42, true);
      const next = cursor + 46 + nameLength + view.getUint16(cursor + 30, true) + view.getUint16(cursor + 32, true);
      if (next > end || (view.getUint16(cursor + 8, true) & 1) || local + 30 > start || view.getUint32(local, true) !== 0x04034b50) throw new Error('Geçersiz/şifreli DOCX ZIP girdisi.');
      const dataEnd = local + 30 + view.getUint16(local + 26, true) + view.getUint16(local + 28, true) + view.getUint32(cursor + 20, true);
      if (dataEnd > start) throw new Error('Eksik DOCX ZIP içeriği.');
      names.add(decoder.decode(bytes.subarray(cursor + 46, cursor + 46 + nameLength)));
      cursor = next;
    }
    if (cursor !== start + size || !names.has('[Content_Types].xml') || !names.has('word/document.xml')) throw new Error('ZIP dosyası DOCX belgesi değil.');
    return '.docx';
  }
  function interruptedError() { return new DOMException('Kullanıcı durdurdu; aynı klasörü seçerek devam edebilirsiniz.', 'AbortError'); }
  function sleep(ms, signal) {
    if (signal.aborted) return Promise.reject(interruptedError());
    return new Promise((resolve, reject) => {
      const cancel = () => { clearTimeout(timer); reject(interruptedError()); };
      const timer = setTimeout(() => { signal.removeEventListener('abort', cancel); resolve(); }, ms);
      signal.addEventListener('abort', cancel, { once: true });
    });
  }
  async function fetchBytes(url, init, limit, signal) {
    for (let attempt = 1; ; attempt++) {
      if (signal.aborted) throw interruptedError();
      const request = new AbortController();
      const cancel = () => request.abort();
      signal.addEventListener('abort', cancel, { once: true });
      const timer = setTimeout(() => request.abort(), TIMEOUT);
      let failure;
      try {
        const response = await fetch(url, { ...init, credentials: 'same-origin', redirect: 'follow', signal: request.signal });
        if (!response.ok) {
          const value = response.headers.get('retry-after');
          const retryAfter = value ? Math.max(0, Number.isFinite(Number(value)) ? Number(value) * 1000 : Date.parse(value) - Date.now()) : 0;
          await response.body?.cancel();
          throw Object.assign(new Error(`HTTP ${response.status}: ${url}`), { retryable: response.status === 429 || response.status >= 500, retryAfter });
        }
        if (Number(response.headers.get('content-length')) > limit) {
          await response.body?.cancel();
          throw Object.assign(new Error('Dosya boyut sınırını aşıyor: ' + url), { retryable: false });
        }
        if (!response.body) throw new Error('Yanıt gövdesi boş: ' + url);
        const reader = response.body.getReader(), chunks = [];
        let length = 0;
        try {
          while (true) {
            const item = await reader.read();
            if (item.done) break;
            length += item.value.byteLength;
            if (length > limit) throw Object.assign(new Error('Yanıt boyut sınırını aşıyor: ' + url), { retryable: false });
            chunks.push(item.value);
          }
        } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
        const bytes = new Uint8Array(length);
        let offset = 0;
        for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
        return bytes;
      } catch (error) {
        if (signal.aborted) throw interruptedError();
        failure = error;
        if (request.signal.aborted) failure = new Error(`İstek ${TIMEOUT} ms içinde tamamlanmadı: ${url}`);
        failure.attempts = attempt;
        if (failure.retryable === false || attempt > RETRIES) throw failure;
      } finally { clearTimeout(timer); signal.removeEventListener('abort', cancel); }
      console.warn(`Yeniden deneme ${attempt}/${RETRIES}: ${failure.message}`);
      await sleep(Math.max(Math.min(60000, failure.retryAfter || 0), Math.min(10000, 1000 * 2 ** (attempt - 1))), signal);
    }
  }
  async function writeFile(directory, name, contents) {
    const handle = await directory.getFileHandle(name, { create: true });
    const writable = await handle.createWritable();
    try { await writable.write(contents); await writable.close(); }
    catch (error) { await writable.abort().catch(() => {}); throw error; }
  }
  const writeJson = (directory, name, value) => writeFile(directory, name, JSON.stringify(value, null, 2) + '\n');
  async function readJson(directory, name) {
    let handle;
    try { handle = await directory.getFileHandle(name); }
    catch (error) { if (error.name === 'NotFoundError') return null; throw error; }
    try {
      const value = JSON.parse(await (await handle.getFile()).text());
      if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('JSON kökü bir nesne olmalı.');
      return value;
    }
    catch (error) { throw new Error(`${name} okunamadı/geçersiz. Dosya üzerine yazılmadı: ${error.message}`); }
  }
  function priorRecords(manifests) {
    const cache = new Map();
    for (const manifest of manifests) {
      if (!manifest) continue;
      if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.records)) throw new Error('Mevcut JSON şeması geçersiz; üzerine yazılmadı.');
      for (const record of manifest.records) {
        if (!record || typeof record.date !== 'string' || typeof record.bulletinType !== 'string' || typeof record.sourceUrl !== 'string' ||
          !record.bulletinType.trim() || !['pending', 'downloaded', 'failed'].includes(record.status) || typeof record.fileName !== 'string' ||
          (record.fileName && !safeName(record.fileName)) || !Number.isSafeInteger(record.sourcePage) || record.sourcePage < 1 ||
          !(record.sha256 === null || /^[a-f0-9]{64}$/.test(record.sha256)) ||
          !(record.byteLength === null || (Number.isSafeInteger(record.byteLength) && record.byteLength > 0 && record.byteLength <= MAX_FILE)) ||
          !(record.error === null || typeof record.error === 'string')) throw new Error('Mevcut JSON içinde geçersiz kayıt var; üzerine yazılmadı.');
        validDate(record.date);
        const source = new URL(record.sourceUrl);
        if (!['http:', 'https:'].includes(source.protocol) || source.username || source.password ||
          (record.status === 'downloaded' && (!record.fileName || !record.sha256 || !record.byteLength))) throw new Error('Mevcut JSON içinde geçersiz dosya bilgisi var; üzerine yazılmadı.');
        const key = identity(record), previous = cache.get(key);
        if (!previous || record.status === 'downloaded' || previous.status !== 'downloaded') cache.set(key, record);
      }
    }
    return cache;
  }
  async function existingValid(record, reports) {
    if (record.status !== 'downloaded' || !safeName(record.fileName) || !/^[a-f0-9]{64}$/.test(record.sha256 || '') ||
      !Number.isSafeInteger(record.byteLength) || record.byteLength < 1 || record.byteLength > MAX_FILE) return false;
    let handle;
    try { handle = await reports.getFileHandle(record.fileName); }
    catch (error) { if (error.name === 'NotFoundError') return false; throw error; }
    const file = await handle.getFile();
    if (file.size !== record.byteLength) return false;
    const bytes = new Uint8Array(await file.arrayBuffer());
    try { return record.fileName.endsWith(fileType(bytes)) && await sha256(bytes) === record.sha256; }
    catch { return false; }
  }
  async function exportArchive(directory, signal) {
    const reports = await directory.getDirectoryHandle('reports', { create: true });
    const oldManifest = await readJson(directory, 'reports.json');
    const oldResume = await readJson(directory, 'reports.resume.json');
    if (oldManifest && (oldManifest.schemaVersion !== 1 || oldManifest.sourceUrl !== SOURCE || oldManifest.startDate !== START || oldManifest.endDate !== END ||
      typeof oldManifest.listingComplete !== 'boolean' || !Array.isArray(oldManifest.records) || oldManifest.totalRecords !== oldManifest.records.length ||
      !Array.isArray(oldManifest.listingErrors))) throw new Error('reports.json şeması/kaynağı/tarih aralığı geçersiz; üzerine yazılmadı.');
    if (!oldManifest && !oldResume) {
      for await (const entry of reports.values()) {
        if (entry.kind === 'file') throw new Error('reports klasöründe dosyalar var fakat eşleştirme JSON dosyaları yok. JSON dosyalarını geri getirin veya boş bir üst klasör seçin.');
      }
    }
    const cache = priorRecords([oldResume, oldManifest]);
    if (cache.size) await writeJson(directory, 'reports.resume.json', { schemaVersion: 1, records: Array.from(cache.values()) });
    const manifest = api.manifest = {
      schemaVersion: 1, sourceUrl: SOURCE, startDate: START, endDate: END, listingComplete: false,
      totalRecords: 0, records: [], listingErrors: [], totalPages: null, enumeratedPages: 0,
    };
    async function save() {
      manifest.totalRecords = manifest.records.length;
      manifest.downloadedCount = manifest.records.filter(record => record.status === 'downloaded').length;
      manifest.failedCount = manifest.records.filter(record => record.status === 'failed').length;
      manifest.pendingCount = manifest.records.filter(record => record.status === 'pending').length;
      manifest.generatedAt = new Date().toISOString();
      api.errors = {
        generatedAt: manifest.generatedAt, listingComplete: manifest.listingComplete, listingErrors: manifest.listingErrors,
        downloadErrors: manifest.records.filter(record => record.status === 'failed').map(({ date, bulletinType, sourceUrl, sourcePage, fileName, error }) => ({ date, bulletinType, sourceUrl, sourcePage, fileName, error })),
      };
      await writeJson(directory, 'reports.json', manifest);
      await writeJson(directory, 'errors.json', api.errors);
    }
    async function getPage(pageIndex) {
      const bytes = await fetchBytes(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8', Accept: 'application/json' },
        body: JSON.stringify({ pageIndex, dateFrom: START + 'T00:00:00+03:00', dateTo: '2029-01-01T00:00:00+03:00', type: 'Any' }) }, 8 * 1024 * 1024, signal);
      return parsePage(JSON.parse(decoder.decode(bytes).replace(/^\uFEFF/, '')), pageIndex);
    }
    const claimed = new Map();
    function claim(name, key) {
      if (!safeName(name)) throw new Error('Güvensiz dosya adı: ' + name);
      if (claimed.has(name) && claimed.get(name) !== key) throw new Error('Dosya adı çakışması; üzerine yazılmadı: ' + name);
      claimed.set(name, key);
    }
    let currentPage = 1;
    try {
      await save();
      const pages = new Set(), keys = new Set();
      let first;
      try {
        for (currentPage = 1; ; currentPage++) {
          const page = await getPage(currentPage);
          if (!first) { first = page; manifest.totalPages = page.totalPages; }
          if (page.totalPages !== manifest.totalPages) throw new Error('İşlem sırasında toplam sayfa sayısı değişti; tekrar çalıştırın.');
          if (pages.has(page.fingerprint)) throw new Error('Önceki sayfa tekrar döndü; eksik aktarımı önlemek için listeleme durduruldu.');
          for (const record of page.records) {
            const key = identity(record);
            if (keys.has(key)) throw new Error(`Yinelenen kayıt: ${record.sourceUrl}. Liste değişmiş olabilir; tekrar çalıştırın.`);
            const previous = cache.get(key);
            if (previous?.fileName) claim(previous.fileName, key);
          }
          pages.add(page.fingerprint);
          for (const record of page.records) {
            const key = identity(record), previous = cache.get(key);
            keys.add(key);
            manifest.records.push({ ...record, fileName: previous?.fileName || '', status: previous?.status === 'downloaded' ? 'downloaded' : 'pending',
              sha256: previous?.sha256 ?? null, byteLength: previous?.byteLength ?? null, error: null });
          }
          manifest.enumeratedPages = currentPage;
          await save();
          update('listing', `Liste ${currentPage}/${manifest.totalPages}: ${manifest.records.length} rapor.`, { page: currentPage, totalPages: manifest.totalPages, total: manifest.records.length });
          if (currentPage === manifest.totalPages) break;
          await sleep(DELAY, signal);
        }
        await sleep(DELAY, signal);
        const verification = await getPage(1);
        if (verification.totalPages !== first.totalPages || verification.fingerprint !== first.fingerprint) throw new Error('Listeleme sırasında ilk sayfa değişti; tutarlı liste için tekrar çalıştırın.');
        manifest.listingComplete = true;
      } catch (error) {
        manifest.listingErrors.push({ pageIndex: currentPage, error: error.message, attempts: error.attempts ?? null });
        console.error('Listeleme hatası:', error);
      }
      await save();
      if (!signal.aborted) {
        for (let index = 0; index < manifest.records.length; index++) {
          if (signal.aborted) break;
          const record = manifest.records[index];
          update('downloading', `Dosya ${index + 1}/${manifest.records.length}\n${record.date} · ${record.bulletinType}`, { index: index + 1, total: manifest.records.length });
          try {
            if (await existingValid(record, reports)) continue;
            record.status = 'pending'; record.sha256 = null; record.byteLength = null;
            await sleep(DELAY, signal);
            const bytes = await fetchBytes(record.sourceUrl, { method: 'GET' }, MAX_FILE, signal);
            const extension = fileType(bytes);
            const name = safeName(record.fileName) && record.fileName.endsWith(extension) ? record.fileName : await fileName(record, extension);
            claim(name, identity(record));
            const hash = await sha256(bytes);
            await writeFile(reports, name, bytes);
            record.fileName = name; record.sha256 = hash; record.byteLength = bytes.length;
            record.status = 'downloaded'; record.error = null;
          } catch (error) {
            record.status = 'failed'; record.sha256 = null; record.byteLength = null;
            record.error = error.message + (error.attempts ? ` (deneme: ${error.attempts})` : '');
            console.error('İndirilemedi:', record.sourceUrl, error);
          }
          await save();
          if (signal.aborted) break;
        }
      }
    } finally {
      if (interrupted) manifest.interrupted = true;
      await save();
    }
    return manifest;
  }
})();
