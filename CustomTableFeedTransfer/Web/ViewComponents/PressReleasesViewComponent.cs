using System.Globalization;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using YkbYapikredi.Application.CustomTableFeeds;
using YkbYapikredi.Web.Models;
using YkbYapikredi.Web.Services;

namespace YkbYapikredi.Web.ViewComponents;

public sealed class PressReleasesViewComponent : ViewComponent
{
    private readonly IPressReleaseFeedService service;
    private readonly PressReleaseFeedToken tokens;
    public PressReleasesViewComponent(IPressReleaseFeedService service, PressReleaseFeedToken tokens)
    { this.service = service; this.tokens = tokens; }

    public IViewComponentResult Invoke(int pageSize)
    {
        var years = service.GetYears();
        var period = years.Count > 0 ? years[0].ToString(CultureInfo.InvariantCulture) : string.Empty;
        return View("~/Views/Shared/CustomTableFeeds/_PressReleases.cshtml", new PressReleaseFeedViewModel
        {
            Token = tokens.Create(pageSize), Years = years, Period = period,
            Result = service.Search(null, period, 1, pageSize)
        });
    }
}
