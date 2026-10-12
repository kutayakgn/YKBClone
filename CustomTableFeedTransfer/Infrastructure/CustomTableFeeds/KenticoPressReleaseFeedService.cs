using System;
using System.Collections.Generic;
using System.Data;
using System.Globalization;
using System.Linq;
using CMS.CustomTables;
using CMS.Helpers;
using CMS.MediaLibrary;
using CMS.SiteProvider;
using YkbYapikredi.Application.CustomTableFeeds;

namespace YkbYapikredi.Infrastructure.CustomTableFeeds;

public sealed class KenticoPressReleaseFeedService : IPressReleaseFeedService
{
    public IReadOnlyList<int> GetYears()
    {
        // SQL DISTINCT YEAR, not loading every report merely to build a dropdown.
        var data = CustomTableItemProvider.GetItems(CustomTableFeedSchema.BasinBultenleri)
            .WhereGreaterOrEquals("Date", new DateTime(1900, 1, 1))
            .Columns("YEAR([Date]) AS ReportYear").Distinct().Result;
        return data.Tables[0].Rows.Cast<DataRow>()
            .Select(row => ValidationHelper.GetInteger(row["ReportYear"], 0))
            .Where(year => year >= 1900 && year < 9999).OrderByDescending(year => year).ToArray();
    }

    public PressReleaseResult Search(int? category, string period, int page, int pageSize)
    {
        if (category.HasValue && !PressReleaseCategories.Contains(category.Value))
            throw new ArgumentException("Geçersiz kategori.", nameof(category));
        period = period?.Trim() ?? string.Empty;
        DateTime? from = null, until = null;
        if (period == "3m")
        {
            // Uses the CMS/server local date consistently for all requests.
            var today = DateTime.Today;
            from = today.AddMonths(-3);
            until = today.AddDays(1);
        }
        else if (period.Length > 0)
        {
            if (!int.TryParse(period, NumberStyles.None, CultureInfo.InvariantCulture, out var year) || year < 1900 || year >= 9999)
                throw new ArgumentException("Geçersiz tarih seçimi.", nameof(period));
            from = new DateTime(year, 1, 1);
            until = from.Value.AddYears(1);
        }
        var query = CustomTableItemProvider.GetItems(CustomTableFeedSchema.BasinBultenleri)
            .WhereGreaterOrEquals("Date", new DateTime(1900, 1, 1));
        // Retain every returned query, including when the provider uses an
        // immutable query instance. Otherwise added filters can be discarded.
        if (category.HasValue) query = query.WhereEquals("Category", category.Value);
        if (from.HasValue) query = query.WhereGreaterOrEquals("Date", from.Value);
        if (until.HasValue) query = query.WhereLessThan("Date", until.Value);
        query = query.OrderBy("Date DESC", "ItemID DESC");
        pageSize = Math.Max(0, pageSize);
        var pagination = pageSize > 0;
        page = pagination ? Math.Max(1, Math.Min(page, Math.Max(1, int.MaxValue / Math.Max(1, pageSize)))) : 1;
        if (pagination) query = query.Page(page - 1, pageSize);
        var items = query.ToArray();
        var total = pagination ? query.TotalRecords : items.Length;
        var pages = pagination ? (int)Math.Ceiling(total / (double)pageSize) : 0;
        // Records may have been deleted since the previous response.
        if (pagination && page > Math.Max(1, pages))
            return Search(category, period, Math.Max(1, pages), pageSize);
        return new PressReleaseResult
        {
            Page = page, TotalPages = pages, TotalRecords = total,
            Rows = items.Select(item => new PressReleaseRow
            {
                Title = ValidationHelper.GetString(item.GetValue("Title"), string.Empty),
                Date = ValidationHelper.GetDateTime(item.GetValue("Date"), DateTime.MinValue),
                Detail = ValidationHelper.GetString(item.GetValue("Detail"), string.Empty),
                MediaUrl = MediaUrl(ValidationHelper.GetString(item.GetValue("Media"), string.Empty))
            }).ToArray()
        };
    }

    private static string MediaUrl(string value)
    {
        if (!Guid.TryParse(value.Trim(), out var guid)) return FeedUrls.Safe(value);
        var file = MediaFileInfoProvider.GetMediaFileInfo(guid, SiteContext.CurrentSiteName);
        if (file is null) return string.Empty;
        return "/getmedia/" + guid.ToString("D") + "/" + Uri.EscapeDataString(file.FileName + file.FileExtension);
    }
}
