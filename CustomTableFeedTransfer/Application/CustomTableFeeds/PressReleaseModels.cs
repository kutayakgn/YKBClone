using System;
using System.Collections.Generic;
using System.Linq;

namespace YkbYapikredi.Application.CustomTableFeeds;

public sealed class PressReleaseOption
{
    public string Value { get; init; } = string.Empty;
    public string Label { get; init; } = string.Empty;
}

public static class PressReleaseCategories
{
    public static IReadOnlyList<PressReleaseOption> All { get; } = Array.AsReadOnly(new[]
    {
        new PressReleaseOption { Value = "4", Label = "Kredi Kartları" },
        new PressReleaseOption { Value = "5", Label = "Yapı Kredi" },
        new PressReleaseOption { Value = "9", Label = "Parakende Bankacılık" },
        new PressReleaseOption { Value = "10", Label = "Kurumsal Ve Ticari Bankacılık" },
        new PressReleaseOption { Value = "12", Label = "Sınırsız Bankacılık" },
        new PressReleaseOption { Value = "13", Label = "Özel Bankacılık" },
        new PressReleaseOption { Value = "80", Label = "Invester Relations - In The Press" }
    });
    public static bool Contains(int value) => All.Any(option => option.Value == value.ToString(System.Globalization.CultureInfo.InvariantCulture));
}

public sealed class PressReleaseRow
{
    public string Title { get; init; } = string.Empty;
    public DateTime Date { get; init; }
    public string Detail { get; init; } = string.Empty;
    public string MediaUrl { get; init; } = string.Empty;
}

public sealed class PressReleaseResult
{
    public IReadOnlyList<PressReleaseRow> Rows { get; init; } = Array.Empty<PressReleaseRow>();
    public int Page { get; init; } = 1;
    public int TotalPages { get; init; }
    public int TotalRecords { get; init; }
}

public interface IPressReleaseFeedService
{
    IReadOnlyList<int> GetYears();
    PressReleaseResult Search(int? category, string period, int page, int pageSize);
}
