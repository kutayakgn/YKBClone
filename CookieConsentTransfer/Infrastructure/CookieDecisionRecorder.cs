using System;
using System.Data;
using System.Data.Common;
using System.Globalization;
using System.Linq;
using CMS.Base;
using CMS.CustomTables;
using CMS.DataEngine;
using CMS.SiteProvider;
using Microsoft.Extensions.Logging;
using YkbYapikredi.Application.CookieConsent;

namespace YkbYapikredi.Infrastructure.CookieConsent
{
    public sealed class CookieDecisionRecorder
    {
        public const string DecisionTable = "Ykb.CookieConsentDecision";
        public const string SummaryTable = "Ykb.CookieConsentDaily";
        private readonly ILogger<CookieDecisionRecorder> logger;

        public CookieDecisionRecorder(ILogger<CookieDecisionRecorder> logger)
        {
            this.logger = logger;
        }

        public void Record(Guid eventId, string action, CookiePreferences preferences, bool initial, int policyVersion)
        {
            var site = SiteContext.CurrentSiteName;
            var utcNow = DateTime.UtcNow;
            var day = utcNow.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);

            try
            {
                using var transaction = new CMSTransactionScope();

                // Database-scoped lock keeps the event and its counters consistent across live-site instances.
                LockSite(transaction.Connection, site);
                if (CustomTableItemProvider.GetItems(DecisionTable)
                    .WhereEquals("ItemGUID", eventId).WhereEquals("SiteCodeName", site).TopN(1).Any())
                {
                    transaction.Commit();
                    return;
                }

                var item = CustomTableItem.New(DecisionTable);
                item.ItemGUID = eventId;
                item.SetValue("SiteCodeName", site);
                item.SetValue("DecisionUtc", utcNow);
                item.SetValue("DecisionAction", action);
                item.SetValue("Outcome", preferences.Outcome);
                item.SetValue("IsInitial", initial);
                item.SetValue("FunctionalAllowed", preferences.Functional);
                item.SetValue("AnalyticsAllowed", preferences.Analytics);
                item.SetValue("AdvertisingAllowed", preferences.Advertising);
                item.SetValue("PolicyVersion", policyVersion);

                using var stagingContext = new CMSActionContext { LogSynchronization = false };
                item.Insert();

                UpdateDailySummary(site, day, policyVersion, action, preferences, initial);
                transaction.Commit();
            }
            catch (Exception error)
            {
                // Statistics availability must never prevent a visitor from saving or withdrawing consent.
                logger.LogError(error, "Could not update cookie decision statistics for site {SiteCodeName}.", site);
            }
        }

        private static void UpdateDailySummary(string site, string day, int policyVersion, string action,
            CookiePreferences preferences, bool initial)
        {
            var row = CustomTableItemProvider.GetItems(SummaryTable)
                .WhereEquals("SiteCodeName", site)
                .WhereEquals("DayUtc", day)
                .WhereEquals("PolicyVersion", policyVersion)
                .TopN(1).FirstOrDefault();

            var isNew = row == null;
            row ??= CustomTableItem.New(SummaryTable);
            if (isNew)
            {
                row.SetValue("SiteCodeName", site);
                row.SetValue("DayUtc", day);
                row.SetValue("PolicyVersion", policyVersion);
            }

            Increment(row, "TotalCount", true);
            Increment(row, "AcceptedCount", preferences == CookiePreferences.All);
            Increment(row, "RejectedCount", preferences == CookiePreferences.EssentialOnly);
            Increment(row, "PartialCount", preferences != CookiePreferences.All &&
                preferences != CookiePreferences.EssentialOnly);
            Increment(row, "CustomCount", action == "custom");
            Increment(row, "InitialCount", initial);
            Increment(row, "ChangedCount", !initial);
            Increment(row, "FunctionalCount", preferences.Functional);
            Increment(row, "AnalyticsCount", preferences.Analytics);
            Increment(row, "AdvertisingCount", preferences.Advertising);

            if (isNew) row.Insert();
            else row.Update();
        }

        private static void Increment(CustomTableItem row, string field, bool included)
        {
            var value = row.GetValue(field);
            var current = value == null || value == DBNull.Value
                ? 0L
                : Convert.ToInt64(value, CultureInfo.InvariantCulture);
            row.SetValue(field, included ? checked(current + 1) : current);
        }

        private static void LockSite(IDataConnection connection, string site)
        {
            if (!(connection.NativeConnection is DbConnection database))
            {
                throw new InvalidOperationException("The Kentico transaction has no open database connection.");
            }

            using var command = database.CreateCommand();
            command.CommandType = CommandType.StoredProcedure;
            command.CommandText = "sys.sp_getapplock";
            command.Transaction = connection.Transaction as DbTransaction;

            AddLockParameter(command, "@Resource", DbType.String, "Ykb.CookieConsent:" + site);
            AddLockParameter(command, "@LockMode", DbType.String, "Exclusive");
            AddLockParameter(command, "@LockOwner", DbType.String, "Transaction");
            AddLockParameter(command, "@LockTimeout", DbType.Int32, 2000);

            var result = command.CreateParameter();
            result.ParameterName = "@ReturnValue";
            result.DbType = DbType.Int32;
            result.Direction = ParameterDirection.ReturnValue;
            command.Parameters.Add(result);
            command.ExecuteNonQuery();

            if (!(result.Value is int code) || code < 0)
            {
                throw new InvalidOperationException("The cookie statistics database lock could not be acquired.");
            }
        }

        private static void AddLockParameter(DbCommand command, string name, DbType type, object value)
        {
            var parameter = command.CreateParameter();
            parameter.ParameterName = name;
            parameter.DbType = type;
            parameter.Value = value;
            command.Parameters.Add(parameter);
        }
    }
}
