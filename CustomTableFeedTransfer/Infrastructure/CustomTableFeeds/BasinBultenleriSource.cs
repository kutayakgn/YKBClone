using System.Globalization;
using YkbYapikredi.Application.CustomTableFeeds;

namespace YkbYapikredi.Infrastructure.CustomTableFeeds;

public sealed class BasinBultenleriSource : ICustomTableFeedSource
{
    private readonly IPressReleaseFeedService service;
    public BasinBultenleriSource(IPressReleaseFeedService service) { this.service = service; }
    public string Key => "BasinBultenleri";
    public ICustomTableFeedContent Load() => Load(0);
    public ICustomTableFeedContent Load(int pageSize)
    {
        var years = service.GetYears();
        var period = years.Count > 0 ? years[0].ToString(CultureInfo.InvariantCulture) : string.Empty;
        return new PressReleasesContent
        {
            PageSize = pageSize, Years = years, Period = period,
            Result = service.Search(null, period, 1, pageSize)
        };
    }
}
