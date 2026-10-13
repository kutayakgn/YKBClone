using System;
using System.Collections.Generic;
using System.Linq;
using CMS.DocumentEngine;
using CMS.Helpers;
using YkbYapikredi.Application.Components;
using CmsCardGroupComponent = CMS.DocumentEngine.Types.YkbYapikredi.CardGroupComponent;

namespace YkbYapikredi.Infrastructure.Components.Mappers;

public sealed class CardGroupComponentMapper : IContainerComponentMapper
{
    public string ClassName => CmsCardGroupComponent.CLASS_NAME;
    public IComponentModel Map(TreeNode node) => Map(node, Array.Empty<IComponentModel>());
    public IComponentModel Map(TreeNode node, IReadOnlyList<IComponentModel> children) =>
        new CardGroupComponentModel
        {
            GroupId = node.NodeGUID,
            Culture = node.DocumentCulture,
            Order = node.NodeOrder,
            // GetValue avoids requiring a hand-edited generated PageSize property.
            Title = ValidationHelper.GetString(node.GetValue("Title"), string.Empty),
            PageSize = Math.Max(0, ValidationHelper.GetInteger(node.GetValue("PageSize"), 0)),
            CurrentPage = 1,
            TotalCards = children.Count,
            Cards = children.ToArray()
        };
}
