using CMS.DocumentEngine;
using YkbYapikredi.Application.Components;
using CmsRichTextComponent = CMS.DocumentEngine.Types.YkbYapikredi.RichTextComponent;

namespace YkbYapikredi.Infrastructure.Components.Mappers;

public sealed class RichTextComponentMapper : IComponentMapper
{
    public string ClassName => CmsRichTextComponent.CLASS_NAME;
    public IComponentModel Map(TreeNode node) => new RichTextComponentModel
    {
        Order = node.NodeOrder,
        Content = ComponentFields.String(node, nameof(CmsRichTextComponent.Content))
    };
}
