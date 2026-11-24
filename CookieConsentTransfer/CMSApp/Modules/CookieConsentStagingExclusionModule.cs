using System;
using CMS;
using CMS.CustomTables;
using CMS.DataEngine;
using CMS.Synchronization;

[assembly: RegisterModule(typeof(YkbYapikredi.CmsModules.CookieConsentStagingExclusionModule))]

namespace YkbYapikredi.CmsModules
{
    public sealed class CookieConsentStagingExclusionModule : Module
    {
        private const string DailyTable = "YkbYapikredi.CookieConsentDaily";
        private const string DecisionTable = "YkbYapikredi.CookieConsentDecision";

        public CookieConsentStagingExclusionModule()
            : base("YkbYapikredi.CookieConsentStagingExclusion")
        {
        }

        protected override void OnInit()
        {
            base.OnInit();
            StagingEvents.LogTask.Before += ExcludeCookieConsentRows;
        }

        private static void ExcludeCookieConsentRows(object sender, StagingLogTaskEventArgs e)
        {
            var item = e.Object as CustomTableItem;
            if (item == null)
            {
                return;
            }

            if (string.Equals(item.ClassName, DailyTable, StringComparison.OrdinalIgnoreCase) ||
                string.Equals(item.ClassName, DecisionTable, StringComparison.OrdinalIgnoreCase))
            {
                e.Cancel();
            }
        }
    }
}
