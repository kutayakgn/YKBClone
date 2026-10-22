# VideoCardList: filtre, başlık ve sütun ayarları

Bu paket gönderdiğiniz VideoCardList model, mapper, view ve JS temel alınarak hazırlanmıştır. Gerçek Kentico çözümünüzde aşağıdaki dosyaları aynı proje/konumlara kopyalayın. Bu demo repo Kentico çözümü olmadığı için paket dosyaları demo uygulamanın derlemesinden hariç tutulmuştur.

## Değiştirilecek dosyaların tam halleri

1. `Application/Components/VideoCardListComponentModel.cs`
2. `Infrastructure/Components/Mappers/VideoCardListComponentMapper.cs`
3. `Web/Views/Shared/Components/_VideoCardListComponent.cshtml`
4. `Web/wwwroot/js/components/video-card-list.js`

## Birleştirilmiş tek CSS

`Web/wwwroot/css/components/video-card-list.css`, gönderdiğiniz mevcut CSS ile sütun/görünürlük ayarlarının birleştirilmiş tam halidir. Mevcut VideoCardList CSS dosyasını bununla değiştirin. Bundle'da yalnızca bu dosyayı kullanın; önceki `video-card-list-options.css` girdisini kaldırın.

Kart görünümü, gap, 170px masaüstü görsel yüksekliği, play ikonu, dropdown, pagination ve modalın 24px iç boşluğu korunur. Sütun sayısı ve hidden kuralları tek yerde birleştirildi. Açık dropdown okunun dönmesi için eksik alt eleman seçicisi düzeltildi; scrollbar-color geçerli iki renk değeriyle yazıldı.

Mevcut JS bundle girdiniz `js/components/video-card-list.js` olarak kalır. JS'i ikinci kez dahil etmeyin, ayrı script etiketi eklemeyin. Dosyayı değiştirip bundle'ı yeniden oluşturun, uygulamayı yeniden başlatıp sayfayı tamamen yenileyin. `version` alanları kaldırıldı; başarılı başlatma marker'ları tekrar dinleyici kurulmasını önler. JS'te `let`/`const` ve arrow function yoktur; önceki minifier kapsam hatalarını azaltmak için `var` kullanılır. Hedef WebOptimizer/minifier kurulumu burada bulunmadığından onun ürettiği çıktıyı hedef projede kontrol edin.

## Kentico alanları

`YkbYapikredi.VideoCardList` page type'ına ekleyin:

| Alan adı | Tip / kontrol | Varsayılan | Doğrulama |
| --- | --- | --- | --- |
| `IsFliterActive` | Boolean / Check box | true | Yazım tam olarak böyle |
| `IsTitleVisible` | Boolean / Check box | true | |
| `RowCardCount` | Integer number / Text box | 3 | Minimum 1 |

Mevcut `Name` ve `PageSize` alanlarını koruyun. Alanların varsayılanları mevcut kayıtları otomatik güncellemeyebilir; eski VideoCardList node'larında iki checkbox'ı açın ve RowCardCount=3 olarak kaydedin. Bu alanlar bool=false olarak kayıtlıysa mapper bu bilinçli değeri korur; varsayılan true değeriyle üzerine yazmaz.

Generated page type sınıflarını elle düzenlemeyin; CMS üzerinden yeniden oluşturun. Yeni alanlar mapper'da GetValue ile okunur; mevcut Name/PageSize generated özellikleri kullanılır.

## Davranış

- `IsFliterActive=true`: dropdown görünür, başlangıçta mevcut en yeni yıl seçilir; yalnız o yılın kartları listelenir. Dropdown seçenekleri yine kartlarda bulunan benzersiz yıllardır.
- `IsFliterActive=false`: dropdown ve yıl input'u HTML'e basılmaz. Mevcut view'daki Year>0 kuralına uyan tüm yılların kartları NodeOrder sırasıyla birlikte listelenir.
- `IsTitleVisible=false`: h2 HTML'e basılmaz. JS başlığın varlığını zorunlu tutmaz.
- Başlık görünürken filtre açıksa seçili yıl yazılır. Filtre kapalıysa mevcut `Name` alanı yazılır; Name boşsa "Videolar" yazılır.
- `PageSize=0`: pagination yoktur. Pozitif değerde filtre açıkken seçili yılın, kapalıyken bütün listenin kayıtlarına pagination uygulanır. Yıl değişimi ilk sayfaya döner.
- URL ve sayfa yenilenmez; yalnızca component içindeki görünür kartlar güncellenir. Bu, mevcut yapıdaki gibi istemci tarafında filtreleme/pagination'dır; yeni server endpoint'i eklenmez.
- Birden çok sayfa varsa ilk/önceki/sonraki/son okları her sayfada görünür. Sınırdaki oklar disabled olur; mevcut en fazla 5 numaralı sayfa penceresi korunur.
- RowCardCount geniş ekranda (992px ve üzeri) kullanılır. 576–991.98px arasında en fazla 2 sütun, daha küçükte 1 sütun gösterilir. RowCardCount=1 ise tablette de 1 kalır. Hatalı 0/negatif değerde 3 kullanılır.
- Video otomatik başlamaz; modal kapanınca iframe src temizlenir. Mevcut `_VideoCardModal.cshtml`, modalın 24px iç boşluğu ve stilleri korunur.

## VideoCardItem

VideoCardItem model, mapper ve CSHTML dosyalarını değiştirmeyin. Üç ayar da listeye aittir. Mevcut item view'ı zaten `data-video-card-item` ve `data-year` taşımalıdır; kartın bu kök elementi grid'in doğrudan çocuğu olmalıdır. Kartın iç HTML'i ve `icon-play` aynı kalır.

DI, component registry, ModuleComponentLoader, Composition veya DynamicPage değişikliği gerekmez; mevcut IContainerComponentMapper akışı kullanılır.

## Kontrol

`Tests/browser-tests.cjs`, gerçek tarayıcıda filtre/başlık kombinasyonlarını, PageSize=0/1 davranışını, aramalı dropdown'u, responsive sütun sayısını, çoklu instance'ları ve video modal olaylarını kontrol eder.

Playwright ve Chrome/Chromium bulunan ortamda:

```sh
node VideoCardListOptionsTransfer/Tests/browser-tests.cjs
```

Gerekirse `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` ile tarayıcı yolunu belirtin. C#/Razor/Kentico derlemesi gerçek hedef çözümde yapılmalıdır.
