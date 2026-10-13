using System;
using Microsoft.AspNetCore.Mvc;
using YkbYapikredi.Application.Components;

namespace YkbYapikredi.Web.Controllers;

[Route("components/card-groups")]
public sealed class CardGroupPaginationController : Controller
{
    private readonly ICardGroupPaginationService service;
    public CardGroupPaginationController(ICardGroupPaginationService service) { this.service = service; }

    [HttpGet("page")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public IActionResult Page([FromQuery] Guid groupId, [FromQuery] string culture, [FromQuery] int page = 1)
    {
        if (!ModelState.IsValid || groupId == Guid.Empty || page < 1 || string.IsNullOrWhiteSpace(culture) || culture.Length > 40)
            return BadRequest();
        var model = service.GetPage(groupId, culture, page);
        if (model is null) return NotFound();
        return PartialView("~/Views/Shared/Components/_CardGroupItems.cshtml", model);
    }
}
