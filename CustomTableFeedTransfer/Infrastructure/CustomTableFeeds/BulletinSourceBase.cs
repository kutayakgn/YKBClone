using System;
using System.Linq;
using CMS.Helpers;
using YkbYapikredi.Application.CustomTableFeeds;

namespace YkbYapikredi.Infrastructure.CustomTableFeeds;

public abstract class BulletinSourceBase : ICustomTableFeedSource
{
    private readonly KenticoCustomTableReader reader;
    protected BulletinSourceBase(KenticoCustomTableReader reader) { this.reader = reader; }
    public abstract string Key { get; }
    protected abstract string ClassName { get; }
    protected abstract string ViewName { get; }

    public ICustomTableFeedContent Load() => new BulletinsContent
    {
        ViewName = ViewName,
        Rows = reader.Read(ClassName)
            .Select(item => new BulletinRow
            {
                Date = ValidationHelper.GetDateTime(item.GetValue(CustomTableFeedSchema.BulletinDateField), DateTime.MinValue).Date,
                BulletinType = ValidationHelper.GetString(item.GetValue(CustomTableFeedSchema.BulletinTypeField), string.Empty).Trim(),
                Pdf = FeedUrls.Safe(ValidationHelper.GetString(item.GetValue(CustomTableFeedSchema.BulletinPdfField), string.Empty))
            })
            .Where(row => row.Date != DateTime.MinValue)
            .OrderByDescending(row => row.Date)
            .ToArray()
    };
}
