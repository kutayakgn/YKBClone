using System;
using Microsoft.AspNetCore.Mvc;
using YkbYapikredi.Application.CustomTableFeeds;
using YkbYapikredi.Web.Services;

namespace YkbYapikredi.Web.Controllers;

[Route("components/press-releases")]
public sealed class PressReleaseFeedController : Controller
{
    private readonly IPressReleaseFeedService service;
    private readonly PressReleaseFeedToken tokens;
    public PressReleaseFeedController(IPressReleaseFeedService service, PressReleaseFeedToken tokens)
    { this.service = service; this.tokens = tokens; }

    [HttpGet("rows")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public IActionResult Rows(string token, int? category, string period = "", int page = 1)
    {
        if (!ModelState.IsValid || !tokens.TryRead(token, out var pageSize)) return BadRequest();
        try
        {
            return PartialView("~/Views/Shared/CustomTableFeeds/_PressReleaseRows.cshtml",
                service.Search(category, period, page, pageSize));
        }
        catch (ArgumentException) { return BadRequest(); }
    }
}
