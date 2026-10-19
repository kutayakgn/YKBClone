using System.Text.RegularExpressions;

namespace YkbYapikredi.Application.Components;

public static class RichTextModalLinks
{
    private static readonly Regex Link = new Regex(
        @"(?<![\w:-])href\s*=\s*[""']#modal-(?:[0-9a-f]{32}|[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})[""']",
        RegexOptions.Compiled | RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

    public static bool Contains(string? html) => !string.IsNullOrWhiteSpace(html) && Link.IsMatch(html);
}
