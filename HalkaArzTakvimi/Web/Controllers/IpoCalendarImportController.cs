#nullable disable
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using CMS.CustomTables;
using CMS.DataEngine;
using CMS.FormEngine;
using CMS.Helpers;
using CMS.MediaLibrary;
using CMS.SiteProvider;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using YkbYapikredi.Application.CustomTableFeeds;
using YkbYapikredi.Infrastructure.CustomTableFeeds;

namespace YkbYapikredi.Web.Controllers;

// Geçici local import aracı. GET kayıt yazmaz; POST antiforgery korumalıdır.
[Route("local-tools/ipo-calendar-import")]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public sealed class IpoCalendarImportController : Controller
{
    private static readonly object ImportLock = new object();
    private readonly IWebHostEnvironment environment;
    private readonly IAntiforgery antiforgery;
    private readonly ILogger<IpoCalendarImportController> logger;

    public IpoCalendarImportController(IWebHostEnvironment environment, IAntiforgery antiforgery,
        ILogger<IpoCalendarImportController> logger)
    {
        this.environment = environment;
        this.antiforgery = antiforgery;
        this.logger = logger;
    }

    [HttpGet]
    public IActionResult Index()
    {
        if (!IsLocalDevelopment()) return NotFound();
        var tokens = antiforgery.GetAndStoreTokens(HttpContext);
        var html = "<!doctype html><html lang=\"tr\"><meta charset=\"utf-8\">" +
            "<title>Halka Arz Takvimi aktarımı</title><body><h1>Halka Arz Takvimi aktarımı</h1>" +
            "<p>Tablo: " + Encode(IpoCalendarSchema.TableClassName) + " · Medya: " +
            Encode(IpoCalendarSchema.LibraryCodeName + "/" + IpoCalendarSchema.MediaFolder) + "</p>" +
            "<form method=\"post\" enctype=\"multipart/form-data\" action=\"" + Encode(Url.Action(nameof(Import))) + "\">" +
            "<input type=\"hidden\" name=\"" + Encode(tokens.FormFieldName) + "\" value=\"" + Encode(tokens.RequestToken) + "\">" +
            "<p><label>Site code name: <input required name=\"siteName\" value=\"" + Encode(SiteContext.CurrentSiteName) + "\"></label></p>" +
            "<p><input type=\"file\" name=\"json\" accept=\".json,application/json\" required></p>" +
            "<button name=\"apply\" value=\"false\">Ön kontrol</button> " +
            "<button name=\"apply\" value=\"true\">Aktar / Güncelle</button></form>" +
            "<p>Önce ön kontrol yapın. Aynı kayıt tekrar aktarılırsa yeni satır açılmaz; mevcut satır güncellenir.</p>" +
            "</body></html>";
        return Content(html, "text/html; charset=utf-8");
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<IActionResult> Import([FromForm] IFormFile json,
        [FromForm] string siteName, [FromForm] bool apply = false)
    {
        if (!IsLocalDevelopment()) return NotFound();
        if (!ModelState.IsValid || json == null || json.Length == 0 || json.Length > 10 * 1024 * 1024)
            return BadRequest(new { error = "halka-arz-takvimi.json dosyasını seçin; en fazla 10 MB." });
        List<ImportRow> rows;
        try
        {
            using (var reader = new StreamReader(json.OpenReadStream(), Encoding.UTF8, true))
                rows = JsonSerializer.Deserialize<List<ImportRow>>(await reader.ReadToEndAsync(),
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        }
        catch (JsonException error)
        { return BadRequest(new { error = "JSON kökü kayıt dizisi olmalı.", detail = error.Message }); }
        if (rows == null || rows.Count == 0 || rows.Count > 10000)
            return BadRequest(new { error = "JSON 1–10000 kayıt içermeli." });
        try
        {
            // Kentico transaction context'inde await/paralel DB işlemi yoktur.
            lock (ImportLock)
            {
                var report = BuildPlan(rows, Clean(siteName), out var plan);
                if (report.Errors.Count > 0) return UnprocessableEntity(report);
                if (!apply) return Ok(report);
                using (var transaction = new CMSTransactionScope())
                {
                    foreach (var row in plan)
                    {
                        var item = row.Existing ?? CustomTableItem.New(IpoCalendarSchema.TableClassName);
                        item.SetValue("StockCode", row.Source.StockCode);
                        item.SetValue("Title", row.Source.Title);
                        item.SetValue("Days", row.Source.Days);
                        item.SetValue("Month", row.Source.Month);
                        item.SetValue("Year", row.Source.Year);
                        // Media selection, GUID yerine Kentico'nun kalıcı medya URL'sini saklar.
                        item.SetValue("Image", row.MediaUrl);
                        item.SetValue("Url", row.Source.Url);
                        if (row.Existing == null) item.Insert();
                        else item.Update();
                    }
                    transaction.Commit();
                }
                report.Applied = true;
                return Ok(report);
            }
        }
        catch (Exception error)
        {
            logger.LogError(error, "Halka Arz Takvimi aktarımı başarısız.");
            return StatusCode(500, new { error = "Aktarım başarısız; transaction geri alınır. Sunucu logunu kontrol edin.", detail = error.Message });
        }
    }

    private ImportReport BuildPlan(List<ImportRow> rows, string siteName, out List<PlannedRow> plan)
    {
        plan = new List<PlannedRow>();
        var report = new ImportReport { Total = rows.Count, Site = siteName };
        var site = SiteInfoProvider.GetSiteInfo(siteName);
        if (site == null) { report.Errors.Add("Site code name bulunamadı: " + siteName); return report; }
        var table = DataClassInfoProvider.GetDataClassInfo(IpoCalendarSchema.TableClassName);
        if (table == null || !table.ClassIsCustomTable)
        { report.Errors.Add("Custom table bulunamadı: " + IpoCalendarSchema.TableClassName); return report; }
        var form = new FormInfo(table.ClassFormDefinition);
        foreach (var field in new[] { "StockCode", "Title", "Days", "Month", "Year", "Image", "Url" })
            if (form.GetFormField(field) == null) report.Errors.Add("Eksik alan: " + field);
        if (report.Errors.Count > 0) return report;
        var library = MediaLibraryInfoProvider.GetMediaLibraryInfo(IpoCalendarSchema.LibraryCodeName, site.SiteID);
        if (library == null)
        { report.Errors.Add("Medya kütüphanesi code name bulunamadı: " + IpoCalendarSchema.LibraryCodeName); return report; }
        var media = MediaFileInfoProvider.GetMediaFiles().WhereEquals("FileLibraryID", library.LibraryID)
            .ToArray().Where(file => string.Equals(Parent(file.FilePath), IpoCalendarSchema.MediaFolder, StringComparison.OrdinalIgnoreCase))
            .GroupBy(file => Leaf(file.FilePath), StringComparer.OrdinalIgnoreCase)
            .ToDictionary(group => group.Key, group => group.ToArray(), StringComparer.OrdinalIgnoreCase);
        var existing = CustomTableItemProvider.GetItems(IpoCalendarSchema.TableClassName).ToArray()
            .GroupBy(item => Key(Text(item, "StockCode"), ValidationHelper.GetInteger(item.GetValue("Year"), 0),
                ValidationHelper.GetInteger(item.GetValue("Month"), 0), Text(item, "Days")), StringComparer.OrdinalIgnoreCase)
            .ToDictionary(group => group.Key, group => group.ToArray(), StringComparer.OrdinalIgnoreCase);
        var inputKeys = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        for (var index = 0; index < rows.Count; index++)
        {
            var row = rows[index];
            var prefix = "Satır " + (index + 1) + ": ";
            if (row == null) { report.Errors.Add(prefix + "null kayıt."); continue; }
            row.StockCode = Clean(row.StockCode);
            row.Title = Clean(row.Title);
            row.ImageFileName = Clean(row.ImageFileName);
            row.Url = Clean(row.Url);
            var before = report.Errors.Count;
            if (!Regex.IsMatch(row.StockCode, @"^[A-Za-z0-9._-]{1,50}$")) report.Errors.Add(prefix + "StockCode geçersiz.");
            if (row.Title.Length == 0 || row.Title.Length > 1000) report.Errors.Add(prefix + "Title 1–1000 karakter olmalı.");
            if (row.Url.Length > 2000 || !ValidUrl(row.Url)) report.Errors.Add(prefix + "Url geçersiz.");
            if (!IpoCalendarDates.TryNormalize(row.Days, row.Month, row.Year,
                out var days, out var displayDate, out _, out var error)) report.Errors.Add(prefix + error);
            else row.Days = days;
            if (days.Length > 100) report.Errors.Add(prefix + "Days alan uzunluğu aşılıyor.");
            var key = Key(row.StockCode, row.Year, row.Month, row.Days);
            if (!inputKeys.Add(key)) report.Errors.Add(prefix + "JSON'da tekrarlanan kayıt: " + key);
            existing.TryGetValue(key, out var matches);
            if (matches != null && matches.Length != 1) report.Errors.Add(prefix + "Tabloda aynı anahtarlı birden fazla kayıt var: " + key);
            string mediaUrl = null;
            if (row.ImageFileName.Length == 0 || row.ImageFileName.IndexOfAny(new[] { '/', '\\' }) >= 0)
                report.Errors.Add(prefix + "ImageFileName yalnızca dosya adı olmalı.");
            else if (!media.TryGetValue(row.ImageFileName, out var files) || files.Length != 1)
                report.Errors.Add(prefix + "Tekil medya bulunamadı: " + IpoCalendarSchema.MediaFolder + "/" + row.ImageFileName);
            else
            {
                mediaUrl = MediaFileURLProvider.GetMediaFileUrl(files[0].FileGUID, Leaf(files[0].FilePath));
                if (string.IsNullOrWhiteSpace(mediaUrl) || mediaUrl.Length > 1000)
                    report.Errors.Add(prefix + "Kalıcı medya URL'si üretilemedi veya 1000 karakteri aşıyor.");
            }
            if (report.Errors.Count != before) continue;
            plan.Add(new PlannedRow { Source = row, Existing = matches == null ? null : matches[0],
                MediaUrl = mediaUrl, DisplayDate = displayDate });
        }
        report.ToInsert = plan.Count(row => row.Existing == null);
        report.ToUpdate = plan.Count - report.ToInsert;
        report.Samples = plan.Take(5).Select(row => new ImportSample
        {
            StockCode = row.Source.StockCode, Days = row.Source.Days,
            DisplayDate = row.DisplayDate, Image = row.MediaUrl
        }).ToList();
        return report;
    }

    private bool IsLocalDevelopment()
    {
        var ip = HttpContext.Connection.RemoteIpAddress;
        if (ip != null && ip.IsIPv4MappedToIPv6) ip = ip.MapToIPv4();
        return environment.IsDevelopment() && ip != null && IPAddress.IsLoopback(ip);
    }
    private static bool ValidUrl(string value)
    {
        if (value.IndexOf('\\') >= 0 || value.Any(char.IsControl)) return false;
        return value.StartsWith("~/", StringComparison.Ordinal) ||
            (value.StartsWith("/", StringComparison.Ordinal) && !value.StartsWith("//", StringComparison.Ordinal)) ||
            (Uri.TryCreate(value, UriKind.Absolute, out var uri) && (uri.Scheme == "https" || uri.Scheme == "http"));
    }
    private static string Key(string code, int year, int month, string days) =>
        Clean(code).ToUpperInvariant() + "|" + year + "|" + month + "|" +
        string.Join(" ", Regex.Matches(days ?? string.Empty, @"\d+").Cast<Match>()
            .Select(match => ValidationHelper.GetInteger(match.Value, -1).ToString()));
    private static string Text(CustomTableItem item, string field) => ValidationHelper.GetString(item.GetValue(field), string.Empty);
    private static string Clean(string value) => (value ?? string.Empty).Trim().Normalize(NormalizationForm.FormC);
    private static string Encode(string value) => WebUtility.HtmlEncode(value ?? string.Empty);
    private static string NormalizePath(string value) => (value ?? string.Empty).Replace('\\', '/').Trim('/');
    private static string Leaf(string path) { var value = NormalizePath(path); return value.Substring(value.LastIndexOf('/') + 1); }
    private static string Parent(string path) { var value = NormalizePath(path); var slash = value.LastIndexOf('/'); return slash < 0 ? "" : value.Substring(0, slash); }

    public sealed class ImportRow
    {
        public string StockCode { get; set; }
        public string Title { get; set; }
        public string Days { get; set; }
        public int Month { get; set; }
        public int Year { get; set; }
        public string ImageFileName { get; set; }
        public string Url { get; set; }
    }
    private sealed class PlannedRow
    {
        public ImportRow Source { get; set; }
        public CustomTableItem Existing { get; set; }
        public string MediaUrl { get; set; }
        public string DisplayDate { get; set; }
    }
    public sealed class ImportReport
    {
        public string Table => IpoCalendarSchema.TableClassName;
        public string Site { get; set; }
        public int Total { get; set; }
        public int ToInsert { get; set; }
        public int ToUpdate { get; set; }
        public bool Applied { get; set; }
        public List<string> Errors { get; set; } = new List<string>();
        public List<ImportSample> Samples { get; set; } = new List<ImportSample>();
    }
    public sealed class ImportSample
    {
        public string StockCode { get; set; }
        public string Days { get; set; }
        public string DisplayDate { get; set; }
        public string Image { get; set; }
    }
}
