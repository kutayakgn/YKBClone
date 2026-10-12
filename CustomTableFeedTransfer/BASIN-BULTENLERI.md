# BasinBultenleri — sunucuda filtrelenen feed

Tam dosyalar bu klasörün Application / Infrastructure / Web altındadır. Gerçek Kentico solution içinde aynı katmanlara kopyalayın; Preview/Tests dosyalarını production'a taşımayın. YKBClone CMS bağımlılıklarını içermeyen örnek projedir; buradaki aktarım kodu derlemeden hariç tutulur.

## Kentico değişiklikleri

Yeni page type oluşturmayın. Mevcut `YkbYapikredi.CustomTableFeedComponent` içindeki TableKey dropdown'una ekleyin:

```text
BasinBultenleri;Basın Bültenleri
```

Mevcut Name, Title, TableKey, PageSize alanları yeterlidir. `Pagination` checkbox'ı eklemeyin. PageSize=0 tüm filtrelenmiş kayıtları döndürür; pozitif PageSize her sayfadaki kayıt sayısıdır. Örneğin 10 girerseniz sunucudan 10 kayıt gelir. Title opsiyoneldir ve component üstüne basılır.

Mevcut custom table code name **YkbYapikredi.BasinBultenleri**. Gönderilen generated sınıfa göre alanlar:

| Code name | Tip | Kullanım |
|---|---|---|
| Title | Text | Satır başlığı |
| Date | Date and time | Tarih filtresi / dd.MM.yyyy gösterim |
| Detail | Long text | Satır açıklaması; HTML encode edilir, satır sonları korunur |
| Category | Integer | Aşağıdaki kategori kodu |
| Media | Text / media selection | Medya kütüphanesindeki PDF/DOC adresi |

Category: 4 Kredi Kartları; 5 Yapı Kredi; 9 Parakende Bankacılık; 10 Kurumsal Ve Ticari Bankacılık; 12 Sınırsız Bankacılık; 13 Özel Bankacılık; 80 Invester Relations - In The Press. Etiketler `PressReleaseCategories` içinde sabittir; Seçiniz tüm kategorileri getirir.

Media alanına iframe/HTML değil `~/getmedia/<guid>/dosya.pdf`, `/getmedia/...`, root-relative veya https URL saklayın. Salt GUID saklanıyorsa resolver mevcut Kentico sitesindeki MediaFileInfo kaydından getmedia URL oluşturur. URL'ler view'da Url.Content ile uygulama köküne göre çözülür. Kentico MVC uygulamasında media routing ve gerekli CMS.MediaLibrary/CMS.SiteProvider bağımlılıkları zaten etkin olmalıdır. Dosya/dosya izinlerini hedef sitede doğrulayın. Generated sınıfı elle değiştirmeyin.

Satırın tamamı target=_blank ile Media URL açar. PDF genelde tarayıcıda açılır; DOC dosyasını tarayıcı/Content-Disposition ayarı indirebilir. Kod yeni sekme/pencere açmayı ister; dosya gösterimini tarayıcı belirler.

## Kopyalanacak güncellenmiş dosyalar

- Infrastructure/CustomTableFeeds/CustomTableFeedSchema.cs
- Infrastructure/CustomTableFeeds/CustomTableFeedServiceCollectionExtensions.cs
- Web/Views/Shared/Components/_CustomTableFeedComponent.cshtml

Model ve mapper mevcut PageSize alanını kullanır; checkbox için değişiklik gerekmez. Eski kaynaklar ve eski JS/CSS dosyaları aynı davranışta kalır.

## Kopyalanacak yeni dosyalar

- Application/CustomTableFeeds/PressReleasesContent.cs
- Application/CustomTableFeeds/PressReleaseModels.cs
- Infrastructure/CustomTableFeeds/BasinBultenleriSource.cs
- Infrastructure/CustomTableFeeds/KenticoPressReleaseFeedService.cs
- Web/Models/PressReleaseFeedViewModel.cs
- Web/Models/PressReleaseSelectViewModel.cs
- Web/Services/PressReleaseFeedToken.cs
- Web/ViewComponents/PressReleasesViewComponent.cs
- Web/Controllers/PressReleaseFeedController.cs
- Web/Views/Shared/CustomTableFeeds/_PressReleases.cshtml
- Web/Views/Shared/CustomTableFeeds/_PressReleaseSelect.cshtml
- Web/Views/Shared/CustomTableFeeds/_PressReleaseRows.cshtml
- Web/wwwroot/js/components/press-releases.js
- Web/wwwroot/css/components/press-releases.css

## DI / route / bundle

Infrastructure DI kaydında mevcut çağrı yeterli; güncel dosya yeni source/service kaydını ekler:

```csharp
services.AddCustomTableFeeds();
```

Web Program.cs servis kayıtlarına, `builder.Build()` öncesi:

```csharp
using YkbYapikredi.Web.Services;

builder.Services.AddDataProtection();
builder.Services.AddSingleton<PressReleaseFeedToken>();
```

MapControllers yoksa middleware/controller route bölümüne, app.Run() öncesi ekleyin:

```csharp
app.MapControllers();
```

Mevcut `.Add<CustomTableFeedComponentMapper>()` kaydı korunur; yeni mapper kaydı yok. Singleton mapper'a Scoped provider bağlamayın. DynamicPage, controller, ModalReferenceCollector, layout değişmez.

Bundle CSS girdileri sırasıyla:

```text
wwwroot/css/components/custom-table-feed.css
wwwroot/css/components/press-releases.css
```

Bundle JS girdisine:

```text
wwwroot/js/components/press-releases.js
```

Mevcut `custom-table-feed.js` diğer kaynaklar için kalır. Yeni JS kendi `[data-press-feed]` köklerini başlatır; version, jQuery, Bootstrap kullanmaz. Sonradan DOM eklenirse `window.YKB.PressReleases.init()` çağrılabilir. Bundle'ı yeniden üretin.

## İşleyiş

Filtre bölümünde görsellerdeki gibi **Kategoriler**, **Tarih** dropdown'ları ve **Git** butonu bulunur. Dropdown içindeki arama sadece seçenek listesini daraltır; kayıt araması Git ile sunucuda yapılır.

- İlk açılışta raporların sahip olduğu en yeni yıl seçilir ve o yılın ilk sayfası sunucuda render edilir. Tablo boşsa Seçiniz seçilir.
- Tarih dropdown'u Seçiniz, 3 aylık ve SQL'den DISTINCT YEAR(Date) ile gelen yılları içerir. Kategoriden bağımsız olarak tablonun tüm geçerli yılları listelenir.
- Seçiniz tarih sınırlamasını kaldırır. 3 aylık, sunucunun bugünü dahil geriye üç takvim aylık aralıktır. Sunucu saat diliminin hedef siteye uygun olduğundan emin olun.
- Git: SQL WHERE Category / Date filtresi, Date DESC + ItemID DESC sıralama, SQL Page. Filtre uygulandığında sayfa 1.
- Pagination isteği son uygulanmış filtreleri kullanır. Dropdown değiştirip Git'e basılmadan sayfa değiştirirseniz mevcut listenin filtresi korunur.
- PageSize=0 ise SQL paging yoktur ve pagination basılmaz. Pozitif değer CMS'den gelen imzalı token'da saklanır; endpoint istemciden gelen ayrı bir pageSize/pagination değerine güvenmez.
- Dört ok pagination varsa görünür; ilk/sonda ilgili oklar disabled. Önceki/sonraki iki sayfa numarası gösterilir.
- AJAX yalnızca satır partial'ını getirir; URL/sayfa yenilenmez. Hızlı art arda isteklerde eski yanıt yeni sonucu ezmez. Hata durumunda önceki liste korunur.
- Info banner içeriği `_PressReleases.cshtml` içinde statiktir.
- Date boş/geçersiz veya 1900'den önce ise rapor sorguya dahil edilmez.

Endpoint: `GET /components/press-releases/rows?token=...&category=...&period=...&page=...`. Route Url.Action ile üretilir; virtual directory ile çalışır. Bu tablo public içeriktir. Multi-instance host'ta Data Protection key ring paylaşılmalı; aksi takdirde diğer instance token'ı çözemeyebilir.

## Kontrol

JS syntax ve eski feed testleri:

```sh
node --check CustomTableFeedTransfer/Web/wwwroot/js/components/press-releases.js
node CustomTableFeedTransfer/Tests/client-tests.cjs
```

Kentico olmadan gerçek client dosyalarını ve mock server yanıtlarını denemek için:

```sh
python3 CustomTableFeedTransfer/Tests/press-preview-server.py
```

Adres: http://127.0.0.1:8891/Preview/press-releases.html. Bu sunucu yalnızca önizleme/test amaçlıdır, Kentico DB testinin yerine geçmez. Hedef Kentico solution'da C#/Razor build, generated custom table kayıtları, route, media library URL ve SQL paging doğrulanmalıdır.

Kentico API: [Query Page / TotalRecords / Where](https://devnet.kentico.com/docs/13_0/api/html/T_CMS_DataEngine_ObjectQuery.htm), [MediaFileInfoProvider](https://devnet.kentico.com/docs/13_0/api/html/T_CMS_MediaLibrary_MediaFileInfoProvider.htm).

Doğrulama sonucu: Yeni JS syntax kontrolü ve eski client testleri geçti. Tarayıcıda kategori seçenek araması, Git ile 13 kayıt filtresi, ikinci sayfada kalan 3 satır, sınırda disabled oklar ve boş sonuç durumu mock endpoint ile doğrulandı; sayfa URL'si değişmedi. Bu ortamda gerçek Kentico DB ve .NET SDK olmadığından C#/Razor build ve gerçek SQL/medya uçtan uca testi çalıştırılamadı.
