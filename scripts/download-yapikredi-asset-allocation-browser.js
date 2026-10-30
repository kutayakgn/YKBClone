/* Yapı Kredi varlık dağılımı arşivi. Chrome/Edge DevTools Console'a tamamını yapıştırın.
   https://www.yapikredi.com.tr/yapi-kredi-hakkinda/piyasa-bulteni/varlik-dagilimi-bulteni/
   Ardından açılan paneldeki gerçek düğmeye basıp bir üst klasör seçin. */
(() => {
  'use strict';
  if (window.ykbAssetAllocationExport?.busy) {
    console.warn('Önce eski işlemi Durdur düğmesiyle durdurun; işlem tamamen bittikten sonra yeni kodu yapıştırın.');
    return;
  }
  document.getElementById('ykb-asset-allocation-panel')?.remove();
  const SOURCE = 'https://www.yapikredi.com.tr/yapi-kredi-hakkinda/piyasa-bulteni/varlik-dagilimi-bulteni/';
  const ENDPOINT = SOURCE + 'default.aspx/LoadAssetAllocationReleases';
  const START = '2024-01-01', END = '2026-12-31';
  const DATE_FROM = '2024-01-01T00:00:00+03:00', DATE_TO = '2026-12-31T23:59:59+03:00';
  const EXPECTED_PAGES = 4, EXPECTED_RECORDS = 34; // Karşılaştırma bilgisi; sayfalama sınırı değildir.
  const DOWNLOAD_CONCURRENCY = 4; // Aynı anda doğrulanacak/indirilecek en fazla dosya sayısı.
  const DELAY = 100, TIMEOUT = 60000, RETRIES = 3, MAX_FILE = 100 * 1024 * 1024;
  const encoder = new TextEncoder(), decoder = new TextDecoder();
  const api = window.ykbAssetAllocationExport = {
    version: 1, busy: false, manifest: null, errors: null,
    progress: { stage: 'ready', message: '', page: 0, totalPages: 0, index: 0, total: 0 },
    start, stop,
  };
  let aborter = null, interrupted = false;
  const panel = document.createElement('section');
  panel.id = 'ykb-asset-allocation-panel';
  panel.style.cssText = 'position:fixed!important;right:18px!important;bottom:18px!important;width:350px!important;max-width:90vw!important;z-index:2147483647!important;background:#fff!important;color:#15354c!important;border:2px solid #0079bd!important;border-radius:10px!important;padding:16px!important;box-shadow:0 5px 25px #0004!important;font:14px/1.5 Arial,sans-serif!important;text-align:left!important;';
  panel.innerHTML = '<strong style="font-size:16px">Yapı Kredi varlık dağılımı arşivi</strong>' +
    '<p style="margin:8px 0">2024–2026 · PDF / DOCX<br>Seçilen üst klasörde <b>ykb-varlik-dagilim-onerileri</b> oluşturulur. Aynı klasörü seçerek devam edebilirsiniz.</p>' +
    '<button id="ykb-asset-allocation-start" type="button" style="padding:8px;cursor:pointer">Klasör seç ve indir</button> ' +
    '<button id="ykb-asset-allocation-stop" type="button" style="padding:8px;cursor:pointer" disabled>Durdur</button>' +
    '<p id="ykb-asset-allocation-status" role="status" style="margin:10px 0 0;white-space:pre-wrap;overflow-wrap:anywhere"></p>';
  (document.body || document.documentElement).appendChild(panel);
  const startButton = document.getElementById('ykb-asset-allocation-start');
  const stopButton = document.getElementById('ykb-asset-allocation-stop');
  const status = document.getElementById('ykb-asset-allocation-status');
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
    api.manifest = null;
    api.errors = null;
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
      const directory = parent.name === 'ykb-varlik-dagilim-onerileri' ? parent : await parent.getDirectoryHandle('ykb-varlik-dagilim-onerileri', { create: true });
      manifest = await exportArchive(directory, aborter.signal);
      const counts = `${manifest.downloadedCount} başarılı (${manifest.reusedCount} mevcut dosya), ${manifest.failedCount} hatalı, ${manifest.pendingCount} bekleyen.`;
      update(interrupted ? 'stopped' : manifest.listingComplete && !manifest.failedCount && !manifest.pendingCount ? 'complete' : 'incomplete',
        `${interrupted ? 'Durduruldu.' : 'İşlem tamamlandı.'} ${counts}\nListe tam: ${manifest.listingComplete ? 'evet' : 'hayır'}.${manifest.sourceCountChanged ? '\nDikkat: Kaynakta beklenen 4 sayfa / 34 kayıt sayısı değişti; warnings alanını inceleyin.' : ''}\nAyrıntılar: reports.json ve errors.json. Hatalar için aynı klasörü seçerek tekrar çalıştırın.`);
      console.info('Yapı Kredi varlık dağılımı sonucu:', manifest, api.errors);
      return manifest;
    } catch (error) {
      const cancelled = error.name === 'AbortError' && !pickerCompleted;
      update(cancelled ? 'stopped' : 'error', cancelled ? 'Klasör seçimi iptal edildi.' : `İşlem durdu: ${error.message}`);
      console.error('Yapı Kredi varlık dağılımı hatası:', error);
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
  async function waitForConnection(signal) {
    if (window.navigator?.onLine !== false) return;
    if (signal.aborted) throw interruptedError();
    update('waiting', 'Bağlantı bekleniyor… Bağlantı gelince veya 5 saniye içinde yeniden denenir.');
    // onLine is only a hint (VPN/LAN can misreport it). Periodically probe the real request too.
    await new Promise((resolve, reject) => {
      const cleanup = () => { clearTimeout(timer); window.removeEventListener('online', connected); signal.removeEventListener('abort', cancel); };
      const connected = () => { cleanup(); resolve(); };
      const cancel = () => { cleanup(); reject(interruptedError()); };
      const timer = setTimeout(connected, 5000);
      window.addEventListener('online', connected, { once: true });
      signal.addEventListener('abort', cancel, { once: true });
    });
  }
  async function fetchBytes(url, init, limit, signal) {
    let attempt = 0;
    for (;;) {
      if (signal.aborted) throw interruptedError();
      await waitForConnection(signal);
      if (signal.aborted) throw interruptedError();
      attempt++;
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
        if (failure.retryable === false) throw failure;
        // Keep waiting during an explicitly detected outage. Online network/CORS failures remain bounded.
        if (window.navigator?.onLine === false && failure.retryable === undefined) attempt--;
        else if (attempt > RETRIES) throw failure;
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
  async function exportArchive(directory, signal) {
    const reports = await directory.getDirectoryHandle('reports', { create: true });
    const manifest = api.manifest = {
      schemaVersion: 1, sourceUrl: SOURCE, tableClassName: 'YkbYapikredi.AllAssetAllocationRecommendations',
      startDate: START, endDate: END, dateFrom: DATE_FROM, dateTo: DATE_TO, listingComplete: false,
      totalRecords: 0, records: [], listingErrors: [], totalPages: null, enumeratedPages: 0,
      warnings: [], reusedCount: 0, downloadedNewCount: 0,
    };
    function warn(message) {
      if (!manifest.warnings.includes(message)) { manifest.warnings.push(message); console.warn(message); }
    }
    const files = new Map(), cache = new Map(), cachedOwners = new Map(), claimed = new Map();
    for await (const handle of reports.values()) {
      if (signal.aborted) throw interruptedError();
      if (handle.kind === 'file' && safeName(handle.name)) files.set(handle.name, handle);
    }
    async function readCache(name) {
      try {
        const handle = await directory.getFileHandle(name);
        const value = JSON.parse(await (await handle.getFile()).text());
        if (!value || value.schemaVersion !== 1 || !Array.isArray(value.records) || value.sourceUrl !== SOURCE ||
          value.tableClassName !== 'YkbYapikredi.AllAssetAllocationRecommendations' || value.startDate !== START || value.endDate !== END ||
          value.dateFrom !== DATE_FROM || value.dateTo !== DATE_TO) throw new Error('şema/kaynak/tablo/tarih aralığı eşleşmiyor');
        for (const record of value.records) {
          try {
            if (!record || typeof record.bulletinType !== 'string' || !record.bulletinType.trim() || typeof record.sourceUrl !== 'string') throw new Error('kimlik eksik');
            validDate(record.date);
            const url = new URL(record.sourceUrl);
            if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || !safeName(record.fileName)) throw new Error('dosya adı/URL geçersiz');
            const key = identity(record), suffix = '-' + (await sha256(key)).slice(0, 12);
            if (!record.fileName.endsWith(suffix + '.pdf') && !record.fileName.endsWith(suffix + '.docx')) throw new Error('dosya adı kayıt kimliğiyle eşleşmiyor');
            const trusted = record.status === 'downloaded' && /^[a-f0-9]{64}$/.test(record.sha256 || '') &&
              Number.isSafeInteger(record.byteLength) && record.byteLength > 0 && record.byteLength <= MAX_FILE;
            const entry = { date: record.date, bulletinType: record.bulletinType, sourceUrl: record.sourceUrl,
              sourcePage: Number.isSafeInteger(record.sourcePage) && record.sourcePage > 0 ? record.sourcePage : 1,
              fileName: record.fileName, status: trusted ? 'downloaded' : 'pending',
              sha256: trusted ? record.sha256 : null, byteLength: trusted ? record.byteLength : null, error: null };
            const previous = cache.get(key) || [];
            if (!previous.some(item => item.fileName === entry.fileName && item.sha256 === entry.sha256 && item.byteLength === entry.byteLength)) previous.push(entry);
            cache.set(key, previous);
            if (!cachedOwners.has(entry.fileName)) cachedOwners.set(entry.fileName, key);
            else if (cachedOwners.get(entry.fileName) !== key) { cachedOwners.set(entry.fileName, null); warn('Önbellekte dosya adı çakışması yok sayıldı: ' + entry.fileName); }
          } catch (error) { warn(`${name}: geçersiz kayıt yok sayıldı (${error.message}). Mevcut dosyalar yine denetlenecek.`); }
        }
      } catch (error) {
        if (error.name !== 'NotFoundError') warn(`${name} okunamadı/geçersiz; kaynak liste ve mevcut dosyalardan yeniden oluşturuluyor: ${error.message}`);
      }
    }
    await readCache('reports.resume.json');
    await readCache('reports.json');

    // A single writer queue owns ALL JSON files. Capture strings now, not when a queued write runs.
    let writeQueue = Promise.resolve(), persistenceError = null, checkpointTimer = null, dirty = 0;
    function snapshot() {
      manifest.totalRecords = manifest.records.length;
      manifest.downloadedCount = manifest.records.filter(record => record.status === 'downloaded').length;
      manifest.failedCount = manifest.records.filter(record => record.status === 'failed').length;
      manifest.pendingCount = manifest.records.filter(record => record.status === 'pending').length;
      manifest.generatedAt = new Date().toISOString();
      api.errors = {
        generatedAt: manifest.generatedAt, listingComplete: manifest.listingComplete, listingErrors: manifest.listingErrors,
        warnings: manifest.warnings,
        downloadErrors: manifest.records.filter(record => record.status === 'failed').map(({ date, bulletinType, sourceUrl, sourcePage, fileName, error }) => ({ date, bulletinType, sourceUrl, sourcePage, fileName, error })),
      };
      const stringify = value => JSON.stringify(value, null, 2) + '\n';
      return [
        ['reports.resume.json', stringify({ schemaVersion: 1, sourceUrl: SOURCE, tableClassName: manifest.tableClassName,
          startDate: START, endDate: END, dateFrom: DATE_FROM, dateTo: DATE_TO, records: Array.from(cache.values()).flat() })],
        ['reports.json', stringify(manifest)], ['errors.json', stringify(api.errors)],
      ];
    }
    function enqueueSnapshot() {
      const contents = snapshot();
      writeQueue = writeQueue.then(async () => {
        if (persistenceError) return;
        for (const [name, text] of contents) await writeFile(directory, name, text);
      }).catch(error => {
        persistenceError ||= error;
        aborter?.abort(); // Stop in-flight requests immediately; workers are still awaited below.
      });
      return writeQueue.then(() => { if (persistenceError) throw persistenceError; });
    }
    function checkpoint(force = false) {
      if (persistenceError) return Promise.reject(persistenceError);
      if (force || ++dirty >= 10) {
        clearTimeout(checkpointTimer); checkpointTimer = null; dirty = 0;
        return enqueueSnapshot();
      }
      if (checkpointTimer === null) checkpointTimer = setTimeout(() => {
        checkpointTimer = null; dirty = 0;
        enqueueSnapshot().catch(() => {});
      }, 1000);
      return Promise.resolve();
    }
    async function getPage(pageIndex) {
      const bytes = await fetchBytes(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8', Accept: 'application/json' },
        body: JSON.stringify({ pageIndex, dateFrom: DATE_FROM, dateTo: DATE_TO, type: 'Any' }) }, 8 * 1024 * 1024, signal);
      return parsePage(JSON.parse(decoder.decode(bytes).replace(/^\uFEFF/, '')), pageIndex);
    }
    function claim(name, key) {
      if (!safeName(name)) throw new Error('Güvensiz dosya adı: ' + name);
      if (claimed.has(name) && claimed.get(name) !== key) throw new Error('Dosya adı çakışması; üzerine yazılmadı: ' + name);
      claimed.set(name, key);
    }
    async function reuse(record) {
      const key = identity(record), previous = cache.get(key) || [];
      const names = new Set();
      // Prefer previously verified metadata, then reconstruct BOTH possible deterministic filenames.
      for (const item of previous) if (cachedOwners.get(item.fileName) === key) names.add(item.fileName);
      names.add(await fileName(record, '.pdf'));
      names.add(await fileName(record, '.docx'));
      for (const name of names) {
        claim(name, key);
        const handle = files.get(name);
        if (!handle) continue;
        let file;
        try { file = await handle.getFile(); }
        catch (error) { if (error.name === 'NotFoundError') continue; throw error; }
        if (file.size < 1 || file.size > MAX_FILE) { warn('Mevcut dosya boyutu geçersiz; yeniden indirilecek: ' + name); continue; }
        const bytes = new Uint8Array(await file.arrayBuffer());
        let extension;
        try { extension = fileType(bytes); }
        catch (error) { warn(`Mevcut dosya doğrulanamadı: ${name} (${error.message})`); continue; }
        if (!name.endsWith(extension)) { warn('Mevcut dosya türü/uzantısı uyuşmuyor: ' + name); continue; }
        const hash = await sha256(bytes);
        const known = previous.filter(item => item.fileName === name && item.sha256);
        const hashes = new Set(known.map(item => item.sha256)), sizes = new Set(known.map(item => item.byteLength));
        if (hashes.size > 1 || sizes.size > 1) warn('Çelişkili önbellek bilgisi yok sayıldı; dosya içeriği denetlendi: ' + name);
        else if (known.length && (!hashes.has(hash) || !sizes.has(file.size))) { warn('Mevcut dosyanın SHA-256/boyutu değişmiş; yeniden indirilecek: ' + name); continue; }
        Object.assign(record, { fileName: name, sha256: hash, byteLength: bytes.length, status: 'downloaded', error: null });
        cache.set(key, [{ ...record }]);
        manifest.reusedCount++;
        return true;
      }
      return false;
    }
    let currentPage = 1, fatal = null, workers = [];
    try {
      await checkpoint(true);
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
          }
          pages.add(page.fingerprint);
          for (const record of page.records) {
            const key = identity(record);
            keys.add(key);
            manifest.records.push({ ...record, fileName: '', status: 'pending', sha256: null, byteLength: null, error: null });
          }
          manifest.enumeratedPages = currentPage;
          await checkpoint(true);
          update('listing', `Liste ${currentPage}/${manifest.totalPages}: ${manifest.records.length} rapor.`, { page: currentPage, totalPages: manifest.totalPages, total: manifest.records.length });
          if (currentPage === manifest.totalPages) break;
          await sleep(DELAY, signal);
        }
        await sleep(DELAY, signal);
        const verification = await getPage(1);
        if (verification.totalPages !== first.totalPages || verification.fingerprint !== first.fingerprint) throw new Error('Listeleme sırasında ilk sayfa değişti; tutarlı liste için tekrar çalıştırın.');
        manifest.listingComplete = true;
        manifest.sourceCountChanged = manifest.totalPages !== EXPECTED_PAGES || manifest.records.length !== EXPECTED_RECORDS;
        if (manifest.sourceCountChanged) warn(`Kaynak sayısı değişti: beklenen ${EXPECTED_PAGES} sayfa / ${EXPECTED_RECORDS} kayıt; bulunan ${manifest.totalPages} sayfa / ${manifest.records.length} kayıt. Tüm güncel sayfalar dinamik olarak tarandı; kayıt sayısını kontrol edin.`);
      } catch (error) {
        manifest.listingErrors.push({ pageIndex: currentPage, error: error.message, attempts: error.attempts ?? null });
        console.error('Listeleme hatası:', error);
      }
      await checkpoint(true);
      if (!signal.aborted) {
        let next = 0, completed = 0;
        async function worker() {
          while (!signal.aborted) {
            const index = next++;
            if (index >= manifest.records.length) return;
            const record = manifest.records[index];
            try {
              if (!await reuse(record)) {
                if (signal.aborted) throw interruptedError();
                const bytes = await fetchBytes(record.sourceUrl, { method: 'GET' }, MAX_FILE, signal);
                const extension = fileType(bytes);
                const name = await fileName(record, extension);
                claim(name, identity(record));
                const hash = await sha256(bytes);
                await writeFile(reports, name, bytes);
                record.fileName = name; record.sha256 = hash; record.byteLength = bytes.length;
                record.status = 'downloaded'; record.error = null;
                cache.set(identity(record), [{ ...record }]);
                manifest.downloadedNewCount++;
              }
            } catch (error) {
              record.status = 'failed'; record.sha256 = null; record.byteLength = null;
              record.error = error.message + (error.attempts ? ` (deneme: ${error.attempts})` : '');
              console.error('İndirilemedi:', record.sourceUrl, error);
            }
            completed++;
            update(signal.aborted ? 'stopping' : 'downloading', `${completed}/${manifest.records.length} dosya tamamlandı; ${manifest.reusedCount} mevcut dosya kullanıldı.\n${record.date} · ${record.bulletinType}`,
              { index: completed, completed, total: manifest.records.length, reusedCount: manifest.reusedCount, downloadedNewCount: manifest.downloadedNewCount });
            await checkpoint();
          }
        }
        workers = Array.from({ length: Math.min(DOWNLOAD_CONCURRENCY, manifest.records.length) }, () => worker());
        const settled = await Promise.allSettled(workers);
        const rejected = settled.find(result => result.status === 'rejected');
        if (rejected) throw rejected.reason;
      }
    } catch (error) {
      fatal = error;
      aborter?.abort();
    } finally {
      // No request/writer is left running after start() returns, including a disk/checkpoint failure.
      await Promise.allSettled(workers);
      clearTimeout(checkpointTimer); checkpointTimer = null;
      if (interrupted) manifest.interrupted = true;
      if (!persistenceError) {
        try { await checkpoint(true); } catch (error) { fatal ||= error; }
      }
      await writeQueue;
    }
    if (persistenceError) throw new Error('JSON kaydedilemedi; çalışan istekler durduruldu. Mevcut raporlar sonraki çalıştırmada tekrar bulunabilir: ' + persistenceError.message);
    if (fatal) throw fatal;
    return manifest;
  }
})();

