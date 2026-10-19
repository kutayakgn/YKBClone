# Button MobilUrl güncellemesi

Bu klasördeki Web dosyalarını gerçek Kentico MVC projesindeki aynı hedeflere kopyalayın:

- `Web/Views/Shared/Components/_ButtonComponent.cshtml`
- `Web/wwwroot/js/components/button-modal.js` (mevcut buton JS dosyanızın içeriğini bununla değiştirin; ikinci kopya eklemeyin).

JS'i mevcut bundle girdisine dahil edip bundle'ı yeniden oluşturun. Sayfaya ayrıca script etiketi eklemeyin. Eski JS bundle'da kalırsa `YkbButtonModalInitialized` kontrolü yeni kopyanın çalışmasını engeller. Razor değişikliği de gereklidir: `MobilUrl`, `data-mobile-url` üzerinden tarayıcıya aktarılır. `~/` ile başlayan her iki URL de Razor'da uygulama köküne göre çözümlenir.

Gönderdiğiniz model ve mapper zaten `MobilUrl` alanını içeriyor; ikisinde de değişiklik gerekmiyor. Yeni CMS alanı, DI kaydı, modal mapper veya layout değişikliği gerekmiyor. Generated Kentico sınıflarını elle düzenlemeyin.

| Ekran / hedef | Kullanılacak adres |
| --- | --- |
| 992px ve üzeri, URL açan hedefler | Url |
| 992px altı, URL açan hedefler | MobilUrl doluysa MobilUrl; boş/boşluksa Url |
| `_modal` | Seçili modal; MobilUrl kullanılmaz |

URL açan hedefler mevcut enum değerleriyle `_self`, `_blank`, `_popupwindow` şeklindedir. Pencere boyutu değiştiğinde masaüstü URL'si korunur ve geri yüklenir. Normal anchor navigasyonu ve Ctrl/Cmd/Shift/Alt tıklamaları korunur.

Mevcut modal gösterme/gizleme, manuel tekrar açma, ilk görülmemiş otomatik modal, `shown.bs.modal` cookie kaydı, 1 yıllık cookie süresi ve popup ölçüleri korunmuştur. Paylaşılan metinde yorum satırına birleşmiş `const autoButton` ve popup engellenmesi durumundaki `window.location.assign(url)` ifadeleri ayrı kod satırları olarak yazılmıştır.

## Kontrol

`node ButtonMobileUrlTransfer/Tests/client-tests.cjs`

Test için `jsdom` gerekir. Testler kaynak JS'i çalıştırarak mobil/masaüstü URL seçimini, geri dönüşü, hedefleri, ekran değişimini, modal/cookie ve popup davranışlarını kontrol eder. Bu repo gerçek Kentico çözümü olmadığı için Kentico/Razor derleme kontrolü hedef projede yapılmalıdır.
