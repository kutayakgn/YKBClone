using Microsoft.AspNetCore.Mvc;
using YkbYapikredi.Application.Components;

namespace ChooseCreditPreview;

public sealed class PreviewController(IWebHostEnvironment environment) : Controller
{
    public IActionResult Index(string? scenario)
    {
        var sample = PreviewFixtures.Load(environment.ContentRootPath);
        var component = scenario switch
        {
            "three" => PreviewFixtures.ThreeQuestions(),
            "invalid" => PreviewFixtures.Invalid(),
            "one" => PreviewFixtures.OneQuestion(),
            "local" => PreviewFixtures.Load(environment.ContentRootPath, localDestinations: true),
            _ => sample
        };
        return View(new PreviewPage(scenario ?? "reference",
            scenario == "multi" ? new[] { component, component } : new[] { component }));
    }
}

public sealed record PreviewPage(string Scenario, IReadOnlyList<ChooseCreditComponentModel> Components);
