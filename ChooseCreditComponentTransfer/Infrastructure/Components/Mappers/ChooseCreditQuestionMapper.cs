using System;
using System.Collections.Generic;
using System.Linq;
using CMS.DocumentEngine;
using CMS.Helpers;
using YkbYapikredi.Application.Components;

namespace YkbYapikredi.Infrastructure.Components.Mappers;

public sealed class ChooseCreditQuestionMapper : IContainerComponentMapper
{
    public string ClassName => "YkbYapikredi.ChooseCreditQuestion";
    public IComponentModel Map(TreeNode node) => Map(node, Array.Empty<IComponentModel>());

    public IComponentModel Map(TreeNode node, IReadOnlyList<IComponentModel> children) =>
        new ChooseCreditQuestionModel
        {
            NodeId = node.NodeID,
            Id = node.NodeGUID,
            Order = node.NodeOrder,
            Name = Value(node, "Name"),
            QuestionKey = Value(node, "QuestionKey").ToLowerInvariant(),
            Heading = Value(node, "Heading"),
            Description = Value(node, "Description"),
            QuestionText = Value(node, "QuestionText"),
            Answers = children.OfType<ChooseCreditAnswerModel>()
                .OrderBy(answer => answer.Order).ThenBy(answer => answer.NodeId).ToArray()
        };

    private static string Value(TreeNode node, string name) =>
        ValidationHelper.GetString(node.GetValue(name), string.Empty).Trim();
}
