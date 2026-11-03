# Piyasa bültenleri karşılaştırması ve yerel temizlik

Kaynak: https://www.yapikredi.com.tr/yapi-kredi-hakkinda/piyasa-bulteni/

Kaynak, 3 Kasım 2026 saat 11:44 (Türkiye saati) itibarıyla başlangıç/bitiş filtresi olmadan tarandı. `default.aspx/LoadMarketReleases` servisine `dateFrom: null`, `dateTo: null`, `type: "Any"` gönderildi. 313 sayfanın tamamı okundu, etkin sayfalar ve tekrarlar kontrol edildi; bitişte ilk sayfa yeniden doğrulandı. Rapor belgeleri indirilmedi.

| Ölçüm | Satır sayısı |
| --- | ---: |
| Paylaşılan beş parçada bulunan custom table kayıtları | 3.516 |
| Kaynak sitedeki raporlar | 3.122 |
| Tarih + bülten tipi kaynakta hiç bulunmayan mevcut kayıtlar | **443** |
| Bu 443 satır silinince mevcut listede kalacak kayıtlar | **3.073** |
| Kaynakta bulunup mevcut listede eksik olan rapor adedi | **49** |

Karşılaştırma yalnız tarih ve bülten tipi üzerinden yapılır. Paylaşılan listelerde `ItemID` ve `Pdf` alanları yoktur; gerçek silinecek satır kimliklerini, dosya adlarını ve fiziksel dosya sayısını controller yerel veritabanından okur. Kaynakta bulunan bir tarih/tip çiftinin bütün mevcut satırları korunur.

Kaynakta da aynı tarih ve tipte iki ayrı belge bulunabilmektedir. Mevcut listedeki 11 ikili gruptan dokuzu kaynakta da ikilidir ve korunur. `20.02.2020 / Günlük` ve `20.11.2020 / Günlük` çiftlerinin her birindeki iki satır kaynakta yoktur; bu dört satır 443 sayısına dahildir. Kaynaktaki 11 `Aylık` kayıt da korunur. Eksik 49 rapor bu temizlik işlemiyle eklenmez.

Fazla kayıtlar 04.11.2014–10.05.2021 aralığındadır; tümü `Günlük` tipindedir:

| Yıl | Fazla satır |
| --- | ---: |
| 2014 | 4 |
| 2015 | 19 |
| 2016 | 2 |
| 2018 | 1 |
| 2019 | 107 |
| 2020 | 221 |
| 2021 | 89 |

Dosyalar:

- `extras.csv`: Kaynakta olmayan tarih/tip çiftlerinin tamamı ve mevcut listedeki adetleri.
- `comparison.json`: Girdi kanıtları, adetler ve karşılaştırmanın ayrıntıları.
- `source-snapshot.json`: Controller'a seçilecek doğrulanmış kaynak listesi. `reports.json` veya `comparison.json` yerine bu dosya kullanılmalıdır.
- `report.md`: Ayrıntılı bulgular ve mükerrer/eksik kayıt açıklamaları.
- `../Web/Controllers/DailyMarketBulletinsCleanupController.cs`: Gerçek Kentico Xperience 13 ASP.NET Core web projesine kopyalanacak controller.

`source-snapshot.json` SHA-256 değeri:

```text
a01ba358be73143b0841e3536c088830a5134b3221973de8219dfb42c7ade3f6
```

Controller hem özgün dosyanın hash'ini hem de UTF-8 BOM kaldırılıp satır sonları LF'ye çevrilmiş hash'i doğrular. Windows/Linux satır sonu ve UTF-8 BOM farkları kabul edilir; kayıtlar veya başka içerik değişmişse dosya reddedilir. Dosyayı yeniden biçimlendirmeyin. LF biçiminin SHA-256 değeri `a296439b5be0c4f04cc7ecebdaad44c3484c5238b97889638df397b77fcba86e` olur. Yanıttaki `SourceSha256` yüklenen dosyanın ham hash'i, `SourceNormalizedSha256` ise normalize edilmiş hash'tir.

Eksik/yanlış kaynak listesiyle silme yapılmaz. Kaynak görüntüsü varsayılan olarak 48 saat geçerlidir; daha sonra kaynak yeniden taranmalı ve controller'daki `SnapshotSha256` ile `SnapshotNormalizedSha256` sabitleri yeni doğrulanmış dosyaya göre birlikte güncellenmelidir. Kaynaktaki en yeni tarihten sonraki tablo kayıtları ayrıca korunur. Ön kontrolde hata varsa `PlanToken` üretilmez; `Durum` ve `Hatalar` alanları engeli gösterir.

## Kullanım

1. Controller dosyasını gerçek Kentico web projesinin `Controllers` klasörüne kopyalayın. Önceki indirme/import controller'larını değiştirmeyin.
2. `MediaVirtualFolder` varsayılanı `/YkbYapikredi/media/YapikrediMedia/GunlukTumPiyasaBultenleri` yoludur. `MediaPhysicalFolder` boşsa controller `WebRootPath` ve `ContentRootPath` adaylarını denetler; tek bir mevcut klasör bulmalıdır. Dosyalar ayrı CMS uygulamasındaysa bu sabite gerçek tam disk yolunu girin.
3. Kentico uygulamasını CMS bağlantısıyla, `Development` ortamında ve localhost üzerinde çalıştırın. `/local-tools/daily-market-bulletins-cleanup` adresini açın.
4. `source-snapshot.json` dosyasını seçip **Ön kontrol** çalıştırın. Silinecek gerçek `ItemID`, tarih/tip, PDF bağlantısı ve fiziksel dosya planını inceleyin. Ön kontrol tablo veya rapor dosyalarını değiştirmez.
5. Ön kontrol yanıtındaki **`PlanToken` değerinin tamamını** kopyalayın. Forma geri dönün; aynı kaynak JSON'u seçin, token alanına bu değeri yapıştırın ve **Planı uygula: fazla kayıtları sil** düğmesine basın. Token 30 dakika geçerlidir; tablo, dosyalar veya plan değişmişse yeni ön kontrol gerekir.
6. Sonuçta bildirilen yedek klasörünü ve işlem günlüğünü saklayın. İşlem tamamlandıktan sonra geçici controller'ı projeden kaldırın.

Controller, fazladan satırları Kentico API üzerinden siler. İlgili dosyaları ortak referansları kontrol ettikten sonra **genel medya klasöründen çıkarıp özel yedek klasörüne taşır**; kalıcı olarak yok etmez. Böylece dosyalar eski medya URL'sinden sunulmaz ve işlem kaydıyla geri alınabilir durumda kalır. Yedek yolu varsayılan olarak uygulamanın `App_Data/DailyMarketBulletinsCleanup` alanındadır; gerekiyorsa controller'daki yedek fiziksel klasör ayarı değiştirilir. Yedek klasörü public medya/WebRoot dışında ve medya ile aynı disk bölümünde olmalıdır.

Silinecek bir satırın dosyasını tabloda kalacak başka bir satır da kullanıyorsa satır silinir, ortak dosya korunur. Fiziksel dosya zaten yoksa durum raporlanarak tablo satırı temizlenebilir. Başka URL biçimlerinden kaynaklanan belirsiz referanslar varsa dosya koruması uygulanır. Dosya yolları yetkili medya klasörüyle sınırlıdır; klasör genelinde eşleşmeyen dosya taraması/silmesi yapılmaz.

Uygulama, ön kontrol planını SQL tablo kilidi altında yeniden doğrular; dosya taşıma adımlarını ve satır bilgilerini işlem günlüğüne kaydeder. Commit öncesi bir hata olursa veritabanı geri alınır ve taşınan dosyalar geri konmaya çalışılır. Commit sonucunun belirsiz kaldığı veya dosyanın geri taşınamadığı bir hata açıkça raporlanır; bu durumda yedek ve günlük korunur. Bu mekanizma SQL ve dosya sistemini tek bir atomik işlem haline getirmez.

Bu çalışma sırasında gerçek Kentico tablosunda veya mevcut medya klasörünüzde silme/taşıma yapılmamıştır.

Controller ASP.NET Core 8 ve CMS API benzetimleriyle derlendi; 48 davranış kontrolü geçti. Gerçek beş girdinin 3.516 satırıyla yapılan salt okunur plan testi 443 aday ve 3.073 korunacak satır verdi. Özgün/LF/CRLF/UTF-8 BOM biçimlerinde token üretimi ve içerik değişikliklerinin reddi de doğrulandı. Dosya taşıma, ortak dosya koruması, eski/değişmiş planın reddi ve hata sonrası kurtarma testleri yalnız test klasöründeki sentetik dosyalarla yapıldı. Gerçek Kentico DLL/veritabanı bu çalışma ortamında bulunmadığından hedef uygulamadaki ön kontrol yine gereklidir.

API başvuruları: [Kentico custom table kayıtları](https://docs.kentico.com/13api/content-management/custom-table-data), [CMSTransactionScope](https://devnet.kentico.com/docs/13_0/api/html/T_CMS_DataEngine_CMSTransactionScope.htm).
