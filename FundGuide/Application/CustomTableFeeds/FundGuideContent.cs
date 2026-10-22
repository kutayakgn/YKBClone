using System;
using System.Collections.Generic;
using System.Linq;

namespace YkbYapikredi.Application.CustomTableFeeds;

public sealed class FundGuideContent : ICustomTableFeedContent
{
    public string Kind => "fund-guide";
    public string ViewName => "~/Views/Shared/CustomTableFeeds/_FundGuide.cshtml";
    public IReadOnlyList<FundGuideItemModel> Items { get; init; } = Array.Empty<FundGuideItemModel>();
    public IReadOnlyList<int> Years => Items.Select(item => item.Year).Distinct().OrderByDescending(year => year).ToArray();
}

public sealed class FundGuideItemModel
{
    public int ItemId { get; init; }
    public int Year { get; init; }
    public int Month { get; init; }
    public string FundCode { get; init; } = string.Empty;
    public string FundName { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string FileUrl { get; init; } = string.Empty;
    public bool IsMonthly => Year >= 2026;
}
