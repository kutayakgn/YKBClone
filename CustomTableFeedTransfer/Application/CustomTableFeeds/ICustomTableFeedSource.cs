namespace YkbYapikredi.Application.CustomTableFeeds;

public interface ICustomTableFeedSource
{
    string Key { get; }
    ICustomTableFeedContent Load();
    // Old sources keep their existing implementation.
    ICustomTableFeedContent Load(int pageSize) => Load();
}
