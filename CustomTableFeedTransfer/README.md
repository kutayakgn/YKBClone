# CustomTableFeedComponent — Kentico 13 aktarım paketi

Bu klasör gerçek Kentico/Clean Architecture projesine taşınacak dosyaları içerir. YKBClone bir net10 örnek MVC projesidir; CMS bağımlılıkları yoktur. Paket dosyaları YKBClone derlemesinden hariç tutulmuştur. Gerçek proje için Application, Infrastructure ve Web altındaki dosyaları aynı katmanlara kopyalayın. Bu klasörü olduğu gibi gerçek projenin derleme köküne koymak yerine katmanlara dağıtın.

BasinBultenleri sunucu tarafı filtresi ve pagination kurulumu için [BASIN-BULTENLERI.md](BASIN-BULTENLERI.md) dosyasına bakın. Bu belgedeki istemci tarafı filtreleme açıklamaları ilk üç kaynak için geçerlidir.

## CMS page type

Code name: `YkbYapikredi.CustomTableFeedComponent`. Content-only component. DynamicPage altına ve component kabul eden container'lara eklenebilir. Alt item page type yoktur.

| Field code name | Data type / control | Required | Configuration |
|---|---|---|---|
| Name | Text / Text input | Yes | CMS node adı için Name field |
| Title | Text / Text input | No | Boşsa başlık basılmaz |
| TableKey | Text / Drop-down list | Yes | Aşağıdaki statik seçenekler |
| PageSize | Integer / Text input | Yes | Default 0; minimum 0 |

Drop-down seçenekleri (değer;görünen ad):

```text
ContractedProjects;Anlaşmalı Projeler
AllMarketBulletins;Tüm Piyasa Bültenleri
AllAssetAllocationRecommendations;Tüm Varlık Dağılımı Önerileri
BasinBultenleri;Basın Bültenleri
```

Kayıt anahtarları mantıksal adlardır. Kentico database içindeki SQL tablo adı yazılmaz. Mapper generated sınıfa doğrudan bağımlı değildir; field'ları GetValue ile okur. CMS şeması oluşturulmalı, generated sınıf gerekiyorsa CMS'den yeniden üretilmeli, elle düzenlenmemelidir.

## Custom table şemaları

Gerçekte var olan tablolarda code name farklıysa sadece `Infrastructure/CustomTableFeeds/CustomTableFeedSchema.cs` sabitlerini düzeltin. Varsayılan class code name'ler:

- YkbYapikredi.ContractedProjects
- YkbYapikredi.AllMarketBulletins
- YkbYapikredi.AllAssetAllocationRecommendations

`ContractedProjects`:

| Field code name | Tip / control |
|---|---|
| ProjectName | Text, text input |
| FirmName | Text, text input |
| Image | Text, media selector — URL saklar |
| District | Text, text input |
| City | Text, text input |
| WebsiteUrl | Text, URL/text input |
| Branch | Text, text input |
| Phone | Text, text input — sayı alanı değil |

ProjectName, City ve District değerlerini zorunlu tutun. URL alanlarına iframe/HTML değil URL girin. Kentico standart ItemID alanını yönetir; bunu ayrıca açmayın.

Her iki bülten tablosu:

| Field code name | Display caption | Tip / control |
|---|---|---|
| Tarih | Tarih | Date and time / Date-time picker; required |
| BultenTipi | Bülten Tipi | Text / Text input |
| Pdf | PDF | Text / Media selector — URL saklar |

Alan caption'ı `Bülten Tipi`, code name'i `BultenTipi` olarak belirlenmiştir. Mevcut tablonuzda başka code name varsa Schema.BulletinTypeField değerini düzeltin. Tarih ISO/DateTime değerinden okunur, view'da dd.MM.yyyy basılır. Tarihi olmayan kayıtlar gösterilmez. Bültenler tarihe göre azalan; projeler ItemID artan sıralanır. Kentico'da tabloları hedef siteye atayın.

## DI ve mapper manifestosu — iki zorunlu ekleme

Infrastructure kayıt dosyanıza:

```csharp
using YkbYapikredi.Infrastructure.CustomTableFeeds;

services.AddCustomTableFeeds();
```

Mevcut `services.AddComponentModule(ComponentModule.DynamicPage, module => module ... )` bloğuna:

```csharp
.Add<CustomTableFeedComponentMapper>()
```

Mapper namespace: `YkbYapikredi.Infrastructure.Components.Mappers`. Mevcut builder TryAddSingleton kullanır. Provider/source/reader'lar stateless singleton'dır; componentlere ait mutable state saklamazlar. Mapper IComponentMapper uygular, container değildir. ComponentRegistry, ModuleComponentLoader, ComponentTree, DynamicPage controller/view değiştirilmez. Başka modülde kullanmak için o modülün manifestosuna aynı mapper'ı ekleyin.

Mevcut IComponentModel ve IComponentMapper projede bulunmalı; paket onları tekrar tanımlamaz. Gerçek Infrastructure projesi CMS.CustomTables, CMS.DataEngine, CMS.Helpers ve CMS.DocumentEngine bağımlılıklarına zaten erişebilmelidir.

## Bundle kayıtları

CSS girdisine:

```text
wwwroot/css/components/custom-table-feed.css
```

JS girdisine:

```text
wwwroot/js/components/custom-table-feed.js
```

Layout'ta bu dosyaların birleştirildiği bundle yüklenmeli. Paket JS'i bağımsızdır: jQuery, Bootstrap JS, üçüncü taraf takvim ve version değişkeni kullanmaz. İki kez yüklenirse event handler'ları tekrar bağlanmaz. İçerik daha sonra dinamik eklenirse `window.YKB.CustomTableFeeds.init()` çağrılabilir.

## Davranış

- Title doğrudan component page type'tan gelir.
- Bültenlerde “tıklayınız” bağlantısı satırın Pdf adresini; projelerde Web bağlantısı WebsiteUrl adresini `target="_blank" rel="noopener noreferrer"` ile yeni sekme/pencerede açar.
- Yalnızca seçilen kaynak tablo okunur. CMS alanından gelen key SQL'e/tablo sorgusuna doğrudan verilmez; kodda kayıtlı source seçilir.
- PageSize=0: pagination yok. Pozitif PageSize: filtre sonucunda sayfa başına o kadar kayıt.
- Projelerde ilk ekranda filtre yoktur. Bültenlerde başlangıç tarihi bir takvim ayı öncesi, bitiş tarihi tarayıcının yerel bugünü olarak doldurulur ve bu aralık ilk render sırasında otomatik uygulanır. Ay sonunda önceki ayın son geçerli günü kullanılır (31 Mart → 28/29 Şubat). Sonraki filtreler form gönderilince uygulanır; yazarken/il seçerken satırlar hemen değişmez.
- Takvim ay/yıl seçimi, oklar, odak değişimi ve dış tıklamada açık kalır. Yalnızca gün seçimi takvimi kapatır. Tarih alanları, ay/yıl dropdown'ları ve takvim kontrollerinde hover/focus stili yoktur; seçili gün işareti korunur. Proje filtre inputları ve dropdown tetikleyicileri de focus çerçevesi üretmez.
- İl seçilene kadar ilçe dropdown'u disabled'dır. İl değişince ilçe seçimi temizlenir. Boş seçenek filtreyi kaldırır.
- Dropdown'lar yalnızca mevcut kayıtlarda bulunan il/ilçeleri içerir. Metin araması Türkçe büyük/küçük harf duyarsız, kısmi eşleşmedir.
- Tarih filtreleri isteğe bağlıdır, başlangıç/bitiş günleri dahil edilir. Boş bırakılan sınır kısıtlama yapmaz. Geçersiz veya ters tarih aralığı hata gösterir, mevcut satırları değiştirmez.
- Filtre uygulayınca sayfa 1'e döner. Pagination filtrelenmiş kayıtlara uygulanır. 4 ok her zaman görünür (pagination varsa); sınırda disabled. Aktif sayfanın önceki/sonraki 2 numarası görünür.
- URL değişmez, sayfa yenilenmez. Ayrı feed'ler birbirinden bağımsızdır.
- Başlangıçta seçilen tablonun TÜM kayıtları HTML'e yüklenir. Arama/pagination istemci tarafındadır, filtre sırasında yeni SQL/AJAX isteği yapılmaz. Çok büyük tablolar için bu sözleşme sunucu üzerinden sorgulamaya genişletilmelidir. Yalnızca sitede açıkça gösterilecek kayıtları bu tablolarda tutun; gizli kayıtlar client filtresiyle korunmaz.
- Aynı component node'u iki kez render edilse de wrapper her render için benzersiz DOM ID üretir.

## Yeni tablo / component ekleme

1. Application'da yeni typed content modelini oluşturun ve ICustomTableFeedContent uygulayın. Kind client handler anahtarı, ViewName partial yoludur.
2. Infrastructure'da ICustomTableFeedSource uygulayın. Key yeni dropdown değeri; Load kendi custom table kayıtlarını yeni modele map eder.
3. AddCustomTableFeeds içinde `TryAddEnumerable(ServiceDescriptor.Singleton<ICustomTableFeedSource, YeniSource>())` kaydı ekleyin.
4. TableKey dropdown'una yeni key ekleyin. Provider, mapper ve DynamicPage'de switch eklemeyin.
5. Kind mevcut projects/bulletins ise aynı client davranışını kullanabilirsiniz; markup data sözleşmesine uyun. Yeni filtre türü için bundle'da handler kaydedin:

```javascript
window.YKB.CustomTableFeeds.register('new-kind', function (root, rows) {
    // Bu factory event/state kurar ve filtre formu gönderilince
    // çağrılacak bir readPredicate fonksiyonu döndürür.
    return function () {
        const value = root.querySelector('[data-my-filter]').value;
        return function (row) { return row.dataset.myField.includes(value); };
        // Validation başarısızsa null döndürün.
    };
});
```

Yeni partial, root içinde `[data-ct-filters]` formu ve `[data-ct-row]` satırları üretir. Wrapper pagination/empty/status alanlarını sağlar. JS extension kendi bundle girdisine eklenir; önce ana feed JS yüklenir.

## Kentico dışında görsel kontrol

`Preview/index.html` örnek verilerle iki component'i aynı sayfada gösterir. Yeni paketin gerçek JS/CSS dosyalarını kullanır. Preview dosyası gerçek projeye taşınmaz.

`Tests/client-tests.cjs` gerçek JS'in tarih parsing, Türkçe normalizasyon, filtre/pagination ve bağımsız component davranışlarını test eder. Node ile çalıştırılır:

```sh
node CustomTableFeedTransfer/Tests/client-tests.cjs
```

Doğrulama: Node testleri ve JS syntax kontrolü geçti. Tarayıcıda ilk pagination, il seçilmeden ilçe engeli, İzmir ilçelerinin listelenmesi, Güzelbahçe filtresi ve takvim üzerinden tarih seçip satırları filtreleme doğrulandı. Bu makinede .NET SDK ve gerçek Kentico solution bulunmadığı için C#/Razor derlemesi çalıştırılamadı; hedef Kentico projesinde build yapın.

Kentico API referansı: https://devnet.kentico.com/docs/13_0/api/html/T_CMS_CustomTables_CustomTableItemProvider.htm

## Bültenlerde boş sonuç kontrolü

İlk ekranda yalnızca bir ay öncesi–bugün aralığı görünür. Daha eski kayıtlar için başlangıç tarihini değiştirip Getir'e basın. Hedef CMS veritabanına bu paket erişemediğinden boşluğun nedenini burada doğrulamak mümkün değildir.

HTML kaynak kodunda `data-ct-row data-date=` satırları hiç yoksa kaynak/field kontrolü yapın: `CustomTableFeedSchema.cs` içindeki table class name ve `BulletinDateField = "Tarih"` değerleri CMS code name ile aynı olmalıdır. Caption (görünen etiket) code name değildir. Tarih alanı Date and time olmalıdır; mevcut mapper geçersiz/boş tarihi olan kayıtları listeye almaz. Satırlar HTML'de varsa fakat görünmüyorsa tarih aralığını ve tarayıcıdaki JS hatalarını kontrol edin.
