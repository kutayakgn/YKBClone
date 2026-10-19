using System;
using Microsoft.AspNetCore.Mvc;
using YkbYapikredi.Application.Layout;

namespace YkbYapikredi.Web.Controllers;

[Route("components/rich-text")]
public sealed class RichTextModalController : Controller
{
    private readonly IRichTextModalProvider modals;
    public RichTextModalController(IRichTextModalProvider modals) { this.modals = modals; }

    [HttpGet("modal")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public IActionResult Modal([FromQuery] Guid id, [FromQuery] string culture)
    {
        if (!ModelState.IsValid || id == Guid.Empty || string.IsNullOrWhiteSpace(culture) || culture.Length > 40)
            return BadRequest();
        var modal = modals.Get(id, culture);
        if (modal is null) return NotFound();
        // ViewName comes from the existing mapper/model allowlist, never from query input.
        return PartialView(modal.ViewName, modal);
    }
}
