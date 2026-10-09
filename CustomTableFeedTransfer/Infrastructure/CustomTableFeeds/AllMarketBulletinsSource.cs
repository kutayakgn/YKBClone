namespace YkbYapikredi.Infrastructure.CustomTableFeeds;

public sealed class AllMarketBulletinsSource : BulletinSourceBase
{
    public AllMarketBulletinsSource(KenticoCustomTableReader reader) : base(reader) { }
    public override string Key => "AllMarketBulletins";
    protected override string ClassName => CustomTableFeedSchema.AllMarketBulletins;
    protected override string ViewName => "~/Views/Shared/CustomTableFeeds/_AllMarketBulletins.cshtml";
}
