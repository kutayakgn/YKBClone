using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using YkbYapikredi.Application.Layout;

namespace YkbYapikredi.Infrastructure.Layout;

public static class RichTextModalServiceCollectionExtensions
{
    public static IServiceCollection AddRichTextModals(this IServiceCollection services)
    {
        // Reuse the current modal mapper, preserving its configured modal types.
        services.TryAddTransient<ModalDtoMapper>();
        services.TryAddScoped<IRichTextModalProvider, KenticoRichTextModalProvider>();
        return services;
    }
}
