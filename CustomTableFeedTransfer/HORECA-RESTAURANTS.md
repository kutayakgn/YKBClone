# HorecaRestaurants — restoran, şube ve galeri feed'i

Referans sohbetindeki tablo kullanılır: **YkbYapikredi.HorecaRestaurants**. Bu paketin Application / Infrastructure / Web dosyalarını gerçek Kentico/Clean Architecture solution'ınızda aynı katmanlara taşıyın. Tam dosya içerikleri klasördedir; Preview ve Tests gerçek projeye taşınmaz.

## 1. Custom table'ın son alanları

Mevcut yedi alanı koruyun; **Gallery** alanını Media'nın altına ekleyin. Her tablo satırı bir restoranın/şubenin kaydıdır. Galeri de bu satırın içinde saklanır; ikinci tablo veya page type yoktur.

| Field code name | Caption | Data type | Form control | Required |
|---|---|---|---|---|
| RestaurantName | Restoran adı | Text (250) | Text box | Evet |
| Address | Açık adres | Long text | Text area | Hayır |
| City | İl | Text (50) | Mevcut 81 il drop-down list | Hayır |
| PhoneNumber | Telefon | Text (250) | Text box | Hayır |
| Website | Web sitesi | Text (1000) | Text box | Hayır |
| BranchName | Şube adı | Text (250) | Text box | Hayır |
| Media | Logo | Text (1000) | Media selection | Hayır |
| **Gallery** | **Galeri görselleri** | **Long text** | **Text area / çok satırlı metin** | **Hayır** |

Gallery default boş olsun. Rich text/HTML editor veya tek dosya File alanı seçmeyin. Her satıra, CMS medya kütüphanesindeki bir görselin URL'sini yazın. Sıralama satır sırasıdır:

```text
~/getmedia/11111111-1111-1111-1111-111111111111/banyan-1.webp
~/getmedia/22222222-2222-2222-2222-222222222222/banyan-2.webp
~/getmedia/33333333-3333-3333-3333-333333333333/banyan-3.webp
```

Bunlar biçim örnekleridir; GUID ve dosya adlarını gerçek CMS linkleriyle değiştirin. `<img>`, HTML, JSON dizisi veya virgülle ayrılmış liste girmeyin. `/getmedia/...` ve https URL'ler de desteklenir. Logo Media'dan; galerinin küçük ve büyük görselleri Gallery'den gelir. Her şubenin galerisi kendi adres/telefon/web bilgisinin altında basılır. Boş Gallery alanı hiçbir galeri kutusu oluşturmaz.

Önceden hazırlanan Horeca importer yedi alanı doldurur; Gallery'yi doldurmaz. Mevcut aktarılmış satırları tekrar import etmeyin; CMS'den Gallery değerlerini ekleyebilirsiniz. Gallery opsiyonel olduğundan mevcut importer'ın değiştirilmesi gerekmez. Generated custom table sınıfını elle değiştirmeyin; isterseniz CMS'den tekrar generate edin. Yeni mapper alanları GetValue ile okur.

## 2. CustomTableFeedComponent ayarı

Mevcut TableKey drop-down listesine ekleyin:

```text
HorecaRestaurants;Otel ve restoran indirimleri
```

Name, Title, TableKey ve PageSize alanları aynen kullanılır. Title opsiyoneldir. PageSize=0 seçili sekmedeki bütün restoran satırlarını gösterir; pozitif sayı o sayıda restoranı gösterir. Örneğin Ali Ocakbaşı'nın dört şubesi varsa bunlar tek restoran satırıdır ve tek pagination kaydı sayılır. Sekme değişiminde aktif sayfa 1 olur.

Bu feed, ilk üç custom table feed gibi istemci tarafında filtreleme/pagination yapar. Seçilen tablonun kayıtları ilk istekte okunur; sekme/sayfa değişiminde URL ve tüm sayfa yenilenmez, SQL/AJAX isteği oluşmaz. Yeni controller, ViewComponent veya token servisi gerekmez.

## 3. Yeni dosyalar — tam halleri pakette

- Application/CustomTableFeeds/HorecaRestaurantsContent.cs — content modeli, sabit sekmeler, restoran ve şube modelleri.
- Infrastructure/CustomTableFeeds/HorecaRestaurantMapper.cs — custom table alanlarını eşler, sekme belirler ve aynı isimli restoranın şubelerini gruplar.
- Infrastructure/CustomTableFeeds/HorecaRestaurantsSource.cs — tabloyu okur ve mapper'ı çağırır.
- Web/Views/Shared/CustomTableFeeds/_HorecaRestaurants.cshtml
- Web/wwwroot/js/components/horeca-restaurants.js
- Web/wwwroot/css/components/horeca-restaurants.css

HorecaRestaurantMapper, TreeNode alan IComponentMapper değildir; custom table satırlarını modele dönüştürür. Page type'ınız için mevcut CustomTableFeedComponentMapper aynen kullanılır. Model/mapper/view aynı Clean Architecture ayrımını korur.

## 4. Değişen dosyalar — son halleri pakette

- Infrastructure/CustomTableFeeds/CustomTableFeedSchema.cs — HorecaRestaurants class code name.
- Infrastructure/CustomTableFeeds/CustomTableFeedServiceCollectionExtensions.cs — source/mapper DI kayıtları.
- Web/wwwroot/js/components/custom-table-feed.js — daha sonra register edilen feed handler'larını destekler ve hazır olma olayı yayınlar.

Schema sabiti `YkbYapikredi.HorecaRestaurants` olmalıdır; SQL tablo adını veya display name'i yazmayın. Gerçek code name farklıysa bu sabiti güncelleyin.

Mevcut çağrı yeterli:

```csharp
services.AddCustomTableFeeds();
```

Yeni source ve mapper, güncellenmiş extension içinde singleton olarak kaydedilir. Ayrı bir component mapper manifestosu kaydı yoktur. CustomTableFeedComponentModel, CustomTableFeedComponentMapper, ana _CustomTableFeedComponent.cshtml, DynamicPage ve layout değiştirilmez.

## 5. Bundle girdileri

Mevcut CSS bundle'da aşağıdaki sıra olsun:

```text
wwwroot/css/components/custom-table-feed.css
wwwroot/css/components/horeca-restaurants.css
```

JS bundle'a şunları ekleyin / güncel sürümlerini kopyalayın:

```text
wwwroot/js/components/custom-table-feed.js
wwwroot/js/components/horeca-restaurants.js
```

Bundle'ı yeniden üretip güncel dosyayı tarayıcıda yükleyin. Kod iki yükleme sırasını da destekler; önerilen sıra yukarıdaki gibidir. Dosyalar tekrar yüklenirse event handler'ları tekrar bağlanmaz. version, Bootstrap veya jQuery bağımlılığı yoktur.

Console kontrolü:

```javascript
typeof window.YKB?.CustomTableFeeds
typeof window.YKB?.HorecaRestaurants
```

İkisi de object dönmeli. Sonradan DOM eklenirse `window.YKB.CustomTableFeeds.init()` çağrılabilir.

## 6. Sekmeler / gruplama

Sekmeler sabittir: İstanbul, İzmir, Ankara, Urla, Çeşme, Bodrum, Antalya, Kapadokya, Ayvalık, Fethiye, Marmaris, Diğer. İstanbul her zaman varsayılan seçilidir; boşsa boş sonuç mesajı görünür. Diğer şehirler Diğer altında yer alır.

Tabloda İlçe/sekme alanı olmadığından aşağıdaki eşleme kullanılır:

- City=İzmir: Address veya BranchName içinde Urla varsa Urla, Çeşme varsa Çeşme; diğerleri İzmir.
- City=Muğla: Address/BranchName'deki Bodrum, Fethiye veya Marmaris adı ilgili sekmeyi belirler; bulunmazsa Diğer.
- City=Balıkesir: Ayvalık geçenler Ayvalık, diğerleri Diğer.
- City=Nevşehir: Kapadokya. Kayseri/Aksaray/Niğde kayıtlarında açıkça Kapadokya geçerse Kapadokya.
- İstanbul/Ankara/Antalya doğrudan kendi sekmesine gider.
- City boşsa Address/BranchName içindeki sekme adları aranır; sonuç bulunmazsa Diğer.

Restoran adından şehir tahmini yapılmaz. City il dropdown'unda 81 il olarak kalır. İlçe adının adres/şube metninde olmadığı durumda kod onu kendiliğinden bilemez; doğru sekme için bu metinleri CMS'de doğru doldurun. Bu kurallar `HorecaRestaurantMapper.Tab` içinde tek yerdedir.

Aynı normalize restoran adı + aynı sekme tek satır oluşturur; o sekmeye ait şubeler gösterilir. Aynı marka başka sekmede de varsa orada ayrıca görünür. Kayıt/şube sırası ItemID'dir; aynı restoranın ilk dolu Media değeri logo olarak kullanılır. Yinelenen import kayıtları silinmez; CMS'deki duplicate satırlar şube listesinde de bulunur.

## 7. Şube / galeri davranışı

Tek kayıtlı restoranın bilgileri doğrudan görünür. Bir sekmede aynı restoranın birden fazla kaydı varsa Şubeler butonu gelir; ilk durumda kapalıdır. Açma/kapama CSS grid transition ile yapılır; sabit max-height sınırı yoktur. Her restoran bağımsız açılır. Sekme değişimi şubeleri kapatır. Reduced motion tercihinde animasyon kapalıdır.

Galeri küçük görselleri satırın altında gösterilir. Tıklama native dialog içinde büyük görseli açar; önceki/sonraki butonları ve sağ/sol oklar ile gezinilebilir. Kapat düğmesi, Escape veya dış alan tıklaması kapatır. Kapatınca odak küçük görsele döner. Galeri dialog'u body altında bir kez oluşturulur; root/container transform'ları altında kalmaz. Görseller aynı restoran/şube galerisi içinde gezilir.

Üstteki indirim açıklaması view içinde statiktir; CMS alanı eklenmez. Ekran daraldığında adres, şubeler ve galeriler logo/başlık satırının altına geçer. Preview'daki logolar ve galeri görselleri örnek SVG'lerdir; gerçek uygulamada CMS URL'leri kullanılır.

### Tüm görsellerin açılışta yüklenmesi ve yalnızca hataların tekrar denenmesi

Logo ve galeri görselleri ilk HTML içinde doğrudan **`src` + `loading="eager"`** ile gelir. Gizli şehirler, diğer sayfalardaki restoranlar ve kapalı şubelerin galeri görselleri de sayfa açılışında yüklenmeye başlar. Viewport/scroll observer, JavaScript yükleme kuyruğu, eşzamanlılık sınırı ve saniyelik başlangıç gecikmesi kaldırılmıştır. Ağ zamanlamasını tarayıcı yönetir; yüklemenin tamamlanma süresi ağ ve sunucu yanıtına bağlıdır. Lightbox aynı galeri URL'sini kullanır; dosyanın tekrar ağdan çekilip çekilmeyeceğini normal tarayıcı/cache politikası belirler.

JavaScript yalnızca **hata alan** veya script kurulmadan önce hata almış görselleri izler:

```js
var retryDelays = [60000, 120000, 240000];
```

- Başarısız görsel için 60 saniye sonra ilk, tekrar hata alırsa 120 saniye sonra ikinci, yine hata alırsa 240 saniye sonra üçüncü ek deneme yapılır. Bu süreler her başarısız denemeden sonradır. Son hata konsolda URL ile raporlanır; sonsuz tekrar yoktur.
- Her denemeden hemen önce `complete` ve `naturalWidth` kontrol edilir. Görsel zaten başarılıysa veya halen yükleniyorsa `src` tekrar atanmaz. Bir görselin hatası diğer görselleri durdurmaz.
- `load` olayı bekleyen denemeyi iptal eder. Kaynak URL değişmiş, görsel DOM'dan kaldırılmış veya lightbox kapanmışsa eski URL tekrar yüklenmez.
- Hata olayları non-bubbling olduğu için capture ile dinlenir. Başlangıç taraması `complete && naturalWidth === 0` durumuyla daha önce gerçekleşmiş hataları da yakalar. Gizli sekmelerdeki ve kapalı şubelerdeki başarısız görseller de tekrar denenir.
- Başarılı görseller sekme/sayfa değişiminde yeniden atanmaz. Kaynak URL/query string değiştirilmez; rastgele cache parametresi yoktur.

Canlı siteden bildirilen HTTP 429 sunucu hız sınırını gösterir. Native `<img>` error olayı status ve `Retry-After` başlığını açığa çıkarmadığından kod bu hatayı diğer görsel hatalarından ayıramaz. Yukarıdaki süreler varsayılandır; gerçek sunucu bekleme süresi değildir. Tüm görsellerin ilk açılışta istenmesi sunucunun toplam istek kotasına tekrar takılabilir. Böyle bir durumda medya cache'i ve uygulama/IIS/proxy/CDN katmanındaki medya trafik politikası da düzenlenmelidir; istemci retry mekanizması sunucu kotasını kaldırmaz.

Gerçek projede `_HorecaRestaurants.cshtml` ve `horeca-restaurants.js` dosyalarını birlikte güncelleyin; JS bundle kullanıyorsanız yeniden oluşturun. Yeni view `data-horeca-src` kullanmaz. Ortak `custom-table-feed.js` içindeki render olayı hata kontrol taramasını tekrar çağırabilir; ilk kurulumda da tarama yapıldığı için ilk yükleme bu olaya bağımlı değildir. CMS verisini tekrar import etmeyin.

Kaynaklar: [img yükleme davranışı](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img), [HTMLImageElement.complete](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/complete), [HTTP 429](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/429).

## 8. Doğrulama

```sh
node --check CustomTableFeedTransfer/Web/wwwroot/js/components/horeca-restaurants.js
node CustomTableFeedTransfer/Tests/horeca-client-tests.cjs
node CustomTableFeedTransfer/Tests/horeca-image-tests.cjs
```

Client testi jsdom gerektirir (bu makinede /tmp/ykb-export-check/node_modules altında mevcut). Gerekirse ayrı test ortamına jsdom kurun; MVC uygulaması için npm bağımlılığı gerekmez. Testler İstanbul varsayılanı, restaurant bazlı pagination, PageSize=0, bağımsız feed'ler, şube toggle/inert, boş sekme, sayfa sıfırlama, galeri gezinmesi/odak dönüşü, tekrar yükleme ve iki bundle sırası için geçti. Native dialog ve şubeler tarayıcı önizlemesinde de kontrol edildi. C# syntax parser kontrolü geçti; bu ortamda gerçek Kentico DLL/DB ve .NET SDK bulunmadığından C#/Razor build doğrulanamadı.

Yerel önizleme: Preview/horeca-restaurants.html. Gerçek JS/CSS dosyalarını kullanır; örnek veriler içerir.

Görsel testi, jsdom ile native load/error olaylarını, complete/naturalWidth değerlerini ve timer'ları simüle eder: ilk HTML'de bütün görsel URL'leri ve eager özelliği, başarılı/pending görsellere dokunulmaması, yalnızca başarısızlar için üç kontrollü retry, kaynak URL koruması, eski URL/DOM koruması, galeri gezinmesi/kapanışı ve iki bundle sırası doğrulanır. Canlı Kentico medya HTTP yanıtlarını veya gerçek tarayıcı ağ davranışını test etmez.
