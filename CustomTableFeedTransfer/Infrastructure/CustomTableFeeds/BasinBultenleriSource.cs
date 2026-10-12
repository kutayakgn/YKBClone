using YkbYapikredi.Application.CustomTableFeeds;

namespace YkbYapikredi.Infrastructure.CustomTableFeeds;

public sealed class BasinBultenleriSource : ICustomTableFeedSource
{
    public string Key => "BasinBultenleri";
    public ICustomTableFeedContent Load() => new PressReleasesContent();
}
