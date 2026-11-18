using System;
using CMS.CustomTables;
using CMS.SiteProvider;
using Microsoft.Extensions.Logging;
using YkbYapikredi.Application.CookieConsent;

namespace YkbYapikredi.Infrastructure.CookieConsent
{
    public sealed class CookieDecisionRecorder
    {
        public const string TableCodeName = "Ykb.CookieConsentDecision";
        private readonly ILogger<CookieDecisionRecorder> logger;

        public CookieDecisionRecorder(ILogger<CookieDecisionRecorder> logger)
        {
            this.logger = logger;
        }

        public void Record(Guid eventId, string action, CookiePreferences preferences, bool initial, int policyVersion)
        {
            try
            {
                var item = CustomTableItem.New(TableCodeName);
                item.ItemGUID = eventId;
                item.SetValue("SiteCodeName", SiteContext.CurrentSiteName);
                item.SetValue("DecisionUtc", DateTime.UtcNow);
                item.SetValue("DecisionAction", action);
                item.SetValue("Outcome", preferences.Outcome);
                item.SetValue("IsInitial", initial);
                item.SetValue("FunctionalAllowed", preferences.Functional);
                item.SetValue("AnalyticsAllowed", preferences.Analytics);
                item.SetValue("AdvertisingAllowed", preferences.Advertising);
                item.SetValue("PolicyVersion", policyVersion);
                item.Insert();
            }
            catch (Exception error)
            {
                // The unique ItemGUID index also covers retries across web servers.
                try
                {
                    if (CustomTableItemProvider.GetItem(eventId, TableCodeName) != null)
                    {
                        return;
                    }
                }
                catch (Exception lookupError)
                {
                    logger.LogDebug(lookupError, "Could not verify the cookie decision event after insert failure.");
                }

                // Reporting availability must never prevent a visitor from withdrawing consent.
                logger.LogError(error, "Could not record a decision in {CustomTable}.", TableCodeName);
            }
        }
    }
}
