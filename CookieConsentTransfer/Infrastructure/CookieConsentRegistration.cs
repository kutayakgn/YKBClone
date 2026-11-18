using System.Text.RegularExpressions;
using CMS;
using CMS.DataEngine;
using CMS.Helpers;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using YkbYapikredi.Infrastructure.CookieConsent;

[assembly: RegisterModule(typeof(CookieConsentModule))]

namespace YkbYapikredi.Infrastructure.CookieConsent
{
    public sealed class CookieConsentModule : Module
    {
        public CookieConsentModule() : base("YkbCookieConsent")
        {
        }

        protected override void OnInit()
        {
            base.OnInit();
            CookieHelper.RegisterCookie(CookieConsentSettings.CookieName, CookieLevel.Essential);
        }
    }

    public static class CookieConsentRegistration
    {
        public static IServiceCollection AddYkbCookieConsent(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddDataProtection();
            services.AddAntiforgery(options => options.Cookie.IsEssential = true);
            services.AddOptions<CookieConsentOptions>().Bind(configuration.GetSection("CookieConsent"))
                .Validate(options => options.PolicyVersion > 0, "CookieConsent:PolicyVersion must be positive.")
                .Validate(options => string.IsNullOrEmpty(options.MeasurementId) ||
                    Regex.IsMatch(options.MeasurementId, @"\AG-[A-Z0-9]+\z"),
                    "CookieConsent:MeasurementId must be a GA4 measurement ID (G-…).")
                .ValidateOnStart();
            services.AddScoped<CookieConsentSettings>();
            services.AddScoped<CookieDecisionRecorder>();
            return services;
        }
    }
}
