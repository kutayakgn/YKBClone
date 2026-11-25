using System;
using System.Text.RegularExpressions;
using CMS.Core;
using CMS.SiteProvider;

namespace YkbYapikredi.Infrastructure.CookieConsent
{
    public sealed class PartnerSettings
    {
        private const string KeyPrefix = "YkbCookieConsent";

        public static bool IsPublicSiteHost(string host) =>
            string.Equals(host, "www.yapikredi.com.tr", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(host, "yapikredi.com.tr", StringComparison.OrdinalIgnoreCase);

        private readonly ISettingsService settings;
        public string SiteCodeName { get; }

        public PartnerSettings(ISettingsService settings)
        {
            this.settings = settings;
            SiteCodeName = SiteContext.CurrentSiteName ?? string.Empty;
        }

        public string ContainerId => Match("PartnerGtmId", @"\AGTM-[A-Z0-9]{1,24}\z");
        public string DataroidSdkKey => Match("DataroidSdkKey", @"\A[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}\z");
        public string DataroidEndpoint
        {
            get
            {
                var value = Read("DataroidEndpoint");
                if (Uri.TryCreate(value, UriKind.Absolute, out var uri) && uri.Scheme == Uri.UriSchemeHttps &&
                    uri.IsDefaultPort && uri.UserInfo.Length == 0 && uri.AbsolutePath == "/" &&
                    uri.Query.Length == 0 && uri.Fragment.Length == 0 &&
                    uri.IdnHost.EndsWith(".api.dataroid.com", StringComparison.OrdinalIgnoreCase))
                {
                    return uri.GetLeftPart(UriPartial.Authority);
                }
                return string.Empty;
            }
        }

        private string Read(string suffix) =>
            string.IsNullOrWhiteSpace(SiteCodeName)
                ? string.Empty
                : settings[SiteCodeName + "." + KeyPrefix + suffix]?.Trim() ?? string.Empty;

        private string Match(string suffix, string pattern)
        {
            var value = Read(suffix);
            return Regex.IsMatch(value, pattern) ? value : string.Empty;
        }
    }
}
