# CardGroupComponent — AJAX ile sunucuda pagination

Bu klasörün Application / Infrastructure / Web altındaki dosyalarını gerçek Kentico 13/Clean Architecture solution'da aynı katmanlara kopyalayın. Bunlar TAM dosya içerikleridir. YKBClone CMS bağımlılıkları içermeyen örnek projedir; aktarım klasörü bu projenin derlemesinden hariç tutulmuştur. Tests hedef MVC uygulamasına taşınmaz.

## Kentico

Mevcut `YkbYapikredi.CardGroupComponent` page type'ına ekleyin:

| Field code name | Data type | Form control | Default | Validation |
|---|---|---|---|---|
| PageSize | Integer | Text input | 0 | Minimum 0 |

Title mevcut alan olarak korunur. PageSize=0 tüm kartları gösterir, pagination yok. Pozitif PageSize sayfa başına gösterilecek **doğrudan alt kart** sayısıdır. Container kart içindeki çocuklar ayrıca birer sayfalama kaydı sayılmaz. Tek sayfalık sonuçta pagination gösterilmez.

Generated sınıfı elle düzenlemeyin. Mapper PageSize'ı `GetValue("PageSize")` ile okuduğundan generated property'nin eklenmesini beklemez; CMS alanı oluşturulmalıdır. İsterseniz sınıfı CMS'den tekrar generate edin.

Allowed child types mevcut kart türlerinizi kabul etmeli. Her kartın mapper'ı ilgili component modülüne kayıtlı olmalı; CardGroup yalnızca kayıtlı component tiplerini map eder. Yayınlanmamış kartlar live sorguda gösterilmez.

## Değişecek üç dosya

- Application/Components/CardGroupComponentModel.cs
- Infrastructure/Components/Mappers/CardGroupComponentMapper.cs
- Web/Views/Shared/Components/_CardGroupComponent.cshtml

## Yeni dosyalar

- Application/Components/ICardGroupPaginationService.cs
- Infrastructure/Components/CardGroupPaginationService.cs
- Infrastructure/Components/CardGroupPaginationServiceCollectionExtensions.cs
- Web/Controllers/CardGroupPaginationController.cs
- Web/Views/Shared/Components/_CardGroupItems.cshtml
- Web/wwwroot/js/components/card-group-pagination.js
- Web/wwwroot/css/components/card-group-pagination.css

Mevcut IComponentModel, IContainerComponentMapper, IComponentRegistry, ComponentMapperRegistration, ComponentModule ve ComponentTree tipleri tekrar tanımlanmaz; proje içinde bulunmalıdır. Kod, paylaştığınız registry ve loader sözleşmelerine göre hazırlanmıştır. Yeni ViewComponent veya Web/Services token dosyası yoktur.

## DI / route

Infrastructure servis kayıtlarına ekleyin:

```csharp
using YkbYapikredi.Infrastructure.Components;

services.AddCardGroupPagination();
```

Mapper manifestosundaki mevcut `.Add<CardGroupComponentMapper>()` kalır. Aynı mapper'ı tekrar eklemeyin. Pagination servisi Scoped'dur; mapper bu servisi tüketmediğinden singleton registry/mapper ile DI döngüsü veya lifetime hatası yaratmaz.

Web route bölümünde attribute controller route'ları henüz açılmamışsa, app.Run() öncesi:

```csharp
app.MapControllers();
```

Endpoint Url.Action ile oluşturulur:

```text
GET /components/card-groups/page?groupId=<NodeGUID>&culture=tr-TR&page=2
```

PageSize istemciden alınmaz. Sunucu her istekte grubun CMS PageSize değerini okur. Grup sadece mevcut site, seçilen kültür ve Published filtresiyle bulunur. Bulunamazsa 404; geçersiz parametre 400 döner.

## Bundle

Mevcut CSS bundle girdilerine ekleyin:

```text
wwwroot/css/components/card-group-pagination.css
```

Mevcut JS bundle girdilerine ekleyin:

```text
wwwroot/js/components/card-group-pagination.js
```

Bundle'ı yeniden oluşturup güncel dosyanın yüklendiğini doğrulayın. Pagination sunucuda HTML olarak render edilir; JS yüklenmezse buton tıklaması AJAX oluşturmaz. Console kontrolü:

```javascript
typeof window.YKB?.CardGroups
```

`object` dönmelidir. `undefined` dönüyorsa dosya bundle'a dahil edilmemiştir veya bundle yüklenmemiş/önceki bir syntax hatasıyla durmuştur. Pagination numaraları sunucuda basıldığından numaraların görünmesi JS'in yüklendiğini kanıtlamaz. Güncel JS pagination tıklamalarını document üzerinde capture modunda tek handler ile yakalar ve sonradan eklenen grubu ilk tıklamada başlatır. Kök ve partial arasındaki ilişki doğrudan DOM çocuklarıyla bulunur; :scope bağımlılığı yoktur. Sonradan eklenen kökler için `window.YKB.CardGroups.init()` kullanılabilir; aynı köke handler iki kez bağlanmaz. version, jQuery veya Bootstrap JS bağımlılığı yoktur.

## Veri ve render akışı

**İlk sayfa:** Mevcut ModuleComponentLoader çocukları normal biçimde yükler/map eder. Mapper Title, GroupId, Culture, PageSize ve toplam kart sayısını modele ekler. Cards tam listeyi tutar; view yalnızca VisibleCards üzerinden ilk PageSize kaydı render eder. Bu yüzden ilk sayfa SQL sorgusu mevcut loader'da bütün kart ağacını getirir; bu aşamada SQL paging uygulanmaz. Loader/registry/controller'ınızı değiştirmek gerekmez.

**Sonraki sayfalar:** AJAX endpoint grubun alanlarını CMS'den alır, doğrudan alt kayıtları Kentico MultiDocumentQuery `.Page(page - 1, PageSize)` ile SQL'de sayfalar; toplamı TotalRecords üzerinden alır. Yalnızca istenen sayfadaki kartlar map/render edilir. Yaprak kartlar için alt sorgu yoktur. Container kartlar için kendi alt ağacı ayrıca yüklenir. DB çağrıları sıralıdır; MARS gerekmez.

Her kart kendi `ViewName` partial'ı ile basılır; PromoCard/ImageCard gibi tip filtreleri yoktur. İç içe CardGroup'lar kendi pagination köklerine sahiptir, üst grup tıklamayı tekrar işlemez. Kartların mevcut section.row yapısı korunur; kartların kolon/class yapısı değiştirilmez.

İlk yüklemede Cards tam ağaç olarak korunduğundan, mevcut ModalReferenceCollector grubun sonraki sayfalarındaki modal referanslarını da görür. Mevcut sayfanızın modal toplama/render mekanizması çalışır durumda kalmalıdır. AJAX partial'ın modelden bağımsız controller ViewData'sına ihtiyaç duyan özel kartları varsa bu veriyi endpoint'e de sağlamalısınız; burada rastgele layout sorgusu eklenmez.

Sayfa değişiminde başlık ve dış kök korunur; yalnızca kartlar + pagination partial'ı değiştirilir. URL veya tüm sayfa yenilenmez. Aktif sayfanın önceki/sonraki iki numarası gösterilir. Dört ok pagination varsa hep görünür, sınırda pasiftir. İstek hatasında mevcut kartlar korunur ve tekrar deneme mümkün olur. Önceki yanıt daha yeni yanıtı ezmez.

Yeni kartlar JS init gerektiriyorsa aşağıdaki olayı dinleyebilirsiniz; mevcut init fonksiyonunuzun birden fazla çağrıya dayanıklı olması gerekir:

```javascript
document.addEventListener('cardgroup:updated', function (event) {
    // event.detail.content: güncellenen kart alanı
    // event.detail.page: aktif sayfa
    // Özel kartınızın kendi init fonksiyonunu burada çağırın.
});
```

## Doğrulama

```sh
node --check cardgroupcomponent/Web/wwwroot/js/components/card-group-pagination.js
node cardgroupcomponent/Tests/client-tests.cjs
```

Kontroller geçti: nested pagination izolasyonu, disabled oklar, başarısız istekten sonra tekrar deneme, doğru groupId/culture/page parametreleri, partial değiştirme ve URL'nin korunması. Bu makinede .NET SDK ve gerçek Kentico solution olmadığından C#/Razor derlemesi veya Kentico DB sorguları çalıştırılamadı; hedef projede build ve yayınlanmış kartlarla uçtan uca kontrol yapın.

## Bundle içinde ReferenceError

`Uncaught (in promise) ReferenceError: o is not defined` gibi bir hata fetch çağrısından önce gelirse controller'a istek ulaşmaz. Güncel JS request controller ve sıra numarasını açık bir state nesnesinde tutar; istek hazırlığı da try içinde, son Promise rejection da handler içinde yakalanır.

Kaynak dosyayı değiştirdikten sonra bundle'ın gerçekten yeniden üretildiğini doğrulayın. Eski CardGroup JS kopyalarını bundle girdilerinden kaldırın; dosya bir kez yer alsın. `vendor.min.js` dosyasını elle düzeltmeyin. Stack hâlâ HTMLDivElement üzerindeki handler'ı gösteriyorsa eski köke bağlanan sürüm çalışıyor olabilir; güncel dosya document üzerinde tek handler kullanır. Ctrl+F5 ile yeni bundle'ı yükleyin. Gerçek projedeki minifier bu ortamda bulunmadığından o pipeline'ın çıktısı burada doğrulanamadı.
