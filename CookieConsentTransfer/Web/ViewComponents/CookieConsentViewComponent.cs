using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using YkbYapikredi.Application.CookieConsent;
using YkbYapikredi.Infrastructure.CookieConsent;

namespace YkbYapikredi.Web.ViewComponents
{
    public sealed class CookieConsentViewComponent : ViewComponent
    {
        public IViewComponentResult Invoke(CookieConsentCopy copy, int policyVersion, CookiePreferences? saved)
        {
            var choices = saved ?? CookiePreferences.EssentialOnly;
            var categories = new[]
            {
                new CookieCategory("necessaryCookies", null, true, copy.Required),
                new CookieCategory("prefCookies", "Functional", choices.Functional, copy.Functional),
                new CookieCategory("analyticsCookies", "Analytics", choices.Analytics, copy.Analytics),
                new CookieCategory("adsCookies", "Advertising", choices.Advertising, copy.Advertising)
            };

            return View(new CookieConsentViewModel(saved != null, policyVersion, copy, categories));
        }
    }

    public sealed record CookieCategory(string Id, string? Field, bool Checked, CookieText Text);

    public sealed record CookieConsentViewModel(
        bool HasChoice,
        int PolicyVersion,
        CookieConsentCopy Copy,
        IReadOnlyList<CookieCategory> Categories);
}
