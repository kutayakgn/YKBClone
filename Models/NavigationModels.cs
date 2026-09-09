namespace YkbYapikredi.Application.Navigation;

/// <summary>
/// Kentico menü düğümünün MVC tarafındaki karşılığıdır.
/// Children ile menü derinliği sabit bir seviyeye bağlı kalmaz.
/// </summary>
public sealed class NavigationNodeDto
{
    public string Id { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string DesktopName { get; init; } = string.Empty;
    public string Url { get; init; } = string.Empty;
    public string IconCssClass { get; init; } = string.Empty;
    public string ImageUrl { get; init; } = string.Empty;
    public string MobileImageUrl { get; init; } = string.Empty;
    public string ImageAlt { get; init; } = string.Empty;
    public string BadgeText { get; init; } = string.Empty;
    public string Role { get; init; } = NavigationRoles.MenuItem;
    public bool OpenInNewTab { get; init; }
    public bool DisplayOnDesktop { get; init; } = true;
    public bool DisplayOnMobile { get; init; } = true;
    public bool PromoteChildrenOnDesktop { get; init; }
    public IReadOnlyList<NavigationNodeDto> Children { get; init; } = [];
}

public static class NavigationRoles
{
    public const string MenuItem = "MenuItem";
    public const string Tab = "Tab";
    public const string CustomerAcquisition = "CustomerAcquisition";
    public const string InternetBranch = "InternetBranch";
    public const string MobileQuickLinks = "MobileQuickLinks";
}

public sealed class HeaderNotificationDto
{
    public string Title { get; init; } = string.Empty;
    public string Url { get; init; } = string.Empty;
    public string ImageUrl { get; init; } = string.Empty;
    public string ImageAlt { get; init; } = string.Empty;
    public bool OpenInNewTab { get; init; }
}

public sealed class AnnouncementDto
{
    public string Title { get; init; } = string.Empty;
    public string Url { get; init; } = string.Empty;
    public bool OpenInNewTab { get; init; }
}

public sealed class SocialSectionDto
{
    public string Title { get; init; } = string.Empty;
    public IReadOnlyList<NavigationNodeDto> Links { get; init; } = [];
}

public sealed class MenuContent
{
    public string Title { get; init; } = string.Empty;
    public IReadOnlyList<NavigationNodeDto> Items { get; init; } = [];
}

public static class MenuKeys
{
    public const string HeaderTop = "HeaderTop";
    public const string HeaderMain = "HeaderMain";
    public const string Footer = "Footer";
    public const string FooterLegal = "FooterLegal";
    public const string FooterBrands = "FooterBrands";
    public const string FooterApps = "FooterApps";
    public const string Social = "Social";
}

/// <summary>Kentico repository katmanının LayoutData'ya verdiği içerik paketi.</summary>
public sealed class LayoutContent
{
    private readonly IReadOnlyDictionary<string, MenuContent> _menus;

    public LayoutContent(
        IReadOnlyDictionary<string, MenuContent> menus,
        IReadOnlyList<AnnouncementDto>? announcements = null,
        IReadOnlyList<HeaderNotificationDto>? headerNotifications = null)
    {
        ArgumentNullException.ThrowIfNull(menus);

        _menus = menus;
        Announcements = announcements ?? [];
        HeaderNotifications = headerNotifications ?? [];
    }

    public IReadOnlyList<AnnouncementDto> Announcements { get; }
    public IReadOnlyList<HeaderNotificationDto> HeaderNotifications { get; }

    public MenuContent Menu(string key) =>
        _menus.TryGetValue(key, out var menu) ? menu : new MenuContent();
}
