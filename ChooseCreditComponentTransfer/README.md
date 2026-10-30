# ChooseCreditComponent — Kentico 13 aktarım paketi

Bu paket `randevu_al_form` kredi seçim akışını CMS'den yönetir. Soru ve cevap sayısı sabit değildir. Her cevap ya başka bir soruya geçer ya da bir URL'ye yönlendirir. Seçim yapmak tek başına işlem başlatmaz; geçiş veya yönlendirme yalnızca **Devam** düğmesine basıldığında yapılır.

Referans: [Yapı Kredi / Kredini Seç](https://www.yapikredi.com.tr/kredi/konut-kredisi/kredini-sec). Örnek içerik 30 Ekim 2026 tarihinde kontrol edilen akışı ve gönderilen ekran görüntülerini temel alır. İlk sorunun ilk cevabı ikinci soruyu açar; diğer iki cevap doğrudan URL'ye gider. İkinci sorudaki sekiz cevabın her biri URL'ye gider.

## Taşınacak dosyalar

Paketin `Application`, `Infrastructure` ve `Web` klasörlerinin içeriklerini gerçek çözümünüzde aynı katmanlara kopyalayın. `Kentico`, `Preview` ve `Tests` kurulum/inceleme içindir; hedef uygulamanın çalışma dosyaları değildir. Mevcut `IComponentModel`, `IComponentMapper` ve `IContainerComponentMapper` sözleşmeleri yeniden tanımlanmaz. Namespace'ler mevcut paketler gibi `YkbYapikredi` kökünü kullanır.

| Katman | İçerik |
| --- | --- |
| Application / Components | Component, soru ve cevap modelleri; akış ve URL doğrulaması |
| Infrastructure / Components / Mappers | Üç page type için mapper |
| Web / Views / Shared / Components | `_ChooseCreditComponent.cshtml`, `_ChooseCreditQuestion.cshtml`, `_ChooseCreditAnswer.cshtml` |
| Web / wwwroot / js / components | `choose-credit.js` |
| Web / wwwroot / css / components | `choose-credit.css` |

Bu depo Kentico CMS bağımlılıkları olmayan örnek MVC uygulamasıdır. Aktarım dosyaları gerçek Kentico çözümünde derlenmeli ve mevcut component loader ile doğrulanmalıdır.

## Kentico kurulumu

Üç content-only page type oluşturun:

```text
DynamicPage / mevcut component kabul eden container
└── ChooseCreditComponent
    ├── ChooseCreditQuestion (amac)
    │   ├── ChooseCreditAnswer
    │   ├── ChooseCreditAnswer
    │   └── ChooseCreditAnswer
    └── ChooseCreditQuestion (ihtiyac)
        └── ChooseCreditAnswer (istenen sayıda)
```

Alanların tam code name, tip, uzunluk, varsayılan ve zorunlulukları [PAGE-TYPES.md](Kentico/PAGE-TYPES.md) dosyasındadır. Referans sayfa için girilecek tüm kayıtlar ve yönlendirmeler [EXAMPLE-CONTENT.md](Kentico/EXAMPLE-CONTENT.md) dosyasındadır.

Soru ve cevaplar ayrı web sayfaları değildir. URL/routing, menü ve site haritasına eklemeyin. Sorular component'in doğrudan altında, cevaplar ilgili sorunun doğrudan altında olmalıdır. Gösterim sırasını Kentico sayfa ağacındaki `NodeOrder` belirler. Bir sonraki soruyu sıra değil, cevabın `NextQuestionKey` alanı belirler.

## Mapper kaydı

Mevcut DynamicPage modülünüzdeki mapper zincirine üç kaydı birlikte ekleyin:

```csharp
using YkbYapikredi.Infrastructure.Components.Mappers;

services.AddComponentModule(ComponentModule.DynamicPage, module => module
    // Mevcut mapper kayıtları burada kalır.
    .Add<ChooseCreditComponentMapper>()
    .Add<ChooseCreditQuestionMapper>()
    .Add<ChooseCreditAnswerMapper>());
```

Bu örneği ikinci bir modül tanımı açmak yerine mevcut kayıt bloğuna birleştirin. Component başka modülde kullanılacaksa aynı üç mapper o modüle de kayıtlı olmalıdır. İlk iki mapper container, cevap mapper'ı yapraktır. Mapper'lar stateless'tir; yeni repository, servis veya endpoint gerekmez. Alanlar `GetValue` ile okunur; generated Kentico page sınıflarına doğrudan bağımlılık yoktur.

Mevcut loader kayıtlı üç tipi de sorgulamalı, çok tipli sorguda custom alanları yüklemeli (`.Types(...).WithCoupledColumns()` kullanan yapıda bu çağrıyı koruyun) ve component → soru → cevap olmak üzere en az üç seviyeyi map etmelidir. Alanları `.Columns(...)` ile sınırlıyorsanız yeni custom alanları da dahil edin. Site, kültür, yayın ve preview filtreleri mevcut loader üzerinden uygulanmalıdır. Root render listesinde yalnızca component yer alır; soruları ve cevapları ayrıca üst seviye component olarak eklemeyin.

## CSS ve JS kaydı

Mevcut bundle girdilerine birer kez ekleyin:

```text
wwwroot/css/components/choose-credit.css
wwwroot/js/components/choose-credit.js
```

Bundle kullanmıyorsanız layout'a birer kez ekleyebilirsiniz:

```html
<link rel="stylesheet" href="~/css/components/choose-credit.css" asp-append-version="true" />
<script src="~/js/components/choose-credit.js" asp-append-version="true" defer></script>
```

Partial'ların her render'ında tekrar script eklemeyin. JS bağımsızdır; jQuery veya Bootstrap JS istemez. Her component kendi soru/seçim durumunu taşır. Başlangıçta otomatik seçim yapılmaz. Cevaplar radio gruplarıyla tek seçimlidir. Aynı component'in birden fazla instance'ı birbirinden bağımsız çalışır. Referanstaki gibi Geri düğmesi yoktur.

CSS referansın Ubuntu yazı tipini kullanır; Ubuntu mevcut site bundle'ınızda yüklüyse aynı font uygulanır, aksi halde Arial/sans-serif kullanılır. Paket font dosyası eklemez. Stili mevcut genel stillerden sonra yükleyin.

İçerik sonradan AJAX/partial ile eklenirse `window.YkbChooseCredit.init(scope)` çağırın; `scope` eklenen element veya onu kapsayan DOM elementidir. İlk sayfa yüklemesinde başlatma otomatik yapılır.

## Akışın yönetimi

- `StartQuestionKey` boşsa ilk sıralı soru açılır; doluysa aynı component içindeki o anahtarlı soru açılır.
- `ActionType=question` için yalnızca `NextQuestionKey` doldurulur. Başka bir soruya dallanabilir; hedefin sıradaki soru olması gerekmez.
- `ActionType=redirect` için yalnızca `RedirectUrl` doldurulur. İlk sorudaki bir cevap da bu şekilde akışı bitirebilir.
- Hedef URL aynı sekmede açılır. `/...`, `~/...` veya tam `http://` / `https://` adresi kullanılır. `~/` uygulama köküne Razor üzerinden çözülür.
- İkinci sorunun başlığı gerekiyorsa `Heading` veya `QuestionText` doldurulur. Referansta ikinci adımın bu alanları boştur; sayfanın dışındaki “Kredini Seç” başlığı component tarafından tekrar basılmaz.
- Yeni soru/cevap eklemek için kod değişikliği gerekmez. Yeni kaydı oluşturun, ilgili cevaplarda hedef anahtarını/URL'yi ayarlayın ve kayıtları yayınlayın.

Eksik soru/cevap, aynı component içinde tekrar eden anahtar, bulunamayan hedef, döngü ve geçersiz yönlendirme yapılandırmaları doğrulanır. Geçersiz akışta ziyaretçiye `ConfigurationErrorMessage` gösterilir. Ayrıntılar modelin `ConfigurationErrors` listesinden geliştirici tarafından incelenebilir. Soruların `QuestionKey` değerlerini sonradan değiştirirken o soruya giden bütün cevapları ve başlangıç anahtarını güncelleyin.

## Örnek içerikteki dikkat noktası

Referans sayfanın ilk sorusundaki **“Başka bankadaki kredimi getirmek için”** seçeneği, kontrol tarihinde `/kredi/konut-kredisi/ailem-sagolsun-mortgage` adresini taşıyordu. Örnek bu mevcut davranışı korur. İş kuralınız Transfer Mortgage ise yalnızca bu cevabın `RedirectUrl` alanını `/kredi/konut-kredisi/transfer-mortgage` olarak değiştirin; kod değişikliği gerekmez.

## Hedef projede kontrol

CMS şemasını oluşturup üç mapper'ı kaydettikten sonra ilk sorunun üç dalını ve ikinci sorunun sekiz yönlendirmesini kontrol edin. Cevap seçmeden Devam, farklı soru/cevap sayıları, birden fazla component instance'ı, mobil görünüm ve klavye ile radio seçimini de kontrol edin. Gerçek Kentico veritabanı, loader ve hedef bundle/minifier bu depoda bulunmadığından bunların entegrasyon kontrolü hedef çözümde tamamlanmalıdır.

Yerel önizlemeyi çalıştırma komutları ve doğrulama sonuçları [Tests/README.md](Tests/README.md) dosyasındadır. Gerçek modeller ve üç Razor partial ile önizleme derlendi; 25 akış/URL kontrolü geçti. Tarayıcıda ilk ve ikinci sorudan yönlendirme, üç sorulu dal, soru atlama, seçim doğrulaması, iki instance ve 375px mobil görünüm kontrol edildi. [Masaüstü](Preview/screenshots/desktop-step-1.jpg) ve [mobil ikinci adım](Preview/screenshots/mobile-step-2.jpg) görselleri pakettedir.
