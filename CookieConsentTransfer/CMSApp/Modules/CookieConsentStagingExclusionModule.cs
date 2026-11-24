[assembly: global::CMS.RegisterModuleAttribute(typeof(YkbYapikredi.CmsModules.CookieConsentStagingExclusionModule))]

namespace YkbYapikredi.CmsModules
{
    public sealed class CookieConsentStagingExclusionModule : global::CMS.DataEngine.Module
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
            global::CMS.Synchronization.StagingEvents.LogTask.Before += ExcludeCookieConsentRows;
        }

        private static void ExcludeCookieConsentRows(object sender, global::CMS.Synchronization.StagingLogTaskEventArgs e)
        {
            var item = e.Object as global::CMS.CustomTables.CustomTableItem;
            if (item == null)
            {
                return;
            }

            if (string.Equals(item.ClassName, DailyTable, global::System.StringComparison.OrdinalIgnoreCase) ||
                string.Equals(item.ClassName, DecisionTable, global::System.StringComparison.OrdinalIgnoreCase))
            {
                e.Cancel();
            }
        }
    }
}
