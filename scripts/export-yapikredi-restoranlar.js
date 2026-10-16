/* Yapı Kredi restoran sayfası açıkken Chrome/Edge konsoluna tamamını yapıştırın.
 * Ardından sayfadaki "Klasöre kaydet" düğmesine tıklayın.
 */
(() => {
  'use strict';
  if (window.__ykbExportBusy) return console.warn('Dışa aktarma zaten çalışıyor.');
  if (!window.showDirectoryPicker) {
    throw new Error('Klasöre kayıt için sayfayı masaüstü Chrome veya Edge ile açın.');
  }

  const clean = s => String(s ?? '').replace(/\s+/g, ' ').trim();
  const text = el => clean(el?.textContent);
  const fold = s => clean(s).toLocaleLowerCase('tr-TR').replace(/ı/g, 'i')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  // Plaka sırası; posta kodunun ilk iki hanesi de bu sırayı kullanır.
  const cities = ('Adana|Adıyaman|Afyonkarahisar|Ağrı|Amasya|Ankara|Antalya|Artvin|Aydın|Balıkesir|'
    + 'Bilecik|Bingöl|Bitlis|Bolu|Burdur|Bursa|Çanakkale|Çankırı|Çorum|Denizli|Diyarbakır|Edirne|'
    + 'Elazığ|Erzincan|Erzurum|Eskişehir|Gaziantep|Giresun|Gümüşhane|Hakkari|Hatay|Isparta|Mersin|'
    + 'İstanbul|İzmir|Kars|Kastamonu|Kayseri|Kırklareli|Kırşehir|Kocaeli|Konya|Kütahya|Malatya|'
    + 'Manisa|Kahramanmaraş|Mardin|Muğla|Muş|Nevşehir|Niğde|Ordu|Rize|Sakarya|Samsun|Siirt|Sinop|'
    + 'Sivas|Tekirdağ|Tokat|Trabzon|Tunceli|Şanlıurfa|Uşak|Van|Yozgat|Zonguldak|Aksaray|Bayburt|'
    + 'Karaman|Kırıkkale|Batman|Şırnak|Bartın|Ardahan|Iğdır|Yalova|Karabük|Kilis|Osmaniye|Düzce').split('|');
  const cityByToken = new Map(cities.map(c => [fold(c), c]));
  const districts = {
    bodrum: 'Muğla', fethiye: 'Muğla', gocek: 'Muğla', marmaris: 'Muğla',
    datca: 'Muğla', akyaka: 'Muğla', turkbuku: 'Muğla',
    cesme: 'İzmir', alacati: 'İzmir', urla: 'İzmir', ayvalik: 'Balıkesir',
    kapadokya: 'Nevşehir', izmit: 'Kocaeli', adapazari: 'Sakarya', corlu: 'Tekirdağ'
  };
  const areaCodes = {
    212: 'İstanbul', 216: 'İstanbul', 224: 'Bursa', 232: 'İzmir', 242: 'Antalya',
    252: 'Muğla', 256: 'Aydın', 262: 'Kocaeli', 264: 'Sakarya', 266: 'Balıkesir',
    282: 'Tekirdağ', 286: 'Çanakkale', 312: 'Ankara', 322: 'Adana', 324: 'Mersin',
    342: 'Gaziantep', 384: 'Nevşehir'
  };
  const tabDefaults = {
    tab1: 'İstanbul', tab2: 'İzmir', tab3: 'Muğla', tab4: 'Antalya',
    tab5: 'İzmir', tab6: 'Nevşehir', tab7: 'Muğla', tab8: 'Balıkesir',
    tab9: 'Muğla', tab10: 'İzmir', tab11: 'Ankara'
  };
  function namedCity(value, allowDistricts = false) {
    const tokens = fold(value).split(/[^a-z]+/).filter(Boolean);
    const explicit = tokens.map(t => cityByToken.get(t)).filter(Boolean);
    if (explicit.length) return explicit.at(-1);
    return allowDistricts ? tokens.map(t => districts[t]).filter(Boolean).at(-1) ?? null : null;
  }
  function inferCity(address, branchName, phone, tab) {
    const named = namedCity(address) || namedCity(branchName);
    if (named) return named;
    const postal = address.match(/\b(\d{5})\b/);
    if (postal && cities[Number(postal[1].slice(0, 2)) - 1]) {
      return cities[Number(postal[1].slice(0, 2)) - 1];
    }
    const district = namedCity(address, true) || namedCity(branchName, true);
    if (district) return district;
    const digits = (phone || '').replace(/\D/g, '').replace(/^(?:0090|90|0)/, '');
    if (areaCodes[digits.slice(0, 3)]) return areaCodes[digits.slice(0, 3)];
    const label = [...document.querySelectorAll('[href], [data-href], [data-bs-target]')]
      .find(el => [el.getAttribute('href'), el.getAttribute('data-href'),
        el.getAttribute('data-bs-target')].includes(`#${tab?.id}`));
    return namedCity(text(label), true) || tabDefaults[tab?.id] || null;
  }
  // Sadece bu restoranın/şubenin kendi paragrafları; diğer şubeler karışmaz.
  function details(scope, restaurantName) {
    const own = selector => [...scope.querySelectorAll(selector)]
      .filter(el => el.closest('.branch') === (scope.matches('.branch') ? scope : null));
    const addressParts = own('p').filter(p => !p.matches('.telNum, .webSite')
      && !p.querySelector('a[href^="tel:"], a[href^="http"], a[href^="mailto:"]'))
      .map(text).filter(Boolean);
    // Kitchenette gibi bazı kayıtlarda şube adı ilk <p> içinde verilmiş.
    let inlineBranchName = null;
    if (addressParts.length > 1 && fold(addressParts[0]).startsWith(`${fold(restaurantName)} `)) {
      inlineBranchName = addressParts.shift();
    }
    let address = addressParts.join(', ');
    let phone = own('.telNum').map(text).filter(Boolean).join(' / ')
      .replace(/^Paket Servis\s*:\s*/i, '').replace(/\/?p>$/i, '').trim();
    if (!phone) phone = text(own('a[href^="tel:"]')[0]);
    // Sayfadaki bazı telefonlar .telNum yerine adres satırının sonunda.
    const inline = address.match(/(?:^|\s)((?:\+90[\s-]*)?0?\s*\(?[2-5]\d{2}\)?[\s-]*\d{3}[\s-]*\d{2}[\s-]*\d{2})\s*$/);
    if (inline) {
      if (!phone) phone = clean(inline[1]);
      address = address.slice(0, inline.index).replace(/[\s,;]+$/, '');
    }
    const link = own('.webSite a[href], a.external[href]')
      .find(a => /^https?:/i.test(a.href));
    return { address: address || null, phone: phone || null, website: link?.href || null, inlineBranchName };
  }

  const items = [...document.querySelectorAll('.tab-content .restoran')];
  if (!items.length) throw new Error('.tab-content içinde .restoran bulunamadı.');
  const restoranlar = [], logos = new Map();
  for (const item of items) {
    const about = item.querySelector('.restAbout');
    if (!about) throw new Error('Beklenmeyen HTML: .restAbout eksik.');
    const name = text(about.querySelector('h2')) || clean(item.querySelector('.restLogo img')?.alt);
    if (!name) throw new Error('Beklenmeyen HTML: restoran adı eksik.');
    const img = item.querySelector('.restLogo img');
    const src = img?.getAttribute('data-src') || img?.getAttribute('src') || img?.currentSrc;
    const url = src ? new URL(src, document.baseURI).href : null;
    const shared = details(about, name);
    const branches = [...about.querySelectorAll('.branch')];
    const scopes = branches.length ? branches : [about];
    // Şubeler dışında ayrıca bir ana adres varsa onu da koru.
    if (branches.length && shared.address) scopes.unshift(about);
    for (const scope of scopes) {
      const d = scope === about ? shared : details(scope, name);
      const branchName = scope === about ? d.inlineBranchName
        : text(scope.querySelector('h3')).replace(/[:：]\s*$/, '') || d.inlineBranchName || null;
      const phone = d.phone || shared.phone;
      const row = {
        gorselAdi: null,
        restoranAdi: name,
        acikAdres: d.address,
        il: inferCity(d.address || '', branchName || '', phone, item.closest('.tab-pane')),
        telefonNumarasi: phone,
        websitesi: d.website || shared.website,
        subeAdi: branchName
      };
      restoranlar.push(row);
      if (url) {
        if (!logos.has(url)) logos.set(url, { name, rows: [] });
        logos.get(url).rows.push(row);
      }
    }
  }

  const usedNames = new Set();
  function filename(name, extension) {
    const base = fold(name).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'restoran';
    let n = 1, result;
    do {
      const suffix = n === 1 ? '' : `-${n}`;
      result = base.slice(0, 50 - extension.length - suffix.length) + suffix + extension;
      n++;
    } while (usedNames.has(result.toLowerCase()));
    usedNames.add(result.toLowerCase());
    return result;
  }
  async function writeFile(dir, name, content) {
    const handle = await dir.getFileHandle(name, { create: true });
    const writer = await handle.createWritable();
    try { await writer.write(content); await writer.close(); }
    catch (error) { await writer.abort().catch(() => {}); throw error; }
  }
  async function download(url) {
    let lastError;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await fetch(url, { mode: 'cors', credentials: 'omit', signal: AbortSignal.timeout(30000) });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        if (!blob.size) throw new Error('Boş görsel');
        const mime = blob.type.split(';')[0].toLowerCase();
        if (mime && !mime.startsWith('image/') && mime !== 'application/octet-stream') {
          throw new Error(`Görsel yerine ${mime} döndü`);
        }
        const extensions = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/gif': '.gif',
          'image/webp': '.webp', 'image/svg+xml': '.svg', 'image/avif': '.avif',
          'image/bmp': '.bmp', 'image/x-icon': '.ico' };
        const pathExtension = new URL(url).pathname.match(/\.(png|jpe?g|gif|webp|svg|avif|bmp|ico)$/i)?.[0].toLowerCase();
        return { blob, extension: extensions[mime] || pathExtension || '.img' };
      } catch (error) { lastError = error; }
    }
    throw lastError;
  }

  document.getElementById('ykb-restoran-export')?.remove();
  const panel = document.createElement('div');
  panel.id = 'ykb-restoran-export';
  panel.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:2147483647;background:white;color:#111;padding:16px;border:2px solid #00428a;border-radius:8px;box-shadow:0 4px 20px #0003;font:14px Arial;max-width:360px';
  const status = document.createElement('p');
  status.textContent = `${restoranlar.length} kayıt / ${logos.size} farklı logo hazır.`;
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = 'Klasöre kaydet';
  button.style.cssText = 'padding:10px 16px;cursor:pointer';
  panel.append(status, button);
  document.body.append(panel);
  window.ykbRestoranExport = { restoranlar, hatalar: [] };

  button.onclick = async () => {
    if (window.__ykbExportBusy) return;
    window.__ykbExportBusy = true;
    button.disabled = true;
    const errors = [], usedBeforeRun = new Set(usedNames);
    try {
      // Gerçek tıklamanın içinde ilk çağrı: kullanıcı etkileşimi gereksinimi.
      const selected = await window.showDirectoryPicker({ mode: 'readwrite' });
      // Her çalıştırma yeni alt klasör: önceki dosyaların üzerine yazılmaz.
      let folderName;
      for (;;) {
        folderName = `ykb-restoranlar-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
        try { await selected.getDirectoryHandle(folderName); }
        catch (e) { if (e.name === 'NotFoundError') break; throw e; }
      }
      const output = await selected.getDirectoryHandle(folderName, { create: true });
      const imageDir = await output.getDirectoryHandle('gorseller', { create: true });
      usedNames.clear();
      restoranlar.forEach(row => { row.gorselAdi = null; });
      let index = 0, done = 0, success = 0;
      const jobs = [...logos.entries()];
      const worker = async () => {
        while (index < jobs.length) {
          const [url, logo] = jobs[index++];
          try {
            const { blob, extension } = await download(url);
            const name = filename(logo.name, extension);
            await writeFile(imageDir, name, blob);
            logo.rows.forEach(row => { row.gorselAdi = name; });
            success++;
          } catch (e) {
            errors.push({ restoranAdi: logo.name, gorselUrl: url, hata: String(e.message || e) });
          }
          status.textContent = `Logolar: ${++done}/${jobs.length} · Hata: ${errors.length}`;
        }
      };
      await Promise.all(Array.from({ length: Math.min(4, jobs.length) }, worker));
      await writeFile(output, 'restoranlar.json', JSON.stringify(restoranlar, null, 2));
      await writeFile(output, 'indirme-hatalari.json', JSON.stringify(errors, null, 2));
      window.ykbRestoranExport = { restoranlar, hatalar: errors, klasor: folderName };
      status.textContent = `${restoranlar.length} kayıt, ${success} logo kaydedildi. Hata: ${errors.length}. Klasör: ${folderName}`;
      console.log('Dışa aktarma tamamlandı:', window.ykbRestoranExport);
      if (errors.length) console.warn('İndirilemeyen logoların gorselAdi null bırakıldı.', errors);
      console.log('Eksik alanlar:', {
        adres: restoranlar.filter(r => !r.acikAdres).length,
        il: restoranlar.filter(r => !r.il).length,
        gorsel: restoranlar.filter(r => !r.gorselAdi).length
      });
      button.textContent = 'Yeni klasöre tekrar kaydet';
    } catch (e) {
      usedNames.clear();
      usedBeforeRun.forEach(name => usedNames.add(name));
      status.textContent = e.name === 'AbortError' ? 'Klasör seçimi iptal edildi.' : `Hata: ${e.message}`;
      if (e.name !== 'AbortError') console.error(e);
    } finally {
      window.__ykbExportBusy = false;
      button.disabled = false;
    }
  };
  console.log('Kayıtlar hazır. Sayfanın sağ altındaki “Klasöre kaydet” düğmesine tıklayın.');
})();
