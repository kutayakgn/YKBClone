using System;
using System.Collections.Generic;
using System.Linq;
using CMS.CustomTables;
using CMS.Helpers;
using YkbYapikredi.Application.CustomTableFeeds;

namespace YkbYapikredi.Infrastructure.CustomTableFeeds;

// Custom table satır mapper'ı. PageType mapper'ı mevcut CustomTableFeedComponentMapper'dır.
public sealed class FundGuideMapper
{
    public FundGuideContent Map(IEnumerable<CustomTableItem> monthly, IEnumerable<CustomTableItem> legacy) =>
        new FundGuideContent
        {
            // Legacy satırlarında Month=0; aynı yılın mevcut sırasını ItemID korur.
            Items = monthly.Select(item => MapItem(item, true))
                .Concat(legacy.Select(item => MapItem(item, false)))
                .OrderByDescending(item => item.Year)
                .ThenByDescending(item => item.Month)
                .ThenBy(item => item.ItemId)
                .ToArray()
        };

    private static FundGuideItemModel MapItem(CustomTableItem item, bool monthly)
    {
        var id = Number(item, "ItemID");
        var year = Number(item, "Year");
        var month = monthly ? Number(item, "Month") : 0;
        if ((monthly && (year < 2026 || month < 1 || month > 12)) || (!monthly && (year < 1900 || year >= 2026)))
            throw new InvalidOperationException($"FundGuide ItemID={id}: tabloya uygun Year/Month girin.");
        return new FundGuideItemModel
        {
            ItemId = id, Year = year, Month = month,
            FundCode = monthly ? string.Empty : Text(item, "FundCode"),
            FundName = monthly ? string.Empty : Text(item, "FundName"),
            Title = monthly ? Text(item, "Title") : string.Empty,
            FileUrl = FeedUrls.Safe(Text(item, "FileUrl"))
        };
    }
    private static int Number(CustomTableItem item, string field) => ValidationHelper.GetInteger(item.GetValue(field), 0);
    private static string Text(CustomTableItem item, string field) => ValidationHelper.GetString(item.GetValue(field), string.Empty).Trim();
}
