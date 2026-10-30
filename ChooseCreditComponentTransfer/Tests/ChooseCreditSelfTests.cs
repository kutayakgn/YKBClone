using YkbYapikredi.Application.Components;

namespace ChooseCreditPreview;

public static class ChooseCreditSelfTests
{
    public static void Run()
    {
        var count = 0;
        void Check(string name, bool result)
        {
            if (!result) throw new InvalidOperationException("FAIL " + name);
            Console.WriteLine("PASS " + name);
            count++;
        }

        Check("single question / single answer", PreviewFixtures.OneQuestion().IsValid);
        Check("three questions / branching / different answer counts", PreviewFixtures.ThreeQuestions().IsValid);
        Check("missing start and target rejected", !PreviewFixtures.Invalid().IsValid);
        Check("empty component rejected", !PreviewFixtures.Component().IsValid);
        Check("duplicate question keys rejected", !PreviewFixtures.Component(
            PreviewFixtures.Question("same", 0, PreviewFixtures.Redirect("A", "/a")),
            PreviewFixtures.Question("same", 1, PreviewFixtures.Redirect("B", "/b"))).IsValid);
        Check("cycle with exit rejected", !PreviewFixtures.Component(
            PreviewFixtures.Question("first", 0, PreviewFixtures.Next("B", "second"), PreviewFixtures.Redirect("Exit", "/exit")),
            PreviewFixtures.Question("second", 1, PreviewFixtures.Next("A", "first"))).IsValid);
        Check("self loop rejected", !PreviewFixtures.Component(
            PreviewFixtures.Question("first", 0, PreviewFixtures.Next("A", "first"))).IsValid);
        Check("empty answers rejected", !PreviewFixtures.Component(PreviewFixtures.Question("first", 0)).IsValid);
        Check("conflicting destinations rejected", !PreviewFixtures.Component(
            PreviewFixtures.Question("first", 0, new ChooseCreditAnswerModel
            { Text = "A", ActionType = "redirect", RedirectUrl = "/a", NextQuestionKey = "first" })).IsValid);
        Check("unknown action rejected", !PreviewFixtures.Component(
            PreviewFixtures.Question("first", 0, new ChooseCreditAnswerModel
            { Text = "A", ActionType = "unknown", RedirectUrl = "/a" })).IsValid);
        Check("blank answer rejected", !PreviewFixtures.Component(
            PreviewFixtures.Question("first", 0, PreviewFixtures.Redirect(" ", "/a"))).IsValid);
        Check("fallback start uses NodeOrder", PreviewFixtures.Component(
            PreviewFixtures.Question("last", 9, PreviewFixtures.Redirect("A", "/a")),
            PreviewFixtures.Question("first", 1, PreviewFixtures.Redirect("A", "/a"))).EffectiveStartQuestionKey == "first");
        foreach (var value in new[] { "/kredi/konut", "~/kredi/konut", "https://www.yapikredi.com.tr/kredi", "/destination?answer=ev%20kredisi" })
            Check("URL allowed " + value, ChooseCreditUrls.IsSafe(value));
        foreach (var value in new[] { "javascript:alert(1)", "//evil.example", "~//evil.example", "/\\evil.example", "/%252fevil.example", "/%0aevil", "https://user:password@example.com", "https:///example.com", "relative/page" })
            Check("URL rejected " + value, !ChooseCreditUrls.IsSafe(value));
        Console.WriteLine($"{count} checks passed. Real Application models and Razor partials compile in this preview project; Kentico runtime integration is outside this harness.");
    }
}
