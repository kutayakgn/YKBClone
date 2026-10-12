namespace YkbYapikredi.Application.CustomTableFeeds;

public interface ICustomTableFeedProvider
{
    ICustomTableFeedContent Load(string key, int pageSize = 0);
}
