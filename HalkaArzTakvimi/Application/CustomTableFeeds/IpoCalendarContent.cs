using System;
using System.Collections.Generic;

namespace YkbYapikredi.Application.CustomTableFeeds;

public sealed class IpoCalendarContent : ICustomTableFeedContent
{
    public string Kind => "ipo-calendar";
    public string ViewName => "~/Views/Shared/CustomTableFeeds/_IpoCalendar.cshtml";
    public IReadOnlyList<IpoCalendarItemModel> Items { get; init; } =
        Array.Empty<IpoCalendarItemModel>();
}

public sealed class IpoCalendarItemModel
{
    public int ItemId { get; init; }
    public string StockCode { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string Days { get; init; } = string.Empty;
    public int Month { get; init; }
    public int Year { get; init; }
    public string Image { get; init; } = string.Empty;
    public string Url { get; init; } = string.Empty;
    // Days/Month/Year'dan mapper tarafından hesaplanır; CMS alanı değildir.
    public string DisplayDate { get; init; } = string.Empty;
    public DateTime StartDate { get; init; }
}
