using System;
using System.Linq;

namespace YkbYapikredi.Application.CustomTableFeeds;

public static class IpoCalendarUrls
{
    // Üçüncü taraf domainlerini yanlışlıkla iç bağlantıya dönüştürmez.
    public static bool TryNormalize(string? value, out string relativeUrl,
        out string reason, string? currentHost = null)
    {
        relativeUrl = (value ?? string.Empty).Trim();
        reason = string.Empty;
        if (relativeUrl.Length == 0)
        { reason = "Url boş."; return false; }
        if (relativeUrl.Any(char.IsControl) || relativeUrl.IndexOf('\\') >= 0)
        { reason = "Url geçersiz karakter içeriyor."; return false; }

        if (relativeUrl.StartsWith("~/", StringComparison.Ordinal))
            relativeUrl = relativeUrl.Substring(1);
        if (relativeUrl.StartsWith("/", StringComparison.Ordinal) &&
            !relativeUrl.StartsWith("//", StringComparison.Ordinal))
            return true;

        var absolute = relativeUrl.StartsWith("//", StringComparison.Ordinal)
            ? "https:" + relativeUrl : relativeUrl;
        if (!Uri.TryCreate(absolute, UriKind.Absolute, out var uri) ||
            (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps) || uri.UserInfo.Length > 0)
        { reason = "HTTP/HTTPS veya site-köküne göre URL değil."; return false; }

        var allowed = string.Equals(uri.IdnHost, "www.yapikredi.com.tr", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(uri.IdnHost, "yapikredi.com.tr", StringComparison.OrdinalIgnoreCase) ||
            (!string.IsNullOrWhiteSpace(currentHost) &&
             string.Equals(uri.IdnHost, currentHost, StringComparison.OrdinalIgnoreCase));
        if (!allowed)
        { reason = "Farklı domain; dış bağlantı korunuyor: " + uri.IdnHost; return false; }
        var result = uri.PathAndQuery + uri.Fragment;
        if (result.StartsWith("//", StringComparison.Ordinal))
        { reason = "Dönüşüm protokol-bağımsız URL oluşturacağı için atlandı."; return false; }
        relativeUrl = result;
        return true;
    }
}
