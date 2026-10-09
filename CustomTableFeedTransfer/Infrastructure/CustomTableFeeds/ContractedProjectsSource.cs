using System.Linq;
using CMS.Helpers;
using YkbYapikredi.Application.CustomTableFeeds;

namespace YkbYapikredi.Infrastructure.CustomTableFeeds;

public sealed class ContractedProjectsSource : ICustomTableFeedSource
{
    private readonly KenticoCustomTableReader reader;
    public ContractedProjectsSource(KenticoCustomTableReader reader) { this.reader = reader; }
    public string Key => "ContractedProjects";

    public ICustomTableFeedContent Load() => new ContractedProjectsContent
    {
        Rows = reader.Read(CustomTableFeedSchema.ContractedProjects)
            .Select(item => new ContractedProjectRow
            {
                ProjectName = Text(item.GetValue("ProjectName")),
                FirmName = Text(item.GetValue("FirmName")),
                Image = FeedUrls.Safe(Text(item.GetValue("Image"))),
                District = Text(item.GetValue("District")),
                City = Text(item.GetValue("City")),
                WebsiteUrl = FeedUrls.Safe(Text(item.GetValue("WebsiteUrl"))),
                Branch = Text(item.GetValue("Branch")),
                Phone = Text(item.GetValue("Phone"))
            }).ToArray()
    };

    private static string Text(object value) => ValidationHelper.GetString(value, string.Empty).Trim();
}
