#nullable disable
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using CMS.CustomTables;
using CMS.DataEngine;
using CMS.FormEngine;
using CMS.Helpers;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using YkbYapikredi.Application.CustomTableFeeds;
using YkbYapikredi.Infrastructure.CustomTableFeeds;

namespace YkbYapikredi.Web.Controllers;

[Route("local-tools/ipo-calendar-urls")]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public sealed class IpoCalendarUrlNormalizeController : Controller
{
    private static readonly object UpdateLock = new object();
    private readonly IWebHostEnvironment environment;
    private readonly IAntiforgery antiforgery;
    private readonly ILogger<IpoCalendarUrlNormalizeController> logger;

    public IpoCalendarUrlNormalizeController(IWebHostEnvironment environment,
        IAntiforgery antiforgery, ILogger<IpoCalendarUrlNormalizeController> logger)
    {
        this.environment = environment;
        this.antiforgery = antiforgery;
        this.logger = logger;
    }

    // GET yalnız önizleme yapar; DB'ye yazmaz.
    [HttpGet]
    public IActionResult Index()
    {
        if (!IsLocalDevelopment()) return NotFound();
        try
        {
            var report = BuildPlan(out _);
            var tokens = antiforgery.GetAndStoreTokens(HttpContext);
            var html = new StringBuilder("<!doctype html><html lang=\"tr\"><meta charset=\"utf-8\"><title>Halka Arz URL düzeltme</title>");
            html.Append("<body><h1>Halka Arz URL düzeltme</h1><p>Tablo: ").Append(Encode(report.Table));
            html.Append("</p><p>Toplam: ").Append(report.Total).Append(" · Değişecek: ").Append(report.ToUpdate);
            html.Append(" · Zaten uygun: ").Append(report.Unchanged).Append(" · Atlanan: ").Append(report.Skipped.Count).Append("</p>");
            foreach (var error in report.Errors) html.Append("<p>").Append(Encode(error)).Append("</p>");
            html.Append("<table border=\"1\" cellpadding=\"8\"><thead><tr><th>ItemID</th><th>Önce</th><th>Sonra</th></tr></thead><tbody>");
            foreach (var row in report.Changes.Take(50))
                html.Append("<tr><td>").Append(row.ItemId).Append("</td><td>").Append(Encode(row.Before))
                    .Append("</td><td>").Append(Encode(row.After)).Append("</td></tr>");
            html.Append("</tbody></table><p>Önizlemede ilk 50 değişiklik gösterilir; POST raporunda tümü bulunur.</p>");
            foreach (var row in report.Skipped.Take(20))
                html.Append("<p>Atlanan ItemID=").Append(row.ItemId).Append(": ").Append(Encode(row.Reason)).Append("</p>");
            html.Append("<form method=\"post\" action=\"").Append(Encode(Url.Action(nameof(Update)) ?? "/local-tools/ipo-calendar-urls"))
                .Append("\"><input type=\"hidden\" name=\"").Append(Encode(tokens.FormFieldName))
                .Append("\" value=\"").Append(Encode(tokens.RequestToken)).Append("\">");
            html.Append("<button name=\"apply\" value=\"false\">Tam ön kontrol raporu</button> ");
            if (report.Errors.Count == 0 && report.ToUpdate > 0)
                html.Append("<button name=\"apply\" value=\"true\">Url alanlarını güncelle</button>");
            html.Append("</form><p>Yalnız Url alanı güncellenir. Image ve diğer içerik alanları korunur.</p></body></html>");
            return Content(html.ToString(), "text/html; charset=utf-8");
        }
        catch (Exception error)
        {
            logger.LogError(error, "Halka Arz URL ön kontrolü başarısız.");
            return StatusCode(500, new { error = error.Message });
        }
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public IActionResult Update([FromForm] bool apply = false)
    {
        if (!IsLocalDevelopment()) return NotFound();
        if (!ModelState.IsValid) return BadRequest(new { error = "Geçersiz istek." });
        try
        {
            lock (UpdateLock)
            {
                var report = BuildPlan(out var plan);
                if (report.Errors.Count > 0) return UnprocessableEntity(report);
                if (!apply || plan.Count == 0) return Ok(report);
                using (var transaction = new CMSTransactionScope())
                {
                    foreach (var change in plan)
                    {
                        change.Item.SetValue("Url", change.NewUrl);
                        change.Item.Update();
                    }
                    transaction.Commit();
                }
                report.Updated = plan.Count;
                report.Applied = true;
                // Önce/Sonra değerleri raporda kalır.
                return Ok(report);
            }
        }
        catch (Exception error)
        {
            logger.LogError(error, "Halka Arz URL güncellemesi başarısız.");
            return StatusCode(500, new { error = "Güncelleme tamamlanamadı; transaction geri alınır.", detail = error.Message });
        }
    }

    private UpdateReport BuildPlan(out List<PlannedChange> plan)
    {
        plan = new List<PlannedChange>();
        var report = new UpdateReport();
        var table = DataClassInfoProvider.GetDataClassInfo(IpoCalendarSchema.TableClassName);
        if (table == null || !table.ClassIsCustomTable)
        { report.Errors.Add("Custom table bulunamadı: " + report.Table); return report; }
        if (new FormInfo(table.ClassFormDefinition).GetFormField("Url") == null)
        { report.Errors.Add("Custom table içinde Url alanı bulunamadı."); return report; }
        var items = CustomTableItemProvider.GetItems(IpoCalendarSchema.TableClassName).OrderBy("ItemID").ToArray();
        report.Total = items.Length;
        foreach (var item in items)
        {
            var id = ValidationHelper.GetInteger(item.GetValue("ItemID"), 0);
            var oldUrl = ValidationHelper.GetString(item.GetValue("Url"), string.Empty);
            if (!IpoCalendarUrls.TryNormalize(oldUrl, out var newUrl, out var reason, Request.Host.Host))
            {
                report.Skipped.Add(new SkippedRow { ItemId = id, Url = oldUrl, Reason = reason });
                continue;
            }
            if (string.Equals(oldUrl, newUrl, StringComparison.Ordinal)) { report.Unchanged++; continue; }
            plan.Add(new PlannedChange { Item = item, NewUrl = newUrl });
            report.Changes.Add(new ChangedRow { ItemId = id, Before = oldUrl, After = newUrl });
        }
        report.ToUpdate = plan.Count;
        return report;
    }

    private bool IsLocalDevelopment()
    {
        var ip = HttpContext.Connection.RemoteIpAddress;
        if (ip != null && ip.IsIPv4MappedToIPv6) ip = ip.MapToIPv4();
        return environment.IsDevelopment() && ip != null && IPAddress.IsLoopback(ip);
    }
    private static string Encode(string value) => WebUtility.HtmlEncode(value ?? string.Empty);
    private sealed class PlannedChange
    {
        public CustomTableItem Item { get; set; }
        public string NewUrl { get; set; }
    }
    public sealed class UpdateReport
    {
        public string Table => IpoCalendarSchema.TableClassName;
        public int Total { get; set; }
        public int ToUpdate { get; set; }
        public int Unchanged { get; set; }
        public int Updated { get; set; }
        public bool Applied { get; set; }
        public List<string> Errors { get; set; } = new List<string>();
        public List<ChangedRow> Changes { get; set; } = new List<ChangedRow>();
        public List<SkippedRow> Skipped { get; set; } = new List<SkippedRow>();
    }
    public sealed class ChangedRow
    {
        public int ItemId { get; set; }
        public string Before { get; set; }
        public string After { get; set; }
    }
    public sealed class SkippedRow
    {
        public int ItemId { get; set; }
        public string Url { get; set; }
        public string Reason { get; set; }
    }
}
