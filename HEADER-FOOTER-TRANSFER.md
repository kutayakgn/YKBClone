# Değişiklikleri asıl projeye taşıma rehberi

Bu rehber yalnız desktop/mobile header ayrımı ve buna bağlı sade navigation modelini taşımak içindir. Asıl projedeki modal, localization, cache ve controller altyapısını koruyarak merge edin; dosyaları körlemesine üzerine yazmayın.

## 1. Zorunlu taşınacak dosyalar

| Bu repodaki dosya | Asıl projedeki hedef | Neden |
|---|---|---|
| `Models/NavigationModels.cs` | Application navigation modelleri | `DesktopHeader` key'i, sade DTO ve `NavigationAudience` |
| `Models/LayoutData.cs` | Application layout modeli | `DesktopHeaderItems` ve `MobileHeaderItems` ayrımı |
| `KenticoIntegration/LayoutContentProvider.cs.example` | Infrastructure Kentico provider | Yeni key, Page selector hedef çözümleme, URL üretme ve eski alanların kaldırılması |
| `Views/Shared/Header.cshtml` | Gerçek header partial'ı | Desktop ve mobil kaynakların ayrılması |
| `Views/Shared/Footer.cshtml` | Gerçek footer partial'ı | İki checkbox yerine `NavigationAudience` kullanımı |
| `wwwroot/js/header.js` | Gerçek header script'i | Mobil ağacın tamamını `HeaderMain` üzerinden kullanma |

Provider dosyasını `.example` uzantısıyla taşımayın; asıl projedeki `.cs` implementasyonuyla birleştirin.

## 2. Koşullu taşınacak dosyalar

| Dosya | Karar |
|---|---|
| `KenticoIntegration/ILayoutContentProvider.cs.example` | `GetAsync` imzası aynıysa değişiklik gerekmez. |
| `KenticoIntegration/ProgramRegistration.cs.example` | DI kaydınız zaten `ILayoutContentProvider -> LayoutContentProvider` ise değişiklik gerekmez. |
| `KenticoIntegration/ControllerLayoutData.cs.example` | Mevcut controller/filter akışınızı koruyun; sözleşme değişmedi. |
| `KenticoIntegration/_Layout.cshtml.example` | Mevcut layout'a sadece gerekli model/partial kullanımını merge edin. |
| `Models/ModalModels.cs` | **Clone-only minimum tiptir.** Asıl projede gerçek `ModalDto` varsa taşımayın. |

Bu değişiklikte CSS ve asset değişmedi. `header.css`, `footer.css`, font ve görselleri tekrar taşımaya gerek yoktur.

`Models/MockLayoutContent.cs` yalnız bu klonun Kentico'suz demo kaynağıdır; üretime taşımayın.

## 3. Asıl projede yapılacak model merge'i

`NavigationNodeDto` içinden kaldırılacaklar:

```csharp
DesktopName
DisplayOnDesktop
DisplayOnMobile
PromoteChildrenOnDesktop
```

Eklenecekler:

```csharp
public string Audience { get; init; } = NavigationAudiences.All;
public bool IsVisibleOnDesktop => Audience != NavigationAudiences.Mobile;
public bool IsVisibleOnMobile => Audience != NavigationAudiences.Desktop;
```

`MenuKeys` içine:

```csharp
public const string DesktopHeader = "DesktopHeader";
```

`LayoutData` içinde eski tek `HeaderTabs` alanını aşağıdaki iki alanla değiştirin:

```csharp
public IReadOnlyList<NavigationNodeDto> DesktopHeaderItems { get; init; } = [];
public IReadOnlyList<NavigationNodeDto> MobileHeaderItems { get; init; } = [];
```

Map:

```csharp
DesktopHeaderItems = content.Menu(MenuKeys.DesktopHeader).Items,
MobileHeaderItems = content.Menu(MenuKeys.HeaderMain).Items,
```

Asıl projedeki `LayoutContent` modal listesini koruyun. Bu klonda son güncellemedeki constructor uyuşmazlığı giderildi: constructor artık `modals` parametresini alır ve `Modals` property’sine atar. Asıl projede bu zaten başka dosyada/partial'da çözülmüşse duplicate tanım oluşturmayın.

## 4. Provider merge'i

Provider'da şu değişiklikler birlikte taşınmalıdır:

1. `RequiredMenuKeys` listesine `MenuKeys.DesktopHeader` eklenmesi.
2. Constructor'a `IPageUrlRetriever` eklenmesi.
3. Bütün navigation node'larındaki `NavigationTargetPage` GUID'lerinin toplanması.
4. Seçilen target sayfaların `IPageRetriever.Retrieve<TreeNode>` ve `WithPageUrlPaths()` ile toplu alınması.
5. URL'nin `_pageUrlRetriever.Retrieve(targetPage).RelativePath` üzerinden çözülmesi.
6. Target bulunamazsa `NavigationUrl` fallback'i ve warning logu.
7. Eski generated property erişimlerinin kaldırılması.
8. `NavigationAudience` map'i.

Asıl projedeki generated class namespace'lerine göre dosyanın başındaki alias'ları düzeltin:

```csharp
using NavigationMenuPage = ...NavigationMenu;
using NavigationNodePage = ...NavigationMenuNode;
using HeaderNotificationPage = ...HeaderNotificationItem;
using AnnouncementPage = ...Announcement;
using ModalPage = ...Modal;
```

Bu repoda dosya adı, sınıf adı, logger generic tipi ve DI örneği
`LayoutContentProvider` olarak birbiriyle uyumludur. Asıl projede de bu adı
koruyun.

## 5. Kentico tarafındaki işlemler

Kod deploy'undan önce:

1. `NavigationMenuKey` seçeneklerine `DesktopHeader` ekleyin.
2. `NavigationTargetPage` alanını GUID + Page selector olarak ekleyin.
3. `NavigationAudience` alanını dropdown olarak ekleyin.
4. Mevcut footer görünürlük checkbox değerlerini `NavigationAudience` alanına aktarın.
5. `/Shared/Navigation/DesktopHeader` menü kökünü oluşturun.
6. `KENTICO-13-MINIMUM-WORKING-PAGE-TREE.md` içindeki desktop ağacını girin.
7. İç link node'larında gerçek target sayfayı seçin.

Kod deploy ve doğrulamadan sonra:

1. `NavigationDesktopName` alanını silin.
2. `NavigationDisplayOnDesktop` alanını silin.
3. `NavigationDisplayOnMobile` alanını silin.
4. `NavigationPromoteChildrenOnDesktop` alanını silin.
5. `NavigationMenu` ve `NavigationMenuNode` wrapper class'larını Kentico Code sekmesinden yeniden üretin.
6. Generated dosyaları live-site projesine alın ve build edin.

## 6. Beklenen davranış

| Ekran alanı | Kaynak |
|---|---|
| Desktop üst gri linkler | `HeaderTop` |
| Desktop müşteri sekmeleri ve linkleri | `DesktopHeader` / `Tab` |
| Desktop Yapı Kredili Ol | `DesktopHeader` / `CustomerAcquisition` |
| Desktop İnternet Şubesi | `DesktopHeader` / `InternetBranch` |
| Mobil sekmeler ve recursive menü | `HeaderMain` / `Tab` |
| Mobil Yapı Kredili Ol | `HeaderMain` / `CustomerAcquisition` |
| Mobil İnternet Şubesi | `HeaderMain` / `InternetBranch` |
| Mobil kısayollar | `HeaderMain` / `MobileQuickLinks` |

`HeaderMain` değişmeden mobil içerik yönetim noktası olmaya devam eder. Desktop için aynı gerçek sayfayı göstermek istediğinizde `DesktopHeader` altında yeni node oluşturup aynı sayfayı `NavigationTargetPage` alanında seçersiniz.

## 7. Test listesi

- Ana sayfa ve iç sayfada desktop header açılıyor.
- Desktop tab linkleri yalnız `DesktopHeader` sırasını izliyor.
- `HeaderMain` değişikliği yalnız mobili etkiliyor.
- `DesktopHeader` değişikliği yalnız desktopı etkiliyor.
- İç sayfa taşındığında/URL'i değiştiğinde selector kullanan link çalışmaya devam ediyor.
- Yayınlanmamış veya silinmiş target için uygulama kırılmıyor; warning ve fallback URL davranışı görülüyor.
- Mobil recursive menü tüm seviyelerde ilerliyor ve geri dönüyor.
- Desktop ve mobil action panelleri kendi menü köklerindeki içerikleri gösteriyor.
- Footer `All`, `Desktop`, `Mobile` seçimlerini doğru uyguluyor.
- Duplicate veya eksik `DesktopHeader` key'i loglarda görülüyor.

## 8. Bu klonda düzeltilen mevcut hatalar

- `LayoutData` `content.Modals` okuyordu ancak `LayoutContent` içinde `Modals` yoktu; constructor/property eklendi.
- Provider dört argümanla `LayoutContent` oluşturuyordu ancak model üç argüman kabul ediyordu; imzalar eşitlendi.
- Provider sınıfı, logger generic tipi ve DI kaydı `LayoutContentProvider` adıyla eşitlendi.
- Son güncellemede provider namespace'i ve satır biçimi bozulmuştu; normal C# dosya yapısına döndürüldü.
- `_Layout.cshtml.example` JavaScript dosyalarını yanlışlıkla stylesheet olarak yüklüyordu; `header.js` ve `footer.js` gerçek `script` etiketlerine çevrildi.

Bu repoda `dotnet` CLI kurulu olmadığı için gerçek build çalıştırılamadı. Taşıma sonrasında asıl solution üzerinde build ve Kentico preview testi zorunludur.
