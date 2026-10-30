using System;

namespace YkbYapikredi.Application.Components;

public sealed class ChooseCreditAnswerModel : IComponentModel
{
    public string ViewName => "~/Views/Shared/Components/_ChooseCreditAnswer.cshtml";
    public int NodeId { get; init; }
    public Guid Id { get; init; }
    public int Order { get; init; }
    public string Text { get; init; } = string.Empty;
    public string ActionType { get; init; } = string.Empty;
    public string NextQuestionKey { get; init; } = string.Empty;
    public string RedirectUrl { get; init; } = string.Empty;
}
