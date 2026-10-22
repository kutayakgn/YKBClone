# Fon Rehberi aktarım ve component paketi

Canlı kaynak: https://www.yapikredi.com.tr/bireysel-bankacilik/yatirim-urunleri/yatirim-fonlari/fon-rehberi

2020–2026 arasındaki yedi yıl, sitenin yıl seçimi + Göster formu üzerinden tek tek sorgulandı. Canlı satır sırası korunur. Aynı fonun farklı raporları tekilleştirilmez.

| Yıl | Kayıt / belge |
|---|---:|
| 2026 | 9 |
| 2025 | 424 |
| 2024 | 252 |
| 2023 | 342 |
| 2022 | 317 |
| 2021 | 255 |
| 2020 | 239 |
| Toplam | 1838 |

Canlı kaynak bu aktarımda bütün belgeleri PDF olarak döndürdü. Dosya baytları PDF imzasıyla doğrulandı; uzantı değiştirilerek belge dönüştürülmedi. Import ve component PDF, DOC/DOCX, XLS/XLSX, PPT/PPTX medya bağlantılarını destekler. Dosya adları ASCII'dir, uzantı dahil 50 karakteri geçmez; kaynak URL hash'i aynı isimli farklı belgelerin çakışmasını önler. İndirilen 1838 dosyanın toplam boyutu yaklaşık 1.04 GiB.

## 1. Kentico custom table tanımları

İki tabloyu da oluşturun ve live site için etkinleştirin. Kentico'nun standart ItemID, ItemGUID vb. sistem alanlarını koruyun. Aşağıdaki **kod adlarını** aynen kullanın. İsterseniz kod adlarını yalnızca `Infrastructure/CustomTableFeeds/FundGuideSchema.cs` içinde değiştirin.

### 2026 ve sonrası

Görünen ad: **Fon Rehberi — 2026 ve sonrası**

Class name: **YkbYapikredi.FundGuideMonthly**

| Field | Kentico veri tipi | Zorunlu | Kontrol / değer |
|---|---|---|---|
| Year | Integer number | Evet | Text box; en az 2026 |
| Month | Integer number | Evet | 1–12; isterseniz ay dropdown'ı |
| Title | Text (1000) | Evet | Text box; örn. Eylül 2026 |
| FileName | Text (50) | Evet | Text box; indirilmiş dosyanın uzantılı adı |
| FileUrl | Text (2000) | Evet | Media selection; belge URL'sini saklayan kontrol |

JSON: `Export/2026-ve-sonrasi/fund-guides.json`

Belgeler: `Export/2026-ve-sonrasi/files/`

Örnek:

```json
{
  "year": 2026,
  "month": 9,
  "title": "Eylül 2026",
  "fileName": "eylul-f05fbff93d1d.pdf"
}
```

### 2026 öncesi

Görünen ad: **Fon Rehberi — 2026 öncesi**

Class name: **YkbYapikredi.FundGuideLegacy**

| Field | Kentico veri tipi | Zorunlu | Kontrol / değer |
|---|---|---|---|
| FundCode | Text (100) | Evet | Text box; örn. YFCKL / CKL |
| FundName | Text (2000) | Evet | Text box |
| Year | Integer number | Evet | 1900–2025 |
| FileName | Text (50) | Evet | Text box; indirilmiş dosyanın uzantılı adı |
| FileUrl | Text (2000) | Evet | Media selection; belge URL'sini saklayan kontrol |

JSON: `Export/2026-oncesi/fund-guides.json`

Belgeler: `Export/2026-oncesi/files/`

Örnek:

```json
{
  "fundCode": "YFCKL / CKL",
  "fundName": "Yapı Kredi Portföy Çoklu Varlık Değişken Fon",
  "fileName": "yfckl-ckl-20caf1271f58.pdf",
  "year": 2025
}
```

Özel sıralama alanı yoktur. 2026 ve sonrasındaki kayıtlar `Year DESC, Month DESC, ItemID ASC` ile sıralanır. 2026 öncesinde seçilen yılın kayıtları `ItemID ASC` ile, mevcut eklenme sırasıyla gösterilir. İlk import JSON dizisinin sırasıyla satır eklediği için canlıdaki sıra korunur. Var olan kayıtların tekrar aktarımı ItemID değerlerini değiştirmez.

Fon kodu tekil değildir: aynı fonun farklı raporları korunur. Import anahtarı `Year + FileName` olur. Aynı JSON tekrar aktarılırsa satır çoğaltılmaz. Güncel pakette iki custom table'da da `SortOrder` alanı oluşturmayın; daha önce oluşturduysanız alanı CMS üzerinden kaldırabilirsiniz. Mevcut kayıtları silip yeniden eklemeniz gerekmez.

## 2. Medya klasörü ve belgeler

Kentico Media libraries içindeki **code name'i YapikrediMedia olan** kütüphanede **FundGuide** klasörü açın.

Her iki `files` klasörünün **içindeki belgeleri**, isimlerini değiştirmeden bu tek klasöre yükleyin. `2026-oncesi` / `2026-ve-sonrasi` alt klasörlerini medya içinde oluşturmayın. Son yerleşim:

```text
YapikrediMedia/
  FundGuide/
    eylul-f05fbff93d1d.pdf
    agustos-2026-fon-rehberi-150a0472b695.pdf
    yfckl-ckl-20caf1271f58.pdf
    ...
```

Yalnızca dosya sistemine kopyalamak yeterli değildir: dosyaların Kentico Media library kayıtları da oluşmalıdır. Kentico'nun yükleme/import işlemini kullanın. Controller `FilePath` klasörü ve dosya adını eşleştirir; bulunamayan ya da birden fazla eşleşen dosyayı hata raporuna yazar.

Medya kütüphane kodu ve klasör farklıysa `FundGuideSchema.cs` içindeki `LibraryCodeName` / `MediaFolder` değerlerini düzenleyin.

## 3. Projeye kopyalanacak dosyalar

`Application/`, `Infrastructure/`, `Web/` klasörlerinin içeriklerini çözümünüzde aynı isimli katmanlara taşıyın. Namespace'ler mevcut `YkbYapikredi` çözümüne uygundur.

```text
Application/CustomTableFeeds/FundGuideContent.cs
Infrastructure/CustomTableFeeds/FundGuideSchema.cs
Infrastructure/CustomTableFeeds/FundGuideMapper.cs
Infrastructure/CustomTableFeeds/FundGuideSource.cs
Infrastructure/CustomTableFeeds/FundGuideServiceCollectionExtensions.cs
Web/Controllers/FundGuideImportController.cs          [geçici]
Web/Views/Shared/CustomTableFeeds/_FundGuide.cshtml
Web/wwwroot/css/components/fund-guide.css
Web/wwwroot/js/components/fund-guide.js
```

`Export`, `Tests`, `Scripts`, `Preview` hedef web uygulamasına taşınmaz. Bu repodaki `YKBClone.csproj` transfer dosyalarını demo uygulamanın derlemesinden hariç tutar; bu csproj değişikliğini Kentico çözümünüze taşımayın.

Mevcut paketinizdeki şu ortak parçalar kullanılır; tekrar eklemeyin / üzerlerine yazmayın:

- `ICustomTableFeedContent`, `ICustomTableFeedSource`, `ICustomTableFeedProvider`
- `KenticoCustomTableReader`, `FeedUrls`, `CustomTableFeedProvider`
- `CustomTableFeedComponentModel`, `CustomTableFeedComponentMapper`
- `_CustomTableFeedComponent.cshtml`
- `custom-table-feed.js` / `custom-table-feed.css`

Bu parçaların repodaki referansları `../CustomTableFeedTransfer` altındadır. Kaynak kayıt API'si `window.YKB.CustomTableFeeds.register(kind, factory)` ve `ykb:customtablefeed-rendered` olayı mevcut olmalıdır; aynı ortak yapı HalkaArzTakvimi tarafından da kullanılır.

## 4. DI ve bundle kayıtları

Mevcut `services.AddCustomTableFeeds()` çağrısından sonra:

```csharp
using YkbYapikredi.Infrastructure.CustomTableFeeds;

services.AddCustomTableFeeds(); // Mevcut çağrıyı tekrar eklemeyin.
services.AddFundGuideFeed();
```

Minimal hosting kullanıyorsanız aynı yeri `builder.Services.AddFundGuideFeed()` olarak ekleyin. Yeni kaynak singleton'dır ve scoped bağımlılığı yoktur; mevcut singleton component mapper yapısıyla çalışır.

CSS bundle'ınıza **custom-table-feed.css sonrasına**:

```csharp
"css/components/fund-guide.css"
```

JS bundle'ınıza **custom-table-feed.js sonrasına**:

```csharp
"js/components/fund-guide.js"
```

Mevcut shared dosyalar bundle'a zaten ekliyse birer kez kalmalıdır. Yeni JS'de sürüm değişkeni yoktur; tekrarlanan init event listener'ları çoğaltmaz. Canlıdaki Ubuntu fontunu mevcut global font dosyanız sağlar.

## 5. JSON aktarımı

1. İki custom table'ı oluşturun, tüm belgeleri Kentico medyasına yükleyin.
2. `FundGuideImportController.cs` dosyasını Web/Controllers'a ekleyin. Ayrı servis kaydı gerekmez.
3. Uygulamayı localhost üzerinde **Development** ortamında çalıştırın. Mevcut MVC attribute route desteği kullanılmalıdır.
4. **`/local-tools/fund-guide-import`** adresini açın.
5. Site code name'i kontrol edin. “2026 ve sonrası” grubunu seçip ilgili JSON'u yükleyin. “Ön kontrol” ile eksik alan/medya olmadığını kontrol edin; ardından formdan “Aktar / Güncelle” işlemini yapın.
6. Aynı işlemi “2026 öncesi” ve diğer JSON için tekrarlayın.
7. `Applied: true`, beklenen `Total`, boş `Errors` değerlerini doğrulayın. Sonrasında controller dosyasını kaldırabilirsiniz; schema/mapper/source dosyaları kalır.

GET kayıt yazmaz. POST antiforgery korumalıdır; yalnızca loopback + Development ortamında çalışır. Hatalı bir kayıt varsa o dosyanın tüm aktarımı durur. Her JSON aktarımı kendi transaction'ında uygulanır; iki JSON ayrı işlemdir. Başarısız ön kontrol hiçbir kayıt yazmaz. Aynı anahtarlı mevcut satırlar güncellenir; başka satırlar silinmez.

`FileUrl`, Kentico'nun GUID içeren kalıcı medya URL'sidir; domain kaydedilmez. Medya kayıtlarını GUID'leriyle ve custom table verilerini staging üzerinden birlikte taşıyın. Böylece hedef ortam kendi domaininde aynı site içi medya bağlantısını açar. Componentte bütün belge linkleri `target="_blank" rel="noopener noreferrer"` kullanır.

## 6. Sayfaya ekleme

Mevcut **CustomTableFeedComponent** PageType'ının kaynak seçimi dropdown'ındaki `TableKey` seçeneklerine ekleyin:

```text
FundGuide;Fon Rehberi
```

Bu tek seçenek iki custom table'ı birlikte okur. Sayfaya CustomTableFeedComponent ekleyip `TableKey = FundGuide` seçin. `Title` isteğe bağlıdır. Görseldeki gibi yalnızca filtre ve tablo için Title boş bırakılabilir.

`PageSize = 0`: seçilen yılın bütün raporları, pagination yok.

`PageSize > 0`: seçilen yıldaki raporlar o büyüklükte sayfalanır; önceki componentlerle aynı ortak pagination kullanılır. Yıl değişip Göster'e basıldığında ilk sayfaya dönülür. Önceki/sonraki oklar ilk/son sayfalarda disabled olarak görünmeye devam eder.

Yeni PageType, IComponentMapper, controller endpoint veya layout/dynamic-page özel durumu gerekmez. Mevcut `CustomTableFeedComponentMapper`, `TableKey` üzerinden `FundGuideSource`'u çağırır; `FundGuideMapper` custom table satırlarını model haline getirir.

Yıl dropdown'ı her iki tablonun kayıtlarından türetilir; kayıt yoksa o yıl seçeneklere girmez. En yeni yıl varsayılan seçilir. Arama kutusu yalnızca yıl seçeneklerini arar. Bir yıl seçmek tabloyu hemen değiştirmez; **Göster** butonuyla uygulanır. 2026+ için tek kolon “Fon Rehberi”; 2025 ve öncesi için “Fon Kod” / “Fon Adı” çizilir. 2027 gibi gelecekteki kayıtlar da aynı ayrımla çalışır.

İki tablo ilk yüklemede sıralı iki sorguyla okunur. Ortak component mimarinizdeki gibi yıl filtresi ve pagination tarayıcıda çalışır; adres değişmez, sayfa yenilenmez, tekrar tablo sorgusu yapılmaz. Bir sayfada birden fazla FundGuide instance'ı bağımsız çalışır.

## 7. Önizleme, indirme ve kontroller

`Preview/index.html` bir statik HTTP sunucusunda açılabilir. CSS/JS doğrudan yeni dosyalardan yüklenir. `Preview/vendor` yalnızca önizleme/test için ortak script ve stilin kopyasıdır; üretimde mevcut bundle'ınızı kullanın.

Kaynak veriyi tekrar indirmek için Python 3 ve curl ile repo kökünden:

```sh
python3 FundGuide/Scripts/export-fund-guide.py
```

Exporter her yılın WebForms filtresini gönderir; site HTML'i/alan adları ileride değişirse script de güncellenmelidir. `Export/source` her yılın filtre sonucunun HTML kaydıdır. `download-manifest.json`, orijinal kaynak URL'si, dosya adı, SHA-256 ve byte uzunluğunu tutar. Kaynak domaini yalnızca bu denetim manifestinde bulunur; custom table'a yazılmaz.

Exporter testini ağ bağlantısı olmadan çalıştırmak için:

```sh
python3 FundGuide/Tests/test-exporter.py
```

Dosya bütünlüğü ve JSON doğrulama:

```sh
python3 FundGuide/Tests/verify-export.py
```

Tarayıcı testleri Node.js + Playwright + Google Chrome kullanır:

```sh
node FundGuide/Tests/browser-tests.cjs
```

11 tarayıcı kontrolü: bütün yılların satır sayısı, 2026/legacy kolonları, arama ve Göster ayrımı, pagination, filtre sonrası sayfa sıfırlama, eksik yılın seçenekte bulunmaması, boş veri, iki bağımsız component, tekrarlı init, 320/390/768/885/1200 px taşma kontrolleri ve dosya linkleri doğrulandı.

Bu repo gerçek Kentico uygulaması değildir ve yerel ortamda .NET SDK yoktur. C# / Razor dosyaları Kentico çözümünüzde derlenmeli; controller'ın gerçek veritabanına aktarımı hedef makinede ön kontrol ile doğrulanmalıdır. Burada Kentico veritabanına yazılmadı.

`FundGuide-Code.zip` yalnızca kod, iki JSON, manifest, test ve önizlemeyi içerir. 1838 belge ZIP içine ikinci kez eklenmedi; belgeler bu klasörün `Export/*/files` dizinlerinde hazırdır.
