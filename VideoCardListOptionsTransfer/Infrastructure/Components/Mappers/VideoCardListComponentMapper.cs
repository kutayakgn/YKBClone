using System;
using System.Collections.Generic;
using System.Linq;
using CMS.DocumentEngine;
using CMS.Helpers;
using YkbYapikredi.Application.Components;
using CmsVideoCardList = CMS.DocumentEngine.Types.YkbYapikredi.VideoCardList;

namespace YkbYapikredi.Infrastructure.Components.Mappers;

public sealed class VideoCardListComponentMapper : IContainerComponentMapper
{
    public string ClassName => CmsVideoCardList.CLASS_NAME;

    public IComponentModel Map(TreeNode node) =>
        Map(node, Array.Empty<IComponentModel>());

    public IComponentModel Map(
        TreeNode node,
        IReadOnlyList<IComponentModel> children)
    {
        var rowCardCount = ValidationHelper.GetInteger(
            node.GetValue("RowCardCount"), 3);

        return new VideoCardListComponentModel
        {
            NodeId = node.NodeID,
            Id = node.NodeGUID,
            Order = node.NodeOrder,
            Name = ComponentFields.String(node, nameof(CmsVideoCardList.Name)),
            PageSize = Math.Max(0, ValidationHelper.GetInteger(
                node.GetValue(nameof(CmsVideoCardList.PageSize)), 0)),
            IsFliterActive = ValidationHelper.GetBoolean(
                node.GetValue("IsFliterActive"), true),
            IsTitleVisible = ValidationHelper.GetBoolean(
                node.GetValue("IsTitleVisible"), true),
            RowCardCount = rowCardCount > 0 ? rowCardCount : 3,
            Items = children
                .OfType<VideoCardItemComponentModel>()
                .OrderBy(item => item.Order)
                .ToArray()
        };
    }
}
