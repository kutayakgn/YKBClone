using System;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using YkbYapikredi.Application.CookieConsent;
using YkbYapikredi.Infrastructure.CookieConsent;

namespace YkbYapikredi.Web.Controllers
{
    [AllowAnonymous]
    [Route("cookie")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public sealed class CookieConsentController : Controller
    {
        public const string SaveRouteName = "Ykb.SaveCookiePreferences";
        private readonly CookieConsentSettings settings;
        private readonly CookieDecisionRecorder recorder;

        public CookieConsentController(CookieConsentSettings settings, CookieDecisionRecorder recorder)
        {
            this.settings = settings;
            this.recorder = recorder;
        }

        [HttpPost("agree", Name = SaveRouteName)]
        [ValidateAntiForgeryToken]
        [RequestSizeLimit(8192)]
        public IActionResult Agree([FromForm] CookieDecisionInput input)
        {
            if (!ModelState.IsValid || input.EventId == Guid.Empty)
            {
                return BadRequest();
            }

            if (input.PolicyVersion != settings.Options.PolicyVersion)
            {
                return Conflict();
            }

            var preferences = input.Action switch
            {
                "accept" => CookiePreferences.All,
                "reject" => CookiePreferences.EssentialOnly,
                "custom" when input.Functional.HasValue && input.Analytics.HasValue && input.Advertising.HasValue =>
                    new CookiePreferences(input.Functional.Value, input.Analytics.Value, input.Advertising.Value),
                _ => null
            };

            if (preferences is null)
            {
                return BadRequest();
            }

            var previous = settings.Read(HttpContext);
            if (!preferences.Analytics)
            {
                settings.ClearAnalyticsCookies(HttpContext);
            }

            if (previous == preferences)
            {
                return Ok(new { changed = false, analytics = preferences.Analytics });
            }

            settings.Write(HttpContext, preferences);
            recorder.Record(input.EventId, input.Action!, preferences, previous is null, settings.Options.PolicyVersion);
            return Ok(new { changed = true, analytics = preferences.Analytics });
        }
    }

    public sealed class CookieDecisionInput
    {
        public Guid EventId { get; set; }
        public int PolicyVersion { get; set; }
        public string? Action { get; set; }
        public bool? Functional { get; set; }
        public bool? Analytics { get; set; }
        public bool? Advertising { get; set; }
    }
}
