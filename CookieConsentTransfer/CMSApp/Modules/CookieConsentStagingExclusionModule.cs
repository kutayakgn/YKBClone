[assembly: global::CMS.RegisterModuleAttribute(typeof(YkbYapikredi.CmsModules.CookieConsentStagingExclusionModule))]

namespace YkbYapikredi.CmsModules
{
    public sealed class CookieConsentStagingExclusionModule : global::CMS.DataEngine.Module
    {
        private static readonly global::System.Collections.Generic.HashSet<string> ExcludedObjectTypes =
            new global::System.Collections.Generic.HashSet<string>(global::System.StringComparer.OrdinalIgnoreCase)
            {
                "CustomTableItem.YkbYapikredi.CookieConsentDaily",
                "CustomTableItem.YkbYapikredi.CookieConsentDecision",
                "CustomTableItem.Ykb.CookieConsentDaily",
                "CustomTableItem.Ykb.CookieConsentDecision"
            };

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
            if (ExcludedObjectTypes.Contains(e.Task?.TaskObjectType) ||
                ExcludedObjectTypes.Contains(e.Object?.TypeInfo?.ObjectType))
            {
                e.Cancel();
            }
        }
    }
}
