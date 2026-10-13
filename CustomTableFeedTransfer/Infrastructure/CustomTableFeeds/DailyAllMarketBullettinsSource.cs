namespace YkbYapikredi.Infrastructure.CustomTableFeeds;

public sealed class DailyAllMarketBullettinsSource : BulletinSourceBase
{
    public DailyAllMarketBullettinsSource(KenticoCustomTableReader reader) : base(reader) { }
    public override string Key => "DailyAllMarketBullettins";
    protected override string ClassName => CustomTableFeedSchema.DailyAllMarketBullettins;
    protected override string ViewName => "~/Views/Shared/CustomTableFeeds/_AllMarketBulletins.cshtml";
}
