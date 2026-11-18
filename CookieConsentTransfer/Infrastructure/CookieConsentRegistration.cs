using CMS;
using CMS.DataEngine;
using CMS.Helpers;
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
        public static IServiceCollection AddYkbCookieConsent(this IServiceCollection services)
        {
            services.AddDataProtection();
            services.AddAntiforgery(options => options.Cookie.IsEssential = true);
            services.AddScoped<CookieConsentSettings>();
            services.AddScoped<CookieConsentCopyProvider>();
            services.AddScoped<CookieDecisionRecorder>();
            return services;
        }
    }
}
