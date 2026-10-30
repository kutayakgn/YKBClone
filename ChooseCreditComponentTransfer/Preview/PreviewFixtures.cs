using System.Text.Json;
using YkbYapikredi.Application.Components;

namespace ChooseCreditPreview;

public static class PreviewFixtures
{
    public static ChooseCreditComponentModel Load(string contentRoot, bool localDestinations = false)
    {
        var source = JsonSerializer.Deserialize<ChooseCreditComponentModel>(
            File.ReadAllText(Path.Combine(contentRoot, "flow.json")),
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
            ?? throw new InvalidOperationException("flow.json boş.");
        var nodeId = 100;
        return new ChooseCreditComponentModel
        {
            NodeId = 1, Id = Guid.Parse("89a637c6-d877-4be5-95dd-027c7865dcb4"),
            Name = source.Name, StartQuestionKey = source.StartQuestionKey,
            ContinueButtonText = source.ContinueButtonText,
            SelectionRequiredMessage = source.SelectionRequiredMessage,
            ConfigurationErrorMessage = source.ConfigurationErrorMessage,
            Questions = source.Questions.Select((question, index) => new ChooseCreditQuestionModel
            {
                NodeId = ++nodeId, Id = Guid.NewGuid(), Order = index,
                Name = question.Name, QuestionKey = question.QuestionKey,
                Heading = question.Heading, Description = question.Description,
                QuestionText = question.QuestionText,
                Answers = question.Answers.Select((answer, answerIndex) => new ChooseCreditAnswerModel
                {
                    NodeId = ++nodeId, Id = Guid.NewGuid(), Order = answerIndex,
                    Text = answer.Text, ActionType = answer.ActionType,
                    NextQuestionKey = answer.NextQuestionKey,
                    RedirectUrl = localDestinations && answer.ActionType == "redirect"
                        ? "/destination?answer=" + Uri.EscapeDataString(answer.RedirectUrl)
                        : answer.RedirectUrl
                }).ToArray()
            }).ToArray()
        };
    }

    public static ChooseCreditComponentModel OneQuestion() => Component(
        Question("first", 0, Redirect("Tek cevapla bitir", "/destination?answer=one")));

    public static ChooseCreditComponentModel ThreeQuestions() => Component(
        Question("first", 0,
            Next("İkinci soruya geç", "second"),
            Redirect("İlk soruda bitir", "/destination?answer=early"),
            Next("İkinci soruyu atla", "third")),
        Question("second", 1, Next("Üçüncü soruya geç", "third")),
        Question("third", 2,
            Redirect("Birinci sonuç", "/destination?answer=three-a"),
            Redirect("İkinci sonuç", "/destination?answer=three-b"),
            Redirect("Sanal dizin sonucu", "~/destination?answer=virtual"),
            Redirect("Türkçe sorgu", "/destination?answer=ev%20kredisi")));

    public static ChooseCreditComponentModel Invalid() => new()
    {
        Id = Guid.NewGuid(), Name = "Geçersiz akış", StartQuestionKey = "missing",
        Questions = new[] { Question("first", 0, Next("Eksik hedef", "missing")) }
    };

    public static ChooseCreditComponentModel Component(params ChooseCreditQuestionModel[] questions) => new()
    {
        NodeId = 1, Id = Guid.NewGuid(), Name = "Kredini Seç", Questions = questions
    };

    public static ChooseCreditQuestionModel Question(string key, int order, params ChooseCreditAnswerModel[] answers) => new()
    {
        NodeId = order + 10, Id = Guid.NewGuid(), Order = order, Name = key,
        QuestionKey = key, Heading = "Kredini birlikte belirleyelim",
        QuestionText = "Seçiminiz nedir? (" + key + ")",
        Answers = answers.Select((answer, index) => new ChooseCreditAnswerModel
        {
            NodeId = (order + 1) * 100 + index, Id = Guid.NewGuid(), Order = index,
            Text = answer.Text, ActionType = answer.ActionType,
            NextQuestionKey = answer.NextQuestionKey, RedirectUrl = answer.RedirectUrl
        }).ToArray()
    };

    public static ChooseCreditAnswerModel Next(string text, string key) => new()
    {
        Text = text, ActionType = "question", NextQuestionKey = key
    };

    public static ChooseCreditAnswerModel Redirect(string text, string url) => new()
    {
        Text = text, ActionType = "redirect", RedirectUrl = url
    };
}
