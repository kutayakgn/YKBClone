using System;
using CMS.DocumentEngine;
using CMS.Helpers;
using YkbYapikredi.Application.Components;
using YkbYapikredi.Application.CustomTableFeeds;
using YkbYapikredi.Infrastructure.CustomTableFeeds;

namespace YkbYapikredi.Infrastructure.Components.Mappers;

public sealed class CustomTableFeedComponentMapper : IComponentMapper
{
    private readonly ICustomTableFeedProvider provider;
    public CustomTableFeedComponentMapper(ICustomTableFeedProvider provider) { this.provider = provider; }
    public string ClassName => CustomTableFeedSchema.ComponentClassName;

    public IComponentModel Map(TreeNode node)
    {
        var key = ValidationHelper.GetString(node.GetValue("TableKey"), string.Empty).Trim();
        return new CustomTableFeedComponentModel
        {
            Id = node.NodeGUID,
            NodeId = node.NodeID,
            Order = node.NodeOrder,
            Title = ValidationHelper.GetString(node.GetValue("Title"), string.Empty).Trim(),
            TableKey = key,
            PageSize = Math.Max(0, ValidationHelper.GetInteger(node.GetValue("PageSize"), 0)),
            Content = string.IsNullOrWhiteSpace(key) ? null : provider.Load(key)
        };
    }
}
