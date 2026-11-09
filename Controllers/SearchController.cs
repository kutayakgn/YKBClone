using System.Globalization;
using Microsoft.AspNetCore.Mvc;
using YKBClone.Models;
using YkbYapikredi.Application.Navigation;

namespace YKBClone.Controllers;

public sealed class SearchController : Controller
{
    private static readonly CompareInfo TurkishComparison = CultureInfo.GetCultureInfo("tr-TR").CompareInfo;

    [HttpGet("/arama")]
    public IActionResult Index(string? q)
    {
        var query = NormalizeQuery(q);
        return View(new SearchViewModel { Query = query, Results = Find(query, 50) });
    }

    [HttpGet("/arama/oneriler")]
    public IActionResult Suggestions(string? q) => Json(Find(NormalizeQuery(q), 6));

    private static string NormalizeQuery(string? value)
    {
        var query = value?.Trim() ?? string.Empty;
        return query.Length > 85 ? query[..85] : query;
    }

    private static IReadOnlyList<SearchResult> Find(string query, int limit)
    {
        if (query.Length < 2)
        {
            return [];
        }

        // This preview has no Kentico search index; use its existing navigation content.
        var content = YkbClone.MockLayoutContent.Create();
        string[] menuKeys = [MenuKeys.HeaderMain, MenuKeys.DesktopHeader, MenuKeys.Footer, MenuKeys.HeaderTop, MenuKeys.FooterLegal];
        return menuKeys.SelectMany(key => Flatten(content.Menu(key).Items))
            .Where(node => !string.IsNullOrWhiteSpace(node.Title) && IsNavigable(node.Url))
            .Where(node => TurkishComparison.IndexOf(node.Title, query, CompareOptions.IgnoreCase | CompareOptions.IgnoreNonSpace) >= 0)
            .DistinctBy(node => node.Url.TrimEnd('/'), StringComparer.OrdinalIgnoreCase)
            .Take(limit)
            .Select(node => new SearchResult(node.Title, node.Url))
            .ToArray();
    }

    private static bool IsNavigable(string url) =>
        (url.StartsWith('/') && !url.StartsWith("//", StringComparison.Ordinal))
        || (Uri.TryCreate(url, UriKind.Absolute, out var uri) && (uri.Scheme == "https" || uri.Scheme == "http"));

    private static IEnumerable<NavigationNodeDto> Flatten(IEnumerable<NavigationNodeDto> nodes)
    {
        foreach (var node in nodes)
        {
            yield return node;
            foreach (var child in Flatten(node.Children))
            {
                yield return child;
            }
        }
    }
}
