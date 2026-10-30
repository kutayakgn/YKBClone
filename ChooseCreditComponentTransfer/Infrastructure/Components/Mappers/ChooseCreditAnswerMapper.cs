using CMS.DocumentEngine;
using CMS.Helpers;
using YkbYapikredi.Application.Components;

namespace YkbYapikredi.Infrastructure.Components.Mappers;

public sealed class ChooseCreditAnswerMapper : IComponentMapper
{
    public string ClassName => "YkbYapikredi.ChooseCreditAnswer";

    public IComponentModel Map(TreeNode node) => new ChooseCreditAnswerModel
    {
        NodeId = node.NodeID,
        Id = node.NodeGUID,
        Order = node.NodeOrder,
        Text = Value(node, "Text"),
        ActionType = Value(node, "ActionType").ToLowerInvariant(),
        NextQuestionKey = Value(node, "NextQuestionKey").ToLowerInvariant(),
        RedirectUrl = Value(node, "RedirectUrl")
    };

    private static string Value(TreeNode node, string name) =>
        ValidationHelper.GetString(node.GetValue(name), string.Empty).Trim();
}
