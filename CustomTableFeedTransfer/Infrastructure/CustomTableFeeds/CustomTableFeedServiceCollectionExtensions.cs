using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using YkbYapikredi.Application.CustomTableFeeds;

namespace YkbYapikredi.Infrastructure.CustomTableFeeds;

public static class CustomTableFeedServiceCollectionExtensions
{
    public static IServiceCollection AddCustomTableFeeds(this IServiceCollection services)
    {
        services.TryAddSingleton<KenticoCustomTableReader>();
        services.TryAddSingleton<ICustomTableFeedProvider, CustomTableFeedProvider>();
        services.TryAddEnumerable(ServiceDescriptor.Singleton<ICustomTableFeedSource, ContractedProjectsSource>());
        services.TryAddEnumerable(ServiceDescriptor.Singleton<ICustomTableFeedSource, AllMarketBulletinsSource>());
        services.TryAddEnumerable(ServiceDescriptor.Singleton<ICustomTableFeedSource, AllAssetAllocationRecommendationsSource>());
        return services;
    }
}
