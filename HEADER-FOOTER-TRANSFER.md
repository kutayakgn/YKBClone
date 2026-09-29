# Desktop header değişikliklerini asıl projeye taşıma

Bu değişiklik yalnız desktop/mobile header ayrımı içindir. Asıl projedeki footer yapısını ve footer page tree'sini değiştirmeyin.

## Zorunlu taşınacak dosyalar

| Bu repodaki dosya | Asıl projedeki karşılığı | Taşınacak değişiklik |
|---|---|---|
| `Models/NavigationModels.cs` | Navigation DTO/model dosyası | `MenuKeys.DesktopHeader`; kaldırılan header alanlarının artık kullanılmaması |
| `Models/LayoutData.cs` | Layout view modeli | `DesktopHeaderItems` ve `MobileHeaderItems` ayrımı |
| `KenticoIntegration/LayoutContentProvider.cs.example` | Gerçek Kentico provider `.cs` dosyası | `DesktopHeader` root'unu okuma; sade `NavigationMenuNode` map'i |
| `Views/Shared/Header.cshtml` | Gerçek header partial'ı | Desktop için `DesktopHeaderItems`, mobil için `MobileHeaderItems` kullanımı |
| `wwwroot/js/header.js` | Gerçek header script'i | Mobil menünün `HeaderMain` ağacını doğrudan kullanması |

`.example` uzantısını asıl projeye taşımayın. İçeriği gerçek `.cs` provider implementasyonuyla birleştirin.

## Naming değişikliği

Provider sınıf adı her yerde `LayoutContentProvider` olmalıdır:

```csharp
public sealed class LayoutContentProvider : ILayoutContentProvider
```

DI kaydı:

```csharp
builder.Services.AddScoped<ILayoutContentProvider, LayoutContentProvider>();
```

Asıl projede eski ad varsa şu noktaları birlikte yeniden adlandırın:

- Dosya: `KenticoLayoutContentProvider.cs` -> `LayoutContentProvider.cs`
- Sınıf ve constructor: `LayoutContentProvider`
- Logger generic tipi: `ILogger<LayoutContentProvider>`
- DI kaydı: `LayoutContentProvider`

Bu repo için örnek kayıt [ProgramRegistration.cs.example](KenticoIntegration/ProgramRegistration.cs.example) içindedir.

## Taşınmaması gerekenler

- `Views/Shared/Footer.cshtml`: Bu iş kapsamında footer değişikliği yoktur.
- Footer page tree kayıtları: Aynen korunur.
- `Models/MockLayoutContent.cs`: Yalnız klon projenin Kentico olmadan çalışması içindir.
- `Models/ModalModels.cs`: Clone-only minimum modeldir; asıl projede mevcut gerçek modal modelini koruyun.
- CSS, font ve görseller: Bu ayrım için değişiklik gerektirmez.

## Navigation model merge'i

`MenuKeys` içine ekleyin:

```csharp
public const string DesktopHeader = "DesktopHeader";
```

Header için aşağıdaki eski alan ve davranışları kullanmayın:

```text
DesktopName
DisplayOnDesktop
DisplayOnMobile
PromoteChildrenOnDesktop
Audience
TargetPage
```

Not: Asıl projede footer'ın kendi view modelinde desktop/mobile görünürlük bilgisi bulunuyorsa onu koruyun. Buradaki talep, `NavigationMenuNode` page type'ına footer için yeni alan eklemek veya footer'ı yeniden modellemek değildir.

`LayoutData` içindeki eski tek header koleksiyonunu iki kaynağa ayırın:

```csharp
public IReadOnlyList<NavigationNodeDto> DesktopHeaderItems { get; init; } = [];
public IReadOnlyList<NavigationNodeDto> MobileHeaderItems { get; init; } = [];
```

Map:

```csharp
DesktopHeaderItems = content.Menu(MenuKeys.DesktopHeader).Items,
MobileHeaderItems = content.Menu(MenuKeys.HeaderMain).Items,
```

## Provider merge'i

`RequiredMenuKeys` listesine ekleyin:

```csharp
MenuKeys.DesktopHeader,
```

Navigation node map'i yalnız generated class'ta bulunan alanları kullanmalıdır:

```csharp
private NavigationNodeDto MapNode(
    NavigationNodePage page,
    ILookup<int, NavigationNodePage> childrenByParent)
{
    var role = Clean(page.NavigationRole);

    return new NavigationNodeDto
    {
        Id = page.NodeGUID.ToString("N"),
        Title = Clean(page.NavigationTitle),
        Url = Clean(page.NavigationUrl),
        IconCssClass = Clean(page.NavigationIconCssClass),
        ImageUrl = Clean(page.NavigationImage),
        MobileImageUrl = Clean(page.NavigationMobileImage),
        ImageAlt = Clean(page.NavigationImageAlt),
        BadgeText = Clean(page.NavigationBadgeText),
        Role = string.IsNullOrEmpty(role) ? NavigationRoles.MenuItem : role,
        OpenInNewTab = page.NavigationOpenInNewTab,
        Children = childrenByParent[page.NodeID]
            .OrderBy(child => child.NodeOrder)
            .Select(child => MapNode(child, childrenByParent))
            .ToArray()
    };
}
```

Şunları taşımayın veya asıl projede varsa kaldırın:

- `NavigationTargetPage` field sabiti ve GUID toplama kodu
- `RetrieveTargetPages`
- `IPageUrlRetriever` dependency'si
- `WhereIn(nameof(TreeNode.NodeGUID), ...)` target sorgusu
- `NavigationAudience` field sabiti ve map'i
- Eski display/promote generated property erişimleri

Bu sadeleştirmeyle bildirilen `Argument 2: cannot convert from 'object[]' to 'CMS.DataEngine.IDataQuery'` hatasını üreten target-page `WhereIn` satırı da tamamen ortadan kalkar.

## Kentico işlemleri

1. `NavigationMenuKey` seçeneklerine `DesktopHeader` ekleyin.
2. `/Shared/Navigation/DesktopHeader` kaydını `YkbYapikredi.NavigationMenu` olarak oluşturun.
3. `Kendim İçin` ve `İşim İçin` kayıtlarını `YkbYapikredi.NavigationMenuNode`, `NavigationRole=Tab` olarak ekleyin.
4. Gösterilecek linkleri aynı page type ile bu tab kayıtlarının altına ekleyin.
5. İç sayfaları tek `NavigationUrl` alanındaki URL selector ile seçin; `NavigationTargetPage` oluşturmayın.
6. Mevcut `HeaderMain` ağacını mobil için kullanmaya devam edin.
7. Footer kayıtlarını değiştirmeyin.

Ayrıntılı field listesi için [KENTICO-13-HEADER-FOOTER-MODEL.md](KENTICO-13-HEADER-FOOTER-MODEL.md), page tree için [KENTICO-13-MINIMUM-WORKING-PAGE-TREE.md](KENTICO-13-MINIMUM-WORKING-PAGE-TREE.md) dosyasını kullanın.

## Kontrol listesi

- Projede `KenticoLayoutContentProvider` adı kalmadı.
- Projede `NavigationTargetPage` ve `NavigationAudience` erişimi kalmadı.
- Provider, paylaşılan generated `NavigationMenuNode` class'ıyla derleniyor.
- Desktop menü yalnız `DesktopHeader` içeriğini gösteriyor.
- Mobil menü mevcut `HeaderMain` içeriğini göstermeye devam ediyor.
- Footer'ın mevcut davranışı ve page tree'si değişmedi.
