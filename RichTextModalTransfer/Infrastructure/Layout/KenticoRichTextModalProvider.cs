using System;
using System.Collections.Generic;
using System.Linq;
using CMS.DocumentEngine;
using CMS.SiteProvider;
using YkbYapikredi.Application.Layout;
using YkbYapikredi.Application.Components;
using YkbYapikredi.Infrastructure.Components;
using CmsModal = CMS.DocumentEngine.Types.YkbYapikredi.Modal;

namespace YkbYapikredi.Infrastructure.Layout;

public sealed class KenticoRichTextModalProvider : IRichTextModalProvider
{
    private readonly ModalDtoMapper mapper;
    private readonly IComponentRegistry registry;
    public KenticoRichTextModalProvider(ModalDtoMapper mapper, IComponentRegistry registry)
    { this.mapper = mapper; this.registry = registry; }

    public ModalDto? Get(Guid id, string culture)
    {
        if (id == Guid.Empty || string.IsNullOrWhiteSpace(culture) || culture.Length > 40) return null;
        // One specific, published modal only. No layout provider or modal-pool query.
        var node = DocumentHelper.GetDocuments(CmsModal.CLASS_NAME)
            .OnSite(SiteContext.CurrentSiteName)
            .Path("/Shared/Modals", PathTypeEnum.Children)
            .WhereEquals("NodeGUID", id)
            .Culture(culture).CombineWithDefaultCulture(false)
            .PublishedVersion().Published().TopN(1).FirstOrDefault();
        // Single-type DocumentQuery includes coupled fields automatically.
        if (node is null) return null;
        var modal = mapper.Map(node);
        if (!string.Equals(modal.ModalType.Trim(), "mobile-application", StringComparison.OrdinalIgnoreCase))
            return modal;

        // Only this selected modal's descendants, only for a type needing tabs.
        var classes = Enum.GetValues(typeof(ComponentModule)).Cast<ComponentModule>()
            .SelectMany(module => registry.GetClassNames(module))
            .Distinct(StringComparer.OrdinalIgnoreCase).ToArray();
        if (classes.Length == 0) return modal;
        var descendants = DocumentHelper.GetDocuments()
            .OnSite(SiteContext.CurrentSiteName)
            .Path(node.NodeAliasPath, PathTypeEnum.Children)
            .NestingLevel(ComponentTree.MaxDepth).Types(classes)
            .Culture(culture).CombineWithDefaultCulture(false)
            .PublishedVersion().Published().WithCoupledColumns()
            .OrderBy("NodeLevel", "NodeOrder", "NodeID").ToArray();
        var children = Build(descendants.Where(child => child.NodeParentID == node.NodeID),
            descendants.ToLookup(child => child.NodeParentID));
        return mapper.Map(node, children.OfType<MobileApplicationModalTabComponentModel>().ToArray());
    }

    private IReadOnlyList<IComponentModel> Build(IEnumerable<TreeNode> nodes, ILookup<int, TreeNode> byParent)
    {
        var result = new List<IComponentModel>();
        foreach (var node in nodes)
        {
            var mapped = registry.Map(node, Build(byParent[node.NodeID], byParent));
            if (mapped is not null) result.Add(mapped);
        }
        return result;
    }
}
