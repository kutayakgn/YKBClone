/* Chrome/Edge konsolunda çalıştırın. Kaynak: restoranlar.json + gorseller/. */
(() => {
  'use strict';
  const id = 'ykb-local-webp';
  if (document.getElementById(id)) return;
  if (!window.showDirectoryPicker) throw new Error('Masaüstü Chrome veya Edge kullanın.');

  const panel = document.createElement('div');
  panel.id = id;
  panel.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:2147483647;background:white;color:#111;padding:16px;border:2px solid #00428a;border-radius:8px;font:14px Arial;max-width:360px';
  const status = document.createElement('p');
  status.textContent = 'restoranlar.json ve gorseller içeren klasörü seçin.';
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = 'Klasör seç ve WebP’ye dönüştür';
  button.style.cssText = 'padding:12px;cursor:pointer';
  panel.append(status, button);
  document.body.append(panel);

  async function save(dir, name, content) {
    const file = await dir.getFileHandle(name, { create: true });
    const writer = await file.createWritable();
    try { await writer.write(content); await writer.close(); }
    catch (error) { await writer.abort().catch(() => {}); throw error; }
  }
  async function webp(file) {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    try {
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas başlatılamadı.');
      context.drawImage(bitmap, 0, 0);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', 0.9));
      if (!blob || blob.type !== 'image/webp' || !blob.size) {
        throw new Error('Tarayıcı WebP oluşturamadı.');
      }
      return blob;
    } finally {
      bitmap.close();
      canvas.width = canvas.height = 0;
    }
  }

  button.onclick = async () => {
    button.disabled = true;
    try {
      // Kullanıcı tıklaması içinde çağrılır; yalnızca seçilen klasöre erişilir.
      const root = await window.showDirectoryPicker({ mode: 'readwrite' });
      const jsonFile = await (await root.getFileHandle('restoranlar.json')).getFile();
      const rows = JSON.parse((await jsonFile.text()).replace(/^\uFEFF/, ''));
      if (!Array.isArray(rows)) throw new Error('restoranlar.json bir JSON dizisi olmalı.');
      const source = await root.getDirectoryHandle('gorseller');
      const files = new Map();
      for await (const [name, handle] of source.entries()) {
        if (handle.kind === 'file') files.set(name, handle);
      }
      const missing = [...new Set(rows.map(r => r.gorselAdi).filter(Boolean))]
        .filter(name => !files.has(name));
      if (missing.length) throw new Error(`Kaynak görseller eksik: ${missing.join(', ')}`);

      // Yeni klasör oluştur; kaynak JSON ve görsellere dokunma.
      let outputName;
      for (;;) {
        outputName = `webp-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
        try { await root.getDirectoryHandle(outputName); }
        catch (error) { if (error.name === 'NotFoundError') break; throw error; }
      }
      const output = await root.getDirectoryHandle(outputName, { create: true });
      const images = await output.getDirectoryHandle('gorseller', { create: true });
      const used = new Set([...files.keys()].map(name => name.toLowerCase()));
      const mapping = new Map(), errors = [];
      let done = 0, converted = 0;
      for (const [oldName, handle] of files) {
        const file = await handle.getFile();
        let newName = oldName, content = file;
        if (/\.(png|jpe?g)$/i.test(oldName)) {
          try {
            content = await webp(file);
            const base = oldName.replace(/\.[^.]+$/, '');
            let n = 1;
            do {
              const suffix = n === 1 ? '' : `-${n}`;
              newName = base.slice(0, 50 - 5 - suffix.length) + suffix + '.webp';
              n++;
            } while (used.has(newName.toLowerCase()));
            used.add(newName.toLowerCase());
            converted++;
          } catch (error) {
            errors.push({ gorselAdi: oldName, hata: String(error.message || error) });
            // Dönüşüm başarısızsa orijinali kopyala; JSON bağlantısı korunur.
          }
        }
        await save(images, newName, content);
        mapping.set(oldName, newName);
        status.textContent = `${++done}/${files.size} dosya · ${converted} WebP · ${errors.length} hata`;
      }
      for (const row of rows) {
        if (mapping.has(row.gorselAdi)) row.gorselAdi = mapping.get(row.gorselAdi);
      }
      await save(output, 'restoranlar.json', JSON.stringify(rows, null, 2));
      await save(output, 'donusum-hatalari.json', JSON.stringify(errors, null, 2));
      status.textContent = `Tamamlandı: ${converted} WebP, ${rows.length} kayıt. Hata: ${errors.length}. Klasör: ${outputName}`;
      console.log('WebP çıktısı:', { klasor: outputName, webp: converted, kayit: rows.length, hatalar: errors });
    } catch (error) {
      status.textContent = error.name === 'AbortError' ? 'Klasör seçimi iptal edildi.' : `Hata: ${error.message}`;
      if (error.name !== 'AbortError') console.error(error);
    } finally {
      button.disabled = false;
    }
  };
})();
