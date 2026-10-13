using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using YkbYapikredi.Application.Components;

namespace YkbYapikredi.Infrastructure.Components;

public static class CardGroupPaginationServiceCollectionExtensions
{
    public static IServiceCollection AddCardGroupPagination(this IServiceCollection services)
    {
        services.TryAddScoped<ICardGroupPaginationService, CardGroupPaginationService>();
        return services;
    }
}
