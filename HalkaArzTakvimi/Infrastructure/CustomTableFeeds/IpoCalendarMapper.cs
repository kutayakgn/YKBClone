using System;
using System.Collections.Generic;
using System.Linq;
using CMS.CustomTables;
using CMS.Helpers;
using YkbYapikredi.Application.CustomTableFeeds;

namespace YkbYapikredi.Infrastructure.CustomTableFeeds;

// Bu bir custom table satır mapper'ıdır. TreeNode alan IComponentMapper kullanılmaz.
public sealed class IpoCalendarMapper
{
    public IpoCalendarContent Map(IEnumerable<CustomTableItem> items)
    {
        return new IpoCalendarContent
        {
            Items = items.Select(MapItem)
                .OrderByDescending(item => item.StartDate)
                .ThenBy(item => item.ItemId)
                .ToArray()
        };
    }

    private static IpoCalendarItemModel MapItem(CustomTableItem item)
    {
        var id = ValidationHelper.GetInteger(item.GetValue("ItemID"), 0);
        var month = ValidationHelper.GetInteger(item.GetValue("Month"), 0);
        var year = ValidationHelper.GetInteger(item.GetValue("Year"), 0);
        if (!IpoCalendarDates.TryNormalize(Text(item, "Days"), month, year,
            out var days, out var text, out var startDate, out var error))
            throw new InvalidOperationException($"IpoCalendar ItemID={id}: {error}");
        return new IpoCalendarItemModel
        {
            ItemId = id,
            StockCode = Text(item, "StockCode"),
            Title = Text(item, "Title"),
            Days = days,
            Month = month,
            Year = year,
            DisplayDate = text,
            StartDate = startDate,
            Image = FeedUrls.Safe(Text(item, "Image")),
            Url = FeedUrls.Safe(Text(item, "Url"))
        };
    }

    private static string Text(CustomTableItem item, string field) =>
        ValidationHelper.GetString(item.GetValue(field), string.Empty).Trim();
}
