using System;
using System.Collections.Generic;
using System.Linq;
using CMS.DocumentEngine;
using CMS.Helpers;
using CMS.SiteProvider;
using YkbYapikredi.Application.Components;
using CmsCardGroupComponent = CMS.DocumentEngine.Types.YkbYapikredi.CardGroupComponent;

namespace YkbYapikredi.Infrastructure.Components;

public sealed class CardGroupPaginationService : ICardGroupPaginationService
{
    private readonly IComponentRegistry registry;
    private readonly HashSet<string> containerClasses;

    public CardGroupPaginationService(IComponentRegistry registry, IEnumerable<ComponentMapperRegistration> registrations)
    {
        this.registry = registry;
        containerClasses = new HashSet<string>(registrations
            .Where(item => item.Mapper is IContainerComponentMapper)
            .Select(item => item.Mapper.ClassName), StringComparer.OrdinalIgnoreCase);
    }

    public CardGroupComponentModel? GetPage(Guid groupId, string culture, int page)
    {
        if (groupId == Guid.Empty || string.IsNullOrWhiteSpace(culture) || culture.Length > 40 || page < 1)
            return null;
        var group = DocumentHelper.GetDocuments(CmsCardGroupComponent.CLASS_NAME)
            .OnSite(SiteContext.CurrentSiteName)
            .WhereEquals("NodeGUID", groupId)
            .Culture(culture).CombineWithDefaultCulture(false).Published()
            // Single-type DocumentQuery already retrieves page type fields.
            .TopN(1).FirstOrDefault();
        if (group is null) return null;

        // Any registered card type is supported; no PromoCard/ImageCard switch.
        var classes = Enum.GetValues(typeof(ComponentModule)).Cast<ComponentModule>()
            .SelectMany(module => registry.GetClassNames(module))
            .Distinct(StringComparer.OrdinalIgnoreCase).ToArray();
        var pageSize = Math.Max(0, ValidationHelper.GetInteger(group.GetValue("PageSize"), 0));
        if (classes.Length == 0) return Model(group, pageSize, 1, 0, Array.Empty<IComponentModel>());

        page = pageSize > 0 ? Math.Min(page, Math.Max(1, int.MaxValue / pageSize)) : 1;
        var query = DocumentHelper.GetDocuments()
            .OnSite(SiteContext.CurrentSiteName)
            .Path(group.NodeAliasPath, PathTypeEnum.Children).NestingLevel(1)
            .Types(classes).Culture(group.DocumentCulture)
            .CombineWithDefaultCulture(false).Published().WithCoupledColumns()
            .OrderBy("NodeOrder", "NodeID");
        if (pageSize > 0) query = query.Page(page - 1, pageSize);
        var roots = query.ToArray();
        var total = pageSize > 0 ? query.TotalRecords : roots.Length;
        var pageCount = pageSize > 0 ? (int)Math.Ceiling(total / (double)pageSize) : 0;
        if (pageSize > 0 && page > Math.Max(1, pageCount))
            return GetPage(groupId, culture, Math.Max(1, pageCount));

        var cards = new List<IComponentModel>();
        foreach (var root in roots)
        {
            IReadOnlyList<IComponentModel> children = Array.Empty<IComponentModel>();
            // Leaf cards need no descendant query. Containers preserve their subtree.
            if (containerClasses.Contains(root.ClassName))
            {
                var descendants = DocumentHelper.GetDocuments()
                    .OnSite(SiteContext.CurrentSiteName)
                    .Path(root.NodeAliasPath, PathTypeEnum.Children)
                    .NestingLevel(ComponentTree.MaxDepth - 1)
                    .Types(classes).Culture(group.DocumentCulture)
                    .CombineWithDefaultCulture(false).Published().WithCoupledColumns()
                    .OrderBy("NodeLevel", "NodeOrder", "NodeID").ToArray();
                children = Build(descendants.Where(node => node.NodeParentID == root.NodeID),
                    descendants.ToLookup(node => node.NodeParentID));
            }
            var mapped = registry.Map(root, children);
            if (mapped is not null) cards.Add(mapped);
        }
        return Model(group, pageSize, page, total, cards);
    }

    private IReadOnlyList<IComponentModel> Build(IEnumerable<TreeNode> nodes, ILookup<int, TreeNode> byParent)
    {
        var result = new List<IComponentModel>();
        foreach (var node in nodes)
        {
            var children = Build(byParent[node.NodeID], byParent);
            var model = registry.Map(node, children);
            if (model is not null) result.Add(model);
        }
        return result;
    }

    private static CardGroupComponentModel Model(TreeNode node, int size, int page, int total, IReadOnlyList<IComponentModel> cards) => new CardGroupComponentModel
    {
        GroupId = node.NodeGUID, Culture = node.DocumentCulture, Order = node.NodeOrder,
        Title = ValidationHelper.GetString(node.GetValue("Title"), string.Empty),
        PageSize = size, CurrentPage = page, TotalCards = total, Cards = cards
    };
}
