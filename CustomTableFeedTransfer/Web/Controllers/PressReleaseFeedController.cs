using System;
using Microsoft.AspNetCore.Mvc;
using YkbYapikredi.Application.CustomTableFeeds;

namespace YkbYapikredi.Web.Controllers;

[Route("components/press-releases")]
public sealed class PressReleaseFeedController : Controller
{
    private readonly IPressReleaseFeedService service;
    public PressReleaseFeedController(IPressReleaseFeedService service) { this.service = service; }

    [HttpGet("rows")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public IActionResult Rows([FromQuery] int? category, [FromQuery] string period = "", [FromQuery] int page = 1, [FromQuery] int pageSize = 0)
    {
        if (!ModelState.IsValid || pageSize < 0 || page < 1) return BadRequest();
        try
        {
            return PartialView("~/Views/Shared/CustomTableFeeds/_PressReleaseRows.cshtml",
                service.Search(category, period, page, pageSize));
        }
        catch (ArgumentException) { return BadRequest(); }
    }
}
