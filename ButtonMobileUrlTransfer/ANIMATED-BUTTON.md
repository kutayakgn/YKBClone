# ButtonComponent — animasyonlu mobil CTA

Mevcut **ButtonComponent** genişletildi. Yeni page type/component, model alanı, veritabanı sorgusu, DI kaydı veya yeni modal sistemi yok. `ButtonClass = animated-cta` seçildiğinde yalnızca görünüm değişir. Aynı `Url`, `MobilUrl`, `DesktopTarget`, `MobilTarget`, `ModalReference`, `OpenModalOnPageLoad`, `Label` ve `IsDisabled` alanları kullanılır.

Kaynak: [Yapı Kredi banka hesabı açma sayfası](https://www.yapikredi.com.tr/banka-hesabi-ac/?basvuru-merkezi), 19 Ekim 2026. Sayfadaki `custom_anim` JSON verisi olduğu gibi alındı. Görsel, sabit SVG’ye CSS sallanması eklenerek taklit edilmedi; orijinal **Lottie → SVG** animasyonu oynatılır. Sabit görsel, aynı animasyonun kadın figürlü 120. karesinden çıkarıldı. Başlangıçtaki soldan giriş CSS ile yalnızca transform/opacity üzerinden yapılır; genişlik animasyonu veya sayfa genelinde başlık kaydırması yapılmaz.

## 1. Kentico ayarı

Mevcut ButtonComponent page type’ındaki **ButtonClass** dropdown seçeneklerinin sonuna ekleyin:

```text
animated-cta;Animasyonlu mobil buton
```

Yeni page type veya alan oluşturmayın; generated Kentico sınıflarını elle değiştirmeyin. İlgili sayfada zaten kullandığınız ButtonComponent’i ekleyip:

| Alan | Örnek / davranış |
|---|---|
| ButtonClass | `animated-cta` |
| Label | `HEMEN YAPI KREDİLİ OL` |
| Url | Mevcut normal bağlantı |
| MobilUrl | Gerçek mobil / uygulama bağlantınız; boşsa Url |
| MobilTarget | `_self`, `_blank`, `_popupwindow` veya `_modal` |
| ModalReference | `_modal` seçildiyse mevcut modal referansı |
| OpenModalOnPageLoad | Mevcut ilk ziyaret/cookie davranışı |
| IsDisabled | Pasifse tıklama, otomatik modal ve animasyon çalışmaz |

Bu görünümde baştaki görsel ve sondaki ok sabittir; `Icon` ve `ButtonSize` diğer görünümlerde çalışmaya devam eder. Bu görünüm 72px asgari yüksekliğe sahiptir; uzun metin gerektiğinde satıra iner. Butonu sayfada istediğiniz sıraya yerleştirin; normal belge akışındadır. Referans sayfanın başlığına bağlı absolute konumlandırma generic butona eklenmedi.

## 2. Tam dosyaları hedeflere kopyalayın

`Application` katmanındaki dosyalar değişmez. Aşağıdakiler dosyaların **tam son halleridir**; mevcut mapper ve view üzerinde satır ekleme yapmak yerine bunları kullanabilirsiniz.

| Bu paketteki dosya | Gerçek projedeki hedef |
|---|---|
| `Infrastructure/Components/Mappers/ButtonComponentMapper.cs` | Infrastructure projesinde aynı yol — mevcut mapper’ı değiştirin |
| `Web/Views/Shared/Components/_ButtonComponent.cshtml` | Web projesinde aynı yol — mevcut view’ı değiştirin |
| `Web/Views/Shared/Components/_AnimatedButtonIcon.cshtml` | Web projesinde aynı yol — yeni partial |
| `Web/wwwroot/css/components/animated-button.css` | Web projesinde aynı yol — yeni CSS |
| `Web/wwwroot/js/components/animated-button.js` | Web projesinde aynı yol — yeni animasyon JS’i |
| `Web/wwwroot/js/button-modals.js` | Mevcut ortak buton JS dosyasını değiştirin |
| `Web/wwwroot/assets/animations/become-customer.json` | Aynı yol — animasyon verisi |
| `Web/wwwroot/assets/animations/become-customer-poster.svg` | Aynı yol — JS kapalı / yükleme hatası / reduced motion görseli |
| `Web/wwwroot/lib/lottie-web/lottie_light.min.js` | Aynı yol — yerel SVG oynatıcı |
| `Web/wwwroot/lib/lottie-web/LICENSE.md` | Aynı yol — oynatıcı lisansı |

`ButtonComponentModel.cs`, modal collector, DynamicPage ve layout’un modal section’ı değişmez. Mapper’ın davranış farkı yalnızca `ParseButtonClass` içindeki `animated-cta` seçeneğidir. Önceki sohbette paylaştığınız model/mapper esas alındı. Yerel .NET 10 örnek projesi gerçek Kentico uygulaması değildir; `YKBClone.csproj` değişikliği, taşıma klasöründeki bu Kentico mapper’ının örnek uygulamaya yanlışlıkla derlenmesini önler. Bu csproj değişikliğini Kentico projesine taşımayın.

Ortak JS’teki tek ilave davranış, `aria-disabled="true"` butonların URL/modal açmasını engellemektir. Mobil URL önceliği, popup, cookie, manuel modalı yeniden açma ve ilk görülmemiş otomatik modal mantığı korunur. `components/button-modal.js`, önceki bağlantılar için aynı dosyanın kopyasıdır; ikisini birlikte bundle’a eklemeyin.

## 3. Bundle

Mevcut JavaScript bundle’ınızdaki `js/button-modals.js` satırını koruyun, sonrasına yalnızca şunu ekleyin:

```csharp
"js/components/animated-button.js"
```

Mevcut CSS bundle’ınızın sonuna şunu ekleyin:

```csharp
"css/components/animated-button.css"
```

**`lib/lottie-web/lottie_light.min.js` dosyasını vendor bundle’a eklemeyin.** Animasyon JS’i ihtiyaç olduğunda dosyayı kendi yükler. View içinde inline JS veya her buton için script etiketi yok. Bundle’ı yeniden oluşturup önbelleği yenileyin. Mevcut projedeki Ubuntu fontu kullanılır; yoksa Arial’a düşer. Önizlemedeki Google Fonts bağlantısı yalnızca önizlemeye aittir.

Yerel oynatıcı [airbnb/lottie-web v5.13.0](https://github.com/airbnb/lottie-web/tree/v5.13.0/build/player), SVG light sürümü; MIT lisansı paket içindedir. Çalışma anında CDN veya referans site çağrısı yapılmaz. `wwwroot` statik dosyalarının `.json`, `.svg` ve `.js` olarak sunulması gerekir. Uygulama alt dizinde barınıyorsa yollar Razor `Url.Content("~/...")` ile çözülür.

## 4. Görünürlük ve performans

- Referanstaki mobil görünürlük korunur: **768px altında** görünür, 768px ve üzerinde gizlidir.
- Ortak URL/hedef seçimi **992px** eşiğini korur. İki eşik farklı amaçlıdır; diğer butonların ve SubBanner’ın davranışı değişmez.
- Mobilde buton ekrana girene kadar oynatıcı ve animasyon JSON’u istenmez. Masaüstünde veya `prefers-reduced-motion: reduce` durumunda bunlar yüklenmez.
- Oynatıcı yaklaşık 168 KB, JSON yaklaşık 58 KB ham boyuttadır; sunucu sıkıştırması ile aktarım daha küçüktür. Aynı sayfadaki butonlar bir oynatıcı isteğini ve bir JSON isteğini paylaşır; her buton bağımsız SVG instance’ı kullanır.
- Ekran dışına çıkınca veya sekme arka plana geçince animasyon duraklar; geri dönünce sürer. Ağ hatasında, JS kapalıyken veya hareketi azaltma tercihinde sabit SVG ve normal bağlantı kullanılabilir.
- Yeni fetch/DB/modal yükleme davranışı eklenmez. Önceden kullanılan modal hazırlama düzeni devam eder.
- CSS, `ykb-animated-button` altında sınırlıdır; `.row`, `.content-block`, `.mobile-animation`, `#tick_animation` gibi sayfa geneli class/id’lere bağımlı değildir. Aynı sayfada birden fazla buton kullanılabilir.
- JS eski minifier sorununuz için `var`/klasik function sözdizimi kullanır. Hedef WebOptimizer/minifier kurulumu burada yoktur; üretilen bundle hedef projede ayrıca kontrol edilmelidir.

Kentico preview/AJAX ile sonradan HTML ekleyen bir akışınız varsa, ekleme işleminden sonra mevcut ortak hook’ları çağırın:

```javascript
window.YkbButtonLinks.refresh();
window.YkbAnimatedButtons.refresh();
```

## 5. Doğrulama ve önizleme

```sh
node ButtonMobileUrlTransfer/Tests/client-tests.cjs
node ButtonMobileUrlTransfer/Tests/animated-button-tests.cjs
```

Test bağımlılığı `jsdom` (mevcut proje veya geçici test ortamında). **37 ortak davranış + 11 animasyon senaryosu**: mobil URL, hedefler, ekran değişimi, modal/cookie/popup; kaynakların gecikmeli yüklenmesi, ortak istekler, reduced motion, ekran/sekme görünürlüğü, pasif butonlar, hata halinde poster, dinamik ekleme/kaldırma.

`Preview/index.html`, 320/358/390/767/768/992px görünümlerini sunar. Statik sunucuyu paket kökünden çalıştırın:

```sh
python3 -m http.server 8878 --bind 127.0.0.1 --directory ButtonMobileUrlTransfer
```

Sonra `http://127.0.0.1:8878/Preview/index.html` adresini açın. `Preview` ve `Tests` klasörlerini gerçek projeye kopyalamayın. Preview, Razor çıktısını temsil eden fixture’dır; gerçek Kentico/C# ve Razor derlemesi burada doğrulanamaz. Hedef projede bundle sonrası modal referansınızı, mobil linkinizi ve CSS bundle sırasını doğrulayın.
