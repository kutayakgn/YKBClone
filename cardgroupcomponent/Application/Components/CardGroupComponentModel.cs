using System;
using System.Collections.Generic;
using System.Linq;

namespace YkbYapikredi.Application.Components;

public sealed class CardGroupComponentModel : IComponentModel
{
    public const string View = "~/Views/Shared/Components/_CardGroupComponent.cshtml";
    public int Order { get; init; }
    public Guid GroupId { get; init; }
    public string Culture { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public int PageSize { get; init; }
    public int CurrentPage { get; init; } = 1;
    public int TotalCards { get; init; }
    public IReadOnlyList<IComponentModel> Cards { get; init; } = Array.Empty<IComponentModel>();
    public string ViewName => View;
    public int TotalPages => PageSize > 0 ? (int)Math.Ceiling(TotalCards / (double)PageSize) : 0;
    // Initial mapping keeps the full tree for existing modal-reference collection.
    // AJAX mapping puts only the requested page into Cards.
    public IEnumerable<IComponentModel> VisibleCards => PageSize > 0 ? Cards.Take(PageSize) : Cards;
}
