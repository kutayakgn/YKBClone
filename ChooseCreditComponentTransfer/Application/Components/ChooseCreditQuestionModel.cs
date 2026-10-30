using System;
using System.Collections.Generic;

namespace YkbYapikredi.Application.Components;

public sealed class ChooseCreditQuestionModel : IComponentModel
{
    public string ViewName => "~/Views/Shared/Components/_ChooseCreditQuestion.cshtml";
    public int NodeId { get; init; }
    public Guid Id { get; init; }
    public int Order { get; init; }
    public string Name { get; init; } = string.Empty;
    public string QuestionKey { get; init; } = string.Empty;
    public string Heading { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public string QuestionText { get; init; } = string.Empty;
    public IReadOnlyList<ChooseCreditAnswerModel> Answers { get; init; } =
        Array.Empty<ChooseCreditAnswerModel>();
}
