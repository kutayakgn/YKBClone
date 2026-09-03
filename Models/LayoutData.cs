namespace YkbClone;

/// <summary>
/// Kentico menü düğümlerinin MVC tarafındaki sade karşılığıdır.
/// Children alanı sayesinde menü derinliği sabit değildir.
/// </summary>
public sealed class NavigationNodeDto
{
    public string Id { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string Url { get; init; } = string.Empty;
    public string IconCssClass { get; init; } = string.Empty;
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
    public const string Social = "Social";
}

/// <summary>
/// Kentico repository/service katmanının LayoutData oluştururken sağladığı içerik paketi.
/// </summary>
public sealed class LayoutContent
{
    private readonly IReadOnlyDictionary<string, MenuContent> _menus;

    public LayoutContent(
        IReadOnlyDictionary<string, MenuContent> menus,
        IReadOnlyList<AnnouncementDto>? announcements = null,
        IReadOnlyList<HeaderNotificationDto>? headerNotifications = null)
    {
        _menus = menus;
        Announcements = announcements ?? [];
        HeaderNotifications = headerNotifications ?? [];
    }

    public IReadOnlyList<AnnouncementDto> Announcements { get; }
    public IReadOnlyList<HeaderNotificationDto> HeaderNotifications { get; }

    public MenuContent Menu(string key) =>
        _menus.TryGetValue(key, out var menu) ? menu : new MenuContent();
}

public sealed class LayoutData
{
    /// <summary>Header'ın gri üst şeridi. Düz liste — bölüm yok.</summary>
    public IReadOnlyList<NavigationNodeDto> HeaderTopLinks { get; init; } = [];

    /// <summary>Ana gezinme sekmeleri (Kendim İçin / İşim İçin) ve alt linkleri.</summary>
    public IReadOnlyList<NavigationNodeDto> HeaderTabs { get; init; } = [];

    public IReadOnlyList<HeaderNotificationDto> HeaderNotifications { get; init; } = [];

    /// <summary>Footer kolonları; her biri bölüm, linkler çocuklarında.</summary>
    public IReadOnlyList<NavigationNodeDto> FooterColumns { get; init; } = [];

    /// <summary>Footer'ın en altındaki yasal linkler. Düz liste.</summary>
    public IReadOnlyList<NavigationNodeDto> FooterBottomLinks { get; init; } = [];

    public IReadOnlyList<AnnouncementDto> Announcements { get; init; } = [];

    public SocialSectionDto Social { get; init; } = new();

    public static LayoutData Create(LayoutContent content)
    {
        var social = content.Menu(MenuKeys.Social);

        return new LayoutData
        {
            HeaderTopLinks = content.Menu(MenuKeys.HeaderTop).Items,
            HeaderTabs = content.Menu(MenuKeys.HeaderMain).Items,
            FooterColumns = content.Menu(MenuKeys.Footer).Items,
            FooterBottomLinks = content.Menu(MenuKeys.FooterLegal).Items,
            Social = new SocialSectionDto { Title = social.Title, Links = social.Items },
            Announcements = content.Announcements,
            HeaderNotifications = content.HeaderNotifications,
        };
    }
}
