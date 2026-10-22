using YkbYapikredi.Application.CustomTableFeeds;

namespace YkbYapikredi.Infrastructure.CustomTableFeeds;

public sealed class IpoCalendarSource : ICustomTableFeedSource
{
    private readonly KenticoCustomTableReader reader;
    private readonly IpoCalendarMapper mapper;

    public IpoCalendarSource(KenticoCustomTableReader reader, IpoCalendarMapper mapper)
    {
        this.reader = reader;
        this.mapper = mapper;
    }

    public string Key => IpoCalendarSchema.FeedKey;

    public ICustomTableFeedContent Load() =>
        mapper.Map(reader.Read(IpoCalendarSchema.TableClassName));
}
