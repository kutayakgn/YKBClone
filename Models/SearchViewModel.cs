namespace YKBClone.Models;

public sealed record SearchResult(string Title, string Url);

public sealed class SearchViewModel
{
    public string Query { get; init; } = string.Empty;
    public IReadOnlyList<SearchResult> Results { get; init; } = [];
}
