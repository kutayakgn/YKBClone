namespace YkbYapikredi.Infrastructure.CustomTableFeeds;

public sealed class AllAssetAllocationRecommendationsSource : BulletinSourceBase
{
    public AllAssetAllocationRecommendationsSource(KenticoCustomTableReader reader) : base(reader) { }
    public override string Key => "AllAssetAllocationRecommendations";
    protected override string ClassName => CustomTableFeedSchema.AllAssetAllocationRecommendations;
    protected override string ViewName => "~/Views/Shared/CustomTableFeeds/_AllAssetAllocationRecommendations.cshtml";
}
