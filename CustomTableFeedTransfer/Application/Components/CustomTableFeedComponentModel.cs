using System;
using YkbYapikredi.Application.CustomTableFeeds;

namespace YkbYapikredi.Application.Components;

public sealed class CustomTableFeedComponentModel : IComponentModel
{
    public string ViewName => "~/Views/Shared/Components/_CustomTableFeedComponent.cshtml";
    public Guid Id { get; init; }
    public int NodeId { get; init; }
    public int Order { get; init; }
    public string Title { get; init; } = string.Empty;
    public string TableKey { get; init; } = string.Empty;
    public int PageSize { get; init; }
    public ICustomTableFeedContent? Content { get; init; }
    public string DomId => $"custom-table-feed-{Id:N}";
}
