# Tüm piyasa bültenlerini indirme ve Kentico'ya aktarma

Kullanılacak iki kod dosyası:

- `scripts/download-yapikredi-bulletins-browser.js`
- `DailyMarketBulletinsTransfer/Web/Controllers/DailyMarketBulletinsImportController.cs`

Kaynak: https://www.yapikredi.com.tr/yapi-kredi-hakkinda/piyasa-bulteni/

Tablo: `YkbYapikredi.DailyAllMarketBullettins`. Alanlar: `Date`, `BulletinType`, `Pdf`.
Medya klasörü: `/YkbYapikredi/media/YapikrediMedia/GunlukTumPiyasaBultenleri`.

## Tarayıcıdan indirme

1. Kaynak sayfayı masaüstü Chrome/Edge'de açın.
2. F12 → Console → ana sayfa bağlamında JS dosyasının tamamını yapıştırıp çalıştırın. Paket veya terminal kurulumu gerekmez.
3. Sayfaya eklenen **Klasör seç ve indir** düğmesine basın. İlk indirme için yeni/boş bir üst klasör seçin.
4. `ykb-tum-piyasa-bultenleri` arşivi oluşturulur. Sekmeyi açık tutun; tamamlanmasını bekleyin.

API: `default.aspx/LoadMarketReleases`. İstek: `{pageIndex, dateFrom:null, dateTo:null, type:"Any"}`. Tarih ve bülten tipi sınırı yoktur. Tüm sayfalar gerçek pagination'a göre okunur; sayfa/kayıt sayısı sabitlenmez. 3 Kasım 2026 kontrolünde kaynak 313 sayfadır. Aynı gün ve tipte farklı belgeler ayrı kayıt olarak korunur.

Çıktılar:

- `reports/`: PDF/DOCX dosyaları.
- **`reports.json`: Controller'a seçilecek güncel manifest.**
- `errors.json`: Listeleme ve indirme hataları.
- `reports.resume.json`: Yardımcı devam önbelleği.

Dosya adları Türkçe karakterlerden ASCII'ye çevrilir; uzantı dahil en fazla 50 karakterdir. Kayıt kimliğinden türetilen hash eki farklı belgeleri ayırır. Dosya türü gerçek PDF/DOCX içeriğinden doğrulanır. Aynı anda en fazla dört dosya indirilir.

Bağlantı koparsa veya işlem durursa aynı kodu tekrar çalıştırıp aynı arşivi/üst klasörü seçin. Arşivin adı değiştirilmişse içindeki `reports` klasöründen tanınır. JSON'da `pending`/`failed` görünse veya JSON eksik olsa bile sağlam mevcut belgeler yeniden indirilmez. Kaynak liste her çalıştırmada baştan yenilenir; önce tüm yerel dosyalar kontrol edilip durumları kaydedilir, sonra yalnız eksik/bozuk belgeler indirilir.

Doğrudan `reports` klasörü seçilirse güncel JSON dosyaları da PDF'lerin yanına yazılır; controller'a oradaki son `reports.json` seçilir. İşlem çalışıyorsa yeni kodu yapıştırmadan önce Durdur ile bitirin. Aynı klasöre iki sekmeden eşzamanlı yazmayın.

## Dosyaları taşıma ve import

1. İndirilen `reports/` klasörünün **içindeki dosyaları**, adlarını ve içeriklerini değiştirmeden doğrudan `/YkbYapikredi/media/YapikrediMedia/GunlukTumPiyasaBultenleri/` klasörüne taşıyın. Araya `reports` alt klasörü eklemeyin.
2. Controller dosyasını gerçek **Kentico Xperience 13 ASP.NET Core** web projenizin `Controllers` klasörüne kopyalayın. Aynı sınıfın eski kopyası varsa bu dosyayla değiştirin. Generated custom table sınıfını değiştirmeyin.
3. Uygulamayı CMS bağlantısıyla **Development** ortamında localhost'ta çalıştırın.
4. `/local-tools/daily-market-bulletins-import` adresini açın.
5. İndirme çıktısındaki **reports.json** dosyasını seçip **Ön kontrol** yapın.
6. Eşleşmeler doğruysa forma geri dönüp aynı JSON ile **Veritabanına aktar** düğmesini kullanın. Bu import akışında PlanToken istenmez.

JSON formdan seçilir; herkese açık medya klasörüne konulması gerekmez. `source-snapshot.json`, `errors.json` veya `reports.resume.json` import dosyası değildir.

Eşleştirme: `records[].date → Date`, `bulletinType → BulletinType`, `fileName → medya dosyası URL'si → Pdf`. DOCX bağlantısı da string `Pdf` alanına yazılır. Aynı `Date + BulletinType + Pdf` zaten varsa tekrar eklenmez; aynı gün/tipte farklı belgeler ayrı kalır. Ekleme CMS transaction içinde yapılır; veritabanı hatasında geri alınır.

Controller dosya adı, boyut ve SHA-256 eşleşmesini kontrol eder. JSON'un LF/CRLF satır sonları ve UTF-8 BOM biçimi desteklenir. Manifestin tamamı için sabit hash veya süre sınırı yoktur; belgelerin hash'leri gerçek dosyaların içeriğinden doğrulanır.

Listelemenin tam olması zorunludur. `pending` kayıtlar, eksik/bozuk başarılı dosyalar veya metadata uyuşmazlığı varsa hiçbir satır yazılmaz. Başarısız indirmeler de varsayılan olarak aktarımı durdurur. Eksiksiz aktarım için aynı arşivde indirmeyi tekrar çalıştırıp hataları giderin. Formdaki açık atlama seçeneği yalnız `status=failed` satırlarını dışarıda bırakır ve atlanan adedi raporlar.

`MediaPhysicalFolder` boşsa `WebRootPath` ve `ContentRootPath` altındaki medya yolu denetlenir; tek bir mevcut aday seçilir. GET ekranı ve hata yanıtları gerçek disk yollarını gösterir. Dosyalar ayrı CMS uygulamasındaysa bu sabite controller'ın çalıştığı makineden erişilen tam fiziksel klasör yolunu girin. URL yerine gerçek Windows disk yolu kullanılmalıdır.

Controller manuel taşıdığınız belgelere doğrudan URL yazar. Bu klasörün web sunucusu tarafından sunulması gerekir; CMS medya veritabanı kaydı oluşturmaz. MVC controller attribute route'ları uygulamada eşlenmiş olmalıdır.

## Doğrulama

22 browser VM testi geçti. Kaydedilmiş gerçek 313 liste sayfasının 3.122 raporu, 11 Aylık kayıt ve 15 meşru tekrarlanan tarih/tip çifti korundu. Kurtarma, PDF/DOCX, dört paralel işçi, JSON yazma sırası ve durdurma da doğrulandı. Belge yanıtları ve dosya sistemi testte benzetildi; gerçek raporlar indirilmedi.

Controller ASP.NET Core 8 + CMS API benzetimleriyle derlendi; 45 kontrol geçti. Ön kontrol/insert/tekrar eklememe, aynı tarih/tip farklı belge, LF/CRLF/BOM manifest, dosya/hash/yol denetimi ve transaction hataları doğrulandı. Gerçek Kentico veritabanına aktarım çalıştırılmadı.

Kaynaklar: [Kentico custom table API](https://docs.kentico.com/13api/content-management/custom-table-data), [Chrome File System Access API](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access).
