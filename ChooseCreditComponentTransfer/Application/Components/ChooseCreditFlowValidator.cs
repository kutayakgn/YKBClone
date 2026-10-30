using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;

namespace YkbYapikredi.Application.Components;

public static class ChooseCreditFlowValidator
{
    private static readonly Regex KeyPattern = new Regex(
        "\\A[a-z0-9][a-z0-9_-]{0,99}\\z", RegexOptions.CultureInvariant);

    public static IReadOnlyList<string> Validate(ChooseCreditComponentModel component)
    {
        if (component is null) throw new ArgumentNullException(nameof(component));
        var errors = new List<string>();
        var questions = new Dictionary<string, ChooseCreditQuestionModel>(StringComparer.Ordinal);

        if (component.Questions.Count == 0)
        {
            errors.Add("Component altında en az bir soru bulunmalıdır.");
            return errors;
        }

        foreach (var question in component.Questions)
        {
            if (!KeyPattern.IsMatch(question.QuestionKey))
                errors.Add($"Soru {question.NodeId}: QuestionKey 1–100 karakter olmalı; küçük harf, rakam, alt çizgi ve tire içerebilir, harf veya rakamla başlamalıdır.");
            if (!string.IsNullOrEmpty(question.QuestionKey))
            {
                if (questions.ContainsKey(question.QuestionKey))
                    errors.Add($"QuestionKey tekrar ediyor: {question.QuestionKey}.");
                else questions.Add(question.QuestionKey, question);
            }
        }

        if (!questions.ContainsKey(component.EffectiveStartQuestionKey))
            errors.Add($"Başlangıç sorusu bulunamadı: {component.EffectiveStartQuestionKey}.");

        foreach (var question in component.Questions)
        {
            if (question.Answers.Count == 0)
                errors.Add($"{question.QuestionKey}: En az bir cevap bulunmalıdır.");

            foreach (var answer in question.Answers)
            {
                var context = $"{question.QuestionKey}, cevap {answer.NodeId}";
                if (string.IsNullOrWhiteSpace(answer.Text)) errors.Add($"{context}: Cevap metni boş olamaz.");
                if (answer.ActionType == "question")
                {
                    if (!string.IsNullOrWhiteSpace(answer.RedirectUrl))
                        errors.Add($"{context}: Soru geçişinde RedirectUrl boş bırakılmalıdır.");
                    if (string.IsNullOrWhiteSpace(answer.NextQuestionKey)
                        || !questions.ContainsKey(answer.NextQuestionKey))
                        errors.Add($"{context}: Hedef soru bulunamadı: {answer.NextQuestionKey}.");
                }
                else if (answer.ActionType == "redirect")
                {
                    if (!string.IsNullOrWhiteSpace(answer.NextQuestionKey))
                        errors.Add($"{context}: Yönlendirmede NextQuestionKey boş bırakılmalıdır.");
                    if (!ChooseCreditUrls.IsSafe(answer.RedirectUrl))
                        errors.Add($"{context}: RedirectUrl geçerli bir yerel yol veya HTTP(S) adresi olmalıdır.");
                }
                else errors.Add($"{context}: ActionType yalnızca question veya redirect olabilir.");
            }
        }

        var state = new Dictionary<string, int>(StringComparer.Ordinal);
        foreach (var key in questions.Keys)
            if (!state.ContainsKey(key) && HasCycle(key, questions, state))
            {
                errors.Add("Soru geçişlerinde döngü bulundu. Her akış bir yönlendirmeyle sonlanmalıdır.");
                break;
            }

        return errors;
    }

    private static bool HasCycle(string key,
        IReadOnlyDictionary<string, ChooseCreditQuestionModel> questions,
        IDictionary<string, int> state)
    {
        state[key] = 1;
        foreach (var answer in questions[key].Answers)
        {
            if (answer.ActionType != "question" || !questions.ContainsKey(answer.NextQuestionKey)) continue;
            if (state.TryGetValue(answer.NextQuestionKey, out var nextState))
            {
                if (nextState == 1) return true;
            }
            else if (HasCycle(answer.NextQuestionKey, questions, state)) return true;
        }
        state[key] = 2;
        return false;
    }
}
