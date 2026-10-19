# RichText: ilk tıklamada seçili modalı yükleme + popup pencere

Bu klasördeki dosyalar gerçek Kentico 13 ASP.NET Core/Clean Architecture projesine taşınacak TAM dosyalardır. YKBClone CMS DLL'lerini içermeyen örnek projedir; bu paket onun derlemesinden hariç tutulmuştur. Tests production'a taşınmaz.

## Davranış / sorgu maliyeti

| Durum | Yeni modal HTTP/DB sorgusu |
|---|---|
| Rich text içinde modal linki yok | Yok |
| Modal linki var ama tıklanmadı | Yok |
| Modal ilk defa tıklandı, HTML henüz yok | Tek HTTP isteği; seçilen GUID ile tek modal sorgusu |
| Aynı modal yüklenirken tekrar tıklandı | Mevcut Promise paylaşılır; ikinci istek yok |
| Aynı modal aynı sayfada tekrar açıldı | Body'deki HTML kullanılır; yeni istek yok |
| Modal zaten header/buton tarafından render edilmiş | Mevcut HTML kullanılır; yeni istek yok |
| İlk istek hata aldı, tekrar tıklandı | Yeniden istek yapılır |
| Başka bir modal tıklandı | Yalnızca onun GUID'siyle istek |
| mobile-application tipi | Aynı HTTP isteğinde yalnızca bu modalın alt componentlerini yükleyen ek SQL sorgusu |

Sekme/component sayısı kendi başına modal sorgusu oluşturmaz. Model ve mapper CMS/modal provider çağırmaz. ContainsModalLinks yalnızca yerel HTML metnini kontrol eder. RichText modeli **IModalReferenceProvider uygulamaz**; ModalReferences listesi üretmez. Mevcut ModalReferenceCollector'a rich text için ek tarama eklemeyin.

Bu garanti bu yeni rich text özelliğinin eklediği sorgular içindir. Mevcut LayoutContentProvider başka butonlar/header için /Shared veya modal havuzunu zaten yüklüyorsa onun bağımsız sorguları değişmez. Bu özellik yeni bir havuz taraması eklemez ve mevcut HTML varsa onu yeniden kullanır.

## CMS'de tıklayınız linki

Yeni page type/field gerekmez. RichTextComponent.Content alanının mevcut rich text editöründe linki ekleyin. En sade yöntem URL/href alanına aşağıdaki hash değerini vermektir. Gerekirse Source/HTML görünümünde:

```html
<a href="#modal-ce356585363043d8b9ae2eee199154d6">tıklayınız</a>
```

Buradaki örnek modal NodeGUID'si: `ce356585-3630-43d8-b9ae-2eee199154d6`. GUID'nin kısa çizgisiz N biçimi önerilir. D biçimi de JS tarafından aynı DomId'ye normalize edilir:

```html
<a href="#modal-ce356585-3630-43d8-b9ae-2eee199154d6">tıklayınız</a>
```

NodeID/DocumentID veya localhost/staging domain'i kullanmayın. GUID, modal page node'unun NodeGUID değeri olmalı. Modal DTO'daki `DomId => $"modal-{Id:N}"` aynen korunmalı. data-bs-toggle/data-bs-target/onclick eklemek gerekmez. Yalnızca standart href saklandığından editörün özel data attribute'larına izin verilmesi gerekmiyor. Kaydettikten sonra HTML'deki hash linkinin korunduğunu kontrol edin.

İstenen modal CMS ağacında **/Shared/Modals** altında, hedef sitede ve rich text sayfasının kültüründe yayınlanmış olmalıdır. Varsayılan kültüre fallback yoktur. Bu klasör dışındaki GUID'ler 404 döner.

Popup pencere için mevcut kullanım korunur:

```html
<a href="https://example.com/basvuru" target="popup">tıklayınız</a>
```

Ctrl/Cmd/Shift/Alt tıklamalarında browser davranışı değiştirilmez. Normal target=popup tıklaması 1010×740 pencere açar. Modal hash'i varsa modal davranışı önceliklidir.

## Değiştirilecek mevcut dosyalar

1. Application/Components/RichTextComponentModel.cs
2. Infrastructure/Components/Mappers/RichTextComponentMapper.cs
3. Web/Views/Shared/Components/_RichTextComponent.cshtml
4. Eski a[target="popup"] handler'ının bulunduğu JS yerine Web/wwwroot/js/components/rich-text-links.js

Eski popup handler dosyasını bundle girdisinden kaldırın; yeni dosya iki davranışı da kapsar. vendor.min.js üzerinde elle düzenleme yapmayın. Yeni JS var + Promise kullanır, async/await closure değişkenleri içermez. Dosya iki kez yüklenirse handler tekrarlanmaz.

## Eklenecek dosyalar

- Application/Components/RichTextModalLinks.cs
- Application/Layout/IRichTextModalProvider.cs
- Infrastructure/Layout/KenticoRichTextModalProvider.cs
- Infrastructure/Layout/RichTextModalServiceCollectionExtensions.cs
- Web/Controllers/RichTextModalController.cs
- Web/wwwroot/js/components/rich-text-links.js

ModalDto ve mevcut ModalDtoMapper değiştirilmez; pakette yeniden tanımlanmaz. Provider, paylaştığınız `YkbYapikredi.Infrastructure.Layout.ModalDtoMapper.Map(TreeNode, IReadOnlyList<MobileApplicationModalTabComponentModel>? tabs = null)` metodunu kullanır. standard/compact/blue-popup/video/mobile-application ViewName eşlemesi mevcut DTO'dan gelir; query string'den view yolu alınmaz.

mobile-application için sekme ve alt component mapper'ları mevcut IComponentRegistry'ye kayıtlı olmalıdır. Provider yalnızca seçilen modal altındaki kayıtlı component tiplerini ComponentTree.MaxDepth sınırıyla getirip mevcut registry üzerinden map eder. Bu sınıflar mevcut Infrastructure projenizden kullanılır, kopya interface/registry eklenmez.

## DI / route / bundle

Infrastructure servis kayıtlarında (builder.Build öncesi):

```csharp
using YkbYapikredi.Infrastructure.Layout;

services.AddRichTextModals();
// Program.cs'de builder kullanıyorsanız:
// builder.Services.AddRichTextModals();
```

Provider Scoped, mapper mevcut kaydı yoksa Transient olarak kaydedilir. Singleton RichTextComponentMapper provider tüketmez; lifetime döngüsü yoktur. Mevcut `.Add<RichTextComponentMapper>()` manifestosu aynen kalır.

Attribute controller route'ları henüz etkin değilse app.Run öncesinde:

```csharp
app.MapControllers();
```

JS bundle girdisine ekleyin:

```text
wwwroot/js/components/rich-text-links.js
```

Bootstrap 5 Modal API bu dosya yüklendikten sonra değil, kullanıcı tıklamadan önce hazır olmalıdır. Dosya yeni CSS gerektirmez; mevcut modal CSS/JS bundle'larınız kullanılır. Yeni modal türü eklendiğinde DTO ViewName allowlist'i ve mevcut mapper güncellenir; rich text loader/JS değişmez.

Endpoint URL'si view içinde Url.Action ile üretilir; virtual directory desteklenir. Kültür ViewData["Culture"] üzerinden, yoksa CurrentUICulture üzerinden alınır. Generated Kentico sınıfları elle düzenlenmez.

## Özel modal JS initialization

Yeni HTML body altına eklenir. Bootstrap modal açma/kapatma/dismiss otomatik çalışır. Özel mobile-application/tab/video script'iniz sadece DOMContentLoaded anında bind oluyorsa init fonksiyonunu dinamik HTML için de çağırın:

```javascript
document.addEventListener('richtext:modal-loaded', function (event) {
    var modal = event.detail.modal;
    // Projenizdeki özel modal init fonksiyonunu bu element için çağırın.
    // İsim burada tahmin edilmez; mevcut JS'inizdeki gerçek fonksiyonu kullanın.
});
```

Bu olay her modal ilk yüklendiğinde, show() öncesinde çalışır. Dönüşteki inline script'ler çalıştırılmaz; JS kodları bundle içinde kalmalıdır. Modal açılınca otomatik çalıştırılması gereken kodlar için mevcut shown.bs.modal davranışlarınız korunur; belgeye event delegation kullanmak dinamik modallarla uyumludur.

DynamicPage.cshtml, _Layout.cshtml ve ModalReferenceCollector için değişiklik gerekmez. Bu linkler kendi seçili modalını lazy yükler; /Shared/Modals havuzu veya LayoutData bağımlılığı eklenmez. Modalın mevcut partial'ı ayrıca layout ViewData'sına bağımlıysa o bağımlılığın modal modeline taşınması gerekir; loader tüm layout'u sırf bu nedenle sorgulamaz.

## Staging

1. Modal page type şeması ve /Shared/Modals üst düğümleri hedefte bulunmalı.
2. İlgili modalı, varsa alt sekmelerini/medya dosyalarını staging ile taşıyın ve yayınlayın.
3. Rich text içeren sayfayı taşıyın. Standart href Content HTML'iyle birlikte taşınır.
4. C#/CSHTML/JS değişikliklerini normal uygulama deployment'ıyla bütün ortamlara yayınlayın. MVC fiziksel kod dosyaları içerik staging'iyle kendiliğinden dağıtılmaz.

Staging GUID'yi korur; sayısal ID'leri koruma garantisi yoktur. Modal hedefte bağımsız olarak yeniden oluşturulursa farklı GUID alabilir; kaynak node'u staging ile taşıyın. Rich text içindeki sıradan hash linki, modalın staging bağımlılığı olarak otomatik taşınmasını sağlamaz.

[Official Kentico 13 staging / ID and GUID documentation](https://docs.kentico.com/13/deploying-websites/content-staging)

## Testler / sınırlar

```sh
node --check RichTextModalTransfer/Web/wwwroot/js/components/rich-text-links.js
node RichTextModalTransfer/Tests/client-tests.cjs
```

Client testi jsdom gerektirir; bu makinedeki mevcut /tmp/ykb-export-check kurulumu kullanılmıştır. Gerçek uygulamanın npm/jsdom bağımlılığı yoktur. Test edilenler: ilk yüklemede sıfır istek, GUID N/D eşleme, ilk tıklama isteği, mevcut DOM kullanımı, eşzamanlı tıklamaları tek istekte birleştirme, hatadan sonra tekrar deneme, son tıklamanın önceliği, Bootstrap yokken gereksiz fetch yapılmaması, popup boyutu ve çift script yüklemesi.

C# sözdizimi parser kontrolü geçti. Bu makinede .NET SDK ve gerçek Kentico DLL/DB olmadığı için C#/Razor build ve gerçek modal partial'larının uçtan uca çalışması doğrulanamadı; hedef projede build ve her modal tipini ilk açılışta kontrol edin.
