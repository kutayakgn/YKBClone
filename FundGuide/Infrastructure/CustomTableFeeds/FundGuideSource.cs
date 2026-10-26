using YkbYapikredi.Application.CustomTableFeeds;

namespace YkbYapikredi.Infrastructure.CustomTableFeeds;

public sealed class FundGuideSource : ICustomTableFeedSource
{
    private readonly KenticoCustomTableReader reader;
    private readonly FundGuideMapper mapper;
    public FundGuideSource(KenticoCustomTableReader reader, FundGuideMapper mapper)
    { this.reader = reader; this.mapper = mapper; }
    public string Key => FundGuideSchema.FeedKey;
    public ICustomTableFeedContent Load()
    {
        // Kentico bağlantısında MARS gerektirmemesi için sıralı iki sorgu.
        var monthly = reader.Read(FundGuideSchema.MonthlyTable);
        var legacy = reader.Read(FundGuideSchema.LegacyTable);
        return mapper.Map(monthly, legacy);
    }
}
