using System;
using System.Collections.Generic;
using CMS.DataEngine;
using CMS.DataProtection;
using CMS.Helpers;

namespace YkbYapikredi.Infrastructure.CookieConsent
{
    public sealed class CookieConsentCopyProvider
    {
        private const string LabelPrefix = "Ykb.CookieConsent.";
        private static readonly string[] LabelNames =
        {
            "AcceptAll", "RejectAll", "Edit", "Save", "Settings", "SaveError", "PolicyChanged",
            "Close", "AlwaysActive"
        };

        private readonly IConsentInfoProvider consents;

        public CookieConsentCopyProvider(IConsentInfoProvider consents)
        {
            this.consents = consents;
        }

        public CookieConsentCopy? Read(string culture)
        {
            var banner = ReadText("YkbCookieBanner", culture, requiresTitle: false);
            var dialog = ReadText("YkbCookieDialog", culture);
            var required = ReadText("YkbCookieRequired", culture);
            var functional = ReadText("YkbCookieFunctional", culture);
            var analytics = ReadText("YkbCookieAnalytics", culture);
            var advertising = ReadText("YkbCookieAdvertising", culture);

            if (banner == null || dialog == null || required == null || functional == null ||
                analytics == null || advertising == null)
            {
                return null;
            }

            var labels = new Dictionary<string, string>(StringComparer.Ordinal);
            foreach (var name in LabelNames)
            {
                var key = LabelPrefix + name;
                var value = ResHelper.GetString(key, culture)?.Trim();
                if (string.IsNullOrEmpty(value) || string.Equals(value, key, StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(value, "{$" + key + "$}", StringComparison.OrdinalIgnoreCase))
                {
                    return null;
                }

                labels.Add(name, value);
            }

            return new CookieConsentCopy(
                banner.Html, dialog, required, functional, analytics, advertising,
                new CookieConsentLabels(labels["AcceptAll"], labels["RejectAll"], labels["Edit"], labels["Save"],
                    labels["Settings"], labels["SaveError"], labels["PolicyChanged"], labels["Close"],
                    labels["AlwaysActive"]));
        }

        private CookieText? ReadText(string key, string culture, bool requiresTitle = true)
        {
            var text = consents.Get(key)?.GetConsentText(culture);
            if (text == null || string.IsNullOrWhiteSpace(text.FullText) ||
                (requiresTitle && string.IsNullOrWhiteSpace(text.ShortText)))
            {
                return null;
            }

            return new CookieText(text.ShortText ?? string.Empty, text.FullText);
        }
    }

    public sealed record CookieText(string Title, string Html);

    public sealed record CookieConsentCopy(
        string BannerHtml,
        CookieText Dialog,
        CookieText Required,
        CookieText Functional,
        CookieText Analytics,
        CookieText Advertising,
        CookieConsentLabels Labels);

    public sealed record CookieConsentLabels(
        string Accept,
        string Reject,
        string Edit,
        string Save,
        string Settings,
        string SaveError,
        string PolicyChanged,
        string Close,
        string AlwaysActive);
}
