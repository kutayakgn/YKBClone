using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using YkbYapikredi.Application.CustomTableFeeds;

namespace YkbYapikredi.Infrastructure.CustomTableFeeds;

public static class FundGuideServiceCollectionExtensions
{
    public static IServiceCollection AddFundGuideFeed(this IServiceCollection services)
    {
        services.TryAddSingleton<KenticoCustomTableReader>();
        services.TryAddSingleton<FundGuideMapper>();
        services.TryAddEnumerable(ServiceDescriptor.Singleton<ICustomTableFeedSource, FundGuideSource>());
        return services;
    }
}
