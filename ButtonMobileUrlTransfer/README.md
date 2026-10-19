# Button MobilUrl güncellemesi

Bu klasördeki Web dosyalarını gerçek Kentico MVC projesindeki aynı hedeflere kopyalayın:

- `Web/Views/Shared/Components/_ButtonComponent.cshtml`
- `Web/Views/Shared/Components/_SubBannerComponent.cshtml`
- `Web/wwwroot/js/components/button-modal.js` (mevcut buton JS dosyanızın içeriğini bununla değiştirin; ikinci kopya eklemeyin).

JS'i mevcut bundle girdisine dahil edip bundle'ı yeniden oluşturun. Sayfaya ayrıca script etiketi eklemeyin. Razor değişikliği de gereklidir: `MobilUrl`, `data-mobile-url` üzerinden tarayıcıya aktarılır. `~/` ile başlayan her iki URL de Razor'da uygulama köküne göre çözümlenir.

URL katmanı `window.YkbButtonLinks` ile bağımsız başlatılır. Eski kod `YkbButtonModalInitialized` veya `YkbButtonMobileUrlsInitialized` bayrağını daha önce ayarlamış olsa bile yeni URL katmanı çalışır; modal dinleyicileri ikinci kez kurulmaz. Bundle'da yine tek buton scripti bulundurun; bu uyumluluk kontrolü eski scriptin kaldırılması yerine geçmez.

URL açan normal tıklamalar capture aşamasında ele alınır. Seçilen adres doğrudan `location.assign`, `window.open` veya mevcut popup fonksiyonuna verilir. Bu butonlarda URL yönlendirmesini tek dinleyici yönetir (`preventDefault` ve `stopImmediatePropagation`); daha sonraki element/document click dinleyicileri çalışmaz. Bu nedenle bu butonlara özel başka click işlemleriniz varsa bunların da bu ortak işleyiciyle bütünleştirilmesi gerekir. İlgisiz bağlantılar ve modal açma dalı bu durdurmadan etkilenmez. Ctrl/Cmd/Shift/Alt tıklamalarında href güncellenir ve tarayıcının doğal davranışı sürer.

Gönderdiğiniz model ve mapper zaten `MobilUrl` alanını içeriyor; ikisinde de değişiklik gerekmiyor. Yeni CMS alanı, DI kaydı, modal mapper veya layout değişikliği gerekmiyor. Generated Kentico sınıflarını elle düzenlemeyin.

SubBanner modeli zaten `MobilLink` içeriyor. Mapper'da bu alan yoksa model oluşturulan bölüme `MobilLink = ComponentFields.String(node, "MobilLink"),` ekleyin. SubBanner CSHTML'si bunu aynı `data-mobile-url` niteliğine aktarır; ayrı JS gerekmez.

| Ekran / hedef | Kullanılacak adres |
| --- | --- |
| 992px ve üzeri, URL açan hedefler | Url |
| 992px altı, URL açan hedefler | MobilUrl doluysa MobilUrl; boş/boşluksa Url |
| `_modal` | Seçili modal; MobilUrl kullanılmaz |

URL açan hedefler mevcut enum değerleriyle `_self`, `_blank`, `_popupwindow` şeklindedir. Pencere boyutu değiştiğinde masaüstü URL'si korunur ve geri yüklenir.

## Yüklenen kodu ve seçilen URL'yi doğrulama

Bundle yeniden oluşturulup sayfa tamamen yenilendikten sonra Console'da:

```javascript
console.log(typeof window.YkbButtonLinks); // object olmalı
console.table([...document.querySelectorAll('[data-ykb-button]')].map(b => ({
    text: b.textContent.trim(),
    mobileUrl: b.getAttribute('data-mobile-url'),
    ...(window.YkbButtonLinks ? window.YkbButtonLinks.inspect(b) : {})
})));
```

`undefined`, bu dosyanın tarayıcıda çalışmadığını gösterir. Bundle girdisini, script yüklenme hatalarını ve Console hatalarını kontrol edin. `object` durumunda `url` seçilen adresi, `mobile` ise ekranın 992px altında olup olmadığını gösterir. `/asd-desktop` ve `/asd-mobil` örneğinde mobilde `url: /asd-mobil` beklenir. Doğru adres seçilip navigasyondan sonra farklı adrese gidiliyorsa Network üzerinden sunucu yönlendirmelerini de kontrol edin.

Mevcut modal gösterme/gizleme, manuel tekrar açma, ilk görülmemiş otomatik modal, `shown.bs.modal` cookie kaydı, 1 yıllık cookie süresi ve popup ölçüleri korunmuştur. Paylaşılan metinde yorum satırına birleşmiş `const autoButton` ve popup engellenmesi durumundaki `window.location.assign(url)` ifadeleri ayrı kod satırları olarak yazılmıştır.

## Kontrol

`node ButtonMobileUrlTransfer/Tests/client-tests.cjs`

Test için `jsdom` gerekir. Testler kaynak JS'i çalıştırarak mobil/masaüstü URL seçimini, geri dönüşü, hedefleri, ekran değişimini, modal/cookie ve popup davranışlarını kontrol eder. Bu repo gerçek Kentico çözümü olmadığı için Kentico/Razor derleme kontrolü hedef projede yapılmalıdır.
