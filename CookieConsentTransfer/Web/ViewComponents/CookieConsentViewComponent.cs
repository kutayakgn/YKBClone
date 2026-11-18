using System;
using System.Collections.Generic;
using CMS.DataProtection;
using CMS.DataEngine;
using CMS.Helpers;
using Microsoft.AspNetCore.Mvc;
using YkbYapikredi.Application.CookieConsent;
using YkbYapikredi.Infrastructure.CookieConsent;

namespace YkbYapikredi.Web.ViewComponents
{
    public sealed class CookieConsentViewComponent : ViewComponent
    {
        private readonly IConsentInfoProvider consents;
        private readonly CookieConsentSettings settings;

        public CookieConsentViewComponent(IConsentInfoProvider consents, CookieConsentSettings settings)
        {
            this.consents = consents;
            this.settings = settings;
        }

        public IViewComponentResult Invoke(string culture)
        {
            var english = culture.StartsWith("en", StringComparison.OrdinalIgnoreCase);
            var saved = settings.Read(HttpContext);
            var choices = saved ?? CookiePreferences.EssentialOnly;
            var model = new CookieConsentViewModel(
                saved != null,
                settings.Options.PolicyVersion,
                ReadText("YkbCookieBanner", culture, "", english
                    ? "We use essential cookies to operate this website. You can choose which optional cookies to allow."
                    : "Sitenin çalışması için zorunlu çerezleri kullanıyoruz. İsteğe bağlı çerezlerden hangilerine izin vereceğinizi seçebilirsiniz."),
                ReadText("YkbCookieDialog", culture, english ? "Cookie preferences" : "Çerez tercihleri", english
                    ? "Use the switches below to manage your cookie preferences."
                    : "Aşağıdaki seçeneklerden çerez tercihlerinizi yönetebilirsiniz."),
                new[]
                {
                    new CookieCategory("necessaryCookies", null, true,
                        ReadText("YkbCookieRequired", culture, english ? "Essential cookies" : "Zorunlu çerezler", english
                            ? "These cookies keep the site working and remember your cookie choice."
                            : "Sitenin çalışmasını sağlar ve çerez seçiminizi hatırlar.")),
                    new CookieCategory("prefCookies", "Functional", choices.Functional,
                        ReadText("YkbCookieFunctional", culture, english ? "Functional cookies" : "İşlevsellik ve tercih çerezleri", english
                            ? "These cookies remember optional settings and preferences."
                            : "İsteğe bağlı ayar ve tercihlerin hatırlanmasını sağlar.")),
                    new CookieCategory("analyticsCookies", "Analytics", choices.Analytics,
                        ReadText("YkbCookieAnalytics", culture, english ? "Analytics cookies" : "Performans ve analiz çerezleri", english
                            ? "These cookies help us measure how the site is used."
                            : "Sitenin nasıl kullanıldığını ölçmemize yardımcı olur.")),
                    new CookieCategory("adsCookies", "Advertising", choices.Advertising,
                        ReadText("YkbCookieAdvertising", culture, english ? "Advertising cookies" : "Hedefleme ve reklam çerezleri", english
                            ? "These cookies support advertising and targeting."
                            : "Reklam ve hedefleme amaçlarıyla kullanılabilir."))
                },
                Label("AcceptAll", culture, english ? "Accept all" : "Tümünü kabul et"),
                Label("RejectAll", culture, english ? "Reject all" : "Tümünü reddet"),
                Label("Edit", culture, english ? "Manage preferences" : "Tercihleri düzenle"),
                Label("Save", culture, english ? "Save preferences" : "Tercihleri kaydet"),
                Label("Settings", culture, english ? "Cookie settings" : "Çerez ayarları"),
                Label("SaveError", culture, english ? "Your preferences could not be saved. Please try again." :
                    "Çerez tercihleriniz kaydedilemedi. Lütfen tekrar deneyin."),
                Label("PolicyChanged", culture, english ? "Cookie information has changed. Please reload this page and try again." :
                    "Çerez bilgileri güncellendi. Sayfayı yenileyip tekrar deneyin."));

            return View(model);
        }

        private CookieText ReadText(string key, string culture, string fallbackTitle, string fallbackBody)
        {
            var text = consents.Get(key)?.GetConsentText(culture);
            return new CookieText(
                string.IsNullOrWhiteSpace(text?.ShortText) ? fallbackTitle : text!.ShortText,
                string.IsNullOrWhiteSpace(text?.FullText) ? "<p>" + System.Net.WebUtility.HtmlEncode(fallbackBody) + "</p>" : text!.FullText);
        }

        private static string Label(string label, string culture, string fallback)
        {
            var key = "Ykb.CookieConsent." + label;
            var value = ResHelper.GetString(key, culture);
            return string.IsNullOrWhiteSpace(value) || string.Equals(value, key, StringComparison.OrdinalIgnoreCase)
                ? fallback
                : value;
        }
    }

    public sealed record CookieText(string Title, string Html);
    public sealed record CookieCategory(string Id, string? Field, bool Checked, CookieText Text);
    public sealed record CookieConsentViewModel(
        bool HasChoice,
        int PolicyVersion,
        CookieText Banner,
        CookieText Dialog,
        IReadOnlyList<CookieCategory> Categories,
        string Accept,
        string Reject,
        string Edit,
        string Save,
        string Settings,
        string SaveError,
        string PolicyChanged);
}
