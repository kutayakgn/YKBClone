# Varlık dağılım önerileri: tarayıcı konsolu ve Kentico aktarımı

İki bağımsız dosya kullanılır. Kurulum veya ZIP gerekmez:

- Deponun kökündeki **`scripts/download-yapikredi-asset-allocation-browser.js`**: Chrome/Edge tarayıcı konsolu içindir.
- **`Web/Controllers/AssetAllocationRecommendationsImportController.cs`**: gerçek **Kentico Xperience 13 ASP.NET Core** Web projenize kopyalanır.

Generated `AllAssetAllocationRecommendationsItem` sınıfı değiştirilmez. Hedef sınıf **`YkbYapikredi.AllAssetAllocationRecommendations`** ve alanlar **Date**, **BulletinType**, **Pdf** olarak aynen kullanılır.

## 1. Tarayıcı konsolunda indirme

1. Masaüstü Chrome/Edge'de [Varlık Dağılım Önerileri](https://www.yapikredi.com.tr/yapi-kredi-hakkinda/piyasa-bulteni/varlik-dagilimi-bulteni/) sayfasını açın.
2. F12 → Console alanına JS dosyasının **tamamını** yapıştırıp Enter'a basın. Çalışma bağlamı ana sayfa (`top`) olmalı.
3. Sayfaya eklenen **Klasör seç ve indir** düğmesine basın. Bir üst klasör seçip yazma izni verin.
4. Sayfayı açık tutun. İlerleme panelde/konsolda görünür; gerekirse **Durdur** düğmesini kullanın.

Scriptin konsola yapıştırılması yalnızca paneli kurar; gerçek düğmeye basmadan klasör seçimi veya dosya indirme başlamaz.

```text
ykb-varlik-dagilim-onerileri/
  reports.json          # Controller'a vereceğiniz manifest
  errors.json           # Listeleme ve dosya hataları
  reports.resume.json   # Yardımcı devam önbelleği
  reports/              # PDF veya DOCX dosyaları
```

Aynı üst klasörü veya doğrudan mevcut `ykb-varlik-dagilim-onerileri` klasörünü seçerek tekrar çalıştırabilirsiniz.

Servise gönderilen istek tam olarak verilen tarih sınırlarını kullanır:

```text
POST https://www.yapikredi.com.tr/yapi-kredi-hakkinda/piyasa-bulteni/varlik-dagilimi-bulteni/default.aspx/LoadAssetAllocationReleases
```

```json
{
  "pageIndex": 1,
  "dateFrom": "2024-01-01T00:00:00+03:00",
  "dateTo": "2026-12-31T23:59:59+03:00",
  "type": "Any"
}
```

Tarih aralığı iki gün dahil **01.01.2024–31.12.2026**. Başlangıç `2024-01-01T00:00:00+03:00`, bitiş `2026-12-31T23:59:59+03:00` olarak korunur; bitiş tarihi ertesi günle değiştirilmez.

30.10.2026 tarihinde yalnızca liste cevapları okunarak **4 sayfa, 10 + 10 + 10 + 4 = 34 kayıt** doğrulandı. Dosya bağlantılarına GET gönderilmedi. Script sayfalamayı HTML cevabından okur; istenen aktif sayfayı, tekrarları, sayfa sayısının değişmesini ve sonunda ilk sayfanın aynı kalmasını kontrol eder. Kaynak daha sonra değişip sayı 34'ten ayrılırsa uyarı verir; sayıyı tutturmak için kayıt silmez veya üretmez. Kaynaktaki bütün eşzamanlı değişiklikleri yakalama garantisi yoktur.

## Dosya adları, hatalar ve tekrar çalıştırma

- Dosya adları Türkçe karakterler ASCII'ye çevrilerek **uzantı dahil en fazla 50 karakter** yapılır. Tarih ve deterministik hash eki çakışmayı önler.
- Tarih ve `Aylık` gibi bülten tipi değerlerinin özgün metni JSON'da korunur.
- Uzantısız `/medium/file/.../view` bağlantıları desteklenir. Gerçek PDF/DOCX içeriği denetlenir; HTML hata sayfaları veya desteklenmeyen dosyalar hata raporuna girer. Eski `.doc` desteklenmez.
- Aynı anda en fazla dört dosya işlenir. Zaman aşımı, geçici sunucu hatası ve ağ kesintileri için yeniden deneme vardır. Çevrimdışı bağlantı algılandığında beklenir; kalıcı hatalar raporlanır.
- Her çalıştırmada kaynak liste yeniden taranır ve JSON baştan oluşturulur. Mevcut sağlam dosyalar tekrar indirilmez; yalnızca eksik/bozuk olanlar indirilir.
- Eski JSON silinmiş/bozulmuş olsa da deterministik isimlerden mevcut belgeler bulunur. Eski hash varsa karşılaştırılır; yoksa dosya yapısı doğrulanıp yeni yerel hash hesaplanır. Bu, sunucudaki dosyanın sonradan değişmediğini kanıtlamaz.
- JSON yazıları sırayla ve aralıklı yapılır. Durdur, aktif istekleri iptal edip işçileri ve son metadata kaydını bekler. JSON'a henüz yazılmamış tamamlanmış dosya sonraki çalıştırmada yeniden bulunabilir.

Tekrar çalıştırırken dosyaları silmeyin ve aynı klasörü seçin. Eski script hâlâ çalışıyorsa önce Durdur'u kullanın veya sayfayı yenileyip yeni kodu yapıştırın. Aynı klasöre iki sekmeden aynı anda yazmayın. Durum: `window.ykbAssetAllocationExport`; durdurma: `window.ykbAssetAllocationExport.stop()`.

## 2. Kentico medya klasörü

Varsayılan hedef:

```text
/YkbYapikredi/media/YapikrediMedia/VarlikDagilimOnerileri
```

`reports/` klasörünün **içindeki dosyaları** bu medya klasörüne taşıyın. Araya `reports` klasörü eklemeyin; adları ve içerikleri değiştirmeyin. JSON'u herkese açık medya klasörüne koymanız gerekmez.

Controller başındaki ayarlar:

```csharp
private const string MediaPhysicalFolder = "";
private const string MediaVirtualFolder = "/YkbYapikredi/media/YapikrediMedia/VarlikDagilimOnerileri";
```

Farklı medya klasörü kullanacaksanız sanal URL'yi değiştirin. Fiziksel ayar boşsa controller URL'nin uygulamaya göre kalan yolunu WebRootPath ve ContentRootPath altında kontrol eder. Tek mevcut aday kullanılır; iki aday da varsa veya hiçbiri yoksa rastgele seçim yapılmaz. GET ve ön kontroldeki **YolTeshisi** alanı kökleri, PathBase'i, adayları ve seçilen tam disk yolunu gösterir.

Dosyalar ayrı CMS/IIS uygulamasındaysa tam fiziksel yolu açıkça yazın. Örnek (kendi yolunuzla değiştirin):

```csharp
private const string MediaPhysicalFolder = @"D:\KenticoCMS\YkbYapikredi\media\YapikrediMedia\VarlikDagilimOnerileri";
```

Bu sabite URL değil, controller'ın çalıştığı makineden erişilen disk/UNC yolu yazılır. Web sunucusunun aynı dosyaları yapılandırılan URL'den sunduğunu örnek bir dosyayla kontrol edin. Controller dosya indirmez/kopyalamaz veya CMS medya kaydı oluşturmaz; `Pdf` alanına doğrudan dosya URL'si yazar. Medya veritabanı kaydı zorunlu değildir.

## 3. Controller ile aktarım

1. Controller'ı gerçek Kentico 13 **ASP.NET Core** Web projenizin Controllers klasörüne kopyalayın. Gerekirse namespace'i uyarlayın; generated sınıfa dokunmayın.
2. CMS bağlantılı uygulamayı Development ortamında localhost'ta çalıştırın.
3. `/local-tools/asset-allocation-recommendations-import` adresini açın.
4. Tam indirme çıktısının **reports.json** dosyasını seçip **Ön kontrol** yapın.
5. Alanları, URL'leri ve sayaçları kontrol edin. Hata yoksa aynı JSON ile **Veritabanına aktar** düğmesini kullanın.
6. CMS kayıtlarını ve dosya bağlantılarını kontrol edin. İşlem tamamlanınca geçici controller'ı kaldırın.

Standart MVC/antiforgery servisleri ve attribute controller route eşlemesi gerekir; gerekiyorsa `app.MapControllers()` veya projenizin karşılığını ekleyin. GET/ön kontrol kayıt eklemez. Development ve localhost dışındaki erişimler 404 alır.

| JSON | Kentico alanı / kullanım |
|---|---|
| `records[].date` | `Date`, `yyyy-MM-dd` |
| `records[].bulletinType` | `BulletinType` |
| `records[].fileName` | Medya klasöründe birebir eşleşir; URL üretilerek `Pdf` alanına yazılır |
| `records[].sha256`, `byteLength` | Dosyanın içerik/boyut doğrulaması |
| `records[].sourceUrl`, `sourcePage` | Kaynak ve hata takibi |
| `records[].status`, `error` | `downloaded`/`failed`/kesintide `pending`, hata açıklaması |

Manifestin sınıfı, kaynağı ve tam tarih sınırları doğrulanır. Tam listeleme zorunludur. Başarısız indirmeler varsayılan olarak aktarımı engeller; formda açıkça seçilirse yalnızca `failed` satırlar atlanır. Başarılı görünen bir dosya eksikse veya boyut/hash farklıysa bu atlama seçeneği hatayı gizlemez; hiçbir satır yazılmaz. `pending` tamamlanmış dosya sayılmaz.

Mevcut **Date + BulletinType + Pdf** eşleşmeleri tekrar eklenmez. Aynı gün ve tipte farklı dosyalar ayrı tutulur. Mevcut kayıtlar güncellenmez/silinmez. Ekleme tek CMSTransactionScope içindedir; DB hatasında geri alınır. Kentico event handler'larının harici yan etkileri SQL transaction kapsamında değildir. Aynı anda tek uygulama sürecinden aktarın.

## Doğrulama sınırı

Kaynak liste servisi ve verilen HTML cevabı incelendi; PDF/DOCX indirme başlatılmadı. Tarayıcı scriptinin 16 otomatik kontrolü geçti: kaydedilmiş gerçek dört sayfadan 34 kaydı okuma, tam tarih payload'ı, tarih sınırları, PDF/DOCX doğrulama, dosya adı/hash, JSON'suz kurtarma, dört paralel indirme, JSON yazma sırası ve durdurma bunlara dahildir. Testlerde DOM/klasör seçici ve ağ benzetimleri kullanıldı; gerçek dosya seçici açılmadı.

Controller ASP.NET Core 8 ve küçük CMS API stub'larıyla derlendi; 35 davranış kontrolü geçti. Bu depoda gerçek Kentico DLL/veritabanı bulunmadığından hedef CMS entegrasyonu kendi çözümünüzde doğrulanmalıdır.

Kaynaklar: [Varlık Dağılım Önerileri](https://www.yapikredi.com.tr/yapi-kredi-hakkinda/piyasa-bulteni/varlik-dagilimi-bulteni/), [Kentico custom table API](https://docs.kentico.com/13api/content-management/custom-table-data), [Chrome File System Access API](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access).
