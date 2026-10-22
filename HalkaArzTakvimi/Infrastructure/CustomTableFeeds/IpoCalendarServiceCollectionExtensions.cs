using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using YkbYapikredi.Application.CustomTableFeeds;

namespace YkbYapikredi.Infrastructure.CustomTableFeeds;

public static class IpoCalendarServiceCollectionExtensions
{
    // Mevcut AddCustomTableFeeds() çağrısının ardından çağırın.
    public static IServiceCollection AddIpoCalendarFeed(this IServiceCollection services)
    {
        services.TryAddSingleton<KenticoCustomTableReader>();
        services.TryAddSingleton<IpoCalendarMapper>();
        services.TryAddEnumerable(ServiceDescriptor.Singleton<ICustomTableFeedSource, IpoCalendarSource>());
        return services;
    }
}
