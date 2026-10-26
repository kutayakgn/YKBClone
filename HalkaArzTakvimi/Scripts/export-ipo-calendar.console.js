/*
 * Canlı halka-arz-takvimi sayfasını masaüstü Chrome/Edge'de açın.
 * Tamamını DevTools Console'a yapıştırın, sonra "JSON ve görselleri kaydet"e tıklayın.
 * Harici kütüphane gerekmez. Kayıtlar JSON'da; dosyalar images/ altındadır.
 */
(function (window, document) {
    "use strict";
    var monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
        "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    function clean(value) { return String(value || "").replace(/\s+/g, " ").trim(); }
    function pad(value) { return String(value).padStart(2, "0"); }

    function parseDate(value) {
        var text = clean(value);
        var match = /\s+(\d{4})$/.exec(text);
        if (!match) throw new Error("Tarih yılı okunamadı: " + text);
        var year = Number(match[1]);
        var body = text.slice(0, match.index);
        var pattern = /(\d{1,2}(?:\s*[-,]\s*\d{1,2})*)\s+([A-Za-zÇĞİÖŞÜçğıöşü]+)/g;
        var parts = [];
        var remaining = body.replace(pattern, function (whole, days, monthName) {
            var month = monthNames.findIndex(function (name) {
                return name.toLocaleLowerCase("tr-TR") === monthName.toLocaleLowerCase("tr-TR");
            }) + 1;
            if (!month) throw new Error("Ay okunamadı: " + text);
            var values = days.match(/\d+/g).map(Number);
            var maxDay = new Date(year, month, 0).getDate();
            if (values.some(function (day) { return day < 1 || day > maxDay; })) {
                throw new Error("Geçersiz gün: " + text);
            }
            if (parts.length && month < parts[parts.length - 1].month) {
                throw new Error("Tarih ayları sıralı değil: " + text);
            }
            parts.push({ month: month, days: values });
            return "";
        });
        if (!parts.length || !/^[\s,\-]*$/.test(remaining)) {
            throw new Error("Tarih ayrıştırılamadı: " + text);
        }
        var allDays = [];
        parts.forEach(function (part) { allDays = allDays.concat(part.days); });
        return {
            days: allDays.join(","), month: parts[0].month, year: year,
            dateText: text, dateParts: parts,
            startDay: Math.min.apply(Math, parts[0].days)
        };
    }

    function collect(doc) {
        doc = doc || document;
        var articles = Array.prototype.slice.call(doc.querySelectorAll("article.index-list"));
        if (!articles.length) throw new Error("article.index-list bulunamadı; doğru sayfayı açın.");
        var seen = Object.create(null);
        var records = articles.map(function (article, index) {
            var titleLink = article.querySelector(".il-halka-arz-sirket a, h3 a");
            var code = clean(article.querySelector(".subTxt") && article.querySelector(".subTxt").textContent);
            var title = clean(titleLink && titleLink.textContent);
            var time = article.querySelector("time");
            var image = article.querySelector("img.slogo, img");
            var src = image && (image.getAttribute("data-src") || image.getAttribute("src"));
            if (!code || !/^[A-Za-z0-9._-]+$/.test(code) || !title || !titleLink || !src || !time) {
                throw new Error("Eksik veya geçersiz alan: article " + (index + 1));
            }
            var date = parseDate(time.textContent);
            var key = code.toUpperCase() + "|" + date.year + "|" + date.month + "|" + date.days;
            if (seen[key]) throw new Error("Tekrarlanan kayıt: " + key);
            seen[key] = true;
            var url = new URL(titleLink.getAttribute("href"), doc.baseURI);
            var imageUrl = new URL(src, doc.baseURI);
            if (!/^https?:$/.test(url.protocol) || !/^https?:$/.test(imageUrl.protocol)) {
                throw new Error("HTTP/HTTPS olmayan adres: " + code);
            }
            return {
                stockCode: code, title: title,
                days: date.days, month: date.month, year: date.year,
                imageFileName: code.toLowerCase() + "-" + date.year + "-" + pad(date.month) + "-" + pad(date.startDay),
                imageSourceUrl: imageUrl.href,
                url: /^(www\.)?yapikredi\.com\.tr$/i.test(url.hostname)
                    ? url.pathname + url.search + url.hash : url.href
            };
        });
        // Stable sort: aynı tarihli kayıtların canlı sayfadaki sırası korunur.
        return records.sort(function (a, b) {
            return b.year - a.year || b.month - a.month ||
                Number(b.days.split(",")[0]) - Number(a.days.split(",")[0]);
        });
    }

    function imageExtension(bytes) {
        if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "png";
        if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
        var text = new TextDecoder().decode(bytes.slice(0, 512));
        if (text.slice(0, 4) === "RIFF" && text.slice(8, 12) === "WEBP") return "webp";
        if (/^GIF8[79]a/.test(text)) return "gif";
        if (text.slice(4, 8) === "ftyp" && /avif|avis/.test(text.slice(8, 40))) return "avif";
        if (/<svg[\s>]/i.test(text)) return "svg";
        throw new Error("Sunucudan tanınan bir görsel gelmedi (HTML hata sayfası olabilir).");
    }
    async function toWebp(bytes) {
        var extension = imageExtension(bytes);
        // Kaynak zaten WebP ise tekrar sıkıştırma yapma.
        if (extension === "webp") return bytes;
        var mimeTypes = { png: "image/png", jpg: "image/jpeg", gif: "image/gif",
            avif: "image/avif", svg: "image/svg+xml" };
        var source = new Blob([bytes], { type: mimeTypes[extension] });
        var drawable = null;
        var objectUrl = null;
        var canvas = document.createElement("canvas");
        try {
            try {
                drawable = await createImageBitmap(source);
            } catch (error) {
                // Örneğin SVG için ImageBitmap yerine normal görsel decoder'ı.
                objectUrl = URL.createObjectURL(source);
                drawable = document.createElement("img");
                drawable.src = objectUrl;
                await drawable.decode();
            }
            canvas.width = drawable.naturalWidth || drawable.width;
            canvas.height = drawable.naturalHeight || drawable.height;
            if (!canvas.width || !canvas.height) throw new Error("Görsel ölçüleri okunamadı.");
            var context = canvas.getContext("2d");
            if (!context) throw new Error("Canvas başlatılamadı.");
            context.drawImage(drawable, 0, 0);
            var result = await new Promise(function (resolve) {
                canvas.toBlob(resolve, "image/webp", 0.95);
            });
            if (!result || result.type !== "image/webp") throw new Error("Tarayıcı WebP oluşturamadı.");
            var converted = new Uint8Array(await result.arrayBuffer());
            if (imageExtension(converted) !== "webp") throw new Error("Çıktı gerçek WebP değil.");
            return converted;
        } finally {
            if (drawable && typeof drawable.close === "function") drawable.close();
            if (objectUrl) URL.revokeObjectURL(objectUrl);
            canvas.width = canvas.height = 0;
        }
    }
    async function write(directory, name, content) {
        var file = await directory.getFileHandle(name, { create: true });
        var writable = await file.createWritable();
        await writable.write(content);
        await writable.close();
    }
    async function exportToDirectory(directory, onProgress) {
        var rows = collect(document);
        var images = await directory.getDirectoryHandle("images", { create: true });
        var progress = { next: 0, done: 0, failures: [] };
        async function worker() {
            while (progress.next < rows.length) {
                var index = progress.next++;
                var row = rows[index];
                try {
                    var response = await fetch(row.imageSourceUrl, { credentials: "same-origin" });
                    if (!response.ok) throw new Error("HTTP " + response.status);
                    var bytes = new Uint8Array(await response.arrayBuffer());
                    var webp = await toWebp(bytes);
                    row.imageFileName += ".webp";
                    await write(images, row.imageFileName, webp);
                    progress.done++;
                } catch (error) {
                    progress.failures.push({ stockCode: row.stockCode, url: row.imageSourceUrl, error: error.message });
                }
                if (onProgress) onProgress(progress.done, rows.length, progress.failures.length);
            }
        }
        await Promise.all([worker(), worker(), worker()]);
        if (progress.failures.length) {
            await write(directory, "export-errors.json", JSON.stringify(progress.failures, null, 2));
            throw new Error(progress.failures.length + " görsel indirilemedi. Hatalar export-errors.json içinde; JSON aktarımını durdurdum.");
        }
        await write(directory, "halka-arz-takvimi.json", JSON.stringify(rows, null, 2));
        await write(directory, "export-info.json", JSON.stringify({
            sourceUrl: location.href, exportedAt: new Date().toISOString(), count: rows.length,
            mediaLibrary: "YapikrediMedia", mediaFolder: "HalkaArzTakvimi", imageFormat: "webp"
        }, null, 2));
        return rows;
    }

    window.YkbIpoExport = { collect: collect, parseDate: parseDate,
        imageExtension: imageExtension, toWebp: toWebp, exportToDirectory: exportToDirectory };
    var oldPanel = document.getElementById("ykb-ipo-export-panel");
    if (oldPanel) oldPanel.remove();
    var panel = document.createElement("div");
    panel.id = "ykb-ipo-export-panel";
    panel.style.cssText = "position:fixed;right:20px;bottom:20px;z-index:2147483647;padding:16px;background:white;border:2px solid #004990;border-radius:8px;color:#004990;font:14px sans-serif;max-width:380px";
    var status = document.createElement("p");
    status.textContent = collect(document).length + " kayıt bulundu.";
    var button = document.createElement("button");
    button.type = "button";
    button.textContent = "JSON ve görselleri kaydet";
    button.style.cssText = "padding:10px;background:#004990;color:white;border:0;border-radius:4px;cursor:pointer";
    button.addEventListener("click", async function () {
        if (!window.showDirectoryPicker) {
            status.textContent = "Klasöre kayıt için masaüstü Chrome veya Edge kullanın.";
            return;
        }
        button.disabled = true;
        try {
            var directory = await window.showDirectoryPicker({ mode: "readwrite" });
            var rows = await exportToDirectory(directory, function (done, total, failures) {
                status.textContent = done + "/" + total + " görsel kaydedildi. Hata: " + failures;
            });
            status.textContent = rows.length + " kayıt ve görseller tamamlandı.";
            console.table(rows);
        } catch (error) {
            status.textContent = error.name === "AbortError" ? "Klasör seçimi iptal edildi." : error.message;
            console.error(error);
        } finally { button.disabled = false; }
    });
    panel.appendChild(status);
    panel.appendChild(button);
    document.body.appendChild(panel);
    console.log("Halka arz export hazır. Kayıt için sağ alttaki düğmeye tıklayın.");
})(window, document);
