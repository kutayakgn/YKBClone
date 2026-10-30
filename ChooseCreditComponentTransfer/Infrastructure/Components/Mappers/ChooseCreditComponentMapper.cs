using System;
using System.Collections.Generic;
using System.Linq;
using CMS.DocumentEngine;
using CMS.Helpers;
using YkbYapikredi.Application.Components;

namespace YkbYapikredi.Infrastructure.Components.Mappers;

public sealed class ChooseCreditComponentMapper : IContainerComponentMapper
{
    public string ClassName => "YkbYapikredi.ChooseCreditComponent";
    public IComponentModel Map(TreeNode node) => Map(node, Array.Empty<IComponentModel>());

    public IComponentModel Map(TreeNode node, IReadOnlyList<IComponentModel> children) =>
        new ChooseCreditComponentModel
        {
            NodeId = node.NodeID,
            Id = node.NodeGUID,
            Order = node.NodeOrder,
            Name = Value(node, "Name"),
            StartQuestionKey = Value(node, "StartQuestionKey").ToLowerInvariant(),
            ContinueButtonText = Value(node, "ContinueButtonText", "Devam"),
            SelectionRequiredMessage = Value(node, "SelectionRequiredMessage", "Lütfen bir seçenek seçin."),
            ConfigurationErrorMessage = Value(node, "ConfigurationErrorMessage", "Kredi seçim adımları şu anda görüntülenemiyor."),
            Questions = children.OfType<ChooseCreditQuestionModel>()
                .OrderBy(question => question.Order).ThenBy(question => question.NodeId).ToArray()
        };

    private static string Value(TreeNode node, string name, string fallback = "")
    {
        var value = ValidationHelper.GetString(node.GetValue(name), string.Empty).Trim();
        return value.Length > 0 ? value : fallback;
    }
}
