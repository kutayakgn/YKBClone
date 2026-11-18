using System;
using System.Globalization;
using System.Security.Cryptography;
using System.Text.RegularExpressions;
using CMS.Core;
using CMS.SiteProvider;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Http;
using YkbYapikredi.Application.CookieConsent;

namespace YkbYapikredi.Infrastructure.CookieConsent
{
    public sealed class CookieConsentOptions
    {
        public int PolicyVersion { get; init; }
        public string MeasurementId { get; init; } = string.Empty;
    }

    public sealed class CookieConsentSettings
    {
        public const string CookieName = "YkbCookiePreferences";
        public const string AnalyticsCookiePrefix = "ykbconsent";
        private const string PolicyVersionKey = "YkbCookieConsentPolicyVersion";
        private const string MeasurementIdKey = "YkbCookieConsentMeasurementId";
        private static readonly TimeSpan PreferenceLifetime = TimeSpan.FromDays(365);
        private readonly IDataProtectionProvider protection;
        private readonly ISettingsService settingsService;
        private CookieConsentOptions? options;

        public CookieConsentSettings(IDataProtectionProvider protection, ISettingsService settingsService)
        {
            this.protection = protection;
            this.settingsService = settingsService;
        }

        public CookieConsentOptions Options => options ??= LoadOptions();

        private CookieConsentOptions LoadOptions()
        {
            var siteName = SiteContext.CurrentSiteName;
            if (string.IsNullOrWhiteSpace(siteName))
            {
                return new CookieConsentOptions();
            }

            var versionValue = settingsService[siteName + "." + PolicyVersionKey];
            if (!int.TryParse(versionValue, NumberStyles.Integer, CultureInfo.InvariantCulture, out var version) ||
                version < 1)
            {
                return new CookieConsentOptions();
            }

            var measurementId = settingsService[siteName + "." + MeasurementIdKey]?.Trim();
            return new CookieConsentOptions
            {
                PolicyVersion = version,
                MeasurementId = measurementId != null && Regex.IsMatch(measurementId, @"\AG-[A-Z0-9]+\z")
                    ? measurementId
                    : string.Empty
            };
        }

        public CookiePreferences? Read(HttpContext context)
        {
            if (!context.Request.Cookies.TryGetValue(CookieName, out var value) ||
                string.IsNullOrEmpty(value) || value.Length > 512 || Options.PolicyVersion < 1)
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
                Options.PolicyVersion.ToString(CultureInfo.InvariantCulture))
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
