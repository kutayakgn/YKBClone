using YkbYapikredi.Application.Navigation;
namespace YkbYapikredi.Application.Layout;
/// <summary>/// View'ların gördüğü hazır header/footer verisi./// Menüler içerik ağacı yoluyla değil <see cref="MenuKeys"/> anahtarlarıyla taşınır./// </summary>public sealed class LayoutData{
    /// <summary>Header'ın gri üst şeridi. Düz liste; bölüm içermez.</summary>public IReadOnlyList<NavigationNodeDto> HeaderTopLinks { get; init; } = [];

    /// <summary>Kendim İçin / İşim İçin sekmeleri, aksiyonlar ve mobil kısayollar.</summary>public IReadOnlyList<NavigationNodeDto> HeaderTabs { get; init; } = [];

    public IReadOnlyList<HeaderNotificationDto> HeaderNotifications { get; init; } = [];

    /// <summary>Footer kolonları; her öğe bir bölüm, bağlantılar Children alanındadır.</summary>public IReadOnlyList<NavigationNodeDto> FooterColumns { get; init; } = [];

    /// <summary>Footer'ın en altındaki yasal ve yardımcı bağlantılar.</summary>public IReadOnlyList<NavigationNodeDto> FooterBottomLinks { get; init; } = [];

    /// <summary>Blog, FRWRD ve Koç görsel bağlantıları.</summary>public IReadOnlyList<NavigationNodeDto> FooterBrandLinks { get; init; } = [];

    /// <summary>Mobil uygulama mağazası rozetleri.</summary>public IReadOnlyList<NavigationNodeDto> FooterAppLinks { get; init; } = [];

    public IReadOnlyList<AnnouncementDto> Announcements { get; init; } = [];

    public SocialSectionDto Social { get; init; } = new();

    public IReadOnlyList<ModalDto> Modals { get; init; } = [];

    public ModalDto? Modal(string? reference)
    {
        var value = Normalize(reference);

        if (value.Length == 0)
        {
            return null;
        }

        return Modals.FirstOrDefault(modal =>
            string.Equals(modal.Id.ToString(), value, StringComparison.OrdinalIgnoreCase)
            || string.Equals(Normalize(modal.Path), value, StringComparison.OrdinalIgnoreCase)
            || string.Equals(modal.NodeId.ToString(), value, StringComparison.Ordinal));
    }

    private static string Normalize(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        var trimmed = value.Trim().Trim('{', '}');

        if (trimmed.StartsWith('~'))
        {
            trimmed = trimmed[1..];
        }

        return trimmed.Length > 1 ? trimmed.TrimEnd('/') : trimmed;
    }

    public static LayoutData Create(LayoutContent content)
    {
        ArgumentNullException.ThrowIfNull(content);

        var social = content.Menu(MenuKeys.Social);

        return new LayoutData        {
            HeaderTopLinks = content.Menu(MenuKeys.HeaderTop).Items,
            HeaderTabs = content.Menu(MenuKeys.HeaderMain).Items,
            HeaderNotifications = content.HeaderNotifications,
            FooterColumns = content.Menu(MenuKeys.Footer).Items,
            FooterBottomLinks = content.Menu(MenuKeys.FooterLegal).Items,
            FooterBrandLinks = content.Menu(MenuKeys.FooterBrands).Items,
            FooterAppLinks = content.Menu(MenuKeys.FooterApps).Items,
            Announcements = content.Announcements,
            Modals = content.Modals,
            Social = new SocialSectionDto            {
                Title = social.Title,
                Links = social.Items
            }
        };
    }
}
 