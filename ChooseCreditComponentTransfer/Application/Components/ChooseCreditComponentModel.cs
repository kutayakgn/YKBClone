using System;
using System.Collections.Generic;
using System.Linq;

namespace YkbYapikredi.Application.Components;

public sealed class ChooseCreditComponentModel : IComponentModel
{
    public string ViewName => "~/Views/Shared/Components/_ChooseCreditComponent.cshtml";
    public int NodeId { get; init; }
    public Guid Id { get; init; }
    public int Order { get; init; }
    public string Name { get; init; } = string.Empty;
    public string StartQuestionKey { get; init; } = string.Empty;
    public string ContinueButtonText { get; init; } = "Devam";
    public string SelectionRequiredMessage { get; init; } = "Lütfen bir seçenek seçin.";
    public string ConfigurationErrorMessage { get; init; } = "Kredi seçim adımları şu anda görüntülenemiyor.";
    public IReadOnlyList<ChooseCreditQuestionModel> Questions { get; init; } =
        Array.Empty<ChooseCreditQuestionModel>();

    public string EffectiveStartQuestionKey => !string.IsNullOrWhiteSpace(StartQuestionKey)
        ? StartQuestionKey
        : Questions.OrderBy(question => question.Order).ThenBy(question => question.NodeId)
            .FirstOrDefault()?.QuestionKey ?? string.Empty;

    public IReadOnlyList<string> ConfigurationErrors => ChooseCreditFlowValidator.Validate(this);
    public bool IsValid => ConfigurationErrors.Count == 0;
}
