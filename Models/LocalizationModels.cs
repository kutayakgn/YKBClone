namespace YkbYapikredi.Application.Localization;

/// <summary>The language link contract used by the imported header.</summary>
public sealed class LanguageOptionDto
{
    public string CultureCode { get; init; } = string.Empty;
    public string ShortName { get; init; } = string.Empty;
    public string NavigationUrl { get; init; } = string.Empty;
}

/// <summary>Uses the source views' Turkish fallbacks while the clone has no CMS resource store.</summary>
public sealed class LayoutLocalizer
{
    public string Get(string key, string fallback) => key switch
    {
        "common.allAnnouncementsUrl" => "https://www.yapikredi.com.tr/yapi-kredi-hakkinda/haberler",
        _ => fallback
    };
}
