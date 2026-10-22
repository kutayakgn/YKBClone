using System;
using System.Collections.Generic;
using System.Linq;

namespace YkbYapikredi.Application.Components;

public sealed class VideoCardListComponentModel : IComponentModel
{
    public string ViewName =>
        "~/Views/Shared/Components/_VideoCardListComponent.cshtml";

    public int NodeId { get; init; }
    public Guid Id { get; init; }
    public int Order { get; init; }
    public string Name { get; init; } = string.Empty;
    public int PageSize { get; init; }

    // CMS alan adı kullanıcıdaki mevcut yazımla aynıdır.
    public bool IsFliterActive { get; init; } = true;
    public bool IsTitleVisible { get; init; } = true;
    public int RowCardCount { get; init; } = 3;

    public IReadOnlyList<VideoCardItemComponentModel> Items { get; init; } =
        Array.Empty<VideoCardItemComponentModel>();

    public string DomId => $"video-card-list-{Id:N}";

    public IReadOnlyList<int> Years => Items
        .Select(item => item.Year)
        .Where(year => year > 0)
        .Distinct()
        .OrderByDescending(year => year)
        .ToArray();
}
