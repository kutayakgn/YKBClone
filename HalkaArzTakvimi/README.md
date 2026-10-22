# Halka Arz Takvimi — Kentico 13 CustomTableFeed

Kaynak: https://www.yapikredi.com.tr/bireysel-bankacilik/yatirim-urunleri/hisse-senetleri/halka-arz-takvimi

Canlı sayfa 22.10.2026 tarihinde incelendi: 2026–2023 yıllarında 107 adet `article.index-list` kaydı var. Script her çalıştırıldığında o anki bütün article kayıtlarını okur; kayıt sayısı sabitlenmez. Kaynaktaki kod, şirket adı, URL ve görsel adresleri değiştirilmez. Kaynakta hatalı olabilecek kod/URL eşleşmeleri otomatik tahminle düzeltilmez.

## 1. Dosyaları kopyalama

Bu klasördeki Application, Infrastructure ve Web altındaki dosyaları gerçek Kentico çözümünüzde aynı katmanlara kopyalayın. Scripts, Export, Tests, Preview ve Integration klasörleri yardımcı dosyalardır; Web projesine kaynak kod olarak eklenmez. Bu repo Kentico çözümü olmadığından transfer klasörü demo uygulamanın derlemesinden hariç tutulur.

Mevcut CustomTableFeed altyapısındaki şu dosyalar kullanılır ve değiştirilmez: `CustomTableFeedComponentModel`, `CustomTableFeedComponentMapper`, `_CustomTableFeedComponent.cshtml`, `ICustomTableFeedContent`, `ICustomTableFeedSource`, `CustomTableFeedProvider`, `KenticoCustomTableReader`, `FeedUrls`, `custom-table-feed.js`, `custom-table-feed.css`.

Yeni satır mapper'ı `IpoCalendarMapper` custom table kayıtlarını dönüştürür. `IComponentMapper` TreeNode içindir; mevcut `CustomTableFeedComponentMapper` zaten bu görevi yapar, bu feed için ikinci bir page type/mapper gerekmez.

## 2. Custom table

Custom table display name: **Halka Arz Takvimi**

Class code name: **YkbYapikredi.IpoCalendar**. SQL tablosunun otomatik adını kodda kullanmayın.

| Alan | Kentico veri tipi | Kontrol / değer | Zorunlu |
| --- | --- | --- | --- |
| `StockCode` | Text, 50 | Text box, ör. NETGL | Evet |
| `Title` | Text, 1000 | Text box / Text area | Evet |
| `Days` | Text, 100 | Text box, ör. `9 10 11` | Evet |
| `Month` | Integer number | Drop-down list, aşağıdaki değerler | Evet |
| `Year` | Integer number | Text box, ör. 2026; 1900–9999 | Evet |
| `Image` | Text, 1000 | Media selection, kalıcı medya URL'si saklar | Evet |
| `Url` | Text, 2000 | Text box / URL selector | Evet |

`ItemID` ve Kentico'nun standart alanları otomatik oluşturulur. Generated sınıfları elle düzenlemeyin; bu dosyalar GetValue/SetValue kullanır.

Month seçenekleri:

```text
1;Ocak
2;Şubat
3;Mart
4;Nisan
5;Mayıs
6;Haziran
7;Temmuz
8;Ağustos
9;Eylül
10;Ekim
11;Kasım
12;Aralık
```

**DateText alanı oluşturmayın.** Importer ve mapper bu alanı okumaz/yazmaz. Önceden açtıysanız kodun çalışması için gerekli değildir. Application modelindeki `DisplayDate`, mapper'ın Days/Month/Year'dan hesapladığı gösterim değeridir; CMS alanı değildir.

`Month` ve `Year` başlangıç ayı/yılıdır. `Days` günleri **kronolojik sırada**, boşlukla ayırarak girin. Gün numarası küçüldüğünde takip eden aya geçilir; Aralık'tan sonra yıl da artırılır. Günler sıralanmaz; giriş sırası ay geçişini belirler.

| Days | Month | Year | Üretilen gösterim |
| --- | --- | --- | --- |
| `9 10 11` | 9 | 2026 | `9-10-11 Eylül 2026` |
| `29 30 1` | 6 | 2026 | `29-30 Haziran - 1 Temmuz 2026` |
| `30 2 3` | 4 | 2024 | `30 Nisan - 2-3 Mayıs 2024` |
| `28 29 1` | 2 | 2024 | `28-29 Şubat - 1 Mart 2024` |
| `30 31 1` | 12 | 2026 | `30-31 Aralık 2026 - 1 Ocak 2027` |

Bu sözleşme ardışık aylara yayılan kayıtları destekler; arada boş ay atlanmasını yalnızca gün numaralarıyla ifade etmek mümkün değildir. Canlıdaki sekiz ay geçişli kayıt ardışık aylardadır. Tekrarlanan gün ve ay için geçersiz gün numarası ön kontrolde reddedilir. `29-31` bir gün listesi olarak korunur; aradaki `30` otomatik eklenmez.

## 3. JSON ve görselleri export

`Export/halka-arz-takvimi.json` ve `Export/images/` içinde 22.10.2026 canlı export'u hazırdır: 107 kayıt ve 107 JPEG görsel. İsterseniz bunları doğrudan kullanabilirsiniz. Daha güncel çıktı için aşağıdaki scripti yeniden çalıştırın. Gerçek dosya/JSON eşleşmeleri `Tests/live-export-verification.json` dosyasında raporlanır.

1. Kaynak URL'yi masaüstü Chrome veya Edge'de açın.
2. `Scripts/export-ipo-calendar.console.js` dosyasının tamamını DevTools Console'a yapıştırın.
3. Sağ alttaki **JSON ve görselleri kaydet** düğmesine tıklayın, boş bir çıktı klasörü seçin.
4. Sonuç: `halka-arz-takvimi.json`, `export-info.json` ve `images/` içindeki görseller.

Script görsel uzantısını URL'den tahmin etmez; dosya içeriğinden PNG/JPEG/WebP/GIF/AVIF/SVG olarak belirler. Medya indirme başarısızsa `export-errors.json` yazar ve yeni import JSON'u üretmez. Başarılı export bitmeden import yapmayın. Aynı hedefte eski bir JSON varsa yeniden export başarısız olduğunda eski dosyayı yanlışlıkla kullanmayın.

JSON örneği:

```json
[
  {
    "stockCode": "NETGL",
    "title": "Net Global Endüstriyel Yatırımlar Anonim Şirketi",
    "days": "9,10,11",
    "month": 9,
    "year": 2026,
    "imageFileName": "netgl-2026-09-09.jpg",
    "imageSourceUrl": "https://www.yapikredi.com.tr/medium/file/netglbl_72894/view?webPScale=2x",
    "url": "https://www.yapikredi.com.tr/bireysel-bankacilik/yatirim-urunleri/hisse-senetleri/net-global-halka-arz"
  }
]
```

Gerçek uzantı indirilen dosyaya göre belirlenir; farklı tarayıcıda sunucu farklı görsel formatı döndürebilir. `imageSourceUrl` export bilgisi olarak JSON'da kalır; ayrı CMS alanı gerekmez. JSON kayıtlarında da DateText/dateParts yoktur. Eski JSON'daki ek dateText/dateParts özellikleri varsa importer onları kullanmaz; gösterim her durumda Days/Month/Year'dan hesaplanır.

## 4. Medya yükleme ve tek seferlik import

1. İlgili sitenin Media libraries uygulamasında **code name'i** `YapikrediMedia` olan kütüphaneyi kullanın.
2. İçinde `HalkaArzTakvimi` klasörü oluşturun.
3. Export edilen `images/` klasöründeki dosyaları **adlarını değiştirmeden** bu klasöre Kentico Media libraries arayüzünden yükleyin.

Dosyaları yalnız diskte `/YapikrediMedia/HalkaArzTakvimi` altına kopyalamak yeterli değildir; Kentico'nun MediaFile kayıtları da olmalıdır. Importer kütüphanenin code name'i, klasör yolu ve dosya adıyla tekil eşleştirme yapar. Kütüphane içindeki FilePath `HalkaArzTakvimi/netgl-2026-09-09.webp` biçimindedir; başına tekrar YapikrediMedia eklenmez.

4. `Web/Controllers/IpoCalendarImportController.cs` dosyasını ekleyin ve local uygulamayı Development ortamında başlatın.
5. Local adresinizde **GET `/local-tools/ipo-calendar-import`** açın.
6. Site code name'i kontrol edin, `halka-arz-takvimi.json` seçin ve **Ön kontrol** yapın.
7. Errors boşsa geri dönüp aynı dosyayla **Aktar / Güncelle** yapın.

Controller yalnız loopback IP + Development üzerinde çalışır. GET kayıt yazmaz, POST antiforgery doğrulamalıdır. Eksik alan, geçersiz tarih, eksik/tekrarlanan medya veya mükerrer kayıt varsa hiçbir kayıt yazmaz. Bütün yazımlar tek transaction içindedir. Kentico DB işlemleri sıralıdır.

`StockCode + Year + Month + Days` aynıysa günceller; aynı JSON'u yeniden çalıştırmak satırları çoğaltmaz. Tarihi/anahtarı değişen bir kayıt yeni kayıt sayılır. JSON'da olmayan eski satırlar silinmez. Tek seferlik aktarım tamamlanınca bu geçici controller dosyasını hedef projeden kaldırabilirsiniz.

Image alanına ham GUID veya tahmini fiziksel yol değil, `MediaFileURLProvider` ile üretilen kalıcı `/getmedia/...` bağlantısı yazılır; böylece medya kayıtları başka ortama taşındığında ad eşleştirmesi tekrar gerekmez.

Staging/export sırasında custom table kayıtlarıyla birlikte ilişkili MediaFile kayıtlarını ve fiziksel medya dosyalarını da hedef ortama taşıyın; yalnız tablo satırlarını taşımak görselleri taşımaz.

## 5. Mevcut CustomTableFeedComponent'e bağlama

Mevcut TableKey dropdown seçeneklerine şu satırı ekleyin:

```text
IpoCalendar;Halka Arz Takvimi
```

Mevcut DI kaydının ardından (aynı AddCustomTableFeeds çağrısını ikinci kez eklemeyin):

```csharp
using YkbYapikredi.Infrastructure.CustomTableFeeds;

services.AddCustomTableFeeds(); // zaten mevcut
services.AddIpoCalendarFeed();  // yeni
```

Program.cs builder kullanıyorsa aynı çağrıyı builder.Services üzerinden yapın. Yeni mapper/source stateless singleton'dır; scoped bağımlılık tüketmez ve mevcut provider lifetime'ını değiştirmez.

JS bundle'a mevcut `js/components/custom-table-feed.js` sonrasına **`js/components/ipo-calendar.js`** ekleyin. CSS bundle'a mevcut `css/components/custom-table-feed.css` sonrasına **`css/components/ipo-calendar.css`** ekleyin. Sayfalara ayrıca script/link veya DynamicPage özel durumu eklemeyin.

Component node'unda TableKey=IpoCalendar, Title=`Halka Arz Listesi`, PageSize=0 veya pozitif sayı seçin. Yıl başlıkları otomatik üretilir.

PageSize=0 tüm kayıtları gösterir. Pozitif değer, yıl sayısını değil toplam kayıt sayısını sınırlar. Yeni yıldan eski yıla, her yıl içinde başlangıç ay/gününe göre yeniden eskiye sıralanır; eşit tarihte ItemID kaynak sırasını korur. Sayfa sınırı bir yılı ikiye bölüyorsa ilgili yıl başlığı her iki sayfada da görünür. O sayfada kaydı olmayan yılların başlığı gizlenir.

Filtre olmadığı için gizli, boş bir `data-ct-filters` formu ortak API sözleşmesini sağlar. Pagination/görünür kayıtlar mevcut ortak CustomTableFeed JS'i tarafından yönetilir; yeni JS yalnız yıl başlıklarını senkronize eden handler kaydeder. URL veya tüm sayfa yenilenmez. Bu, mevcut altyapıdaki istemci pagination'ıdır; her sayfa tıklamasında DB sorgusu yoktur.

## Görünüm

Canlıdaki article/div/p/h3/time yapısı ve sınıfları korunur. Canlıdan ölçülen değerler: Ubuntu, yıl başlığı 22px/500, kod 16px, şirket adı 20px, tarih 13px; logo 60px ve 45px border-radius; içerik sol boşluğu 15px; satır üst boşluğu 12px. Sayfa üst başlığı ve breadcrumb mevcut DynamicPage tarafından üretilir.

Ubuntu fontunun hedef sitenizde yüklü olması gerekir; projenizdeki mevcut font bundle'ını kullanın. CSS ekstra dış font isteği eklemez. Şirket adları dar ekranlarda satır kırar; row sırası değişmez. CSS yalnız ipo-calendar feed'ine scope edilir; diğer feed'leri değiştirmez.

## Test ve sınırlar

JavaScript syntax kontrolü ve browser testleri Tests altında bulunur. Canlı HTML ile export parser'ı, ay geçişleri, dosya/JSON eşleşmesi, PageSize=0/pozitif, yıl sınırı, oklar ve çoklu component senaryoları kontrol edilir. Gerçek Kentico DB'sine burada erişim olmadığı için controller importu ve C#/Razor derlemesi hedef projede Ön kontrol ile doğrulanmalıdır.

Saf C# tarih helper'ı için Kentico bağımlılığı olmayan .NET 8 test projesi eklendi:

```sh
dotnet run --project HalkaArzTakvimi/Tests/DateFormatting/DateFormatting.csproj
```

Bu ortamda .NET SDK bulunmadığından bu C# testi burada çalıştırılamadı. Test, gerçek Application helper dosyasını derler; 107 kaynak kaydı ile geçersiz gün, artık yıl ve yıl geçişini kontrol eder. `Tests/source-date-cases.json` eski kaynak tarih metinlerini yalnız test beklentisi olarak tutar; production model/import bu dosyayı veya metinleri kullanmaz.

`Preview/index.html` ve masaüstü/mobil ekran görüntüleri hazırdır. Önizleme CSS/JS'inin vendor altındaki ortak feed kopyaları yalnız önizleme içindir; bunlarla hedef projedeki ortak dosyaları değiştirmeyin. Önizlemeyi yerel HTTP sunucusuyla açın; Ubuntu için canlı sitedeki Google Fonts bağlantısını kullanır. Testler Playwright ve Chrome/Chromium bulunan ortamda `node HalkaArzTakvimi/Tests/browser-tests.cjs` ile çalışır.

API referansları: [Kentico 13 custom table örnekleri](https://docs.kentico.com/13api/content-management/custom-table-data), [Kentico 13 MediaFileURLProvider](https://devnet.kentico.com/docs/13_0/api/html/Methods_T_CMS_MediaLibrary_MediaFileURLProvider.htm).
