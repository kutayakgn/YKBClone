using YkbYapikredi.Application.CustomTableFeeds;

namespace YkbYapikredi.Infrastructure.CustomTableFeeds;

public sealed class HorecaRestaurantsSource : ICustomTableFeedSource
{
    private readonly KenticoCustomTableReader reader;
    private readonly HorecaRestaurantMapper mapper;
    public HorecaRestaurantsSource(KenticoCustomTableReader reader, HorecaRestaurantMapper mapper)
    { this.reader = reader; this.mapper = mapper; }
    public string Key => "HorecaRestaurants";
    public ICustomTableFeedContent Load() => mapper.Map(reader.Read(CustomTableFeedSchema.HorecaRestaurants));
}
