namespace YkbYapikredi.Application.CustomTableFeeds;

public interface ICustomTableFeedContent
{
    bool UsesClientFiltering => true;
    string Kind { get; }
    string ViewName { get; }
}
