# Header/footer şirket projesine adım adım aktarım

Bu rehber ASP.NET Core MVC + Kentico Xperience 13 live-site projesi içindir. Amaç, bu projedeki header/footer görünümünü ve davranışlarını korurken bütün içerikleri Kentico'dan `LayoutData` üzerinden beslemektir.

## Son durumda veri akışı

```text
Kentico page tree
    ↓
ILayoutContentProvider
    ↓
LayoutContent
    ↓ LayoutData.Create(...)
LayoutData
    ↓ ViewData["LayoutData"]
_Layout.cshtml
    ├── Header.cshtml
    └── Footer.cshtml
```

Razor dosyaları Kentico API'sine doğrudan bağlanmaz. Böylece sunum kodu taşınabilir kalır; CMS sorgusu ve cache tek bir provider/repository içinde yönetilir.

## 0. Başlamadan önce

Hedef projede şunların bulunduğunu doğrulayın:

- ASP.NET Core MVC/Razor view yapısı.
- Kentico Xperience servislerinin projede zaten çalışıyor olması.
- `YKB.NavigationMenu`, `YKB.NavigationNode`, `YKB.HeaderNotification` ve `YKB.Announcement` page type'larının oluşturulmuş olması.
- Page type field code name'lerinin belgelerdeki değerlerle birebir aynı olması.
- Minimum içerik ağacının Kentico Pages uygulamasında oluşturulmuş veya oluşturulmaya hazır olması.

Aktarıma ayrı bir Git branch'inde başlayın. Eski header/footer dosyalarını hemen silmeyin; yeni bileşen çalıştıktan sonra kaldırın.

## 1. Kopyalanacak dosyalar

| Bu projedeki kaynak | Hedef projedeki önerilen yer | İşlem |
|---|---|---|
| `Models/NavigationModels.cs` | `Application/Navigation/NavigationModels.cs` | Mevcut DTO'larla birleştirin |
| `Models/LayoutData.cs` | `Application/Layout/LayoutData.cs` | Mevcut sınıfı bununla birleştirin |
| `Views/Shared/Header.cshtml` | `Views/Shared/Header.cshtml` | Aynen kopyalayın |
| `Views/Shared/Footer.cshtml` | `Views/Shared/Footer.cshtml` | Aynen kopyalayın |
| `wwwroot/css/header.css` | `wwwroot/css/header.css` | Aynen kopyalayın |
| `wwwroot/css/footer.css` | `wwwroot/css/footer.css` | Aynen kopyalayın |
| `wwwroot/js/header.js` | `wwwroot/js/header.js` | Aynen kopyalayın |
| `wwwroot/js/footer.js` | `wwwroot/js/footer.js` | Aynen kopyalayın |
| `wwwroot/assets/icomoon.woff2` | `wwwroot/assets/icomoon.woff2` | Zorunlu; ikon fontudur |
| `wwwroot/assets/yapikredi-logo.svg` | `wwwroot/assets/yapikredi-logo.svg` | Zorunlu |
| `wwwroot/assets/pin-yapikredi.svg` | `wwwroot/assets/pin-yapikredi.svg` | Zorunlu |
| `KenticoIntegration/ILayoutContentProvider.cs.example` | `Application/Layout/ILayoutContentProvider.cs` | Kopyalayın ve `.cs` yapın |
| `KenticoIntegration/KenticoLayoutContentProvider.cs.example` | `Infrastructure/Kentico/KenticoLayoutContentProvider.cs` | Generated class alias'larını düzeltip `.cs` yapın |
| `KenticoIntegration/ControllerLayoutData.cs.example` | `Web/Controllers/SiteController.cs` | Controller yaklaşımı kullanılacaksa örnek olarak birleştirin |
| `KenticoIntegration/ProgramRegistration.cs.example` | Mevcut `Program.cs`/DI modülü | Dosyayı değil ilgili kayıt satırını birleştirin |
| `KenticoIntegration/_Layout.cshtml.example` | Mevcut `Views/Shared/_Layout.cshtml` | Üzerine yazmayın; ilgili blokları birleştirin |

Şunları üretim projesine kopyalamayın:

- `Models/MockLayoutContent.cs`: yalnız demosuz Kentico bağlantısı için kullanılan geçici veridir.
- `wwwroot/css/site.css`: demo ana sayfa ve test sayfasının içerik stilleridir.
- `Controllers/HomeController.cs`: demo action'ları ve `/header-test` route'u üretim parçası değildir.
- `notification-credit.png` ve `notification-mobile.png`: gerçek bildirim görselleri Kentico media alanından gelir.

CSS içindeki ikon fontu yolu `../assets/icomoon.woff2` olarak tanımlıdır. Bu nedenle `css` ve `assets` klasörlerinin yukarıdaki göreli konumu korunmalıdır. Klasör yapısını değiştirirseniz iki CSS dosyasındaki `@font-face src` yolunu birlikte güncelleyin.

## 2. Namespace'leri hedef projeye uyarlayın

Kaynak dosyalar şu namespace'leri kullanır:

```csharp
using YkbYapikredi.Application.Navigation;
using YkbYapikredi.Application.Layout;
```

Şirket projesinde bu namespace'ler varsa aynen bırakın. Farklı namespace kullanıyorsanız aşağıdaki yerleri birlikte değiştirin:

1. `NavigationModels.cs` namespace'i.
2. `LayoutData.cs` namespace'i ve `using` satırı.
3. `Header.cshtml` ve `Footer.cshtml` başındaki `@using` satırları.
4. `Views/_ViewImports.cshtml`.
5. Layout data filter/provider dosyalarındaki `using` satırları.

Yalnız bir dosyada namespace değiştirmek Razor model çözümleme hatasına neden olur.

## 3. Kentico generated page type sınıflarını ekleyin

CMS alanlarını oluşturduktan sonra Kentico yönetim projesinde:

1. **Page types** uygulamasını açın.
2. İlgili page type'ı seçin.
3. **Code** sekmesinden wrapper class'ı üretin.
4. Üretilen sınıfları live-site projesinde örneğin `Models/Generated` klasörüne kopyalayın.
5. Projeye dahil edin ve bir kez build alın.

Üretilmesi gereken tipler:

- `YKB.NavigationMenu`
- `YKB.NavigationNode`
- `YKB.HeaderNotification`
- `YKB.Announcement`

Generated dosyaları elle değiştirmeyin. Ek davranış gerekirse ayrı bir partial class veya repository kullanın.

## 4. DTO ve LayoutData sözleşmesini ekleyin

`NavigationModels.cs` içindeki şu tiplerin hedef projede bulunması gerekir:

- `NavigationNodeDto`
- `NavigationRoles`
- `HeaderNotificationDto`
- `AnnouncementDto`
- `SocialSectionDto`
- `MenuContent`
- `MenuKeys`
- `LayoutContent`

Mevcut `LayoutData` sınıfınıza özellikle şu iki footer alanını ekleyin:

```csharp
public IReadOnlyList<NavigationNodeDto> FooterBrandLinks { get; init; } = [];
public IReadOnlyList<NavigationNodeDto> FooterAppLinks { get; init; } = [];
```

`LayoutData.Create` metodunda bütün eşlemeler şu şekilde olmalıdır:

```csharp
public static LayoutData Create(LayoutContent content)
{
    ArgumentNullException.ThrowIfNull(content);

    var social = content.Menu(MenuKeys.Social);

    return new LayoutData
    {
        HeaderTopLinks = content.Menu(MenuKeys.HeaderTop).Items,
        HeaderTabs = content.Menu(MenuKeys.HeaderMain).Items,
        HeaderNotifications = content.HeaderNotifications,
        FooterColumns = content.Menu(MenuKeys.Footer).Items,
        FooterBottomLinks = content.Menu(MenuKeys.FooterLegal).Items,
        FooterBrandLinks = content.Menu(MenuKeys.FooterBrands).Items,
        FooterAppLinks = content.Menu(MenuKeys.FooterApps).Items,
        Announcements = content.Announcements,
        Social = new SocialSectionDto
        {
            Title = social.Title,
            Links = social.Items
        }
    };
}
```

`YKB.HeaderSettings` veya `YKB.FooterSettings` eklemeyin. Logo/pin asset yolları, arama action'ı, duyuru başlıkları, geçiş süresi ve copyright metni koddan yönetilir.

## 5. Kentico içerik provider'ını oluşturun

Önce Application katmanında bağımsız sözleşmeyi oluşturun. Kopyalanabilir sürümü `KenticoIntegration/ILayoutContentProvider.cs.example` dosyasındadır:

```csharp
using YkbYapikredi.Application.Navigation;

namespace YkbYapikredi.Application.Layout;

public interface ILayoutContentProvider
{
    Task<LayoutContent> GetAsync(
        string culture,
        CancellationToken cancellationToken = default);
}
```

Infrastructure/Kentico katmanında `KenticoLayoutContentProvider` implementasyonu oluşturun. Xperience 13 ASP.NET Core live-site uygulamasında sayfa okumak için mevcut `IPageRetriever` servisini kullanın.

Kopyalanabilir tam provider örneği `KenticoIntegration/KenticoLayoutContentProvider.cs.example` dosyasındadır. Hedef projeye kopyalarken uzantısını `.cs` yapın ve yalnız dosyanın başındaki dört generated page type alias'ını kendi Kentico class namespace'inize göre düzenleyin.

### 5.1 Menü köklerini alın

`YKB.NavigationMenu` kayıtlarını path ile değil `NavigationMenuKey` alanıyla sorgulayın. Beklenen anahtarların tamamı:

```csharp
var requiredMenuKeys = new[]
{
    MenuKeys.HeaderTop,
    MenuKeys.HeaderMain,
    MenuKeys.Footer,
    MenuKeys.FooterLegal,
    MenuKeys.FooterBrands,
    MenuKeys.FooterApps,
    MenuKeys.Social
};
```

Kentico sorgusunun biçimi aşağıdaki gibi olmalıdır. Generated sınıf adını kendi projenizin ürettiği sınıfa göre uyarlayın:

```csharp
var menuRoots = pageRetriever.Retrieve(
        "YKB.NavigationMenu",
        query => query
            .WhereIn("NavigationMenuKey", requiredMenuKeys)
            .OrderBy("NodeOrder"))
    .ToList();
```

Her key için tam bir kayıt bulunmalıdır. Aynı key'den birden fazla kayıt varsa bunu sessizce seçmeyin; konfigürasyon hatası olarak loglayın.

### 5.2 Her menünün bütün alt node'larını alın

Menü kökü key ile bulunduktan sonra o kökün güncel `NodeAliasPath` değeri üzerinden bütün `YKB.NavigationNode` descendants kayıtlarını alın. Böylece editör menü kökünü taşısa bile başlangıçta key ile tekrar bulunur.

```csharp
var pages = pageRetriever.Retrieve(
        "YKB.NavigationNode",
        query => query
            .Path(menuRoot.NodeAliasPath, PathTypeEnum.Children)
            .OrderByAscending("NodeLevel", "NodeOrder"))
    .ToList();
```

Bir seviyelik sorgu kullanmayın. Mobil menü en alt node'a kadar recursive çalıştığı için bütün descendants kayıtları gerekir.

### 5.3 TreeNode kayıtlarını recursive DTO'ya dönüştürün

Generic `TreeNode` ile eşleme yapıyorsanız kullanılabilecek çekirdek metot:

```csharp
using CMS.DocumentEngine;
using YkbYapikredi.Application.Navigation;

private static NavigationNodeDto MapNode(
    TreeNode page,
    ILookup<int, TreeNode> childrenByParent)
{
    return new NavigationNodeDto
    {
        Id = page.NodeGUID.ToString("N"),
        Title = page.GetStringValue("NavigationTitle", string.Empty).Trim(),
        Url = page.GetStringValue("NavigationUrl", string.Empty).Trim(),
        IconCssClass = page.GetStringValue("NavigationIconCssClass", string.Empty).Trim(),
        ImageUrl = page.GetStringValue("NavigationImage", string.Empty).Trim(),
        MobileImageUrl = page.GetStringValue("NavigationMobileImage", string.Empty).Trim(),
        ImageAlt = page.GetStringValue("NavigationImageAlt", string.Empty).Trim(),
        BadgeText = page.GetStringValue("NavigationBadgeText", string.Empty).Trim(),
        Role = page.GetStringValue("NavigationRole", NavigationRoles.MenuItem),
        OpenInNewTab = page.GetBooleanValue("NavigationOpenInNewTab", false),
        DisplayOnDesktop = page.GetBooleanValue("NavigationDisplayOnDesktop", true),
        DisplayOnMobile = page.GetBooleanValue("NavigationDisplayOnMobile", true),
        PromoteChildrenOnDesktop = page.GetBooleanValue(
            "NavigationPromoteChildrenOnDesktop",
            false),
        Children = childrenByParent[page.NodeID]
            .OrderBy(child => child.NodeOrder)
            .Select(child => MapNode(child, childrenByParent))
            .ToArray()
    };
}
```

Bir menüyü `MenuContent` haline getirirken:

```csharp
var childrenByParent = pages.ToLookup(page => page.NodeParentID);

var menu = new MenuContent
{
    Title = menuRoot.GetStringValue("NavigationMenuTitle", string.Empty).Trim(),
    Items = childrenByParent[menuRoot.NodeID]
        .OrderBy(page => page.NodeOrder)
        .Select(page => MapNode(page, childrenByParent))
        .ToArray()
};
```

### 5.4 Bildirim ve duyuruları alın

- `/Shared/Header Notifications` altındaki doğrudan `YKB.HeaderNotification` çocuklarını `NodeOrder` ile alın.
- `/Shared/Announcements` altındaki doğrudan `YKB.Announcement` çocuklarını `NodeOrder` ile alın.
- Preview dışındaki istekte yalnız yayında olan ve yayın tarihi geçerli kayıtları döndürün.
- `Announcements` boşsa `LayoutContent.Announcements=[]` dönmelidir. Footer duyuru şeridini hiç render etmez.

Field eşlemesi:

| Kentico field | DTO alanı |
|---|---|
| `HeaderNotificationTitle` | `HeaderNotificationDto.Title` |
| `HeaderNotificationUrl` | `HeaderNotificationDto.Url` |
| `HeaderNotificationImage` | `HeaderNotificationDto.ImageUrl` |
| `HeaderNotificationImageAlt` | `HeaderNotificationDto.ImageAlt` |
| `HeaderNotificationOpenInNewTab` | `HeaderNotificationDto.OpenInNewTab` |
| `AnnouncementTitle` | `AnnouncementDto.Title` |
| `AnnouncementUrl` | `AnnouncementDto.Url` |
| `AnnouncementOpenInNewTab` | `AnnouncementDto.OpenInNewTab` |

Sonuçta provider şu paketi dönmelidir:

```csharp
return new LayoutContent(
    menus,
    announcements,
    headerNotifications);
```

Provider seviyesinde site+culture bazlı cache kullanın. Cache dependency; yedi menu root'unu, `YKB.NavigationNode`, `YKB.HeaderNotification` ve `YKB.Announcement` değişikliklerini kapsamalıdır. `IPageRetriever` kullanıyorsanız mevcut projenin preview ve cache yaklaşımını bozmayın.

## 6. Controller'da LayoutData'yı hazırlayın

Beklenen doğrudan controller akışı şudur:

```csharp
var content = await _layoutContentProvider.GetAsync(
    CultureInfo.CurrentUICulture.Name,
    HttpContext.RequestAborted);

ViewData["LayoutData"] = LayoutData.Create(content);
ViewData["IsHomePage"] = true; // Yalnız ana sayfada true

return View();
```

Bu işlem `return View()` çağrısından önce tamamlanmalıdır. İçerik sayfasının kendi view modelini değiştirmez; normal model `return View(pageViewModel)` ile gönderilmeye devam eder, header/footer verisi ayrıca `ViewData` içinde taşınır.

Her controller'da kodu çoğaltmamak için kopyalanabilir `SiteController` örneği `KenticoIntegration/ControllerLayoutData.cs.example` dosyasındadır. View döndüren controller'lar bu base controller'dan türeyip action başında şunu çağırır:

```csharp
await LoadLayoutDataAsync(
    isHomePage: false,
    cancellationToken: HttpContext.RequestAborted);
```

Ana sayfada `isHomePage: true`, diğer sayfalarda `false` verin. Redirect, JSON veya dosya döndüren action'ların layout verisi yüklemesine gerek yoktur.

### Alternatif: global action filter

Şirket projesi base controller kullanmıyorsa aynı işlemi global action filter ile de yapabilirsiniz:

```csharp
using System.Globalization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using YkbYapikredi.Application.Layout;

public sealed class LayoutDataFilter(
    ILayoutContentProvider provider) : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(
        ActionExecutingContext context,
        ActionExecutionDelegate next)
    {
        if (context.Controller is Controller controller)
        {
            var content = await provider.GetAsync(
                CultureInfo.CurrentUICulture.Name,
                context.HttpContext.RequestAborted);

            controller.ViewData["LayoutData"] = LayoutData.Create(content);
        }

        await next();
    }
}
```

Provider'ı controller üzerinden kullanmak için `Program.cs` veya projenin DI registration dosyasında şu ortak kayıt her durumda gereklidir. Kopyalanabilir sürümü `KenticoIntegration/ProgramRegistration.cs.example` dosyasındadır:

```csharp
builder.Services.AddScoped<ILayoutContentProvider, KenticoLayoutContentProvider>();
```

Global action filter alternatifini seçtiyseniz buna ek olarak:

```csharp
builder.Services.AddScoped<LayoutDataFilter>();

builder.Services.AddControllersWithViews(options =>
{
    options.Filters.AddService<LayoutDataFilter>();
});
```

Projede `AddControllersWithViews` zaten çağrılıyorsa ikinci kez eklemek yerine filter registration'ını mevcut çağrıya taşıyın. Kentico servis kaydı (`AddKentico` vb.) mevcut Xperience başlangıç konfigürasyonunda kalmalıdır.

Action filter kullanamıyorsanız aynı provider çağrısını mevcut base controller veya layout service içinde bir kez yapın. `_Layout.cshtml` içinden Kentico sorgusu çalıştırmayın.

## 7. `_ViewImports.cshtml` dosyasını güncelleyin

`Views/_ViewImports.cshtml` içine ekleyin:

```cshtml
@using YkbYapikredi.Application.Layout
@using YkbYapikredi.Application.Navigation
@addTagHelper *, Microsoft.AspNetCore.Mvc.TagHelpers
```

`asp-append-version` ve `~/...` asset çözümlemesi için MVC Tag Helper kaydı bulunmalıdır. Projede zaten varsa ikinci bir `@addTagHelper` satırı eklemeniz gerekmez.

## 8. Üretim `_Layout.cshtml` dosyasına bağlayın

Mevcut `_Layout.cshtml` dosyasını tamamen değiştirmeyin. Aşağıdaki parçaları şirket layout'una yerleştirin.

Birleştirme için tam referans `KenticoIntegration/_Layout.cshtml.example` dosyasındadır. Bu örneği şirket layout'unuzun mevcut meta, analytics, cookie, section ve script alanlarını koruyarak birleştirin; dosyayı körlemesine üzerine yazmayın.

Dosyanın başında:

```cshtml
@using YkbYapikredi.Application.Layout
@{
    var layoutData = ViewData["LayoutData"] as LayoutData
        ?? throw new InvalidOperationException("LayoutData hazırlanmadı.");

    var isHomePage = ViewData["IsHomePage"] as bool? ?? false;
    ViewData["IsHomePage"] = isHomePage;
}
```

`<head>` içinde şirketin Bootstrap/global CSS dosyalarından **sonra**:

```cshtml
<link rel="stylesheet" href="~/css/header.css" asp-append-version="true" />
<link rel="stylesheet" href="~/css/footer.css" asp-append-version="true" />
```

`<body>` başlangıcında, eski header'ın yerine:

```cshtml
@await Html.PartialAsync("Header", layoutData, ViewData)
```

Sayfa içeriğini bir ana element içinde tutun:

```cshtml
<main class="ykb-page-content" role="main">
    @RenderBody()
</main>
```

`</body>` kapanışından önce, eski footer'ın yerine:

```cshtml
@await Html.PartialAsync("Footer", layoutData, ViewData)

<script src="~/js/header.js" asp-append-version="true" defer></script>
<script src="~/js/footer.js" asp-append-version="true" defer></script>

@await RenderSectionAsync("Scripts", required: false)
```

Script dosyalarını bundle içine ekliyorsanız ayrıca `<script>` etiketiyle yüklemeyin. Her dosya sayfada yalnız bir kez çalışmalıdır. Hedef projede eski ASP.NET `ScriptBundle`/AjaxMin kullanılıyorsa `header.js` ve `footer.js` dosyalarını bu eski minification pipeline'ına eklemeyin; bağımsız `defer` script olarak yükleyin. Eski minifier modern JavaScript söz dizimini bozarsa butonlar render edilir fakat click handler'ları hiç bağlanmaz.

### 8.1 Şirket bundle CSS'ine karşı öncelik

CSS cascade sırası önem, cascade layer, selector specificity ve en son kaynak sırasına göre belirlenir. İlk olarak dosya sırasını düzeltin; şirket bundle'ı her zaman header/footer dosyalarından önce gelmelidir:

```cshtml
@* Önce mevcut şirket/vendor bundle'ları *@
<link rel="stylesheet" href="~/css/company.bundle.min.css" />

@* Sonra taşınan component CSS'leri *@
<link rel="stylesheet" href="~/css/header.css" asp-append-version="true" />
<link rel="stylesheet" href="~/css/footer.css" asp-append-version="true" />

@* Yalnız hedef projedeki gerçek çakışmalar için; en son *@
<link rel="stylesheet" href="~/css/header-footer-compat.css" asp-append-version="true" />
```

Bundle, layout section veya başka bir partial tarafından sayfanın sonunda tekrar yüklenmemelidir. Aynı specificity seviyesinde en son yüklenen kural kazanır.

Header ve footer tekil component olduğu için root elementlere stabil ID ekleyebilirsiniz:

```cshtml
<header id="ykb-site-header"
        class="ykb-header"
        data-ykb-header
        data-home="@isHomePage.ToString().ToLowerInvariant()">
```

```cshtml
<footer id="ykb-site-footer" class="footer ykb-footer">
```

Mevcut class ve `data-*` alanlarını silmeyin. ID'ler yalnız hedef projedeki uyumluluk override'larına güçlü ve güvenli bir scope verir.

`header-footer-compat.css` içine bütün header/footer CSS'ini kopyalamayın. Tarayıcı geliştirici araçlarında bundle tarafından ezilen property'yi bulun ve yalnız o property için root ID ile override yazın:

```css
/* company.bundle.min.css içindeki header button/a kurallarına karşı örnekler */
#ykb-site-header.ykb-header .ykb-tab-button {
    padding: 0 0 12px;
    border: 0;
    color: #004990;
    background: transparent;
    line-height: 1.35;
}

#ykb-site-header.ykb-header .ykb-action-button {
    box-sizing: border-box;
    text-decoration: none;
}

#ykb-site-footer.ykb-footer .ykb-footer-column h2 {
    margin: 0;
    padding: 0;
    color: #1f1f1f;
}

#ykb-site-footer.ykb-footer a {
    text-decoration: none;
}
```

Bu selector'larda ID + component class bulunduğu için `button`, `header button`, `.navbar button`, `.footer a` gibi bundle kurallarından daha yüksek specificity oluşur.

Bundle kuralında `!important` varsa normal bir override, ID kullansa bile kazanamaz. Öncelik sırası:

1. Mümkünse bundle'daki gereksiz `!important` kuralını kaldırın veya scope'unu daraltın.
2. Bundle değiştirilemiyorsa yalnız çakışan property'de, son yüklenen compat dosyasında hedefli `!important` kullanın.

```css
#ykb-site-header.ykb-header .ykb-tab-button {
    color: #004990 !important;
}
```

Tüm component'e `all: unset`, `all: initial` veya yüzlerce `!important` uygulamayın. Bunlar erişilebilirlik, form kontrolleri, responsive davranış ve ikon fontu mirasını bozabilir.

Geliştirici araçlarında kontrol yöntemi:

1. Bozuk elementi Inspect ile seçin.
2. **Computed** panelinde yanlış görünen property'yi açın.
3. Kazanan `company.bundle.min.css` selector'ını ve `!important` durumunu görün.
4. Aynı property'yi root ID ile `header-footer-compat.css` içine yazın.
5. Compat dosyasının Network ve Sources panelinde bundle'dan sonra geldiğini doğrulayın.

## 9. Sabit header için içerik boşluğunu ayarlayın

Header `position: fixed` kullandığı için hedef projenin global/layout CSS dosyasına aşağıdaki host kuralını ekleyin:

```css
.ykb-page-content {
    min-height: 100vh;
    padding-top: 144px;
}

@media (max-width: 991.98px) {
    .ykb-page-content {
        padding-top: 105px;
    }
}
```

Şirket projesinin mevcut page shell'i header yüksekliği kadar boşluğu zaten veriyorsa bu kuralı ikinci kez eklemeyin. İki offset birlikte uygulanırsa içerik gereğinden fazla aşağı iner; hiçbiri uygulanmazsa sayfa içeriği header'ın altında kalır.

## 10. Ana sayfa ve iç sayfa ayrımını yapın

Ana sayfa action'ında:

```csharp
ViewData["IsHomePage"] = true;
```

Diğer action'larda değer vermeyin veya açıkça:

```csharp
ViewData["IsHomePage"] = false;
```

Bu CMS field'ı değildir. Yalnız ana sayfadaki geniş `ykb-home-search` alanını kontrol eder. Header partial'ı, `ViewData` nesnesi üçüncü parametreyle iletildiği için bu değeri görür.

## 11. Static file sunumunu doğrulayın

Hedef projenin mevcut sürümüne uygun static asset middleware'i zaten çalışıyor olmalıdır:

- Klasik ASP.NET Core yapısında `app.UseStaticFiles()`.
- Yeni static web assets yapısında projenin mevcut `MapStaticAssets`/endpoint konfigürasyonu.

Tarayıcıdan aşağıdaki adreslerin 200 döndüğünü doğrulayın:

```text
/css/header.css
/css/footer.css
/js/header.js
/js/footer.js
/assets/icomoon.woff2
/assets/yapikredi-logo.svg
/assets/pin-yapikredi.svg
```

Google Fonts şirket Content Security Policy tarafından engelleniyorsa Ubuntu font dosyalarını şirket CDN/static asset alanından sunun ve iki CSS dosyasındaki Google Fonts `@import` satırlarını kaldırın. İkon fontunu kaldırmayın.

## 12. Kentico page tree'yi doldurun

İlk kurulumda `KENTICO-13-MINIMUM-WORKING-PAGE-TREE.md` belgesini uygulayın. Belgede:

- Oluşturulacak minimum node'lar.
- Her node'un tam yeri ve sırası.
- Başlık ve URL değerleri.
- Role ve icon dropdown seçimleri.
- Desktop, mobile, promote ve new-tab checkbox seçimleri.
- Footer görselleri ve bildirim/duyuru örnekleri.

`NavigationRole` değerleri büyük/küçük harf duyarlıdır. Özellikle `Tab`, `CustomerAcquisition`, `InternetBranch` ve `MobileQuickLinks` değerlerini elle farklı yazmayın; dropdown'dan seçin.

`Announcements` klasörü boş kalabilir. Boşsa şerit hiç görünmez. Bir duyuru varsa metin görünür fakat oklar gizlenir; iki veya daha fazla duyuru varsa otomatik geçiş ve yön butonları çalışır.

## 13. Eski header/footer kodunu devreden çıkarın

Yeni bileşen veri alıp render edildikten sonra:

1. Eski header ve footer partial çağrılarını layout'tan kaldırın.
2. Eski markup'ın kullandığı header/footer CSS bundle girişlerini kaldırın.
3. Eski header/footer JavaScript başlangıçlarını kaldırın.
4. Aynı ID veya genel class'ları üreten eski widget/section'ları kaldırın.
5. Yeni `header.js` ve `footer.js` dosyalarının yalnız bir kez yüklendiğini doğrulayın.

Eski ve yeni bileşenleri aynı anda bırakmak çift click handler, çakışan `position: fixed`, yanlış z-index ve farklı font boyutlarına neden olur.

## 14. Build ve kabul testleri

Önce çalışan live-site uygulamasını durdurun. Aksi halde Windows, çıktı `.exe` dosyasını kilitleyebilir. Ardından clean zorunlu olmadan normal build alın.

Kontrol sırası:

### Desktop — 1440 px ve 1024 px

- Header ana satırı, logo ve iki sekme doğru hizada.
- Sayfa 32 px scroll olduğunda gri üst bar transition ile yukarı kapanıyor.
- `Kendim İçin` ve `İşim İçin` hover ile açılıyor.
- Sekmeye tıklayınca menü sabit açık kalıyor.
- Diğer sekmeye hover veya sayfa dışına tıklama açık menüyü kapatıyor.
- Müşteri ol, internet şubesi ve bildirim dropdown'ları ayrı çalışıyor.
- Çan ikonu yaklaşık her üç saniyede bir sallanıyor.
- İç sayfada inline arama, ana sayfada geniş orta arama alanı görünüyor.
- Footer kolonları, sosyal logolar ve yasal linkler görünüyor.

### Mobile — 991 px, 768 px ve 390 px

- Desktop header gizleniyor ve mobile header görünüyor.
- Hamburger açıldığında bütün `ykb-mobile-menu` dikey scroll oluyor.
- `Kendim İçin` / `İşim İçin` tab ikonları 24×24 ve `#004990`.
- Menü satırı ikonları `#004990`, chevron rengi `#1f1f1f`.
- Alt seviyeye tıklayınca satırlar soldan sağa transition ile geliyor.
- En derin kredi node'una kadar ilerlenip geri dönülebiliyor.
- Mobil kısayollar ve uygulama mağazası görselleri görünüyor.
- Footer kolonları iki sütunlu link düzenine bölünüyor.

### Duyuru durumları

- `Announcements` boş: şeridin tamamı yok.
- Bir kayıt: şerit var, prev/next yok.
- İki kayıt: prev/next ve otomatik geçiş çalışıyor.
- Hover veya klavye focus sırasında otomatik geçiş duruyor.

## 15. Sık görülen sorunlar

| Belirti | Kontrol |
|---|---|
| `LayoutData hazırlanmadı` | Provider DI kaydı var mı ve action `return View()` öncesinde `LoadLayoutDataAsync` çağırıyor mu? Filter seçildiyse filter kaydı var mı? |
| Menü veya buton görünmüyor | `NavigationMenuKey` ve `NavigationRole` dropdown değeri doğru mu? |
| Mobil alt menü ilerlemiyor | `PathTypeEnum.Children` sorgusu `NestingLevel` ile sınırlandırılmadan bütün seviyeleri alıyor ve `NodeParentID` ile recursive map ediliyor mu? |
| İkon yerine kare çıkıyor | `icomoon.woff2` kopyalandı mı, `../assets/` yolu ve static file cevabı doğru mu? |
| Header içeriğin üstünü kapatıyor | `.ykb-page-content` offset'i var mı? |
| Header'dan sonra büyük boşluk var | Eski page-shell offset'i ile yeni offset birlikte mi uygulanıyor? |
| CSS görünümü farklı | Header/footer CSS global CSS'den sonra mı, eski kurallar hâlâ bundle'da mı? |
| Bundle belirli bir property'yi eziyor | Kazanan selector `!important` mı? Root ID ile son yüklenen `header-footer-compat.css` içinde yalnız o property override edildi mi? |
| Click iki kez çalışıyor | JS dosyası bundle ve script etiketiyle iki kez mi yükleniyor? |
| Desktop aksiyon butonları tıklanınca açılmıyor | `header.js` isteği 200 dönüyor mu, dosya header markup'ından önceyse `defer` var mı, Console'da syntax/minification hatası var mı ve eski `ScriptBundle` yerine bağımsız mı yükleniyor? Konsolda `window.YkbHeader?.init()` çağrısı ile tekrar başlatılabilir. |
| Sosyal başlık boş | `Social` menu root'unda `NavigationMenuTitle=Bizi Takip Edin` girildi mi? |
| Footer görselleri yok | Kentico media field DTO'ya URL/path olarak map ediliyor mu? |
| Duyuru klasörü boş ama şerit var | Güncel `Footer.cshtml` kopyalandı mı? `announcements.Count > 0` koşulu bulunmalı |
| Build sırasında `.exe locked` | Çalışan live-site/IIS Express sürecini durdurup tekrar build alın |

Bu sırayla ilerlediğinizde demo fallback'i olmadan, tüm header/footer içeriği Kentico'dan gelir ve bu projedeki HTML/CSS/JavaScript davranışı korunur.
