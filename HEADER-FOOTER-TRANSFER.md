# Header/footer şirket projesine aktarım paketi

Razor dosyaları doğrudan şirket projesindeki şu namespace'leri kullanır:

```csharp
using YkbYapikredi.Application.Navigation;
using YkbYapikredi.Application.Layout;
```

## Kopyalanacak dosyalar

| Bu projedeki dosya | Şirket projesindeki önerilen hedef |
|---|---|
| `Models/NavigationModels.cs` | `Application/Navigation/NavigationModels.cs` içindeki mevcut DTO'larla birleştir |
| `Models/LayoutData.cs` | `Application/Layout/LayoutData.cs` |
| `Views/Shared/Header.cshtml` | `Views/Shared/Header.cshtml` |
| `Views/Shared/Footer.cshtml` | `Views/Shared/Footer.cshtml` |
| `wwwroot/css/header.css` | `wwwroot/css/header.css` |
| `wwwroot/css/footer.css` | `wwwroot/css/footer.css` |
| `wwwroot/js/header.js` | `wwwroot/js/header.js` |
| `wwwroot/js/footer.js` | `wwwroot/js/footer.js` |
| `wwwroot/assets/icomoon.woff2` | `wwwroot/assets/icomoon.woff2` |
| `wwwroot/assets/yapikredi-logo.svg` | `wwwroot/assets/yapikredi-logo.svg` |
| `wwwroot/assets/pin-yapikredi.svg` | `wwwroot/assets/pin-yapikredi.svg` |

Bildirim görselleri ile footer marka/uygulama görselleri üretimde Kentico medya alanlarından gelir. Demo içindeki `notification-credit.png` ve `notification-mobile.png` zorunlu paket dosyaları değildir.

CSS dosyalarındaki icon font adresi `../assets/icomoon.woff2` olarak göreli tanımlıdır. CSS ve assets klasörleri yukarıdaki düzende kopyalanırsa uygulama sanal dizin altında çalışsa da font yolu bozulmaz.

## `_ViewImports.cshtml`

Şirket projesinin `Views/_ViewImports.cshtml` dosyasına ekleyin:

```cshtml
@using YkbYapikredi.Application.Layout
@using YkbYapikredi.Application.Navigation
@addTagHelper *, Microsoft.AspNetCore.Mvc.TagHelpers
```

Partial dosyalarında da gerekli `@using` satırları bulunduğu için farklı bir ViewImports kapsamına taşınmaları halinde model çözümlemesi devam eder.

## Üretim `_Layout.cshtml` entegrasyonu

`LayoutData` action filter, base controller veya mevcut layout servisi tarafından `ViewData` içine daha önce konmuş olmalıdır. Layout içinden Kentico sorgusu yapılmaz.

```cshtml
@using YkbYapikredi.Application.Layout
@{
    var layoutData = ViewData["LayoutData"] as LayoutData
        ?? throw new InvalidOperationException("LayoutData hazırlanmadı.");

    // Ana sayfa action'ında true verin. Diğer sayfalarda false kalır.
    var isHomePage = ViewData["IsHomePage"] as bool? ?? false;
    ViewData["IsHomePage"] = isHomePage;
}
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />

    @* Şirketin global/framework CSS'inden sonra yükleyin. *@
    <link rel="stylesheet" href="~/css/header.css" asp-append-version="true" />
    <link rel="stylesheet" href="~/css/footer.css" asp-append-version="true" />

    @await RenderSectionAsync("Styles", required: false)
</head>
<body class="@(isHomePage ? "home-page" : "inner-page")">
    @await Html.PartialAsync("Header", layoutData, ViewData)

    <main role="main">
        @RenderBody()
    </main>

    @await Html.PartialAsync("Footer", layoutData, ViewData)

    @* jQuery/Owl Carousel gerekmez. Dosyaları yalnızca bir kez yükleyin. *@
    <script src="~/js/header.js" asp-append-version="true"></script>
    <script src="~/js/footer.js" asp-append-version="true"></script>
    @await RenderSectionAsync("Scripts", required: false)
</body>
</html>
```

Ana sayfa action'ında:

```csharp
ViewData["IsHomePage"] = true;
```

Diğer sayfalarda alanı vermeyebilir veya `false` atayabilirsiniz. Bu değer yalnızca ana sayfaya özgü geniş arama bandını kontrol eder.

## `LayoutData`nın hazırlanması

Mevcut controller yaklaşımı korunacaksa:

```csharp
var content = await _layoutContentProvider.GetAsync(
    CultureInfo.CurrentUICulture.Name,
    HttpContext.RequestAborted);

ViewData["LayoutData"] = LayoutData.Create(content);
```

Bunu her action'da tekrarlamamak için global action filter kullanılabilir:

```csharp
using System.Globalization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using YkbYapikredi.Application.Layout;

public sealed class LayoutDataFilter(ILayoutContentProvider provider) : IAsyncActionFilter
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

Kayıt:

```csharp
services.AddScoped<LayoutDataFilter>();
services.AddControllersWithViews(options =>
    options.Filters.AddService<LayoutDataFilter>());
```

`ILayoutContentProvider` şirket projesindeki Kentico repository/service abstraction'ıdır; doğrudan Razor'a Kentico bağımlılığı taşınmaz.

## Eski `LayoutData`ya eklenecek alanlar

Gönderilen sınıfta eksik olan footer alanları şunlardır:

```csharp
public IReadOnlyList<NavigationNodeDto> FooterBrandLinks { get; init; } = [];
public IReadOnlyList<NavigationNodeDto> FooterAppLinks { get; init; } = [];
```

`Create` metoduna da şunlar eklenmelidir:

```csharp
FooterBrandLinks = content.Menu(MenuKeys.FooterBrands).Items,
FooterAppLinks = content.Menu(MenuKeys.FooterApps).Items,
```

Tam ve derlenebilir sürüm `Models/LayoutData.cs` dosyasındadır. `YKB.HeaderSettings` ve `YKB.FooterSettings` page type'larına gerek yoktur; logo yolları, arama adresi, duyuru başlıkları, süre ve copyright gibi sabitler kod tarafından yönetilir.

## CSS çakışmasını önleme

- `header.css` ve `footer.css` global Bootstrap/site CSS'inden sonra yüklenmelidir.
- Eski header/footer CSS blokları yeni dosyalarla birlikte bırakılmamalıdır; aynı class'lara iki farklı kural uygulanır.
- `header.js` ve `footer.js` bundle içine alınıyorsa ayrıca `<script>` etiketiyle tekrar yüklenmemelidir.
- Header/footer JavaScript'i jQuery, Bootstrap JS veya Owl Carousel istemez.
- Projenin Content Security Policy'si Google Fonts'u engelliyorsa Ubuntu fontu şirket CDN'inden sunulmalı ve iki CSS dosyasındaki `@import` kaldırılmalıdır.
