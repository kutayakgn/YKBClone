/* Yapı Kredi anlaşmalı proje arşivi. Chrome/Edge DevTools Console'a tamamını yapıştırın.
   https://www.yapikredi.com.tr/kredi/anlasmali-projelerimiz/
   Ardından açılan paneldeki gerçek düğmeye basıp bir üst klasör seçin. */
(() => {
  'use strict';
  if (window.ykbContractedProjectsExport?.busy) {
    console.warn('Önce eski işlemi Durdur düğmesiyle durdurun; işlem tamamen bittikten sonra yeni kodu yapıştırın.');
    return;
  }
  document.getElementById('ykb-projects-panel')?.remove();
  const SOURCE = 'https://www.yapikredi.com.tr/kredi/anlasmali-projelerimiz/';
  const ENDPOINT = SOURCE + 'default.aspx/GetProjectList';
  const FILTERS = Object.freeze({ cityId: null, districtId: null, projectName: '', companyName: '' });
  const DOWNLOAD_CONCURRENCY = 4; // Aynı anda doğrulanacak/indirilecek en fazla dosya sayısı.
  const DELAY = 100, TIMEOUT = 60000, RETRIES = 3, MAX_FILE = 100 * 1024 * 1024;
  const encoder = new TextEncoder(), decoder = new TextDecoder();
  const api = window.ykbContractedProjectsExport = {
    version: 1, busy: false, manifest: null, errors: null,
    progress: { stage: 'ready', message: '', page: 0, totalPages: 0, index: 0, total: 0 },
    start, stop,
  };
  let aborter = null, interrupted = false;
  const panel = document.createElement('section');
  panel.id = 'ykb-projects-panel';
  panel.style.cssText = 'position:fixed!important;right:18px!important;bottom:18px!important;width:350px!important;max-width:90vw!important;z-index:2147483647!important;background:#fff!important;color:#15354c!important;border:2px solid #0079bd!important;border-radius:10px!important;padding:16px!important;box-shadow:0 5px 25px #0004!important;font:14px/1.5 Arial,sans-serif!important;text-align:left!important;';
  panel.innerHTML = '<strong style="font-size:16px">Yapı Kredi anlaşmalı proje arşivi</strong>' +
    '<p style="margin:8px 0">Tüm anlaşmalı projeler ve görselleri<br>Seçilen üst klasörde <b>ykb-anlasmali-projeler</b> oluşturulur. Aynı klasörü seçerek devam edebilirsiniz.</p>' +
    '<button id="ykb-projects-start" type="button" style="padding:8px;cursor:pointer">Klasör seç ve indir</button> ' +
    '<button id="ykb-projects-stop" type="button" style="padding:8px;cursor:pointer" disabled>Durdur</button>' +
    '<p id="ykb-projects-status" role="status" style="margin:10px 0 0;white-space:pre-wrap;overflow-wrap:anywhere"></p>';
  (document.body || document.documentElement).appendChild(panel);
  const startButton = document.getElementById('ykb-projects-start');
  const stopButton = document.getElementById('ykb-projects-stop');
  const status = document.getElementById('ykb-projects-status');
  startButton.addEventListener('click', start);
  stopButton.addEventListener('click', stop);
  function update(stage, message, extra = {}) {
    Object.assign(api.progress, extra, { stage, message });
    status.textContent = message;
  }
  function environmentError() {
    if (window.top !== window.self) return 'Kodu sayfanın ana çerçevesinin Console alanında çalıştırın.';
    if (window.location.origin !== 'https://www.yapikredi.com.tr') return 'Kodu https://www.yapikredi.com.tr üzerindeki anlaşmalı proje sayfasında çalıştırın.';
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
      const directory = parent.name === 'ykb-anlasmali-projeler' ? parent : await parent.getDirectoryHandle('ykb-anlasmali-projeler', { create: true });
      manifest = await exportArchive(directory, aborter.signal);
      const counts = `${manifest.downloadedCount} başarılı (${manifest.reusedCount} mevcut dosya), ${manifest.failedCount} hatalı, ${manifest.pendingCount} bekleyen.`;
      update(interrupted ? 'stopped' : manifest.listingComplete && !manifest.failedCount && !manifest.pendingCount ? 'complete' : 'incomplete',
        `${interrupted ? 'Durduruldu.' : 'İşlem tamamlandı.'} ${counts}\nListe tam: ${manifest.listingComplete ? 'evet' : 'hayır'}.\nAyrıntılar: projects.json ve errors.json. Hatalar için aynı klasörü seçerek tekrar çalıştırın.`);
      console.info('Yapı Kredi anlaşmalı proje sonucu:', manifest, api.errors);
      return manifest;
    } catch (error) {
      const cancelled = error.name === 'AbortError' && !pickerCompleted;
      update(cancelled ? 'stopped' : 'error', cancelled ? 'Klasör seçimi iptal edildi.' : `İşlem durdu: ${error.message}`);
      console.error('Yapı Kredi anlaşmalı proje hatası:', error);
      return null;
    } finally {
      api.busy = false;
      startButton.disabled = false;
      stopButton.disabled = true;
      aborter = null;
    }
  }
  const clean = value => String(value ?? '').replace(/\s+/gu, ' ').trim();
  const identity = record => JSON.stringify(['projectName', 'firmName', 'city', 'district', 'branch', 'phone', 'websiteUrl'].map(key => clean(record[key])));
  async function sha256(bytes) {
    const digest = await window.crypto.subtle.digest('SHA-256', typeof bytes === 'string' ? encoder.encode(bytes) : bytes);
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  }
  function httpUrl(value) {
    const url = new URL(value, SOURCE);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('HTTP(S) olmayan URL: ' + value);
    url.hash = '';
    return url.href;
  }
  function splitBranchPhone(text, warn) {
    const candidates = text.matchAll(/\+?\s*(?:\(\s*\d{3,4}\s*\)|\d)[\d\s().-]{5,}\d/g);
    for (const match of candidates) {
      if ((match[0].match(/\d/g) || []).length < 7) continue;
      const branch = text.slice(0, match.index).replace(/[\s/|:;-]+$/g, '').trim();
      if (!branch) warn('Telefon bulundu fakat şube adı boş.');
      return { branch, phone: text.slice(match.index).trim() };
    }
    if (text) warn('Şube/telefon ayrımı belirsiz; metin şube alanında ve branchPhoneText içinde korundu.');
    return { branch: text, phone: '' };
  }
  function imageUrl(card) {
    const usable = value => value && !/^(?:data:|blob:|about:)/i.test(value) && !/\/(?:transparent|spacer|placeholder|loading)\.(?:png|gif)(?:[?#]|$)/i.test(value);
    for (const img of card.querySelectorAll('img')) {
      for (const name of ['data-src', 'src']) {
        const value = clean(img.getAttribute(name));
        if (usable(value)) return httpUrl(value);
      }
    }
    for (const source of card.querySelectorAll('picture source')) {
      for (const name of ['data-srcset', 'srcset']) {
        for (const entry of (source.getAttribute(name) || '').split(',')) {
          const value = entry.trim().split(/\s+/)[0];
          if (usable(value)) return httpUrl(value);
        }
      }
    }
    return null;
  }
  async function parsePage(payload, pageIndex) {
    let result = payload?.d;
    if (typeof result === 'string') result = JSON.parse(result);
    if (!result || Number(result.StatusCode) !== 200 || result.Exception) {
      throw new Error(`Liste API hatası: ${result?.StatusCode ?? 'durum yok'} ${result?.Message || ''} ${result?.Exception ? JSON.stringify(result.Exception) : ''}`);
    }
    if (typeof result.Data !== 'string') throw new Error('Liste yanıtındaki Data HTML metni değil.');
    const doc = new DOMParser().parseFromString(result.Data, 'text/html');
    const records = [], warnings = [];
    for (const card of doc.querySelectorAll('.item-ap')) {
      const projectName = clean(card.querySelector('h2')?.textContent);
      if (!projectName) throw new Error(`${pageIndex}. sayfada proje adı olmayan kart var.`);
      const warn = message => warnings.push(projectName + ': ' + message);
      const fields = new Map(), items = Array.from(card.querySelectorAll('ul > li'));
      if (!items.length) throw new Error(projectName + ': proje bilgi listesi bulunamadı.');
      for (const item of items) {
        const label = slug(clean(item.querySelector('p')?.textContent));
        const span = item.querySelector('span');
        if (!label || !span) throw new Error(projectName + ': beklenmeyen alan yapısı.');
        if (fields.has(label)) throw new Error(projectName + ': yinelenen alan: ' + label);
        fields.set(label, span);
      }
      for (const label of ['firma-adi', 'adres', 'web', 'ilgili-sube-tel']) {
        if (!fields.has(label)) throw new Error(projectName + ': beklenen alan başlığı bulunamadı: ' + label);
      }
      const firmName = clean(fields.get('firma-adi')?.textContent);
      const addressText = clean(fields.get('adres')?.textContent);
      const address = addressText.split('/').map(clean);
      const city = address.shift() || '', district = address.join(' / ');
      const branchPhoneText = clean(fields.get('ilgili-sube-tel')?.textContent);
      const { branch, phone } = splitBranchPhone(branchPhoneText, warn);
      const web = fields.get('web'), links = web ? Array.from(web.querySelectorAll('a[href]')) : [];
      if (links.length > 1) throw new Error(projectName + ': birden fazla web adresi var.');
      const href = clean(links[0]?.getAttribute('href'));
      const websiteUrl = href ? httpUrl(href) : '';
      const imageSourceUrl = imageUrl(card);
      if (!firmName) warn('Firma adı kaynakta boş.');
      if (!addressText) warn('Adres kaynakta boş.');
      else if (!district) warn('Adresin ilçe bölümü bulunamadı; adres metni korundu.');
      if (!branchPhoneText) warn('Şube/telefon kaynakta boş.');
      if (!imageSourceUrl) warn('Kaynakta kullanılabilir görsel yok; Image boş kalacak.');
      records.push({ projectName, firmName, city, district, websiteUrl, branch, phone, imageSourceUrl,
        imageFileName: '', imageStatus: imageSourceUrl ? 'pending' : 'missing', imageSha256: null,
        imageByteLength: null, imageError: null, sourcePage: pageIndex, addressText, branchPhoneText });
    }
    if (!records.length && result.Data.trim()) throw new Error(`${pageIndex}. sayfada tanınabilir proje kartı yok.`);
    let active = null, totalPages = 1;
    for (const item of doc.querySelectorAll('li[data-page]')) {
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
    return { records, warnings, totalPages, fingerprint: await sha256(records.map(record => JSON.stringify([identity(record), record.imageSourceUrl, record.addressText, record.branchPhoneText])).join('\n')) };
  }
  function slug(value) {
    const map = { ı: 'i', İ: 'i', ş: 's', Ş: 's', ğ: 'g', Ğ: 'g', ü: 'u', Ü: 'u', ö: 'o', Ö: 'o', ç: 'c', Ç: 'c' };
    return value.replace(/[ıİşŞğĞüÜöÖçÇ]/g, char => map[char]).normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }
  const EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.bmp'];
  async function fileName(url, extension) {
    const parts = new URL(url).pathname.split('/').filter(Boolean);
    if (/^(view|download)$/i.test(parts.at(-1) || '')) parts.pop();
    let base = parts.at(-1) || 'image';
    try { base = decodeURIComponent(base); } catch { /* Slugging also handles malformed escapes. */ }
    const text = slug(base.replace(/\.[a-z0-9]{2,5}$/i, '')) || 'image';
    const suffix = '-' + (await sha256(url)).slice(0, 12) + extension;
    return (text.slice(0, 50 - suffix.length).replace(/-+$/g, '') || 'image') + suffix;
  }
  function safeName(name) {
    return typeof name === 'string' && name.length <= 50 && /^[a-z0-9][a-z0-9._-]*\.(jpe?g|png|webp|gif|avif|bmp)$/.test(name) && !name.includes('..');
  }
  async function fileType(bytes) {
    const readable = decoder.decode(bytes.subarray(0, 1024)).replace(/^\uFEFF/, '');
    if (/^\s*</.test(readable)) throw new Error('Görsel yerine HTML/XML döndü.');
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const text = (offset, count) => decoder.decode(bytes.subarray(offset, offset + count));
    let extension = null;
    if (bytes.length >= 33 && view.getUint32(0) === 0x89504e47 && view.getUint32(4) === 0x0d0a1a0a) {
      if (view.getUint32(8) !== 13 || text(12, 4) !== 'IHDR' || !view.getUint32(16) || !view.getUint32(20)) throw new Error('Geçersiz PNG başlığı.');
      let offset = 8, ended = false, data = false;
      while (offset + 12 <= bytes.length) {
        const length = view.getUint32(offset), type = text(offset + 4, 4);
        if (offset + 12 + length > bytes.length) throw new Error('Eksik PNG parçası.');
        if (type === 'IDAT' && length > 0) data = true;
        offset += 12 + length;
        if (type === 'IEND') { if (length !== 0) throw new Error('Geçersiz PNG sonu.'); ended = true; break; }
      }
      if (!data || !ended || offset !== bytes.length) throw new Error('Eksik/geçersiz PNG.');
      extension = '.png';
    } else if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      if (bytes.at(-2) !== 0xff || bytes.at(-1) !== 0xd9) throw new Error('Eksik JPEG sonu.');
      extension = '.jpg';
    } else if (bytes.length >= 20 && text(0, 4) === 'RIFF' && text(8, 4) === 'WEBP') {
      if (view.getUint32(4, true) + 8 !== bytes.length || !['VP8 ', 'VP8L', 'VP8X'].includes(text(12, 4)) || view.getUint32(16, true) + 20 > bytes.length) throw new Error('Eksik/geçersiz WEBP.');
      extension = '.webp';
    } else if (bytes.length >= 14 && ['GIF87a', 'GIF89a'].includes(text(0, 6))) {
      if (!view.getUint16(6, true) || !view.getUint16(8, true) || bytes.at(-1) !== 0x3b) throw new Error('Eksik/geçersiz GIF.');
      extension = '.gif';
    } else if (bytes.length >= 24 && text(4, 4) === 'ftyp') {
      const size = view.getUint32(0);
      if (size < 16 || size > bytes.length || !/avif|avis/.test(text(8, size - 8))) throw new Error('Desteklenmeyen AVIF markası.');
      let offset = 0;
      while (offset < bytes.length) {
        if (offset + 8 > bytes.length) throw new Error('Eksik AVIF kutusu.');
        let length = view.getUint32(offset);
        if (length === 1) {
          if (offset + 16 > bytes.length) throw new Error('Eksik AVIF geniş kutusu.');
          length = Number(view.getBigUint64(offset + 8));
        } else if (length === 0) length = bytes.length - offset;
        if (length < 8 || !Number.isSafeInteger(length) || offset + length > bytes.length) throw new Error('Geçersiz AVIF kutusu.');
        offset += length;
      }
      extension = '.avif';
    } else if (bytes.length >= 54 && text(0, 2) === 'BM') {
      if (view.getUint32(2, true) !== bytes.length || view.getUint32(14, true) < 40 || view.getUint32(10, true) >= bytes.length || view.getInt32(18, true) <= 0 || !view.getInt32(22, true)) throw new Error('Geçersiz BMP.');
      extension = '.bmp';
    }
    if (!extension) throw new Error('Desteklenmeyen/bozuk görsel; JPEG, PNG, WEBP, GIF, AVIF veya BMP bekleniyor.');
    const mime = { '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif', '.avif': 'image/avif', '.bmp': 'image/bmp' }[extension];
    const blob = new Blob([bytes], { type: mime });
    if (typeof window.createImageBitmap === 'function') {
      const bitmap = await window.createImageBitmap(blob);
      try { if (!bitmap.width || !bitmap.height) throw new Error('Görsel boyutları geçersiz.'); }
      finally { bitmap.close(); }
    } else {
      const image = new Image(), url = URL.createObjectURL(blob);
      try { image.src = url; await image.decode(); if (!image.naturalWidth || !image.naturalHeight) throw new Error('Görsel çözümlenemedi.'); }
      finally { URL.revokeObjectURL(url); }
    }
    return extension;
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
    const images = await directory.getDirectoryHandle('images', { create: true });
    const manifest = api.manifest = {
      schemaVersion: 1, sourceUrl: SOURCE, tableClassName: 'YkbYapikredi.ContractedProjects', filters: { ...FILTERS }, listingComplete: false,
      totalRecords: 0, records: [], listingErrors: [], totalPages: null, enumeratedPages: 0,
      warnings: [], reusedCount: 0, downloadedNewCount: 0,
    };
    function warn(message) {
      if (!manifest.warnings.includes(message)) { manifest.warnings.push(message); console.warn(message); }
    }
    const files = new Map(), cache = new Map(), cachedOwners = new Map(), claimed = new Map();
    for await (const handle of images.values()) {
      if (signal.aborted) throw interruptedError();
      if (handle.kind === 'file' && safeName(handle.name)) files.set(handle.name, handle);
    }
    async function readCache(name) {
      try {
        const handle = await directory.getFileHandle(name);
        const value = JSON.parse(await (await handle.getFile()).text());
        if (!value || value.schemaVersion !== 1 || !Array.isArray(value.records)) throw new Error('şema geçersiz');
        for (const record of value.records) {
          try {
            if (!record?.imageSourceUrl) continue;
            const key = httpUrl(record.imageSourceUrl);
            if (!safeName(record.imageFileName)) throw new Error('görsel dosya adı geçersiz');
            const suffix = '-' + (await sha256(key)).slice(0, 12);
            if (!EXTENSIONS.some(extension => record.imageFileName.endsWith(suffix + extension))) throw new Error('dosya adı görsel URL ile eşleşmiyor');
            const trusted = record.imageStatus === 'downloaded' && /^[a-f0-9]{64}$/.test(record.imageSha256 || '') &&
              Number.isSafeInteger(record.imageByteLength) && record.imageByteLength > 0 && record.imageByteLength <= MAX_FILE;
            const entry = { imageSourceUrl: key, imageFileName: record.imageFileName, imageStatus: trusted ? 'downloaded' : 'pending',
              imageSha256: trusted ? record.imageSha256 : null, imageByteLength: trusted ? record.imageByteLength : null, imageError: null };
            const previous = cache.get(key) || [];
            if (!previous.some(item => item.imageFileName === entry.imageFileName && item.imageSha256 === entry.imageSha256 && item.imageByteLength === entry.imageByteLength)) previous.push(entry);
            cache.set(key, previous);
            if (!cachedOwners.has(entry.imageFileName)) cachedOwners.set(entry.imageFileName, key);
            else if (cachedOwners.get(entry.imageFileName) !== key) { cachedOwners.set(entry.imageFileName, null); warn('Önbellekte dosya adı çakışması yok sayıldı: ' + entry.imageFileName); }
          } catch (error) { warn(`${name}: geçersiz kayıt yok sayıldı (${error.message}). Mevcut dosyalar yine denetlenecek.`); }
        }
      } catch (error) {
        if (error.name !== 'NotFoundError') warn(`${name} okunamadı/geçersiz; kaynak liste ve mevcut dosyalardan yeniden oluşturuluyor: ${error.message}`);
      }
    }
    await readCache('projects.resume.json');
    await readCache('projects.json');

    // A single writer queue owns ALL JSON files. Capture strings now, not when a queued write runs.
    let writeQueue = Promise.resolve(), persistenceError = null, checkpointTimer = null, dirty = 0;
    function snapshot() {
      manifest.totalRecords = manifest.records.length;
      manifest.downloadedCount = manifest.records.filter(record => record.imageStatus === 'downloaded').length;
      manifest.failedCount = manifest.records.filter(record => record.imageStatus === 'failed').length;
      manifest.pendingCount = manifest.records.filter(record => record.imageStatus === 'pending').length;
      manifest.missingCount = manifest.records.filter(record => record.imageStatus === 'missing').length;
      manifest.generatedAt = new Date().toISOString();
      api.errors = {
        generatedAt: manifest.generatedAt, listingComplete: manifest.listingComplete, listingErrors: manifest.listingErrors,
        warnings: manifest.warnings,
        downloadErrors: manifest.records.filter(record => record.imageStatus === 'failed').map(({ projectName, imageSourceUrl, sourcePage, imageFileName, imageError }) => ({ projectName, imageSourceUrl, sourcePage, imageFileName, imageError })),
      };
      const stringify = value => JSON.stringify(value, null, 2) + '\n';
      return [
        ['projects.resume.json', stringify({ schemaVersion: 1, records: Array.from(cache.values()).flat() })],
        ['projects.json', stringify(manifest)], ['errors.json', stringify(api.errors)],
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
        body: JSON.stringify({ ...FILTERS, pageIndex }) }, 8 * 1024 * 1024, signal);
      return parsePage(JSON.parse(decoder.decode(bytes).replace(/^\uFEFF/, '')), pageIndex);
    }
    function claim(name, key) {
      if (!safeName(name)) throw new Error('Güvensiz dosya adı: ' + name);
      if (claimed.has(name) && claimed.get(name) !== key) throw new Error('Dosya adı çakışması; üzerine yazılmadı: ' + name);
      claimed.set(name, key);
    }
    async function reuse(key) {
      const previous = cache.get(key) || [];
      const names = new Set();
      // URL alone identifies the image: projects sharing a URL share exactly one local file.
      for (const item of previous) if (cachedOwners.get(item.imageFileName) === key) names.add(item.imageFileName);
      for (const extension of EXTENSIONS) names.add(await fileName(key, extension));
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
        try { extension = await fileType(bytes); }
        catch (error) { warn(`Mevcut dosya doğrulanamadı: ${name} (${error.message})`); continue; }
        if (!name.endsWith(extension) && !(extension === '.jpg' && name.endsWith('.jpeg'))) { warn('Mevcut dosya türü/uzantısı uyuşmuyor: ' + name); continue; }
        const hash = await sha256(bytes);
        const known = previous.filter(item => item.imageFileName === name && item.imageSha256);
        const hashes = new Set(known.map(item => item.imageSha256)), sizes = new Set(known.map(item => item.imageByteLength));
        if (hashes.size > 1 || sizes.size > 1) warn('Çelişkili önbellek bilgisi yok sayıldı; dosya içeriği denetlendi: ' + name);
        else if (known.length && (!hashes.has(hash) || !sizes.has(file.size))) { warn('Mevcut dosyanın SHA-256/boyutu değişmiş; yeniden indirilecek: ' + name); continue; }
        const result = { imageSourceUrl: key, imageFileName: name, imageSha256: hash, imageByteLength: bytes.length, imageStatus: 'downloaded', imageError: null };
        cache.set(key, [{ ...result }]);
        manifest.reusedCount++;
        return result;
      }
      return null;
    }
    const imageJobs = new Map();
    function loadImage(url) {
      if (!imageJobs.has(url)) imageJobs.set(url, (async () => {
        const existing = await reuse(url);
        if (existing) return existing;
        if (signal.aborted) throw interruptedError();
        const bytes = await fetchBytes(url, { method: 'GET' }, MAX_FILE, signal);
        const extension = await fileType(bytes), name = await fileName(url, extension);
        claim(name, url);
        const hash = await sha256(bytes);
        await writeFile(images, name, bytes);
        const result = { imageSourceUrl: url, imageFileName: name, imageSha256: hash, imageByteLength: bytes.length, imageStatus: 'downloaded', imageError: null };
        cache.set(url, [{ ...result }]);
        manifest.downloadedNewCount++;
        return result;
      })());
      return imageJobs.get(url);
    }
    let currentPage = 1, fatal = null, workers = [];
    try {
      await checkpoint(true);
      const pages = new Set(), keys = new Map();
      let first;
      try {
        for (currentPage = 1; ; currentPage++) {
          const page = await getPage(currentPage);
          if (!first) { first = page; manifest.totalPages = page.totalPages; }
          if (page.totalPages !== manifest.totalPages) throw new Error('İşlem sırasında toplam sayfa sayısı değişti; tekrar çalıştırın.');
          if (pages.has(page.fingerprint)) throw new Error('Önceki sayfa tekrar döndü; eksik aktarımı önlemek için listeleme durduruldu.');
          for (const record of page.records) {
            const key = identity(record);
            if (keys.has(key)) throw new Error(`${keys.get(key) !== record.imageSourceUrl ? 'Aynı proje farklı görselle tekrarlandı' : 'Yinelenen proje'}: ${record.projectName}. Liste değişmiş olabilir; tekrar çalıştırın.`);
          }
          pages.add(page.fingerprint);
          for (const record of page.records) {
            const key = identity(record);
            keys.set(key, record.imageSourceUrl);
            manifest.records.push({ ...record });
          }
          for (const warning of page.warnings) warn(warning);
          manifest.enumeratedPages = currentPage;
          await checkpoint(true);
          update('listing', `Liste ${currentPage}/${manifest.totalPages}: ${manifest.records.length} proje.`, { page: currentPage, totalPages: manifest.totalPages, total: manifest.records.length });
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
      await checkpoint(true);
      if (!signal.aborted) {
        let next = 0, completed = 0;
        async function worker() {
          while (!signal.aborted) {
            const index = next++;
            if (index >= manifest.records.length) return;
            const record = manifest.records[index];
            try {
              if (record.imageSourceUrl) Object.assign(record, await loadImage(record.imageSourceUrl));
            } catch (error) {
              record.imageStatus = 'failed'; record.imageSha256 = null; record.imageByteLength = null;
              record.imageError = error.message + (error.attempts ? ` (deneme: ${error.attempts})` : '');
              console.error('Görsel indirilemedi:', record.projectName, record.imageSourceUrl, error);
            }
            completed++;
            update(signal.aborted ? 'stopping' : 'downloading', `${completed}/${manifest.records.length} proje tamamlandı; ${manifest.reusedCount} mevcut görsel kullanıldı.\n${record.projectName}`,
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
    if (persistenceError) throw new Error('JSON kaydedilemedi; çalışan istekler durduruldu. Mevcut görseller sonraki çalıştırmada tekrar bulunabilir: ' + persistenceError.message);
    if (fatal) throw fatal;
    return manifest;
  }
})();

