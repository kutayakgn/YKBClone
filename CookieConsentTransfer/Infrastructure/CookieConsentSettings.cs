using System;
using System.Security.Cryptography;
using CMS.SiteProvider;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using YkbYapikredi.Application.CookieConsent;

namespace YkbYapikredi.Infrastructure.CookieConsent
{
    public sealed class CookieConsentOptions
    {
        public int PolicyVersion { get; set; } = 1;
        public string MeasurementId { get; set; } = string.Empty;
    }

    public sealed class CookieConsentSettings
    {
        public const string CookieName = "YkbCookiePreferences";
        public const string AnalyticsCookiePrefix = "ykbconsent";
        private static readonly TimeSpan PreferenceLifetime = TimeSpan.FromDays(365);
        private readonly IDataProtectionProvider protection;

        public CookieConsentSettings(IDataProtectionProvider protection, IOptions<CookieConsentOptions> options)
        {
            this.protection = protection;
            Options = options.Value;
        }

        public CookieConsentOptions Options { get; }

        public CookiePreferences? Read(HttpContext context)
        {
            if (!context.Request.Cookies.TryGetValue(CookieName, out var value) ||
                string.IsNullOrEmpty(value) || value.Length > 512)
            {
                return null;
            }

            try
            {
                return CookiePreferences.FromCookieValue(Protector().Unprotect(value));
            }
            catch (CryptographicException)
            {
                return null;
            }
        }

        public void Write(HttpContext context, CookiePreferences preferences)
        {
            var expires = DateTimeOffset.UtcNow.Add(PreferenceLifetime);
            var options = CookieOptions(context);
            options.Expires = expires;
            context.Response.Cookies.Append(CookieName, Protector().Protect(preferences.ToCookieValue(), expires), options);
        }

        public void ClearAnalyticsCookies(HttpContext context)
        {
            foreach (var name in context.Request.Cookies.Keys)
            {
                if (name.Equals(AnalyticsCookiePrefix + "_ga", StringComparison.Ordinal) ||
                    name.StartsWith(AnalyticsCookiePrefix + "_ga_", StringComparison.Ordinal) ||
                    name.Equals(AnalyticsCookiePrefix + "__ga", StringComparison.Ordinal) ||
                    name.StartsWith(AnalyticsCookiePrefix + "__ga_", StringComparison.Ordinal))
                {
                    context.Response.Cookies.Delete(name, CookieOptions(context));
                }
            }
        }

        private ITimeLimitedDataProtector Protector() =>
            protection.CreateProtector("Ykb.CookieConsent", SiteContext.CurrentSiteName,
                Options.PolicyVersion.ToString(System.Globalization.CultureInfo.InvariantCulture))
                .ToTimeLimitedDataProtector();

        private static CookieOptions CookieOptions(HttpContext context) => new CookieOptions
        {
            Path = "/",
            HttpOnly = true,
            Secure = context.Request.IsHttps,
            SameSite = SameSiteMode.Lax,
            IsEssential = true
        };
    }
}
