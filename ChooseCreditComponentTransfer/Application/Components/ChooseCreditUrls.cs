using System;

namespace YkbYapikredi.Application.Components;

public static class ChooseCreditUrls
{
    // Validate decoded forms too: /%252fevil must not become //evil after decoding.
    public static bool IsSafe(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return false;
        var candidate = value;
        for (var pass = 0; pass < 8; pass++)
        {
            if (!IsSafeForm(candidate)) return false;
            string decoded;
            try { decoded = Uri.UnescapeDataString(candidate); }
            catch (UriFormatException) { return false; }
            if (string.Equals(decoded, candidate, StringComparison.Ordinal)) return true;
            candidate = decoded;
        }
        // Excessive escaping is not a supported CMS destination format.
        return false;
    }

    private static bool IsSafeForm(string value)
    {
        foreach (var character in value)
            if (char.IsControl(character) || character == '\\') return false;

        if (value.StartsWith("~/", StringComparison.Ordinal))
            return value.Length == 2 || value[2] != '/';

        if (value.StartsWith("/", StringComparison.Ordinal))
            return value.Length == 1 || value[1] != '/';

        var prefixLength = value.StartsWith("https://", StringComparison.OrdinalIgnoreCase) ? 8
            : value.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ? 7 : 0;
        if (prefixLength == 0) return false;
        var authorityEnd = value.IndexOfAny(new[] { '/', '?', '#' }, prefixLength);
        var authority = value.Substring(prefixLength,
            (authorityEnd < 0 ? value.Length : authorityEnd) - prefixLength);
        if (authority.Length == 0 || authority.IndexOf('@') >= 0) return false;

        return Uri.TryCreate(value, UriKind.Absolute, out var uri)
            && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps)
            && !string.IsNullOrWhiteSpace(uri.Host)
            && string.IsNullOrEmpty(uri.UserInfo);
    }

}
