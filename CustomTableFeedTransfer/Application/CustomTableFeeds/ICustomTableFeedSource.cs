namespace YkbYapikredi.Application.CustomTableFeeds;

public interface ICustomTableFeedSource
{
    string Key { get; }
    ICustomTableFeedContent Load();
}
