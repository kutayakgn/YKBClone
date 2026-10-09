using System;

namespace YkbYapikredi.Infrastructure.CustomTableFeeds;

internal static class FeedUrls
{
    public static string Safe(string? value)
    {
        var url = value?.Trim() ?? string.Empty;
        if (url.Length == 0 || url.IndexOf('\\') >= 0) return string.Empty;
        foreach (var character in url)
            if (char.IsControl(character)) return string.Empty;
        if (url.StartsWith("~/", StringComparison.Ordinal)) return url;
        if (url.StartsWith("/", StringComparison.Ordinal) && !url.StartsWith("//", StringComparison.Ordinal)) return url;
        if (Uri.TryCreate(url, UriKind.Absolute, out var uri) &&
            (uri.Scheme == Uri.UriSchemeHttps || uri.Scheme == Uri.UriSchemeHttp)) return url;
        return string.Empty;
    }
}
