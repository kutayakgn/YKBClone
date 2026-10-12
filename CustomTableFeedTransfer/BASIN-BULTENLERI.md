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

## Önceki sürümden kaldırılacak dosyalar ve kayıtlar

Aşağıdaki üç dosya artık pakette yoktur; hedef projeden de kaldırın:

- Web/ViewComponents/PressReleasesViewComponent.cs
- Web/Services/PressReleaseFeedToken.cs
- Web/Models/PressReleaseFeedViewModel.cs

Program.cs içinden `builder.Services.AddSingleton<PressReleaseFeedToken>();` kaydını ve yalnızca bu sınıf için eklenen `using YkbYapikredi.Web.Services;` satırını kaldırın. Yeni bir Web token/servis kaydı gerekmez. Başka özelliklerin kullandığı Data Protection ayarlarını değiştirmeyin.

## Güncellenmiş dosyalar — son halleri pakette

- Application/CustomTableFeeds/ICustomTableFeedSource.cs
- Application/CustomTableFeeds/ICustomTableFeedProvider.cs
- Application/CustomTableFeeds/ICustomTableFeedContent.cs
- Application/CustomTableFeeds/PressReleasesContent.cs
- Infrastructure/Components/Mappers/CustomTableFeedComponentMapper.cs
- Infrastructure/CustomTableFeeds/CustomTableFeedProvider.cs
- Infrastructure/CustomTableFeeds/BasinBultenleriSource.cs
- Web/Controllers/PressReleaseFeedController.cs
- Web/Views/Shared/Components/_CustomTableFeedComponent.cshtml
- Web/Views/Shared/CustomTableFeeds/_PressReleases.cshtml
- Web/wwwroot/js/components/custom-table-feed.js
- Web/wwwroot/js/components/press-releases.js

Provider artık PageSize'ı source'a geçirir. Eski kaynaklar default interface metodu sayesinde kendi Load() metodunu aynen kullanır; ContractedProjects ve iki eski bülten source'u değiştirilmez. PressReleasesContent ilk ekranın Years, Period, PageSize ve Result verilerini taşır. Source bu modeli hazırlayıp ViewName üzerinden normal partial render sağlar. Ana view'da BasinBultenleri veya herhangi bir somut model türüne özel kontrol yoktur. UsesClientFiltering yalnızca genel client/server davranış sözleşmesidir; eski modeller için varsayılan true'dur.

## Korunacak diğer dosyalar

- Application/CustomTableFeeds/PressReleaseModels.cs
- Infrastructure/CustomTableFeeds/CustomTableFeedSchema.cs
- Infrastructure/CustomTableFeeds/CustomTableFeedServiceCollectionExtensions.cs
- Infrastructure/CustomTableFeeds/KenticoPressReleaseFeedService.cs
- Web/Models/PressReleaseSelectViewModel.cs
- Web/Views/Shared/CustomTableFeeds/_PressReleaseSelect.cshtml
- Web/Views/Shared/CustomTableFeeds/_PressReleaseRows.cshtml
- Web/wwwroot/css/components/press-releases.css

PressReleaseSelectViewModel yalnızca ortak dropdown partial'ının modelidir. Web altında Services veya ViewComponents dosyası yoktur. Application'daki IPressReleaseFeedService ve Infrastructure'daki uygulaması SQL sorgularının MVC içine taşınmaması için korunur.

## DI / route / bundle

Infrastructure DI kaydındaki mevcut çağrı yeterlidir:

```csharp
services.AddCustomTableFeeds();
```

MapControllers yoksa middleware/controller route bölümüne, app.Run() öncesi ekleyin:

```csharp
app.MapControllers();
```

Mevcut `.Add<CustomTableFeedComponentMapper>()` kaydı korunur; yeni mapper veya Web servis kaydı yoktur. Singleton mapper'a Scoped provider bağlamayın. DynamicPage, controller, ModalReferenceCollector, layout değişmez.

Bundle CSS girdileri sırasıyla:

```text
wwwroot/css/components/custom-table-feed.css
wwwroot/css/components/press-releases.css
```

Bundle JS girdileri:

```text
wwwroot/js/components/custom-table-feed.js
wwwroot/js/components/press-releases.js
```

İki JS'in son halini kopyalayıp bundle'ı yeniden oluşturun. Genel feed JS'i server mode köklerini başlatmaz. Basın bültenleri JS'i kendi `[data-press-feed]` köklerini başlatır; version, jQuery, Bootstrap kullanmaz. Sonradan DOM eklenirse `window.YKB.PressReleases.init()` çağrılabilir.

## İşleyiş

Filtre bölümünde görsellerdeki gibi **Kategoriler**, **Tarih** dropdown'ları ve **Git** butonu bulunur. Dropdown içindeki arama sadece seçenek listesini daraltır; kayıt araması Git ile sunucuda yapılır.

- İlk açılışta raporların sahip olduğu en yeni yıl seçilir ve o yılın ilk sayfası sunucuda render edilir. Tablo boşsa Seçiniz seçilir.
- Tarih dropdown'u Seçiniz, 3 aylık ve SQL'den DISTINCT YEAR(Date) ile gelen yılları içerir. Kategoriden bağımsız olarak tablonun tüm geçerli yılları listelenir.
- Seçiniz tarih sınırlamasını kaldırır. 3 aylık, sunucunun bugünü dahil geriye üç takvim aylık aralıktır. Sunucu saat diliminin hedef siteye uygun olduğundan emin olun.
- Git: SQL WHERE Category / Date filtresi, Date DESC + ItemID DESC sıralama, SQL Page. Filtre uygulandığında sayfa 1.
- Pagination isteği son uygulanmış filtreleri kullanır. Dropdown değiştirip Git'e basılmadan sayfa değiştirirseniz mevcut listenin filtresi korunur.
- PageSize=0 ise SQL paging yoktur ve pagination basılmaz. Pozitif PageSize source tarafından ilk sorguya uygulanır ve partial üzerindeki data-page-size ile AJAX isteklerine taşınır. Bu public içerik endpoint'i category/period/page/pageSize parametrelerini doğrular; token yoktur.
- Dört ok pagination varsa görünür; ilk/sonda ilgili oklar disabled. Önceki/sonraki iki sayfa numarası gösterilir.
- AJAX yalnızca satır partial'ını getirir; URL/sayfa yenilenmez. Hızlı art arda isteklerde eski yanıt yeni sonucu ezmez. Hata durumunda önceki liste korunur.
- Info banner içeriği `_PressReleases.cshtml` içinde statiktir.
- Date boş/geçersiz veya 1900'den önce ise rapor sorguya dahil edilmez.

Endpoint: `GET /components/press-releases/rows?category=...&period=...&page=...&pageSize=...`. Route Url.Action ile üretilir; virtual directory ile çalışır. Bu tablo public içeriktir. İlk render source içinde hazırlanır; sonraki isteklerde aynı SQL sorgu uygulamasını AJAX controller kullanır. MVC içinde veritabanı sorgusu yoktur.

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
